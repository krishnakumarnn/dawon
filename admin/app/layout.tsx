'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const menuItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Products', href: '/products' },
  { label: 'Orders', href: '/orders' },
  { label: 'Customers', href: '/customers' },
  { label: 'Newsletter', href: '/newsletter' },
  { label: 'Store Settings', href: '/settings' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storeName, setStoreName] = useState('DAWON');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    setIsAuthenticated(!!token);
    setIsLoading(false);

    if (!token && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    const storedName = localStorage.getItem('store_name');
    if (storedName) {
      setStoreName(storedName);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    router.push('/login');
  };

  if (isLoading) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <div className="flex items-center justify-center h-screen">Loading...</div>
        </body>
      </html>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    );
  }

  if (pathname === '/login') {
    return (
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar */}
          <div className="w-64 bg-gray-900 text-white shadow-lg flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h1 className="text-2xl font-bold text-white">{storeName}</h1>
            </div>
            <nav className="p-4 flex-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg mb-2 transition-colors ${
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <header className="bg-white shadow sticky top-0 z-10">
              <div className="px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
              </div>
            </header>
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
