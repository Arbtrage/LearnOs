import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({
  title,
  description,
  children,
  className,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
