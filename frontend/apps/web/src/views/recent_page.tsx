import React, { useEffect, useState } from 'react';
import { listItems } from '../service/api';

export function RecentPage(): JSX.Element {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    listItems({ limit: 20 }).then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="h-full p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Recently Added</h1>
      <ul className="divide-y rounded-lg border bg-white">
        {items.length === 0 ? (
          <li className="p-4 text-gray-500">No recent items</li>
        ) : (
          items.map((x) => (
            <li key={x.id} className="p-4">
              <div className="text-sm text-gray-500">{new Date(x.created_at).toLocaleString()}</div>
              <div className="font-medium text-gray-900">{x.title}</div>
              <div className="text-xs text-gray-600">{x.kind}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
