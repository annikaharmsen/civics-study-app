// Builds zip-districts.json: a compact map of ZIP (ZCTA) -> "ST-District".
// Source: U.S. Census Bureau 2020 ZCTA-to-Congressional-District relationship file.
// Run by .github/workflows/update-zip-districts.yml (server-side; no browser CORS/key).
import fs from 'node:fs';

const FIPS = {'01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE',
  '11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS',
  '21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO',
  '30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX',
  '49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'};

// Try the newest Congress first, fall back to the prior one.
const URLS = [
  'https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_cd119_natl.txt',
  'https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_cd118_natl.txt',
];

async function getText(){
  for(const u of URLS){
    try{
      const r = await fetch(u);
      if(r.ok){ console.log('using', u); return await r.text(); }
      console.log('skip', r.status, u);
    }catch(e){ console.log('error', u, e.message); }
  }
  throw new Error('No Census relationship file was reachable.');
}

const txt = await getText();
const lines = txt.split(/\r?\n/);
const header = lines[0].split('|');
const col = re => header.findIndex(h => re.test(h));
const ziCol = col(/GEOID_ZCTA5/i);
const cdCol = col(/GEOID_CD\d+/i);
const areaCol = col(/AREALAND_PART/i);
if(ziCol < 0 || cdCol < 0 || areaCol < 0)
  throw new Error('Expected columns not found. Header: ' + header.join(','));

// For ZIPs spanning multiple districts, keep the one with the largest land overlap.
const best = {};
for(let i=1;i<lines.length;i++){
  const ln = lines[i]; if(!ln) continue;
  const f = ln.split('|');
  const z = f[ziCol], cd = f[cdCol], area = +f[areaCol] || 0;
  if(!z || !cd) continue;
  if(!best[z] || area > best[z].area) best[z] = {area, cd};
}

const out = {};
let kept = 0, skipped = 0;
for(const z in best){
  const cd = best[z].cd;                 // 4 chars: SSdd
  const fips = cd.slice(0,2);
  const abbr = FIPS[fips];
  if(!abbr){ skipped++; continue; }      // territories / unknown -> not in the state picker
  let dist = cd.slice(2);
  if(dist === '00' || fips === '11') dist = 'AL';   // at-large / DC delegate
  else dist = String(parseInt(dist, 10));
  out[z] = abbr + '-' + dist;
  kept++;
}

fs.writeFileSync('zip-districts.json', JSON.stringify(out));
console.log('wrote zip-districts.json:', kept, 'ZIPs kept,', skipped, 'skipped');
