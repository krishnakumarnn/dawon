'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string | null;
  rating: number;
  stock: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY;

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('EUR');

  useEffect(() => {
    const fetchProduct = async () => {
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
        const response = await fetch(`${API_BASE_URL}/store/admin-products/${productId}`, {
          headers: PUBLISHABLE_API_KEY ? { 'x-publishable-api-key': PUBLISHABLE_API_KEY } : undefined,
        });
        if (response.ok) {
          const data = await response.json();
          const p = data.product;
          const prices = p?.variants?.[0]?.prices || [];
          const match = prices.find((price: any) => price.currency_code === currencyCode.toLowerCase());
          const amount = match?.amount ?? prices[0]?.amount ?? 0;
          setProduct({
            id: p.id,
            title: p.title || 'Product',
            description: p.description || '',
            price: amount / 100,
            category: p.collection?.title || p.categories?.[0]?.name || 'Uncategorized',
            image: p.thumbnail || p.images?.[0]?.url || null,
            rating: 4.5,
            stock:
              typeof p.variants?.[0]?.inventory_quantity === 'number'
                ? p.variants[0].inventory_quantity
                : typeof p.metadata?.admin_quantity === 'number'
                  ? p.metadata.admin_quantity
                  : null,
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const formatPrice = useMemo(
    () => (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value),
    [currency]
  );

  const handleAddToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        image: product.image,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-change'));
    toast.success(`${product.title} added to cart`);
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-6">Product not found.</p>
        <Link href="/products" className="text-amber-500 hover:underline font-medium">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-gray-100 rounded-xl overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="h-96 flex items-center justify-center text-6xl">🛍️</div>
          )}
        </div>
        <div>
          <p className="text-amber-500 font-semibold mb-2">{product.category}</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.title}</h1>
          <p className="text-gray-600 mb-6">{product.description || 'No description available.'}</p>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-amber-500">{formatPrice(product.price)}</span>
            <span className="text-yellow-500">⭐ {product.rating}</span>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {product.stock === null ? 'In stock' : product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors font-semibold disabled:opacity-50"
            >
              Add to Cart
            </button>
            <Link href="/cart" className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold">
              Go to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
