import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
              __html: `(function(){try{var theme=localStorage.getItem('app-theme'),valid=['dark','light','cyber'];document.documentElement.dataset.theme=valid.indexOf(theme)!==-1?theme:'cyber'}catch(e){document.documentElement.dataset.theme='cyber'}})();`,
            }}
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}