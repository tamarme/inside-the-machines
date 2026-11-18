import type { AudienceMetric, PlatformSnapshot, TopContent } from "./contract";

export interface YouTubeConfig {
  clientId: string;
  clientSecret: string;
  channelId: string;
  refreshToken: string;
  handle: string;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(): never {
  throw new Error("YouTube audience source unavailable");
}

function publicCount(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  if (!response.ok || !response.body ||
      !response.headers.get("content-type")?.includes("application/json")) {
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

async function topChannelVideos(playlist: string, channelId: string, accessToken: string, fetcher: typeof fetch): Promise<TopContent[]> {
  async function list(resource: string, params: Record<string, string>) {
    const url = new URL("https://www.googleapis.com/youtube/v3/" + resource);
    url.search = new URLSearchParams(params).toString();
    const data = await readJson(await fetcher(url, {
      headers: { Authorization: "Bearer " + accessToken, Accept: "application/json" },
      redirect: "error", cache: "no-store", signal: AbortSignal.timeout(5000),
    }));
    return Array.isArray(data.items) ? data.items.filter(record) : [];
  }
  const uploads = await list("playlistItems", { part: "contentDetails", playlistId: playlist, maxResults: "50", fields: "items(contentDetails/videoId)" });
  const ids = uploads.flatMap(row => record(row.contentDetails) && typeof row.contentDetails.videoId === "string" &&
    /^[\w-]{11}$/.test(row.contentDetails.videoId) ? [row.contentDetails.videoId] : []);
  if (!ids.length) return [];
  const items = await list("videos", { part: "snippet,statistics,status", id: ids.join(","),
    fields: "items(id,snippet(channelId,title,thumbnails/medium/url),statistics/viewCount,status/privacyStatus)" });
  const videos: TopContent[] = [];
  for (const row of items) {
    if (!record(row.status) || row.status.privacyStatus !== "public" || !record(row.snippet) ||
        row.snippet.channelId !== channelId || typeof row.id !== "string" || !ids.includes(row.id) ||
        typeof row.snippet.title !== "string" || !row.snippet.title.trim() || !record(row.statistics)) continue;
    const views = publicCount(row.statistics.viewCount);
    if (views === null) continue;
    const thumbs = row.snippet.thumbnails;
    const thumbnail = record(thumbs) && record(thumbs.medium) ? thumbs.medium.url : undefined;
    videos.push({ id: row.id, title: row.snippet.title.slice(0, 180), platformUrl: "https://www.youtube.com/watch?v=" + row.id,
      thumbnailUrl: typeof thumbnail === "string" ? thumbnail : undefined,
      metric: { name: "views", sourceMetric: "youtube.video.viewCount", timeframe: "lifetime", value: views } });
  }
  return videos.sort((a, b) => b.metric.value - a.metric.value).slice(0, 5);
}

export async function collectYouTubeAudience(
  config: YouTubeConfig,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<PlatformSnapshot> {
  if (!/^UC[A-Za-z0-9_-]{22}$/.test(config.channelId) ||
      !config.clientId || !config.clientSecret || !config.refreshToken ||
      !/^@[A-Za-z0-9_.-]+$/.test(config.handle)) return failure();

  // Renew only the owner's existing authorization. Never request extra scopes or persist tokens.
  const token = await readJson(await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  }));
  if (typeof token.access_token !== "string" || !token.access_token) return failure();

  // mine=true verifies the refresh token belongs to the intended channel.
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.search = new URLSearchParams({
    part: "id,snippet,statistics,contentDetails",
    mine: "true",
    fields: "items(id,contentDetails/relatedPlaylists/uploads,snippet(customUrl),statistics(subscriberCount,hiddenSubscriberCount,viewCount))",
  }).toString();
  const data = await readJson(await fetcher(url, {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  }));
  if (!Array.isArray(data.items)) return failure();
  const channel = data.items.find((item: unknown) => record(item) && item.id === config.channelId);
  if (!record(channel) || !record(channel.snippet) || !record(channel.statistics) ||
      typeof channel.snippet.customUrl !== "string" ||
      channel.snippet.customUrl.toLowerCase() !== config.handle.toLowerCase()) return failure();

  const metrics: AudienceMetric[] = [];
  const subscribers = publicCount(channel.statistics.subscriberCount);
  if (channel.statistics.hiddenSubscriberCount === false && subscribers !== null) {
    metrics.push({
      name: "subscribers", value: subscribers, sourceMetric: "youtube.channel.subscriberCount",
    });
  }
  const views = publicCount(channel.statistics.viewCount);
  if (views !== null) {
    // This counter is lifetime, not a 30-day report or a unique audience count.
    metrics.push({
      name: "views", value: views, sourceMetric: "youtube.channel.viewCount", timeframe: "lifetime",
    });
  }
  if (metrics.length === 0) return failure();
  const details = channel.contentDetails;
  const playlist = record(details) && record(details.relatedPlaylists) ? details.relatedPlaylists.uploads : undefined;
  const topContent = typeof playlist === "string"
    ? await topChannelVideos(playlist, config.channelId, token.access_token, fetcher).catch(() => [])
    : [];
  return { platform: "youtube", syncedAt: new Date(now).toISOString(), metrics, topContent, rankingScope: "recent50" };
}
