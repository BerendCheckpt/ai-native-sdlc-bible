'use strict';

// Rebuilds the SQLite database from content/. Usage: npm run seed
// DB_PATH overrides the target file (default data/bible.db).

const fs = require('node:fs');
const path = require('node:path');
const { loadContent } = require('../src/content');
const { DEFAULT_DB_PATH, openDb, seedDatabase } = require('../src/db');

function main() {
  const dbPath = path.resolve(process.env.DB_PATH || DEFAULT_DB_PATH);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const content = loadContent();
  const db = openDb(dbPath);
  try {
    seedDatabase(db, content);
  } finally {
    db.close();
  }
  console.log(`Seeded ${path.relative(process.cwd(), dbPath)}: ${content.stages.length} stages, ${content.pages.length} pages.`);
}

main();
