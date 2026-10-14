/* Derived from tblu-bookmark / Pintree. MIT, Copyright (c) 2024 Pintree.io.
 * See LICENSE and THIRD_PARTY_NOTICES.md in the package root. */
const neutralPixel = new Uint32Array(Uint8Array.of(128, 128, 128, 255).buffer)[0];

export function bevelProfile(width, height, radius) {
  return {
    range: Math.min(28, Math.max(18, radius)),
    falloff: 1.35,
    scale: radius > 0 ? Math.min(28, Math.round(Math.min(width, height) * .4)) : 0,
  };
}

/** Preserve the uniform rounded-lens displacement field, including fractional radii. */
export function fillBevelPixels(pixels, columns, rows, width, height, radius, ratio, { range = 18, falloff = 1.7 } = {}) {
  new Uint32Array(pixels.buffer, pixels.byteOffset, pixels.length / 4).fill(neutralPixel);
  const xVectors = new Float64Array(columns);
  for (let x = 0; x < columns; x++) {
    const px = (x + .5) / ratio;
    xVectors[x] = px - Math.max(radius, Math.min(width - radius, px));
  }
  for (let y = 0; y < rows; y++) {
    const py = (y + .5) / ratio;
    const vy = py - Math.max(radius, Math.min(height - radius, py));
    for (let x = 0; x < columns; x++) {
      const vx = xVectors[x];
      if (!vx && !vy) continue;
      const length = Math.hypot(vx, vy), depth = radius - length;
      if (depth < 0 || depth >= range) continue;
      const strength = Math.pow(1 - depth / range, falloff) * .95;
      const i = (y * columns + x) * 4;
      pixels[i] = 128 + vx / length * strength * 127;
      pixels[i + 1] = 128 + vy / length * strength * 127;
    }
  }
}

/** CSS corner order: top-left, top-right, bottom-right, bottom-left. */
export function normalizeRadii(values, width, height) {
  const parse = (value, dimension) => {
    const amount = Number.parseFloat(value);
    return Math.max(0, Number.isFinite(amount) ? String(value).endsWith('%') ? amount * dimension / 100 : amount : 0);
  };
  const corners = Array.from({ length: 4 }, (_, index) => {
    const parts = String(values[index] ?? values[0] ?? '0').trim().split(/\s+/);
    return [parse(parts[0], width), parse(parts[1] ?? parts[0], height)];
  });
  // CSS scales all corners together when adjacent radii would overlap.
  const sums = [corners[0][0] + corners[1][0], corners[3][0] + corners[2][0], corners[0][1] + corners[3][1], corners[1][1] + corners[2][1]];
  const factor = Math.min(1, ...sums.map((sum, index) => sum ? (index < 2 ? width : height) / sum : 1));
  return corners.map(corner => corner.map(value => value * Math.max(0, factor)));
}

/** A geometry key includes every corner; zero is a real radius, never a fallback. */
export function geometryKey(width, height, corners) {
  return `${width}:${height}:${corners.flat().map(value => Math.round(value * 1000) / 1000).join(':')}`;
}

export function fillSurfacePixels(pixels, columns, rows, width, height, corners, ratio, profile) {
  const radius = corners[0][0];
  if (corners.every(corner => corner[0] === radius && corner[1] === radius)) {
    fillBevelPixels(pixels, columns, rows, width, height, radius, ratio, profile);
    return;
  }
  new Uint32Array(pixels.buffer, pixels.byteOffset, pixels.length / 4).fill(neutralPixel);
  const { range = 18, falloff = 1.7 } = profile || {};
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const px = (x + .5) / ratio, py = (y + .5) / ratio;
    const right = px >= width / 2, bottom = py >= height / 2;
    const [rx, ry] = corners[bottom ? right ? 2 : 3 : right ? 1 : 0];
    if (!rx || !ry) continue;
    const vx = right ? Math.max(0, px - (width - rx)) : Math.min(0, px - rx);
    const vy = bottom ? Math.max(0, py - (height - ry)) : Math.min(0, py - ry);
    if (!vx && !vy) continue;
    const depth = (1 - Math.hypot(vx / rx, vy / ry)) * Math.min(rx, ry);
    if (depth < 0 || depth >= range) continue;
    const nx = vx / (rx * rx), ny = vy / (ry * ry), length = Math.hypot(nx, ny);
    const strength = Math.pow(1 - depth / range, falloff) * .95;
    const i = (y * columns + x) * 4;
    pixels[i] = 128 + nx / length * strength * 127;
    pixels[i + 1] = 128 + ny / length * strength * 127;
  }
}

export function isSelectedSurface(element) {
  if (['aria-selected', 'aria-checked', 'aria-pressed', 'aria-expanded', 'data-tblu-selected'].some(name => element.getAttribute(name) === 'true') ||
    element.getAttribute('data-tblu-selected') === '' ||
    (element.matches('input[type=checkbox],input[type=radio]') && element.checked)) return true;
  // Custom-element state uses the same generic contract, without depending on one library.
  try { return element.matches(':state(checked),:state(selected)'); } catch { return false; }
}
