const db = require('./client')

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      project_name TEXT DEFAULT '_global',
      platform TEXT DEFAULT '_all',
      monthly_budget DECIMAL(10,2) DEFAULT 0,
      actual_spend DECIMAL(10,2) DEFAULT 0,
      leads_override INTEGER DEFAULT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_id, project_name, platform, month, year)
    );

    CREATE TABLE IF NOT EXISTS dashboard_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      label TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  console.log('Migrations complete')
}

module.exports = { runMigrations }
