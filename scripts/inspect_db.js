const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('📡 Inspecting Supabase Tables...');
  
  // Method 1: List tables via rpc (if available) or by querying known ones
  const tablesToCheck = ['listings', 'scraped_listings', 'scraped_candidates', 'classifieds', 'shadow_profiles'];
  
  for (const table of tablesToCheck) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
          console.log(`❌ Table '${table}' NOT found (or error):`, error.message);
      } else {
          console.log(`✅ Table '${table}' EXISTS with ${count} rows.`);
      }
  }
})();
