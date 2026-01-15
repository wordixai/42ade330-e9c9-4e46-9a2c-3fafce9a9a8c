import { Skull } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useCheckIn } from '@/hooks/useCheckIn';
import { CheckInButton } from '@/components/CheckInButton';
import { StatusDisplay } from '@/components/StatusDisplay';
import { ContactManager } from '@/components/ContactManager';
import { CheckInHistory } from '@/components/CheckInHistory';

export default function Index() {
  const {
    checkIns,
    contacts,
    isLoaded,
    checkIn,
    addContact,
    removeContact,
    getLastCheckIn,
    getDaysSinceLastCheckIn,
    getStatus,
    hasCheckedInToday,
  } = useCheckIn();

  const handleCheckIn = () => {
    checkIn();
    toast.success('签到成功！你还活着！', {
      icon: '💚',
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const lastCheckIn = getLastCheckIn();
  const status = getStatus();
  const daysSinceLastCheckIn = getDaysSinceLastCheckIn();

  return (
    <div className="min-h-screen pb-12">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="pt-8 pb-6 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Skull className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">死了么</h1>
        </div>
        <p className="text-muted-foreground">
          每日签到，让你爱的人知道你还好
        </p>
      </header>

      {/* Main Content */}
      <main className="container max-w-lg mx-auto px-4 space-y-6">
        {/* Check-in Button */}
        <section className="py-8 flex justify-center">
          <CheckInButton
            status={status}
            hasCheckedInToday={hasCheckedInToday()}
            onCheckIn={handleCheckIn}
          />
        </section>

        {/* Status Display */}
        <StatusDisplay
          status={status}
          daysSinceLastCheckIn={daysSinceLastCheckIn}
          lastCheckInDate={lastCheckIn?.timestamp ? new Date(lastCheckIn.timestamp).toISOString() : null}
        />

        {/* Emergency Contacts */}
        <ContactManager
          contacts={contacts}
          onAddContact={addContact}
          onRemoveContact={removeContact}
        />

        {/* Check-in History */}
        <CheckInHistory checkIns={checkIns} />
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>记得每天签到哦 💀</p>
      </footer>
    </div>
  );
}
