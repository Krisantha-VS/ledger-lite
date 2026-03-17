import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LedgerLite",
    short_name: "LedgerLite",
    description: "Personal finance tracker — your finances, clearly.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1117",
    theme_color: "#6366f1",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
