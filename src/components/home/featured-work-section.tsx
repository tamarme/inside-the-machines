import Link from "next/link";
import { ProjectGallery } from "@/components/work/project-gallery";
import { getFeaturedProjects } from "@/content/projects";

export function FeaturedWorkSection() {
  return (
    <section id="work" className="section work-section" aria-labelledby="work-heading" tabIndex={-1}>
      <div className="page-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-label"><span aria-hidden="true">01 /</span> A Look Inside</p>
            <h2 id="work-heading">Selected Work<span className="accent-period">.</span></h2>
          </div>
          <p className="section-introduction">A closer look at the mechanics<br className="desktop-break" /> behind the machines.</p>
        </div>
        <ProjectGallery projects={getFeaturedProjects()} />
        <div className="section-action portfolio-action">
          <span className="muted-copy">Every system has a story.</span>
          <Link className="button button-outline" href="/work">View All Work<span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}
