const fs = require('fs');
try {
    const raw = fs.readFileSync('available_models.json', 'utf16le'); // Try utf16le
    const json = JSON.parse(raw);
    console.log('MODELS:');
    json.models.forEach(m => console.log(m.name));
} catch (e) {
    console.error('Error reading available_models.json:', e.message);
}
