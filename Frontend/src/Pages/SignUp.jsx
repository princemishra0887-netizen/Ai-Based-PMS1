import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';
import { getDashboardRouteForRole, isMissingProfilesTableError } from '../lib/profileHelpers';

// State → Cities mapping for India
const stateCities = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Along', 'Tezu', 'Roing', 'Changlang'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Karimganj', 'Goalpara'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Munger'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Dhamtari'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Canacona', 'Quepem'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat', 'Yamunanagar', 'Panchkula'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Bilaspur', 'Hamirpur', 'Una', 'Nahan'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Phusro', 'Medininagar'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Shimoga', 'Tumkur'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Senapati', 'Ukhrul', 'Tamenglong', 'Chandel', 'Jiribam'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar', 'Baghmara', 'Resubelpara', 'Mairang', 'Nongstoin', 'Khliehriat'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Lawngtlai', 'Saiha', 'Mamit', 'Hnahthial', 'Saitual'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon', 'Phek', 'Longleng', 'Peren'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada', 'Bhadrak', 'Jharsuguda'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Moga', 'Phagwara'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur', 'Sikar', 'Bhilwara'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Singtam', 'Jorethang', 'Ravangla', 'Pelling', 'Lachung'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thanjavur', 'Thoothukudi'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Ramagundam', 'Nalgonda', 'Adilabad', 'Suryapet'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa', 'Khowai', 'Sabroom', 'Sonamura', 'Kumarghat'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Noida', 'Ghaziabad', 'Bareilly', 'Aligarh'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Roorkee', 'Kashipur', 'Rudrapur', 'Nainital', 'Mussoorie', 'Pithoragarh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur', 'Haldia', 'Kalyani'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Janakpuri', 'Lajpat Nagar', 'Connaught Place', 'Karol Bagh', 'Pitampura', 'Vasant Kunj'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua', 'Udhampur', 'Rajouri', 'Poonch', 'Kupwara'],
  'Ladakh': ['Leh', 'Kargil', 'Diskit', 'Padum', 'Nyoma'],
};

