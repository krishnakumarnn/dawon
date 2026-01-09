'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeDescription: z.string().min(1, 'Store description is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  businessHours: z.string().min(1, 'Business hours are required'),
  logoUrl: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const DEFAULT_SETTINGS: SettingsFormData = {
  storeName: 'DAW Store',
  storeDescription: 'Your premier digital audio workstation equipment store',
  email: 'info@dawstore.com',
  phone: '(555) 123-4567',
  address: '123 Music Street',
  city: 'Nashville',
  state: 'Tennessee',
  zipCode: '37201',
  country: 'United States',
  currency: 'USD',
  businessHours: 'Monday - Friday: 9AM - 6PM EST',
  logoUrl: '',
  facebook: 'https://facebook.com/dawstore',
  instagram: 'https://instagram.com/dawstore',
  twitter: 'https://twitter.com/dawstore',
  linkedin: 'https://linkedin.com/company/dawstore',
};

const LOGO_MAX_SIZE = 400000;

export default function SettingsPage() {
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoSource, setLogoSource] = useState<'upload' | 'url' | 'none'>('none');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_SETTINGS,
  });
  const logoUrlValue = watch('logoUrl');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get('/store/admin-settings');
        const settings = data.settings as SettingsFormData & { logo?: string };
        Object.keys(DEFAULT_SETTINGS).forEach((key) => {
          if (settings[key as keyof SettingsFormData]) {
            setValue(key as keyof SettingsFormData, settings[key as keyof SettingsFormData]);
          }
        });
        if (settings.logo && settings.logo !== '/logo.png') {
          setLogoPreview(settings.logo);
          setLogoSource('upload');
        } else if (settings.logoUrl) {
          setLogoPreview(settings.logoUrl);
          setValue('logoUrl', settings.logoUrl);
          setLogoSource('url');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, [setValue]);

  useEffect(() => {
    if (logoSource === 'upload') {
      return;
    }
    if (logoUrlValue) {
      setLogoPreview(logoUrlValue);
      setLogoSource('url');
    } else if (logoSource === 'url') {
      setLogoPreview('');
      setLogoSource('none');
    }
  }, [logoUrlValue, logoSource]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = { ...data };
      const logoTooLarge = logoPreview && logoPreview.length > LOGO_MAX_SIZE;
      if (logoTooLarge) {
        toast.error('Logo is too large to save. Please upload a smaller image.');
      }
      if (logoSource === 'upload' && !logoTooLarge && logoPreview) {
        payload.logo = logoPreview;
      }
      if (logoSource === 'url' && data.logoUrl) {
        payload.logo = data.logoUrl;
      }
      await api.post('/store/admin-settings', payload);
      toast.success('Store settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStorefrontBaseUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    const origin = window.location.origin;
    return origin.replace(':3001', ':3000');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > LOGO_MAX_SIZE) {
        toast.error('Logo is too large to save. Please upload a smaller image.');
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
          setLogoPreview(url);
          setLogoSource('url');
          setValue('logoUrl', url, { shouldValidate: true });
          toast.success('Logo uploaded');
        } catch (error) {
          toast.error('Failed to upload logo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      {!isLoaded && <div className="text-center py-8">Loading settings...</div>}
      {isLoaded && (
        <>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Store Settings</h1>

          <form onSubmit={handleSubmit(onSubmit)}>
        {/* Logo Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Store Logo</h2>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-4xl">🏪</span>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Upload Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <p className="text-sm text-gray-600 mt-2">Recommended: 200x200px PNG or JPG (max ~400KB)</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Store Name</label>
              <input
                {...register('storeName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.storeName && <p className="text-red-500 text-sm mt-1">{errors.storeName.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Currency</label>
              <select
                {...register('currency')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
              {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 font-medium mb-2">Logo URL</label>
            <input
              {...register('logoUrl')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-filled when you upload a logo.</p>
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 font-medium mb-2">Store Description</label>
            <textarea
              {...register('storeDescription')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            {errors.storeDescription && <p className="text-red-500 text-sm mt-1">{errors.storeDescription.message}</p>}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Phone</label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Address</label>
              <input
                {...register('address')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">City</label>
              <input
                {...register('city')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">State</label>
              <input
                {...register('state')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Zip Code</label>
              <input
                {...register('zipCode')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Country</label>
              <input
                {...register('country')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Business Hours</label>
              <input
                {...register('businessHours')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.businessHours && <p className="text-red-500 text-sm mt-1">{errors.businessHours.message}</p>}
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Social Media Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Facebook</label>
              <input
                {...register('facebook')}
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Instagram</label>
              <input
                {...register('instagram')}
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Twitter</label>
              <input
                {...register('twitter')}
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://twitter.com/..."
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">LinkedIn</label>
              <input
                {...register('linkedin')}
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://linkedin.com/company/..."
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition-colors font-medium"
          >
            Reset
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
}
