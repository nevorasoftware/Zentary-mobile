const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Minimal 1x1 Blue PNG base64 (#2B82FB)
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(base64Png, 'base64');

['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'].forEach((fileName) => {
  const filePath = path.join(assetsDir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, pngBuffer);
    console.log(`Created ${fileName}`);
  }
});
