import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/login",
        "/register",
        "/advertise/book",
        "/api/",
        "/uploads/",
      ],
    },
    sitemap: siteOrigin() + "/sitemap.xml",
  };
}
