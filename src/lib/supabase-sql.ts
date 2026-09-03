const PROJECT_REF = 'ufhlipsfkzwsswmllfek';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

export async function execSQL(sql: string): Promise<unknown> {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
  if (!token) throw new Error('SUPABASE_MANAGEMENT_TOKEN not set');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`SQL error: ${JSON.stringify(data)}`);
  }
  return data;
}
