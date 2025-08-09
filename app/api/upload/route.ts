export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter(Boolean) as File[];

    const pdfFiles = files.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No PDF files provided" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const payload = pdfFiles.map((file, idx) => ({
      index: idx,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    // In a real app, you would persist the files (e.g., S3, DB) here.

    return new Response(
      JSON.stringify({ uploaded: payload.length, files: payload }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Upload failed" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}


