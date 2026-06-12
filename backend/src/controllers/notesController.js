const db = require("../config/db");

async function getNotes(req, res, next) {
  try {
    const { rows } = await db.query("SELECT * FROM notes WHERE id = 1");
    res.json(rows[0] || { id: 1, content: "", updated_at: new Date() });
  } catch (err) {
    next(err);
  }
}

async function updateNotes(req, res, next) {
  try {
    const { content } = req.body;
    const { rows } = await db.query(
      "UPDATE notes SET content = $1 WHERE id = 1 RETURNING *",
      [content ?? ""],
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotes, updateNotes };
