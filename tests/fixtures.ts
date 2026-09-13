import path from "path";
import fs from "fs";
import { PNG } from "pngjs";

export function createFixtures(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Warm sunset background (400x300)
  const bgPng = new PNG({ width: 400, height: 300 });
  for (let y = 0; y < 300; y++) {
    const factor = y / 300.0;
    for (let x = 0; x < 400; x++) {
      const idx = (y * 400 + x) * 4;
      bgPng.data[idx] = Math.round(240 * (1 - factor * 0.5));     // Red
      bgPng.data[idx + 1] = Math.round(140 * (1 - factor * 0.7)); // Green
      bgPng.data[idx + 2] = Math.round(60 + 80 * factor);         // Blue
      bgPng.data[idx + 3] = 255;
    }
  }
  const bgPath = path.join(dir, "sunset_bg.png");
  fs.writeFileSync(bgPath, PNG.sync.write(bgPng));

  // 2. Foreground product with alpha channel (200x200)
  const fgPng = new PNG({ width: 200, height: 200 });
  for (let y = 0; y < 200; y++) {
    for (let x = 0; x < 200; x++) {
      const idx = (y * 200 + x) * 4;
      const dx = x - 100;
      const dy = y - 100;
      if (dx * dx + dy * dy < 60 * 60) {
        fgPng.data[idx] = 200;
        fgPng.data[idx + 1] = 200;
        fgPng.data[idx + 2] = 200;
        fgPng.data[idx + 3] = 255;
      } else {
        fgPng.data[idx] = 0;
        fgPng.data[idx + 1] = 0;
        fgPng.data[idx + 2] = 0;
        fgPng.data[idx + 3] = 0;
      }
    }
  }
  const fgPath = path.join(dir, "product_fg.png");
  fs.writeFileSync(fgPath, PNG.sync.write(fgPng));

  // 3. Grayscale gradient card (100x100)
  const cardPng = new PNG({ width: 100, height: 100 });
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      const idx = (y * 100 + x) * 4;
      const val = Math.round((x / 100.0) * 255);
      cardPng.data[idx] = val;
      cardPng.data[idx + 1] = val;
      cardPng.data[idx + 2] = val;
      cardPng.data[idx + 3] = 255;
    }
  }
  const cardPath = path.join(dir, "gradient_card.png");
  fs.writeFileSync(cardPath, PNG.sync.write(cardPng));

  return { bgPath, fgPath, cardPath };
}
