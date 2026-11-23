export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("pdf");
  if (!file || typeof file === "string" || file.type !== "application/pdf" ||
      await file.slice(0, 5).text() !== "%PDF-") {
    return new Response("Expected a PDF document.", { status: 400 });
  }

  const name = encodeURIComponent(file.name).replace(/'/g, "%27");
  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${name}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
