import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Renders a QR code PNG for links on our own domain. Used inside
 * transactional emails (email clients fetch the image by URL, so
 * data URIs are not an option).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data") ?? "";

  // Only encode our own URLs so this can't be abused as an open QR generator.
  if (!data || data.length > 500 || !data.startsWith(site.url)) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const png = await QRCode.toBuffer(data, {
    type: "png",
    width: 240,
    margin: 2,
    color: { dark: "#0F4C81", light: "#FFFFFF" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
