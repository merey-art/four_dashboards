import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { Providers } from "@/app/providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Логистика — панель управления",
  description: "Внутренние дашборды логистической компании",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ru" className={cn("min-h-screen antialiased", inter.variable)}>
      <body className="min-h-screen font-sans">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
