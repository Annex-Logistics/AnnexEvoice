import { Badge, type BadgeProps } from './Badge.js';

const STATUS_MAP: Record<string, BadgeProps['variant']> = {
  draft: 'default',
  pending_transmission: 'warning',
  transmitted: 'success',
  paid: 'success',
  part_paid: 'info',
  overdue: 'error',
  cancelled: 'error',
  failed: 'error',
};

export function StatusPill({ status }: { status: string }) {
  const variant = STATUS_MAP[status] ?? 'default';
  return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
}
