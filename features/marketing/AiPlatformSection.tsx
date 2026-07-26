import { Reveal } from "@/features/marketing/components/Reveal";
import {
  DurableJobsMock,
  LiveProgressMock,
  MemoryRecallMock,
  ReadinessLedgerMock,
} from "@/features/marketing/components/PlatformMocks";
import { marketing } from "@/constants/design";

const CARDS = [
  {
    id: "prewarm",
    title: "Ready before you arrive",
    body: "A nightly scheduler reads your upcoming study plan and pre-generates the lessons and question sets you'll need — so opening a topic feels instant, not \"generating…\".",
    mock: <ReadinessLedgerMock />,
  },
  {
    id: "realtime",
    title: "Watch it build, live",
    body: "When something does generate in front of you, you see real step names streaming in — blueprint, curriculum, workspace — not a spinner guessing at progress.",
    mock: <LiveProgressMock />,
  },
  {
    id: "memory",
    title: "An AI that remembers you",
    body: "Wrong answers, skipped tasks, and session outcomes are stored as memories. Sage and future question sets recall them, adapting to your weak spots — not a generic learner's.",
    mock: <MemoryRecallMock />,
  },
  {
    id: "durable",
    title: "Durable by design",
    body: "Every generation runs as a background job with automatic retries and checkpoints. A timeout or deploy mid-generation resumes where it left off instead of dying silently.",
    mock: <DurableJobsMock />,
  },
];

export function AiPlatformSection() {
  return (
    <section id="platform" className={`${marketing.section} bg-surface/30`}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          Under the hood
        </p>
        <h2 className={`mt-3 ${marketing.sectionTitle}`}>
          An AI platform working <span className="gradient-text">before you arrive</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Most AI study tools generate on demand and forget you between sessions.
          LearnOS runs a platform underneath: durable jobs, pre-warming, live progress,
          and long-term memory.
        </p>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {CARDS.map((card, i) => (
          <Reveal key={card.id} delay={(i % 2) * 0.1}>
            <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {card.body}
              </p>
              <div className="mt-5 flex-1 rounded-xl border border-border/60 bg-background/60 p-4">
                {card.mock}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
