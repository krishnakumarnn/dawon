'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Array<{ id: string; customer: string; amount: number; currency: string; status: string }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentOrders: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get('/store/admin-orders'),
          api.get('/store/admin-products', { params: { limit: 200 } }),
        ]);
        const orders = ordersRes.data?.orders || [];
        const products = productsRes.data?.products || [];
        const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
        const customerSet = new Set(orders.map((order: any) => order.email).filter(Boolean));
        setStats({
          totalOrders: orders.length,
          totalRevenue,
          totalProducts: products.length,
          totalCustomers: customerSet.size,
          recentOrders: orders.slice(0, 5).map((order: any) => ({
            id: order.id,
            customer: order.customerName || order.email || 'Customer',
            amount: order.total || 0,
            currency: order.currency || 'USD',
            status: order.status || 'pending',
          })),
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const formatAmount = useMemo(
    () => (amount: number, currency: string) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount),
    []
  );

  const StatCard = ({ label, value, icon }: { label: string; value: string | number; icon: string }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl text-gray-300">{icon}</div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Orders" value={stats.totalOrders} icon="📦" />
        <StatCard label="Total Revenue" value={formatAmount(stats.totalRevenue, 'EUR')} icon="💰" />
        <StatCard label="Total Products" value={stats.totalProducts} icon="🛍️" />
        <StatCard label="Total Customers" value={stats.totalCustomers} icon="👥" />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Order ID</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Customer</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{order.id}</td>
                  <td className="px-4 py-3 text-gray-700">{order.customer}</td>
                  <td className="px-4 py-3 text-gray-700">{formatAmount(order.amount, order.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
