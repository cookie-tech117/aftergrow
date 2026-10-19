import type { Metadata } from "next";
import "./globals.css";

const title = "Afterglow | Your island of healing";
const description = "Turn every adventure into an island of healing. Meet Lin, find your recovery rhythm, and grow a personal island with gentle daily goals.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: "./favicon.svg" },
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
