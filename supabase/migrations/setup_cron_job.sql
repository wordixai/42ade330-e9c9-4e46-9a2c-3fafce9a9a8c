/*
  # 设置定时任务 - 每小时检查未签到用户

  此迁移需要启用 pg_cron 扩展
  在 Supabase Dashboard -> Database -> Extensions 中启用 pg_cron
*/

-- 启用 pg_cron 扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 授予必要的权限
GRANT USAGE ON SCHEMA cron TO postgres;

-- 创建定时任务：每小时检查一次
-- 调用 Edge Function 检查未签到用户并发送邮件
SELECT cron.schedule(
  'check-inactive-users',  -- 任务名称
  '0 * * * *',             -- 每小时执行一次 (cron 表达式)
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/check-inactive-users',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 备注：如果 pg_cron 不可用，可以使用外部定时服务
-- 如 cron-job.org 或 GitHub Actions 来定期调用 Edge Function
