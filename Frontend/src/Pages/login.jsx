import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  
  // Try to get pre-selected role from navigation state
  const selectedRole = location.state?.role || 'finder';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signIn(trimmedEmail, password);
      if (error) throw error;
      
      // Navigate based on role or metadata if available
      if (selectedRole === 'landowner') {
        navigate('/landowner-dashboard');
      } else {
        navigate('/book-parking');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={styles.bgGrid}></div>
      <div style={styles.noise}></div>

      <div style={styles.container}>
        {/* Back link */}
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          <span style={{ fontSize: '18px' }}>←</span> Back to Home
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={styles.card}
        >
          <div style={styles.cardGlow}></div>
          
          <div style={styles.formHeader}>
            <div style={styles.logoWrap}>
              <div style={styles.logoCircle}>P</div>
            </div>
            <h1 style={styles.title}>Welcome Back</h1>
            <p style={styles.subtitle}>
              Sign in to your {selectedRole === 'landowner' ? 'Land Owner' : 'Parking Finder'} account
            </p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={styles.errorBanner}
              >
                {error}
              </motion.div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
                <button type="button" style={styles.forgotBtn}>Forgot?</button>
              </div>
              <div style={styles.passwordWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={styles.footerText}>
            Don't have an account?{' '}
            <span style={styles.link} onClick={() => navigate('/choose-role')}>
              Sign up
            </span>
          </p>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          background: #080808;
          color: #e8e4dc;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        input:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 0 4px rgba(249,115,22,0.1) !important;
          outline: none;
        }

        @keyframes pulse {
          0% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
          100% { opacity: 0.5; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

const styles = {
  bgGrid: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    backgroundImage: 'linear-gradient(rgba(249,115,22,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.05) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 100%)',
    WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 100%)',
  },
  noise: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    opacity: 0.02,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
  },
  container: {
    position: 'relative',
    zIndex: 2,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  backBtn: {
    position: 'absolute',
    top: '32px',
    left: '32px',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#888',
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '24px',
    padding: '48px 40px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 24px 64px -12px rgba(0,0,0,0.5)',
  },
  cardGlow: {
    position: 'absolute',
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '300px',
    height: '200px',
    background: 'radial-gradient(circle at 50% 0%, rgba(249,115,22,0.15), transparent 70%)',
    pointerEvents: 'none',
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  logoCircle: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '24px',
    fontWeight: 800,
    boxShadow: '0 8px 16px rgba(249,115,22,0.2)',
  },
  title: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: '36px',
    letterSpacing: '2px',
    marginBottom: '8px',
    color: '#e8e4dc',
  },
  subtitle: {
    color: '#777',
    fontSize: '15px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '10px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#aaa',
    marginLeft: '4px',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#fff',
    fontSize: '15px',
    transition: 'all 0.3s ease',
  },
  passwordWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#f97316',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    marginTop: '10px',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 700,
    boxShadow: '0 8px 32px rgba(249,115,22,0.25)',
    transition: 'all 0.3s ease',
  },
  footerText: {
    textAlign: 'center',
    marginTop: '32px',
    fontSize: '14px',
    color: '#666',
  },
  link: {
    color: '#f97316',
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: '4px',
  },
};

export default Login;