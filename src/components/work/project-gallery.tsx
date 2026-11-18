import { statSync } from "node:fs";
import path from "node:path";
import { VideoPortfolio } from "@/components/home/video-portfolio";
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

export function ProjectGallery({ projects }: { projects: Project[] }) {
  const videoProjects = projects.filter(hasAvailableThumbnail);
  const textProjects = projects.filter((project) => !videoProjects.some((video) => video.id === project.id));
  if (projects.length === 0) return <p className="muted-copy">New engineering stories are in the making. Explore our social channels in the meantime.</p>;

  return (
    <>
      <VideoPortfolio projects={videoProjects} />
      {textProjects.length > 0 && (
        <ul className="video-project-fallbacks">
          {textProjects.map((project) => (
            <li key={project.id}>
              <a href={`https://www.youtube.com/shorts/${project.video.id}`} target="_blank" rel="noopener noreferrer">
                {project.title}<span aria-hidden="true">↗</span>
                <span className="sr-only"> (watch on YouTube, opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
