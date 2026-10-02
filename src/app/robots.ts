import type { MetadataRoute } from "next";

/** Only the public pages are for search engines; the shop's pages are private. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/login", "/signup"],
      disallow: "/",
    },
  };
}
