const { Client } = require('pg');

// us-east-1 and us-west-1 resolve but fail - let's try more details
async function tryConnect(connStr) {
  const masked = connStr.replace(/:[^:@]+@/, ':***@');
  console.log(`\nTrying: ${masked}`);
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log('SUCCESS:', res.rows[0]);
    await client.end();
    return client;
  } catch (err) {
    console.log(`  Error code: ${err.code}`);
    console.log(`  Message: ${err.message}`);
    if (err.routine) console.log(`  Routine: ${err.routine}`);
    return null;
  }
}

async function main() {
  // Try more region variations
  const regions = [
    'us-east-1',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-central-1',
    'ap-southeast-1',
    'ap-northeast-1',
    'sa-east-1',
  ];

  for (const region of regions) {
    const conn = `postgresql://postgres.ufhlipsfkzwsswmllfek:TbvSupabase2026!@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    const result = await tryConnect(conn);
    if (result) {
      console.log(`\nWorking region: ${region}`);
      return;
    }
  }

  // Also try the format without region prefix
  const altConns = [
    `postgresql://postgres.ufhlipsfkzwsswmllfek:TbvSupabase2026!@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres:TbvSupabase2026!@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  ];
  for (const conn of altConns) {
    const result = await tryConnect(conn);
    if (result) return;
  }

  console.log('\nNo connection worked.');
}

main();
