import { redirect } from "next/navigation";
import { LandingPage } from "@/features/marketing/LandingPage";
import { getOptionalSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getOptionalSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }
  return <LandingPage />;
}