const formatSupabaseError = (error) => {
  const rawMessage = error?.message || 'Something went wrong during signup.';

  if (rawMessage === 'Failed to fetch') {
    return 'Unable to reach Supabase. Check your internet, Frontend/.env values, and make sure no extension or firewall is blocking the request.';
  }

  if (rawMessage.toLowerCase().includes('email not confirmed')) {
    return 'Your account was created, but email confirmation is required before dashboard access.';
  }

  return rawMessage;
};

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
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [toast, setToast] = useState({ show: false, message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData((prev) => ({ ...prev, state: selectedState, city: '' }));
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

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!hasSupabaseConfig || !supabase) {
      setToast({ show: true, message: '❌ Supabase environment variables are missing in Frontend/.env.' });
      setTimeout(() => setToast({ show: false, message: '' }), 4000);
      return;
    }

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
      const profilePayload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        gender: formData.gender || null,
        dob: formData.dob || null,
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        role,
      };

      if (!profilePayload.first_name || !profilePayload.email || !profilePayload.phone) {
        throw new Error('First name, email, and phone number are required.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: profilePayload.email,
        password: formData.password,
        options: {
          data: {
            first_name: profilePayload.first_name,
            last_name: profilePayload.last_name,
            role: profilePayload.role,
            phone: profilePayload.phone,
            city: profilePayload.city,
            state: profilePayload.state,
            pincode: profilePayload.pincode,
            address: profilePayload.address,
            dob: profilePayload.dob,
            gender: profilePayload.gender,
          },
        },
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) {
        throw new Error('Supabase did not return a user id during signup.');
      }

      let session = data.session ?? null;
      let aadhaarUrl = null;
      let photoUrl = null;

      if (formData.aadhaarFile) {
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

      if (formData.photoFile) {
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

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        ...profilePayload,
        aadhaar_url: aadhaarUrl,
        photo_url: photoUrl,
      }, {
        onConflict: 'id',
      });

      const profileTableMissing = isMissingProfilesTableError(profileError);
      if (profileError && !profileTableMissing) throw profileError;

      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: profilePayload.email,
          password: formData.password,
        });

        if (!signInError) {
          session = signInData.session ?? null;
        }
      }

      localStorage.setItem('userRole', role);
      localStorage.setItem('user', JSON.stringify({
        id: userId,
        email: profilePayload.email,
        first_name: profilePayload.first_name,
        last_name: profilePayload.last_name,
        phone: profilePayload.phone,
        city: profilePayload.city,
        state: profilePayload.state,
        pincode: profilePayload.pincode,
        address: profilePayload.address,
        role,
        photo_url: photoUrl,
        aadhaar_url: aadhaarUrl,
      }));

      if (session) {
        setToast({
          show: true,
          message: profileTableMissing
            ? '🎉 Account created in Supabase Auth. Run Database/supabase-schema.sql to enable full profile storage, then you can continue.'
            : `🎉 ${role === 'landOwner' ? 'Land Owner' : 'User'} registered successfully.`,
        });
        setTimeout(() => {
          setToast({ show: false, message: '' });
          navigate(getDashboardRouteForRole(role));
        }, 1800);
        return;
      }

      setToast({
        show: true,
        message: profileTableMissing
          ? '🎉 Account created in Supabase Auth. Run Database/supabase-schema.sql, then sign in to open the dashboard.'
          : '🎉 Account created and saved in Supabase. Confirm your email, then sign in to open the dashboard.',
      });
      setTimeout(() => {
        setToast({ show: false, message: '' });
        navigate('/auth/login');
      }, 3000);
    } catch (err) {
      setToast({ show: true, message: `❌ Error: ${formatSupabaseError(err)}` });
      setTimeout(() => setToast({ show: false, message: '' }), 5000);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      'Personal',
      'Documents',
      'Address',
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
              ? 'bg-orange-500 text-white ring-2 ring-orange-300'
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
    <div className="min-h-screen bg-gradient-to-br from-black to-[#050505] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify text-2xl">
              🛡️
            </div>
            <span className="font-mono text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-500 bg-clip-text text-transparent">
              SecureID
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 1 ? 'Create Account' : `Step ${step} of 6`}
          </h1>
          <p className="text-gray-400">
            {role === 'landOwner' ? '🏠 Land Owner' : '👤 User'} registration
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#0a0a0a]/90 backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Role Selection (only on step 1) */}
          {step === 1 && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['user', 'landOwner'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      role === r
                        ? r === 'landOwner'
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 bg-[#111318]'
                    }`}
                  >
                    <div className="text-2xl mb-2">{r === 'landOwner' ? '🏠' : '👤'}</div>
                    <div className="font-semibold text-white mb-1">{r === 'landOwner' ? 'Land Owner' : 'User'}</div>
                    <div className="text-xs text-gray-400">
                      {r === 'landOwner' ? 'List & manage parking spots' : 'Find & book parking'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step Indicator */}
          {step > 1 && step < 5 && renderStepIndicator()}

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
                      className="w-full bg-[#111318] border border-orange-500/15 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
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
                      className="w-full bg-[#111318] border border-orange-500/15 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
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
                      className="w-full bg-[#111318] border border-orange-500/15 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
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
                      className="w-full bg-[#111318] border border-orange-500/15 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
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
                  <div className="border-2 border-dashed border-orange-500/15 rounded-xl p-6 text-center hover:border-orange-500 transition-colors">
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
                    <div className="border-2 border-dashed border-orange-500/15 rounded-xl p-6 text-center hover:border-orange-500 transition-colors">
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
                    <div className="bg-[#111318] rounded-xl flex items-center justify-center p-4 border-2 border-orange-500/15">
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


            {/* Step 3: Address */}
            {step === 3 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    State
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    className="w-full bg-[#111318] border border-orange-500/15 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Select State</option>
                    {Object.keys(stateCities).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      City
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!formData.state}
                      className={`w-full bg-[#111318] border border-orange-500/15 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none ${
                        !formData.state ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="">{formData.state ? 'Select City' : 'Select state first'}</option>
                      {formData.state && stateCities[formData.state]?.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 6) {
                          setFormData(prev => ({ ...prev, pincode: value }));
                        }
                      }}
                      className="w-full bg-[#111318] border border-orange-500/15 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                      placeholder="400001"
                      maxLength="6"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-[#111318] border border-orange-500/15 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    placeholder="123, MG Road, Near Central Mall"
                  />
                </div>
              </>
            )}

            {/* Step 4: Account (Email, Phone & Password) */}
            {step === 4 && (
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
                    className="w-full bg-[#111318] border border-orange-500/15 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    placeholder="rahul@example.com"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <div className="flex items-center justify-center bg-[#111318] border border-r-0 border-orange-500/15 rounded-l-xl px-4 py-3 text-white">
                      <span className="text-gray-300">+91</span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setFormData(prev => ({ ...prev, phone: value }));
                        }
                      }}
                      className="w-full bg-[#111318] border border-orange-500/15 rounded-r-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                      placeholder="98765 43210"
                      maxLength="10"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>
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
                      className={`w-full bg-[#111318] border rounded-xl px-4 py-3 text-white focus:outline-none pr-12 ${
                        formData.password && formData.password.length < 8
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-orange-500/15 focus:border-orange-500'
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
                      className={`w-full bg-[#111318] border rounded-xl px-4 py-3 text-white focus:outline-none pr-12 ${
                        formData.confirmPassword && formData.confirmPassword !== formData.password
                          ? 'border-red-500 focus:border-red-500'
                          : formData.confirmPassword && formData.confirmPassword === formData.password
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-orange-500/15 focus:border-orange-500'
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

            {/* Step 5: Completion */}
            {step === 5 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-2">Registration Complete!</h3>
                <p className="text-gray-400 mb-6">
                  {formData.firstName || 'User'} {formData.lastName} has been registered as{' '}
                  <span className="font-semibold text-orange-500 capitalize">{role}</span>
                </p>
                <div className="bg-[#111318] rounded-xl p-4 text-left space-y-2">
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
                  {(formData.address || formData.city) && (
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-400">Address:</span>{' '}
                      {[formData.address, formData.city, formData.state, formData.pincode].filter(Boolean).join(', ')}
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
          {step > 1 && step < 5 && (
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 bg-[#111318] border border-orange-500/15 rounded-xl text-white font-medium hover:bg-gray-700 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={step === 4 ? handleSubmit : handleNext}
                className={`flex-1 px-6 py-3 rounded-xl text-white font-medium transition-all ${
                  role === 'landOwner'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-indigo-700'
                }`}
              >
                {step === 4 ? 'Complete Registration' : 'Continue →'}
              </button>
            </div>
          )}

          {/* Next button for step 1 */}
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Next: Personal Details →
            </button>
          )}
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/auth/login')} className="text-orange-500 hover:underline">
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
