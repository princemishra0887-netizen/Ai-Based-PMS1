import React, { useState, useEffect } from "react";

const WhoAmI = ({ onRoleSelect, onNavigateToSignIn }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });

  // Custom cursor effect
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

    const interactiveElements = document.querySelectorAll(
      "button, a, .role-card, input, .checkbox-custom"
    );
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

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const handleContinue = () => {
    if (!selectedRole) {
      showToast("Please select a role");
      return;
    }
    onRoleSelect(selectedRole);
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

      <div className="relative z-10 min-h-screen flex flex-col bg-black text-gray-200">
        <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
              🅿
            </div>
            <span className="font-['Bebas_Neue'] text-2xl tracking-wider">
              ParkEase
            </span>
          </div>
          <div className="flex gap-2">
            <div className="w-7 h-1.5 rounded-full bg-orange-500"></div>
            <div className="w-7 h-1.5 rounded-full bg-white/10"></div>
            <div className="w-7 h-1.5 rounded-full bg-white/10"></div>
          </div>
          <button className="text-gray-500 text-sm border border-white/10 px-4 py-1.5 rounded-md hover:text-white transition-colors">
            Back
          </button>
        </nav>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <p className="text-orange-500 text-xs tracking-wider mb-2">
              STEP 1 OF 3 — CHOOSE YOUR ROLE
            </p>
            <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl leading-none">
              How Will You{" "}
              <span className="text-orange-500 italic font-['Instrument_Serif']">
                Use
              </span>
              <br />
              ParkEase?
            </h1>
            <p className="text-gray-500 mt-2 mb-6">
              Tell us who you are so we can personalise your experience
              perfectly.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* Driver Card */}
              <div
                className={`p-6 rounded-2xl cursor-pointer transition-all relative border-2 ${
                  selectedRole === "driver"
                    ? "border-orange-500 bg-orange-500/5"
                    : "border-white/10 bg-gray-900/50 hover:border-orange-500/30"
                }`}
                onClick={() => setSelectedRole("driver")}
              >
                <div
                  className={`absolute top-3 right-3 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold transition-opacity ${
                    selectedRole === "driver" ? "opacity-100" : "opacity-0"
                  }`}
                >
                  ✓
                </div>
                <span className="text-4xl mb-3 block">🚗</span>
                <div className="font-['Bebas_Neue'] text-2xl">
                  I'm a Driver
                </div>
                <p className="text-gray-500 text-sm">
                  Find and book parking near my destination quickly.
                </p>
                <div className="mt-3 inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-1 text-xs text-orange-500">
                  🔍 Browse & Book
                </div>
              </div>

              {/* Owner Card */}
              <div
                className={`p-6 rounded-2xl cursor-pointer transition-all relative border-2 ${
                  selectedRole === "owner"
                    ? "border-orange-500 bg-orange-500/5"
                    : "border-white/10 bg-gray-900/50 hover:border-orange-500/30"
                }`}
                onClick={() => setSelectedRole("owner")}
              >
                <div
                  className={`absolute top-3 right-3 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold transition-opacity ${
                    selectedRole === "owner" ? "opacity-100" : "opacity-0"
                  }`}
                >
                  ✓
                </div>
                <span className="text-4xl mb-3 block">🏠</span>
                <div className="font-['Bebas_Neue'] text-2xl">
                  I'm a Land Owner
                </div>
                <p className="text-gray-500 text-sm">
                  Earn money by listing unused land or driveway.
                </p>
                <div className="mt-3 inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-1 text-xs text-orange-500">
                  💰 List & Earn
                </div>
              </div>
            </div>

            <button
              className="w-full md:w-auto px-8 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedRole}
              onClick={handleContinue}
            >
              Continue →
            </button>

            <p className="text-gray-500 text-sm mt-4">
              Already have an account?{" "}
              <a
                href="#"
                className="text-orange-500 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToSignIn();
                }}
              >
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-gray-900 border-l-4 border-orange-500 rounded-xl shadow-2xl p-4 flex items-center gap-3 z-50 animate-slide-up">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-white">ParkEase</p>
            <p className="text-sm text-gray-300">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default WhoAmI;