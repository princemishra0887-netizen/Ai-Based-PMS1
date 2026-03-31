import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const SecureIdRegistration = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    aadhaarFile: null,
    photoFile: null,
    phone: '',
    phoneOtp: '',
    email: '',
    password: '',
    confirmPassword: '',
    emailOtp: '',
  });
  const [otpSent, setOtpSent] = useState({ phone: false, email: false });
  const [toast, setToast] = useState({ show: false, message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setToast({ show: true, message: 'File too large (max 5MB)' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleNext = async () => {
    if (step === 3) {
      if (!formData.phone || formData.phone.length < 10) {
        setToast({ show: true, message: '⚠️ Please enter a valid 10-digit phone number.' });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
        return;
      }
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: '+91' + formData.phone.slice(-10),
        });
        if (error) throw error;
        setToast({ show: true, message: '📱 OTP sent to your phone!' });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
      } catch (err) {
        // SMS provider not configured — use demo bypass
        setToast({
          show: true,
          message: '📵 SMS not configured. Use 123456 as OTP to continue (demo mode).',
        });
        setTimeout(() => setToast({ show: false, message: '' }), 5000);
        // Still proceed to OTP entry screen so user can use the bypass
      }
    } else if (step === 4) {
      if (formData.phoneOtp !== '123456') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            phone: '+91' + formData.phone,
            token: formData.phoneOtp,
            type: 'sms',
          });
          if (error) throw error;
        } catch (err) {
          setToast({ show: true, message: `❌ Invalid OTP: ${err.message}. Use 123456 to bypass in demo mode.` });
          setTimeout(() => setToast({ show: false, message: '' }), 4000);
          return; // Block from proceeding if invalid and not bypass
        }
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    // Validate passwords
    if (formData.password.length < 8) {
      setToast({ show: true, message: '❌ Password must be at least 8 characters.' });
      setTimeout(() => setToast({ show: false, message: '' }), 4000);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setToast({ show: true, message: '❌ Passwords do not match. Please try again.' });
      setTimeout(() => setToast({ show: false, message: '' }), 4000);
      return;
    }

    try {
      // 1️⃣ Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: role,
            phone: formData.phone,
          },
        },
      });
      if (error) throw error;

      const userId = data.user?.id;

      // 2️⃣ Upload Aadhaar to Supabase Storage (if provided)
      let aadhaarUrl = null;
      if (formData.aadhaarFile && userId) {
        const ext = formData.aadhaarFile.name.split('.').pop();
        const path = `aadhaar/${userId}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('user-documents')
          .upload(path, formData.aadhaarFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('user-documents').getPublicUrl(path);
          aadhaarUrl = urlData?.publicUrl ?? null;
        }
      }

      // 3️⃣ Upload Photo to Supabase Storage (if provided)
      let photoUrl = null;
      if (formData.photoFile && userId) {
        const ext = formData.photoFile.name.split('.').pop();
        const path = `photos/${userId}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('user-documents')
          .upload(path, formData.photoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('user-documents').getPublicUrl(path);
          photoUrl = urlData?.publicUrl ?? null;
        }
      }

      // 4️⃣ Insert profile data into the profiles table
      if (userId) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          dob: formData.dob || null,
          phone: formData.phone,
          email: formData.email,
          role: role,
          aadhaar_url: aadhaarUrl,
          photo_url: photoUrl,
        });
        if (profileError) {
          console.warn('Profile insert warning:', profileError.message);
        }
      }

      setToast({ show: true, message: `🎉 ${role} registered! Check your email to confirm.` });
      setTimeout(() => {
        setToast({ show: false, message: '' });
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setToast({ show: true, message: `❌ Error: ${err.message}` });
      setTimeout(() => setToast({ show: false, message: '' }), 4000);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      'Personal',
      'Documents',
      'Phone',
      'Verify Phone',
      'Account',
      'Complete',
    ];
    return (
  <div className="flex justify-center items-center mb-8 px-2 max-w-2xl mx-auto">
    {steps.map((label, idx) => (
      <div key={idx} className="flex flex-col items-center mx-2 first:ml-0 last:mr-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
            idx + 1 < step
              ? 'bg-green-500 text-white'
              : idx + 1 === step
              ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {idx + 1 < step ? '✓' : idx + 1}
        </div>
        <span className="text-xs text-gray-400 text-center hidden md:block whitespace-nowrap">
          {label}
        </span>
      </div>
    ))}
  </div>
 );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl flex items-center justify text-2xl">
              🛡️
            </div>
            <span className="font-mono text-xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
              SecureID
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 1 ? 'Create Account' : `Step ${step} of 7`}
          </h1>
          <p className="text-gray-400">
            {role === 'admin' ? '👑 Admin' : '👤 User'} registration
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Role Selection (only on step 1) */}
          {step === 1 && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['admin', 'user'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      role === r
                        ? r === 'admin'
                          ? 'border-pink-500 bg-pink-500/10'
                          : 'border-indigo-500 bg-indigo-500/10'
                        : 'border-gray-700 bg-gray-700/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{r === 'admin' ? '👑' : '👤'}</div>
                    <div className="font-semibold capitalize text-white mb-1">{r}</div>
                    <div className="text-xs text-gray-400">
                      {r === 'admin' ? 'Full access' : 'Standard access'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step Indicator */}
          {step > 1 && step < 6 && renderStepIndicator()}

          {/* Form Steps */}
          <div className="space-y-6">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      First Name 
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="Rahul"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="Sharma"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Document Upload */}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Aadhaar Document (PDF/Image)
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'aadhaarFile')}
                      className="hidden"
                      id="aadhaar-upload"
                    />
                    <label htmlFor="aadhaar-upload" className="cursor-pointer">
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-white font-medium mb-1">Click to upload</p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG (max 5MB)</p>
                      {formData.aadhaarFile && (
                        <p className="text-green-400 text-sm mt-2">
                          ✓ {formData.aadhaarFile.name}
                        </p>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Profile Photo
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handleFileChange(e, 'photoFile')}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="text-3xl mb-2">📸</div>
                        <p className="text-white font-medium mb-1">Upload/Capture</p>
                        <p className="text-xs text-gray-400">Max 5MB</p>
                        {formData.photoFile && (
                          <p className="text-green-400 text-sm mt-2">✓ {formData.photoFile.name}</p>
                        )}
                      </label>
                    </div>
                    <div className="bg-gray-700/50 rounded-xl flex items-center justify-center p-4 border-2 border-gray-600">
                      {formData.photoFile ? (
                        <img
                          src={URL.createObjectURL(formData.photoFile)}
                          alt="Preview"
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-3xl mb-1">🙂</div>
                          <p className="text-xs text-gray-400">Preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Phone Number */}
            {step === 3 && (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">
      Phone Number
    </label>
    <div className="flex">
      <div className="flex items-center justify-center bg-gray-700/50 border border-r-0 border-gray-600 rounded-l-xl px-4 py-3 text-white">
        <span className="text-gray-300">+91</span>
      </div>
      <input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
          if (value.length <= 10) {
            setFormData(prev => ({ ...prev, phone: value }));
          }
        }}
        onKeyPress={(e) => {
          // Allow only numbers
          if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
          }
        }}
        className="w-full bg-gray-700/50 border border-gray-600 rounded-r-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
        placeholder="98765 43210"
        maxLength="10"
        inputMode="numeric"
        pattern="[0-9]*"
      />
    </div>
    <p className="text-xs text-gray-400 mt-1">Enter 10-digit mobile number</p>
  </div>
)}

            {/* Step 4: Phone OTP */}
            {step === 4 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Enter 6-digit OTP sent to {formData.phone}
                </label>
                <div className="flex gap-2 justify-center mb-4">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength="1"
                      className="w-12 h-14 bg-gray-700/50 border border-gray-600 rounded-xl text-center text-xl font-bold text-white focus:border-indigo-500 focus:outline-none"
                      value={formData.phoneOtp[i] || ''}
                      onChange={(e) => {
                        const otp = formData.phoneOtp.split('');
                        otp[i] = e.target.value.replace(/\D/g, '');
                        setFormData((prev) => ({
                          ...prev,
                          phoneOtp: otp.join('').slice(0, 6),
                        }));
                        if (e.target.value && i < 5) {
                          document.getElementById(`otp-${i + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !formData.phoneOtp[i] && i > 0) {
                          document.getElementById(`otp-${i - 1}`)?.focus();
                        }
                      }}
                      id={`otp-${i}`}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-400 mt-2">
                  Didn't receive?{' '}
                  <button className="text-indigo-400 hover:underline">Resend OTP</button>
                </p>
              </div>
            )}

            {/* Step 5: Email & Password */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="rahul@example.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-700/50 border rounded-xl px-4 py-3 text-white focus:outline-none pr-12 ${
                        formData.password && formData.password.length < 8
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-gray-600 focus:border-indigo-500'
                      }`}
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {formData.password && formData.password.length < 8 && (
                    <p className="text-xs text-red-400 mt-1">⚠️ Password must be at least 8 characters</p>
                  )}
                  {formData.password && formData.password.length >= 8 && (
                    <p className="text-xs text-green-400 mt-1">✓ Password strength OK</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-700/50 border rounded-xl px-4 py-3 text-white focus:outline-none pr-12 ${
                        formData.confirmPassword && formData.confirmPassword !== formData.password
                          ? 'border-red-500 focus:border-red-500'
                          : formData.confirmPassword && formData.confirmPassword === formData.password
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-gray-600 focus:border-indigo-500'
                      }`}
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                    <p className="text-xs text-red-400 mt-1">❌ Passwords do not match</p>
                  )}
                  {formData.confirmPassword && formData.confirmPassword === formData.password && formData.password.length >= 8 && (
                    <p className="text-xs text-green-400 mt-1">✓ Passwords match</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Completion */}
            {step === 6 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-2">Registration Complete!</h3>
                <p className="text-gray-400 mb-6">
                  {formData.firstName || 'User'} {formData.lastName} has been registered as{' '}
                  <span className="font-semibold text-indigo-400 capitalize">{role}</span>
                </p>
                <div className="bg-gray-700/50 rounded-xl p-4 text-left space-y-2">
                  {formData.email && (
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-400">Email:</span> {formData.email}
                    </p>
                  )}
                  {formData.phone && (
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-400">Phone:</span> {formData.phone}
                    </p>
                  )}
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-400">Documents:</span>{' '}
                    {formData.aadhaarFile ? '✓ Aadhaar' : '✗ Aadhaar'},{' '}
                    {formData.photoFile ? '✓ Photo' : '✗ Photo'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {step > 1 && step < 6 && (
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white font-medium hover:bg-gray-700 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={step === 5 ? handleSubmit : handleNext}
                className={`flex-1 px-6 py-3 rounded-xl text-white font-medium transition-all ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
                }`}
              >
                {step === 5 ? 'Complete Registration' : 'Continue →'}
              </button>
            </div>
          )}

          {/* Next button for step 1 */}
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl text-white font-medium hover:from-indigo-600 hover:to-pink-600 transition-all"
            >
              Next: Personal Details →
            </button>
          )}
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/auth/login')} className="text-indigo-400 hover:underline">
            Sign In
          </button>
        </p>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-gray-800 border-l-4 border-green-500 rounded-lg shadow-2xl p-4 flex items-center gap-3 animate-slide-in">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-white">Notification</p>
            <p className="text-sm text-gray-300">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureIdRegistration;