import { marketing } from "@/constants/design";

const GOALS = ["UPSC", "CAT", "AWS", "PMP", "JLPT", "CFA", "GRE", "NEET"];

export function LogosStrip() {
  return (
    <section className="border-y border-border bg-surface/50 py-10">
      <div className={`${marketing.section} py-0 text-center`}>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Built for ambitious learners preparing for
        </p>
        <div
          className="relative mt-5 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
          }}
        >
          {/* Per-item margins (not gap) keep each copy exactly half the track,
              so the -50% marquee keyframe loops seamlessly. */}
          <div className="flex w-max animate-marquee items-center">
            {[...GOALS, ...GOALS].map((goal, i) => (
              <span
                key={`${goal}-${i}`}
                aria-hidden={i >= GOALS.length || undefined}
                className="mx-7 text-sm font-semibold tracking-wide text-muted-foreground/80"
              >
                {goal}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          Exams, professional certifications, languages, and skill-based curricula.
        </p>
      </div>
    </section>
  );
}
