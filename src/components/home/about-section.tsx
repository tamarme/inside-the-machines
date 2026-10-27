export function AboutSection() {
  return (
    <section
      id="about"
      className="section about-section"
      aria-labelledby="about-heading"
      tabIndex={-1}
    >
      <div className="page-container about-layout">
        <div>
          <p className="eyebrow section-label">
            <span aria-hidden="true">02 /</span> Our Perspective
          </p>
          <h2 id="about-heading">
            Built to Make
            <br />
            Complex Things
            <br />
            <span className="text-muted">Clear.</span>
          </h2>
        </div>
        <div className="about-copy">
          <p className="about-lead">
            Understanding comes from seeing how things work.
          </p>
          <p>
            We’re a small team bringing mechanical understanding and software
            engineering to 3D visualization. We look beyond the surface to show
            the systems, relationships, and motion inside a machine.
          </p>
          <p>
            Technical accuracy guides the work. Cinematic animation makes it
            engaging. Clear explanations make it useful.
          </p>
          <ul className="disciplines" aria-label="Our disciplines">
            <li>Engineering</li>
            <li>Visualization</li>
            <li>Education</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
