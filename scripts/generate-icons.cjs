const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../client/public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function generateSVGIcon(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - (padding * 2);
  const centerX = size / 2;
  const centerY = size / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#6366f1"/>
    </linearGradient>
  </defs>
  ${maskable ? `<rect width="${size}" height="${size}" fill="#0a0a0a"/>` : ''}
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${innerSize * 0.15}" fill="url(#grad)"/>
  <g transform="translate(${centerX}, ${centerY})">
    <!-- Camera/Gallery icon -->
    <rect x="${-innerSize * 0.3}" y="${-innerSize * 0.2}" width="${innerSize * 0.6}" height="${innerSize * 0.4}" rx="${innerSize * 0.05}" fill="white" opacity="0.95"/>
    <circle cx="0" cy="0" r="${innerSize * 0.12}" fill="#8b5cf6"/>
    <circle cx="${innerSize * 0.18}" cy="${-innerSize * 0.12}" r="${innerSize * 0.04}" fill="white" opacity="0.8"/>
    <!-- Mountain/image symbol -->
    <path d="M${-innerSize * 0.22} ${innerSize * 0.1} L${-innerSize * 0.1} ${-innerSize * 0.02} L${innerSize * 0.02} ${innerSize * 0.1} Z" fill="#6366f1" opacity="0.7"/>
    <path d="M${-innerSize * 0.05} ${innerSize * 0.1} L${innerSize * 0.08} ${innerSize * 0.02} L${innerSize * 0.22} ${innerSize * 0.1} Z" fill="#8b5cf6" opacity="0.7"/>
  </g>
</svg>`;
}

sizes.forEach(size => {
  const svg = generateSVGIcon(size, false);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`Generated icon-${size}.svg`);
});

[192, 512].forEach(size => {
  const svg = generateSVGIcon(size, true);
  fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}.svg`), svg);
  console.log(`Generated icon-maskable-${size}.svg`);
});

console.log('All icons generated successfully!');
console.log('Note: SVG icons created. For full PWA support, convert to PNG using an image tool.');
