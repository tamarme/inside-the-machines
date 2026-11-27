# Audience data integration

The public website renders approved aggregate audience data on the server. It adds no
public API, account management, provider SDK, publishing capability, database, or analytics
tracking script. The website and Athena remain independently deployable.

## Current implementation

The owner authorized reusing Inside the Machine's existing Meta credentials on
2026-11-18. Only its scoped Page ID, Instagram ID, access token, and Graph version
were copied to the website's ignored local `.env.local`. No global app secret,
other project token, YouTube credential, or Athena login was copied.
Deployment must configure the corresponding server variables only on the independent website service.

Two mutually exclusive sources are supported:

1. **Direct Meta and YouTube reads** when neither Athena endpoint variable is configured.
2. **Approved Athena aggregates** when both endpoint variables are configured.
   An incomplete/invalid Athena configuration fails closed rather than silently
   switching credentials or providers.

The direct reader uses the Graph version configured in the environment, not an
assumed latest version. It verifies the Page-to-Instagram relationship, both returned
account IDs, and the Instagram username against the official link in `site.ts`.
It never falls back to global or other-project credentials.

| Platform | Implemented read | Meaning |
| --- | --- | --- |
| Instagram | `followers_count` | Account total at synchronization |
| Instagram | `views`, `reach`, `total_interactions` | Provider aggregate over the requested 30-day window |
| Instagram | `follower_demographics` by country | Followers by country in the latest demographics report |
| Facebook | `followers_count` | Page followers; never substitute Page likes |
| Facebook | `page_media_view`, `page_post_engagements` | Latest provider-reported rolling 28-day window |
| Facebook | `page_follows_country` | Followers by country in the latest available daily follower snapshot |
| YouTube | Subscribers and channel views | Verified public subscriber count and all-time channel view total |
| TikTok | Temporarily hidden | Retained in the schema for future activation |

Each optional insight is requested separately. Permission-denied, deprecated, absent,
or invalid responses omit that metric while retaining available metrics.
Missing values never become zero. No Facebook unique reach is synthesized.
Instagram unique reach accepts only `total_value`, never a sum of daily reach.
Facebook rolling windows are selected individually, never summed.
No attempt is made to discover or rank top content from partial account data.
Video rankings use individual public posts and video metrics as described below.

Meta endpoints may require additional read authorization. Existing publishing
access does not prove insights access. Check the current API version and permissions
without replacing publishing credentials or expanding permissions incidentally.
Instagram insights typically require `instagram_manage_insights` and account read
permissions; Page Insights requires `read_insights` and `pages_read_engagement`.
The application does not grant scopes or create access tokens.

## Server configuration

See `.env.example`. Set variables only in the server environment; never prefix them
with `NEXT_PUBLIC_`. Do not paste token values into issues, browser URLs, logs, or chat.

Direct Meta mode:

- `META_INSIDE_THE_MACHINE_PAGE_ID`
- `META_INSIDE_THE_MACHINE_INSTAGRAM_ID`
- `META_INSIDE_THE_MACHINE_ACCESS_TOKEN`
- `META_GRAPH_API_VERSION`

Rotate the shared token in both applications when needed. A dedicated token with only
the necessary read permissions is preferable for a future production configuration.
Sharing a publishing token does not narrow that token's existing privileges; the
website's code restricts its own operations to GET requests.

Optional Athena mode:

- `ATHENA_PUBLIC_METRICS_URL`: exact owner-approved HTTPS endpoint, with no user info,
  query string, or fragment.
- `ATHENA_PUBLIC_METRICS_TOKEN`: dedicated read-only credential for this aggregate contract.

Never point this adapter at Athena's existing private `/api/analytics` route.
No raw Athena workspace or provider payload is suitable for direct public output.

## Athena audit

Read-only inspection of the owner-supplied local checkout found:

- `src/server/meta-config.ts`: separate credentials for every project, including
  `META_INSIDE_THE_MACHINE_*`.
- `src/server/growth/connections.ts`: verified platform-account connections and
  account follower totals.
- `src/server/analytics.ts`, `src/app/api/analytics/route.ts`: authenticated,
  project-scoped per-video analytics.
- `docs/analytics.md`, `docs/ai-team.md`: existing collectors, permissions, reporting
  limitations, and private snapshots.

