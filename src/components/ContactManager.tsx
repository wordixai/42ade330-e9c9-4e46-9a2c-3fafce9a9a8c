import { useState } from 'react';
import { UserPlus, Trash2, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EmergencyContact } from '@/hooks/useCheckIn';
import { toast } from 'sonner';

interface ContactManagerProps {
  contacts: EmergencyContact[];
  onAddContact: (name: string, email: string) => void;
  onRemoveContact: (id: string) => void;
}

export function ContactManager({ contacts, onAddContact, onRemoveContact }: ContactManagerProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('请填写完整信息');
      return;
    }
    if (!email.includes('@')) {
      toast.error('请输入有效的邮箱地址');
      return;
    }
    onAddContact(name.trim(), email.trim());
    setName('');
    setEmail('');
    setIsAdding(false);
    toast.success('紧急联系人已添加');
  };

  return (
    <div className="rounded-2xl border border-border p-6 gradient-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          紧急联系人
        </h3>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            添加
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 p-4 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              确认添加
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setName('');
                setEmail('');
              }}
            >
              取消
            </Button>
          </div>
        </form>
      )}

      {contacts.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">
          还没有添加紧急联系人
        </p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{contact.name}</span>
                <span className="text-sm text-muted-foreground">{contact.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onRemoveContact(contact.id);
                  toast.success('联系人已删除');
                }}
                className="text-muted-foreground hover:text-danger"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        如果连续两天未签到，系统将自动发送邮件通知以上联系人。
      </p>
    </div>
  );
}
