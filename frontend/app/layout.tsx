import type { Metadata } from "next";
import { ClerkProvider, UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Call Assistant",
  description: "Real-time AI-powered call translation assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('app-theme');
                    if (theme === 'light' || theme === 'dark') {
                      document.documentElement.setAttribute('data-theme', theme);
                    } else {
                      document.documentElement.setAttribute('data-theme', 'dark');
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}