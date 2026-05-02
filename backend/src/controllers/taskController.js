const { validationResult } = require('express-validator');
const pool = require('../config/db');

// GET /api/projects/:projectId/tasks
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo } = req.query;

    let query = `
      SELECT t.*, 
             u.name AS assigned_to_name, u.email AS assigned_to_email, u.avatar_color AS assigned_to_color,
             c.name AS created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.project_id = $1
    `;
    const params = [projectId];
    let idx = 2;

    if (status) { query += ` AND t.status = $${idx++}`; params.push(status); }
    if (priority) { query += ` AND t.priority = $${idx++}`; params.push(priority); }
    if (assignedTo) { query += ` AND t.assigned_to = $${idx++}`; params.push(assignedTo); }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/tasks/:taskId
const getTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const result = await pool.query(
      `SELECT t.*, 
              u.name AS assigned_to_name, u.email AS assigned_to_email, u.avatar_color AS assigned_to_color,
              c.name AS created_by_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN users c ON c.id = t.created_by
       WHERE t.id = $1 AND t.project_id = $2`,
      [taskId, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/tasks — Admin only
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { projectId } = req.params;
    const { title, description, dueDate, priority = 'medium', assignedTo } = req.body;

    // Validate assignee is a project member if provided
    if (assignedTo) {
      const memberCheck = await pool.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, assignedTo]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assignee must be a member of this project.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, due_date, priority, project_id, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title.trim(), description?.trim() || null, dueDate || null, priority, projectId, req.user.id, assignedTo || null]
    );

    res.status(201).json({ message: 'Task created.', task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId/tasks/:taskId
const updateTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    // Members can only update status of their own tasks
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [taskId, projectId]);
    if (taskResult.rows.length === 0) return res.status(404).json({ error: 'Task not found.' });

    const task = taskResult.rows[0];
    const isAdmin = req.userRole === 'admin';
    const isAssignee = task.assigned_to === req.user.id;

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you.' });
    }

    // Members can only update status
    const updates = {};
    if (status) updates.status = status;
    if (isAdmin) {
      if (title) updates.title = title.trim();
      if (description !== undefined) updates.description = description?.trim() || null;
      if (priority) updates.priority = priority;
      if (dueDate !== undefined) updates.due_date = dueDate || null;
      if (assignedTo !== undefined) updates.assigned_to = assignedTo || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = [...Object.values(updates), taskId, projectId];

    const result = await pool.query(
      `UPDATE tasks SET ${setClause} WHERE id = $${values.length - 1} AND project_id = $${values.length} RETURNING *`,
      values
    );

    res.json({ message: 'Task updated.', task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/tasks/:taskId — Admin only
const deleteTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND project_id = $2 RETURNING id',
      [taskId, projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found.' });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
