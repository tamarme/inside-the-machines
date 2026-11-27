import { rankCountryFollowers, type AudienceMetric, type CountryFollowers, type PlatformSnapshot, type ReportingPeriod, type TopContent } from "./contract";

export interface MetaConfig {
  pageId: string;
  instagramId: string;
  token: string;
  version: string;
  instagramUsername: string;
}

type MetaPlatform = "instagram" | "facebook";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function count(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function failure(): never {
  throw new Error("Audience provider unavailable");
}

async function graphRead(
  config: MetaConfig,
  path: string,
  parameters: Record<string, string>,
  fetcher: typeof fetch,
): Promise<Record<string, unknown>> {
  const url = new URL(`https://graph.facebook.com/${config.version}/${path}`);
  url.search = new URLSearchParams(parameters).toString();
  const response = await fetcher(url, {
    headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json") || !response.body) {
    await response.body?.cancel();
    return failure();
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128 * 1024) return failure();
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const data: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!record(data) || data.error) return failure();
  return data;
}

// No daily reach summation: unique accounts must be aggregated by the provider.
export function instagramTotal(
  data: Record<string, unknown>,
  sourceMetric: string,
  name: AudienceMetric["name"],
  period: ReportingPeriod,
): AudienceMetric | null {
  if (!Array.isArray(data.data)) return null;
  const item = data.data.find((item: unknown) => record(item) && item.name === sourceMetric);
  if (!record(item) || item.period !== "day" || !record(item.total_value) || !count(item.total_value.value)) return null;
  return { name, sourceMetric, value: item.total_value.value, period };
}

// A days_28 value is one rolling window, never the sum of overlapping windows.
export function facebookWindow(
  data: Record<string, unknown>,
  sourceMetric: string,
  name: AudienceMetric["name"],
  now: number,
): AudienceMetric | null {
  if (!Array.isArray(data.data)) return null;
  const item = data.data.find((item: unknown) => record(item) && item.name === sourceMetric && item.period === "days_28");
  if (!record(item) || !Array.isArray(item.values)) return null;
  const points = item.values.flatMap((point: unknown) => {
    if (!record(point) || !count(point.value) || typeof point.end_time !== "string") return [];
    const end = Date.parse(point.end_time);
    return Number.isFinite(end) && end <= now && end > now - 7 * 86400_000
      ? [{ value: point.value, end }] : [];
  }).sort((first, second) => second.end - first.end);
  const latest = points[0];
  if (!latest) return null;
  return {
    name,
    sourceMetric,
    value: latest.value,
    period: { start: new Date(latest.end - 28 * 86400_000).toISOString(), end: new Date(latest.end).toISOString() },
  };
}

async function metaCountryFollowers(
  config: MetaConfig,
  platform: MetaPlatform,
  fetcher: typeof fetch,
  now: number,
): Promise<CountryFollowers[]> {
  if (platform === "instagram") {
    const data = await graphRead(config, `${config.instagramId}/insights`, {
      metric: "follower_demographics", period: "lifetime", metric_type: "total_value",
      breakdown: "country", timeframe: "this_month",
    }, fetcher);
    if (!Array.isArray(data.data)) return [];
    const report = data.data.find((item: unknown) => record(item) && item.name === "follower_demographics" && item.period === "lifetime");
    if (!record(report) || !record(report.total_value) || !Array.isArray(report.total_value.breakdowns)) return [];
    const breakdown = report.total_value.breakdowns.find((item: unknown) =>
      record(item) && Array.isArray(item.dimension_keys) && item.dimension_keys.length === 1 && item.dimension_keys[0] === "country");
    if (!record(breakdown) || !Array.isArray(breakdown.results)) return [];
    return rankCountryFollowers(breakdown.results.flatMap((row: unknown) =>
      record(row) && Array.isArray(row.dimension_values) && row.dimension_values.length === 1
        ? [{ countryCode: row.dimension_values[0], followers: row.value }]
        : []));
  }

  const data = await graphRead(config, `${config.pageId}/insights`, {
    metric: "page_follows_country", period: "day",
    since: String(Math.floor((now - 7 * 86400_000) / 1000)), until: String(Math.floor(now / 1000)),
  }, fetcher);
  if (!Array.isArray(data.data)) return [];
  const report = data.data.find((item: unknown) => record(item) && item.name === "page_follows_country" && item.period === "day");
  if (!record(report) || !Array.isArray(report.values)) return [];
  // Each point is a snapshot of followers by country. Use the newest available point as a whole.
  const latest = report.values.flatMap((point: unknown) => {
    if (!record(point) || !record(point.value) || typeof point.end_time !== "string") return [];
    const end = Date.parse(point.end_time);
    return end <= now && end > now - 7 * 86400_000 ? [{ end, value: point.value }] : [];
  }).sort((a, b) => b.end - a.end)[0];
  return latest ? rankCountryFollowers(Object.entries(latest.value).map(([countryCode, followers]) => ({ countryCode, followers }))) : [];
}

async function topMetaVideos(config: MetaConfig, platform: MetaPlatform, fetcher: typeof fetch): Promise<TopContent[]> {
  const instagram = platform === "instagram";
  const edge = instagram ? config.instagramId + "/media" : config.pageId + "/published_posts";
  const fields = instagram
    ? "id,media_type,caption,permalink,thumbnail_url,insights.metric(views){name,period,values}"
    : "id,message,permalink_url,privacy,full_picture,insights.metric(post_media_view){name,period,values}";
  const source = instagram ? "views" : "post_media_view";
  const videos: TopContent[] = [];
  let after: string | undefined;
  // Keep the comparison set bounded and named on the page. Never follow provider paging URLs.
  for (let page = 0; page < 2; page++) {
    const data = await graphRead(config, edge, { fields, limit: "25", ...(after ? { after } : {}) }, fetcher);
    if (!Array.isArray(data.data)) return [];
    for (const row of data.data) {
      if (!record(row) || typeof row.id !== "string" || !/^[\w-]{1,100}$/.test(row.id)) continue;
      if (instagram ? row.media_type !== "VIDEO" : !record(row.privacy) || row.privacy.value !== "EVERYONE") continue;
      const platformUrl = instagram ? row.permalink : row.permalink_url;
      const validLink = instagram ? /^https:\/\/www\.instagram\.com\/(?:p|reel)\/[\w-]+\/?$/ : /^https:\/\/www\.facebook\.com\/reel\/\d+\/?$/;
      if (typeof platformUrl !== "string" || !validLink.test(platformUrl)) continue;
      const caption = instagram ? row.caption : row.message;
      const title = typeof caption === "string" ? caption.trim().split(/\r?\n/)[0].slice(0, 160).trim() : "";
      if (!title || !record(row.insights) || !Array.isArray(row.insights.data)) continue;
      const insight = row.insights.data.find((v: unknown) => record(v) && v.name === source && v.period === "lifetime");
      if (!record(insight) || !Array.isArray(insight.values) || insight.values.length !== 1) continue;
      const point: unknown = insight.values[0];
      if (!record(point) || !count(point.value) || videos.some(video => video.id === row.id)) continue;
      const thumbnail = instagram ? row.thumbnail_url : row.full_picture;
      videos.push({ id: row.id, title, platformUrl, thumbnailUrl: typeof thumbnail === "string" ? thumbnail : undefined,
        metric: { name: "views", value: point.value, timeframe: "lifetime", sourceMetric: instagram ? "instagram.media.views" : source } });
    }
    if (!record(data.paging) || !data.paging.next) break;
    if (!record(data.paging.cursors) || typeof data.paging.cursors.after !== "string") return [];
    after = data.paging.cursors.after;
  }
  return videos.sort((a, b) => b.metric.value - a.metric.value).slice(0, 5);
}

export async function collectMetaPlatform(
  config: MetaConfig,
  platform: MetaPlatform,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<PlatformSnapshot> {
  if (!/^\d+$/.test(config.pageId) || !/^\d+$/.test(config.instagramId) ||
      !/^v\d+\.\d+$/.test(config.version) || !config.token ||
      !/^[a-zA-Z0-9_.]{1,30}$/.test(config.instagramUsername)) return failure();

  // The Page-to-Instagram relationship and username must both match the configured brand.
  const page = await graphRead(config, config.pageId, { fields: "id,instagram_business_account" }, fetcher);
  if (page.id !== config.pageId || !record(page.instagram_business_account) ||
      page.instagram_business_account.id !== config.instagramId) return failure();
  const instagram = await graphRead(config, config.instagramId, { fields: "id,username" }, fetcher);
  if (instagram.id !== config.instagramId || typeof instagram.username !== "string" ||
      instagram.username.toLowerCase() !== config.instagramUsername.toLowerCase()) return failure();

  const accountId = platform === "instagram" ? config.instagramId : config.pageId;
  const metrics: AudienceMetric[] = [];
  try {
    const account = await graphRead(config, accountId, { fields: "id,followers_count" }, fetcher);
    if (account.id === accountId && count(account.followers_count)) {
      metrics.push({ name: "followers", value: account.followers_count, sourceMetric: "followers_count" });
    }
  } catch { /* Insight availability is independent of follower-count access. */ }

  if (platform === "instagram") {
    const end = Math.floor(now / 86400_000) * 86400_000;
    const period = { start: new Date(end - 30 * 86400_000).toISOString(), end: new Date(end).toISOString() };
    const definitions = [
      ["views", "views"],
      ["reach", "reach"],
      ["total_interactions", "interactions"],
    ] as const;
    const results = await Promise.all(definitions.map(async ([sourceMetric, name]) => {
      try {
        const data = await graphRead(config, `${accountId}/insights`, {
          metric: sourceMetric, period: "day", metric_type: "total_value",
          since: String((end - 30 * 86400_000) / 1000), until: String(end / 1000),
        }, fetcher);
        return instagramTotal(data, sourceMetric, name, period);
      } catch { return null; }
    }));
    metrics.push(...results.filter((metric): metric is AudienceMetric => metric !== null));
  } else {
    const definitions = [
      ["page_media_view", "views"],
      ["page_post_engagements", "interactions"],
    ] as const;
    const results = await Promise.all(definitions.map(async ([sourceMetric, name]) => {
      try {
        const data = await graphRead(config, `${accountId}/insights`, {
          metric: sourceMetric, period: "days_28",
          since: String(Math.floor((now - 4 * 86400_000) / 1000)),
          until: String(Math.floor(now / 1000)),
        }, fetcher);
        return facebookWindow(data, sourceMetric, name, now);
      } catch { return null; }
    }));
    metrics.push(...results.filter((metric): metric is AudienceMetric => metric !== null));
  }
  if (metrics.length === 0) return failure();
  const [topContent, countryFollowers] = await Promise.all([
    topMetaVideos(config, platform, fetcher).catch(() => []),
    metaCountryFollowers(config, platform, fetcher, now).catch(() => []),
  ]);
  return { platform, syncedAt: new Date(now).toISOString(), metrics, topContent, rankingScope: "recent50", countryFollowers };
}
