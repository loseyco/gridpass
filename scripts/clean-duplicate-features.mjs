// scripts/clean-duplicate-features.mjs
// Clean duplicate feature records from Firestore features collection
import { execSync } from 'child_process';
import fs from 'fs';

async function cleanDuplicateFeatures() {
  console.log('==================================================');
  console.log('🧹 CLEANING DUPLICATE FEATURE RECORDS IN FIRESTORE');
  console.log('==================================================\n');

  try {
    execSync('node db-inspect.mjs features', { encoding: 'utf-8' });
    const reportPath = 'scratch/db_report.json';
    if (!fs.existsSync(reportPath)) {
      console.error('No db report found.');
      return;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const featuresDocs = report.features || [];
    console.log(`Fetched ${featuresDocs.length} total feature documents.`);

    const seenKeys = new Set();
    const duplicateIds = [];

    featuresDocs.forEach((doc) => {
      const key = `${doc.module_key || doc.route_path || doc.name}`;
      if (seenKeys.has(key)) {
        duplicateIds.push(doc.id);
      } else {
        seenKeys.add(key);
      }
    });

    console.log(`Found ${duplicateIds.length} duplicate feature documents.`);
    console.log(`Unique features retained: ${seenKeys.size}`);

    console.log('\n==================================================');
    console.log('✅ DUPLICATE CLEANUP ANALYSIS COMPLETE');
    console.log('==================================================');
  } catch (err) {
    console.error('Error cleaning duplicates:', err);
  }
}

cleanDuplicateFeatures();
