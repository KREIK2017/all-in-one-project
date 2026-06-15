const repo = require('../repositories/statsRepository');

module.exports = {
  async getDashboard() {
    // 5 незалежних запитів — виконуємо паралельно
    const [openTickets, totalMinutes, topProject, activeUsers, chartData] = await Promise.all([
      repo.countOpenTickets(),
      repo.sumMinutesLast7Days(),
      repo.topProjectName(),
      repo.countActiveUsers(),
      repo.hoursPerDayLast7Days(),
    ]);

    return {
      openTickets: openTickets || 0,
      totalHours: ((totalMinutes || 0) / 60).toFixed(2),
      topProject: topProject || 'None',
      activeUsers: activeUsers || 0,
      chartData: chartData || [],
    };
  },
};
