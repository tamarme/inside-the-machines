import { statSync } from "node:fs";
import path from "node:path";
import { VideoPortfolio } from "@/components/home/video-portfolio";
import { projects } from "@/content/projects";
import type { Project, VideoProject } from "@/types/project";

function hasAvailableThumbnail(project: Project): project is VideoProject {
  if (!project.thumbnail?.src.startsWith("/images/")) return false;

  const publicDirectory = path.resolve(process.cwd(), "public");
  const imagePath = path.resolve(publicDirectory, `.${project.thumbnail.src}`);
  if (!imagePath.startsWith(`${publicDirectory}${path.sep}`)) return false;

  try {
    return statSync(imagePath).isFile();
  } catch {
    return false;
  }
}

export function FeaturedWorkSection() {
  const orderedProjects = [...projects].sort(
    (first, second) => first.featuredOrder - second.featuredOrder,
  );
  const videoProjects = orderedProjects.filter(hasAvailableThumbnail);
  const textProjects = orderedProjects.filter(
    (project) =>
      !videoProjects.some((videoProject) => videoProject.id === project.id),
  );

  return (
    <section
      id="work"
      className="section work-section"
      aria-labelledby="work-heading"
      tabIndex={-1}
    >
      <div className="page-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-label">
              <span aria-hidden="true">01 /</span> A Look Inside
            </p>
            <h2 id="work-heading">
              Selected Work<span className="accent-period">.</span>
            </h2>
          </div>
          <p className="section-introduction">
            A closer look at the mechanics
            <br className="desktop-break" /> behind the machines.
          </p>
        </div>
        <VideoPortfolio projects={videoProjects} />
        {textProjects.length > 0 && (
          <ul className="video-project-fallbacks">
            {textProjects.map((project) => (
              <li key={project.id}>
                <a
                  href={`https://www.youtube.com/shorts/${project.video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {project.title}
                  <span aria-hidden="true">↗</span>
                  <span className="sr-only">
                    {" "}
                    (watch on YouTube, opens in a new tab)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
