
const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, '../local-ai/feature_brainstorm.json');
const features = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const updated = features.map(f => {
    let cat = 'General';
    if (f.title.includes('Strategy') || f.title.includes('Analysis')) cat = 'Strategy';
    else if (f.title.includes('Flight') || f.title.includes('Hotel') || f.title.includes('Rental')) cat = 'Logistics';
    else if (f.title.includes('Payroll') || f.title.includes('ROI')) cat = 'Financial';
    else if (f.title.includes('Maintenance') || f.title.includes('Inventory') || f.title.includes('Work Order')) cat = 'Shop Ops';
    else if (f.title.includes('Schedule') || f.title.includes('Calendar') || f.title.includes('Entry')) cat = 'Racing Ops';
    else if (f.title.includes('Waiver') || f.title.includes('Resume') || f.title.includes('Job')) cat = 'Documents';
    else if (f.title.includes('QR')) cat = 'Growth';

    return { ...f, category: cat, votes: Math.floor(Math.random() * 20) + 5 };
});

fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 4));
console.log("✅ Categorized " + updated.length + " features.");
