const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const doctorsFile = 'src/lib/api/doctors.ts';
let content = fs.readFileSync(doctorsFile, 'utf8');

const urls = [...content.matchAll(/image:\s*"([^"]+)"/g)].map(m => m[1]);

if (!fs.existsSync('public/doctors')) {
  fs.mkdirSync('public/doctors', { recursive: true });
}

async function downloadImage(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': new URL(url).origin } }, (res) => {
      if (res.statusCode === 200 && res.headers['content-type'] && res.headers['content-type'].startsWith('image/')) {
        const ext = res.headers['content-type'].split('/')[1].split(';')[0];
        const filename = path.basename(new URL(url).pathname);
        const dest = `public/doctors/${filename}`;
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve({ success: true, url, dest: `/doctors/${filename}` }));
        });
      } else {
        // Drain the response to free up memory
        res.resume();
        resolve({ success: false, url, status: res.statusCode });
      }
    }).on('error', (e) => {
      resolve({ success: false, url, error: e.message });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, url, error: 'TIMEOUT' });
    });
  });
}

async function run() {
  for (const url of urls) {
    if (url.startsWith('/doctors/')) continue; // Already local
    
    console.log(`Downloading ${url}...`);
    const result = await downloadImage(url);
    if (result.success) {
      console.log(`Success: ${result.dest}`);
      content = content.replace(`"${url}"`, `"${result.dest}"`);
    } else {
      console.log(`Failed: ${result.status || result.error}`);
      // Remove the image property if it failed
      const regex = new RegExp(`\\s*image:\\s*"${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}",`, 'g');
      content = content.replace(regex, '');
    }
  }
  fs.writeFileSync(doctorsFile, content);
  console.log('Done updating doctors.ts');
}

run();
