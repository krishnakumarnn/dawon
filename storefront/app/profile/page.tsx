 'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Profile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const DEFAULT_PROFILE: Profile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    const email = localStorage.getItem('user_email') || '';
    const name = localStorage.getItem('user_name') || '';
    const token = localStorage.getItem('user_token') || '';
    const profileKey = token ? `profile_${token}` : email ? `profile_${email}` : 'profile';
    const stored = localStorage.getItem(profileKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Profile;
        setProfile({
          ...DEFAULT_PROFILE,
          ...parsed,
          email: email || parsed.email || '',
          name: name || parsed.name || '',
        });
        return;
      } catch (error) {
        // ignore
      }
    }
    setProfile((prev) => ({
      ...prev,
      email,
      name,
    }));
  }, []);

  const handleChange = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const email = localStorage.getItem('user_email') || profile.email || '';
    const token = localStorage.getItem('user_token') || '';
    const profileKey = token ? `profile_${token}` : email ? `profile_${email}` : 'profile';
    localStorage.setItem(profileKey, JSON.stringify(profile));
    if (profile.email) {
      localStorage.setItem('user_email', profile.email);
    }
    if (profile.name) {
      localStorage.setItem('user_name', profile.name);
    }
    window.dispatchEvent(new Event('auth-change'));
    toast.success('Profile updated');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">My Profile</h1>
      <p className="text-gray-600 mb-8">Update your contact and delivery details.</p>

      <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Full Name</label>
            <input
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
              type="text"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
              type="email"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Phone</label>
            <input
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
              type="tel"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Country</label>
            <input
              value={profile.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
              type="text"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Address</label>
            <input
              value={profile.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
              type="text"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">City</label>
            <input
              value={profile.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
              type="text"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">State</label>
            <input
              value={profile.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
              type="text"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Zip Code</label>
            <input
              value={profile.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400"
              type="text"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
