import { ImageResponse } from "next/og";

export const alt = "Aagri Samaj — Heritage, enterprise and opportunity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f7f6f0",
        color: "#183e3b",
        padding: "70px",
        position: "relative",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "75%",
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 5,
            color: "#934424",
            marginBottom: 30,
          }}
        >
          HERITAGE · ENTERPRISE · OPPORTUNITY
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -4 }}>
          Aagri Samaj
        </div>
        <div
          style={{
            fontSize: 36,
            display: "flex",
            flexDirection: "column",
            marginTop: 22,
            maxWidth: 720,
            lineHeight: 1.5,
          }}
        >
          Rooted in heritage.
          <br />
          Connected for tomorrow.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 21,
            marginTop: 48,
            gap: 24,
            color: "#5c6964",
          }}
        >
          Community · Local businesses · Useful resources
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: -50,
          bottom: -100,
          width: 390,
          height: 620,
          borderRadius: "220px 220px 0 0",
          background: "#183e3b",
          border: "18px solid #dfe6d8",
          transform: "rotate(-12deg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 90,
            width: 150,
            height: 150,
            borderRadius: 100,
            background: "#edbf78",
          }}
        />
      </div>
    </div>,
    size,
  );
}
