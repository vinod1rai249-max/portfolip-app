import fs from 'fs';

async function download() {
    try {
        const url = "https://ir.iitr.ac.in/static/images/hero_background.jpg";
        console.log("Fetching...", url);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        console.log("Downloaded bytes:", buffer.byteLength);
        fs.writeFileSync('bg.jpg', Buffer.from(buffer));
    } catch(e) {
        console.error(e);
    }
}
download();
