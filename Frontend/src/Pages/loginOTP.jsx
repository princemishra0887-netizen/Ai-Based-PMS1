import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";

// ── OTP Page ──────────────────────────────────────────────────────────────────
 const OTPPage = ({ method, destination, onBack }) => {
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
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setError("Incorrect code. Please try again.");
    setOtp(Array(6).fill(""));
    inputRefs.current[0]?.focus();
  };

  const handleResend = () => {
    setResendSeconds(30);
    setError("");
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
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary">
          <span className="text-lg font-bold text-primary-foreground">P</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Verify your identity
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          One last step — verify it's really you.
        </p>
      </div>

      <div
        className="rounded-[12px] bg-card p-8"
        style={{
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.02), 0 12px 24px -4px rgba(0,0,0,0.08)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <p className="mb-5 text-center text-sm text-muted-foreground">
          Code sent to{" "}
          <span className="font-medium text-foreground">{destination}</span>
        </p>

        {/* OTP Inputs */}
        <div className="mb-4 flex justify-center gap-2.5">
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
              className={`h-14 w-12 rounded-[10px] border-0 text-center font-mono text-xl font-medium outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 focus:ring-2 focus:ring-primary/20 focus:scale-105 ${
                digit
                  ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                  : "bg-muted text-foreground"
              }`}
            />
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={!allFilled || loading}
          className="flex h-10 w-full items-center justify-center rounded-[8px] bg-primary text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-200 hover:brightness-90 active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span>Didn't receive it?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSeconds > 0}
            className="font-semibold text-foreground transition-opacity disabled:opacity-40"
          >
            Resend {resendSeconds > 0 && `(${resendSeconds}s)`}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        © 2026 ParkAI. All rights reserved.
      </p>
    </motion.div>
  );
};

export default OTPPage