import Link from "next/link";
import { AudienceDashboard } from "./audience-dashboard";
import { getAudienceInsights } from "@/lib/audience/athena";

export async function AudienceOverview() {
  const { snapshot } = await getAudienceInsights();

  return (
    <section className="section audience-section" aria-labelledby="audience-heading">
      <div className="page-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-label">Across the Community</p>
            <h2 id="audience-heading">
              Engineering Finds<br />
              Its Audience<span className="accent-period">.</span>
            </h2>
          </div>
          <p className="section-introduction">
            A cross-platform home for people curious about how automotive technology works.
          </p>
        </div>
        <AudienceDashboard snapshot={snapshot} compact />
        <div className="section-action">
          <Link className="button button-outline" href="/partners/insights">
            Explore Audience Insights<span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
