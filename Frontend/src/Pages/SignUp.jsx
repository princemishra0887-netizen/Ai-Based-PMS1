import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [role, setRole] = useState('user');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: '',
    dob: '',
    phone: '',
    aadhaarFile: null,
    photoFile: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      showToast('File too large (max 5MB)');
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleNext = () => {
    // Validation
    if (step === 1) {
      if (!formData.email || !formData.password) {
        setError('Email and Password are required');
        return;
      }
    }
    setError('');
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: signUpError } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: role,
        phone: formData.phone,
      });

      if (signUpError) throw signUpError;

      showToast(`🎉 Welcome to ParkEase, ${formData.firstName || 'User'}!`);
      setTimeout(() => {
        navigate(role === 'admin' ? '/landowner-dashboard' : '/book-parking');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    'Account',
    'Personal',
    'Documents',
    'Verification',
    'Finish'
  ];

  return (
    <>
      <div style={styles.bgGrid}></div>
      <div style={styles.noise}></div>

      <div style={styles.container}>
        {/* Back button */}
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          <span style={{ fontSize: '18px' }}>←</span> Back
        </button>

        <div style={styles.mainContent}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logoRow}>
              <div style={styles.logoBox}>P</div>
              <span style={styles.appName}>ParkEase</span>
            </div>
            <h1 style={styles.title}>
              {step === 1 ? 'Create Account' : `Step ${step} of ${steps.length}`}
            </h1>
            <div style={styles.roleBadge}>
              <span style={styles.dot}></span>
              REGISTERING AS {role.toUpperCase()}
            </div>
          </div>

          <div style={styles.card}>
            {/* Step Indicator */}
            <div style={styles.stepper}>
              {steps.map((label, idx) => (
                <React.Fragment key={idx}>
                  <div style={{
                    ...styles.stepCircle,
                    background: idx + 1 <= step ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'rgba(255,255,255,0.05)',
                    color: idx + 1 <= step ? '#fff' : '#444'
                  }}>
                    {idx + 1 < step ? '✓' : idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div style={{
                      ...styles.stepLine,
                      background: idx + 1 < step ? '#f97316' : 'rgba(255,255,255,0.05)'
                    }}></div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div style={styles.formContent}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div style={styles.roleSelection}>
                      <label style={styles.sectionLabel}>Select Your Role</label>
                      <div style={styles.roleGrid}>
                        {['user', 'admin'].map((r) => (
                          <div 
                            key={r}
                            onClick={() => setRole(r)}
                            style={{
                              ...styles.roleCard,
                              borderColor: role === r ? '#f97316' : 'rgba(255,255,255,0.06)',
                              background: role === r ? 'rgba(249,115,22,0.05)' : 'rgba(255,255,255,0.02)'
                            }}
                          >
                            <span style={styles.roleIcon}>{r === 'admin' ? '🏠' : '🚗'}</span>
                            <span style={styles.roleName}>{r === 'admin' ? 'Land Owner' : 'Parking Finder'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={styles.grid}>
                      <div style={styles.inputWrap}>
                        <label style={styles.inputLabel}>Email Address</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleInputChange} 
                          placeholder="rahul@example.com"
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.inputWrap}>
                        <label style={styles.inputLabel}>Password</label>
                        <input 
                          type="password" 
                          name="password" 
                          value={formData.password} 
                          onChange={handleInputChange} 
                          placeholder="••••••••"
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={styles.grid}>
                      <div style={styles.inputWrap}>
                        <label style={styles.inputLabel}>First Name</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Rahul" style={styles.input} />
                      </div>
                      <div style={styles.inputWrap}>
                        <label style={styles.inputLabel}>Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Sharma" style={styles.input} />
                      </div>
                      <div style={styles.inputWrap}>
                        <label style={styles.inputLabel}>Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange} style={styles.input}>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div style={styles.inputWrap}>
                        <label style={styles.inputLabel}>Date of Birth</label>
                        <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} style={styles.input} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={styles.uploadArea}>
                       <label style={styles.inputLabel}>Aadhaar Document</label>
                       <div style={styles.dropZone}>
                          <input type="file" id="aadhaar" hidden onChange={(e) => handleFileChange(e, 'aadhaarFile')} />
                          <label htmlFor="aadhaar" style={styles.dropLabel}>
                             {formData.aadhaarFile ? '✓ ' + formData.aadhaarFile.name : 'Click to Upload Document'}
                          </label>
                       </div>
                    </div>
                    <div style={{...styles.uploadArea, marginTop: '20px'}}>
                       <label style={styles.inputLabel}>Profile Photo</label>
                       <div style={styles.dropZone}>
                          <input type="file" id="photo" hidden onChange={(e) => handleFileChange(e, 'photoFile')} />
                          <label htmlFor="photo" style={styles.dropLabel}>
                             {formData.photoFile ? '✓ Photo Ready' : 'Click to Upload Photo'}
                          </label>
                       </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                     <div style={styles.inputWrap}>
                        <label style={styles.inputLabel}>Phone Number</label>
                        <div style={styles.phoneGroup}>
                           <div style={styles.phonePrefix}>+91</div>
                           <input 
                            type="tel" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleInputChange} 
                            placeholder="98765 43210" 
                            style={styles.input} 
                           />
                        </div>
                     </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.finishArea}>
                    <div style={styles.successIcon}>✓</div>
                    <h2 style={styles.finishTitle}>Ready to Go!</h2>
                    <p style={styles.finishText}>Your account information is ready. Click below to complete your registration.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <div style={styles.errorText}>{error}</div>}

              <div style={styles.navButtons}>
                {step > 1 && (
                  <button onClick={handleBack} style={styles.backButton}>Back</button>
                )}
                {step < steps.length ? (
                  <button onClick={handleNext} style={styles.nextButton}>Continue →</button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading} style={styles.nextButton}>
                    {loading ? 'Creating Account...' : 'Complete Signup'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <p style={styles.footerNote}>
            Already have an account?{' '}
            <span style={styles.loginLink} onClick={() => navigate('/login')}>Sign In</span>
          </p>
        </div>
      </div>

      {toast.show && (
        <div style={styles.toast}>
          {toast.message}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        body { background: #080808; color: #e8e4dc; font-family: 'DM Sans', sans-serif; margin: 0; }
        input:focus, select:focus {
          border-color: #f97316 !important;
          outline: none;
          background: rgba(255,255,255,0.05) !important;
        }
      `}</style>
    </>
  );
};

const styles = {
  bgGrid: { position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' },
  noise: { position: 'fixed', inset: 0, zIndex: 1, opacity: 0.015, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.7'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" },
  container: { position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' },
  backBtn: { position: 'absolute', top: '32px', left: '32px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#777', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  mainContent: { width: '100%', maxWidth: '640px' },
  header: { textAlign: 'center', marginBottom: '32px' },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' },
  logoBox: { width: '32px', height: '32px', background: '#f97316', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' },
  appName: { fontFamily: "'Bebas Neue', cursive", fontSize: '24px', letterSpacing: '1px', color: '#f97316' },
  title: { fontSize: '32px', fontWeight: 700, marginBottom: '12px' },
  roleBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '20px', fontSize: '11px', fontWeight: 600, color: '#f97316', letterSpacing: '1px' },
  dot: { width: '6px', height: '6px', background: '#f97316', borderRadius: '50%' },
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', gap: '8px' },
  stepCircle: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.3s' },
  stepLine: { height: '2px', width: '30px', transition: 'all 0.3s' },
  formContent: { minHeight: '300px', display: 'flex', flexDirection: 'column' },
  roleSelection: { marginBottom: '24px' },
  sectionLabel: { fontSize: '14px', color: '#777', display: 'block', marginBottom: '12px' },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  roleCard: { padding: '20px', borderRadius: '16px', border: '1px solid', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' },
  roleIcon: { fontSize: '24px', display: 'block', marginBottom: '8px' },
  roleName: { fontSize: '14px', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  inputWrap: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
  inputLabel: { fontSize: '13px', color: '#aaa', marginLeft: '4px' },
  input: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '14px' },
  phoneGroup: { display: 'flex', gap: '10px' },
  phonePrefix: { background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '12px', fontSize: '14px', color: '#777' },
  dropZone: { border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '30px', textAlign: 'center', cursor: 'pointer' },
  dropLabel: { cursor: 'pointer', color: '#aaa', fontSize: '14px' },
  finishArea: { textAlign: 'center', padding: '20px' },
  successIcon: { width: '64px', height: '64px', background: '#f97316', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' },
  finishTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' },
  finishText: { color: '#777', fontSize: '15px' },
  navButtons: { marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '32px' },
  backButton: { flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', cursor: 'pointer' },
  nextButton: { flex: 2, padding: '16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  errorText: { color: '#ef4444', fontSize: '13px', marginTop: '12px', textAlign: 'center' },
  footerNote: { textAlign: 'center', marginTop: '24px', color: '#555', fontSize: '14px' },
  loginLink: { color: '#f97316', fontWeight: 600, cursor: 'pointer', marginLeft: '6px' },
  toast: { position: 'fixed', bottom: '24px', right: '24px', background: '#f97316', color: '#fff', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(249,115,22,0.3)', fontWeight: 600 }
};

export default SignUp;