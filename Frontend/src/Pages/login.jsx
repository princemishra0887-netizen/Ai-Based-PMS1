import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OTPPage from "./loginOTP";

const Login = () => {
  const [page, setPage] = useState("login");
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const destination = method === "email" ? email : `+91 ${phone}`;

  const handleNext = () => {
    setError("");
    if (method === "email" && !email) {
      setError("Please enter your email address.");
      return;
    }
    if (method === "phone" && phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setPage("otp");
  };

  if (page === "otp") {
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
            method={method}
            destination={destination}
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
        className="fixed w-2.5 h-2.5 bg-orange-500 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      <div
        id="cur-r"
        className="fixed w-9 h-9 border border-orange-500/35 rounded-full pointer-events-none z-[9998]"
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
            className="w-full max-w-[400px]"
          >
            {/* Logo */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
                <span className="text-xl font-bold text-white">🅿</span>
              </div>
              <h1 className="font-['Bebas_Neue'] text-3xl tracking-tight text-white">
                Sign in to ParkEase
              </h1>
              <p className="mt-1.5 text-sm text-gray-400">
                Access your dashboard to manage zones and occupancy.
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 p-8">
              {/* Segmented Control */}
              <div className="relative mb-6 flex rounded-xl bg-gray-800/50 p-1">
                <motion.div
                  className="absolute inset-y-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600"
                  style={{
                    width: "calc(50% - 4px)",
                  }}
                  animate={{ left: method === "email" ? 4 : "calc(50%)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
                {["email", "phone"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMethod(m);
                      setError("");
                    }}
                    className={`relative z-10 w-1/2 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
                      method === m ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {m === "email" ? "Email" : "Phone"}
                  </button>
                ))}
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {method === "email" ? (
                    <motion.div
                      key="email"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.15 }}
                    >
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@parkease.com"
                        className="h-11 w-full rounded-xl border border-white/10 bg-gray-800/50 px-4 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="phone"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.15 }}
                    >
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="flex h-11 items-center rounded-xl bg-gray-800/50 border border-white/10 px-3 text-sm text-gray-300">
                          +91
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(formatPhone(e.target.value))}
                          placeholder="98765 43210"
                          className="h-11 flex-1 rounded-xl border border-white/10 bg-gray-800/50 px-4 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password Field */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-white/10 bg-gray-800/50 px-4 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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

                <button
                  type="button"
                  onClick={handleNext}
                  className="relative mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Next
                </button>
              </div>

              {/* Footer Links */}
              <div className="mt-6 flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="text-gray-400 transition-colors hover:text-orange-500"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  className="text-gray-400 transition-colors hover:text-orange-500"
                >
                  Sign up →
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              © 2026 ParkEase. All rights reserved.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default Login;