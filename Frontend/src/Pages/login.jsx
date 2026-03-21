import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

// Import OTPPage component - make sure this file exists
import OTPPage from "./loginOTP"; // Adjust path as needed

const Login = () => {
  const [page, setPage] = useState("login"); // "login" | "otp"
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const destination =
    method === "email" ? email : `+91 ${phone}`;

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
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <AnimatePresence mode="wait">
          <OTPPage
            key="otp"
            method={method}
            destination={destination}
            onBack={() => setPage("login")}
          />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary">
              <span className="text-lg font-bold text-primary-foreground">P</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Sign in to ParkAI
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Access your dashboard to manage zones and occupancy.
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-[12px] bg-card p-8"
            style={{
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.02), 0 12px 24px -4px rgba(0,0,0,0.08)",
            }}
          >
            {/* Segmented Control */}
            <div className="relative mb-6 flex rounded-[10px] bg-muted p-1">
              <motion.div
                className="absolute inset-y-1 rounded-[7px] bg-card"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
                  width: "calc(50% - 4px)",
                }}
                animate={{ left: method === "email" ? 4 : "calc(50%)" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
              {["email", "phone"].map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMethod(m); setError(""); }}
                  className={`relative z-10 w-1/2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                    method === m ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {m === "email" ? "Email" : "Phone"}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="h-[68px]">
              <AnimatePresence mode="wait">
                {method === "email" ? (
                  <motion.div key="email" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }}>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@parkai.com" className="h-10 w-full rounded-[8px] border-0 bg-muted px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20" />
                  </motion.div>
                ) : (
                  <motion.div key="phone" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.15 }}>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="flex h-10 items-center rounded-[8px] bg-muted px-3 text-sm text-muted-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">+91</div>
                      <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="98765 43210" className="h-10 w-full rounded-[8px] border-0 bg-muted px-3 text-sm tabular-nums text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-10 w-full rounded-[8px] border-0 bg-muted px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20" />
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <button
              type="button"
              onClick={handleNext}
              className="mt-4 flex h-10 w-full items-center justify-center rounded-[8px] bg-primary text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-200 hover:brightness-90 active:scale-[0.98]"
            >
              Next
            </button>

            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <button type="button" className="transition-colors hover:text-foreground">Forgot password?</button>
              <button type="button" className="transition-colors hover:text-foreground">Sign up →</button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 ParkAI. All rights reserved.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Login;