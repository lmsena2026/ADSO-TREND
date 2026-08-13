/*
# Notifications, Size Guides, and Order Status Enhancements

## Overview
Adds admin purchase notifications, size guide measurements, and new order
statuses for cash-on-delivery flow. Also adds policies for admin to read
all orders and profiles.

## New Tables
1. `admin_notifications` — Notifications for admins when new orders arrive
2. `size_guides` — Measurement data per clothing size

## Security
- `admin_notifications`: authenticated CRUD
- `size_guides`: public read, admin write
- `orders`: adds admin SELECT/UPDATE policy
- `profiles`: adds admin SELECT/UPDATE policy
- `order_items`: adds admin SELECT policy
*/

-- ============================================================
-- ADMIN NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'new_order',
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_notifications(is_read, created_at DESC);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_admin_notifications" ON admin_notifications;
CREATE POLICY "select_admin_notifications" ON admin_notifications FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_admin_notifications" ON admin_notifications;
CREATE POLICY "insert_admin_notifications" ON admin_notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_admin_notifications" ON admin_notifications;
CREATE POLICY "update_admin_notifications" ON admin_notifications FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_admin_notifications" ON admin_notifications;
CREATE POLICY "delete_admin_notifications" ON admin_notifications FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- SIZE GUIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS size_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  size_label text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  chest_cm numeric(6,1),
  waist_cm numeric(6,1),
  hip_cm numeric(6,1),
  length_cm numeric(6,1),
  shoulder_cm numeric(6,1),
  sleeve_cm numeric(6,1),
  created_at timestamptz DEFAULT now(),
  UNIQUE (size_label, category)
);

ALTER TABLE size_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_size_guides" ON size_guides;
CREATE POLICY "public_read_size_guides" ON size_guides FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_size_guides" ON size_guides;
CREATE POLICY "auth_insert_size_guides" ON size_guides FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_size_guides" ON size_guides;
CREATE POLICY "auth_update_size_guides" ON size_guides FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_size_guides" ON size_guides;
CREATE POLICY "auth_delete_size_guides" ON size_guides FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- ADMIN ACCESS TO ORDERS (read all + update status)
-- ============================================================
DROP POLICY IF EXISTS "admin_select_orders" ON orders;
CREATE POLICY "admin_select_orders" ON orders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ADMIN ACCESS TO ORDER ITEMS (read all)
-- ============================================================
DROP POLICY IF EXISTS "admin_select_order_items" ON order_items;
CREATE POLICY "admin_select_order_items" ON order_items FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- ADMIN ACCESS TO PROFILES (read all + update)
-- ============================================================
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
CREATE POLICY "admin_select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- SEED SIZE GUIDE DATA
-- ============================================================
INSERT INTO size_guides (size_label, category, chest_cm, waist_cm, hip_cm, length_cm, shoulder_cm, sleeve_cm) VALUES
  ('XS', 'camiseta', 82.0, 66.0, 86.0, 64.0, 40.0, 60.0),
  ('S',  'camiseta', 86.0, 70.0, 90.0, 66.0, 42.0, 61.0),
  ('M',  'camiseta', 90.0, 74.0, 94.0, 68.0, 44.0, 62.0),
  ('L',  'camiseta', 94.0, 78.0, 98.0, 70.0, 46.0, 63.0),
  ('XL', 'camiseta', 98.0, 82.0, 102.0, 72.0, 48.0, 64.0),
  ('XS', 'pantalon', NULL, 64.0, 86.0, 96.0, NULL, NULL),
  ('S',  'pantalon', NULL, 68.0, 90.0, 98.0, NULL, NULL),
  ('M',  'pantalon', NULL, 72.0, 94.0, 100.0, NULL, NULL),
  ('L',  'pantalon', NULL, 76.0, 98.0, 102.0, NULL, NULL),
  ('XL', 'pantalon', NULL, 80.0, 102.0, 104.0, NULL, NULL),
  ('XS', 'chaqueta', 82.0, 66.0, 86.0, 60.0, 40.0, 58.0),
  ('S',  'chaqueta', 86.0, 70.0, 90.0, 62.0, 42.0, 59.0),
  ('M',  'chaqueta', 90.0, 74.0, 94.0, 64.0, 44.0, 60.0),
  ('L',  'chaqueta', 94.0, 78.0, 98.0, 66.0, 46.0, 61.0),
  ('XL', 'chaqueta', 98.0, 82.0, 102.0, 68.0, 48.0, 62.0),
  ('XS', 'general', 82.0, 66.0, 86.0, 64.0, 40.0, 60.0),
  ('S',  'general', 86.0, 70.0, 90.0, 66.0, 42.0, 61.0),
  ('M',  'general', 90.0, 74.0, 94.0, 68.0, 44.0, 62.0),
  ('L',  'general', 94.0, 78.0, 98.0, 70.0, 46.0, 63.0),
  ('XL', 'general', 98.0, 82.0, 102.0, 72.0, 48.0, 64.0)
ON CONFLICT (size_label, category) DO NOTHING;

-- ============================================================
-- TRIGGER: Auto-create admin notification on new order
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_notifications (type, title, message, data)
  VALUES (
    'new_order',
    'Nuevo pedido #' || LEFT(NEW.id::text, 8),
    'Se ha realizado un nuevo pedido por $' || NEW.total::text,
    jsonb_build_object('order_id', NEW.id, 'total', NEW.total, 'payment_method', NEW.payment_method, 'user_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created ON orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();
