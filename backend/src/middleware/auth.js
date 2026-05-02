const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, name, email, avatar_color FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Check if user is admin of a specific project
const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const result = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this project.' });
    }

    if (result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    req.userRole = 'admin';
    next();
  } catch (err) {
    next(err);
  }
};

// Attach user's role in project to req (for conditional logic)
const attachProjectRole = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const result = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this project.' });
    }

    req.userRole = result.rows[0].role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireProjectAdmin, attachProjectRole };
