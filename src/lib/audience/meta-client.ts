import type { AudienceMetric, PlatformSnapshot, ReportingPeriod } from "./contract";

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
  return { platform, syncedAt: new Date(now).toISOString(), metrics, topContent: [] };
}
