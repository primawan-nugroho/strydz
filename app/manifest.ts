import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "STRYDZ",
    short_name: "STRYDZ",
    description: "Connect Strava, visualize activities, and get training insights.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#15140f",
    theme_color: "#15140f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Insights", url: "/insights", description: "Fitness, load, and training suggestions" },
      { name: "Activities", url: "/activities", description: "Your recent activities" },
    ],
  };
}
