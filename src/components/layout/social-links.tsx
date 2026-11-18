import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { siteConfig } from "@/config/site";

const socialIcons = {
  instagram: SiInstagram,
  youtube: SiYoutube,
  facebook: SiFacebook,
  tiktok: SiTiktok,
};

export function SocialLinks({ showLabels = false }: { showLabels?: boolean }) {
  if (siteConfig.socialLinks.length === 0) return null;

  return (
    <nav aria-label={showLabels ? "Follow our community" : "Social media"} className={showLabels ? "social-links social-links-labeled" : "social-links"}>
      {siteConfig.socialLinks.map((link) => {
        const Icon = socialIcons[link.platform];

        return (
          <a
            key={link.platform}
            href={link.href}
            aria-label={`${siteConfig.name} on ${link.label} (opens in a new tab)`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon aria-hidden="true" focusable="false" />
            {showLabels && <><span>{link.label}</span><span className="social-link-arrow" aria-hidden="true">↗</span></>}
          </a>
        );
      })}
    </nav>
  );
}
