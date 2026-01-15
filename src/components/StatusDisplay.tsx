import { Clock, AlertTriangle, ShieldCheck, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusDisplayProps {
  status: 'safe' | 'warning' | 'danger';
  daysSinceLastCheckIn: number;
  lastCheckInDate: string | null;
}

export function StatusDisplay({ status, daysSinceLastCheckIn, lastCheckInDate }: StatusDisplayProps) {
  const formatTimeRemaining = () => {
    if (daysSinceLastCheckIn === Infinity) {
      return '从未签到';
    }

    const hoursRemaining = Math.max(0, (2 - daysSinceLastCheckIn) * 24);

    if (hoursRemaining <= 0) {
      return '已超时';
    }

    const hours = Math.floor(hoursRemaining);
    const minutes = Math.floor((hoursRemaining - hours) * 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}天 ${remainingHours}小时`;
    }

    return `${hours}小时 ${minutes}分钟`;
  };

  const statusConfig = {
    safe: {
      icon: ShieldCheck,
      title: '状态安全',
      color: 'text-safe',
      bgColor: 'bg-safe/10',
      borderColor: 'border-safe/30',
    },
    warning: {
      icon: AlertTriangle,
      title: '注意！',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
    },
    danger: {
      icon: Skull,
      title: '危险！',
      color: 'text-danger',
      bgColor: 'bg-danger/10',
      borderColor: 'border-danger/30',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-2xl border p-6 gradient-card shadow-card',
      config.borderColor
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('p-2 rounded-xl', config.bgColor)}>
          <Icon className={cn('w-6 h-6', config.color)} />
        </div>
        <h3 className={cn('text-lg font-semibold', config.color)}>{config.title}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            距离通知还有
          </span>
          <span className={cn('font-mono font-bold text-lg', config.color)}>
            {formatTimeRemaining()}
          </span>
        </div>

        {lastCheckInDate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">上次签到</span>
            <span className="text-foreground">
              {new Date(lastCheckInDate).toLocaleString('zh-CN', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
