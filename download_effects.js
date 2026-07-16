const https = require('https');
const fs = require('fs');
const path = require('path');

const effects = [
    'money', 'sakura', 'ghost', 'mushrooms', 'doge', 'clover', 'hearts',
    'confetti', 'rain', 'snow', 'stars', 'sparkles', 'butterflies', 'balloons',
    'disco', 'bubbles', 'fireworks', 'christmasLights', 'football', 'soccer',
    'leaves', 'bats', 'spiders', 'web', 'pumpkins', 'bows', 'lips', 'skulls'
];

const effectsDir = path.join(__dirname, 'public', 'effects');
if (!fs.existsSync(effectsDir)) {
    fs.mkdirSync(effectsDir, { recursive: true });
}

function downloadEffect(name) {
    return new Promise((resolve) => {
        const url = `https://assets.getpartiful.com/animations/${name}/web.webm`;
        const dest = path.join(effectsDir, `${name}.webm`);
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${name}.webm`);
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
    console.log('Starting mass download of effects...');
    let successCount = 0;
    
    for (const name of effects) {
        const success = await downloadEffect(name);
        if (success) successCount++;
    }
    
    console.log(`\nFinished! Successfully downloaded ${successCount} effects to public/effects/`);
}

run();
