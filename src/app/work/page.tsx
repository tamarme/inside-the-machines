import Link from "next/link";
import { ProjectGallery } from "@/components/work/project-gallery";
import { ContactSection } from "@/components/home/contact-section";
import { projects } from "@/content/projects";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Our Work", "Explore original automotive engineering animations, from turbochargers and combustion to differentials and drivetrain systems.", "/work");

export default function WorkPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="section page-intro">
        <div className="page-container">
          <Link className="back-link" href="/">← Inside the Machine</Link>
          <p className="eyebrow section-label">The Engineering Collection</p>
          <h1>A Closer Look<br /><span className="text-muted">Inside the Machine.</span></h1>
          <p className="page-lead">Original engineering stories. Real mechanisms, revealed through motion.</p>
        </div>
      </section>
      <section className="section collection-section" aria-labelledby="collection-heading">
        <div className="page-container">
          <div className="collection-heading"><h2 id="collection-heading">The Collection</h2><p className="eyebrow">{projects.length} Engineering Stories</p></div>
          <ProjectGallery projects={projects} />
        </div>
      </section>
      <ContactSection />
    </main>
  );
}
