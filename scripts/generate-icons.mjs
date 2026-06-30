import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

const CLAY = "#d85a30";

// The STRYDZ mark: two offset ellipses + central stem. White fill for use on the clay
// background (maskable / apple-touch); clay fill for the transparent standalone icons.
function markSvg(fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 100">
    <ellipse cx="60" cy="35" rx="42" ry="15" fill="${fill}"/>
    <ellipse cx="44" cy="65" rx="42" ry="15" fill="${fill}"/>
    <rect x="46" y="21" width="12" height="58" fill="${fill}"/>
  </svg>`;
}

// Transparent icon: clay mark on transparent, mark fills ~70% of the canvas.
async function transparentIcon(size) {
  const inner = Math.round(size * 0.7);
  const mark = await sharp(Buffer.from(markSvg(CLAY)))
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

// Maskable/apple icon: white mark on a full-bleed clay square, mark within the safe zone
// (~60% so it survives Android's circle/squircle crop).
async function filledIcon(size) {
  const inner = Math.round(size * 0.55);
  const mark = await sharp(Buffer.from(markSvg("#ffffff")))
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: CLAY },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

const tasks = [
  ["public/icons/icon-192.png", await transparentIcon(192)],
  ["public/icons/icon-512.png", await transparentIcon(512)],
  ["public/icons/icon-maskable-512.png", await filledIcon(512)],
  ["public/icons/apple-touch-icon.png", await filledIcon(180)],
];

const { writeFileSync } = await import("fs");
for (const [path, buf] of tasks) {
  writeFileSync(path, buf);
  console.log("wrote", path);
}
