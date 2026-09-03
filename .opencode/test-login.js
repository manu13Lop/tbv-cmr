fetch('https://tbv-cmr.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@tbv.test', password: 'TbvTest2026!' }),
})
  .then((r) => r.json())
  .then((d) => console.log(JSON.stringify(d)))
  .catch((e) => console.error(e));
