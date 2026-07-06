import { ImageResponse } from "next/og";
import { brandTile } from "@/lib/brand-icon";

// PNG app icons: manifest (192 / 512), iOS apple-touch (180), favicon/badge.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await params;
  const n = Number(raw);
  const size = n === 512 ? 512 : n === 180 ? 180 : 192;
  return new ImageResponse(brandTile(size), { width: size, height: size });
}
