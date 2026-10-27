export interface ProjectImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  title: string;
  thumbnail?: ProjectImage;
  video: {
    provider: "youtube";
    id: string;
    aspectRatio: "9:16" | "16:9";
  };
  featuredOrder: number;
}

export interface VideoProject extends Project {
  thumbnail: ProjectImage;
}
