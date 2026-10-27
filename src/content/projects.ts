import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    id: "turbocharger",
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
