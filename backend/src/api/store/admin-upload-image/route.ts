import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import fs from "fs/promises";
import path from "path";

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as { dataUrl?: string; filename?: string };
  const dataUrl = body.dataUrl;

  if (!dataUrl || typeof dataUrl !== "string") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "dataUrl is required");
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid image data");
  }

  const mime = match[1];
  const ext = ALLOWED_MIME[mime];
  if (!ext) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Unsupported image type");
  }

  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  const uploadsDir = path.resolve(process.cwd(), "../storefront/public/uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = (body.filename || "upload")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 40);
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.writeFile(filePath, buffer);

  // Get the API base URL from environment or construct from request
  const apiUrl = process.env.API_URL || `http://localhost:9000`;
  const fullImageUrl = `${apiUrl}/uploads/${fileName}`;

  res.status(200).json({ url: fullImageUrl });
}
