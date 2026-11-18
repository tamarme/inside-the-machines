import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    id: "turbocharger",
    category: "Turbocharging",
    title: "How a Turbocharger Works",
    thumbnail: {
      src: "/images/thumbnails/turbocharger.webp",
      alt: "How a Turbocharger Works — original animation thumbnail",
      width: 1080,
      height: 1920,
    },
    video: { provider: "youtube", id: "a4UdckKkf4U", aspectRatio: "9:16" },
    featuredOrder: 1,
  },
  {
    id: "diesel-vs-gasoline",
    category: "Engines",
    title: "Diesel vs Gasoline",
    thumbnail: {
      src: "/images/thumbnails/diesel-vs-gasoline.webp",
      alt: "Diesel vs Gasoline — original animation thumbnail",
      width: 1080,
      height: 1920,
    },
    video: { provider: "youtube", id: "ggtdT4rsC-w", aspectRatio: "9:16" },
    featuredOrder: 2,
  },
  {
    id: "differential",
    category: "Drivetrain",
    title: "How a Differential Works",
    thumbnail: {
      src: "/images/thumbnails/differential.webp",
      alt: "How a Differential Works — original animation thumbnail",
      width: 1080,
      height: 1920,
    },
    video: { provider: "youtube", id: "y7-sonWVtho", aspectRatio: "9:16" },
    featuredOrder: 3,
  },
  {
    id: "supercharger",
    category: "Turbocharging",
    title: "How a Supercharger Works",
    thumbnail: {
      src: "/images/thumbnails/supercharger.webp",
      alt: "How a Supercharger Works — original animation thumbnail",
      width: 1080,
      height: 1920,
    },
    video: { provider: "youtube", id: "YXI9z8X-FK8", aspectRatio: "9:16" },
    featuredOrder: 4,
  },
  {
    id: "egr",
    category: "Emissions",
    title: "Exhaust Gas Recirculation",
    thumbnail: {
      src: "/images/thumbnails/egr.webp",
      alt: "Exhaust Gas Recirculation — original animation thumbnail",
      width: 1080,
      height: 1920,
    },
    video: { provider: "youtube", id: "hCoZKVNB_48", aspectRatio: "9:16" },
    featuredOrder: 5,
  },
  {
    id: "limited-slip-differential",
    category: "Drivetrain",
    title: "Limited-Slip Differential",
    thumbnail: {
      src: "/images/thumbnails/limited-slip-differential.webp",
      alt: "Limited-Slip Differential — original animation thumbnail",
      width: 1080,
      height: 1920,
    },
    video: { provider: "youtube", id: "se8XaF6GlMs", aspectRatio: "9:16" },
    featuredOrder: 6,
  },
];

export function getFeaturedProjects(): Project[] {
  return projects
    .filter((project) => project.featuredOrder !== undefined)
    .sort((first, second) => (first.featuredOrder ?? 0) - (second.featuredOrder ?? 0))
    .slice(0, 6);
}
