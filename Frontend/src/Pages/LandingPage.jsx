import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import './ParkEase.css'; // Optional: if you want to keep styles separate

const ParkEase = () => {
  const navigate = useNavigate();
  // Refs for cursor elements
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  const navRef = useRef(null);
  const progressRef = useRef(null);
  const spotsScrollRef = useRef(null);
  const gridBgRef = useRef(null);

  useEffect(() => {
    // Custom cursor logic
    let mx = 0, my = 0, rx = 0, ry = 0;

    const handleCursorMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.left = mx + 'px';
        cursorRef.current.style.top = my + 'px';
      }
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px';
        ringRef.current.style.top = ry + 'px';
      }
      requestAnimationFrame(animateRing);
    };

    document.addEventListener('mousemove', handleCursorMove);
    animateRing();

    // Hover effect for interactive elements
    const interactiveElements = document.querySelectorAll(
      'a, button, .spot-card, .how-card, .review-card, .pricing-card, .feature-item'
    );

    const addHover = () => document.body.classList.add('hovering');
    const removeHover = () => document.body.classList.remove('hovering');

    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    // Scroll progress
    const handleScroll = () => {
      // Progress bar
      if (progressRef.current) {
        const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        progressRef.current.style.width = pct + '%';
      }

      // Navbar scroll effect
      if (navRef.current) {
        if (window.scrollY > 60) {
          navRef.current.classList.add('scrolled');
        } else {
          navRef.current.classList.remove('scrolled');
        }
      }

      // Grid background parallax
      if (gridBgRef.current) {
        gridBgRef.current.style.backgroundPosition = `0 ${window.scrollY * 0.03}px, ${window.scrollY * 0.03}px 0`;
      }

      // Parallax car
      const car = document.querySelector('.hero-car');
      if (car) {
        car.style.transform = `translateY(${window.scrollY * 0.15}px) rotate(-3deg)`;
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Intersection Observer for reveal animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.reveal, .review-card, .pricing-card').forEach((el) => {
      observer.observe(el);
    });

    // Stagger how cards
    const howGridObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.how-card').forEach((c) => {
              c.style.opacity = '1';
              c.style.transform = 'translateY(0)';
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    const howGrid = document.querySelector('.how-grid');
    if (howGrid) {
      document.querySelectorAll('.how-card').forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        el.style.transitionDelay = i * 120 + 'ms';
      });
      howGridObserver.observe(howGrid);
    }

    // Stagger feature items
    const featuresObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.feature-item').forEach((fi) => {
              fi.style.opacity = '1';
              fi.style.transform = 'translateX(0)';
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.feature-item').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-16px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, background 0.3s ease, border-color 0.3s ease';
      el.style.transitionDelay = i * 100 + 'ms';
    });

    const features = document.getElementById('features');
    if (features) featuresObserver.observe(features);

    // Stagger spot cards
    const spotsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            document.querySelectorAll('.spot-card').forEach((c) => {
              c.style.opacity = '1';
              c.style.transform = 'translateY(0)';
            });
          }
        });
      },
      { threshold: 0.05 }
    );

    document.querySelectorAll('.spot-card').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease';
      el.style.transitionDelay = i * 80 + 'ms';
    });

    const spots = document.getElementById('spots');
    if (spots) spotsObserver.observe(spots);

    // Count-up for hero stats
    const countUp = (el, target, duration = 1800) => {
      const start = performance.now();
      const update = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(ease * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };

    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            document.querySelectorAll('[data-target]').forEach((el) => {
              countUp(el, parseInt(el.dataset.target));
            });
            statsObserver.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) statsObserver.observe(heroStats);

    // Floating particles
    const createParticle = () => {
      const p = document.createElement('div');
      p.classList.add('particle');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.top = Math.random() * 100 + 'vh';
      p.style.opacity = Math.random() * 0.4 + 0.1;
      document.body.appendChild(p);

      let x = parseFloat(p.style.left);
      let y = parseFloat(p.style.top);
      let vx = (Math.random() - 0.5) * 0.08;
      let vy = -Math.random() * 0.12 - 0.04;

      const move = () => {
        x += vx;
        y += vy;
        if (y < -2) {
          y = 102;
          x = Math.random() * 100;
        }
        p.style.left = x + 'vw';
        p.style.top = y + 'vh';
        requestAnimationFrame(move);
      };
      move();
    };

    for (let i = 0; i < 24; i++) {
      setTimeout(createParticle, i * 200);
    }

    // Horizontal scroll spots on wheel
    const spotsScroll = spotsScrollRef.current;
    if (spotsScroll) {
      const handleWheel = (e) => {
        if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          e.preventDefault();
          spotsScroll.scrollLeft += e.deltaY * 0.6;
        }
      };
      spotsScroll.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        spotsScroll.removeEventListener('wheel', handleWheel);
      };
    }

    // Magnetic buttons - renamed to avoid conflict
    const magneticButtons = document.querySelectorAll('.btn-primary-hero, .btn-ghost, .nav-cta');

    const handleMagneticMove = (e) => {
      const btn = e.currentTarget;
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - r.left - r.width / 2;
      const dy = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`;
    };

    const handleMagneticLeave = (e) => {
      e.currentTarget.style.transform = '';
    };

    magneticButtons.forEach((btn) => {
      btn.addEventListener('mousemove', handleMagneticMove);
      btn.addEventListener('mouseleave', handleMagneticLeave);
    });

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleCursorMove);
      window.removeEventListener('scroll', handleScroll);

      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
      });

      magneticButtons.forEach((btn) => {
        btn.removeEventListener('mousemove', handleMagneticMove);
        btn.removeEventListener('mouseleave', handleMagneticLeave);
      });

      observer.disconnect();
      howGridObserver.disconnect();
      featuresObserver.disconnect();
      spotsObserver.disconnect();
      statsObserver.disconnect();
    };
  }, []);

  return (
    <>
      {/* Custom Cursor */}
      <div id="cursor" ref={cursorRef}></div>
      <div id="cursor-ring" ref={ringRef}></div>

      {/* Background */}
      <div id="grid-bg" ref={gridBgRef}></div>
      <div id="noise"></div>

      {/* Scroll progress */}
      <div id="progress" ref={progressRef} style={{ width: '0%' }}></div>

      {/* Navbar */}
      <nav id="navbar" ref={navRef}>
        <a className="logo" href="#">
          <div className="logo-icon">🅿</div>
          <span className="logo-text">ParkEase</span>
        </a>
        <div className="nav-links">
          <a href="#how">How It Works</a>
          <a href="#features">Features</a>
          <a href="#spots">Spots</a>
          <a href="#reviews">Reviews</a>
          <a href="#pricing">Pricing</a>
          <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }} className="nav-login">Log In</a>
          <a onClick={() => navigate('/choose-role')} style={{ cursor: 'pointer' }} className="nav-cta">Get Started</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero">
        <div className="hero-eyebrow">
          <span className="dot"></span>
          Now available in Delhi NCR
        </div>
        <h1 className="hero-h1">
          Park <em>Smarter,</em>
          <span className="line2">Live Better</span>
        </h1>
        <p className="hero-sub">
          Connect with real land owners near you. Book a parking spot in under 30 seconds — hourly, daily, or long-term.
        </p>
        <div className="hero-actions">
          <a onClick={() => navigate('/book-parking')} style={{ cursor: 'pointer' }} className="btn-primary-hero">
            Find Parking Near Me
            <span>→</span>
          </a>
          <a href="#how" className="btn-ghost">
            <span>▶</span>
            See How It Works
          </a>
        </div>
        <div className="hero-stats">
          <div>
            <div className="hero-stat-val" data-target="500">0</div>
            <div className="hero-stat-label">+ Active Spots</div>
          </div>
          <div>
            <div className="hero-stat-val" data-target="12000">0</div>
            <div className="hero-stat-label">+ Happy Drivers</div>
          </div>
          <div>
            <div className="hero-stat-val" data-target="98">0</div>
            <div className="hero-stat-label">% Satisfaction</div>
          </div>
          <div>
            <div className="hero-stat-val" data-target="30">0</div>
            <div className="hero-stat-label">Sec to Book</div>
          </div>
        </div>
        <div className="hero-car">🚗</div>
      </section>

      {/* Marquee */}
      <div className="marquee-wrap">
        <div className="marquee-track" id="marquee">
          <div className="marquee-item">Find a Spot <span>◆</span></div>
          <div className="marquee-item">Book in Seconds <span>◆</span></div>
          <div className="marquee-item">Earn from Your Land <span>◆</span></div>
          <div className="marquee-item">No Hidden Fees <span>◆</span></div>
          <div className="marquee-item">Real Owners <span>◆</span></div>
          <div className="marquee-item">Open Air & Covered <span>◆</span></div>
          <div className="marquee-item">Hourly & Daily <span>◆</span></div>
          <div className="marquee-item">Delhi NCR <span>◆</span></div>
          {/* duplicate for seamless loop */}
          <div className="marquee-item">Find a Spot <span>◆</span></div>
          <div className="marquee-item">Book in Seconds <span>◆</span></div>
          <div className="marquee-item">Earn from Your Land <span>◆</span></div>
          <div className="marquee-item">No Hidden Fees <span>◆</span></div>
          <div className="marquee-item">Real Owners <span>◆</span></div>
          <div className="marquee-item">Open Air & Covered <span>◆</span></div>
          <div className="marquee-item">Hourly & Daily <span>◆</span></div>
          <div className="marquee-item">Delhi NCR <span>◆</span></div>
        </div>
      </div>

      {/* How It Works */}
      <section id="how">
        <div className="section-eyebrow reveal">Simple Process</div>
        <h2 className="section-h2 reveal">Three Steps.<br /><em>Zero Hassle.</em></h2>
        <div className="how-grid reveal">
          <div className="how-card">
            <div className="how-num">01</div>
            <div className="how-icon">🔍</div>
            <div className="how-title">Search Your Area</div>
            <p className="how-desc">Enter your destination or allow location access. We show you all available parking spots nearby with real-time availability.</p>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <div className="how-icon">📅</div>
            <div className="how-title">Pick & Book</div>
            <p className="how-desc">Choose your spot by type, price, or distance. Select your date, time, and vehicle. Confirm in under 30 seconds.</p>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <div className="how-icon">🚗</div>
            <div className="how-title">Park & Pay</div>
            <p className="how-desc">Show your booking ID at the spot. Pay on arrival — no card required upfront. It's that simple, every single time.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features">
        <div className="section-eyebrow reveal">Why ParkEase</div>
        <h2 className="section-h2 reveal">Built for <em>Drivers.</em><br />Designed for Owners.</h2>

        <div className="features-layout reveal" style={{ marginTop: '56px' }}>
          <div className="feature-visual">
            <div className="feature-visual-inner">🗺️</div>
            <div className="feature-glow"></div>
            <div className="feature-tag">LIVE MAP</div>
          </div>
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon-wrap">📍</div>
              <div>
                <div className="feature-item-title">Real-Time Availability</div>
                <div className="feature-item-desc">See live spot availability on an interactive map. No more driving in circles looking for parking.</div>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrap">💰</div>
              <div>
                <div className="feature-item-title">Transparent Pricing</div>
                <div className="feature-item-desc">Every spot shows hourly and daily rates upfront. Zero hidden charges, zero surprises at checkout.</div>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrap">📏</div>
              <div>
                <div className="feature-item-title">Distance Calculator</div>
                <div className="feature-item-desc">See exact distance from each spot to your destination. Estimated walking and driving time included.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="features-layout reverse reveal" style={{ marginTop: '40px' }}>
          <div className="feature-visual">
            <div className="feature-visual-inner">📊</div>
            <div className="feature-glow"></div>
            <div className="feature-tag">OWNER TOOLS</div>
          </div>
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon-wrap">🏠</div>
              <div>
                <div className="feature-item-title">List Your Land in Minutes</div>
                <div className="feature-item-desc">Upload photos, set your price, choose availability — your spot is live and earning within minutes.</div>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrap">📈</div>
              <div>
                <div className="feature-item-title">Earnings Dashboard</div>
                <div className="feature-item-desc">Track bookings, monitor revenue trends, and manage all your spots from one clean dashboard.</div>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrap">🔒</div>
              <div>
                <div className="feature-item-title">Verified Bookings Only</div>
                <div className="feature-item-desc">Every driver is verified with a valid vehicle registration. Your land stays safe and accountable.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spots Showcase */}
      <section id="spots">
        <div className="section-eyebrow reveal">Available Now</div>
        <h2 className="section-h2 reveal">Spots Near <em>You</em></h2>
        <div className="spots-scroll reveal" ref={spotsScrollRef}>
          <div className="spot-card">
            <div className="spot-img">
              <img src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&q=80" alt="" />
            </div>
            <div className="spot-body">
              <div className="spot-type" style={{ background: 'rgba(247,201,72,0.12)', color: '#d4a017' }}>Open Air</div>
              <div className="spot-name">Front Yard – Spot A</div>
              <div className="spot-loc">📍 MG Road, Ghaziabad · 0.4 km</div>
              <div className="spot-footer">
                <div className="spot-price">₹30 <small>/hr</small></div>
                <div className="spot-book-btn">Book Now</div>
              </div>
            </div>
          </div>
          <div className="spot-card">
            <div className="spot-img">
              <img src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&q=80" alt="" />
            </div>
            <div className="spot-body">
              <div className="spot-type" style={{ background: 'rgba(99,210,255,0.1)', color: '#2d9ecf' }}>Covered</div>
              <div className="spot-name">Side Lane – Spot B</div>
              <div className="spot-loc">📍 MG Road, Ghaziabad · 0.6 km</div>
              <div className="spot-footer">
                <div className="spot-price">₹50 <small>/hr</small></div>
                <div className="spot-book-btn">Book Now</div>
              </div>
            </div>
          </div>
          <div className="spot-card">
            <div className="spot-img">
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" alt="" />
            </div>
            <div className="spot-body">
              <div className="spot-type" style={{ background: 'rgba(192,132,252,0.1)', color: '#9561d6' }}>Basement</div>
              <div className="spot-name">Basement – Spot C</div>
              <div className="spot-loc">📍 Vaishali Sector 4 · 1.2 km</div>
              <div className="spot-footer">
                <div className="spot-price">₹40 <small>/hr</small></div>
                <div className="spot-book-btn">Book Now</div>
              </div>
            </div>
          </div>
          <div className="spot-card">
            <div className="spot-img">
              <img src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&q=80" alt="" />
            </div>
            <div className="spot-body">
              <div className="spot-type" style={{ background: 'rgba(247,201,72,0.12)', color: '#d4a017' }}>Open Air</div>
              <div className="spot-name">Gate Parking – Spot E</div>
              <div className="spot-loc">📍 Noida Sector 62 · 1.8 km</div>
              <div className="spot-footer">
                <div className="spot-price">₹35 <small>/hr</small></div>
                <div className="spot-book-btn">Book Now</div>
              </div>
            </div>
          </div>
          <div className="spot-card">
            <div className="spot-img">
              <img src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&q=80" alt="" />
            </div>
            <div className="spot-body">
              <div className="spot-type" style={{ background: 'rgba(99,210,255,0.1)', color: '#2d9ecf' }}>Covered</div>
              <div className="spot-name">Premium Covered – F</div>
              <div className="spot-loc">📍 Indirapuram · 2.1 km</div>
              <div className="spot-footer">
                <div className="spot-price">₹60 <small>/hr</small></div>
                <div className="spot-book-btn">Book Now</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews">
        <div className="section-eyebrow reveal">People Love It</div>
        <h2 className="section-h2 reveal">Real <em>Stories,</em><br />Real Parking.</h2>
        <div className="reviews-grid">
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">"Found a covered spot 200 metres from my office. Saved me ₹3,000 a month compared to the mall parking nearby. Absolute game changer."</p>
            <div className="review-author">
              <div className="review-avatar" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>AS</div>
              <div>
                <div className="review-name">Aditya Sharma</div>
                <div className="review-role">Daily commuter · Ghaziabad</div>
              </div>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">"Listed my driveway in 10 minutes. Within 48 hours I had my first booking. Now I earn ₹6,000 extra every month doing absolutely nothing."</p>
            <div className="review-author">
              <div className="review-avatar" style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)' }}>RK</div>
              <div>
                <div className="review-name">Rajesh Kumar</div>
                <div className="review-role">Land Owner · MG Road</div>
              </div>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars">★★★★☆</div>
            <p className="review-text">"The booking flow is incredibly smooth. I found a spot, entered my vehicle details, and got a confirmation in literally 20 seconds. Impressed."</p>
            <div className="review-author">
              <div className="review-avatar" style={{ background: 'linear-gradient(135deg,#63d2ff,#3a8fff)' }}>NP</div>
              <div>
                <div className="review-name">Neha Patel</div>
                <div className="review-role">IT professional · Noida</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <div className="section-eyebrow reveal">Simple Pricing</div>
        <h2 className="section-h2 reveal">Honest Rates.<br /><em>Always.</em></h2>
        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="pricing-plan">Basic</div>
            <div className="pricing-amount">Free <span>forever</span></div>
            <p className="pricing-desc">For drivers who need occasional parking. Browse and book with no subscription.</p>
            <div className="pricing-features">
              <div className="pricing-feature">Browse all available spots</div>
              <div className="pricing-feature">Hourly & daily booking</div>
              <div className="pricing-feature">Booking history</div>
              <div className="pricing-feature">Basic support</div>
            </div>
            <button className="pricing-btn outline">Start Free →</button>
          </div>
          <div className="pricing-card featured">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-plan">Pro Driver</div>
            <div className="pricing-amount">₹199 <span>/month</span></div>
            <p className="pricing-desc">For frequent parkers who want the best spots, saved favourites, and zero friction.</p>
            <div className="pricing-features">
              <div className="pricing-feature">Everything in Free</div>
              <div className="pricing-feature">Priority spot booking</div>
              <div className="pricing-feature">Wallet with cashback</div>
              <div className="pricing-feature">Saved spots & vehicles</div>
              <div className="pricing-feature">24/7 priority support</div>
            </div>
            <button className="pricing-btn filled">Get Pro →</button>
          </div>
          <div className="pricing-card">
            <div className="pricing-plan">Land Owner</div>
            <div className="pricing-amount">Free <span>to list</span></div>
            <p className="pricing-desc">List your land, set your price, and start earning. We take 10% only when you do.</p>
            <div className="pricing-features">
              <div className="pricing-feature">List up to 3 spots</div>
              <div className="pricing-feature">Photo uploads</div>
              <div className="pricing-feature">Earnings dashboard</div>
              <div className="pricing-feature">10% platform fee only on bookings</div>
            </div>
            <button className="pricing-btn outline">List My Land →</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="cta-inner reveal">
          <div className="section-eyebrow" style={{ justifyContent: 'center', display: 'flex' }}>Ready to Park Smarter?</div>
          <h2 className="cta-h2">Your Spot is<br /><em>Waiting.</em></h2>
          <p className="cta-sub">Join thousands of drivers and land owners already using ParkEase across Delhi NCR.</p>
          <div className="cta-actions">
            <a onClick={() => navigate('/book-parking')} style={{ cursor: 'pointer' }} className="btn-primary-hero">Find Parking Now →</a>
            <a onClick={() => navigate('/landowner-dashboard')} style={{ cursor: 'pointer' }} className="btn-ghost">List Your Land</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <a className="logo" href="#" style={{ display: 'inline-flex' }}>
              <div className="logo-icon">🅿</div>
              <span className="logo-text" style={{ marginLeft: '10px' }}>ParkEase</span>
            </a>
            <p>Connecting drivers with land owners across Delhi NCR. Park smart, earn easy.</p>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Product</div>
            <a href="#">Browse Spots</a>
            <a href="#">List Your Land</a>
            <a href="#">How It Works</a>
            <a href="#">Pricing</a>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Company</div>
            <a href="#">About Us</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Legal</div>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
            <a href="#">Support</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 ParkEase Technologies. All rights reserved.</span>
          <span>Made with ❤️ in Delhi NCR</span>
        </div>
      </footer>

      {/* Styles - kept inside component for portability, but ideally move to CSS file */}
      <style jsx>{`
        /* Copy all the styles from the original HTML here */
        /* Reset & Base */
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{
          background:#080808;
          color:#e8e4dc;
          font-family:'DM Sans',sans-serif;
          overflow-x:hidden;
          cursor:none;
        }

        /* Custom Cursor */
        #cursor{
          position:fixed;width:12px;height:12px;
          background:#f97316;border-radius:50%;
          pointer-events:none;z-index:9999;
          transform:translate(-50%,-50%);
          transition:transform 0.1s ease,width 0.3s ease,height 0.3s ease,background 0.3s ease;
          mix-blend-mode:difference;
        }
        #cursor-ring{
          position:fixed;width:40px;height:40px;
          border:1px solid rgba(249,115,22,0.4);border-radius:50%;
          pointer-events:none;z-index:9998;
          transform:translate(-50%,-50%);
          transition:transform 0.18s ease,width 0.3s ease,height 0.3s ease;
        }
        body.hovering #cursor{width:6px;height:6px}
        body.hovering #cursor-ring{width:60px;height:60px;border-color:rgba(249,115,22,0.7)}

        /* Grid BG */
        #grid-bg{
          position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:
            linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px);
          background-size:60px 60px;
          mask-image:radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }
        #noise{
          position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0.03;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* NAV */
        nav{
          position:fixed;top:0;left:0;right:0;z-index:100;
          display:flex;align-items:center;justify-content:space-between;
          padding:20px 56px;
          transition:background 0.4s ease,backdrop-filter 0.4s ease,padding 0.4s ease;
        }
        nav.scrolled{
          background:rgba(8,8,8,0.85);
          backdrop-filter:blur(20px);
          padding:14px 56px;
          border-bottom:1px solid rgba(249,115,22,0.1);
        }
        .logo{
          display:flex;align-items:center;gap:12px;text-decoration:none;
        }
        .logo-icon{
          width:38px;height:38px;border-radius:10px;
          background:linear-gradient(135deg,#f97316,#ea580c);
          display:flex;align-items:center;justify-content:center;
          font-size:20px;
          box-shadow:0 0 20px rgba(249,115,22,0.4);
          transition:box-shadow 0.3s ease;
        }
        .logo:hover .logo-icon{box-shadow:0 0 40px rgba(249,115,22,0.7)}
        .logo-text{
          font-family:'Bebas Neue',cursive;font-size:24px;
          letter-spacing:2px;color:#e8e4dc;
        }
        .nav-links{display:flex;align-items:center;gap:36px}
        .nav-links a{
          font-size:13px;font-weight:500;color:#888;text-decoration:none;
          letter-spacing:0.5px;transition:color 0.2ease;
          position:relative;
        }
        .nav-links a::after{
          content:'';position:absolute;bottom:-4px;left:0;right:0;
          height:1px;background:#f97316;transform:scaleX(0);
          transition:transform 0.3s ease;transform-origin:left;
        }
        .nav-links a:hover{color:#e8e4dc}
        .nav-links a:hover::after{transform:scaleX(1)}
        .nav-cta{
          background:linear-gradient(135deg,#f97316,#ea580c);
          color:#fff!important;padding:10px 22px;border-radius:8px;
          font-weight:600!important;font-size:13px!important;
          box-shadow:0 4px 20px rgba(249,115,22,0.3);
          transition:box-shadow 0.3s ease,transform 0.2s ease!important;
        }
        .nav-cta:hover{
          box-shadow:0 6px 32px rgba(249,115,22,0.6)!important;
          transform:translateY(-1px)!important;
        }
        .nav-cta::after{display:none!important}
        .nav-login{
          border:1px solid rgba(249,115,22,0.4)!important;
          color:#f97316!important;padding:10px 22px;border-radius:8px;
          font-weight:600!important;font-size:13px!important;
          transition:all 0.3s ease!important;
          background:transparent!important;
        }
        .nav-login:hover{
          background:rgba(249,115,22,0.1)!important;
          border-color:#f97316!important;
          transform:translateY(-1px)!important;
        }
        .nav-login::after{display:none!important}

        /* HERO */
        #hero{
          position:relative;min-height:100vh;
          display:flex;flex-direction:column;justify-content:center;
          padding:120px 56px 80px;z-index:2;overflow:hidden;
        }
        .hero-eyebrow{
          display:inline-flex;align-items:center;gap:8px;
          background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.2);
          border-radius:100px;padding:6px 16px;
          font-size:11px;font-weight:600;letter-spacing:2px;color:#f97316;
          text-transform:uppercase;margin-bottom:28px;
          opacity:0;animation:fadeUp 0.8s ease 0.2s forwards;
        }
        .hero-eyebrow span.dot{
          width:6px;height:6px;border-radius:50%;background:#f97316;
          animation:pulse-dot 2s infinite;
        }
        @keyframes pulse-dot{
          0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.5)}
          50%{box-shadow:0 0 0 5px rgba(249,115,22,0)}
        }
        .hero-h1{
          font-family:'Bebas Neue',cursive;
          font-size:clamp(80px,12vw,160px);
          line-height:0.9;letter-spacing:-1px;
          color:#e8e4dc;
          opacity:0;animation:fadeUp 1s ease 0.4s forwards;
        }
        .hero-h1 em{
          font-family:'Instrument Serif',serif;
          font-style:italic;color:#f97316;
        }
        .hero-h1 .line2{
          display:block;
          -webkit-text-stroke:1px rgba(232,228,220,0.3);
          color:transparent;
        }
        .hero-sub{
          max-width:420px;margin-top:28px;
          font-size:16px;line-height:1.7;color:#777;font-weight:400;
          opacity:0;animation:fadeUp 1s ease 0.6s forwards;
        }
        .hero-actions{
          display:flex;align-items:center;gap:18px;margin-top:40px;
          opacity:0;animation:fadeUp 1s ease 0.8s forwards;
        }
        .btn-primary-hero{
          display:inline-flex;align-items:center;gap:10px;
          background:linear-gradient(135deg,#f97316,#ea580c);
          color:#fff;border:none;border-radius:12px;
          padding:16px 32px;font-size:15px;font-weight:600;
          cursor:none;text-decoration:none;
          box-shadow:0 8px 32px rgba(249,115,22,0.4);
          transition:box-shadow 0.3s ease,transform 0.2s ease;
        }
        .btn-primary-hero:hover{
          box-shadow:0 12px 48px rgba(249,115,22,0.6);
          transform:translateY(-2px);
        }
        .btn-ghost{
          display:inline-flex;align-items:center;gap:8px;
          background:transparent;color:#888;
          border:1px solid rgba(255,255,255,0.1);
          border-radius:12px;padding:16px 28px;
          font-size:15px;font-weight:500;cursor:none;text-decoration:none;
          transition:color 0.2s ease,border-color 0.2s ease;
        }
        .btn-ghost:hover{color:#e8e4dc;border-color:rgba(255,255,255,0.3)}
        .hero-stats{
          display:flex;gap:48px;margin-top:64px;padding-top:40px;
          border-top:1px solid rgba(255,255,255,0.06);
          opacity:0;animation:fadeUp 1s ease 1s forwards;
        }
        .hero-stat-val{
          font-family:'Bebas Neue',cursive;font-size:44px;
          line-height:1;color:#f97316;letter-spacing:1px;
        }
        .hero-stat-label{font-size:12px;color:#555;margin-top:4px;letter-spacing:0.5px}

        /* floating car */
        .hero-car{
          position:absolute;right:-40px;bottom:10%;
          font-size:clamp(180px,22vw,320px);
          opacity:0.04;user-select:none;pointer-events:none;
          animation:car-float 6s ease-in-out infinite;
        }
        @keyframes car-float{
          0%,100%{transform:translateY(0) rotate(-3deg)}
          50%{transform:translateY(-20px) rotate(-3deg)}
        }

        /* MARQUEE */
        .marquee-wrap{
          position:relative;z-index:2;
          overflow:hidden;
          border-top:1px solid rgba(255,255,255,0.05);
          border-bottom:1px solid rgba(255,255,255,0.05);
          padding:16px 0;background:rgba(249,115,22,0.04);
        }
        .marquee-track{
          display:flex;gap:0;
          animation:marquee 22s linear infinite;
          white-space:nowrap;
        }
        .marquee-track:hover{animation-play-state:paused}
        .marquee-item{
          font-family:'Bebas Neue',cursive;
          font-size:28px;letter-spacing:4px;color:rgba(249,115,22,0.5);
          padding:0 36px;display:flex;align-items:center;gap:18px;
        }
        .marquee-item span{color:rgba(232,228,220,0.15);font-size:20px}
        @keyframes marquee{
          0%{transform:translateX(0)}
          100%{transform:translateX(-50%)}
        }

        /* SECTIONS base */
        section{position:relative;z-index:2}
        .section-eyebrow{
          font-size:11px;font-weight:600;letter-spacing:3px;
          color:#f97316;text-transform:uppercase;margin-bottom:16px;
        }
        .section-h2{
          font-family:'Bebas Neue',cursive;
          font-size:clamp(52px,6vw,80px);
          line-height:0.95;letter-spacing:1px;color:#e8e4dc;
          margin-bottom:20px;
        }
        .section-h2 em{font-family:'Instrument Serif',serif;font-style:italic;color:#f97316}

        /* HOW IT WORKS */
        #how{padding:120px 56px}
        .how-grid{
          display:grid;grid-template-columns:repeat(3,1fr);gap:2px;
          margin-top:64px;border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden;
        }
        .how-card{
          padding:44px 36px;background:#0e0e0e;
          border-right:1px solid rgba(255,255,255,0.05);
          position:relative;overflow:hidden;
          transition:background 0.4s ease;
        }
        .how-card:last-child{border-right:none}
        .how-card::before{
          content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,rgba(249,115,22,0.06),transparent);
          opacity:0;transition:opacity 0.4s ease;
        }
        .how-card:hover{background:#111}
        .how-card:hover::before{opacity:1}
        .how-num{
          font-family:'Bebas Neue',cursive;font-size:72px;
          color:rgba(249,115,22,0.1);line-height:1;
          position:absolute;top:16px;right:24px;
          transition:color 0.4s ease;
        }
        .how-card:hover .how-num{color:rgba(249,115,22,0.2)}
        .how-icon{
          font-size:36px;margin-bottom:20px;
          display:inline-block;
          transition:transform 0.4s ease;
        }
        .how-card:hover .how-icon{transform:scale(1.15) rotate(-5deg)}
        .how-title{
          font-family:'Bebas Neue',cursive;font-size:26px;
          letter-spacing:1px;color:#e8e4dc;margin-bottom:12px;
        }
        .how-desc{font-size:14px;color:#666;line-height:1.7}

        /* FEATURES */
        #features{padding:100px 56px}
        .features-layout{
          display:grid;grid-template-columns:1fr 1fr;
          gap:64px;align-items:center;margin-top:48px;
        }
        .features-layout.reverse{direction:rtl}
        .features-layout.reverse > *{direction:ltr}
        .feature-visual{
          position:relative;border-radius:24px;overflow:hidden;
          background:#0e0e0e;border:1px solid rgba(255,255,255,0.06);
          aspect-ratio:4/3;
          display:flex;align-items:center;justify-content:center;
        }
        .feature-visual-inner{
          width:100%;height:100%;display:flex;align-items:center;justify-content:center;
          font-size:120px;opacity:0.12;
          transition:opacity 0.4s ease,transform 0.6s ease;
        }
        .feature-visual:hover .feature-visual-inner{opacity:0.2;transform:scale(1.05)}
        .feature-glow{
          position:absolute;bottom:0;left:0;right:0;height:50%;
          background:linear-gradient(to top,rgba(249,115,22,0.12),transparent);
        }
        .feature-tag{
          position:absolute;top:16px;left:16px;
          background:rgba(8,8,8,0.8);backdrop-filter:blur(10px);
          border:1px solid rgba(249,115,22,0.2);border-radius:100px;
          padding:6px 14px;font-size:11px;color:#f97316;font-weight:700;letter-spacing:1px;
        }
        .features-list{display:flex;flex-direction:column;gap:28px}
        .feature-item{
          display:flex;gap:18px;align-items:flex-start;
          padding:20px;border-radius:14px;
          border:1px solid transparent;
          transition:background 0.3s ease,border-color 0.3s ease;
        }
        .feature-item:hover{
          background:rgba(249,115,22,0.04);
          border-color:rgba(249,115,22,0.15);
        }
        .feature-icon-wrap{
          width:44px;height:44px;border-radius:12px;
          background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.2);
          display:flex;align-items:center;justify-content:center;
          font-size:20px;flex-shrink:0;
          transition:background 0.3s ease,transform 0.3s ease;
        }
        .feature-item:hover .feature-icon-wrap{
          background:rgba(249,115,22,0.2);transform:rotate(-8deg) scale(1.1);
        }
        .feature-item-title{font-weight:700;font-size:15px;color:#e8e4dc;margin-bottom:6px}
        .feature-item-desc{font-size:13px;color:#666;line-height:1.6}

        /* SPOT CARDS SHOWCASE */
        #spots{padding:100px 56px}
        .spots-scroll{
          display:flex;gap:20px;margin-top:48px;
          overflow-x:auto;padding-bottom:16px;
          scrollbar-width:none;
        }
        .spots-scroll::-webkit-scrollbar{display:none}
        .spot-card{
          flex-shrink:0;width:280px;
          background:#0e0e0e;border:1px solid rgba(255,255,255,0.06);
          border-radius:20px;overflow:hidden;
          transition:transform 0.3s ease,box-shadow 0.3s ease,border-color 0.3s ease;
        }
        .spot-card:hover{
          transform:translateY(-8px);
          box-shadow:0 24px 60px rgba(0,0,0,0.5);
          border-color:rgba(249,115,22,0.2);
        }
        .spot-img{
          height:160px;overflow:hidden;position:relative;
          background:#161616;display:flex;align-items:center;justify-content:center;
          font-size:64px;color:rgba(255,255,255,0.05);
        }
        .spot-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease}
        .spot-card:hover .spot-img img{transform:scale(1.08)}
        .spot-body{padding:18px}
        .spot-type{
          display:inline-block;font-size:10px;font-weight:700;letter-spacing:1px;
          padding:3px 10px;border-radius:20px;text-transform:uppercase;margin-bottom:10px;
        }
        .spot-name{font-weight:700;font-size:15px;color:#e8e4dc;margin-bottom:4px}
        .spot-loc{font-size:12px;color:#555;margin-bottom:14px}
        .spot-footer{
          display:flex;justify-content:space-between;align-items:center;
          padding-top:14px;border-top:1px solid rgba(255,255,255,0.05);
        }
        .spot-price{font-family:'Bebas Neue',cursive;font-size:26px;color:#f97316;letter-spacing:1px}
        .spot-price small{font-family:'DM Sans',sans-serif;font-size:11px;color:#555;font-weight:400}
        .spot-book-btn{
          background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.25);
          border-radius:8px;padding:8px 16px;color:#f97316;
          font-size:12px;font-weight:700;cursor:none;
          transition:background 0.2s ease,box-shadow 0.2s ease;
        }
        .spot-card:hover .spot-book-btn{
          background:#f97316;color:#fff;
          box-shadow:0 4px 20px rgba(249,115,22,0.4);
        }

        /* TESTIMONIALS */
        #reviews{padding:100px 56px}
        .reviews-grid{
          display:grid;grid-template-columns:repeat(3,1fr);
          gap:16px;margin-top:48px;
        }
        .review-card{
          background:#0e0e0e;border:1px solid rgba(255,255,255,0.06);
          border-radius:20px;padding:28px;
          transition:border-color 0.3s ease,transform 0.3s ease;
          opacity:0;transform:translateY(24px);
          transition:opacity 0.6s ease,transform 0.6s ease,border-color 0.3s ease;
        }
        .review-card.visible{opacity:1;transform:translateY(0)}
        .review-card:hover{border-color:rgba(249,115,22,0.2);transform:translateY(-4px)}
        .review-stars{color:#f97316;font-size:14px;letter-spacing:2px;margin-bottom:16px}
        .review-text{font-size:14px;color:#777;line-height:1.7;margin-bottom:20px;font-style:italic}
        .review-author{display:flex;align-items:center;gap:12px}
        .review-avatar{
          width:38px;height:38px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:14px;color:#fff;flex-shrink:0;
        }
        .review-name{font-weight:700;font-size:13px;color:#e8e4dc}
        .review-role{font-size:11px;color:#555;margin-top:2px}

        /* PRICING */
        #pricing{padding:100px 56px}
        .pricing-cards{
          display:grid;grid-template-columns:repeat(3,1fr);
          gap:20px;margin-top:48px;align-items:start;
        }
        .pricing-card{
          background:#0e0e0e;border:1px solid rgba(255,255,255,0.06);
          border-radius:24px;padding:36px;
          transition:transform 0.3s ease,border-color 0.3s ease,box-shadow 0.3s ease;
          opacity:0;transform:translateY(20px);
          transition:opacity 0.6s ease,transform 0.6s ease,border-color 0.3s ease,box-shadow 0.3s ease;
        }
        .pricing-card.visible{opacity:1;transform:translateY(0)}
        .pricing-card.featured{
          background:linear-gradient(135deg,#111,#0e0c0a);
          border-color:rgba(249,115,22,0.3);
          box-shadow:0 0 60px rgba(249,115,22,0.1);
          transform:translateY(-8px);
        }
        .pricing-card.featured.visible{transform:translateY(-8px)}
        .pricing-badge{
          display:inline-block;background:#f97316;color:#fff;
          font-size:10px;font-weight:800;letter-spacing:2px;
          padding:4px 12px;border-radius:20px;text-transform:uppercase;
          margin-bottom:20px;
        }
        .pricing-plan{font-size:12px;font-weight:700;color:#666;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
        .pricing-amount{
          font-family:'Bebas Neue',cursive;font-size:56px;color:#e8e4dc;
          line-height:1;letter-spacing:1px;
        }
        .pricing-amount span{font-family:'DM Sans',sans-serif;font-size:18px;color:#555;font-weight:400}
        .pricing-desc{font-size:13px;color:#555;margin:12px 0 28px;line-height:1.6}
        .pricing-features{display:flex;flex-direction:column;gap:12px;margin-bottom:32px}
        .pricing-feature{
          display:flex;align-items:center;gap:10px;
          font-size:13px;color:#888;
        }
        .pricing-feature::before{
          content:'✓';width:18px;height:18px;border-radius:50%;
          background:rgba(249,115,22,0.15);color:#f97316;
          display:flex;align-items:center;justify-content:center;
          font-size:10px;font-weight:800;flex-shrink:0;
        }
        .pricing-btn{
          width:100%;padding:14px;border-radius:12px;
          font-weight:700;font-size:14px;cursor:none;
          transition:all 0.3s ease;
        }
        .pricing-btn.outline{
          background:transparent;border:1px solid rgba(255,255,255,0.12);color:#888;
        }
        .pricing-btn.outline:hover{border-color:rgba(249,115,22,0.3);color:#f97316}
        .pricing-btn.filled{
          background:linear-gradient(135deg,#f97316,#ea580c);
          border:none;color:#fff;
          box-shadow:0 8px 28px rgba(249,115,22,0.35);
        }
        .pricing-btn.filled:hover{box-shadow:0 12px 40px rgba(249,115,22,0.55);transform:translateY(-1px)}

        /* CTA SECTION */
        #cta{padding:100px 56px}
        .cta-inner{
          background:linear-gradient(135deg,#111,#0f0d0b);
          border:1px solid rgba(249,115,22,0.2);
          border-radius:32px;padding:80px;text-align:center;
          position:relative;overflow:hidden;
        }
        .cta-inner::before{
          content:'';position:absolute;
          top:-100px;left:50%;transform:translateX(-50%);
          width:400px;height:400px;border-radius:50%;
          background:radial-gradient(circle,rgba(249,115,22,0.12),transparent 70%);
          pointer-events:none;
        }
        .cta-h2{
          font-family:'Bebas Neue',cursive;font-size:clamp(56px,7vw,96px);
          line-height:0.95;letter-spacing:1px;color:#e8e4dc;
          margin-bottom:20px;
        }
        .cta-h2 em{font-family:'Instrument Serif',serif;font-style:italic;color:#f97316}
        .cta-sub{font-size:16px;color:#666;max-width:420px;margin:0 auto 40px;line-height:1.7}
        .cta-actions{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}

        /* FOOTER */
        footer{
          border-top:1px solid rgba(255,255,255,0.05);
          padding:56px 56px 36px;z-index:2;position:relative;
        }
        .footer-top{
          display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;
          gap:48px;margin-bottom:48px;
        }
        .footer-brand p{font-size:13px;color:#555;line-height:1.7;margin-top:12px;max-width:240px}
        .footer-col-title{
          font-size:11px;font-weight:700;letter-spacing:2px;color:#444;
          text-transform:uppercase;margin-bottom:18px;
        }
        .footer-col a{
          display:block;font-size:13px;color:#555;text-decoration:none;
          margin-bottom:10px;transition:color 0.2s;
        }
        .footer-col a:hover{color:#e8e4dc}
        .footer-bottom{
          display:flex;justify-content:space-between;align-items:center;
          padding-top:28px;border-top:1px solid rgba(255,255,255,0.05);
          font-size:12px;color:#444;
        }

        /* REVEAL ANIMATION */
        .reveal{
          opacity:0;transform:translateY(28px);
          transition:opacity 0.8s ease,transform 0.8s ease;
        }
        .reveal.visible{opacity:1;transform:translateY(0)}

        /* KEYFRAMES */
        @keyframes fadeUp{
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }

        /* SCROLL PROGRESS */
        #progress{
          position:fixed;top:0;left:0;height:2px;
          background:linear-gradient(to right,#f97316,#ea580c);
          z-index:200;transition:width 0.1s linear;
          box-shadow:0 0 10px rgba(249,115,22,0.6);
        }

        /* FLOATING PARTICLES */
        .particle{
          position:fixed;pointer-events:none;z-index:1;
          width:3px;height:3px;border-radius:50%;
          background:rgba(249,115,22,0.4);
        }

        /* COUNTER ANIMATION */
        .count-up{transition:all 0.1s ease}
      `}</style>
    </>
  );
};

export default ParkEase;