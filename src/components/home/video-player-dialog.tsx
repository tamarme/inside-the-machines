import { useEffect, useRef, type RefObject } from "react";
import type { VideoProject } from "@/types/project";

interface VideoPlayerDialogProps {
  project: VideoProject;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function VideoPlayerDialog({
  project,
  returnFocusRef,
  onClose,
}: VideoPlayerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const youtubeUrl = `https://www.youtube.com/shorts/${project.video.id}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    const returnFocusTarget = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      returnFocusTarget?.focus({ preventScroll: true });
    };
  }, [returnFocusRef]);

  return (
    <dialog
      className="video-dialog"
      ref={dialogRef}
      aria-labelledby="video-dialog-title"
      aria-describedby="video-dialog-help"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="video-dialog-content">
        <div className="video-dialog-header">
          <h2 id="video-dialog-title">{project.title}</h2>
          <button
            type="button"
            className="video-dialog-close"
            onClick={onClose}
            ref={closeButtonRef}
          >
            Close<span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="video-player-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${project.video.id}?autoplay=1&playsinline=1`}
            title={`${project.title} — YouTube video player`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="video-dialog-footer">
          <p id="video-dialog-help">
            Player unavailable? Open the original video.
          </p>
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
            Watch on YouTube<span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </dialog>
  );
}
