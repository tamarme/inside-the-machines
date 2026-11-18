import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { parseAudienceSnapshot, type AudienceSnapshot } from "./contract";
import { getMetaAudience } from "./meta";
import { getYouTubeAudience } from "./youtube";
import { withProviderBackoff } from "./provider-request";

export interface AudienceResult {
  snapshot: AudienceSnapshot | null;
}

const maximumBytes = 128 * 1024;

async function readLimitedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("Missing metrics response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) throw new Error("Metrics response too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

export async function getAudienceInsights(): Promise<AudienceResult> {
  const endpoint = process.env.ATHENA_PUBLIC_METRICS_URL;
  const token = process.env.ATHENA_PUBLIC_METRICS_TOKEN;
  if (!endpoint && !token) {
    const [meta, youtube] = await Promise.allSettled([getMetaAudience(), getYouTubeAudience()]);
    const platforms = [
      ...(meta.status === "fulfilled" ? meta.value?.platforms ?? [] : []),
      ...(youtube.status === "fulfilled" && youtube.value ? [youtube.value] : []),
    ];
    return {
      snapshot: platforms.length > 0
        ? { version: 1, brand: "inside-the-machine", approvedForPublic: true, platforms }
        : null,
    };
  }
  if (!endpoint || !token) return { snapshot: null };

  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
      return { snapshot: null };
    }
    // Version the cache with configuration, without writing the bearer token into cache keys.
    const identity = createHash("sha256").update(endpoint).update("\0").update(token).digest("hex");
    const getSnapshot = unstable_cache(() => withProviderBackoff(`athena-${identity}`, async () => {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
        await response.body?.cancel();
        throw new Error("Metrics source unavailable");
      }
      return parseAudienceSnapshot(await readLimitedJson(response));
    }), ["approved-audience-v1", identity], { revalidate: 3600, tags: ["public-audience"] });

    // Failed refreshes throw inside the cache. They never replace the last valid cached snapshot.
    return { snapshot: await getSnapshot() };
  } catch {
    // Do not echo response bodies, endpoints, headers, or provider errors into public HTML or logs.
    return { snapshot: null };
  }
}
