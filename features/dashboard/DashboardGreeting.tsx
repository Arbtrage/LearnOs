function getGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${time}, ${first}` : time;
}

type DashboardGreetingProps = {
  name?: string | null;
};

export function DashboardGreeting({ name }: DashboardGreetingProps) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {getGreeting(name)}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Here&apos;s what&apos;s happening with your learning projects.
      </p>
    </div>
  );
}
