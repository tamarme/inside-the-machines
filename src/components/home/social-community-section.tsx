import { SocialLinks } from "@/components/layout/social-links";

export function SocialCommunitySection() {
  return (
    <section className="community-section" aria-labelledby="community-heading">
      <div className="page-container community-layout">
        <div>
          <p className="eyebrow section-label">Beyond the Surface</p>
          <h2 id="community-heading">
            Follow the Engineering<span className="accent-period">.</span>
          </h2>
          <p className="muted-copy">
            New animations. A closer look at machines. Join the community.
          </p>
        </div>
        <SocialLinks showLabels />
      </div>
    </section>
  );
}
