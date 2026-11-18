import { siteConfig } from "@/config/site";
import Link from "next/link";
import { SocialLinks } from "@/components/layout/social-links";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <div className="footer-brand">
          <Link className="wordmark" href="/">
            {siteConfig.wordmark.prefix}{" "}
            <span>{siteConfig.wordmark.emphasis}</span>
            <span className="wordmark-period" aria-hidden="true">
              .
            </span>
          </Link>
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
