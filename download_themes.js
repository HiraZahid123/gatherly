const https = require('https');
const fs = require('fs');
const path = require('path');

const themes = [
    'ski', 'aurora', 'oxblood', 'sunset', 'cyberpunk', 'vintage', 
    'ocean', 'forest', 'galaxy', 'synthwave', 'vaporwave', 'neon', 
    'retro', 'abstract', 'minimal', 'darkmode', 'lightmode', 
    'gradient', 'pastel', 'cyber', 'space', 'clouds', 'fire', 'water'
];

const themesDir = path.join(__dirname, 'public', 'themes');
if (!fs.existsSync(themesDir)) {
    fs.mkdirSync(themesDir, { recursive: true });
}

function downloadTheme(name) {
    return new Promise((resolve) => {
        const url = `https://assets.getpartiful.com/backgrounds/${name}/web.mp4`;
        const dest = path.join(themesDir, `${name}.mp4`);
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${name}.mp4`);
                    resolve(true);
                });
            } else {
                console.log(`❌ Not found: ${name}`);
                resolve(false);
            }
        }).on('error', (err) => {
            console.log(`Error downloading ${name}: ${err.message}`);
            resolve(false);
        });
    });
}

async function run() {
    console.log('Starting mass download of themes...');
    let successCount = 0;
    
    for (const name of themes) {
        const success = await downloadTheme(name);
        if (success) successCount++;
    }
    
    console.log(`\nFinished! Successfully downloaded ${successCount} themes to public/themes/`);
}

run();
