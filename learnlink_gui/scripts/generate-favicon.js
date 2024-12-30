const sharp = require('sharp');
const path = require('path');

const sizes = [16, 32, 64, 192, 512];
const inputFile = path.join(__dirname, '../src/assets/images/learnlink-logo.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    // Generate favicon.ico (multi-size)
    await sharp(inputFile)
      .resize(64, 64)
      .toFile(path.join(outputDir, 'favicon.ico'));

    // Generate PNG icons
    await Promise.all(
      sizes.map(async (size) => {
        const outputFile = size <= 64 
          ? null // Skip small sizes as they're included in favicon.ico
          : path.join(outputDir, `logo${size}.png`);
        
        if (outputFile) {
          await sharp(inputFile)
            .resize(size, size)
            .toFile(outputFile);
        }
      })
    );

    console.log('Successfully generated favicon and logo files');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 