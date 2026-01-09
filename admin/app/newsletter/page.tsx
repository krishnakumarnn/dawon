'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

type Subscriber = {
  email: string;
  createdAt: string;
};

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const { data } = await api.get('/store/newsletter');
        setSubscribers(data.subscribers || []);
      } catch (error) {
        toast.error('Failed to load newsletter subscribers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return subscribers
      .filter((subscriber) => subscriber.email.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [subscribers, searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Newsletter Subscribers</h1>
        <div className="text-sm text-gray-600">Total: {subscribers.length}</div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block text-gray-700 font-medium mb-2">Search Email</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Search by email..."
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Subscribed At</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((subscriber) => (
              <tr key={subscriber.email} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{subscriber.email}</td>
                <td className="px-6 py-4 text-gray-700">
                  {new Date(subscriber.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                  {isLoading ? 'Loading subscribers...' : 'No subscribers found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
