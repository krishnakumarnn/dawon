'use client';

import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { useState, useEffect, useRef } from "react";
import { Toaster } from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [storeName, setStoreName] = useState('DAW Store');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeDescription, setStoreDescription] = useState('Your premier digital audio workstation equipment store');
  const [contactEmail, setContactEmail] = useState('info@dawstore.com');
  const [contactPhone, setContactPhone] = useState('+15551234567');
  const [contactPhoneDisplay, setContactPhoneDisplay] = useState('(555) 123-4567');
  const [socialLinks, setSocialLinks] = useState({
    facebook: '#',
    instagram: '#',
    twitter: '#',
    linkedin: '#',
  });
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const refreshAuth = () => {
      const token = localStorage.getItem('user_token');
      const user = localStorage.getItem('user_name');
      const cart = localStorage.getItem('cart');

      if (token) {
        setIsAuthenticated(true);
        setUserName(user || '');
      } else {
        setIsAuthenticated(false);
        setUserName('');
      }

      if (cart) {
        try {
          const cartItems = JSON.parse(cart);
          setCartCount(cartItems.length);
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    const handleAuthChange = () => refreshAuth();
    const handleCartChange = () => refreshAuth();
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    refreshAuth();
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('cart-change', handleCartChange);
    document.addEventListener('mousedown', handleClickOutside);
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/store/admin-settings`, {
          headers: PUBLISHABLE_API_KEY ? { 'x-publishable-api-key': PUBLISHABLE_API_KEY } : undefined,
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const settings = data.settings || {};
        if (settings.storeName) setStoreName(settings.storeName);
        if (settings.storeDescription) setStoreDescription(settings.storeDescription);
        if (settings.email) setContactEmail(settings.email);
        if (settings.phone) {
          setContactPhone(settings.phone.replace(/[^+0-9]/g, '') || '+15551234567');
          setContactPhoneDisplay(settings.phone || '(555) 123-4567');
        }
        if (settings.logo && settings.logo !== '/logo.png') setStoreLogo(settings.logo);
        setSocialLinks({
          facebook: settings.facebook || '#',
          instagram: settings.instagram || '#',
          twitter: settings.twitter || '#',
          linkedin: settings.linkedin || '#',
        });
      } catch (e) {
        // ignore
      }
    };

    loadSettings();
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('cart-change', handleCartChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    const token = localStorage.getItem('user_token');
    const email = localStorage.getItem('user_email');
    if (token) {
      localStorage.removeItem(`profile_${token}`);
    }
    if (email) {
      localStorage.removeItem(`profile_${email}`);
    }
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    setIsAuthenticated(false);
    setUserName('');
    setIsMenuOpen(false);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Navigation */}
        <header className="bg-white shadow-md sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-amber-500 flex items-center gap-2" aria-label={storeName}>
              {storeLogo && storeLogo !== '/logo.png' ? (
                <img src={storeLogo} alt={`${storeName} logo`} className="h-40 w-auto object-contain" />
              ) : (
                '🎵'
              )}
            </Link>

            <ul className="flex items-center gap-6 text-2xl">
              <li>
                <Link href="/" className={`font-medium transition-colors ${pathname === '/' ? 'text-amber-500' : 'text-gray-700 hover:text-amber-500'}`}>
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/products" className={`font-medium transition-colors ${pathname === '/products' ? 'text-amber-500' : 'text-gray-700 hover:text-amber-500'}`}>
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about" className={`font-medium transition-colors ${pathname === '/about' ? 'text-amber-500' : 'text-gray-700 hover:text-amber-500'}`}>
                  About
                </Link>
              </li>
            </ul>

            <div className="flex items-center gap-4 text-2xl">
              {isAuthenticated ? (
                <>
                  <Link href="/cart" className="relative flex items-center gap-2 text-gray-700 hover:text-amber-500">
                    🛒 Cart {cartCount > 0 && <span className="bg-red-600 text-white text-xs rounded-full px-2 py-1">{cartCount}</span>}
                  </Link>
                  <div className="relative" ref={menuRef}>
                    <button
                      className="font-medium text-gray-700 hover:text-amber-500"
                      onClick={() => setIsMenuOpen((open) => !open)}
                      aria-haspopup="true"
                      aria-expanded={isMenuOpen}
                    >
                      👤 {userName}
                    </button>
                    <div
                      className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ${isMenuOpen ? 'block' : 'hidden'}`}
                    >
                      <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 text-lg">
                        My Profile
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 text-lg">
                        My Orders
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 text-lg">
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/cart" className="flex items-center gap-2 text-gray-700 hover:text-amber-500">
                    🛒 Cart
                  </Link>
                  <Link href="/login" className="text-gray-700 hover:text-amber-500 font-medium">
                    Login
                  </Link>
                  <Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold mb-4">{storeName}</h3>
                <p className="text-gray-400">{storeDescription}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/" className="hover:text-white">Home</Link></li>
                  <li><Link href="/products" className="hover:text-white">Products</Link></li>
                  <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Customer Service</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href={`mailto:${contactEmail}`} className="hover:text-white">Email Support</a></li>
                  <li><a href={`tel:${contactPhone}`} className="hover:text-white">{contactPhoneDisplay}</a></li>
                  <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                  <li><Link href="/returns" className="hover:text-white">Returns & Shipping</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href={socialLinks.facebook} className="hover:text-white">Facebook</a></li>
                  <li><a href={socialLinks.instagram} className="hover:text-white">Instagram</a></li>
                  <li><a href={socialLinks.twitter} className="hover:text-white">Twitter</a></li>
                  <li><a href={socialLinks.linkedin} className="hover:text-white">LinkedIn</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-8">
              <p className="text-center text-gray-400">&copy; 2024 DAW Store. All rights reserved.</p>
            </div>
          </div>
        </footer>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
