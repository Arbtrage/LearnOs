import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db/prisma";

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is missing. Add it to .env — run: openssl rand -base64 32");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  ...authConfig,
});
