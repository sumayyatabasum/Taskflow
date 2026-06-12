const { validationResult } = require("express-validator");
const db = require("../config/db");

// GET /todos
async function getTodos(req, res, next) {
  try {
    const { rows } = await db.query(
      "SELECT * FROM todos ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /todos
async function createTodo(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const { title, priority = "medium", deadline } = req.body;
    const { rows } = await db.query(
      `INSERT INTO todos (title, priority, deadline)
       VALUES ($1, $2, $3) RETURNING *`,
      [title, priority, deadline || null],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /todos/:id
async function updateTodo(req, res, next) {
  try {
    const { id } = req.params;
    const { title, priority, deadline, status } = req.body;

    const { rows } = await db.query(
      `UPDATE todos
       SET title = COALESCE($1, title),
           priority = COALESCE($2, priority),
           deadline = COALESCE($3, deadline),
           status = COALESCE($4, status)
       WHERE id = $5 RETURNING *`,
      [title, priority, deadline, status, id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Todo not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /todos/:id
async function deleteTodo(req, res, next) {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM todos WHERE id = $1", [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
