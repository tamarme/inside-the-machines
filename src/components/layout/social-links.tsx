import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { siteConfig } from "@/config/site";

const socialIcons = {
  instagram: SiInstagram,
  youtube: SiYoutube,
  facebook: SiFacebook,
  tiktok: SiTiktok,
};

export function SocialLinks() {
  if (siteConfig.socialLinks.length === 0) return null;

  return (
    <nav aria-label="Social media" className="social-links">
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
          </a>
        );
      })}
    </nav>
  );
}
