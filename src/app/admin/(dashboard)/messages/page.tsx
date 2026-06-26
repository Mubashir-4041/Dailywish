'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Mail, MailOpen, Trash2, Phone, Reply } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, DbNotice, EmptyState } from '@/components/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';

interface MessageRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      const res = await fetch(`/api/admin/messages?${params.toString()}`);
      if (res.status === 503) {
        setNoDb(true);
        setRows([]);
        return;
      }
      const data = (await res.json()) as { data: MessageRow[]; unread: number };
      setNoDb(false);
      setRows(data.data ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setRead(id: string, isRead: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead }),
      });
      if (!res.ok) {
        toast.error('Could not update');
        return;
      }
      load();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete');
        return;
      }
      toast.success('Message deleted');
      load();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Enquiries submitted through the storefront contact form."
        action={
          <div className="flex items-center gap-3">
            {unread > 0 ? (
              <Badge variant="default">{unread} unread</Badge>
            ) : null}
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {noDb ? <DbNotice /> : null}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={noDb ? 'No live data' : 'No messages yet'}
          description={noDb ? undefined : 'Contact-form submissions will appear here.'}
        />
      ) : (
        <div className="space-y-4">
          {rows.map((m) => (
            <Card
              key={m._id}
              className={cn(!m.isRead && 'border-primary/40 bg-primary/[0.03]')}
            >
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{m.subject}</span>
                    {!m.isRead ? <Badge variant="default">New</Badge> : null}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {m.message}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{m.name}</span>
                    <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                      <Mail className="h-3.5 w-3.5" /> {m.email}
                    </a>
                    {m.phone ? (
                      <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3.5 w-3.5" /> {m.phone}
                      </a>
                    ) : null}
                    <span>{formatDate(m.createdAt)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>
                      <Reply className="h-4 w-4" /> Reply
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={m.isRead ? 'Mark as unread' : 'Mark as read'}
                    disabled={busyId === m._id}
                    onClick={() => setRead(m._id, !m.isRead)}
                  >
                    {m.isRead ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <MailOpen className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    disabled={busyId === m._id}
                    onClick={() => remove(m._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
