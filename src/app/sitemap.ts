import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only the landing page: quiz steps are noindex, and result pages are personal links people share.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }];
}
