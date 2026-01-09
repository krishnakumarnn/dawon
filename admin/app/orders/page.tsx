'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface Order {
  id: string;
  customerName: string;
  email: string;
  total: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  itemsCount: number;
  date: string;
  shippingAddress: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/store/admin-orders');
      setOrders(data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await api.post(`/store/admin-orders/${orderId}`, { status: newStatus });
      await fetchOrders();
      setSelectedOrder(null);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Delete this order? This cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/store/admin-orders/${orderId}`);
      await fetchOrders();
      toast.success('Order deleted');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setShowDetails(false);
      }
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const formatTotal = (order: Order) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.total);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700">Order ID</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Customer</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Items</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Total</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-600">{order.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{order.itemsCount}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{formatTotal(order)}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">{order.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredOrders.length && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Order {selectedOrder.id}</h2>
            </div>

            <div className="p-6">
              {/* Order Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Customer</p>
                    <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-gray-600 text-sm">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Order Date</p>
                    <p className="font-medium text-gray-900">{selectedOrder.date}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                <p className="text-gray-700">{selectedOrder.shippingAddress}</p>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedOrder.itemsCount} items in this order</p>
                </div>
              </div>

              {/* Order Total */}
              <div className="mb-6 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">{formatTotal(selectedOrder)}</span>
                </div>
              </div>

              {/* Status Update Buttons */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'processing', 'completed', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedOrder.status === status
                          ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                className="w-full mt-4 px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete Order
              </button>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full mt-6 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
