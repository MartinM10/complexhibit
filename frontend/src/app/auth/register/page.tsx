"use client";

/**
 * Registration page with email/password.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, Loader2, Building } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    userType: "individual",
    institutionType: "",
  });
  const [institutionTypes, setInstitutionTypes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const FALLBACK_INSTITUTION_TYPES = [
    "Museum",
    "University",
    "Art School",
    "Art Center",
    "Cultural Center",
    "Foundation",
    "Library",
    "Archive",
    "Gallery",
    "Other"
  ];

  useEffect(() => {
    const fetchInstitutionTypes = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${apiUrl}/filter_options/institution_type`);
        if (response.ok) {
          const data = await response.json();
          const types = data.data || [];
          setInstitutionTypes(types.length > 0 ? types : FALLBACK_INSTITUTION_TYPES);
        } else {
          setInstitutionTypes(FALLBACK_INSTITUTION_TYPES);
        }
      } catch (error) {
        console.error("Failed to fetch institution types", error);
        setInstitutionTypes(FALLBACK_INSTITUTION_TYPES);
      }
    };

    fetchInstitutionTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          full_name: formData.fullName || null,
          institution_type: formData.userType === 'institution' ? formData.institutionType : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Registration Successful!</h2>
          <p className="text-gray-600">
            Your account has been created and is pending approval. You will receive an email once an administrator reviews your registration.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  pattern="[a-zA-Z0-9_]+"
                  minLength={3}
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="username"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Letters, numbers, and underscores only</p>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`
                  relative flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none transition-all
                  ${formData.userType === 'individual' ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50' : 'border-gray-300'}
                `}>
                  <input
                    type="radio"
                    name="userType"
                    value="individual"
                    checked={formData.userType === 'individual'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <User className={`h-5 w-5 ${formData.userType === 'individual' ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${formData.userType === 'individual' ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Individual
                    </span>
                  </div>
                </label>
                
                <label className={`
                  relative flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none transition-all
                  ${formData.userType === 'institution' ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50' : 'border-gray-300'}
                `}>
                  <input
                    type="radio"
                    name="userType"
                    value="institution"
                    checked={formData.userType === 'institution'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <Building className={`h-5 w-5 ${formData.userType === 'institution' ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${formData.userType === 'institution' ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Institution
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {formData.userType === 'institution' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label htmlFor="institutionType" className="block text-sm font-medium text-gray-700 mb-1">
                  Institution Type *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="institutionType"
                    name="institutionType"
                    required={formData.userType === 'institution'}
                    value={formData.institutionType}
                    onChange={handleChange}
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select institution type</option>
                    {institutionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Create account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
