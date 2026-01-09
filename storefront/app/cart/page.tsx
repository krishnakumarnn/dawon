'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string | null;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('EUR');
  const router = useRouter();

  useEffect(() => {
    const loadCart = async () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
      let currencyCode = currency;
      try {
        const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/store/admin-settings`, {
          headers: process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY
            ? { 'x-publishable-api-key': process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY }
            : undefined,
        });
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.settings?.currency) {
            currencyCode = settingsData.settings.currency;
            setCurrency(currencyCode);
          }
        }
      } catch (err) {
        // ignore
      }

      try {
        const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/store/admin-products`, {
          headers: process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY
            ? { 'x-publishable-api-key': process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY }
            : undefined,
        });
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const products = productsData.products || [];
          const byId = new Map(products.map((product: any) => [product.id, product]));
          const updated = cart.map((item) => {
            const product = byId.get(item.id);
            if (!product) return item;
            const prices = product.variants?.[0]?.prices || [];
            const match = prices.find((price: any) => price.currency_code === currencyCode.toLowerCase());
            const amount = match?.amount ?? prices[0]?.amount ?? Math.round(item.price * 100);
            return {
              ...item,
              title: product.title || item.title,
              price: amount / 100,
              image: product.thumbnail || product.images?.[0]?.url || item.image,
            };
          });
          setCartItems(updated);
          localStorage.setItem('cart', JSON.stringify(updated));
        } else {
          setCartItems(cart);
        }
      } catch (err) {
        setCartItems(cart);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    const updated = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-change'));
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-change'));
    toast.success('Item removed from cart');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;
  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg mb-6">Your cart is empty</p>
          <Link href="/products" className="inline-block bg-amber-500 text-white px-8 py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {cartItems.map((item) => (
              <div key={item.id} className="p-6 border-b last:border-b-0 flex gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-3xl">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    '🛍️'
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-amber-500 font-semibold">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 font-semibold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold text-gray-900 w-24 text-right">{formatPrice(item.price * item.quantity)}</p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link href="/products" className="text-amber-500 hover:underline font-medium">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
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
              onClick={() => router.push('/checkout')}
              className="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-colors font-bold mb-3"
            >
              Proceed to Checkout
            </button>

            <button
              onClick={() => router.push('/products')}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Continue Shopping
            </button>

            {/* Trust Badges */}
            <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
              <p>✓ Secure checkout</p>
              <p>✓ Free shipping on orders over $50</p>
              <p>✓ 30-day money-back guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
