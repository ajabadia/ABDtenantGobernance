import fs from 'fs';

const en = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('./messages/es.json', 'utf8'));

// Walk both structures in parallel, collecting all paths and values
function walk(obj, path = '', collect = []) {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string') {
      collect.push({ path: fullPath, key, value });
    } else if (value !== null && typeof value === 'object') {
      walk(value, fullPath, collect);
    }
  }
  return collect;
}

const enEntries = walk(en);
const esEntries = walk(es);

// Build key->paths map to find duplicates
const keyToEnPaths = {};
for (const entry of enEntries) {
  if (!keyToEnPaths[entry.key]) keyToEnPaths[entry.key] = [];
  keyToEnPaths[entry.key].push(entry);
}

// Find duplicate keys (appear in multiple paths)
const duplicateKeys = Object.entries(keyToEnPaths)
  .filter(([, paths]) => paths.length > 1)
  .map(([key, paths]) => ({ key, count: paths.length, paths }));

console.log('='.repeat(80));
console.log('DUPLICATE KEY ANALYSIS');
console.log('='.repeat(80));

let suspiciousCount = 0;
for (const dup of duplicateKeys) {
  // Check if all values are identical
  const uniqueValues = [...new Set(dup.paths.map(p => p.value))];
  if (uniqueValues.length === 1) {
    console.log(`\n⚠️ KEY "${dup.key}" appears ${dup.count}x — ALL have SAME value: "${uniqueValues[0].substring(0, 60)}"`);
    for (const p of dup.paths) {
      console.log(`  → ${p.path}`);
    }
    suspiciousCount++;
  }
}

console.log('');
console.log('='.repeat(80));
console.log('SUSPICIOUS VALUES (look like English generic text)');
console.log('='.repeat(80));

// Values that look overly generic/repeated
const genericPatterns = [
  'Spaces Hierarchy',
  'Structured management of areas and departments',
];

for (const entry of enEntries) {
  for (const pattern of genericPatterns) {
    if (entry.value.includes(pattern)) {
      // Find Spanish equivalent
      const esEntry = esEntries.find(e => e.path === entry.path);
      const esVal = esEntry ? esEntry.value : 'N/A';
      // Only flag if Spanish value is DIFFERENT (meaning overwrite happened)
      if (esEntry && esEntry.value !== entry.value) {
        const esWords = esEntry.value.split(' ').length;
        const enWords = entry.value.split(' ').length;
        // Flag if English is much shorter (likely generic overwrite) 
        // or if English doesn't match the Spanish topic
        console.log(`\n⚠️  ${entry.path}`);
        console.log(`   EN: "${entry.value.substring(0, 80)}"`);
        console.log(`   ES: "${esEntry.value.substring(0, 80)}"`);
      }
      break;
    }
  }
}

console.log('');
console.log('='.repeat(80));
console.log('SECTION-BY-SECTION ANALYSIS');
console.log('='.repeat(80));

const sections = Object.keys(en);
for (const section of sections) {
  if (typeof en[section] !== 'object') continue;
  
  const sectionEn = walk(en[section], section);
  const sectionEs = walk(es[section], section);
  
  // Check if title/subtitle are generic
  const titleEn = sectionEn.find(e => e.path.endsWith('.title'));
  const subtitleEn = sectionEn.find(e => e.path.endsWith('.subtitle'));
  
  if (titleEn && titleEn.value === 'Spaces Hierarchy') {
    const titleEs = sectionEs.find(e => e.path === titleEn.path);
    console.log(`\n📌 ${section}: title is generic`);
    console.log(`   EN: "${titleEn.value}"`);
    console.log(`   ES: "${titleEs?.value || 'N/A'}"`);
  }
  if (subtitleEn && subtitleEn.value === 'Structured management of areas and departments') {
    const subtitleEs = sectionEs.find(e => e.path === subtitleEn.path);
    console.log(`\n📌 ${section}: subtitle is generic`);
    console.log(`   EN: "${subtitleEn.value}"`);
    console.log(`   ES: "${subtitleEs?.value || 'N/A'}"`);
  }
}

console.log('');
console.log('='.repeat(80));
console.log('KEYS WITH SUSPICIOUSLY SHORT ENGLISH VALUES');
console.log('='.repeat(80));

// Find keys where English is UPPERCASE but Spanish is normal (might be wrong)
for (const entry of enEntries) {
  if (entry.value.length < 5) continue;
  const upperCount = (entry.value.match(/[A-Z]/g) || []).length;
  const totalLetters = (entry.value.match(/[a-zA-Z]/g) || []).length;
  if (totalLetters > 0 && upperCount / totalLetters > 0.7) {
    const esEntry = esEntries.find(e => e.path === entry.path);
    if (esEntry) {
      const esUpperCount = (esEntry.value.match(/[A-ZÁÉÍÓÚÜÑ]/g) || []).length;
      const esTotalLetters = (esEntry.value.match(/[a-zA-ZÁÉÍÓÚÜÑáéíóúü]/g) || []).length;
      if (esTotalLetters > 0 && esUpperCount / esTotalLetters < 0.5) {
        console.log(`\n⚠️  ${entry.path}`);
        console.log(`   EN: "${entry.value}"`);
        console.log(`   ES: "${esEntry.value}"`);
      }
    }
  }
}

console.log('\n✅ Analysis complete.');
console.log(`Total EN entries: ${enEntries.length}`);
console.log(`Total ES entries: ${esEntries.length}`);
console.log(`Duplicate keys found: ${duplicateKeys.length}`);
console.log(`Suspicious generic values: ${suspiciousCount}`);
