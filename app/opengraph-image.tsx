import { ImageResponse } from "next/og";
import { SITE_TAGLINE } from "@/lib/site";

// Generated at build/request time so there's no binary asset to keep in sync
// with the brand. Colors mirror app/globals.css.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Bridal Team — fun, simple, AI-powered wedding planning";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          background: "linear-gradient(135deg, #ff8c1c 0%, #ec5400 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: 10,
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          Bridal Team
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 82,
            lineHeight: 1.05,
            fontWeight: 700,
            maxWidth: 940,
          }}
        >
          AI-powered wedding planning
        </div>

        <div
          style={{
            marginTop: 30,
            fontSize: 33,
            lineHeight: 1.35,
            maxWidth: 880,
            opacity: 0.94,
          }}
        >
          {SITE_TAGLINE}
        </div>

        <div
          style={{
            marginTop: 46,
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 27,
            opacity: 0.92,
          }}
        >
          <div
            style={{
              width: 54,
              height: 5,
              borderRadius: 3,
              background: "#ffffff",
            }}
          />
          bridalteam.com
        </div>
      </div>
    ),
    size
  );
}
