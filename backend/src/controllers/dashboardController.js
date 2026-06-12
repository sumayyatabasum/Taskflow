const db = require("../config/db");

async function getDashboardStats(req, res, next) {
  try {
    // Todos
    const todosResult = await db.query("SELECT status FROM todos");
    const todos = todosResult.rows;
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t) => t.status === "completed").length;
    const pendingTodos = totalTodos - completedTodos;

    // Topics
    const topicsResult = await db.query("SELECT status FROM topics");
    const topics = topicsResult.rows;
    const totalTopics = topics.length;
    const completedTopics = topics.filter(
      (t) => t.status === "completed",
    ).length;
    const inProgressTopics = topics.filter(
      (t) => t.status === "in_progress",
    ).length;
    const skippedTopics = topics.filter((t) => t.status === "skipped").length;

    // Subject-wise progress
    const subjectProgress = await db.query(`
      SELECT s.id, s.name,
        COUNT(t.id) AS total,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed
      FROM subjects s
      LEFT JOIN topics t ON t.subject_id = s.id
      GROUP BY s.id, s.name
      ORDER BY s.sort_order, s.name
    `);

    // Schedule — last 30 days consistency
    const scheduleResult = await db.query(`
      SELECT date, status FROM schedule_records
      WHERE date >= NOW() - INTERVAL '30 days'
      ORDER BY date DESC
    `);
    const scheduleRecords = scheduleResult.rows;
    const totalCells = scheduleRecords.length;
    const completedCells = scheduleRecords.filter(
      (r) => r.status === "completed",
    ).length;
    const consistencyPct =
      totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;

    // Study streak (consecutive days with ≥1 completed activity)
    const streakResult = await db.query(`
      SELECT DISTINCT date::date AS d
      FROM schedule_records
      WHERE status = 'completed'
      ORDER BY d DESC
    `);
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < streakResult.rows.length; i++) {
      const rowDate = new Date(streakResult.rows[i].d);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (rowDate.toDateString() === expected.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    // Daily progress = completed todos today + completed schedule cells today
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTodos = await db.query(
      "SELECT COUNT(*) AS c FROM todos WHERE status='completed' AND created_at::date = $1",
      [todayStr],
    );
    const todaySchedule = await db.query(
      "SELECT COUNT(*) AS c FROM schedule_records WHERE status='completed' AND date = $1",
      [todayStr],
    );
    const dailyCompleted =
      Number(todayTodos.rows[0].c) + Number(todaySchedule.rows[0].c);

    // Weekly consistency (last 7 days — ratio of completed to total cells)
    const weekResult = await db.query(`
      SELECT
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS done,
        COUNT(*) AS total
      FROM schedule_records
      WHERE date >= NOW() - INTERVAL '7 days'
    `);
    const weekDone = Number(weekResult.rows[0].done) || 0;
    const weekTotal = Number(weekResult.rows[0].total) || 0;
    const weeklyConsistency =
      weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

    // Monthly consistency (current month)
    const monthResult = await db.query(`
      SELECT
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS done,
        COUNT(*) AS total
      FROM schedule_records
      WHERE TO_CHAR(date,'YYYY-MM') = TO_CHAR(NOW(),'YYYY-MM')
    `);
    const monthDone = Number(monthResult.rows[0].done) || 0;
    const monthTotal = Number(monthResult.rows[0].total) || 0;
    const monthlyConsistency =
      monthTotal > 0 ? Math.round((monthDone / monthTotal) * 100) : 0;

    // Consistency trend — last 30 days per-day pct
    const trendResult = await db.query(`
      SELECT
        date::date AS d,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*),0) * 100 AS pct
      FROM schedule_records
      WHERE date >= NOW() - INTERVAL '30 days'
      GROUP BY date::date
      ORDER BY d ASC
    `);

    res.json({
      todos: {
        total: totalTodos,
        completed: completedTodos,
        pending: pendingTodos,
      },
      topics: {
        total: totalTopics,
        completed: completedTopics,
        inProgress: inProgressTopics,
        skipped: skippedTopics,
      },
      subjectProgress: subjectProgress.rows,
      consistency: {
        last30Days: consistencyPct,
        weekly: weeklyConsistency,
        monthly: monthlyConsistency,
      },
      streak,
      dailyCompleted,
      consistencyTrend: trendResult.rows.map((r) => ({
        date: r.d,
        pct: Math.round(Number(r.pct)),
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats };
