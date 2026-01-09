'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string | null;
};

type Profile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY;

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState('EUR');
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
    const email = localStorage.getItem('user_email') || '';
    const name = localStorage.getItem('user_name') || '';
    const token = localStorage.getItem('user_token') || '';
    const profileKey = token ? `profile_${token}` : email ? `profile_${email}` : 'profile';
    const storedProfile = localStorage.getItem(profileKey);
    setCartItems(storedCart);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as Profile;
        setProfile({
          ...profile,
          ...parsed,
          email: email || parsed.email,
          name: name || parsed.name,
        });
      } catch (error) {
        setProfile((prev) => ({ ...prev, email, name }));
      }
    } else {
      setProfile((prev) => ({ ...prev, email, name }));
    }
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/store/admin-settings`, {
          headers: PUBLISHABLE_API_KEY ? { 'x-publishable-api-key': PUBLISHABLE_API_KEY } : undefined,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.settings?.currency) {
            setCurrency(data.settings.currency);
          }
        }
      } catch (error) {
        // ignore
      }
    };
    loadSettings();
  }, []);

  const formatPrice = useMemo(
    () => (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value),
    [currency]
  );

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleChange = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      toast.error('Your cart is empty');
      return;
    }
    if (!profile.name || !profile.email) {
      toast.error('Please fill in your name and email');
      return;
    }
    try {
      const storedToken = localStorage.getItem('user_token');
      const customerKey = storedToken || `token_${Date.now()}`;
      if (!storedToken) {
        localStorage.setItem('user_token', customerKey);
      }
      const response = await fetch(`${API_BASE_URL}/store/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(PUBLISHABLE_API_KEY ? { 'x-publishable-api-key': PUBLISHABLE_API_KEY } : {}),
        },
        body: JSON.stringify({
          customerName: profile.name,
          email: profile.email,
          customerKey,
          total,
          currency,
          items: cartItems,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zipCode: profile.zipCode,
          country: profile.country,
        }),
      });
      if (!response.ok) {
        throw new Error('Order failed');
      }
      const resolvedEmail = profile.email || localStorage.getItem('user_email') || '';
      if (resolvedEmail) {
        localStorage.setItem('user_email', resolvedEmail);
      }
      if (profile.name) {
        localStorage.setItem('user_name', profile.name);
      }
      const profileKey = customerKey ? `profile_${customerKey}` : resolvedEmail ? `profile_${resolvedEmail}` : 'profile';
      localStorage.setItem('profile', JSON.stringify(profile));
      localStorage.setItem(profileKey, JSON.stringify(profile));
      localStorage.removeItem('cart');
      toast.success('Order placed successfully!');
      router.push('/orders');
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input
                  value={profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  type="text"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Phone</label>
                <input
                  value={profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  type="tel"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Country</label>
                <input
                  value={profile.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  type="text"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2">Address</label>
                <input
                  value={profile.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  type="text"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">City</label>
                <input
                  value={profile.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  type="text"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">State</label>
                <input
                  value={profile.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  type="text"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Zip Code</label>
                <input
                  value={profile.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  type="text"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover rounded-lg" />
                      ) : (
                        '🛍️'
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6 pb-6 border-b">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Shipping</span>
              <span>FREE</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax (10%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
          </div>
          <div className="flex justify-between mb-6">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-amber-500">{formatPrice(total)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            className="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-colors font-bold"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}
