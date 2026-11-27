import Link from "next/link";
import { AudienceDashboard } from "@/components/partners/audience-dashboard";
import { AudienceHighlights } from "@/components/partners/audience-highlights";
import { getAudienceInsights } from "@/lib/audience/athena";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Audience Insights", "Audience reach and individual video performance for Inside the Machine partnerships.", "/partners/insights");
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { snapshot } = await getAudienceInsights();
  return <main id="main-content" tabIndex={-1} className="insights-kit">
    <section className="section page-intro insights-intro"><div className="page-container">
      <Link className="back-link" href="/partners">← Partnerships &amp; Studio</Link>
      <p className="eyebrow section-label">Partner media kit</p>
      <h1>Audience snapshot<span className="accent-period">.</span></h1>
      <p className="page-lead">Explore the audience for our engineering animations and the individual films drawing the most views.</p>
      <AudienceHighlights snapshot={snapshot}/>
    </div></section>
    <section className="section insights-section" aria-labelledby="insights-heading"><div className="page-container">
      <div className="collection-heading"><h2 id="insights-heading">Platform performance</h2></div>
      <AudienceDashboard snapshot={snapshot}/>
      <section className="reporting-notes">
        <h2>Reading the data</h2>
        <dl><div><dt>Audience and activity</dt><dd>Reach counts distinct accounts on a platform. Views count plays or displays, impressions count displays, and subscribers count channel subscriptions. Audiences can overlap across platforms.</dd></div>
        <div><dt>Follower geography</dt><dd>Percentages use the platform&apos;s total follower count. Country counts come from the latest demographics report and availability varies by location.</dd></div>
        <div><dt>Reporting windows</dt><dd>Each platform sets its own reporting period. All-time counts cover the life of the channel or video. YouTube rounds public subscriber counts to three significant figures.</dd></div>
        <div><dt>Updates and availability</dt><dd>Visits trigger an update when the hourly cache expires. Figures older than two hours are marked as delayed. Only metrics supplied by the platform appear.</dd></div></dl>
      </section>
      <div className="section-action portfolio-action">
        <p className="muted-copy">Have an engineering story for this audience?</p>
        <a className="button button-primary" href={"mailto:" + siteConfig.email}>Discuss a partnership <span aria-hidden="true">↗</span></a>
      </div>
    </div></section>
  </main>;
}
