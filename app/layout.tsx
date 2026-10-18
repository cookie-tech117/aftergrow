import type { Metadata } from "next";
import "./globals.css";

const title = "Heart Island | Recover, unlock, and shape four living islands";
const description = "A cozy recovery sandbox with four modular tile-built 3D islands, 35 unlockable keepsakes, eight placement spots per island, and live weather.";

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
