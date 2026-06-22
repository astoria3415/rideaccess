import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Ride Access",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#0F4C81",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
