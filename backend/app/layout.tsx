import React from 'react';
import { Providers } from '@/components/Providers';

export const metadata = {
  title: 'DevDash - Project Catalog',
  description: 'Developer dashboard for personal infrastructure management',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              font-family: 'Inter', sans-serif;
            }
            /* Custom scrollbar for webkit - dark theme */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #1e293b;
            }
            ::-webkit-scrollbar-thumb {
              background: #475569;
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #64748b;
            }
          `
        }} />
      </head>
      <body className="bg-slate-950 text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
