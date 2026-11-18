import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { siteConfig } from "@/config/site";
import { collectMetaPlatform, type MetaConfig } from "./meta-client";
import { parseAudienceSnapshot, type AudienceSnapshot } from "./contract";
import { withProviderBackoff } from "./provider-request";

export async function getMetaAudience(): Promise<AudienceSnapshot | null> {
  const pageId = process.env.META_INSIDE_THE_MACHINE_PAGE_ID;
  const instagramId = process.env.META_INSIDE_THE_MACHINE_INSTAGRAM_ID;
  const token = process.env.META_INSIDE_THE_MACHINE_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION;
  const instagramLink = siteConfig.socialLinks.find((link) => link.platform === "instagram");
  if (!pageId || !instagramId || !token || !version || !instagramLink) return null;
  const instagramUsername = new URL(instagramLink.href).pathname.split("/").filter(Boolean)[0];
  const config: MetaConfig = { pageId, instagramId, token, version, instagramUsername };
  const identity = createHash("sha256")
    .update(JSON.stringify(config)).digest("hex");

  const results = await Promise.allSettled((["instagram", "facebook"] as const).map((platform) => {
    const collect = unstable_cache(
      async () => {
        const data = await withProviderBackoff(`meta-${identity}-${platform}`, () => collectMetaPlatform(config, platform));
        // Cache only normalized public aggregates after validating them.
        return parseAudienceSnapshot({
          version: 1, brand: "inside-the-machine", approvedForPublic: true, platforms: [data],
        }).platforms[0];
      },
      ["meta-public-audience-v1", identity, platform],
      { revalidate: 3600, tags: ["public-audience"] },
    );
    return collect();
  }));
  const snapshots = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  return snapshots.length > 0
    ? { version: 1, brand: "inside-the-machine", approvedForPublic: true, platforms: snapshots }
    : null;
}
