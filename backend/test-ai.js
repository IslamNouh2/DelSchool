const fetch = require('node-fetch');

async function testAI() {
  try {
    const res = await fetch('http://localhost:3000/api/timetable/generate-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // We need a valid JWT token, which is hard.
        // Instead, let's just use Prisma to fetch the payload directly, same as the service!
      },
      body: JSON.stringify({ academicYear: '2024-2025' })
    });
    console.log(await res.text());
  } catch(e) { console.error(e); }
}
testAI();
