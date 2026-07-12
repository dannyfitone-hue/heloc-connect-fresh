import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://helocconnect.com", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://helocconnect.com/privacy", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://helocconnect.com/terms", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://helocconnect.com/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
