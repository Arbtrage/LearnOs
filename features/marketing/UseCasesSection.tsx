import { Award, Briefcase, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { marketing, semantic } from "@/constants/design";

const USE_CASES = [
  {
    icon: GraduationCap,
    title: "Competitive exams",
    example: "CAT 2027 · 99 percentile target",
    timeline: "12-month structured prep",
    surfaces: ["Today", "Roadmap", "Practice", "Mock exams", "Analytics"],
    iconBox: semantic.iconBoxPrimary,
  },
  {
    icon: Briefcase,
    title: "Professional certifications",
    example: "AWS Solutions Architect",
    timeline: "8-week sprint plan",
    surfaces: ["Topics", "Resources", "Practice sets", "Revision", "Readiness"],
    iconBox: semantic.iconBoxAccent,
  },
  {
    icon: Award,
    title: "Skill mastery",
    example: "Japanese JLPT N3",
    timeline: "Daily habit building",
    surfaces: ["Onboarding", "Today", "Sage mentor", "Spaced revision"],
    iconBox: semantic.iconBoxSuccess,
  },
];

export function UseCasesSection() {
  return (
    <section className={marketing.section}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Use cases</p>
        <h2 className={`mt-3 ${marketing.sectionTitle}`}>
          Built for how <span className="gradient-text">you</span> learn
        </h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {USE_CASES.map((uc) => (
          <Card key={uc.title} className="border-border/80">
            <CardHeader>
              <div className={uc.iconBox}>
                <uc.icon className="size-5" />
              </div>
              <CardTitle className="mt-4 text-lg">{uc.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Example goal</p>
                <p className="mt-1 text-sm font-medium">{uc.example}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Timeline</p>
                <p className="mt-1 text-sm">{uc.timeline}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Key surfaces</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {uc.surfaces.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
