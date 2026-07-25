import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { marketing } from "@/constants/design";

const FAQS = [
  {
    q: "What is LearnOS?",
    a: "LearnOS is an AI-powered learning operating system. It interviews you about your goal, generates a personalized roadmap and workspace, then runs your daily study, practice, revision, and mock exam loop — with progress tracked automatically.",
  },
  {
    q: "Which goals does LearnOS support?",
    a: "Any structured learning goal: competitive exams (UPSC, CAT, GRE, NEET), professional certifications (AWS, PMP, CFA), languages (JLPT), and skill-based curricula. You define the goal; LearnOS builds the plan.",
  },
  {
    q: "How does Sage, the AI mentor, work?",
    a: "Sage is grounded in your project context — syllabus, progress, weak areas, and today's plan — so answers stay relevant. Ask for explanations, rescheduling help, or motivation anytime from your project's mentor page.",
  },
  {
    q: "How does progress tracking work?",
    a: "Progress is auto-derived from study sessions, practice attempts, resource completion, and revision reviews. You can also adjust topic progress manually when needed.",
  },
  {
    q: "Does LearnOS include mock exams and revision?",
    a: "Yes. Run timed practice sets and full mock exams with readiness scoring. Wrong answers feed into a spaced revision queue with flashcards you can review daily — including offline via PWA.",
  },
  {
    q: "How do I get started?",
    a: "Sign up, create a project at /projects/new, complete the AI onboarding interview, and your roadmap generates automatically. Your first daily plan appears once the workspace is ready.",
  },
  {
    q: "Is my data private?",
    a: "Your projects and progress are tied to your account and not shared publicly. LearnOS uses your data only to personalize your learning plan and mentor responses.",
  },
  {
    q: "Can I use LearnOS on mobile?",
    a: "LearnOS is a progressive web app — install it on your phone for revision and focus sessions, with offline support for revision cards.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className={`${marketing.section} bg-surface/30`}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">FAQ</p>
        <h2 className={`mt-3 ${marketing.sectionTitle}`}>Common questions</h2>
      </div>
      <Accordion className="mx-auto mt-10 max-w-2xl">
        {FAQS.map((faq, i) => (
          <AccordionItem key={faq.q} value={`item-${i}`}>
            <AccordionTrigger>{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
