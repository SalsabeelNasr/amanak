const https = require('https');
const http = require('http');

const urls = [
  "https://eavla.org/wp-content/uploads/2020/02/Dr.-Rashad-Bishara.jpg",
  "https://medoc-prod.s3.amazonaws.com/files/public/a92f89ac-5ea2-487c-a2e1-babee8e6ac17.jpg",
  "https://drhusseinelwan.com/wp-content/uploads/2017/09/Dr-Hussein-Elwan.png",
  "https://www.sphinxcure.com/images/team/tamer.jpg",
  "https://macro.care/assets/images/doctors/dr-mohamed-saad-al-ashry.jpg",
  "https://maadipsychologycenter.com/wp-content/uploads/2021/05/Dr.-Nasser-Loza.jpg",
  "http://www.mhafez.net/images/about-img.jpg",
  "https://www.assih.com/storage/app/public/doctors/dr-mohamed-fawzy-khattab-1607519198.jpg",
  "https://pelvisandhip.com/wp-content/uploads/2023/07/fouad-zamel-sadek.jpg",
  "https://egyptianivfcenter.com/wp-content/uploads/2021/04/Dr-Mohamed-Aboulghar.jpg",
  "https://www.bedayahospitals.com/images/doctors/dr-maged-adel.jpg",
  "https://drsemna.com/wp-content/uploads/2021/08/dr-mahmoud-zakaria.jpg",
  "https://dryasserbadi.net/wp-content/uploads/2023/02/dr-yasser-badi.jpg",
  "https://mohamed-taw-fik-doctor.com/wp-content/uploads/2023/05/dr-mohamed-abdallah-tawfik.jpg",
  "https://www.dentalexpresscenter.com/wp-content/uploads/2023/08/dr-john-elia.jpg",
  "https://wondersdentistry.com/wp-content/uploads/2023/09/dr-ahmed-saeed.jpg",
  "https://www.hairegypt.net/wp-content/uploads/2021/03/dr-shady-el-maghraby.jpg",
  "https://www.nour-clinic.com/wp-content/uploads/2021/05/dr-marwan-noureldin.jpg",
  "https://drahmedrezk.com/wp-content/uploads/2023/04/dr-ahmed-rezk.jpg",
  "https://mohamedelghanam.com/wp-content/uploads/2023/06/dr-mohamed-al-ghannam.jpg",
  "https://misrconnect.com/uploads/profiles/1152/dr-hossam-fathi.jpg",
  "https://eyecairo.com/wp-content/uploads/2021/02/dr-ahmad-khalil.jpg",
  "https://drhazemhelmy.com/wp-content/uploads/2023/01/dr-hazem-helmy.jpg",
  "https://neurologyacademy.org/images/profiles/prof-magd-zakaria.jpg",
  "https://www.ahmedelbassiouny.com/wp-content/uploads/2023/08/prof-ahmed-elbassiouny.jpg",
  "https://en.coreclinics.com/wp-content/uploads/2023/07/dr-walid-elhalaby.jpg",
  "https://alfacurecenter.com/wp-content/uploads/2021/05/Prof.-Hesham-ElGhazaly.jpg",
  "https://www.cairocure.com/images/doctors/Dr.-Hatem-A.-Azim.jpg",
  "https://www.mohamedmohieldin.com/wp-content/uploads/2021/08/Prof.-Mohamed-Mohi-Eldin.jpg",
  "https://drmohamedhossam.com/wp-content/uploads/2021/09/Dr.-Mohamed-Hossam.jpg"
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, status: res.statusCode, type: res.headers['content-type'] });
    }).on('error', (e) => {
      resolve({ url, status: 'ERROR', error: e.message });
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT' });
    });
  });
}

async function run() {
  for (const url of urls) {
    const result = await checkUrl(url);
    console.log(`${result.status} | ${result.type} | ${result.url}`);
  }
}

run();
