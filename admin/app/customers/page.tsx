'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  currency: string;
  joinDate: string;
  lastOrder: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data } = await api.get('/store/admin-orders');
        const orders = (data.orders || []) as Array<{
          id: string;
          customerName: string;
          email: string;
          total: number;
          currency: string;
          date: string;
        }>;
        const grouped = new Map<string, Customer>();
        orders.forEach((order) => {
          const email = (order.email || '').trim();
          const name = (order.customerName || '').trim();
          const keyBase = email.toLowerCase() || name.toLowerCase();
          const key = keyBase || `order-${order.id}`;
          const existing = grouped.get(key);
          const joinDate = existing ? (order.date < existing.joinDate ? order.date : existing.joinDate) : order.date;
          const lastOrder = existing ? (order.date > existing.lastOrder ? order.date : existing.lastOrder) : order.date;
          grouped.set(key, {
            id: existing?.id || key,
            name: name || existing?.name || 'Unknown',
            email: email || existing?.email || '—',
            phone: existing?.phone || '—',
            totalOrders: (existing?.totalOrders || 0) + 1,
            totalSpent: (existing?.totalSpent || 0) + (order.total || 0),
            currency: order.currency || existing?.currency || 'USD',
            joinDate,
            lastOrder,
          });
        });
        setCustomers(Array.from(grouped.values()));
      } catch (error) {
        toast.error('Failed to load customers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return customers
      .filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
        if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
        return a.name.localeCompare(b.name);
      });
  }, [customers, searchTerm, sortBy]);

  const formatTotal = (customer: Customer) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: customer.currency || 'USD' })
      .format(customer.totalSpent);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Customers</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Search Customers</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or email..."
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="spent">Total Spent</option>
              <option value="orders">Total Orders</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Phone</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Total Orders</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Total Spent</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Member Since</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                <td className="px-6 py-4 text-gray-700">{customer.email}</td>
                <td className="px-6 py-4 text-gray-700">{customer.phone}</td>
                <td className="px-6 py-4 text-gray-700 text-center font-medium">{customer.totalOrders}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{formatTotal(customer)}</td>
                <td className="px-6 py-4 text-gray-700">{customer.joinDate}</td>
                <td className="px-6 py-4 text-gray-700">{customer.lastOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLoading && (
        <div className="bg-white rounded-lg shadow p-8 text-center mt-6">
          <p className="text-gray-600">Loading customers...</p>
        </div>
      )}

      {!isLoading && filteredCustomers.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No customers found matching your search.</p>
        </div>
      )}
    </div>
  );
}
