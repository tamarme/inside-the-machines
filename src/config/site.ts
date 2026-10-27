export interface SiteLink {
  label: string;
  href: string;
}

export interface SocialLink extends SiteLink {
  platform: "instagram" | "youtube" | "facebook" | "tiktok";
}

export const siteConfig = {
  name: "Inside the Machine",
  wordmark: { prefix: "INSIDE THE", emphasis: "MACHINE" },
  url: "https://insidethemachines.com",
  description:
    "Precise, cinematic 3D animation that brings complex mechanical systems to life. Engineering visualization by Inside the Machine.",
  email: "contact@insidethemachines.com",
  navigation: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ] satisfies SiteLink[],
  socialLinks: [
    {
      platform: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/inside.the.machines/",
    },
    {
      platform: "youtube",
      label: "YouTube",
      href: "https://www.youtube.com/@inside.the.machines",
    },
    {
      platform: "facebook",
      label: "Facebook",
      href: "https://www.facebook.com/inside.the.machines",
    },
    {
      platform: "tiktok",
      label: "TikTok",
      href: "https://www.tiktok.com/@inside.the.machines",
    },
  ] satisfies SocialLink[],
};
