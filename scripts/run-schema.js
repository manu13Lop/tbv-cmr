const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Try multiple connection string formats
const CONNECTIONS = [
  'postgresql://postgres.ufhlipsfkzwsswmllfek:TbvSupabase2026!@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.ufhlipsfkzwsswmllfek:TbvSupabase2026!@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.ufhlipsfkzwsswmllfek:TbvSupabase2026!@aws-0.eu-west-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.ufhlipsfkzwsswmllfek:TbvSupabase2026!@aws-0.eu-central-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres:TbvSupabase2026!@db.ufhlipsfkzwsswmllfek.supabase.co:5432/postgres',
];

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'full-schema.sql'), 'utf-8');

  let client = null;

  for (const connStr of CONNECTIONS) {
    const masked = connStr.replace(/:[^:@]+@/, ':***@');
    console.log(`Trying: ${masked}`);
    client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    try {
      await client.connect();
      console.log('CONNECTED!');
      break;
    } catch (err) {
      console.log(`  Failed: ${err.code || err.message}`);
      client = null;
    }
  }

  if (!client) {
    console.error('\nCannot connect from this machine. DNS is broken for database hostnames.');
    console.error('Need to run SQL via Supabase SQL Editor instead.');
    process.exit(1);
  }

  try {
    console.log('Executing full schema...');
    await client.query(sql);
    console.log('SCHEMA CREATED SUCCESSFULLY!');
  } catch (err) {
    console.error('Schema error:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
  } finally {
    await client.end();
  }
}

run();
