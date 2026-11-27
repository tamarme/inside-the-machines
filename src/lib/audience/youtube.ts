import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { siteConfig } from "@/config/site";
import { collectYouTubeAudience, type YouTubeConfig } from "./youtube-client";
import { parseAudienceSnapshot, type PlatformSnapshot } from "./contract";
import { withProviderBackoff } from "./provider-request";

export async function getYouTubeAudience(): Promise<PlatformSnapshot | null> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const channelId = process.env.YOUTUBE_INSIDE_THE_MACHINE_CHANNEL_ID;
  const refreshToken = process.env.YOUTUBE_INSIDE_THE_MACHINE_REFRESH_TOKEN;
  const socialLink = siteConfig.socialLinks.find((link) => link.platform === "youtube");
  if (!channelId || !socialLink) return null;

  try {
    const handle = new URL(socialLink.href).pathname.split("/").filter(Boolean)[0];
    const config: YouTubeConfig | null = apiKey
      ? { apiKey, channelId, handle }
      : clientId && clientSecret && refreshToken
        ? { clientId, clientSecret, channelId, refreshToken, handle }
        : null;
    if (!config) return null;
    const identity = createHash("sha256").update(JSON.stringify(config)).digest("hex");
    const collect = unstable_cache(
      async () => {
        const snapshot = await withProviderBackoff(`youtube-${identity}`, () =>
          collectYouTubeAudience(config));
        // Only verified aggregate data enters the cache; access tokens stay in the collector.
        return parseAudienceSnapshot({
          version: 1, brand: "inside-the-machine", approvedForPublic: true, platforms: [snapshot],
        }).platforms[0];
      },
      ["youtube-public-audience-v1", identity],
      { revalidate: 3600, tags: ["public-audience"] },
    );
    return await collect();
  } catch {
    return null;
  }
}

