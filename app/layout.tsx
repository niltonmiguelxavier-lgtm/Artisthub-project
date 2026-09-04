import React from "react";
import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArtistHub — Descobre. Ouve. Apoia.",
  description: "Descobre novos artistas, acompanha os lançamentos mais recentes e apoia directamente quem cria a música que gostas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased selection:bg-[#E8871E]/30 selection:text-[#18171F]">
        {children}
      </body>
    </html>
  );
}
