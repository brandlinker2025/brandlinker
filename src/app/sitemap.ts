import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rslina.com";
  const now = new Date();

  // Public personal portfolio routes only - private administrative routes are strictly omitted
  const routes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/career", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/work", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/riding", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/gallery", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/freelance", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/collaborate", changeFrequency: "monthly" as const, priority: 0.7 },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
