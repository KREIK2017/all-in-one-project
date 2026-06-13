const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET dashboard stats
router.get('/', async (req, res) => {
  try {
    // 1. Open Tickets count
    const [[{ openTickets }]] = await pool.query("SELECT COUNT(*) as openTickets FROM tickets WHERE status != 'COMPLETED' AND status != 'CLOSED'");
    
    // 2. Hours this week (total duration_minutes / 60)
    const [[{ totalMinutes }]] = await pool.query(`
      SELECT SUM(duration_minutes) as totalMinutes 
      FROM time_entries 
      WHERE start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    // 3. Top Project name
    const [[topProject]] = await pool.query(`
      SELECT p.name 
      FROM time_entries te 
      JOIN projects p ON te.project_id = p.id 
      GROUP BY p.id 
      ORDER BY SUM(te.duration_minutes) DESC 
      LIMIT 1
    `);
    
    // 4. Active Users (users who had activity in last 24h or have active timer)
    const [[{ activeUsers }]] = await pool.query(`
       SELECT COUNT(DISTINCT user_id) as activeUsers FROM (
         SELECT user_id FROM activity WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
         UNION
         SELECT user_id FROM active_timers
       ) as active
    `);

    // 5. Chart Data (hours per day for last 7 days)
    const [chartData] = await pool.query(`
      SELECT DATE_FORMAT(start_time, '%Y-%m-%d') as date, SUM(duration_minutes)/60 as hours
      FROM time_entries 
      WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(start_time)
      ORDER BY date ASC
    `);

    res.json({
      openTickets: openTickets || 0,
      totalHours: (totalMinutes / 60).toFixed(2) || "0.00",
      topProject: topProject?.name || "None",
      activeUsers: activeUsers || 0,
      chartData: chartData || []
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
