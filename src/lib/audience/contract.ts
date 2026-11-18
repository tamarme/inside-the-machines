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
  period?: ReportingPeriod;
}
export interface TopContent {
  projectId: string;
  metric: AudienceMetric;
}
export interface PlatformSnapshot {
  platform: Platform;
  syncedAt: string;
  metrics: AudienceMetric[];
  topContent: TopContent[];
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
function metric(value: unknown, platform: Platform, syncedAt: string, now: number): AudienceMetric {
  requireValid(isRecord(value) && isMember(value.name, metricNames));
  requireValid(typeof value.value === "number" && Number.isSafeInteger(value.value) && value.value >= 0);
  requireValid(typeof value.sourceMetric === "string" && /^[a-zA-Z0-9_.:]{1,100}$/.test(value.sourceMetric));
  requireValid(value.name !== "subscribers" || platform === "youtube");
  requireValid(value.name !== "followers" || platform !== "youtube");
  const accountTotal = value.name === "followers" || value.name === "subscribers";
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
    requireValid(entry.topContent === undefined || (Array.isArray(entry.topContent) && entry.topContent.length <= 3));
    const topContent: TopContent[] = (entry.topContent ?? []).map((item: unknown) => {
      requireValid(isRecord(item) && typeof item.projectId === "string" && /^[a-z0-9-]{1,80}$/.test(item.projectId));
      const topMetric = metric(item.metric, platform, syncedAt, now);
      requireValid(topMetric.name !== "followers" && topMetric.name !== "subscribers");
      return { projectId: item.projectId, metric: topMetric };
    });
    return { platform, syncedAt, metrics, topContent };
  });
  return { version: 1, brand: "inside-the-machine", approvedForPublic: true, platforms: parsed };
}

export function isStale(snapshot: PlatformSnapshot, now = Date.now()): boolean {
  return now - Date.parse(snapshot.syncedAt) > 2 * 60 * 60 * 1000;
}
