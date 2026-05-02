const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireProjectAdmin, attachProjectRole } = require('../middleware/auth');
const { signup, login, getMe } = require('../controllers/authController');
const { getProjects, getProject, createProject, addMember, removeMember, deleteProject } = require('../controllers/projectController');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();

// ── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], signup);

router.post('/auth/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], login);

router.get('/auth/me', authenticate, getMe);

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', authenticate, getDashboardStats);

// ── Projects ─────────────────────────────────────────────────────────────────
router.get('/projects', authenticate, getProjects);
router.post('/projects', authenticate, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
], createProject);
router.get('/projects/:projectId', authenticate, attachProjectRole, getProject);
router.delete('/projects/:projectId', authenticate, requireProjectAdmin, deleteProject);

// Project members (admin only)
router.post('/projects/:projectId/members', authenticate, requireProjectAdmin, addMember);
router.delete('/projects/:projectId/members/:userId', authenticate, requireProjectAdmin, removeMember);

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.get('/projects/:projectId/tasks', authenticate, attachProjectRole, getTasks);
router.get('/projects/:projectId/tasks/:taskId', authenticate, attachProjectRole, getTask);
router.post('/projects/:projectId/tasks', authenticate, requireProjectAdmin, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
], createTask);
router.patch('/projects/:projectId/tasks/:taskId', authenticate, attachProjectRole, updateTask);
router.delete('/projects/:projectId/tasks/:taskId', authenticate, requireProjectAdmin, deleteTask);

module.exports = router;
