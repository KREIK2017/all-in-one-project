const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function checkAPI() {
  const baseURL = 'http://localhost:3001/api';
  
  console.log('--- Checking /api/stats ---');
  const stats = await get(`${baseURL}/stats`);
  console.log('Status:', stats.status);
  console.log('Data:', JSON.stringify(stats.data, null, 2));

  console.log('\n--- Checking /api/tickets ---');
  const tickets = await get(`${baseURL}/tickets`);
  console.log('Status:', tickets.status);
  if (Array.isArray(tickets.data)) {
    console.log('Count:', tickets.data.length);
    tickets.data.forEach(t => {
      console.log(`ID: ${t.id}, Subject: "${t.subject}", Project: "${t.project_name}"`);
    });
  }

  console.log('\n--- Checking /api/time/active/1 ---');
  const active = await get(`${baseURL}/time/active/1`);
  console.log('Status:', active.status);
  console.log('Data:', JSON.stringify(active.data, null, 2));

  process.exit(0);
}

checkAPI().catch(console.error);
