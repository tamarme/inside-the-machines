import { siteConfig } from "@/config/site";
import { RankedVideos } from "./ranked-videos";
import {
  countryName,
  isStale,
  metricLabels,
  type AudienceMetric,
  type AudienceSnapshot,
  type PlatformSnapshot,
} from "@/lib/audience/contract";

const numberFormat = new Intl.NumberFormat("en-GB");
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", timeZone: "UTC",
});

function metricLabel(metric: AudienceMetric): string {
  if (metric.timeframe === "lifetime") return "Channel views (all time)";
  if (metric.sourceMetric === "page_media_view") return "Content views";
  if (metric.sourceMetric === "page_post_engagements") return "Content engagements";
  return metricLabels[metric.name];
}

function MetricPeriod({ metric, syncedAt }: {
  metric: AudienceMetric;
  syncedAt: string;
}) {
  return (
    <span className="metric-period">
      {metric.timeframe === "lifetime"
        ? `All time · As of ${timeFormat.format(new Date(syncedAt))} UTC`
        : metric.period
        ? `${dateFormat.format(new Date(metric.period.start))} – ${dateFormat.format(new Date(metric.period.end))} · UTC`
        : `As of ${timeFormat.format(new Date(syncedAt))} UTC`}
    </span>
  );
}

function PlatformMetrics({ snapshot, compact }: {
  snapshot: PlatformSnapshot;
  compact: boolean;
}) {
  const metrics = compact
    ? snapshot.metrics.filter((metric) => metric.name === "followers" || metric.name === "subscribers")
    : snapshot.metrics;

  return (
    <>
      {compact && isStale(snapshot) && (
        <p className="data-status data-stale">Delayed update · Last verified data</p>
      )}
      <dl className="metric-list">
        {metrics.map((metric) => (
          <div key={metric.name}>
            <dt>{metricLabel(metric)}</dt>
            <dd>
              {metric.sourceMetric === "youtube.channel.subscriberCount" && metric.value >= 1000 ? "≈ " : ""}
              {numberFormat.format(metric.value)}
            </dd>
            <dd><MetricPeriod metric={metric} syncedAt={snapshot.syncedAt} /></dd>
          </div>
        ))}
      </dl>
      {compact && metrics.length === 0 && (
        <p className="muted-copy">See available performance metrics in audience insights.</p>
      )}
      {!compact && (
        <>
          <p className="sync-time">
            Last successful sync:{" "}
            <time dateTime={snapshot.syncedAt}>
              {timeFormat.format(new Date(snapshot.syncedAt))} UTC
            </time>
          </p>
          {!!snapshot.countryFollowers?.length && (
            <section className="audience-countries">
              <h4>Top countries by followers</h4>
              <p>{snapshot.platform === "instagram" ? "Instagram’s 30-day demographics report" : "Latest Facebook demographics report"}</p>
              <ol role="list">
                {snapshot.countryFollowers.map(({ countryCode, followers }) => (
                  <li key={countryCode}>
                    <span>{countryName(countryCode)}</span>
                    <span>{numberFormat.format(followers)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <RankedVideos snapshot={snapshot} />
        </>
      )}
    </>
  );
}

export function AudienceDashboard({ snapshot, compact = false }: {
  snapshot: AudienceSnapshot | null;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "audience-grid audience-grid-compact" : "audience-grid"}>
      {siteConfig.audiencePlatforms.map((platform) => {
        const social = siteConfig.socialLinks.find((link) => link.platform === platform);
        const data = snapshot?.platforms.find((entry) => entry.platform === platform);
        return (
          <article key={platform} className="platform-card" aria-labelledby={`platform-${platform}`}>
            <div className="platform-heading">
              <h3 id={`platform-${platform}`}>{social?.label ?? platform}</h3>
              <span className={data && !isStale(data) ? "platform-state" : "platform-state is-unavailable"}>
                {data ? isStale(data) ? "Delayed update" : "Verified snapshot" : "Not available"}
              </span>
            </div>
            {data ? (
              <PlatformMetrics snapshot={data} compact={compact} />
            ) : (
              <div className="metrics-empty">
                <span className="empty-value" aria-hidden="true">—</span>
                <p>Verified audience data is not available yet.</p>
              </div>
            )}
            {social && (
              <a className="platform-link" href={social.href} target="_blank" rel="noopener noreferrer">
                Visit {social.label}<span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
}
