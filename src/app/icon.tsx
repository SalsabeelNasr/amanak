import { ImageResponse } from "next/og";

/** Matches `:root --brand-wordmark` in `globals.css` (logo / header wordmark on light UI). */
const BRAND_WORDMARK = "#034cb6";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

async function loadSairaStencilOneForA(): Promise<ArrayBuffer> {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Saira+Stencil+One:wght@400&text=A",
    { headers: { "user-agent": "Mozilla/5.0" } },
  ).then((res) => res.text());
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  const rawUrl = match?.[1]?.replace(/["']/g, "").trim();
  if (!rawUrl) {
    throw new Error("Could not resolve Saira Stencil One font URL");
  }
  return fetch(rawUrl).then((res) => res.arrayBuffer());
}

export default async function Icon() {
  const fontData = await loadSairaStencilOneForA();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: BRAND_WORDMARK,
          fontSize: 24,
          fontFamily: '"Saira Stencil One"',
          fontWeight: 400,
          lineHeight: 1,
        }}
      >
        A
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Saira Stencil One",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
