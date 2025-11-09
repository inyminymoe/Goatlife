'use client';

import ExecMessageView from '@/components/shared/ExecMessageView';
import { useExecMessage } from '@/hooks/useExecMessage';

export default function ExecMessageCard() {
  const { lifecycle, data, error } = useExecMessage({ autoLoad: true });

  return (
    <ExecMessageView
      lifecycle={lifecycle}
      data={data}
      error={error}
      mode="compact"
    />
  );
}
