import fs from 'fs';

// Read both files
const esContent = fs.readFileSync('./messages/es.json', 'utf8');
const enContent = fs.readFileSync('./messages/en.json', 'utf8');

// Parse es.json for structure (it's valid)
let esData;
try {
  esData = JSON.parse(esContent);
  console.log('es.json parsed OK');
} catch (e) {
  console.error('es.json parse failed:', e.message);
  process.exit(1);
}

// Try to extract values from en.json by brute force:
// Find all string key-value pairs
function extractKeyValues(content) {
  const result = {};
  // Match patterns like "key": "value"  or  "key": { }
  const regex = /"([^"]+)"\s*:\s*("([^"]*)"|true|false|null|\d+|\{)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const value = match[2];
    // Only capture simple string values
    if (value.startsWith('"') && value.endsWith('"')) {
      result[key] = value.slice(1, -1);
    }
  }
  return result;
}

const enValues = extractKeyValues(enContent);
console.log(`Extracted ${Object.keys(enValues).length} string values from en.json`);

// Walk the es.json structure and replace values with English equivalents
function walkAndReplace(obj, path = '') {
  if (typeof obj === 'string') {
    // Try to find English equivalent
    const key = path.split('.').pop();
    if (enValues[key] !== undefined) {
      return enValues[key];
    }
    // Keep the Spanish value as fallback
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item, idx) => walkAndReplace(item, `${path}[${idx}]`));
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = walkAndReplace(value, path ? `${path}.${key}` : key);
    }
    return result;
  }
  return obj;
}

const rebuiltEnData = walkAndReplace(esData);

// Write the rebuilt file
fs.writeFileSync('./messages/en.json', JSON.stringify(rebuiltEnData, null, 4) + '\n', 'utf8');
console.log('en.json rewritten successfully');

// Verify the result
try {
  JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
  console.log('en.json is now VALID JSON');
} catch (e) {
  console.error('en.json still INVALID:', e.message);
}
