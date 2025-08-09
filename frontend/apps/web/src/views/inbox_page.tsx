import { QuickAdd } from '../widgets/quick_add';
import { SectionGrid } from '../widgets/section_grid';
import { PageHeader } from '../ui/page_header';
import { useEffect, useState } from 'react';
import { listItems } from '../service/api';
import type { Item } from '../service/types';
import { MessageCapture } from '../widgets/message_capture';
import { Home } from 'lucide-react';

export function InboxPage(): JSX.Element {
  const [recent, setRecent] = useState<Item[]>([]);

  useEffect(() => {
    listItems({ limit: 8 }).then(setRecent).catch(() => setRecent([]));
  }, []);

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      <PageHeader 
        title="Inbox" 
        icon={<Home className="w-8 h-8 text-blue-600" />}
      />
      <MessageCapture onCreated={() => listItems({ limit: 8 }).then(setRecent).catch(() => setRecent([]))} />
      <QuickAdd />
      <div className="flex-1">
        <SectionGrid
          title="Recently Added"
          items={recent.map((x) => ({ title: x.title, tag: x.kind[0].toUpperCase() + x.kind.slice(1) }))}
        />
      </div>
    </div>
  );
}

// hero moved to shared PageHero


