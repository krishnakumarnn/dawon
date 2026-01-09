'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string | null;
  rating: number;
  stock: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_API_KEY;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const searchParams = useSearchParams();

  const filteredProducts = products
    .filter(p => {
      const matchCategory = !selectedCategory || p.category === selectedCategory;
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const handleAddToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-change'));
    toast.success(`${product.title} added to cart!`);
  };

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
      } catch (err) {
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
              stock:
                typeof p.variants?.[0]?.inventory_quantity === 'number'
                  ? p.variants[0].inventory_quantity
                  : typeof p.metadata?.admin_quantity === 'number'
                    ? p.metadata.admin_quantity
                    : null,
            }));
            setProducts(formattedProducts);
            return;
          }
        }
      } catch (err) {
        // keep empty on failure
      }
    };

    fetchSettingsAndProducts();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam === 'All' ? '' : categoryParam);
    }
  }, [searchParams]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Products</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div>
          <label className="block text-gray-700 font-semibold mb-3">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
            placeholder="Search products..."
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-3">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
          >
            <option value="">All Categories</option>
            {categories.slice(1).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-3">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setSortBy('featured');
            }}
            className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Link href={`/products/${product.id}`}>
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-5xl">
                {product.image ? (
                  <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  '🛍️'
                )}
              </div>
            </Link>
            <div className="p-4">
              <Link href={`/products/${product.id}`}>
                <p className="text-amber-500 text-xs font-semibold mb-1">{product.category.toUpperCase()}</p>
                <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
              </Link>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-amber-500">{formatPrice(product.price)}</span>
                <span className="text-yellow-500 text-sm">⭐ {product.rating}</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                {product.stock === null ? 'In stock' : product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
                className="w-full bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found in the database.</p>
        </div>
      )}
    </div>
  );
}
