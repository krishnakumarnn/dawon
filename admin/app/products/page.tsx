'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const IMAGE_MAX_SIZE = 400000;

const productSchema = z.object({
  title: z.string().min(1, 'Product title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
  quantity: z.number().int().nonnegative('Quantity must be non-negative'),
  category: z.string().min(1, 'Category is required'),
  imageUrl: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product extends ProductFormData {
  id: string;
  image?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'upload' | 'url' | 'none'>('none');
  const [currency, setCurrency] = useState('USD');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });
  const imageUrlValue = watch('imageUrl');

  const mapProduct = (product: any): Product => {
    const variant = product.variants?.[0];
    const priceAmount = variant?.prices?.[0]?.amount ?? 0;
    const adminQuantity = typeof product.metadata?.admin_quantity === 'number' ? product.metadata.admin_quantity : 0;
    return {
      id: product.id,
      title: product.title || 'Product',
      description: product.description || '',
      price: priceAmount / 100,
      sku: variant?.sku || '',
      quantity: typeof variant?.inventory_quantity === 'number' ? variant.inventory_quantity : adminQuantity,
      category: product.collection?.title || product.categories?.[0]?.name || 'Other',
      image: product.thumbnail || product.images?.[0]?.url,
    };
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/store/admin-products', {
        params: {
          limit: 200,
        },
      });
      const items = (data.products || []).map(mapProduct);
      setProducts(items);
    } catch (error) {
      toast.error('Failed to load products from the backend');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/store/product-categories', {
        params: {
          limit: 200,
        },
      });
      const names = (data.product_categories || [])
        .map((category: any) => category.name)
        .filter(Boolean);
      setCategories(names);
    } catch (error) {
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/store/admin-settings');
        if (data?.settings?.currency) {
          setCurrency(data.settings.currency);
        }
      } catch (error) {
        // keep default
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (imageSource === 'upload') {
      return;
    }
    if (imageUrlValue) {
      setImagePreview(imageUrlValue);
      setImageSource('url');
    } else if (imageSource === 'url') {
      setImagePreview(null);
      setImageSource('none');
    }
  }, [imageUrlValue, imageSource]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const payload: Record<string, unknown> = { ...data };
      if (imageSource === 'url' && data.imageUrl) {
        payload.image_url = data.imageUrl;
      }
      if (imageSource === 'upload' && imagePreview) {
        if (imagePreview.length > IMAGE_MAX_SIZE) {
          toast.error('Image is too large. Please upload a smaller image.');
        } else {
          payload.image = imagePreview;
        }
      }
      if (editingId) {
        await api.post(`/store/admin-products/${editingId}`, payload);
        toast.success('Product updated successfully!');
        setEditingId(null);
      } else {
        await api.post('/store/admin-products', payload);
        toast.success('Product added successfully!');
      }
      await fetchProducts();
      reset();
      setShowForm(false);
      setImagePreview(null);
    } catch (error) {
      const message = (error as any)?.response?.data?.message || 'Failed to save product';
      toast.error(message);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    reset({
      title: product.title,
      description: product.description,
      price: product.price,
      sku: product.sku,
      quantity: product.quantity,
      category: product.category,
      imageUrl: product.image,
    });
    setImagePreview(product.image || null);
    setImageSource(product.image ? 'url' : 'none');
    setShowForm(true);
  };

  const getStorefrontBaseUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    const origin = window.location.origin;
    return origin.replace(':3001', ':3000');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > IMAGE_MAX_SIZE) {
      toast.error('Image is too large. Please upload a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      if (!result) return;
      try {
        const { data } = await api.post('/store/admin-upload-image', {
          dataUrl: result,
          filename: file.name,
        });
        const uploadedPath = data?.url as string | undefined;
        const url = uploadedPath ? `${getStorefrontBaseUrl()}${uploadedPath}` : undefined;
        if (!url) {
          throw new Error('No URL returned');
        }
        setImagePreview(url);
        setImageSource('url');
        setValue('imageUrl', url, { shouldValidate: true });
        toast.success('Image uploaded');
      } catch (error) {
        toast.error('Failed to upload image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }
    api
      .delete(`/store/admin-products/${id}`)
      .then(() => {
        toast.success('Product deleted successfully!');
        fetchProducts();
      })
      .catch(() => {
        toast.error('Failed to delete product');
      });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
    setImagePreview(null);
    setImageSource('none');
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchProducts}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {loading ? 'Loading...' : 'Reload from Store'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Product Title</label>
                <input
                  {...register('title')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MIDI Keyboard"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Price ({currency})</label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">SKU</label>
                <input
                  {...register('sku')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MIDI-001"
                />
                {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku.message}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Quantity</label>
                <input
                  {...register('quantity', { valueAsNumber: true })}
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Category</label>
                <input
                  {...register('category')}
                  list="category-options"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Select or type a new category"
                />
                <datalist id="category-options">
                  <option value="Other" />
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Image URL</label>
                <input
                  {...register('imageUrl')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-filled when you upload a file.</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <p className="text-xs text-gray-500 mt-1">Max size ~400KB</p>
              </div>
            </div>

            {imagePreview && (
              <div className="mb-4">
                <p className="text-gray-700 font-medium mb-2">Image Preview</p>
                <img src={imagePreview} alt="Preview" className="h-32 w-32 rounded-lg object-cover" />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                {...register('description')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Product description"
                rows={3}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700">Product</th>
              <th className="px-6 py-3 font-semibold text-gray-700">SKU</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Price</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Quantity</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{product.title}</p>
                      <p className="text-sm text-gray-600">
                        {product.description ? `${product.description.substring(0, 50)}...` : 'No description'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{product.sku}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{formatPrice(product.price)}</td>
                <td className="px-6 py-4 text-gray-700">{product.quantity}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-6 text-center text-gray-600">No products found in the database.</div>
        )}
      </div>
    </div>
  );
}
