import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL (e.g. node --env-file=.env.local scripts/init-db.mjs)");
  process.exit(1);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shipping_address TEXT,
    tracking_number VARCHAR(100),
    order_status VARCHAR(50) NOT NULL DEFAULT 'Pending Payment',
    deposit_paid INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_cost INTEGER NOT NULL DEFAULT 0,
    unit_price INTEGER NOT NULL DEFAULT 0,
    item_status VARCHAR(50) NOT NULL DEFAULT 'Ordered'
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    estimated_expenses INTEGER NOT NULL DEFAULT 0
  )
`;

await sql`
  INSERT INTO app_settings (id, estimated_expenses)
  VALUES (1, 0)
  ON CONFLICT (id) DO NOTHING
`;

await sql`
  ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ongkir_per_orang INTEGER NOT NULL DEFAULT 0
`;

console.log("Database ready.");
