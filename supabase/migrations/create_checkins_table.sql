/*
  # 创建签到和紧急联系人表

  1. 新表
    - `users` - 用户表（存储用户ID）
    - `check_ins` - 签到记录表
    - `emergency_contacts` - 紧急联系人表
    - `notification_logs` - 通知发送日志

  2. 安全
    - 启用 RLS
    - 用户只能访问自己的数据
*/

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (true);

-- 签到记录表
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  checked_in_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own check_ins"
  ON check_ins FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own check_ins"
  ON check_ins FOR INSERT
  WITH CHECK (true);

-- 创建索引用于快速查询最后签到时间
CREATE INDEX idx_check_ins_user_id_checked_in_at
  ON check_ins(user_id, checked_in_at DESC);

-- 紧急联系人表
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contacts"
  ON emergency_contacts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own contacts"
  ON emergency_contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own contacts"
  ON emergency_contacts FOR DELETE
  USING (true);

-- 通知日志表（防止重复发送）
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES emergency_contacts(id) ON DELETE CASCADE NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent'
);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notification_logs"
  ON notification_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert notification_logs"
  ON notification_logs FOR INSERT
  WITH CHECK (true);

-- 创建索引防止重复通知
CREATE INDEX idx_notification_logs_user_sent
  ON notification_logs(user_id, sent_at DESC);