The inspected source has no approved public media-kit endpoint. Its 7/30-day video
selection is a publication cohort with current lifetime counters; it is not
account-wide views in the last 30 days. Its optional Instagram history is restricted
to chess projects. Do not relabel either source to fit this UI.

No Athena source, credentials, scheduling, consent, collection settings, or production
services were changed. A future Athena endpoint can reuse the collectors, enforce
Inside the Machine's project/account identity, and publish only explicitly approved
aggregates. It must check read authorization and upstream consent, not grant access.

## Version 1 aggregate contract

The TypeScript interfaces and validator in `src/lib/audience/contract.ts` are authoritative.

Envelope:

- `version: 1`
- `brand: "inside-the-machine"`
- `approvedForPublic: true`
- `platforms`: one to four unique platform snapshots

Each platform snapshot:

- `platform`: instagram, facebook, youtube, or tiktok
- `syncedAt`: last successful collection timestamp, UTC ISO format
- `metrics`: unique approved metric entries, at least one
- `topContent`: up to five ranked videos or legacy project entries. See Sponsor media kit and video rankings below.
- `countryFollowers`: optional Meta-only array of `{ countryCode, followers }` entries. The validator keeps unique recognized two-letter country or territory codes with positive counts, ranked by reported follower count.

Each metric:

- `name`: followers, subscribers, views, reach, impressions, or interactions
- `value`: nonnegative safe integer, including actual zero
- `sourceMetric`: official source metric identifier
- `period: { start, end }`: required for performance metrics, forbidden for account totals
- Reporting-period end must not follow the collection timestamp.
- Subscribers apply only to YouTube; followers apply to the other three platforms.

Only explicit allowlisted fields are reconstructed. Arbitrary URLs, credentials,
demographic fields outside the approved country aggregates, source payloads, and unknown fields are discarded.
The contract is a presentation boundary, not an assertion that every official API
supports every field. An upstream adapter must verify each metric's actual meaning,
permissions, coverage, units, and timeframe before approving it.

## Caching, freshness, and failure behavior

Validated snapshots use Next.js's server data cache with one-hour revalidation.
Refreshes happen on demand, not through a new scheduler. Instagram and Facebook are
cached independently. Concurrent provider reads are shared per process; cold failures
have a one-minute process-local backoff. Upstream rate limits still apply.

Failed refreshes throw inside the cache, preserving the last successful cache entry.
Metrics are never replaced with fabricated zeros. When no valid cache exists, the
UI shows unavailable data. Snapshots older than two hours are visibly delayed.
All timestamps and reporting windows are displayed in UTC; periods may differ.
The provider may publish its own aggregates less frequently than hourly.

This uses `unstable_cache` because the existing project does not enable Cache Components.
A future migration can adopt `use cache` with a coordinated framework change.

HTTP requests have five-second timeouts, a 128 KiB response limit, no redirects,
no browser-visible access token, and no credential-bearing URL. Configuration hashes
scope the cache to the intended accounts and current credentials. Do not log raw
provider error bodies or fetch options.

## Validation and remaining checks

`npm test` covers public-data validation, private-field removal, zero/missing values,
reporting periods, freshness, correct rolling-window selection, unique-reach handling,
account mismatch, denied insights, credential placement, oversized responses,
concurrency, and failure backoff using synthetic fixtures. No live provider is called.

Account metrics were verified on the deployed site on 2026-11-18. The new per-video rankings were verified with live provider data in the local preview on the same date.

Official references:

- https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/
- https://developers.facebook.com/docs/graph-api/reference/shadow-ig-user/insights/
- https://developers.facebook.com/docs/graph-api/reference/page/
- https://developers.facebook.com/docs/graph-api/reference/insights/
- https://developers.facebook.com/docs/insights/overview

## YouTube public statistics and visible platforms

For public subscriber counts, channel views, and video rankings, configure a
server-side key restricted to YouTube Data API v3 in Google Cloud:

- `YOUTUBE_DATA_API_KEY`
- `YOUTUBE_INSIDE_THE_MACHINE_CHANNEL_ID`

The site sends the key in the `X-Goog-Api-Key` header and reads the channel by ID.
If a key is configured, the site uses it as its sole YouTube credential. It needs
no OAuth consent or token refresh, and is independent of Athena's account authorization.

