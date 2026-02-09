const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('📡 Inspecting listings columns...');
  
  // Try to insert a dummy row to provoke a schema error telling us the columns
  // or insert valid data if we match.
  const { error } = await supabase.from('listings').insert({
      id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      title: 'TEST_PROBE',
      description: 'TEST',
      type: 'job',
      price_range: 'TEST',
      origin_author_name: 'TEST'
  });

  if (error) {
      console.log('❌ Insert failed (reveals schema mismatch):', error.message);
      if (error.details) console.log('Details:', error.details);
      if (error.hint) console.log('Hint:', error.hint);
  } else {
      console.log('✅ Insert Success! Schema matches our expectations.');
      // Cleanup
      await supabase.from('listings').delete().eq('title', 'TEST_PROBE');
  }
})();
