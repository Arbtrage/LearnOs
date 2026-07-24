import { cn } from "@/lib/utils";

type WizardStepProps = {
  currentStep: number;
  totalSteps: number;
  label?: string;
  className?: string;
};

export function WizardStep({
  currentStep,
  totalSteps,
  label,
  className,
}: WizardStepProps) {
  const progress = Math.min(
    100,
    Math.round((currentStep / Math.max(totalSteps, 1)) * 100),
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {label ?? "Onboarding progress"}
        </span>
        <span className="text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Onboarding progress"}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
