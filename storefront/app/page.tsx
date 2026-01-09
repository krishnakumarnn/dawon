'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string | null;
  rating: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('EUR');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const fetchSettingsAndProducts = async () => {
      let currencyCode = currency;
      try {
        const settingsResponse = await fetch(`${API_BASE_URL}/store/admin-settings`, {
          headers: PUBLISHABLE_API_KEY ? { 'x-publishable-api-key': PUBLISHABLE_API_KEY } : undefined,
        });
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.settings?.currency) {
            currencyCode = settingsData.settings.currency;
            setCurrency(currencyCode);
          }
        }
      } catch (error) {
        // ignore
      }

      try {
        const response = await fetch(`${API_BASE_URL}/store/admin-products`, {
          headers: PUBLISHABLE_API_KEY ? { 'x-publishable-api-key': PUBLISHABLE_API_KEY } : undefined,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            const formattedProducts = data.products.map((p: any) => ({
              id: p.id,
              title: p.title || 'Product',
              price: (() => {
                const prices = p.variants?.[0]?.prices || [];
                const match = prices.find((price: any) => price.currency_code === currencyCode.toLowerCase());
                const amount = match?.amount ?? prices[0]?.amount ?? 0;
                return amount / 100;
              })(),
              category: p.collection?.title || p.categories?.[0]?.name || 'Uncategorized',
              image: p.thumbnail || p.images?.[0]?.url || null,
              rating: 4.5,
            }));
            setProducts(formattedProducts);
          }
        }
      } catch (error) {
        console.log('Failed to load products from API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettingsAndProducts();
  }, []);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

  const categoryCounts = products.reduce<Record<string, number>>((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  const categories = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }));

  const categoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('access')) return '🎁';
    if (lower.includes('premium')) return '👑';
    if (lower.includes('bundle')) return '📦';
    if (lower.includes('software')) return '💻';
    if (lower.includes('hardware')) return '🎛️';
    return '🛍️';
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-500 to-amber-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to Dawon Store</h1>
          <p className="text-xl mb-8">Premium Mobility Solutions for Active Living - Rollators & Walkers</p>
          <div className="flex gap-4 justify-center">
            <Link href="/products" className="bg-white text-amber-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Shop Now
            </Link>
            <Link href="/about" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-500 transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Featured Products</h2>
        {!loading && products.length === 0 && (
          <p className="text-center text-gray-600 mb-8">No products found in the database.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow overflow-hidden cursor-pointer">
                <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    '🛍️'
                  )}
                </div>
                <div className="p-6">
                  <p className="text-amber-500 text-sm font-semibold mb-2">{product.category}</p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{product.title}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-amber-500">{formatPrice(product.price)}</span>
                    <span className="text-yellow-500">⭐ {product.rating}</span>
                  </div>
                  <button className="w-full bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Shop by Category</h2>
          {!loading && categories.length === 0 && (
            <p className="text-center text-gray-600 mb-8">No categories found in the database.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/products?category=${cat.name}`}>
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-8 text-center cursor-pointer transition-shadow">
                  <div className="text-5xl mb-4">{categoryIcon(cat.name)}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.name}</h3>
                  <p className="text-gray-600">{cat.count} products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Why Choose DAW Store?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '✅', title: 'Quality Products', desc: 'We offer only authentic, high-quality audio equipment from trusted brands.' },
            { icon: '🚚', title: 'Fast Shipping', desc: 'Get your gear quickly with our efficient shipping and delivery options.' },
            { icon: '💰', title: 'Best Prices', desc: 'Competitive pricing with regular deals and discounts for our customers.' },
            { icon: '🤝', title: 'Expert Support', desc: 'Our team of audio experts is ready to help you find the perfect gear.' },
            { icon: '🔄', title: 'Easy Returns', desc: '30-day money-back guarantee on all purchases.' },
            { icon: '🔒', title: 'Secure Shopping', desc: 'Your payment and personal information is always secure with us.' },
          ].map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-amber-500 text-white py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="mb-6">Get exclusive deals, new product announcements, and audio tips delivered to your inbox.</p>
          <form
            className="flex gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!newsletterEmail) {
                toast.error('Please enter an email');
                return;
              }
              setIsSubscribing(true);
              try {
                const response = await fetch(`${API_BASE_URL}/store/newsletter`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(PUBLISHABLE_API_KEY ? { 'x-publishable-api-key': PUBLISHABLE_API_KEY } : {}),
                  },
                  body: JSON.stringify({ email: newsletterEmail }),
                });
                if (!response.ok) {
                  throw new Error('Failed to subscribe');
                }
                setNewsletterEmail('');
                toast.success('Subscribed successfully!');
              } catch (error) {
                toast.error('Failed to subscribe');
              } finally {
                setIsSubscribing(false);
              }
            }}
          >
            <input
              type="email"
              placeholder="Enter your email..."
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="bg-white text-amber-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              {isSubscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
