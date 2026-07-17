import sharp from "sharp"

const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200
const QUALITY = 80

export async function optimizeImage(file: File): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer())

  const metadata = await sharp(buffer).metadata()

  // No resize if already small enough
  if (
    (metadata.width ?? 0) <= MAX_WIDTH &&
    (metadata.height ?? 0) <= MAX_HEIGHT
  ) {
    return sharp(buffer)
      .jpeg({ quality: QUALITY, progressive: true })
      .toBuffer()
  }

  return sharp(buffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: QUALITY, progressive: true })
    .toBuffer()
}

export function getImageExtension(file: File): string {
  const type = file.type
  if (type === "image/png") return "png"
  if (type === "image/webp") return "webp"
  return "jpg"
}
