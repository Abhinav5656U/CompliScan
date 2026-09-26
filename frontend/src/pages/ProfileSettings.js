import React, { useState, useEffect, useRef } from 'react';
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
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [customAllergyInput, setCustomAllergyInput] = useState('');

  const handleAddCustomAllergy = () => {
    const trimmed = customAllergyInput.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies(prev => [...prev, trimmed]);
    }
    setCustomAllergyInput('');
  };

  useEffect(() => {
    if (user) {
      setAllergies(user.allergies || []);
      setDiet(user.diet_preferences || []);
      setFullName(user.full_name || '');
      setAge(user.age || '');
      setGender(user.gender || '');
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
        diet_preferences: diet,
        full_name: fullName,
        age: age ? parseInt(age, 10) : null,
        gender
      });
      toast.success('Profile updated successfully!');
      if (response.data.user) {
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
        <h2 className="text-lg font-bold text-navy mb-4 border-b border-line pb-2">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-line rounded-xs px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-navy"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input 
              type="number" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full border border-line rounded-xs px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-navy"
              placeholder="Age"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full border border-line rounded-xs px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-navy bg-white"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>
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
        <div className="flex flex-wrap gap-3 mb-4">
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
          {allergies.filter(a => !ALLERGY_OPTIONS.includes(a)).map(option => (
            <button
              key={option}
              onClick={() => toggleAllergy(option)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors border bg-red-600 text-white border-red-600 flex items-center gap-1"
            >
              {option} <span className="text-white/80 hover:text-white">&times;</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={customAllergyInput}
            onChange={(e) => setCustomAllergyInput(e.target.value)}
            placeholder="Type custom allergy..."
            className="flex-1 max-w-xs border border-line rounded-xs px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-navy"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomAllergy();
              }
            }}
          />
          <button 
            onClick={handleAddCustomAllergy}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xs transition-colors"
          >
            Add
          </button>
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
