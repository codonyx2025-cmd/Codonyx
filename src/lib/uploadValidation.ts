export const IMAGE_MAX_BYTES = 4 * 1024 * 1024; // 4 MB
export const DOCUMENT_MAX_BYTES = 30 * 1024 * 1024; // 30 MB

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
export const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];

export const IMAGE_ACCEPT_ATTR = IMAGE_EXTENSIONS.join(",");
export const DOCUMENT_ACCEPT_ATTR = DOCUMENT_EXTENSIONS.join(",");

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

const extOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
};

export function validateImage(file: File): ValidationResult {
  const ext = extOf(file.name);
  const typeOk =
    IMAGE_MIME_TYPES.includes(file.type) || IMAGE_EXTENSIONS.includes(ext);
  if (!typeOk) {
    return {
      ok: false,
      error: "Unsupported image type. Allowed: JPG, JPEG, PNG, WEBP.",
    };
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return { ok: false, error: "Image is too large. Maximum size is 4 MB." };
  }
  return { ok: true };
}

export function validateDocument(file: File): ValidationResult {
  const ext = extOf(file.name);
  const typeOk =
    DOCUMENT_MIME_TYPES.includes(file.type) ||
    DOCUMENT_EXTENSIONS.includes(ext);
  if (!typeOk) {
    return {
      ok: false,
      error:
        "Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX.",
    };
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    return {
      ok: false,
      error: "Document is too large. Maximum size is 30 MB.",
    };
  }
  return { ok: true };
}

/**
 * Compress / resize an image blob using a canvas. Skips when not in a browser
 * or when the source is already small. Returns the original blob on any failure
 * so uploads never break because of optimization.
 */
export async function compressImage(
  blob: Blob,
  opts: { maxDimension?: number; quality?: number; mimeType?: string } = {}
): Promise<Blob> {
  const { maxDimension = 1280, quality = 0.85, mimeType = "image/jpeg" } = opts;
  if (typeof window === "undefined" || typeof document === "undefined") return blob;
  // Tiny images: don't bother
  if (blob.size < 200 * 1024) return blob;

  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return blob;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const out: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), mimeType, quality)
    );
    if (!out) return blob;
    return out.size < blob.size ? out : blob;
  } catch {
    return blob;
  }
}

// Character limits for user-editable text fields.
export const TEXT_LIMITS = {
  fullName: 100,
  headline: 200,
  bio: 2000,
  location: 120,
  organisation: 150,
  contactNumber: 30,
  url: 500,
  shortText: 200,
  description: 2000,
  title: 200,
} as const;
