import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WhoAmI = ({ onSelectRole }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [hoveredRole, setHoveredRole] = useState(null);

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

    const interactiveElements = document.querySelectorAll("button, a");
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

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setTimeout(() => {
      if (onSelectRole) {
        onSelectRole(role);
      }
    }, 300);
  };

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
            key="whoami"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[500px]"
          >
            {/* Logo */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
                <span className="text-xl font-bold text-white">🅿</span>
              </div>
              <h1 className="font-['Bebas_Neue'] text-4xl tracking-tight text-white">
                Who Am I?
              </h1>
              <p className="mt-1.5 text-sm text-gray-400">
                Please select your role to continue
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 p-8">
              <div className="space-y-4">
                {/* User Card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect("user")}
                  onMouseEnter={() => setHoveredRole("user")}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`w-full p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedRole === "user"
                      ? "border-orange-500 bg-gradient-to-r from-orange-500/20 to-orange-600/20"
                      : "border-white/10 bg-gray-800/30 hover:border-orange-500/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all ${
                        hoveredRole === "user" || selectedRole === "user"
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg"
                          : "bg-gray-800/50 border border-white/10"
                      }`}>
                        🚗
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-1">
                        I'm a User
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        Find and book parking spots near your destination
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
                          🔍 Browse & Book
                        </span>
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
                          💳 Quick Payments
                        </span>
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
                          ⭐ Rate Spots
                        </span>
                      </div>
                    </div>
                    {selectedRole === "user" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.button>

                {/* Land Owner Card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect("owner")}
                  onMouseEnter={() => setHoveredRole("owner")}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`w-full p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedRole === "owner"
                      ? "border-orange-500 bg-gradient-to-r from-orange-500/20 to-orange-600/20"
                      : "border-white/10 bg-gray-800/30 hover:border-orange-500/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all ${
                        hoveredRole === "owner" || selectedRole === "owner"
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg"
                          : "bg-gray-800/50 border border-white/10"
                      }`}>
                        🏠
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-1">
                        I'm a Land Owner
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        List your unused parking spaces and earn passive income
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
                          💰 List & Earn
                        </span>
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
                          📊 Track Earnings
                        </span>
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
                          🔒 Secure Bookings
                        </span>
                      </div>
                    </div>
                    {selectedRole === "owner" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              </div>

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: selectedRole ? 1 : 0.5, y: 0 }}
                onClick={() => selectedRole && handleRoleSelect(selectedRole)}
                disabled={!selectedRole}
                className={`mt-8 w-full h-12 rounded-xl text-sm font-semibold text-white shadow-lg transition-all ${
                  selectedRole
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-orange-500/25 hover:scale-[1.02] cursor-pointer"
                    : "bg-gray-700 cursor-not-allowed"
                }`}
              >
                Continue as {selectedRole === "user" ? "User" : selectedRole === "owner" ? "Land Owner" : "..."} →
              </motion.button>

              {/* Help Text */}
              <p className="mt-4 text-center text-xs text-gray-500">
                Need help deciding?{" "}
                <button
                  type="button"
                  className="text-orange-500 hover:underline"
                  onClick={() => {
                    alert("Users find and book parking spots. Land Owners list their parking spaces to earn money. Both roles can access the platform with different features.");
                  }}
                >
                  Learn more
                </button>
              </p>
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

export default WhoAmI;