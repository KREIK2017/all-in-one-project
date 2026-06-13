const axios = require('axios');

async function checkAPI() {
  try {
    const baseURL = 'http://localhost:3001/api';
    
    console.log('--- Checking /api/stats ---');
    try {
      const stats = await axios.get(`${baseURL}/stats`);
      console.log('Stats:', JSON.stringify(stats.data, null, 2));
    } catch (e) {
      console.log('Stats Error:', e.response?.status, e.message);
    }

    console.log('\n--- Checking /api/tickets ---');
    try {
      const tickets = await axios.get(`${baseURL}/tickets`);
      console.log('Number of tickets:', tickets.data.length);
      if (tickets.data.length > 0) {
        console.log('First Ticket Keys:', Object.keys(tickets.data[0]));
        console.log('First Ticket Sample:', JSON.stringify(tickets.data[0], null, 2));
      }
    } catch (e) {
      console.log('Tickets Error:', e.response?.status, e.message);
    }

    console.log('\n--- Checking /api/time/active/1 ---');
    try {
      const active = await axios.get(`${baseURL}/time/active/1`);
      console.log('Active Timer:', JSON.stringify(active.data, null, 2));
    } catch (e) {
      console.log('Active Timer Error:', e.response?.status, e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

checkAPI();
