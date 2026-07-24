import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans-primary",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LearnOS",
  description: "AI-powered learning operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
