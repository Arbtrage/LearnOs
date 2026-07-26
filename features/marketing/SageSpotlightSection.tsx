import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductFrame } from "@/features/marketing/components/ProductFrame";
import { SageChatMock } from "@/features/marketing/components/SageChatMock";
import { MENTOR_NAME, MENTOR_TAGLINE } from "@/constants/ai-persona";
import { marketing } from "@/constants/design";
import { cn } from "@/lib/utils";

export function SageSpotlightSection() {
  return (
    <section className={marketing.section}>
      <div className={marketing.showcase}>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primary">AI mentor</p>
          <h2 className={`mt-3 ${marketing.sectionTitle}`}>
            Meet {MENTOR_NAME} — <span className="gradient-text">{MENTOR_TAGLINE.toLowerCase()}</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sage isn&apos;t a generic chatbot. It knows your syllabus, progress, weak topics, and
            today&apos;s plan — and it remembers past sessions, so advice builds on what you
            actually struggled with.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {[
              "Explain concepts in plain language",
              "Reschedule when you're behind",
              "Remember your mistakes and preferences across sessions",
              "Plan focused study sessions",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-8 gradient-primary text-primary-foreground shadow-elegant inline-flex",
            )}
          >
            Start with {MENTOR_NAME} <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </div>
        <ProductFrame url={`learnos.app / mentor`}>
          <SageChatMock />
        </ProductFrame>
      </div>
    </section>
  );
}
