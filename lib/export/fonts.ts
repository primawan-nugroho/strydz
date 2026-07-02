/** Fonts for export cards. The SVG→Image→canvas rasterization step can't load external
 * font URLs (no network during image decode), so each font is fetched once, base64-encoded,
 * and embedded as a data-URI @font-face directly inside the exported SVG. */

export type ExportFont = "bebas" | "grotesk" | "playfair" | "mono";

const FONT_FILES: Record<ExportFont, { family: string; file: string; weight: number }> = {
  bebas: { family: "Bebas Neue", file: "/fonts/bebas-neue.woff2", weight: 400 },
  grotesk: { family: "Space Grotesk", file: "/fonts/space-grotesk.woff2", weight: 500 },
  playfair: { family: "Playfair Display", file: "/fonts/playfair-display.woff2", weight: 500 },
  mono: { family: "JetBrains Mono", file: "/fonts/jetbrains-mono.woff2", weight: 400 },
};

export const FONT_FAMILY: Record<ExportFont, string> = {
  bebas: "'Bebas Neue', sans-serif",
  grotesk: "'Space Grotesk', sans-serif",
  playfair: "'Playfair Display', serif",
  mono: "'JetBrains Mono', monospace",
};

const faceCache = new Map<ExportFont, Promise<string>>();

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Returns a @font-face CSS rule with the font embedded as a base64 data URI. Cached per
 * font for the lifetime of the page. Browser-only. */
export function getFontFaceCss(font: ExportFont): Promise<string> {
  let cached = faceCache.get(font);
  if (!cached) {
    cached = (async () => {
      const { family, file, weight } = FONT_FILES[font];
      const res = await fetch(file);
      if (!res.ok) throw new Error(`Font fetch failed: ${file} (${res.status})`);
      const b64 = await blobToBase64(await res.blob());
      return `@font-face { font-family: '${family}'; font-weight: ${weight}; src: url(data:font/woff2;base64,${b64}) format('woff2'); }`;
    })();
    // Drop failed fetches from the cache so a transient error doesn't stick forever.
    cached.catch(() => faceCache.delete(font));
    faceCache.set(font, cached);
  }
  return cached;
}

/** Convenience: one <style> block embedding all requested fonts. */
export async function buildFontStyle(fonts: ExportFont[]): Promise<string> {
  if (fonts.length === 0) return "";
  const faces = await Promise.all(fonts.map(getFontFaceCss));
  return `<style>${faces.join("\n")}</style>`;
}
