import Link from "next/link";
import { AudienceDashboard } from "@/components/partners/audience-dashboard";
import { getAudienceInsights } from "@/lib/audience/athena";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata(
  "Audience Insights",
  "Verified audience insights and platform-specific reporting for Inside the Machine brand partnerships.",
  "/partners/insights",
);
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { snapshot } = await getAudienceInsights();

  return (
    <main id="main-content" tabIndex={-1}>
      <section className="section page-intro insights-intro">
        <div className="page-container">
          <Link className="back-link" href="/partners">← Partnerships & Studio</Link>
          <p className="eyebrow section-label">Media Kit / Audience</p>
          <h1>Audience,<br /><span className="text-muted">With Perspective.</span></h1>
          <p className="page-lead">
            A clear view of our community across platforms. Verified data,
            distinct metrics, and transparent reporting periods.
          </p>
        </div>
      </section>
      <section className="section insights-section" aria-labelledby="insights-heading">
        <div className="page-container">
          <div className="collection-heading">
            <h2 id="insights-heading">Platform Overview</h2>
            <span className="eyebrow data-status">
              {snapshot ? "Verified snapshots" : "Audience data pending"}
            </span>
          </div>
          {!snapshot && (
            <div className="data-notice">
              <span className="status-mark" aria-hidden="true" />
              <p>
                Audience reporting is being prepared. For current audience
                information and a tailored collaboration proposal,{" "}
                <a href={`mailto:${siteConfig.email}`}>contact our studio</a>.
              </p>
            </div>
          )}
          <AudienceDashboard snapshot={snapshot} />
          <div className="reporting-notes">
            <div>
              <p className="eyebrow section-label">Reading the Data</p>
              <h2>Clarity Comes First<span className="accent-period">.</span></h2>
            </div>
            <dl>
              <div>
                <dt>Different measures, kept distinct</dt>
                <dd>
                  Views count plays or displays, as defined by each platform.
                  Facebook content views include media played or displayed.
                  Reach counts accounts reached. Impressions count displays.
                  These measures are never added together or described as unique people.
                </dd>
              </div>
              <div>
                <dt>Platform-specific availability</dt>
                <dd>
                  Only approved, verified metrics are shown. Availability and
                  reporting windows may differ by platform. Missing values are not zero.
                </dd>
              </div>
              <div>
                <dt>Transparent freshness</dt>
                <dd>
                  Each connected platform shows its last successful synchronization
                  and reporting period. Updates are checked approximately hourly
                  when this page is visited. Data older than two hours is marked as delayed.
                </dd>
              </div>
            </dl>
          </div>
          <div className="section-action portfolio-action">
            <p className="muted-copy">Planning a partnership? Let’s find the right fit.</p>
            <a className="button button-primary" href={`mailto:${siteConfig.email}`}>
              Talk to the Studio<span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
