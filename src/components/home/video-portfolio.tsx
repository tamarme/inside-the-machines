"use client";

import { useRef, useState } from "react";
import { VideoProjectCard } from "@/components/home/video-project-card";
import { VideoPlayerDialog } from "@/components/home/video-player-dialog";
import type { VideoProject } from "@/types/project";

interface VideoPortfolioProps {
  projects: VideoProject[];
}

export function VideoPortfolio({ projects }: VideoPortfolioProps) {
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function openVideo(project: VideoProject, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setActiveProject(project);
  }

  return (
    <>
      <div className="video-project-grid">
        {projects.map((project) => (
          <VideoProjectCard
            key={project.id}
            project={project}
            onPlay={openVideo}
          />
        ))}
      </div>
      {activeProject && (
        <VideoPlayerDialog
          project={activeProject}
          returnFocusRef={triggerRef}
          onClose={() => setActiveProject(null)}
        />
      )}
    </>
  );
}
