import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

export const metadata: Metadata = {
  title: "Autofix-AI | Self-Healing L1/L2 IT Support Agent",
  description: "AI IT Support Console with Groq Vision OCR & Vectorize Hindsight Persistent Memory",
  icons: {
    icon: "/symbol.png",
    shortcut: "/symbol.png",
    apple: "/symbol.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/symbol.png" type="image/png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('autofix_theme');
                  if (stored === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0d0d12] text-slate-900 dark:text-slate-100 antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
