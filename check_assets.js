const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching main page...');
  const html = await fetch('https://partiful.com/create?referrer=landing');
  
  // They might also just have it in the build manifest or inline JSON
  const inlineAssets = html.match(/https:\\?\/\\?\/assets\.getpartiful\.com\\[^"'\\]+\.(png|gif|mp4)/g);
  if (inlineAssets) {
    inlineAssets.forEach(a => console.log('Inline:', a.replace(/\\/g, '')));
  }

  const jsMatches = html.match(/\/_next\/static\/chunks\/[^"']+\.js/g);
  
  if (!jsMatches) {
      console.log('No JS files found in HTML.');
      return;
  }
  
  const uniqueJs = [...new Set(jsMatches)];
  console.log(`Found ${uniqueJs.length} JS files to scan...`);
  
  const effects = new Set();
  
  for (const jsPath of uniqueJs) {
    const jsContent = await fetch(`https://partiful.com${jsPath}`);
    const assetMatches = jsContent.match(/https:\/\/assets\.getpartiful\.com\/[^"'\\]+\.(png|gif)/g);
    if (assetMatches) {
      assetMatches.forEach(a => effects.add(a));
    }
  }
  
  console.log('\nFound assets in JS:');
  effects.forEach(a => console.log(a));
}

run();
