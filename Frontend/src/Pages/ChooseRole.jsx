import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChooseRole = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleRoleSelect = (role) => {
    if (role === 'finder') {
      navigate('/book-parking');
    } else {
      navigate('/landowner-dashboard');
    }
  };

  return (
    <>
      <div style={styles.bgGrid}></div>
      <div style={styles.noise}></div>

      <div style={styles.container}>
        {/* Back button */}
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          <span style={{ fontSize: '18px' }}>←</span> Back to Home
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.eyebrow}>
            <span style={styles.dot}></span>
            Welcome to ParkEase
          </div>
          <h1 style={styles.title}>
            How will you <em style={styles.titleEm}>use</em> ParkEase?
          </h1>
          <p style={styles.subtitle}>
            Choose your role to get started. You can always switch later from your profile settings.
          </p>
        </div>

        {/* Cards */}
        <div style={styles.cardsContainer}>
          {/* Parking Finder Card */}
          <div
            style={{
              ...styles.card,
              ...(hoveredCard === 'finder' ? styles.cardHover : {}),
              borderColor: hoveredCard === 'finder' ? '#f97316' : 'rgba(255,255,255,0.06)',
            }}
            onMouseEnter={() => setHoveredCard('finder')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleRoleSelect('finder')}
          >
            <div style={{
              ...styles.cardGlow,
              opacity: hoveredCard === 'finder' ? 1 : 0,
              background: 'radial-gradient(circle at 50% 0%, rgba(249,115,22,0.15), transparent 70%)',
            }}></div>

            <div style={styles.iconWrap}>
              <div style={{
                ...styles.iconCircle,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                boxShadow: hoveredCard === 'finder'
                  ? '0 0 40px rgba(249,115,22,0.5)'
                  : '0 0 20px rgba(249,115,22,0.3)',
              }}>
                🚗
              </div>
            </div>

            <h2 style={styles.cardTitle}>I'm Looking for Parking</h2>
            <p style={styles.cardDesc}>
              Find available parking spots near your destination, compare prices, 
              and book instantly — hourly, daily, or long-term.
            </p>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <span style={styles.checkIcon}>✓</span>
                Search spots by location
              </div>
              <div style={styles.featureItem}>
                <span style={styles.checkIcon}>✓</span>
                Real-time availability
              </div>
              <div style={styles.featureItem}>
                <span style={styles.checkIcon}>✓</span>
                Instant booking & navigation
              </div>
              <div style={styles.featureItem}>
                <span style={styles.checkIcon}>✓</span>
                Save favourite spots
              </div>
            </div>

            <div style={{
              ...styles.cardBtn,
              background: hoveredCard === 'finder'
                ? 'linear-gradient(135deg, #f97316, #ea580c)'
                : 'rgba(249,115,22,0.1)',
              color: hoveredCard === 'finder' ? '#fff' : '#f97316',
              boxShadow: hoveredCard === 'finder'
                ? '0 8px 32px rgba(249,115,22,0.4)'
                : 'none',
            }}>
              Find Parking <span style={{ marginLeft: '8px' }}>→</span>
            </div>
          </div>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>OR</span>
            <div style={styles.dividerLine}></div>
          </div>

          {/* Land Owner Card */}
          <div
            style={{
              ...styles.card,
              ...(hoveredCard === 'owner' ? styles.cardHover : {}),
              borderColor: hoveredCard === 'owner' ? '#4ade80' : 'rgba(255,255,255,0.06)',
            }}
            onMouseEnter={() => setHoveredCard('owner')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleRoleSelect('landowner')}
          >
            <div style={{
              ...styles.cardGlow,
              opacity: hoveredCard === 'owner' ? 1 : 0,
              background: 'radial-gradient(circle at 50% 0%, rgba(74,222,128,0.15), transparent 70%)',
            }}></div>

            <div style={styles.iconWrap}>
              <div style={{
                ...styles.iconCircle,
                background: 'linear-gradient(135deg, #4ade80, #16a34a)',
                boxShadow: hoveredCard === 'owner'
                  ? '0 0 40px rgba(74,222,128,0.5)'
                  : '0 0 20px rgba(74,222,128,0.3)',
              }}>
                🏠
              </div>
            </div>

            <h2 style={styles.cardTitle}>I Own Land / Parking Space</h2>
            <p style={styles.cardDesc}>
              List your unused driveway, garage, or open land as a parking spot. 
              Start earning passive income within minutes.
            </p>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <span style={{ ...styles.checkIcon, color: '#4ade80' }}>✓</span>
                List spots in minutes
              </div>
              <div style={styles.featureItem}>
                <span style={{ ...styles.checkIcon, color: '#4ade80' }}>✓</span>
                Set your own pricing
              </div>
              <div style={styles.featureItem}>
                <span style={{ ...styles.checkIcon, color: '#4ade80' }}>✓</span>
                Earnings dashboard
              </div>
              <div style={styles.featureItem}>
                <span style={{ ...styles.checkIcon, color: '#4ade80' }}>✓</span>
                Verified bookings only
              </div>
            </div>

            <div style={{
              ...styles.cardBtn,
              background: hoveredCard === 'owner'
                ? 'linear-gradient(135deg, #4ade80, #16a34a)'
                : 'rgba(74,222,128,0.1)',
              color: hoveredCard === 'owner' ? '#fff' : '#4ade80',
              boxShadow: hoveredCard === 'owner'
                ? '0 8px 32px rgba(74,222,128,0.4)'
                : 'none',
            }}>
              List My Land <span style={{ marginLeft: '8px' }}>→</span>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p style={styles.bottomNote}>
          Already have an account?{' '}
          <span
            style={styles.loginLink}
            onClick={() => navigate('/login')}
          >
            Log in here
          </span>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          background: #080808;
          color: #e8e4dc;
          font-family: 'DM Sans', sans-serif;
        }

        .role-card-animate {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
    backgroundImage:
      'linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
  },
  noise: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    opacity: 0.03,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
  },
  container: {
    position: 'relative',
    zIndex: 2,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
  },
  backBtn: {
    position: 'absolute',
    top: '32px',
    left: '48px',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#888',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  header: {
    textAlign: 'center',
    marginBottom: '56px',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(249,115,22,0.08)',
    border: '1px solid rgba(249,115,22,0.15)',
    borderRadius: '50px',
    padding: '8px 20px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: '#f97316',
    marginBottom: '24px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#f97316',
    animation: 'pulse 2s ease infinite',
  },
  title: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: 'clamp(40px, 6vw, 64px)',
    letterSpacing: '3px',
    lineHeight: 1.1,
    color: '#e8e4dc',
    marginBottom: '16px',
  },
  titleEm: {
    fontStyle: 'italic',
    color: '#f97316',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '16px',
    color: '#777',
    maxWidth: '440px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  cardsContainer: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '32px',
    maxWidth: '900px',
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    position: 'relative',
    flex: '1 1 360px',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '40px 32px 32px',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  cardHover: {
    background: 'rgba(255,255,255,0.04)',
    transform: 'translateY(-4px)',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '200px',
    transition: 'opacity 0.4s ease',
    pointerEvents: 'none',
  },
  iconWrap: {
    marginBottom: '24px',
    position: 'relative',
    zIndex: 1,
  },
  iconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    transition: 'box-shadow 0.4s ease',
  },
  cardTitle: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: '28px',
    letterSpacing: '1.5px',
    color: '#e8e4dc',
    marginBottom: '12px',
    position: 'relative',
    zIndex: 1,
  },
  cardDesc: {
    fontSize: '14px',
    color: '#777',
    lineHeight: 1.7,
    marginBottom: '24px',
    position: 'relative',
    zIndex: 1,
  },
  featureList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '28px',
    position: 'relative',
    zIndex: 1,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#aaa',
    textAlign: 'left',
  },
  checkIcon: {
    color: '#f97316',
    fontWeight: 700,
    fontSize: '14px',
    flexShrink: 0,
  },
  cardBtn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'center',
    transition: 'all 0.4s ease',
    position: 'relative',
    zIndex: 1,
    marginTop: 'auto',
    letterSpacing: '0.5px',
  },
  divider: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    alignSelf: 'center',
  },
  dividerLine: {
    width: '1px',
    height: '40px',
    background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)',
  },
  dividerText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#555',
    letterSpacing: '2px',
  },
  bottomNote: {
    marginTop: '40px',
    fontSize: '14px',
    color: '#666',
  },
  loginLink: {
    color: '#f97316',
    cursor: 'pointer',
    fontWeight: 600,
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
};

export default ChooseRole;
