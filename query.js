import fs from 'fs';

async function check() {
    const api = 'https://en.wikipedia.org/w/api.php?action=query&titles=File:Thomason_College_of_Civil_Engineering.jpg&prop=imageinfo&iiprop=url&format=json';
    const res = await fetch(api);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

check();
