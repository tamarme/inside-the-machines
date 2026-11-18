import Link from "next/link";
import { CollaborationFormats } from "@/components/partners/collaboration-formats";
import { AudienceOverview } from "@/components/partners/audience-overview";
import { ProjectGallery } from "@/components/work/project-gallery";
import { ContactSection } from "@/components/home/contact-section";
import { getFeaturedProjects } from "@/content/projects";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Partnerships & Studio", "Sponsored engineering content, custom 3D visualizations, and long-term brand partnerships with Inside the Machine.", "/partners");
export const dynamic = "force-dynamic";

export default function PartnersPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="section page-intro partners-intro">
        <div className="page-container">
          <Link className="back-link" href="/">← Inside the Machine</Link>
          <p className="eyebrow section-label"><span className="status-mark" aria-hidden="true" /> Media & Studio / Partnerships</p>
          <h1>Engineering Stories<br /><span className="text-muted">Worth Watching.</span></h1>
          <div className="partners-intro-bottom">
            <p className="page-lead">Complex technology. Clear storytelling. Cinematic 3D experiences that bring your engineering to an audience that wants to understand.</p>
            <a href={`mailto:${siteConfig.email}`} className="button button-primary">Start a Collaboration<span aria-hidden="true">↗</span></a>
          </div>
          <div className="brand-principles"><span>Engineering understanding</span><span>Distinctive visualization</span><span>Educational storytelling</span></div>
        </div>
      </section>
      <section className="section perspective-section" aria-labelledby="why-heading">
        <div className="page-container about-layout">
          <div><p className="eyebrow section-label">Why Inside the Machine</p><h2 id="why-heading">Made to Be Seen.<br /><span className="text-muted">Built to Be Understood.</span></h2></div>
          <div className="about-copy">
            <p className="about-lead">The most compelling part of a machine is often the part you cannot see.</p>
            <p>We bring mechanical understanding, software engineering, and cinematic animation together to make that hidden story visible.</p>
            <p>Our automotive content combines a clear educational perspective with distribution across Instagram, Facebook, YouTube, and TikTok. A partnership can bring your technology into that conversation.</p>
          </div>
        </div>
      </section>
      <section className="section collaboration-section" aria-labelledby="formats-heading">
        <div className="page-container">
          <p className="eyebrow section-label">Ways to Work Together</p>
          <h2 id="formats-heading">A Format for Your Story<span className="accent-period">.</span></h2>
          <CollaborationFormats detailed />
          <div className="deliverables-panel">
            <div><p className="eyebrow section-label">A Clear Scope, From the Start</p><h3>One collaboration.<br />Clearly defined deliverables.</h3></div>
            <dl className="deliverables-list">
              <div><dt>Content creation</dt><dd>The animation, story, and agreed production deliverables.</dd></div>
              <div><dt>Publishing & distribution</dt><dd>Which studio channels publish the work, and when.</dd></div>
              <div><dt>Advertising usage rights</dt><dd>Separate permission to use the content in paid campaigns.</dd></div>
              <div><dt>Licensing & adaptations</dt><dd>Additional formats, languages, channels, or duration of use.</dd></div>
            </dl>
          </div>
          <p className="scope-note">Creation, publishing, advertising rights, and extended licensing are scoped separately. Your proposal will specify what is included.</p>
        </div>
      </section>
      <section className="section work-section" aria-labelledby="partner-work-heading">
        <div className="page-container">
          <div className="section-heading"><div><p className="eyebrow section-label">Our Visual Language</p><h2 id="partner-work-heading">The Work Speaks<span className="accent-period">.</span></h2></div><Link className="button button-text" href="/work">Explore All Work<span aria-hidden="true">↗</span></Link></div>
          <ProjectGallery projects={getFeaturedProjects().slice(0, 3)} />
        </div>
      </section>
      <AudienceOverview />
      <ContactSection />
    </main>
  );
}
