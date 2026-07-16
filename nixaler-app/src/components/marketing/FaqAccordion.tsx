const FAQS = [
  {
    q: 'Is niXaler a law firm or accounting firm?',
    a: 'No. We facilitate LLC formation and point out tax-advantage considerations, but we are not a substitute for a licensed attorney or CPA for anything that requires one.',
  },
  {
    q: 'What if I already have an LLC?',
    a: 'You keep it — we plug your existing entity into the website, CRM, social calendar, and coaching instead of filing a new one.',
  },
  {
    q: 'Does the social media manager actually post for me?',
    a: 'Today, your manager plans and schedules posts with you in a shared calendar. Direct auto-posting to each platform is being rolled out per platform.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — it’s a month-to-month subscription with no long-term contract.',
  },
];

export default function FaqAccordion() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions</h2>
      <div className="mt-8 divide-y divide-border">
        {FAQS.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-base font-medium">
              {f.q}
              <span className="text-ink-muted transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-ink-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
