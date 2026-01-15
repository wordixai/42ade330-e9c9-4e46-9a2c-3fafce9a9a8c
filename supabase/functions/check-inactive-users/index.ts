import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// 发送邮件函数
async function sendEmail(to: string, contactName: string, userName: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: '死了么 <noreply@resend.dev>',
      to: [to],
      subject: `⚠️ 紧急通知：${userName} 已经超过48小时未签到`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e53e3e;">⚠️ 紧急通知</h1>
          <p>亲爱的 ${contactName}：</p>
          <p>您被设置为紧急联系人的用户 <strong>${userName}</strong> 已经 <strong style="color: #e53e3e;">超过48小时</strong> 没有在「死了么」应用中签到。</p>
          <p>这可能意味着：</p>
          <ul>
            <li>他/她可能忘记了签到</li>
            <li>他/她可能遇到了紧急情况</li>
            <li>他/她可能需要您的帮助</li>
          </ul>
          <p>请尽快联系确认他/她的安全状况。</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">
            此邮件由「死了么」应用自动发送。<br/>
            如果您不认识此用户，请忽略此邮件。
          </p>
        </div>
      `,
    }),
  });

  return response.ok;
}

serve(async (req) => {
  try {
    // 验证环境变量
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // 创建 Supabase 客户端（使用 service role key 跳过 RLS）
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 计算48小时前的时间
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

    // 查找所有超过48小时未签到的用户
    // 子查询获取每个用户的最后签到时间
    const { data: inactiveUsers, error: queryError } = await supabase
      .rpc('get_inactive_users', { hours_threshold: 48 });

    if (queryError) {
      // 如果 RPC 不存在，使用备用查询
      console.log('RPC not found, using fallback query');

      // 获取所有用户和他们的最后签到时间
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          device_id,
          check_ins (
            checked_in_at
          ),
          emergency_contacts (
            id,
            name,
            email
          )
        `);

      if (usersError) throw usersError;

      const results: Array<{
        userId: string;
        contactEmail: string;
        success: boolean;
      }> = [];

      for (const user of users || []) {
        // 获取最后签到时间
        const checkIns = user.check_ins as Array<{ checked_in_at: string }> || [];
        const lastCheckIn = checkIns.length > 0
          ? new Date(Math.max(...checkIns.map(c => new Date(c.checked_in_at).getTime())))
          : null;

        // 如果从未签到或超过48小时未签到
        if (!lastCheckIn || lastCheckIn < twoDaysAgo) {
          const contacts = user.emergency_contacts as Array<{ id: string; name: string; email: string }> || [];

          for (const contact of contacts) {
            // 检查是否在24小时内已发送过通知
            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            const { data: recentNotifications } = await supabase
              .from('notification_logs')
              .select('id')
              .eq('user_id', user.id)
              .eq('contact_id', contact.id)
              .gte('sent_at', oneDayAgo.toISOString())
              .limit(1);

            // 如果24小时内未发送过，则发送通知
            if (!recentNotifications || recentNotifications.length === 0) {
              const success = await sendEmail(
                contact.email,
                contact.name,
                user.device_id
              );

              if (success) {
                // 记录通知日志
                await supabase
                  .from('notification_logs')
                  .insert({
                    user_id: user.id,
                    contact_id: contact.id,
                    status: 'sent',
                  });
              }

              results.push({
                userId: user.id,
                contactEmail: contact.email,
                success,
              });
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${results.length} notifications`,
          results
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Check completed' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