If the key is absent, the website supports its existing channel OAuth configuration
using `YOUTUBE_INSIDE_THE_MACHINE_CHANNEL_ID` and these additional server variables:

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_INSIDE_THE_MACHINE_REFRESH_TOKEN`

Google issues seven-day refresh tokens for external OAuth apps in Testing with
YouTube scopes. For a production OAuth setup, use an In production consent screen
and obtain a new offline refresh token for this channel and the matching OAuth client.
The website exchanges the token server-side. Access tokens and raw provider responses
stay outside the cache and HTML.

In OAuth mode, `channels.list(mine=true)` verifies that the credential owns the
configured channel. Both modes require the returned ID and custom handle to match
the configured channel and the official website YouTube link. Hidden subscriber
counts are omitted. Public counts are parsed from the provider's integer strings.

The dashboard shows subscribers and total channel views. YouTube rounds public
subscriber counts down to three significant figures; the UI uses an approximation
marker from 1,000 subscribers. Channel views are explicitly **all time**, not a
30-day total or unique audience. No private YouTube Analytics report is requested.

The version 1 metric contract additionally permits `timeframe: "lifetime"` only for
YouTube `views` with source `youtube.channel.viewCount` and no reporting period.
This field is retained by validation. Other performance metrics still require a
reporting period. Lifetime channel totals cannot be used as top-content metrics.

YouTube has its own one-hour success cache and one-minute cold-failure backoff.
A YouTube failure does not hide successful Meta snapshots. The optional Athena
aggregate endpoint remains an alternative to all direct provider reads.

`siteConfig.audiencePlatforms` controls the media-kit cards. It currently contains
Instagram, Facebook, and YouTube. TikTok is temporarily hidden from the audience
overview and insights dashboard, while its existing social follow link remains
available. The schema still accepts it for future activation.

Tests additionally cover channel/handle mismatch, hidden and malformed counts,
expired authorization, credential placement, existing refresh grant, and the
distinction between lifetime and period metrics.

References:

- https://developers.google.com/youtube/v3/docs/channels/list
- https://developers.google.com/youtube/v3/docs/channels
- https://developers.google.com/youtube/data/guides/authentication
- https://developers.google.com/identity/protocols/oauth2#expiration
- https://developers.google.com/identity/protocols/oauth2/web-server#offline

## Follower geography

The detailed Instagram and Facebook panels show the five leading countries first.
An expandable list displays every other country the provider reports. Instagram
requests `follower_demographics` with `period=lifetime` and Meta's `this_month`
reporting timeframe. Facebook uses the latest `page_follows_country` snapshot
available in the last seven days. Both metrics describe the provider's follower
demographics at reporting time.

Country counts are divided by the platform's total follower count, with the reported
count shown beside each share. Meta may omit some locations, so reported shares can
sum to less than 100%. Counts are shown alone when the account total is missing,
zero, or smaller than the sum of the reported counts. Empty, denied, or unsupported
geography reports are omitted. The public YouTube Data API has no country breakdown.

## Sponsor media kit and video rankings

The direct collectors now return up to five public videos per platform. Instagram uses lifetime media views for video posts. Facebook uses lifetime post_media_view on public Reel posts. Each scans up to 50 recent posts (two cursor pages). YouTube checks the latest 50 upload playlist entries and uses videos.list for public, matching-channel videos with a lifetime viewCount. Only items with usable public titles, links and counts qualify. The first three appear immediately and the remaining two use a native disclosure. Ranking failures leave account metrics available.

An approved version 1 endpoint may return up to five topContent items per platform in ranking order. Each supports id, title, platformUrl, optional thumbnailUrl, publishedAt and projectId, and a metric with name, value, sourceMetric and either period or timeframe. For lifetime video views, use timeframe "lifetime", name "views", and sourceMetric "instagram.media.views", "post_media_view" or "youtube.video.viewCount" as appropriate. Platform links must point directly to the corresponding public video. Set rankingScope to "recent50" only for the same recent-posts comparison. Legacy projectId and period-metric entries remain supported. A verified portfolio match supplies the local title and thumbnail. Other previews use approved platform image hosts and fall back to text on load failure.

The executive summary uses the same cached account snapshot as the detailed panels. No independent sync job or Athena change is required.
