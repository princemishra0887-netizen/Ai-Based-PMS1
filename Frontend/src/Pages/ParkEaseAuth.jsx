import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 

const ParkEaseAuthChoice = ({ onChoice }) => {
  const [toast, setToast] = useState({ show: false, message: "" });

  const navigate = useNavigate();

  const handleChoice = (choice) => {
    if (choice === "signup") {
      showToast("🎉 Let's create your account!");
      setTimeout(() => {
        navigate("/auth/signup");
      }, 500);
    } else {
      showToast("👋 Welcome back!");
      setTimeout(() => {
        navigate("/auth/login");
      }, 500);
    }
  };

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

    const interactiveElements = document.querySelectorAll("button");
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

      <div className="relative z-10 min-h-screen flex flex-col bg-black text-gray-200">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
              🅿
            </div>
            <span className="font-['Bebas_Neue'] text-2xl tracking-wider">
              ParkEase
            </span>
          </div>
          <button
            className="text-gray-500 text-sm border border-white/10 px-4 py-1.5 rounded-md hover:text-white transition-colors"
            onClick={() => window.location.reload()}
          >
            Help
          </button>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-block p-4 bg-orange-500/10 rounded-2xl mb-6">
                <span className="text-5xl">🅿️</span>
              </div>
              <h1 className="font-['Bebas_Neue'] text-5xl md:text-6xl leading-tight mb-4">
                Welcome to{" "}
                <span className="text-orange-500 italic font-['Instrument_Serif']">
                  ParkEase
                </span>
              </h1>
              <p className="text-gray-400 text-base max-w-md mx-auto">
                India's fastest growing parking platform. Find spots, list your
                property, and earn effortlessly.
              </p>
            </div>

            {/* Two Buttons Section */}
            <div className="space-y-4">
              {/* Sign Up Button */}
              <button
                onClick={() => handleChoice("signup")}
                className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-[2px] hover:shadow-lg transition-all duration-300"
              >
                <div className="relative rounded-2xl bg-black/90 backdrop-blur-sm px-8 py-6 transition-all duration-300 group-hover:bg-black/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                        🚀
                      </div>
                      <div className="text-left">
                        <h2 className="font-['Bebas_Neue'] text-2xl text-white">
                          Create Account
                        </h2>
                        <p className="text-gray-400 text-sm">
                          New here? Join ParkEase today
                        </p>
                      </div>
                    </div>
                    <div className="text-orange-500 text-2xl group-hover:translate-x-2 transition-transform duration-300">
                      →
                    </div>
                  </div>
                </div>
              </button>

              {/* Login Button */}
              <button
                onClick={() => handleChoice("login")}
                className="group w-full relative overflow-hidden rounded-2xl border border-white/10 hover:border-orange-500/50 transition-all duration-300"
              >
                <div className="rounded-2xl bg-gray-900/50 backdrop-blur-sm px-8 py-6 transition-all duration-300 hover:bg-gray-900/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                        👋
                      </div>
                      <div className="text-left">
                        <h2 className="font-['Bebas_Neue'] text-2xl text-white">
                          Sign In
                        </h2>
                        <p className="text-gray-400 text-sm">
                          Already have an account? Welcome back
                        </p>
                      </div>
                    </div>
                    <div className="text-orange-500 text-2xl group-hover:translate-x-2 transition-transform duration-300">
                      →
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 text-center">
              <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span>4.8/5 Rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👥</span>
                  <span>50K+ Users</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🏢</span>
                  <span>1000+ Spots</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>Secure & Safe</span>
                </div>
              </div>
            </div>

            {/* Demo Notice */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-600">
                ⚡ Demo Mode: Both options will proceed to registration flow
              </p>
            </div>
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
      `}</style>
    </>
  );
};

export default ParkEaseAuthChoice;