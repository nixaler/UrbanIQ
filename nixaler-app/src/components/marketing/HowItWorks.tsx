const STEPS = [
  {
    step: '01',
    title: 'Tell us what you already do',
    body: 'Your craft, your customers so far, and where you want the business to go. Ten minutes.',
  },
  {
    step: '02',
    title: 'We file and build',
    body: 'Your LLC gets filed, your website gets built, and your CRM and content calendar get set up around your actual business.',
  },
  {
    step: '03',
    title: 'You run it with us',
    body: 'Coaching sessions, a curriculum, and a social media manager keep it moving — you stay the cook, we stay the business.',
  },
];

export default function HowItWorks() {
  return (
    <section className="border-y border-border bg-bg-raised">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step}>
              <span className="text-sm font-semibold text-accent">{s.step}</span>
              <h3 className="mt-3 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
