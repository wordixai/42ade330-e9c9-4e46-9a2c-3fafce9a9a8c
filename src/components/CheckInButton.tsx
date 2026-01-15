import { Heart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CheckInButtonProps {
  status: 'safe' | 'warning' | 'danger';
  hasCheckedInToday: boolean;
  onCheckIn: () => void;
}

export function CheckInButton({ status, hasCheckedInToday, onCheckIn }: CheckInButtonProps) {
  const statusConfig = {
    safe: {
      variant: 'safe' as const,
      animation: 'animate-pulse-glow',
      icon: hasCheckedInToday ? Check : Heart,
      text: hasCheckedInToday ? '今日已签到' : '签到',
      subtext: hasCheckedInToday ? '你很安全' : '点击确认你还活着',
    },
    warning: {
      variant: 'warning' as const,
      animation: 'animate-pulse-warning',
      icon: Heart,
      text: '快签到！',
      subtext: '已超过24小时未签到',
    },
    danger: {
      variant: 'danger' as const,
      animation: 'animate-pulse-danger animate-heartbeat',
      icon: Heart,
      text: '紧急签到！',
      subtext: '即将通知紧急联系人',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-6">
      <Button
        variant={config.variant}
        onClick={onCheckIn}
        disabled={hasCheckedInToday}
        className={cn(
          'w-48 h-48 rounded-full flex flex-col gap-2 text-xl font-bold transition-all duration-300',
          !hasCheckedInToday && config.animation,
          hasCheckedInToday && 'opacity-80 cursor-default'
        )}
      >
        <Icon className="!w-16 !h-16" strokeWidth={1.5} />
        <span>{config.text}</span>
      </Button>
      <p className="text-muted-foreground text-center">{config.subtext}</p>
    </div>
  );
}
