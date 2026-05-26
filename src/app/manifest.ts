import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cadenza — A Daily Classical Music Quiz",
    short_name: "Cadenza",
    description:
      "Learn the canon of Western classical music one composer at a time.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e8",
    theme_color: "#2c241b",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
  };
}
