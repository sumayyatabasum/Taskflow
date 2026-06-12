const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");

const { signup, login, getMe } = require("../controllers/authController");
const { getDashboardStats } = require("../controllers/dashboardController");
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} = require("../controllers/todoController");
const {
  getTopics,
  updateTopic,
  createTopic,
  deleteTopic,
} = require("../controllers/topicController");
const {
  getSchedule,
  upsertRecord,
  createActivity,
  deleteActivity,
} = require("../controllers/scheduleController");
const { getNotes, updateNotes } = require("../controllers/notesController");

const router = express.Router();

// ── Auth ────────────────────────────────────────────────────────────────────
router.post(
  "/auth/signup",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  signup,
);

router.post(
  "/auth/login",
  [body("email").isEmail(), body("password").notEmpty()],
  login,
);

router.get("/auth/me", authenticate, getMe);

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get("/dashboard", getDashboardStats); // no auth needed for single-user

// ── Todos ─────────────────────────────────────────────────────────────────────
router.get("/todos", getTodos);
router.post(
  "/todos",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("priority").optional().isIn(["low", "medium", "high"]),
  ],
  createTodo,
);
router.put("/todos/:id", updateTodo);
router.delete("/todos/:id", deleteTodo);

// ── Topics ────────────────────────────────────────────────────────────────────
router.get("/topics", getTopics);
router.post("/topics", createTopic);
router.put("/topics/:id", updateTopic);
router.delete("/topics/:id", deleteTopic);

// ── Schedule ──────────────────────────────────────────────────────────────────
router.get("/schedule", getSchedule);
router.post("/schedule", upsertRecord);
router.post("/schedule/activities", createActivity);
router.delete("/schedule/activities/:id", deleteActivity);

// ── Notes ─────────────────────────────────────────────────────────────────────
router.get("/notes", getNotes);
router.put("/notes", updateNotes);

module.exports = router;
