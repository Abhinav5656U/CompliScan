import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiSave, FiUser } from 'react-icons/fi';

const ALLERGY_OPTIONS = ['Peanuts', 'Gluten', 'Lactose', 'Soy', 'Tree Nuts', 'Shellfish'];
const DIET_OPTIONS = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Diabetic', 'Halal'];

const ProfileSettings = () => {
  const { user, login } = useAuth(); // login function updates user in context
  const [allergies, setAllergies] = useState([]);
  const [diet, setDiet] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setAllergies(user.allergies || []);
      setDiet(user.diet_preferences || []);
    }
  }, [user]);

  const toggleAllergy = (option) => {
    setAllergies(prev => 
      prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]
    );
  };

  const toggleDiet = (option) => {
    setDiet(prev => 
      prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        allergies,
        diet_preferences: diet
      });
      toast.success('Profile updated successfully!');
      // Update local context manually or reload
      if (response.data.user) {
        // Just reload for simplicity if context doesn't have an update method
        window.location.reload();
      }
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-body">
      <div className="mb-8 border-b border-line pb-4">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy flex items-center gap-2">
          <FiUser /> Health Profile Settings
        </h1>
        <p className="text-sm text-[#555] mt-1">
          Customize your dietary preferences and allergies to get personalized alerts on scanned products.
        </p>
      </div>

      <div className="bg-white border border-line rounded-xs p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-navy mb-4 border-b border-line pb-2">Dietary Preferences</h2>
        <div className="flex flex-wrap gap-3">
          {DIET_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => toggleDiet(option)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                diet.includes(option) 
                  ? 'bg-navy text-white border-navy' 
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-line rounded-xs p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-navy mb-4 border-b border-line pb-2">Allergies</h2>
        <div className="flex flex-wrap gap-3">
          {ALLERGY_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => toggleAllergy(option)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                allergies.includes(option) 
                  ? 'bg-red-600 text-white border-red-600' 
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-navy hover:bg-navy-700 text-white rounded-xs text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <FiSave />
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
