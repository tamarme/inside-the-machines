import { siteConfig } from "@/config/site";
import { SocialLinks } from "@/components/layout/social-links";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <div className="footer-brand">
          <a className="wordmark" href="#top">
            {siteConfig.wordmark.prefix}{" "}
            <span>{siteConfig.wordmark.emphasis}</span>
            <span className="wordmark-period" aria-hidden="true">
              .
            </span>
          </a>
          <a className="footer-email" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>
        </div>
        <SocialLinks />
        <p className="copyright">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
