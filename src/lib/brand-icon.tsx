import type { ReactElement } from "react";

/**
 * Branded app-icon tile used for the admin PWA (home-screen icon, favicon,
 * notification icon). Rendered to PNG by `next/og` ImageResponse. Fills the
 * whole square with the brand color so it also works as a maskable icon.
 */
export function brandTile(size: number): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0F4C81 0%, #0097A7 100%)",
        color: "#ffffff",
        fontSize: size * 0.4,
        fontWeight: 800,
        letterSpacing: -size * 0.02,
        fontFamily: "sans-serif",
      }}
    >
      RA
    </div>
  );
}
