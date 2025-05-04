import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { AuthRedirect } from '@/components/AuthRedirect';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';

export const metadata: Metadata = {
  title: 'Love Entrepreneurs',
  description: 'Find your perfect entrepreneur match',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <AuthRedirect>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
            <ChatWidget />
          </AuthRedirect>
        </AuthProvider>
      </body>
    </html>
  );
}
