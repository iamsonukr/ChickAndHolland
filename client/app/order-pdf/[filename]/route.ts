export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // Browsers report the public origin relationship even behind a reverse proxy.
  const site = request.headers.get("sec-fetch-site");
  if (site ? site !== "same-origin" : origin && origin !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("pdf");
  if (!file || typeof file === "string" || file.type !== "application/pdf" ||
      await file.slice(0, 5).text() !== "%PDF-") {
    return new Response("Expected a PDF document.", { status: 400 });
  }

  const fallbackName = file.name.replace(/[^\x20-\x7E]|["\\/]/g, "_");
  const name = encodeURIComponent(file.name).replace(/'/g, "%27");
  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fallbackName}"; filename*=UTF-8''${name}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
