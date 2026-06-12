const db = require("../config/db");

// GET /topics  — returns subjects with their topics
async function getTopics(req, res, next) {
  try {
    const subjects = await db.query(
      "SELECT * FROM subjects ORDER BY sort_order, name",
    );
    const topics = await db.query(
      "SELECT * FROM topics ORDER BY subject_id, id",
    );

    const topicsBySubject = {};
    for (const t of topics.rows) {
      if (!topicsBySubject[t.subject_id]) topicsBySubject[t.subject_id] = [];
      topicsBySubject[t.subject_id].push(t);
    }

    const result = subjects.rows.map((s) => ({
      ...s,
      topics: topicsBySubject[s.id] || [],
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// PUT /topics/:id  — update a topic's status
async function updateTopic(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "in_progress", "completed", "skipped"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { rows } = await db.query(
      "UPDATE topics SET status = $1 WHERE id = $2 RETURNING *",
      [status, id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Topic not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /topics  — add a custom topic (Manage Mode)
async function createTopic(req, res, next) {
  try {
    const { id, subject_id, topic_name } = req.body;
    if (!id || !subject_id || !topic_name) {
      return res
        .status(400)
        .json({ error: "id, subject_id, topic_name required" });
    }
    const { rows } = await db.query(
      `INSERT INTO topics (id, subject_id, topic_name, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [id, subject_id, topic_name],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /topics/:id
async function deleteTopic(req, res, next) {
  try {
    await db.query("DELETE FROM topics WHERE id = $1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTopics, updateTopic, createTopic, deleteTopic };
