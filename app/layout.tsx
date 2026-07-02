import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import PullToRefresh from "@/components/PullToRefresh";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "STRYDZ",
  description: "Connect Strava, visualize activities, get training insights.",
  appleWebApp: {
    capable: true,
    title: "STRYDZ",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#15140f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <div className="flex flex-col flex-1 mx-auto w-full max-w-md min-h-screen bg-background relative">
          <PullToRefresh />
          <main className="flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">{children}</main>
          <BottomNav />
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
