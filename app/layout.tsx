import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Novus Voice — AI receptionist for service businesses",
    template: "%s · Novus Voice",
  },
  description:
    "Answers every call, books the job, captures the lead — 24/7, in your language, in your currency. Built by Novus Co.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
