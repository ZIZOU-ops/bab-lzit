import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui';

const STATUS_VARIANT: Record<string, 'default' | 'navy' | 'success' | 'warning' | 'clay' | 'danger'> = {
  draft: 'default',
  submitted: 'navy',
  searching: 'warning',
  negotiating: 'warning',
  accepted: 'success',
  en_route: 'navy',
  in_progress: 'navy',
  completed: 'success',
  cancelled: 'danger',
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const label = t(`orders.status.${status}`);

  return (
    <Badge
      label={label}
      variant={STATUS_VARIANT[status] ?? 'default'}
    />
  );
}
