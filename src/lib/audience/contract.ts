// Only these approved aggregate fields can cross the public website boundary.
export const platforms = ["instagram", "facebook", "youtube", "tiktok"] as const;
export type Platform = (typeof platforms)[number];
export const metricNames = ["followers", "subscribers", "views", "reach", "impressions", "interactions"] as const;
export type MetricName = (typeof metricNames)[number];

export interface ReportingPeriod {
  start: string;
  end: string;
}
export interface AudienceMetric {
  name: MetricName;
  value: number;
  sourceMetric: string;
  timeframe?: "lifetime";
  period?: ReportingPeriod;
}
export interface TopContent {
  projectId?: string;
  id?: string;
  title?: string;
  platformUrl?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  metric: AudienceMetric;
}
export interface CountryFollowers {
  countryCode: string;
  followers: number;
}
export interface PlatformSnapshot {
  platform: Platform;
  syncedAt: string;
  metrics: AudienceMetric[];
  topContent: TopContent[];
  rankingScope?: "recent50";
  countryFollowers?: CountryFollowers[];
}
export interface AudienceSnapshot {
  version: 1;
  brand: "inside-the-machine";
  approvedForPublic: true;
  platforms: PlatformSnapshot[];
}

export const metricLabels: Record<MetricName, string> = {
  followers: "Followers",
  subscribers: "Subscribers",
  views: "Views",
  reach: "Accounts reached",
  impressions: "Impressions",
  interactions: "Content interactions",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const countryNames = new Intl.DisplayNames("en-GB", { type: "region", fallback: "none" });

export function countryName(code: string): string | undefined {
  if (!/^[A-Z]{2}$/.test(code) || code === "ZZ") return;
  return countryNames.of(code);
}

export function rankCountryFollowers(rows: readonly unknown[]): CountryFollowers[] {
  const ranked: CountryFollowers[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const { countryCode, followers } = row;
    if (typeof countryCode !== "string" || !countryName(countryCode) || seen.has(countryCode) ||
        typeof followers !== "number" || !Number.isSafeInteger(followers) || followers <= 0) continue;
    seen.add(countryCode);
    ranked.push({ countryCode, followers });
  }
  return ranked.sort((a, b) => b.followers - a.followers || a.countryCode.localeCompare(b.countryCode));
}

export function totalFollowersForCountryShares(snapshot: PlatformSnapshot): number | undefined {
  const totalFollowers = snapshot.metrics.find((metric) => metric.name === "followers")?.value;
  if (!totalFollowers) return;

  // Demographics can lag the account total. Keep counts if the snapshots disagree.
  const reportedFollowers = snapshot.countryFollowers?.reduce((sum, country) => sum + country.followers, 0) ?? 0;
  return reportedFollowers <= totalFollowers ? totalFollowers : undefined;
}
function requireValid(condition: unknown): asserts condition {
  if (!condition) throw new Error("Invalid public audience snapshot");
}
function isMember<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}
function timestamp(value: unknown, now: number): string {
  requireValid(typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value));
  const time = Date.parse(value);
  requireValid(Number.isFinite(time) && time > 0 && time <= now + 300_000);
  requireValid(new Date(time).toISOString().slice(0, 19) === value.slice(0, 19));
  return new Date(time).toISOString();
}
function metric(value: unknown, platform: Platform, syncedAt: string, now: number, video = false): AudienceMetric {
  requireValid(isRecord(value) && isMember(value.name, metricNames));
  requireValid(typeof value.value === "number" && Number.isSafeInteger(value.value) && value.value >= 0);
  requireValid(typeof value.sourceMetric === "string" && /^[a-zA-Z0-9_.:]{1,100}$/.test(value.sourceMetric));
  requireValid(value.name !== "subscribers" || platform === "youtube");
  requireValid(value.name !== "followers" || platform !== "youtube");
  const accountTotal = value.name === "followers" || value.name === "subscribers";
  if (value.timeframe !== undefined) {
    const lifetimeSource = video ? videoSources[platform] : platform === "youtube" ? "youtube.channel.viewCount" : undefined;
    requireValid(value.timeframe === "lifetime" && value.name === "views" && value.sourceMetric === lifetimeSource &&
      value.period === undefined);
    return {
      name: value.name, value: value.value, sourceMetric: value.sourceMetric,
      timeframe: "lifetime",
    };
  }
  let period: ReportingPeriod | undefined;
  if (accountTotal) {
    requireValid(value.period === undefined);
  } else {
    requireValid(isRecord(value.period));
    const start = timestamp(value.period.start, now);
    const end = timestamp(value.period.end, now);
    requireValid(Date.parse(start) < Date.parse(end) && Date.parse(end) <= Date.parse(syncedAt));
    period = { start, end };
  }
  return { name: value.name, value: value.value, sourceMetric: value.sourceMetric, ...(period ? { period } : {}) };
}

