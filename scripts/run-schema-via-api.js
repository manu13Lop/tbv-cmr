const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://ufhlipsfkzwsswmllfek.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaGxpcHNma3p3c3N3bWxsZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA5ODAwNSwiZXhwIjoyMTAzNjc0MDA1fQ.eQmP6vr7Gc1GDtsOeI7WH3G3apNklVJPZVEqP1SQwkE'
);

async function run() {
  // First test connection
  console.log('Testing connection...');
  const { data, error } = await supabase.from('usuarios').select('*').limit(1);
  if (error) {
    console.log('Connection test result:', error.message);
  } else {
    console.log('Connection OK, usuarios table exists:', data);
  }

  // Try to create a simple function that can execute SQL
  console.log('Attempting to create exec_sql function...');

  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'full-schema.sql'), 'utf-8');

  // Split into individual statements and execute via RPC or direct queries
  // Actually, let's try calling a SQL function
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql });

  if (rpcError) {
    console.log('exec_sql not available:', rpcError.message);
    console.log('\nWill try creating tables via PostgREST...');

    // Try creating tables one at a time using the REST API
    // Actually, we can't create tables via REST API
    // We need to find the connection string

    // Try getting project info
    console.log('\nTrying to get connection info...');
    const { data: healthData, error: healthError } = await supabase.rpc('health');
    if (healthError) {
      console.log('Health check:', healthError.message);
    }
  } else {
    console.log('SQL executed successfully!');
  }
}

run().catch(console.error);
