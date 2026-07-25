import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  mode: "login" | "signup";
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({ title, description, mode, children, className }: AuthCardProps) {
  return (
    <Card className={cn("p-2 shadow-elegant ring-glow", className)}>
      <div className="mb-6 flex rounded-lg bg-secondary p-1">
        <Link
          href="/signup"
          className={cn(
            "flex-1 rounded-md py-1.5 text-center text-sm font-medium transition",
            mode === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Create account
        </Link>
        <Link
          href="/login"
          className={cn(
            "flex-1 rounded-md py-1.5 text-center text-sm font-medium transition",
            mode === "login"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Sign in
        </Link>
      </div>
      <CardHeader className="space-y-1 px-6 pt-2 text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">{children}</CardContent>
      <p className="px-6 pb-6 text-center text-xs text-muted-foreground">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </Card>
  );
}
