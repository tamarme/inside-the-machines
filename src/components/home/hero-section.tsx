import { getImageProps } from "next/image";

export function HeroSection() {
  const common = {
    alt: "Cutaway 3D visualization of a turbocharger, revealing its turbine, compressor and orange and blue airflow paths.",
    sizes: "100vw",
    quality: 75,
  };
  const { props: desktop } = getImageProps({
    ...common,
    src: "/images/hero/turbo-desktop.webp",
    width: 2048,
    height: 1152,
  });
  const { props: mobile } = getImageProps({
    ...common,
    src: "/images/hero/turbo-mobile.webp",
    width: 1080,
    height: 1350,
  });

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="page-container hero-content">
        <p className="eyebrow">
          <span className="status-mark" aria-hidden="true" />
          3D Engineering Visualization
        </p>
        <h1 id="hero-heading">
          Engineering,
          <br />
          <span>Made Visible.</span>
        </h1>
        <p className="hero-description">
          We bring complex mechanical systems to life through precise, cinematic
          3D animation.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#work">
            Explore Our Work<span aria-hidden="true">↗</span>
          </a>
          <a className="button button-text" href="#contact">
            Get in Touch<span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <picture className="hero-picture">
        <source
          media="(max-width: 767px)"
          srcSet={mobile.srcSet}
          sizes={mobile.sizes}
          width={mobile.width}
          height={mobile.height}
        />
        {/* A single picture lets the browser choose one art direction before downloading. */}
        <img
          {...desktop}
          className="hero-image"
          loading="eager"
          fetchPriority="high"
          alt={common.alt}
        />
      </picture>
      <div className="page-container hero-caption" aria-hidden="true">
        <span>Technical understanding. Visual clarity.</span>
        <span className="hero-subject">
          Turbocharger <span> / </span> Cutaway visualization
        </span>
      </div>
    </section>
  );
}
