import { History, CheckCircle2 } from 'lucide-react';
import type { CheckInRecord } from '@/hooks/useCheckIn';

interface CheckInHistoryProps {
  checkIns: CheckInRecord[];
}

export function CheckInHistory({ checkIns }: CheckInHistoryProps) {
  const recentCheckIns = checkIns.slice(0, 7);

  return (
    <div className="rounded-2xl border border-border p-6 gradient-card shadow-card">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        签到历史
      </h3>

      {recentCheckIns.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">
          还没有签到记录
        </p>
      ) : (
        <ul className="space-y-2">
          {recentCheckIns.map((record, index) => (
            <li
              key={record.id}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-safe" />
                <span className="text-foreground">
                  {new Date(record.timestamp).toLocaleDateString('zh-CN', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(record.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </li>
          ))}
        </ul>
      )}

      {checkIns.length > 7 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          共 {checkIns.length} 条签到记录
        </p>
      )}
    </div>
  );
}
