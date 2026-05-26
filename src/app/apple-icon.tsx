import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#2c241b",
          color: "#f6f1e8",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 28,
            width: 36,
            height: 3,
            background: "#5d3145",
          }}
        />
        {/* Italic C — for Cadenza. */}
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: 150,
            lineHeight: 1,
            marginTop: 14,
            color: "#f6f1e8",
            letterSpacing: "-0.04em",
          }}
        >
          C
        </div>
      </div>
    ),
    size
  );
}
