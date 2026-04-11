import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import OTPPage from "./loginOTP";
import { supabase } from "../lib/supabaseClient";
import { fetchProfileByUser, getDashboardRouteForRole } from "../lib/profileHelpers";

const Login = () => {
  const [page, setPage] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("user"); // "user" or "landowner"
  
  const navigate = useNavigate();

  // Custom cursor effect for ParkEase theme
  useEffect(() => {
    const cur = document.getElementById("cur");
    const curR = document.getElementById("cur-r");
    if (!cur || !curR) return;

    let mx = 0,
      my = 0,
      rx = 0,
      ry = 0;

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

    const interactiveElements = document.querySelectorAll("button, a, input");
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

  const destination = email;

  const handleNext = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setLoading(false);
        setError(authError.message);
        return;
      }

      const userId = authData.user?.id;
      if (userId) {
        const { profile } = await fetchProfileByUser(authData.user);
        const role = profile?.role || 'user';
        localStorage.setItem("userRole", role);
        localStorage.setItem("user", JSON.stringify({
          ...authData.user,
          name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          role
        }));

        setLoading(false);
        window.location.href = getDashboardRouteForRole(role);
      } else {
        setLoading(false);
        window.location.href = '/dashboard/user';
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || "Login failed");
    }
  };

  if (page === "otp") {
    return (
      <>
        {/* Custom Cursor Elements */}
        <div
          id="cur"
          className="fixed w-3 h-3 bg-orange-500 rounded-full pointer-events-none z-[9999] mix-blend-difference"
          style={{ transform: "translate(-50%, -50%)" }}
        />
        <div
          id="cur-r"
          className="fixed w-11 h-11 border-2 border-orange-500/35 rounded-full pointer-events-none z-[9998]"
          style={{ transform: "translate(-50%, -50%)" }}
        />

        {/* Background Elements */}
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

        <div className="relative z-10 flex min-h-screen items-center justify-center bg-black px-4">
          <OTPPage
            destination={destination}
            userType={userType}
            onBack={() => setPage("login")}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Custom Cursor Elements */}
      <div
        id="cur"
        className="fixed w-3 h-3 bg-orange-500 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      <div
        id="cur-r"
        className="fixed w-11 h-11 border-2 border-orange-500/35 rounded-full pointer-events-none z-[9998]"
        style={{ transform: "translate(-50%, -50%)" }}
      />

      {/* Background Elements */}
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

      <div className="relative z-10 flex min-h-screen items-center justify-center bg-black px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[520px]"
          >
            {/* Logo - Made bigger */}
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-xl">
                <span className="text-2xl font-bold text-white">🅿</span>
              </div>
              <h1 className="font-['Bebas_Neue'] text-5xl tracking-tight text-white">
                Sign in to ParkEase
              </h1>
              <p className="mt-2 text-base text-gray-400">
                Access your dashboard to manage zones and occupancy.
              </p>
            </div>

            {/* Card - Made bigger with more padding */}
            <div className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 p-10">
              {/* Who Am I? Section - Made bigger */}
              <div className="mb-8">
                <label className="mb-3 block text-sm font-medium uppercase tracking-wider text-gray-400">
                  Who am I?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setUserType("user")}
                    className={`flex-1 py-3 px-4 rounded-xl transition-all duration-200 ${
                      userType === "user"
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                        : "bg-gray-800/50 border border-white/10 text-gray-400 hover:bg-gray-800/70"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">👤</span>
                      <span className="text-base font-semibold">User</span>
                    </div>
                    <p className="text-xs mt-1.5 opacity-80">Find & book parking</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("landowner")}
                    className={`flex-1 py-3 px-4 rounded-xl transition-all duration-200 ${
                      userType === "landowner"
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                        : "bg-gray-800/50 border border-white/10 text-gray-400 hover:bg-gray-800/70"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">🏢</span>
                      <span className="text-base font-semibold">Land Owner</span>
                    </div>
                    <p className="text-xs mt-1.5 opacity-80">Manage your properties</p>
                  </button>
                </div>
              </div>

              {/* Segmented Control removed - Email only login */}

              {/* Input Fields - Made bigger */}
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium uppercase tracking-wider text-gray-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      userType === "landowner"
                        ? "owner@parkease.com"
                        : "user@example.com"
                    }
                    className="h-12 w-full rounded-xl border border-white/10 bg-gray-800/50 px-4 text-base text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                {/* Password Field - Made bigger */}
                <div>
                  <label className="mb-2 block text-sm font-medium uppercase tracking-wider text-gray-400">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border border-white/10 bg-gray-800/50 px-4 pr-12 text-base text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-xl"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Next Button - Made bigger */}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="relative mt-3 h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-base font-semibold text-white shadow-lg transition-all hover:shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Continue"}
                </button>
              </div>

              {/* Footer Links - Made bigger */}
              <div className="mt-8 flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-gray-400 transition-colors hover:text-orange-500"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/auth/signup')}
                  className="text-gray-400 transition-colors hover:text-orange-500"
                >
                  Sign up →
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-gray-500">
              © 2026 ParkEase. All rights reserved.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default Login;
