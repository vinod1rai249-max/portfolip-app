const fs = require('fs');
const https = require('https');
const path = require('path');

const url = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Main_Building%2C_IIT_Roorkee.jpg/1200px-Main_Building%2C_IIT_Roorkee.jpg";

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    if (res.statusCode !== 200) {
        console.error(`Failed to download: ${res.statusCode}`);
        return;
    }
    
    fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
    const fileStream = fs.createWriteStream(path.join(__dirname, 'public', 'iit-roorkee.jpg'));
    res.pipe(fileStream);
    
    fileStream.on('finish', () => {
        fileStream.close();
        console.log("Download complete.");
    });
}).on('error', (err) => {
    console.error(`Error: ${err.message}`);
});
