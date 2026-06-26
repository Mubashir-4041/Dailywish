'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, DbNotice, EmptyState } from '@/components/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AuditRow {
  _id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  createdAt: string;
}

function actionVariant(action: string) {
  if (action.endsWith('.delete')) return 'destructive' as const;
  if (action.endsWith('.create')) return 'success' as const;
  return 'secondary' as const;
}

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDb, setNoDb] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${page}&pageSize=30`);
      if (res.status === 503) {
        setNoDb(true);
        setRows([]);
        return;
      }
      const data = (await res.json()) as { data: AuditRow[]; totalPages: number };
      setNoDb(false);
      setRows(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="A trail of privileged admin actions."
      />

      {noDb ? <DbNotice /> : null}

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title={noDb ? 'No live data' : 'No audit entries yet'} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="pr-6">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="pl-6">
                    <Badge variant={actionVariant(r.action)} className="font-mono text-[11px]">
                      {r.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.entity}
                    {r.entityId ? (
                      <span className="block font-mono text-xs text-muted-foreground">
                        {r.entityId.slice(-8)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">{r.actorEmail}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.ip || '-'}</TableCell>
                  <TableCell className="pr-6 text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString('en-PK')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
