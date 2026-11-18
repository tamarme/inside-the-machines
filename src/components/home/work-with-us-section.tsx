import Link from "next/link";
import { CollaborationFormats } from "@/components/partners/collaboration-formats";

export function WorkWithUsSection() {
  return (
    <section className="section collaboration-section" aria-labelledby="collaboration-heading">
      <div className="page-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-label">
              <span aria-hidden="true">03 /</span> Media & Studio
            </p>
            <h2 id="collaboration-heading">
              Let’s Make Complex<br />
              Things Clear<span className="accent-period">.</span>
            </h2>
          </div>
          <p className="section-introduction">
            We help brands and engineering-focused organizations turn complex
            systems into visual stories people understand.
          </p>
        </div>
        <CollaborationFormats />
        <div className="section-action">
          <Link href="/partners" className="button button-primary">
            Work With Us<span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
