import { Pool } from "pg"
import dotenv from "dotenv"

// Prefer .env.local for app/ts-node usage; fall back to .env
dotenv.config({ path: ".env.local" })
dotenv.config()

const connectionString = process.env.DATABASE_URL

const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || "scafflow_db",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD,
      },
)

export async function query(text: string, params: unknown[] = []) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("[v0] Query:", { text, duration, rows: result.rowCount })
    return result
  } catch (error) {
    console.error("[v0] Query error:", error, "SQL:", text, "params:", params)
    throw error
  }
}

export async function initializeDatabase() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'site_engineer',
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        budget_total DECIMAL(15, 2),
        budget_spent DECIMAL(15, 2) DEFAULT 0,
        budget_variance DECIMAL(15, 2) DEFAULT 0,
        start_date DATE,
        end_date DATE,
        progress_percentage INT DEFAULT 0,
        owner_id INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        assigned_to INT REFERENCES users(id),
        start_date DATE,
        end_date DATE,
        priority VARCHAR(50) DEFAULT 'medium',
        progress_percentage INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS safety_incidents (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        incident_type VARCHAR(50),
        severity VARCHAR(50),
        description TEXT,
        reported_by INT REFERENCES users(id),
        reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS budget_items (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        budget_amount DECIMAL(15, 2),
        spent_amount DECIMAL(15, 2) DEFAULT 0,
        variance DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS change_orders (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255),
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(15, 2),
        status VARCHAR(50) DEFAULT 'pending',
        requested_by INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS progress_draws (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        draw_number VARCHAR(50),
        amount DECIMAL(15, 2),
        status VARCHAR(50) DEFAULT 'requested',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS kpis (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        metric_name VARCHAR(100),
        metric_value DECIMAL(10, 2),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_safety_project_id ON safety_incidents(project_id);
      CREATE INDEX IF NOT EXISTS idx_budget_project_id ON budget_items(project_id);
      CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id);
      CREATE INDEX IF NOT EXISTS idx_progress_draws_project_id ON progress_draws(project_id);

      -- Backward compatibility: ensure password_hash exists and backfill from legacy password column
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'password_hash'
        ) THEN
          ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'password'
        ) THEN
          UPDATE users SET password_hash = COALESCE(password_hash, password);
        END IF;
      END
      $$;
    `)
    console.log("[v0] Database initialized")
  } finally {
    client.release()
  }
}

export default pool
