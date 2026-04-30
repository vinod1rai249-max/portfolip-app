import fs from 'fs';
import path from 'path';

async function download() {
    try {
        const url = "https://upload.wikimedia.org/wikipedia/commons/f/f2/Admin_Block_IIT-R.JPG";
        console.log("Fetching...", url);
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const buffer = await res.arrayBuffer();
        
        fs.writeFileSync('iitr.jpg', Buffer.from(buffer));
        console.log("Downloaded image.");
    } catch(e) {
        console.error(e);
    }
}
download();