const videoSources: Partial<Record<Platform, string>> = {
  instagram: "instagram.media.views", facebook: "post_media_view", youtube: "youtube.video.viewCount",
};

const publicLinks: Partial<Record<Platform, RegExp>> = {
  instagram: /^https:\/\/www\.instagram\.com\/(?:p|reel)\/[\w-]+\/?$/,
  facebook: /^https:\/\/www\.facebook\.com\/reel\/\d+\/?$/,
  youtube: /^https:\/\/www\.youtube\.com\/(?:watch\?v=|shorts\/)[\w-]{11}$/,
};

function thumbnailUrl(value: unknown, platform: Platform): string | undefined {
  if (typeof value !== "string" || value.length > 4096) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        [...url.searchParams.keys()].some(key => /access.token|oauth|secret|api.key/i.test(key))) return;
    if (platform === "youtube" && url.hostname === "i.ytimg.com" ||
        platform === "facebook" && url.hostname.endsWith(".fbcdn.net") ||
        platform === "instagram" && (url.hostname.endsWith(".cdninstagram.com") || url.hostname.endsWith(".fbcdn.net"))) return url.href;
  } catch { /* An unusable thumbnail is optional. */ }
}

export function parseAudienceSnapshot(value: unknown, now = Date.now()): AudienceSnapshot {
  requireValid(isRecord(value) && value.version === 1 && value.brand === "inside-the-machine" && value.approvedForPublic === true);
  requireValid(Array.isArray(value.platforms) && value.platforms.length > 0 && value.platforms.length <= platforms.length);
  const seenPlatforms = new Set<Platform>();
  const parsed = value.platforms.map((entry): PlatformSnapshot => {
    requireValid(isRecord(entry) && isMember(entry.platform, platforms) && !seenPlatforms.has(entry.platform));
    seenPlatforms.add(entry.platform);
    const platform = entry.platform;
    const syncedAt = timestamp(entry.syncedAt, now);
    requireValid(Array.isArray(entry.metrics) && entry.metrics.length > 0 && entry.metrics.length <= metricNames.length);
    const metrics = entry.metrics.map((item) => metric(item, platform, syncedAt, now));
    requireValid(new Set(metrics.map((item) => item.name)).size === metrics.length);
    requireValid(entry.topContent === undefined || (Array.isArray(entry.topContent) && entry.topContent.length <= 5));
    const topContent: TopContent[] = (entry.topContent ?? []).map((item: unknown) => {
      requireValid(isRecord(item));
      const projectId = item.projectId;
      requireValid(projectId === undefined || typeof projectId === "string" && /^[a-z0-9-]{1,80}$/.test(projectId));
      const topMetric = metric(item.metric, platform, syncedAt, now, true);
      requireValid(topMetric.name !== "followers" && topMetric.name !== "subscribers");
      if (!item.id) {
        requireValid(typeof projectId === "string");
        return { projectId, metric: topMetric };
      }
      requireValid(typeof item.id === "string" && /^[\w-]{1,100}$/.test(item.id));
      requireValid(typeof item.title === "string" && !!item.title.trim() && item.title.length <= 180);
      requireValid(typeof item.platformUrl === "string" && publicLinks[platform]?.test(item.platformUrl));
      return { id: item.id, projectId, title: item.title.trim(), platformUrl: item.platformUrl,
        thumbnailUrl: thumbnailUrl(item.thumbnailUrl, platform),
        publishedAt: item.publishedAt === undefined ? undefined : timestamp(item.publishedAt, now),
        metric: topMetric };
    });
    const countryFollowers = (platform === "instagram" || platform === "facebook") && Array.isArray(entry.countryFollowers)
      ? rankCountryFollowers(entry.countryFollowers)
      : [];
    return {
      platform, syncedAt, metrics, topContent,
      ...(entry.rankingScope === "recent50" ? { rankingScope: "recent50" as const } : {}),
      ...(countryFollowers.length ? { countryFollowers } : {}),
    };
  });
  return { version: 1, brand: "inside-the-machine", approvedForPublic: true, platforms: parsed };
}

export function isStale(snapshot: PlatformSnapshot, now = Date.now()): boolean {
  return now - Date.parse(snapshot.syncedAt) > 2 * 60 * 60 * 1000;
}
