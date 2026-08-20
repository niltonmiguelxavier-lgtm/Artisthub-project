import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-700 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-bone-400">{icon}</div>}
      <p className="font-display text-lg text-bone-100">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-bone-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
