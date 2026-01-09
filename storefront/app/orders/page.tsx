'use client';

import { useEffect, useMemo, useState } from 'react';

interface Order {
  id: string;
  date: string;
  createdAt?: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  itemsCount: number;
  currency: string;
  items?: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
    image?: string | null;
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const emailFromStorage = localStorage.getItem('user_email') || '';
      const token = localStorage.getItem('user_token') || '';
      const profileKey = token ? `profile_${token}` : emailFromStorage ? `profile_${emailFromStorage}` : 'profile';
      const storedProfile = localStorage.getItem(profileKey) || localStorage.getItem('profile');
      const parsedProfile = storedProfile ? (() => {
        try {
          return JSON.parse(storedProfile) as { email?: string; name?: string };
        } catch (error) {
          return {};
        }
      })() : {};
      const email = (emailFromStorage || parsedProfile.email || '').trim();
      const name = (localStorage.getItem('user_name') || parsedProfile.name || '').trim();
      const customerKey = token.trim();
      try {
        const urlBase = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/store/admin-orders`;
        const response = await fetch(urlBase, {
          headers: process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY
            ? { 'x-publishable-api-key': process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY }
            : undefined,
        });
        if (response.ok) {
          const data = await response.json();
          const list = (data.orders || []) as Array<Order & { email?: string; customerName?: string; customerKey?: string }>;
          const filtered = list.filter((order) => matchesOrder(order, email, name, customerKey));
          setOrders(filtered);
        } else {
          setOrders([]);
        }
      } catch (error) {
        setOrders([]);
      }
    };
    fetchOrders();
    const handleAuthChange = () => fetchOrders();
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const formatTotal = useMemo(
    () => (order: Order) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.total),
    []
  );

  const formatTime = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

  const matchesOrder = (
    order: Order & { email?: string; customerName?: string; customerKey?: string },
    email: string,
    name: string,
    customerKey: string
  ) => {
    if (customerKey && order.customerKey === customerKey) return true;
    if (email && order.email?.toLowerCase() === email.toLowerCase()) return true;
    if (name) {
      const normalizedQuery = normalize(name);
      const normalizedName = normalize(order.customerName || '');
      const emailLocal = (order.email || '').split('@')[0] || '';
      const normalizedEmailLocal = normalize(emailLocal);
      return (
        normalizedName === normalizedQuery ||
        normalizedEmailLocal === normalizedQuery ||
        normalizedEmailLocal.includes(normalizedQuery) ||
        normalizedQuery.includes(normalizedEmailLocal)
      );
    }
    return false;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg mb-6">You haven't placed any orders yet.</p>
          <a href="/products" className="inline-block bg-amber-500 text-white px-8 py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium">
            Start Shopping
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-gray-600 text-sm">Order ID</p>
                  <p className="font-bold text-gray-900">{order.id}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Date</p>
                  <p className="font-bold text-gray-900">{order.date}</p>
                  {order.createdAt && (
                    <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Items</p>
                  <p className="font-bold text-gray-900">{order.itemsCount}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm">Total</p>
                  <p className="font-bold text-amber-500 text-lg">{formatTotal(order)}</p>
                </div>
              </div>
              {order.items?.length ? (
                <div className="mt-4 border-t pt-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            '🛍️'
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">Qty {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' })
                          .format(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
