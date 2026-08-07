import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novus Voice",
  description: "AI receptionist for home-services trades",
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
