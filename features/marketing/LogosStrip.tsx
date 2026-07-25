import { marketing } from "@/constants/design";

const GOALS = ["UPSC", "CAT", "AWS", "PMP", "JLPT", "CFA", "GRE", "NEET"];

export function LogosStrip() {
  return (
    <section className="border-y border-border bg-surface/50 py-10">
      <div className={`${marketing.section} py-0 text-center`}>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Built for ambitious learners preparing for
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {GOALS.map((goal) => (
            <span key={goal} className="text-sm font-semibold text-muted-foreground/80">
              {goal}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Exams, professional certifications, languages, and skill-based curricula.
        </p>
      </div>
    </section>
  );
}
