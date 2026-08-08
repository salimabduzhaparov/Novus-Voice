import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Novus Voice — AI receptionist for service businesses",
    template: "%s · Novus Voice",
  },
  description:
    "Answers every call, books the job, captures the lead — 24/7, in your language, in your currency. Built by Novus Co.",
  openGraph: {
    title: "Novus Voice — AI receptionist for service businesses",
    description:
      "Every missed call is a job your competitor booked. Nova answers when you can't.",
    siteName: "Novus Voice",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Novus Voice — AI receptionist for service businesses",
    description:
      "Every missed call is a job your competitor booked. Nova answers when you can't.",
    images: ["/og.png"],
  },
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
