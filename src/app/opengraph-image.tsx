import { ImageResponse } from "next/og";

export const alt =
  "Razia Sultana Lina, Manager, ACI Motors. Operation Head. Dhaka, Bangladesh.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#07080d",
          color: "#f3f5fb",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", width: 18, background: "#b5632a" }} />
        <div style={{ display: "flex", width: 10, background: "#2f7bff" }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 72px",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#ffa45c",
              letterSpacing: 6,
              fontSize: 22,
            }}
          >
            DHAKA · ACI MOTORS LTD.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 112,
              fontWeight: 700,
              letterSpacing: -4,
              marginTop: 16,
            }}
          >
            RSLina
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#ffe3c7", marginTop: 12 }}>
            Manager, ACI Motors
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
