const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../client/public/icons');

async function generatePngFromSvg(svgPath, pngPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    console.log(`Generated ${path.basename(pngPath)}`);
  } catch (err) {
    console.error(`Error generating ${path.basename(pngPath)}:`, err.message);
  }
}

async function main() {
  console.log('Generating PNG icons from SVG files...');
  
  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}.png`);
    
    if (fs.existsSync(svgPath)) {
      await generatePngFromSvg(svgPath, pngPath, size);
    } else {
      console.log(`SVG not found: ${svgPath}`);
    }
  }
  
  for (const size of [192, 512]) {
    const svgPath = path.join(iconsDir, `icon-maskable-${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-maskable-${size}.png`);
    
    if (fs.existsSync(svgPath)) {
      await generatePngFromSvg(svgPath, pngPath, size);
    }
  }
  
  console.log('PNG icon generation complete!');
}

main().catch(console.error);
