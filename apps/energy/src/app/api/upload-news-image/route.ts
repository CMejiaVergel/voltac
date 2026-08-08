import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se subió archivo" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), "uploads", "news");
    await mkdir(uploadDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.(png|bmp|tiff?)$/i, ".jpg");
    const uniqueName = Date.now() + "-" + safeName;
    const finalName = uniqueName.endsWith(".jpg") || uniqueName.endsWith(".jpeg") ? uniqueName : uniqueName.replace(/\.[^.]+$/, ".jpg");

    // Compress using sharp to Max 1200px width (since it's inline in blog post), JPEG 80%
    const compressed = await sharp(inputBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    await writeFile(join(uploadDir, finalName), compressed);

    return NextResponse.json({ url: "/api/uploads/news/" + finalName });
  } catch (error: any) {
    console.error("News image upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
