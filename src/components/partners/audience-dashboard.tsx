import { siteConfig } from "@/config/site";
import { projects } from "@/content/projects";
import {
  isStale,
  metricLabels,
  platforms,
  type AudienceMetric,
  type AudienceSnapshot,
  type PlatformSnapshot,
} from "@/lib/audience/contract";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", timeZone: "UTC",
});

function metricLabel(metric: AudienceMetric): string {
  if (metric.sourceMetric === "page_media_view") return "Content views";
  if (metric.sourceMetric === "page_post_engagements") return "Content engagements";
  return metricLabels[metric.name];
}

function metricDescription(metric: AudienceMetric): string {
  switch (metric.sourceMetric) {
    case "followers_count": return "Account total at synchronization.";
    case "page_media_view": return "Times content was played or displayed.";
    case "reach": return "Unique accounts reached over this reporting period.";
    case "page_post_engagements": return "Post engagements, including reactions, comments, and shares.";
    case "total_interactions": return "Platform-reported interactions with account content.";
    default: return "Reported by the platform for the period shown.";
  }
}

function MetricPeriod({ metric, syncedAt }: {
  metric: AudienceMetric;
  syncedAt: string;
}) {
  return (
    <span className="metric-period">
      {metric.period
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
  const topContent = snapshot.topContent.flatMap((item) => {
    const project = projects.find((project) => project.id === item.projectId);
    return project ? [{ ...item, project }] : [];
  });

  return (
    <>
      {isStale(snapshot) && (
        <p className="data-status data-stale">Delayed update · Last verified data</p>
      )}
      <dl className="metric-list">
        {metrics.map((metric) => (
          <div key={metric.name}>
            <dt>{metricLabel(metric)}</dt>
            <dd>{new Intl.NumberFormat("en-GB").format(metric.value)}</dd>
            <dd><MetricPeriod metric={metric} syncedAt={snapshot.syncedAt} /></dd>
            {!compact && <dd className="metric-source">{metricDescription(metric)}</dd>}
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
          <p className="metric-availability">
            Metrics not listed are unavailable for this reporting period.
          </p>
          {topContent.length > 0 && (
            <div className="top-content">
              <h4>Top-performing content</h4>
              {topContent.map(({ project, metric }, index) => (
                <div key={`${project.id}-${index}`}>
                  <a
                    href={`https://www.youtube.com/shorts/${project.video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.title}<span aria-hidden="true"> ↗</span>
                    <span className="sr-only"> (watch on YouTube, opens in a new tab)</span>
                  </a>
                  <p>
                    {new Intl.NumberFormat("en-GB").format(metric.value)}{" "}
                    {metricLabel(metric).toLowerCase()} on {snapshot.platform}
                    <MetricPeriod metric={metric} syncedAt={snapshot.syncedAt} />
                  </p>
                </div>
              ))}
            </div>
          )}
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
      {platforms.map((platform) => {
        const social = siteConfig.socialLinks.find((link) => link.platform === platform);
        const data = snapshot?.platforms.find((entry) => entry.platform === platform);
        return (
          <article key={platform} className="platform-card" aria-labelledby={`platform-${platform}`}>
            <div className="platform-heading">
              <h3 id={`platform-${platform}`}>{social?.label ?? platform}</h3>
              <span className={data ? "platform-state" : "platform-state is-unavailable"}>
                {data ? "Verified snapshot" : "Not available"}
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
