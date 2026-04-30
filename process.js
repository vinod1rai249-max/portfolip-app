import fs from 'fs';
import sharp from 'sharp';

async function processImage() {
    const buffer = await sharp('iitr.jpg')
        .resize({ width: 800 })
        .jpeg({ quality: 75 })
        .toBuffer();
    
    const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    fs.writeFileSync('src/assets.ts', `export const IIT_ROORKEE_BG = "${base64}";\n`);
    console.log("Assets written! Size:", base64.length);
}

processImage();
