const pool = require('../config/db');

// GET /api/dashboard — global stats for current user
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Total tasks across all user's projects
    const totalTasksResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1`,
      [userId]
    );

    // Tasks by status
    const tasksByStatusResult = await pool.query(
      `SELECT t.status, COUNT(*) AS count
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
       GROUP BY t.status`,
      [userId]
    );

    // Tasks per user (for projects where current user is admin)
    const tasksPerUserResult = await pool.query(
      `SELECT u.id, u.name, u.avatar_color, COUNT(t.id) AS task_count
       FROM users u
       JOIN tasks t ON t.assigned_to = u.id
       JOIN project_members admin_pm ON admin_pm.project_id = t.project_id
         AND admin_pm.user_id = $1 AND admin_pm.role = 'admin'
       GROUP BY u.id, u.name, u.avatar_color
       ORDER BY task_count DESC
       LIMIT 10`,
      [userId]
    );

    // Overdue tasks
    const overdueResult = await pool.query(
      `SELECT t.id, t.title, t.due_date, t.priority, t.project_id, p.name AS project_name,
              u.name AS assigned_to_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.due_date < CURRENT_DATE AND t.status != 'done'
       ORDER BY t.due_date ASC
       LIMIT 10`,
      [userId]
    );

    // Projects summary
    const projectsResult = await pool.query(
      `SELECT p.id, p.name, pm.role,
              COUNT(t.id) AS total_tasks,
              COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS done_tasks
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id, p.name, pm.role
       ORDER BY p.created_at DESC`,
      [userId]
    );

    // My assigned tasks
    const myTasksResult = await pool.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, p.name AS project_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.assigned_to = $1 AND t.status != 'done'
       ORDER BY t.due_date ASC NULLS LAST
       LIMIT 5`,
      [userId]
    );

    const statusMap = { todo: 0, in_progress: 0, done: 0 };
    tasksByStatusResult.rows.forEach(row => {
      statusMap[row.status] = parseInt(row.count);
    });

    res.json({
      totalTasks: parseInt(totalTasksResult.rows[0].total),
      tasksByStatus: statusMap,
      tasksPerUser: tasksPerUserResult.rows,
      overdueTasks: overdueResult.rows,
      projects: projectsResult.rows,
      myPendingTasks: myTasksResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats };
