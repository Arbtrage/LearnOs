import { ProductFrame } from "@/features/marketing/components/ProductFrame";
import { WorkspaceOverviewMock } from "@/features/marketing/components/WorkspaceHeroMock";
import { marketing } from "@/constants/design";

export function WorkspacePreviewSection() {
  return (
    <section id="product" className={`${marketing.section} bg-surface/30`}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Product</p>
        <h2 className={`mt-3 ${marketing.sectionTitle}`}>
          Your entire workspace, <span className="gradient-text">one sidebar away</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Start, Learn, Practice, Master, Reflect — five sections that map to how you actually
          prepare. Every route is wired to real data, not placeholders.
        </p>
      </div>
      <div className="mt-12">
        <ProductFrame url="learnos.app / cat-2027">
          <WorkspaceOverviewMock />
        </ProductFrame>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-5">
        {[
          { label: "Start", desc: "Overview + Today" },
          { label: "Learn", desc: "Roadmap + Topics" },
          { label: "Practice", desc: "Drills + sets" },
          { label: "Master", desc: "Revision + Exam" },
          { label: "Reflect", desc: "Analytics" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-sm font-semibold">{s.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
