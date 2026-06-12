/**
 * Seed script — run once after applying schema.sql
 * Usage: node src/scripts/seedSyllabus.js
 *
 * Reads the GATE DA syllabus from public data and inserts subjects + topics.
 */
require("dotenv").config();
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const syllabusPath = path.join(
  __dirname,
  "../../../frontend/public/data/syllabus.json",
);

async function seed() {
  const syllabus = JSON.parse(fs.readFileSync(syllabusPath, "utf-8"));
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (let i = 0; i < syllabus.length; i++) {
      const subject = syllabus[i];

      // Upsert subject
      await client.query(
        `INSERT INTO subjects (id, name, sort_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order`,
        [subject.id, subject.name, i + 1],
      );

      // Upsert topics
      for (const topic of subject.topics) {
        await client.query(
          `INSERT INTO topics (id, subject_id, topic_name, status)
           VALUES ($1, $2, $3, 'pending')
           ON CONFLICT (id) DO NOTHING`,
          [topic.id, subject.id, topic.name],
        );
      }
    }

    await client.query("COMMIT");
    console.log("✅ Syllabus seeded successfully");
    console.log(`   ${syllabus.length} subjects`);
    console.log(
      `   ${syllabus.reduce((a, s) => a + s.topics.length, 0)} topics`,
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
