const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://rjityxezckvvhfqcdsjt.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function runMigration() {
  if (!SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment')
    process.exit(1)
  }

  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '20260713_create_notifications.sql'),
    'utf-8'
  )

  console.log('Executing migration...')

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!response.ok) {
    // Try alternative: direct SQL execution via Supabase SQL API
    console.log('Primary endpoint failed, trying SQL endpoint...')

    const sqlResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    const sqlResult = await sqlResponse.text()
    console.log('SQL endpoint response:', sqlResponse.status, sqlResult)

    if (!sqlResponse.ok) {
      console.log('Trying final fallback via PostgREST...')

      // Check if table already exists by querying it
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
      const { data, error } = await supabase.from('notificaciones').select('id').limit(1)

      if (error && error.code === '42P01') {
        console.log('Table does not exist. Attempting creation via REST...')
        console.log('ERROR: Cannot create table via REST API. Please run the SQL manually in Supabase dashboard.')
        console.log('Migration file: supabase/migrations/20260713_create_notifications.sql')
        process.exit(1)
      } else if (error) {
        console.log('Table query error (may already exist):', error.message)
        process.exit(0)
      } else {
        console.log('Table already exists and is accessible.')
        process.exit(0)
      }
    }

    console.log('Migration executed successfully via SQL endpoint')
    process.exit(0)
  }

  const result = await response.json()
  console.log('Migration result:', result)
  console.log('Migration executed successfully')
}

runMigration().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
