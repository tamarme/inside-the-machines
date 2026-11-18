import { HeroSection } from "@/components/home/hero-section";
import { FeaturedWorkSection } from "@/components/home/featured-work-section";
import { AboutSection } from "@/components/home/about-section";
import { ContactSection } from "@/components/home/contact-section";
import { SocialCommunitySection } from "@/components/home/social-community-section";
import { WorkWithUsSection } from "@/components/home/work-with-us-section";

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <HeroSection />
      <SocialCommunitySection />
      <FeaturedWorkSection />
      <AboutSection />
      <WorkWithUsSection />
      <ContactSection />
    </main>
  );
}
