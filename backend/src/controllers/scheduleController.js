const db = require("../config/db");

// GET /schedule?month=YYYY-MM
async function getSchedule(req, res, next) {
  try {
    const { month } = req.query; // e.g. "2025-01"

    const activities = await db.query(
      "SELECT * FROM schedule_activities ORDER BY sort_order, activity_name",
    );

    let recordsQuery = "SELECT * FROM schedule_records";
    let params = [];
    if (month) {
      recordsQuery += " WHERE TO_CHAR(date, 'YYYY-MM') = $1";
      params.push(month);
    }
    const records = await db.query(recordsQuery, params);

    res.json({
      activities: activities.rows,
      records: records.rows,
    });
  } catch (err) {
    next(err);
  }
}

// POST /schedule  — upsert a cell (date + activity)
async function upsertRecord(req, res, next) {
  try {
    const { date, activity_id, status } = req.body;
    if (!date || !activity_id || !status) {
      return res
        .status(400)
        .json({ error: "date, activity_id, status required" });
    }

    const { rows } = await db.query(
      `INSERT INTO schedule_records (date, activity_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (date, activity_id)
       DO UPDATE SET status = EXCLUDED.status
       RETURNING *`,
      [date, activity_id, status],
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /schedule/activities  — add custom activity
async function createActivity(req, res, next) {
  try {
    const { activity_name } = req.body;
    if (!activity_name)
      return res.status(400).json({ error: "activity_name required" });

    const maxOrder = await db.query(
      "SELECT COALESCE(MAX(sort_order),0) AS m FROM schedule_activities",
    );
    const { rows } = await db.query(
      "INSERT INTO schedule_activities (activity_name, sort_order) VALUES ($1, $2) RETURNING *",
      [activity_name, Number(maxOrder.rows[0].m) + 1],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /schedule/activities/:id
async function deleteActivity(req, res, next) {
  try {
    await db.query("DELETE FROM schedule_activities WHERE id = $1", [
      req.params.id,
    ]);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSchedule, upsertRecord, createActivity, deleteActivity };
