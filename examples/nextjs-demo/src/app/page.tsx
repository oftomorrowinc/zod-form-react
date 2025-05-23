'use client';

import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

// Define schemas similar to the original examples
const basicSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18').max(100, 'Must be less than 100'),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  agree: z.boolean().refine(val => val, 'You must agree to the terms'),
});

const complexSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    website: z.string().url('Must be a valid URL').optional(),
  }),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    notifications: z.boolean(),
    newsletter: z.boolean(),
    rating: z.number().min(1).max(5),
  }),
  experience: z.enum(['junior', 'mid', 'senior', 'lead']),
  availability: z.enum(['full-time', 'part-time', 'contract', 'freelance']),
});

type BasicFormData = z.infer<typeof basicSchema>;
type ComplexFormData = z.infer<typeof complexSchema>;

// Enhanced comprehensive schema exactly matching the original
const enhancedAllFieldsSchema = z.object({
  // Basic text inputs
  name: z.string().min(2, 'Name must contain at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  
  // URL validation with placeholder
  website: z.string().url('Please enter a valid URL').optional(),
  
  // Numbers and ranges
  age: z.number().min(18, 'You must be at least 18 years old').max(120),
  temperature: z.number().min(0, 'Temperature must be positive').max(1, 'Temperature must be between 0 and 1'),
  
  // Star rating (1-5)
  satisfaction: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  
  // Select and enum
  country: z.enum(['usa', 'canada', 'uk', 'australia', 'other'], {
    errorMap: () => ({ message: 'Please select a valid country' })
  }),
  
  // Email subscription checkbox
  subscribe: z.boolean(),
  termsAccepted: z.boolean().refine(val => val, 'You must accept the terms'),
  
  // Date
  birthdate: z.string(),
  
  // Textareas with document upload capability
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  notes: z.string().min(5, 'Notes must be at least 5 characters').optional(),
  
  // Document upload with text extraction
  documentText: z.string().min(5, 'Document text must be at least 5 characters').optional(),
  
  // Array fields with add/remove functionality
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  
  // Nested object
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(1, 'Postal code is required')
  }).optional(),
  
  // Contact preference that changes form below
  contactPreference: z.enum(['email', 'phone', 'mail']),
  
  // Conditional fields based on contact preference
  phoneNumber: z.string().optional(),
  alternativeEmail: z.string().email('Please enter a valid alternative email').optional(),
  mailingAddress: z.string().optional()
});

type EnhancedFormData = z.infer<typeof enhancedAllFieldsSchema>;

