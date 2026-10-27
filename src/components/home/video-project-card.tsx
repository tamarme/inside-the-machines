import Image from "next/image";
import type { VideoProject } from "@/types/project";

interface VideoProjectCardProps {
  project: VideoProject;
  onPlay: (project: VideoProject, trigger: HTMLButtonElement) => void;
}

export function VideoProjectCard({ project, onPlay }: VideoProjectCardProps) {
  return (
    <article className="video-project-card">
      <button
        type="button"
        className="video-project-trigger"
        aria-label={`Play ${project.title}`}
        aria-haspopup="dialog"
        onClick={(event) => onPlay(project, event.currentTarget)}
      >
        <Image
          {...project.thumbnail}
          alt={project.thumbnail.alt}
          sizes="(max-width: 359px) calc(100vw - 48px), (max-width: 767px) calc((100vw - 64px) / 2), (max-width: 1023px) 43vw, (max-width: 1466px) 29vw, 424px"
          loading="lazy"
          className="video-project-thumbnail"
        />
        <span className="video-project-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </button>
      <h3 className="video-project-title">{project.title}</h3>
    </article>
  );
}
