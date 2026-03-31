import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { supabase } from "../lib/supabaseClient";

const ParkEaseAuthForm = ({ type }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = location.state?.role || localStorage.getItem("userRole") || "driver";
  
  const [formData, setFormData] = useState({
    name: "",
    identifier: "",   // email OR phone number
    email: "",         // used only for signup
    password: "",
    confirmPassword: "",
    role: userRole,
  });

  // Detect whether the identifier looks like an email or a phone number
  const detectInputType = (value) => {
    const cleaned = value.replace(/\s|-/g, '');
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
    if (/^[0-9]{10}$/.test(cleaned)) return 'phone';
    return 'unknown';
  };

  const identifierType = detectInputType(formData.identifier);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });

  // Custom cursor effect (same as before)
  useEffect(() => {
    const cur = document.getElementById("cur");
    const curR = document.getElementById("cur-r");
    if (!cur || !curR) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      cur.style.left = mx + "px";
      cur.style.top = my + "px";
    };

    window.addEventListener("mousemove", onMouseMove);

    let animationFrame;
    const animate = () => {
      rx += (mx - rx) * 0.13;
      ry += (my - ry) * 0.13;
      curR.style.left = rx + "px";
      curR.style.top = ry + "px";
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    const interactiveElements = document.querySelectorAll("button, input, a");
    const addHover = () => document.body.classList.add("hov");
    const removeHover = () => document.body.classList.remove("hov");

    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", addHover);
      el.addEventListener("mouseleave", removeHover);
    });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animationFrame);
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", addHover);
        el.removeEventListener("mouseleave", removeHover);
      });
    };
  }, []);

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3000);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // ── SIGNUP ──────────────────────────────────────────────
    if (type === "signup") {
      if (!formData.email || !formData.password) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name, role: formData.role } },
        });
        if (error) throw error;
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify({ ...data.user, name: formData.name, role: formData.role }));
          localStorage.setItem("userRole", formData.role);
          showToast(`Account created as ${formData.role === 'driver' ? 'Driver' : 'Land Owner'}! 🎉`);
          setTimeout(() => navigate("/dashboard"), 1500);
        }
      } catch (err) {
        const msg = err.message || "Sign-up failed";
        setError(msg);
        showToast(msg, true);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── LOGIN ───────────────────────────────────────────────
    if (!formData.identifier || !formData.password) {
      setError("Please enter your email / phone and password");
      setLoading(false);
      return;
    }

    try {
      const rawIdentifier = formData.identifier.trim();
      let loginEmail = rawIdentifier;

      // Re-detect type fresh inside submit (avoids stale closure)
      const cleaned = rawIdentifier.replace(/\s|-/g, '');
      const isPhone = /^[0-9]{10}$/.test(cleaned);
      const isEmail = rawIdentifier.includes('@');

      // If the user typed a phone number, look up the email via secure DB function
      if (isPhone) {
        const { data: foundEmail, error: rpcErr } = await supabase
          .rpc('get_email_by_phone', { p_phone: cleaned });

        if (rpcErr || !foundEmail) {
          throw new Error('No account found with that phone number. Please use your registered email instead.');
        }
        loginEmail = foundEmail;
      }
      // If not phone and not email-like, still attempt — Supabase will return the proper error
      // This avoids false-blocking edge-case email formats

      // Sign in with resolved email + password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: formData.password,
      });
      if (error) throw error;

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify({ ...data.user, role: formData.role }));
        localStorage.setItem("userRole", formData.role);
        showToast("Welcome back! 👋");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      const msg = err.message || "Authentication failed";
      // Make common Supabase errors more user-friendly
      const friendlyMsg =
        msg.includes("Email not confirmed")
          ? "❌ Please confirm your email first. Check your inbox for the confirmation link."
          : msg.includes("Invalid login credentials")
          ? "❌ Incorrect email/phone or password."
          : msg.includes("No account found")
          ? "❌ " + msg
          : "❌ " + msg;
      setError(friendlyMsg);
      showToast(friendlyMsg, true);
    } finally {
      setLoading(false);
    }
  };

  const isSignup = type === "signup";
  const roleDisplay = formData.role === "driver" ? "Driver" : "Land Owner";

  return (
    <>
      {/* Custom Cursor Elements */}
      <div
        id="cur"
        className="fixed w-2.5 h-2.5 bg-orange-500 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      <div
        id="cur-r"
        className="fixed w-9 h-9 border border-orange-500/35 rounded-full pointer-events-none z-[9998]"
        style={{ transform: "translate(-50%, -50%)" }}
      />

      {/* Background Elements (same as before) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(249,115,22,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col bg-black text-gray-200">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
              🅿
            </div>
            <span className="font-['Bebas_Neue'] text-2xl tracking-wider">
              ParkEase
            </span>
          </div>
          <div className="flex gap-2">
            <div className="w-7 h-1.5 rounded-full bg-orange-500"></div>
            <div className="w-7 h-1.5 rounded-full bg-orange-500"></div>
            <div className={`w-7 h-1.5 rounded-full ${isSignup ? "bg-orange-500" : "bg-white/20"}`}></div>
          </div>
          <button
            className="text-gray-500 text-sm border border-white/10 px-4 py-1.5 rounded-md hover:text-white transition-colors"
            onClick={() => navigate(isSignup ? "/auth/role" : "/auth/parkease")}
          >
            Back
          </button>
        </nav>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-orange-500/10 rounded-2xl mb-4">
                <span className="text-3xl">{isSignup ? "🚀" : "👋"}</span>
              </div>
              <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl mb-2">
                {isSignup ? `Create ${roleDisplay} Account` : "Welcome Back"}
              </h1>
              <p className="text-gray-400 text-sm">
                {isSignup
                  ? `Join as a ${roleDisplay} and start ${formData.role === "driver" ? "parking smarter" : "earning from your land"}`
                  : "Sign in to continue to your account"}
              </p>
              {isSignup && (
                <div className="mt-2 inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-xs text-orange-500">
                  {formData.role === "driver" ? "🚗 Driver Account" : "🏠 Land Owner Account"}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-white"
                    placeholder="John Doe"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {/* Login: single flexible identifier field */}
              {!isSignup && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    Email or Phone Number
                    {formData.identifier && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        identifierType === 'email'   ? 'bg-green-500/20 text-green-400' :
                        identifierType === 'phone'   ? 'bg-blue-500/20  text-blue-400'  :
                                                        'bg-gray-500/20  text-gray-400'
                      }`}>
                        {identifierType === 'email' ? '✉️ Email' : identifierType === 'phone' ? '📱 Phone' : 'Type to detect'}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-900/50 border rounded-xl focus:outline-none focus:ring-1 transition-all text-white ${
                      identifierType === 'email' ? 'border-green-500/40 focus:border-green-500/70 focus:ring-green-500/20' :
                      identifierType === 'phone' ? 'border-blue-500/40  focus:border-blue-500/70  focus:ring-blue-500/20'  :
                                                    'border-white/10     focus:border-orange-500/50 focus:ring-orange-500/20'
                    }`}
                    placeholder="you@example.com  or  9876543210"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your registered email or 10-digit mobile number</p>
                </div>
              )}

              {/* Signup: traditional email field */}
              {isSignup && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-white"
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-white"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {isSignup && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-white"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  loading
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/25 transform hover:scale-[1.02]"
                } text-white`}
              >
                {loading
                  ? "Processing..."
                  : isSignup
                  ? `Create ${roleDisplay} Account →`
                  : "Sign In →"}
              </button>
            </form>

            {/* Switch between login/signup */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                {isSignup ? "Already have an account?" : "Don't have an account?"}
                <button
                  onClick={() => navigate(isSignup ? "/auth/login" : "/auth/role")}
                  className="ml-2 text-orange-500 hover:text-orange-400 font-medium transition-colors"
                >
                  {isSignup ? "Sign In" : "Create Account"}
                </button>
              </p>
            </div>

            {/* Demo Notice */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-600">
                ⚡ Demo Mode: You can use any email and password
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 ${
            toast.isError ? "bg-red-900 border-red-500" : "bg-gray-900 border-orange-500"
          } border-l-4 rounded-xl shadow-2xl p-4 flex items-center gap-3 z-50 animate-slide-up`}
        >
          <span className="text-2xl">{toast.isError ? "❌" : "✅"}</span>
          <div>
            <p className="font-semibold text-white">ParkEase</p>
            <p className="text-sm text-gray-300">{toast.message}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease forwards;
        }
        body.hov #cur {
          width: 5px;
          height: 5px;
        }
        body.hov #cur-r {
          width: 55px;
          height: 55px;
          border-color: rgba(249, 115, 22, 0.7);
        }
      `}</style>
    </>
  );
};

export default ParkEaseAuthForm;