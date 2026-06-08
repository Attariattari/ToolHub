export async function GET() {
  const baseUrl = 'https://pdfdex.com';

  // ✅ Static pages
  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/blogs',
    '/privacy',
    '/terms',
  ];

  // ✅ Tools pages (from your toolCategories)
  const toolPages = [
    "/merge-pdf",
    "/split-pdf",
    "/organize-pdf",
    "/compress-pdf",
    "/repair-pdf",
    "/ocr-pdf",
    "/jpg-to-pdf",
    "/word-to-pdf",
    "/powerpoint-to-pdf",
    "/excel-to-pdf",
    "/html-to-pdf",
    "/pdf-to-jpg",
    "/pdf-to-word",
    "/pdf-to-powerpoint",
    "/pdf-to-excel",
    "/pdf-to-pdfa",
    "/rotate-pdf",
    "/add-pdf-page-number",
    "/add-watermark",
    "/crop-pdf",
    "/edit-pdf",
    "/unlock-pdf",
    "/protect-pdf",
    "/sign-pdf",
    "/redact-pdf",
    "/compare-pdf",
  ];

  const allPages = [...staticPages, ...toolPages];

  // ✅ Sitemap banate hain
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
      .map(
        (path) => `
    <url>
      <loc>${baseUrl}${path}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${path === "/" ? "1.0" : "0.8"}</priority>
    </url>`
      )
      .join("")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
