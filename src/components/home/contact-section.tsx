import { siteConfig } from "@/config/site";

export function ContactSection() {
  const [emailLocalPart, emailDomain] = siteConfig.email.split("@");

  return (
    <section
      id="contact"
      className="section contact-section"
      aria-labelledby="contact-heading"
      tabIndex={-1}
    >
      <div className="page-container">
        <p className="eyebrow section-label">
          <span aria-hidden="true">03 /</span> Let’s Talk
        </p>
        <div className="contact-layout">
          <div>
            <h2 id="contact-heading">
              Have a Project
              <br />
              in Mind<span className="accent-period">?</span>
            </h2>
            <p>
              Let’s talk about how we can bring your technical ideas to life.
            </p>
          </div>
          <a className="contact-link" href={`mailto:${siteConfig.email}`}>
            <span className="contact-link-copy">
              <span className="contact-link-label">Start a conversation</span>
              <span className="contact-address">
                {emailLocalPart}@<wbr />
                {emailDomain}
              </span>
            </span>
            <span className="contact-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
