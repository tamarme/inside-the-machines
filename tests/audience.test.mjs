import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadTypeScript(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { parseAudienceSnapshot, isStale } = await loadTypeScript("../src/lib/audience/contract.ts");
const { collectMetaPlatform, facebookWindow, instagramTotal } = await loadTypeScript("../src/lib/audience/meta-client.ts");
const { withProviderBackoff } = await loadTypeScript("../src/lib/audience/provider-request.ts");
const now = Date.parse("2026-11-18T12:00:00Z");
const period = { start: "2026-10-19T00:00:00Z", end: "2026-11-18T00:00:00Z" };

function fixture() {
  return {
    version: 1, brand: "inside-the-machine", approvedForPublic: true,
    platforms: [{
      platform: "instagram", syncedAt: new Date(now).toISOString(),
      metrics: [{ name: "followers", value: 0, sourceMetric: "followers_count" }],
    }],
  };
}
test("public contract preserves real zero and discards private fields at every level", () => {
  const value = fixture();
  value.accessToken = "DO_NOT_EXPOSE";
  value.platforms[0].accountId = "PRIVATE";
  value.platforms[0].metrics[0].privateRevenue = 900;
  const parsed = parseAudienceSnapshot(value, now);
  assert.equal(parsed.platforms[0].metrics[0].value, 0);
  assert.equal(JSON.stringify(parsed).includes("DO_NOT_EXPOSE"), false);
  assert.equal("accountId" in parsed.platforms[0], false);
  assert.equal("privateRevenue" in parsed.platforms[0].metrics[0], false);
});
test("public contract fails closed for unapproved, wrong-brand, duplicate, invalid, or future data", () => {
  const edits = [
    value => { value.approvedForPublic = false; },
    value => { value.brand = "another-project"; },
    value => { value.platforms.push(structuredClone(value.platforms[0])); },
    value => { value.platforms[0].metrics.push(structuredClone(value.platforms[0].metrics[0])); },
    value => { value.platforms[0].metrics[0].value = -1; },
    value => { value.platforms[0].metrics[0].value = NaN; },
    value => { value.platforms[0].metrics[0].name = "revenue"; },
    value => { value.platforms[0].metrics[0].name = "subscribers"; },
    value => { value.platforms[0].syncedAt = "2027-01-01T00:00:00Z"; },
    value => { value.platforms[0].syncedAt = "2026-02-30T00:00:00Z"; },
  ];
  for (const edit of edits) {
    const value = fixture();
    edit(value);
    assert.throws(() => parseAudienceSnapshot(value, now));
  }
});
test("performance metrics need a real reporting window ending before synchronization", () => {
  const value = fixture();
  value.platforms[0].metrics = [{ name: "reach", value: 30, sourceMetric: "reach", period }];
  assert.equal(parseAudienceSnapshot(value, now).platforms[0].metrics[0].value, 30);
  delete value.platforms[0].metrics[0].period;
  assert.throws(() => parseAudienceSnapshot(value, now));
  value.platforms[0].metrics[0].period = { start: period.end, end: period.start };
  assert.throws(() => parseAudienceSnapshot(value, now));
  value.platforms[0].metrics[0].period = { start: period.start, end: "2026-11-18T12:01:00Z" };
  assert.throws(() => parseAudienceSnapshot(value, now));
});
test("freshness changes with synchronization time, not the page render time", () => {
  const platform = parseAudienceSnapshot(fixture(), now).platforms[0];
  assert.equal(isStale(platform, now + 3600_000), false);
  assert.equal(isStale(platform, now + 3 * 3600_000), true);
});
test("Facebook uses the latest rolling 28-day window without adding overlapping values", () => {
  const metric = facebookWindow({ data: [{ name: "page_media_view", period: "days_28", values: [
    { value: 10, end_time: "2026-11-16T08:00:00+0000" },
    { value: 15, end_time: "2026-11-17T08:00:00+0000" },
  ] }] }, "page_media_view", "views", now);
  assert.equal(metric.value, 15);
  assert.equal(metric.period.end, "2026-11-17T08:00:00.000Z");
  assert.equal(Date.parse(metric.period.end) - Date.parse(metric.period.start), 28 * 86400_000);
});
test("Instagram unique reach accepts only a provider total, never a sum of daily unique counts", () => {
  const series = { data: [{ name: "reach", period: "day", values: [{ value: 10 }, { value: 12 }] }] };
  assert.equal(instagramTotal(series, "reach", "reach", period), null);
  assert.equal(instagramTotal({ data: [{ name: "reach", period: "day", total_value: { value: 17 } }] }, "reach", "reach", period).value, 17);
});
const config = { pageId: "123", instagramId: "456", token: "TEST_ONLY_TOKEN", version: "v26.0", instagramUsername: "inside.the.machines" };
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
test("read-only Meta adapter verifies brand identity, isolates denied insights, and keeps token out of URLs", async () => {
  const requests = [];
  const mock = async (input, init) => {
    const url = new URL(input);
    requests.push({ url, init });
    const fields = url.searchParams.get("fields");
    if (fields === "id,instagram_business_account") return json({ id: "123", instagram_business_account: { id: "456" } });
    if (fields === "id,username") return json({ id: "456", username: config.instagramUsername });
    if (fields === "id,followers_count") return json({ id: "456", followers_count: 120 });
    return json({ error: { code: 10, message: "PRIVATE_PROVIDER_BODY" } }, 403);
  };
  const platform = await collectMetaPlatform(config, "instagram", mock, now);
  assert.equal(platform.metrics.length, 1);
  assert.equal(platform.metrics[0].value, 120);
  assert.equal(JSON.stringify(platform).includes("TEST_ONLY_TOKEN"), false);
  for (const { url, init } of requests) {
    assert.equal(url.origin, "https://graph.facebook.com");
    assert.equal(url.href.includes("TEST_ONLY_TOKEN"), false);
    assert.equal(init.headers.Authorization, "Bearer TEST_ONLY_TOKEN");
    assert.equal(init.redirect, "error");
    assert.equal(init.method, undefined);
  }
});
test("wrong-account responses fail before any analytics are requested", async () => {
  let calls = 0;
  await assert.rejects(() => collectMetaPlatform(config, "instagram", async () => {
    calls++;
    return json({ id: "123", instagram_business_account: { id: "999" } });
  }, now));
  assert.equal(calls, 1);
});
test("oversized provider responses fail closed without leaking the body", async () => {
  await assert.rejects(() => collectMetaPlatform(config, "instagram", async () =>
    json({ private: "x".repeat(140 * 1024) }), now), /Audience provider unavailable/);
});
test("concurrent requests share one provider read and cold failures back off", async () => {
  let calls = 0;
  const read = async () => { calls++; await Promise.resolve(); return 4; };
  assert.deepEqual(await Promise.all([withProviderBackoff("test-success", read), withProviderBackoff("test-success", read)]), [4, 4]);
  assert.equal(calls, 1);
  let failures = 0;
  const fail = async () => { failures++; throw new Error("PRIVATE"); };
  await assert.rejects(() => withProviderBackoff("test-failure", fail), /source unavailable/);
  await assert.rejects(() => withProviderBackoff("test-failure", fail), /cooling down/);
  assert.equal(failures, 1);
});

const { collectYouTubeAudience } = await loadTypeScript("../src/lib/audience/youtube-client.ts");
const youtubeConfig = {
  channelId: "UC" + "a".repeat(22), handle: "@inside.the.machines",
  clientId: "TEST_CLIENT", clientSecret: "TEST_SECRET", refreshToken: "TEST_REFRESH",
};
function youtubeResponse({ id = youtubeConfig.channelId, handle = youtubeConfig.handle, hidden = false, subscribers = "12300", views = "456789" } = {}) {
  return { items: [{ id, snippet: { customUrl: handle }, statistics: {
    hiddenSubscriberCount: hidden, subscriberCount: subscribers, viewCount: views,
  } }] };
}
function youtubeFetcher(channelData, requests = []) {
  return async (input, init) => {
    const url = new URL(input);
    requests.push({ url, init });
    return url.hostname === "oauth2.googleapis.com"
      ? json({ access_token: "TEST_ACCESS_TOKEN" })
      : json(channelData);
  };
}
test("YouTube reuses existing OAuth and returns only verified public aggregates", async () => {
  const requests = [];
  const result = await collectYouTubeAudience(youtubeConfig, youtubeFetcher(youtubeResponse(), requests), now);
  assert.equal(result.platform, "youtube");
  assert.equal(result.metrics[0].name, "subscribers");
  assert.equal(result.metrics[0].value, 12300);
  assert.equal(result.metrics[1].value, 456789);
  assert.equal(result.metrics[1].timeframe, "lifetime");
  assert.equal(result.metrics[1].period, undefined);
  assert.equal(JSON.stringify(result).includes("TEST_"), false);
  assert.equal(requests[0].url.href, "https://oauth2.googleapis.com/token");
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[0].init.body.get("grant_type"), "refresh_token");
  assert.equal(requests[0].init.body.has("scope"), false);
  assert.equal(requests[1].url.searchParams.get("mine"), "true");
  assert.equal(requests[1].init.headers.Authorization, "Bearer TEST_ACCESS_TOKEN");
  for (const { url, init } of requests) {
    assert.equal(url.href.includes("TEST_"), false);
    assert.equal(init.redirect, "error");
  }
  const parsed = parseAudienceSnapshot({
    version: 1, brand: "inside-the-machine", approvedForPublic: true, platforms: [result],
  }, now);
  assert.equal(parsed.platforms[0].metrics[1].timeframe, "lifetime");
});
test("YouTube rejects a different channel or handle even with valid OAuth", async () => {
  await assert.rejects(() => collectYouTubeAudience(youtubeConfig, youtubeFetcher(youtubeResponse({ id: "UC" + "b".repeat(22) })), now));
  await assert.rejects(() => collectYouTubeAudience(youtubeConfig, youtubeFetcher(youtubeResponse({ handle: "@another-channel" })), now));
});
test("hidden and invalid YouTube subscriber counts are omitted; real zero views remain zero", async () => {
  const result = await collectYouTubeAudience(youtubeConfig, youtubeFetcher(youtubeResponse({ hidden: true, views: "0" })), now);
  assert.equal(result.metrics.length, 1);
  assert.equal(result.metrics[0].name, "views");
  assert.equal(result.metrics[0].value, 0);
  const invalid = await collectYouTubeAudience(youtubeConfig, youtubeFetcher(youtubeResponse({ subscribers: "1.2K" })), now);
  assert.equal(invalid.metrics.some(metric => metric.name === "subscribers"), false);
});
test("expired YouTube authorization does not trigger channel reads or another refresh", async () => {
  let calls = 0;
  await assert.rejects(() => collectYouTubeAudience(youtubeConfig, async () => {
    calls++;
    return json({ error: "invalid_grant", error_description: "PRIVATE_ERROR" }, 400);
  }, now), /YouTube audience source unavailable/);
  assert.equal(calls, 1);
});
test("lifetime views cannot be mislabeled as period metrics or used on another platform", () => {
  const value = fixture();
  value.platforms[0].platform = "youtube";
  value.platforms[0].metrics = [{ name: "views", value: 42, sourceMetric: "youtube.channel.viewCount", timeframe: "lifetime" }];
  assert.equal(parseAudienceSnapshot(value, now).platforms[0].metrics[0].timeframe, "lifetime");
  value.platforms[0].metrics[0].period = period;
  assert.throws(() => parseAudienceSnapshot(value, now));
  delete value.platforms[0].metrics[0].period;
  value.platforms[0].platform = "instagram";
  assert.throws(() => parseAudienceSnapshot(value, now));
  value.platforms[0].platform = "youtube";
  value.platforms[0].metrics[0].sourceMetric = "unknownViews";
  assert.throws(() => parseAudienceSnapshot(value, now));
});
