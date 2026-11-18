import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export function pageMetadata(title: string, description: string, pathname: string): Metadata {
  const fullTitle = `${title} | ${siteConfig.name}`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical: pathname },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url: pathname,
      images: [{ url: "/images/hero/turbo-cutaway-desktop.webp", width: 2560, height: 1440, alt: "Inside the Machine turbocharger cutaway" }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: ["/images/hero/turbo-cutaway-desktop.webp"] },
  };
}
