import React from 'react';

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, icon, action }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && <div className="text-gray-900 dark:text-white">{icon}</div>}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>
      {action && action}
    </div>
  );
}
