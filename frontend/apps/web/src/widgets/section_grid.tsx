type Item = { title: string; tag?: string };

export function SectionGrid({ title, items }: { title: string; items: Item[] }): JSX.Element {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <button className="text-xs text-primary-600">See all</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <article key={item.title} className="card card-hover p-4">
            <div className="font-medium text-slate-900">{item.title}</div>
            {item.tag && (
              <div className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {item.tag}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}


