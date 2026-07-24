function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type DashboardHeaderProps = {
  name?: string | null;
};

export function DashboardHeader({ name }: DashboardHeaderProps) {
  const greeting = getGreeting();
  const displayName = name?.split(" ")[0] ?? "Learner";

  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-semibold tracking-tight">
        {greeting}, {displayName}
      </h1>
      <p className="text-muted-foreground">
        Your AI-powered learning operating system
      </p>
    </div>
  );
}
