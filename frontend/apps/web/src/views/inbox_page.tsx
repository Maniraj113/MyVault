import { QuickAdd } from '../widgets/quick_add';
import { SectionGrid } from '../widgets/section_grid';
import { PageHero } from '../ui/page_hero';
import { useEffect, useState } from 'react';
import { listItems } from '../service/api';
import type { Item } from '../service/types';
import { MessageCapture } from '../widgets/message_capture';

export function InboxPage(): JSX.Element {
  const [recent, setRecent] = useState<Item[]>([]);

  useEffect(() => {
    listItems({ limit: 8 }).then(setRecent).catch(() => setRecent([]));
  }, []);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHero title="Inbox" subtitle="Capture first, organize later" tone="indigo" />
      <MessageCapture onCreated={() => listItems({ limit: 8 }).then(setRecent).catch(() => setRecent([]))} />
      <QuickAdd />
      <SectionGrid
        title="Recently Added"
        items={recent.map((x) => ({ title: x.title, tag: x.kind[0].toUpperCase() + x.kind.slice(1) }))}
      />
    </div>
  );
}

// hero moved to shared PageHero


