import sharp from 'sharp';

function svg(size, { bg = '#0b0d10', pad = 0 } = {}) {
  const s = size + pad * 2;
  const r = Math.round(size * 0.22);
  const font = Math.round(size * 0.52);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="${bg}"/>
  <rect x="${pad + size * 0.14}" y="${pad + size * 0.14}" width="${size * 0.72}" height="${size * 0.72}" rx="${r}" fill="#863bff"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${font}" fill="#ffffff">W</text>
</svg>`);
}

const jobs = [
  { file: 'public/icons/icon-192.png', size: 192, pad: 0 },
  { file: 'public/icons/icon-512.png', size: 512, pad: 0 },
  // Maskable needs ~10% safe padding so the letter survives round/square masks.
  { file: 'public/icons/maskable-512.png', size: 512, pad: 52, bg: '#863bff' },
  { file: 'public/icons/apple-touch-icon-180.png', size: 180, pad: 0 },
];

for (const { file, size, pad, bg } of jobs) {
  const s = size + pad * 2;
  await sharp(svg(size, { bg })).resize(s, s).png().toFile(file);
  console.log('wrote', file);
}
