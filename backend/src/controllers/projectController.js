const { validationResult } = require('express-validator');
const pool = require('../config/db');

// GET /api/projects — all projects for current user
const getProjects = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.created_at, pm.role,
              p.created_by,
              (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ projects: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId
const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const projectResult = await pool.query(
      `SELECT p.*, pm.role as user_role
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       WHERE p.id = $2`,
      [req.user.id, projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_color, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.role DESC, pm.joined_at ASC`,
      [projectId]
    );

    res.json({
      project: projectResult.rows[0],
      members: membersResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const projectResult = await client.query(
        `INSERT INTO projects (name, description, created_by)
         VALUES ($1, $2, $3) RETURNING *`,
        [name.trim(), description?.trim() || null, req.user.id]
      );

      const project = projectResult.rows[0];

      // Creator becomes admin automatically
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'admin')`,
        [project.id, req.user.id]
      );

      await client.query('COMMIT');
      res.status(201).json({ message: 'Project created.', project });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/members — Admin only
const addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email, role = 'member' } = req.body;

    const userResult = await pool.query(
      'SELECT id, name, email, avatar_color FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User with this email not found.' });
    }

    const targetUser = userResult.rows[0];

    const existing = await pool.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, targetUser.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User is already a member of this project.' });
    }

    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`,
      [projectId, targetUser.id, role]
    );

    res.status(201).json({
      message: `${targetUser.name} added to project.`,
      member: { ...targetUser, role },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/members/:userId — Admin only
const removeMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Admins cannot remove themselves.' });
    }

    const result = await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found in this project.' });
    }

    res.json({ message: 'Member removed from project.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId — Admin only
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, getProject, createProject, addMember, removeMember, deleteProject };
