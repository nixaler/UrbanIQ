const ITEMS = [
  {
    title: 'LLC formation',
    body: 'We file your LLC and walk you through the tax-advantage decisions that come with owning a real entity instead of operating as yourself.',
  },
  {
    title: 'A real website',
    body: 'A site built for what you actually sell — not a template you have to fight with. Live under your own domain.',
  },
  {
    title: 'A CRM for your customers',
    body: 'Track leads, customers, and follow-ups in one place built for how you actually work, not a spreadsheet you abandon in week two.',
  },
  {
    title: 'A social media manager',
    body: 'A shared content calendar with a real person planning and scheduling your posts alongside you — not a bot.',
  },
  {
    title: '1:1 coaching',
    body: 'Regular sessions with a coach who knows the bundle you’re running, plus a self-serve curriculum for everything between sessions.',
  },
  {
    title: 'One fixed price',
    body: 'No per-seat CRM fee, no separate website host, no line-item invoice from five vendors. One monthly price, everything included.',
  },
];

export default function OfferBundle() {
  return (
    <section id="offer" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything a business needs, in one bundle.
        </h2>
        <p className="mt-4 text-ink-muted">
          Most people who cook, build, or sell something well never get past the point where the
          business side stalls them out. niXaler is the business side.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-border bg-bg-raised p-6 transition hover:border-accent/40"
          >
            <h3 className="font-medium">{item.title}</h3>
            <p className="mt-2 text-sm text-ink-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
