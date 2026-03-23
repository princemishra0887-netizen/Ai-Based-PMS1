import React, { useState, useEffect } from "react";

const SecureRegistration = ({ selectedRole, onComplete, onBack }) => {
  const [step, setStep] = useState(1); // 1-6: registration steps, 7: success
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    aadhaarFile: null,
    photoFile: null,
    phone: "",
    phoneOtp: "",
    email: "",
    emailOtp: "",
  });
  const [toast, setToast] = useState({ show: false, message: "" });
  const [loading, setLoading] = useState(false);

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

  // Confetti effect
  const launchConfetti = () => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "500";
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    const pieces = Array.from({ length: 90 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 4,
      vy: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.2,
      color: [
        "#f97316",
        "#ea580c",
        "#fbbf24",
        "#fb923c",
        "#e8e4dc",
        "#4ade80",
      ][i % 6],
      alpha: 1,
    }));

    let frame = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.vy *= 1.01;
        if (frame > 80) p.alpha = Math.max(0, p.alpha - 0.015);
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frame++;
      if (frame < 140) requestAnimationFrame(draw);
      else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.remove();
      }
    }
    draw();
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: val }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      showToast("File too large (max 5MB)");
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const sendPhoneOtp = () => {
    if (formData.phone.length === 10) {
      showToast(`📱 OTP sent to +91 ${formData.phone} (demo: 123456)`);
      return true;
    } else {
      showToast("Enter valid 10-digit phone number");
      return false;
    }
  };

  const sendEmailOtp = () => {
    if (formData.email.includes("@") && formData.email.includes(".")) {
      showToast(`📧 OTP sent to ${formData.email} (demo: 123456)`);
      return true;
    } else {
      showToast("Enter valid email address");
      return false;
    }
  };

  const handleNext = () => {
    // Step 1: Personal details validation
    if (step === 1) {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.gender ||
        !formData.dob
      ) {
        showToast("Fill all personal details");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: Document validation
    if (step === 2) {
      if (!formData.aadhaarFile) {
        showToast("Upload Aadhaar document");
        return;
      }
      if (!formData.photoFile) {
        showToast("Upload profile photo");
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: Phone validation and OTP send
    if (step === 3) {
      if (formData.phone.length !== 10) {
        showToast("Enter 10-digit phone number");
        return;
      }
      sendPhoneOtp();
      setStep(4);
      return;
    }

    // Step 4: Phone OTP validation
    if (step === 4) {
      if (formData.phoneOtp !== "123456") {
        showToast("Invalid OTP (demo: 123456)");
        return;
      }
      setStep(5);
      return;
    }

    // Step 5: Email validation and OTP send
    if (step === 5) {
      if (!formData.email.includes("@") || !formData.email.includes(".")) {
        showToast("Enter valid email");
        return;
      }
      sendEmailOtp();
      setStep(6);
      return;
    }

    // Step 6: Email OTP validation and final submission
    if (step === 6) {
      if (formData.emailOtp !== "123456") {
        showToast("Invalid OTP (demo: 123456)");
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep(7);
        launchConfetti();
        showToast(
          `🎉 ${selectedRole === "owner" ? "Owner" : "Driver"} registered successfully!`
        );
      }, 1000);
      return;
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  const goToDashboard = () => {
    showToast("🚀 Redirecting to Dashboard... (Demo)");
    if (onComplete) onComplete();
  };

  const goBrowse = () => {
    showToast("🔍 Opening Spot Browser...");
  };

  // Render step pills for registration steps
  const renderStepPills = () => {
    const stepsArr = [
      "Personal",
      "Documents",
      "Phone",
      "Verify Phone",
      "Email",
      "Verify Email",
    ];
    if (step >= 1 && step <= 6) {
      return (
        <div className="flex justify-center items-center gap-2 mb-6 flex-wrap">
          {stepsArr.map((label, idx) => {
            let status = "";
            if (idx + 1 < step) status = "done";
            else if (idx + 1 === step) status = "active";
            return (
              <div key={idx} className="flex flex-col items-center mx-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    status === "done"
                      ? "w-7 bg-orange-500"
                      : status === "active"
                      ? "w-11 bg-orange-500"
                      : "w-7 bg-white/10"
                  }`}
                />
                <span className="text-[10px] text-gray-500 mt-1 hidden md:block">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Success Screen (Step 7)
  if (step === 7) {
    const isOwner = selectedRole === "owner";
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

        <div className="relative z-10 min-h-screen flex flex-col bg-black">
          <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                🅿
              </div>
              <span className="font-['Bebas_Neue'] text-2xl">ParkEase</span>
            </div>
            <div className="step-pills flex gap-2">
              <div className="w-7 h-1.5 rounded-full bg-orange-500"></div>
              <div className="w-7 h-1.5 rounded-full bg-orange-500"></div>
              <div className="w-11 h-1.5 rounded-full bg-orange-500"></div>
            </div>
            <button
              className="text-gray-500 text-sm border border-white/10 px-4 py-1.5 rounded-md hover:text-white"
              onClick={onBack}
            >
              Exit
            </button>
          </nav>

          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-lg">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg animate-pulse">
                ✓
              </div>
              <h1 className="font-['Bebas_Neue'] text-6xl">
                You're <span className="text-orange-500 italic">In!</span>
              </h1>
              <p className="text-gray-400 mt-2 mb-4">
                {isOwner
                  ? "Your owner account is live. List your first parking spot and start earning today."
                  : "Your account is ready. Let's get you to your first parking spot."}
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                <div className="bg-black/30 border border-white/10 rounded-full px-4 py-2 text-sm">
                  <span className="text-orange-500">
                    {isOwner ? "🏠" : "🚗"}
                  </span>{" "}
                  {isOwner ? "Owner Account" : "Driver Account"}
                </div>
                <div className="bg-black/30 border border-white/10 rounded-full px-4 py-2 text-sm">
                  <span className="text-orange-500">✓</span> Email Verified
                </div>
                <div className="bg-black/30 border border-white/10 rounded-full px-4 py-2 text-sm">
                  <span className="text-orange-500">🎁</span>{" "}
                  {isOwner ? "First Listing Free" : "₹50 Welcome Credit"}
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg transition-all"
                  onClick={goToDashboard}
                >
                  Go to My Dashboard →
                </button>
                <button
                  className="border border-white/20 bg-transparent px-6 py-3 rounded-xl text-white hover:border-white/40 transition-all"
                  onClick={goBrowse}
                >
                  Browse Spots First
                </button>
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
      </>
    );
  }

  // Render step content for registration (1-6)
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900/60 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Rahul"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900/60 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Sharma"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900/60 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900/60 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-orange-500 transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, "aadhaarFile")}
                className="hidden"
                id="aadhaarUp"
              />
              <label htmlFor="aadhaarUp" className="cursor-pointer block">
                <span className="text-3xl">📄</span>
                <p className="font-medium text-white mt-1">Upload Aadhaar</p>
                <p className="text-xs text-gray-400">PDF/Image max 5MB</p>
                {formData.aadhaarFile && (
                  <p className="text-green-400 text-sm mt-2">
                    ✓ {formData.aadhaarFile.name}
                  </p>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-orange-500 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "photoFile")}
                  className="hidden"
                  id="photoUp"
                />
                <label htmlFor="photoUp" className="cursor-pointer block">
                  <span className="text-3xl">📸</span>
                  <p className="text-white">Profile Photo</p>
                  <p className="text-xs text-gray-400">Max 5MB</p>
                  {formData.photoFile && (
                    <span className="text-green-400 text-sm block mt-1">
                      ✓ {formData.photoFile.name}
                    </span>
                  )}
                </label>
              </div>
              <div className="bg-gray-800/50 rounded-xl flex items-center justify-center p-4 border border-gray-700">
                {formData.photoFile ? (
                  <img
                    src={URL.createObjectURL(formData.photoFile)}
                    alt="preview"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-3xl mb-1">🙂</div>
                    <p className="text-xs">Preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <label className="text-gray-400 text-sm block mb-1">
              Phone Number
            </label>
            <div className="flex mt-1">
              <span className="bg-gray-800 border border-r-0 border-gray-700 rounded-l-xl px-4 py-3 flex items-center text-white">
                +91
              </span>
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="flex-1 bg-gray-900/60 border border-gray-700 rounded-r-xl p-3 text-white focus:border-orange-500 focus:outline-none"
                placeholder="98765 43210"
                maxLength="10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">10-digit mobile number</p>
          </div>
        );

      case 4:
        return (
          <div>
            <label className="text-gray-400 text-sm block mb-3">
              Enter 6-digit OTP sent to {formData.phone}
            </label>
            <div className="flex gap-2 justify-center my-4">
              {[...Array(6)].map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength="1"
                  className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl text-center text-xl text-white focus:border-orange-500 focus:outline-none"
                  value={formData.phoneOtp[i] || ""}
                  onChange={(e) => {
                    const val = formData.phoneOtp.split("");
                    val[i] = e.target.value.replace(/\D/g, "");
                    setFormData((prev) => ({
                      ...prev,
                      phoneOtp: val.join("").slice(0, 6),
                    }));
                    if (e.target.value && i < 5) {
                      document.getElementById(`p-otp-${i + 1}`)?.focus();
                    }
                  }}
                  id={`p-otp-${i}`}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-400">
              Demo OTP: <span className="text-orange-400">123456</span>{" "}
              <button
                className="text-orange-500 ml-2 hover:underline"
                onClick={sendPhoneOtp}
              >
                Resend
              </button>
            </p>
          </div>
        );

      case 5:
        return (
          <div>
            <label className="text-gray-400 text-sm block mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-gray-900/60 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500 focus:outline-none transition-colors mt-1"
              placeholder="rahul@example.com"
            />
          </div>
        );

      case 6:
        return (
          <div>
            <label className="text-gray-400 text-sm block mb-3">
              Enter 6-digit OTP sent to {formData.email}
            </label>
            <div className="flex gap-2 justify-center my-4">
              {[...Array(6)].map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength="1"
                  className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl text-center text-xl text-white focus:border-orange-500 focus:outline-none"
                  value={formData.emailOtp[i] || ""}
                  onChange={(e) => {
                    const val = formData.emailOtp.split("");
                    val[i] = e.target.value.replace(/\D/g, "");
                    setFormData((prev) => ({
                      ...prev,
                      emailOtp: val.join("").slice(0, 6),
                    }));
                    if (e.target.value && i < 5) {
                      document.getElementById(`e-otp-${i + 1}`)?.focus();
                    }
                  }}
                  id={`e-otp-${i}`}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-400">
              Demo OTP: <span className="text-orange-400">123456</span>{" "}
              <button
                className="text-orange-500 ml-2 hover:underline"
                onClick={sendEmailOtp}
              >
                Resend
              </button>
            </p>
          </div>
        );

      default:
        return null;
    }
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

      <div className="relative z-10 min-h-screen flex flex-col bg-black">
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
            {step >= 1 && step <= 6 && (
              <div className="flex gap-1">
                <span className="text-xs text-gray-400">
                  {selectedRole === "owner" ? "🏠 Owner" : "🚗 Driver"}
                </span>
              </div>
            )}
          </div>
          <button
            className="text-gray-500 text-sm border border-white/10 px-4 py-1.5 rounded-md hover:text-white transition-colors"
            onClick={handleBack}
          >
            ← Back
          </button>
        </nav>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-gray-900/30 backdrop-blur-sm rounded-3xl border border-white/10 p-6 md:p-8">
            <div className="mb-2">
              <span className="text-orange-500 text-xs tracking-wider">
                SECURE REGISTRATION
              </span>
            </div>
            <h2 className="font-['Bebas_Neue'] text-3xl md:text-5xl leading-tight">
              Identity{" "}
              <span className="text-orange-500 italic font-['Instrument_Serif']">
                Verification
              </span>
            </h2>

            {renderStepPills()}

            <div className="mt-4">{renderStepContent()}</div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : step === 6 ? (
                  "Complete Registration →"
                ) : (
                  "Continue →"
                )}
              </button>
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
    </>
  );
};

export default SecureRegistration;