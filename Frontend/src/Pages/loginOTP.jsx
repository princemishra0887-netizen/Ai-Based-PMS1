import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const OTPPage = ({ method, destination, userType, onBack }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setError("");
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      const next = [...otp];
      next[idx - 1] = "";
      setOtp(next);
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    
    const otpValue = otp.join("");
    let verifyError = null;
    let authData = null;

    if (method === "email") {
      const { data, error } = await supabase.auth.verifyOtp({
        email: destination,
        token: otpValue,
        type: 'email'
      });
      if (error) verifyError = error.message;
      else authData = data;
    } else {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: destination.replace(/\s/g, ""),
        token: otpValue,
        type: 'sms'
      });
      if (error) verifyError = error.message;
      else authData = data;
    }

    setLoading(false);

    if (verifyError) {
      setError(verifyError);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }
    
    if (authData?.session) {
       localStorage.setItem("userRole", userType || "user");
       localStorage.setItem("user", JSON.stringify(authData.user));
       navigate("/dashboard");
    }
  };

  const handleResend = async () => {
    setResendSeconds(30);
    setError("");
    
    if (method === "email") {
      await supabase.auth.signInWithOtp({ email: destination });
    } else {
      await supabase.auth.signInWithOtp({ phone: destination.replace(/\s/g, "") });
    }
  };

  const allFilled = otp.every(Boolean);

  return (
    <motion.div
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
          Verify your identity
        </h1>
        <p className="mt-1.5 text-sm text-gray-400">
          One last step — verify it's really you.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 p-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-orange-500 group"
        >
          <svg
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>

        <p className="mb-6 text-center text-sm text-gray-400">
          Code sent to{" "}
          <span className="font-medium text-orange-500">{destination}</span>
        </p>

        {/* OTP Inputs */}
        <div className="mb-6 flex justify-center gap-2.5">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`h-14 w-12 rounded-xl text-center font-mono text-xl font-medium transition-all duration-200 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                digit
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  : "bg-gray-800/50 border border-white/10 text-white"
              }`}
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-sm text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={!allFilled || loading}
          className="relative h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              <span>Verifying...</span>
            </div>
          ) : (
            "Verify & Sign In"
          )}
        </button>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <span>Didn't receive it?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSeconds > 0}
            className="font-semibold text-orange-500 transition-all hover:text-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Resend {resendSeconds > 0 && `(${resendSeconds}s)`}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        © 2026 ParkEase. All rights reserved.
      </p>
    </motion.div>
  );
};

export default OTPPage;