// Star Rating Component
const StarRating = ({ 
  value, 
  onChange, 
  maxStars = 5, 
  size = 'md',
  error 
}: {
  value: number;
  onChange: (value: number) => void;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  error?: { message?: string };
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const isFilled = displayValue >= starValue;
        
        return (
          <button
            key={index}
            type="button"
            className={`${sizeClasses[size]} transition-colors duration-150 ${
              isFilled 
                ? 'text-yellow-400' 
                : 'text-gray-600 hover:text-yellow-400/50'
            } ${error ? 'text-red-400' : ''}`}
            onMouseEnter={() => setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={() => onChange(starValue)}
          >
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-400">
        {value > 0 ? `${value}/${maxStars}` : 'Not rated'}
      </span>
    </div>
  );
};

// Enhanced Textarea with Document Upload
const DocumentTextarea = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  error
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: { message?: string };
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onChange(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-vertical ${
          error ? 'border-red-400' : 'border-gray-600'
        }`}
        placeholder={placeholder}
      />
      <label className="absolute top-3 right-3 cursor-pointer text-purple-400 hover:text-purple-300">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <input
          type="file"
          accept=".txt,.md,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>
    </div>
  );
};

// Array Field Component
const ArrayField = ({
  items,
  onAdd,
  onRemove,
  availableOptions,
  label,
  error
}: {
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  availableOptions: { value: string; label: string }[];
  label: string;
  error?: { message?: string };
}) => {
  const [selectedValue, setSelectedValue] = useState('');

  const handleAdd = () => {
    if (selectedValue && !items.includes(selectedValue)) {
      onAdd(selectedValue);
      setSelectedValue('');
    }
  };

  const availableToAdd = availableOptions.filter(opt => !items.includes(opt.value));

  return (
    <div className={`border rounded-lg p-4 ${error ? 'border-red-400' : 'border-gray-600'}`}>
      <h4 className="font-medium mb-3">{label}</h4>
      
      {/* Current Items */}
      <div className="space-y-2 mb-4">
        {items.map((item, index) => {
          const option = availableOptions.find(opt => opt.value === item);
          return (
            <div key={index} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded">
              <span>{option?.label || item}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-red-400 hover:text-red-300 ml-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add New Item */}
      {availableToAdd.length > 0 && (
        <div className="flex space-x-2">
          <select
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select an interest...</option>
            {availableToAdd.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedValue}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            Add Interest
          </button>
        </div>
      )}
    </div>
  );
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'basic' | 'complex' | 'allfields'>('basic');
  const [submittedData, setSubmittedData] = useState<{ type: string; data: BasicFormData | ComplexFormData | EnhancedFormData } | null>(null);

  // Basic form
  const basicForm = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      name: '',
      email: '',
      age: 18,
      bio: '',
      agree: false,
    },
  });

  // Complex form
  const complexForm = useForm<ComplexFormData>({
    resolver: zodResolver(complexSchema),
    defaultValues: {
      profile: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        website: '',
      },
      preferences: {
        theme: 'light' as const,
        notifications: false,
        newsletter: false,
        rating: 5,
      },
      experience: 'junior' as const,
      availability: 'full-time' as const,
    },
  });

  // Enhanced form (All Field Types)
  const enhancedForm = useForm<EnhancedFormData>({
    resolver: zodResolver(enhancedAllFieldsSchema),
    defaultValues: {
      name: '',
      email: '',
      website: '',
      age: 25,
      temperature: 0.5,
      satisfaction: 3,
      country: 'usa',
      subscribe: false,
      termsAccepted: false,
      birthdate: '1990-01-01',
      bio: '',
      notes: '',
      documentText: '',
      interests: [],
      address: {
        street: '',
        city: '',
        postalCode: ''
      },
      contactPreference: 'email',
      phoneNumber: '',
      alternativeEmail: '',
      mailingAddress: ''
    },
    mode: 'onChange',
  });

  const { control, watch } = enhancedForm;
  const contactPreference = watch('contactPreference');
  const temperature = watch('temperature');

  // Available interests matching the original
  const interestOptions = [
    { value: 'sports', label: 'Sports' },
    { value: 'music', label: 'Music' },
    { value: 'movies', label: 'Movies' },
    { value: 'reading', label: 'Reading' },
    { value: 'travel', label: 'Travel' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'technology', label: 'Technology' }
  ];

  const onBasicSubmit = (data: BasicFormData) => {
    console.log('Basic form submitted:', data);
    setSubmittedData({ type: 'basic', data });
  };

  const onComplexSubmit = (data: ComplexFormData) => {
    console.log('Complex form submitted:', data);
    setSubmittedData({ type: 'complex', data });
  };

  const onEnhancedSubmit = (data: EnhancedFormData) => {
    console.log('Enhanced form submitted:', data);
    setSubmittedData({ type: 'allfields', data });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Zod Form React Demo
        </h1>
        
        <p className="text-center text-gray-300 mb-8">
          This demo shows the converted React component library from the original Node.js/Express version.
          The forms below use React Hook Form with Zod validation, maintaining the same schema-driven approach.
        </p>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1 flex space-x-1">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'basic'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Basic Form
            </button>
            <button
              onClick={() => setActiveTab('complex')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'complex'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Nested Form Fields
            </button>
            <button
              onClick={() => setActiveTab('allfields')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'allfields'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              All Field Types
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - spans 2 columns */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">
              {activeTab === 'basic' ? 'Basic Form Example' : activeTab === 'complex' ? 'Nested Form Fields Example' : 'All Field Types Example'}
            </h2>

            {activeTab === 'basic' ? (
              <form onSubmit={basicForm.handleSubmit(onBasicSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    {...basicForm.register('name')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                  {basicForm.formState.errors.name && (
                    <p className="text-red-400 text-sm mt-1">
                      {basicForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    {...basicForm.register('email')}
                    type="email"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                  {basicForm.formState.errors.email && (
                    <p className="text-red-400 text-sm mt-1">
                      {basicForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Age *</label>
                  <input
                    {...basicForm.register('age', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter your age"
                  />
                  {basicForm.formState.errors.age && (
                    <p className="text-red-400 text-sm mt-1">
                      {basicForm.formState.errors.age.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio *</label>
                  <textarea
                    {...basicForm.register('bio')}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                  {basicForm.formState.errors.bio && (
                    <p className="text-red-400 text-sm mt-1">
                      {basicForm.formState.errors.bio.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    {...basicForm.register('agree')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm">I agree to the terms and conditions *</label>
                </div>
                {basicForm.formState.errors.agree && (
                  <p className="text-red-400 text-sm">
                    {basicForm.formState.errors.agree.message}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Submit Basic Form
                </button>
              </form>
            ) : activeTab === 'complex' ? (
              <form onSubmit={complexForm.handleSubmit(onComplexSubmit)} className="space-y-6">
                {/* Profile Section */}
                <div className="border border-gray-600 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Profile Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name *</label>
                      <input
                        {...complexForm.register('profile.firstName')}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="First name"
                      />
                      {complexForm.formState.errors.profile?.firstName && (
                        <p className="text-red-400 text-sm mt-1">
                          {complexForm.formState.errors.profile.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input
                        {...complexForm.register('profile.lastName')}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Last name"
                      />
                      {complexForm.formState.errors.profile?.lastName && (
                        <p className="text-red-400 text-sm mt-1">
                          {complexForm.formState.errors.profile.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="border border-gray-600 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Preferences</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Theme</label>
                      <select
                        {...complexForm.register('preferences.theme')}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Rating (1-5)</label>
                      <input
                        {...complexForm.register('preferences.rating', { valueAsNumber: true })}
                        type="range"
                        min="1"
                        max="5"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Experience and Availability */}
                <div className="border border-gray-600 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Professional Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Experience Level</label>
                      <select
                        {...complexForm.register('experience')}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="junior">Junior</option>
                        <option value="mid">Mid-level</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Availability</label>
                      <select
                        {...complexForm.register('availability')}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="freelance">Freelance</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Submit Nested Form
                </button>
              </form>
            ) : activeTab === 'allfields' ? (
              <form onSubmit={enhancedForm.handleSubmit((data) => onEnhancedSubmit(data))} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...enhancedForm.register('name')}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        enhancedForm.formState.errors.name ? 'border-red-400' : 'border-gray-600'
                      }`}
                      placeholder="Enter your name"
                    />
                    {enhancedForm.formState.errors.name && (
                      <p className="text-red-400 text-sm mt-1">
                        {enhancedForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...enhancedForm.register('email')}
                      type="email"
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        enhancedForm.formState.errors.email ? 'border-red-400' : 'border-gray-600'
                      }`}
                      placeholder="Enter your email"
                    />
                    {enhancedForm.formState.errors.email && (
                      <p className="text-red-400 text-sm mt-1">
                        {enhancedForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      {...enhancedForm.register('website')}
                      type="url"
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        enhancedForm.formState.errors.website ? 'border-red-400' : 'border-gray-600'
                      }`}
                      placeholder="https://example.com"
                    />
                    {enhancedForm.formState.errors.website && (
                      <p className="text-red-400 text-sm mt-1">
                        {enhancedForm.formState.errors.website.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Age <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...enhancedForm.register('age', { valueAsNumber: true })}
                      type="number"
                      min="18"
                      max="120"
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        enhancedForm.formState.errors.age ? 'border-red-400' : 'border-gray-600'
                      }`}
                    />
                    {enhancedForm.formState.errors.age && (
                      <p className="text-red-400 text-sm mt-1">
                        {enhancedForm.formState.errors.age.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Temperature Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Temperature <span className="text-red-400">*</span>
                  </label>
                  <p className="text-sm text-gray-400 mb-2">Temperature: {temperature.toFixed(2)}°C</p>
                  <input
                    {...enhancedForm.register('temperature', { valueAsNumber: true })}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0°C</span>
                    <span>1°C</span>
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Satisfaction Rating <span className="text-red-400">*</span>
                  </label>
                  <Controller
                    name="satisfaction"
                    control={control}
                    render={({ field, fieldState }) => (
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        maxStars={5}
                        error={fieldState.error}
                      />
                    )}
                  />
                  {enhancedForm.formState.errors.satisfaction && (
                    <p className="text-red-400 text-sm mt-1">
                      {enhancedForm.formState.errors.satisfaction.message}
                    </p>
                  )}
                </div>

                {/* Country Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Country <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...enhancedForm.register('country')}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      enhancedForm.formState.errors.country ? 'border-red-400' : 'border-gray-600'
                    }`}
                  >
                    <option value="">-- Select --</option>
                    <option value="usa">United States</option>
                    <option value="canada">Canada</option>
                    <option value="uk">United Kingdom</option>
                    <option value="australia">Australia</option>
                    <option value="other">Other</option>
                  </select>
                  {enhancedForm.formState.errors.country && (
                    <p className="text-red-400 text-sm mt-1">
                      {enhancedForm.formState.errors.country.message}
                    </p>
                  )}
                </div>

                {/* Newsletter Subscription */}
                <div>
                  <label className="block text-sm font-medium mb-2">Subscribe to our newsletter via email</label>
                  <div className="flex items-center space-x-2">
                    <input
                      {...enhancedForm.register('subscribe')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">Yes, send me updates</span>
                  </div>
                </div>

                {/* Terms Accepted */}
                <div className="flex items-center space-x-2">
                  <input
                    {...enhancedForm.register('termsAccepted')}
                    type="checkbox"
                    className={`h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 ${
                      enhancedForm.formState.errors.termsAccepted ? 'border-red-400' : ''
                    }`}
                  />
                  <label className="text-sm">
                    Terms Accepted <span className="text-red-400">*</span>
                  </label>
                </div>
                {enhancedForm.formState.errors.termsAccepted && (
                  <p className="text-red-400 text-sm">
                    {enhancedForm.formState.errors.termsAccepted.message}
                  </p>
                )}

                {/* Birthdate */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Birthdate <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...enhancedForm.register('birthdate')}
                    type="date"
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      enhancedForm.formState.errors.birthdate ? 'border-red-400' : 'border-gray-600'
                    }`}
                  />
                </div>

                {/* Bio with Document Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bio <span className="text-red-400">*</span>
                  </label>
                  <Controller
                    name="bio"
                    control={control}
                    render={({ field, fieldState }) => (
                      <DocumentTextarea
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Tell us about yourself..."
                        rows={5}
                        error={fieldState.error}
                      />
                    )}
                  />
                  {enhancedForm.formState.errors.bio && (
                    <p className="text-red-400 text-sm mt-1">
                      {enhancedForm.formState.errors.bio.message}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <DocumentTextarea
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Additional notes here..."
                        rows={3}
                      />
                    )}
                  />
                </div>

                {/* Document Text */}
                <div>
                  <label className="block text-sm font-medium mb-2">Document Text</label>
                  <Controller
                    name="documentText"
                    control={control}
                    render={({ field }) => (
                      <DocumentTextarea
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Upload a document to extract text or enter text directly..."
                        rows={4}
                      />
                    )}
                  />
                </div>

                {/* Interests Array */}
                <div>
                  <Controller
                    name="interests"
                    control={control}
                    render={({ field, fieldState }) => (
                      <ArrayField
                        items={field.value}
                        onAdd={(value) => field.onChange([...field.value, value])}
                        onRemove={(index) => field.onChange(field.value.filter((_, i) => i !== index))}
                        availableOptions={interestOptions}
                        label="Interests"
                        error={fieldState.error}
                      />
                    )}
                  />
                  {enhancedForm.formState.errors.interests && (
                    <p className="text-red-400 text-sm mt-1">
                      {enhancedForm.formState.errors.interests.message}
                    </p>
                  )}
                </div>

                {/* Address Object */}
                <div className="border border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium mb-4">Address</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Address[street] <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...enhancedForm.register('address.street')}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          enhancedForm.formState.errors.address?.street ? 'border-red-400' : 'border-gray-600'
                        }`}
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Address[city] <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...enhancedForm.register('address.city')}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          enhancedForm.formState.errors.address?.city ? 'border-red-400' : 'border-gray-600'
                        }`}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Address[postal Code] <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...enhancedForm.register('address.postalCode')}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          enhancedForm.formState.errors.address?.postalCode ? 'border-red-400' : 'border-gray-600'
                        }`}
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Preference */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contact Preference <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...enhancedForm.register('contactPreference')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select --</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="mail">Mail</option>
                  </select>
                </div>

                {/* Conditional Fields */}
                {contactPreference === 'phone' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      {...enhancedForm.register('phoneNumber')}
                      type="tel"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                )}

                {contactPreference === 'email' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Alternative Email</label>
                    <input
                      {...enhancedForm.register('alternativeEmail')}
                      type="email"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter alternative email"
                    />
                  </div>
                )}

                {contactPreference === 'mail' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Mailing Address</label>
                    <textarea
                      {...enhancedForm.register('mailingAddress')}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-vertical"
                      placeholder="Enter your mailing address"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-md transition-colors text-lg"
                >
                  Submit Form
                </button>
              </form>
            ) : null}
          </div>

          {/* Results Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Submitted Data</h2>
            {submittedData ? (
              <div>
                <div className="mb-4">
                  <span className="inline-block bg-green-600 text-white px-2 py-1 rounded text-sm">
                    {submittedData.type.toUpperCase()} FORM
                  </span>
                </div>
                <pre className="bg-gray-900 p-4 rounded-md text-sm overflow-auto max-h-96">
                  {JSON.stringify(submittedData.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                <p>No form data submitted yet.</p>
                <p className="text-sm mt-2">Fill out and submit a form to see the results here.</p>
              </div>
            )}

            {/* Enhanced Features Summary - shows for All Field Types */}
            {activeTab === 'allfields' && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 text-purple-400">Enhanced Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Star Rating Component</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Document Upload Textareas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Dynamic Array Management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Conditional Field Logic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Range Slider with Units</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Nested Object Validation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Real-time Validation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Dark Theme Styling</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Features Converted from Original</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">✅ Schema-Driven</h3>
              <p className="text-sm text-gray-300">
                Forms are generated from Zod schemas with automatic type inference and validation.
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">✅ React Hook Form</h3>
              <p className="text-sm text-gray-300">
                Integrated with React Hook Form for performance and flexibility.
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">✅ TypeScript</h3>
              <p className="text-sm text-gray-300">
                Full TypeScript support with proper type inference from Zod schemas.
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">✅ Dark Theme</h3>
              <p className="text-sm text-gray-300">
                Maintained the beautiful dark theme from the original with Tailwind CSS.
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">✅ Enhanced Components</h3>
              <p className="text-sm text-gray-300">
                Star ratings, file uploads, and array fields fully integrated in All Field Types.
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">✅ Conditional Logic</h3>
              <p className="text-sm text-gray-300">
                Dynamic show/hide fields based on form state with real-time updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}