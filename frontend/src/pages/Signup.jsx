import axios from "axios";
import Cookies from "js-cookie";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiAlertTriangle, FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import Loading from "../components/Loading";
const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function Signup() {
  const navigate = useNavigate();
  const [isloggedIn, setIsLoggedIn] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    confirmPassword: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const nameRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 6) {
      newErrors.username = "Username must be at least 6 characters";
    } else if (formData.username.length > 20) {
      newErrors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 6) {
      newErrors.name = "Name must be at least 6 characters";
    } else if (formData.name.trim().length > 20) {
      newErrors.name = "Name must be less than 20 characters";
    } else if (!/^[a-zA-Z ]+$/.test(formData.name.trim())) {
      newErrors.name = "Name can only contain letters and spaces";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (formData.password.length > 16) {
      newErrors.password = "Password must be less than 16 characters";
    } else if (!/(?=.*[a-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter, and one number";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const validateStep1 = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 6) {
      newErrors.username = "Username must be at least 6 characters";
    } else if (formData.username.length > 20) {
      newErrors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 6) {
      newErrors.name = "Name must be at least 6 characters";
    } else if (formData.name.trim().length > 20) {
      newErrors.name = "Name must be less than 20 characters";
    } else if (!/^[a-zA-Z ]+$/.test(formData.name.trim())) {
      newErrors.name = "Name can only contain letters and spaces";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (formData.password.length > 16) {
      newErrors.password = "Password must be less than 16 characters";
    } else if (!/(?=.*[a-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter, and one number";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    // OTP validation
    if (!formData.otp.trim()) {
      newErrors.otp = "OTP is required";
    } else if (!/^\d{6}$/.test(formData.otp)) {
      newErrors.otp = "OTP must be exactly 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOtp = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: "Email is required to send OTP" });
      return false;
    }

    setIsSendingOtp(true);
    try {
      const res = await axios.post(`${backend_url}/api/auth/send-otp`, {
        email: formData.email,
        username: formData.username,
      });
      if (res.status === 200) {
        setOtpSent(true);
        setOtpCountdown(60); // 60 seconds countdown
        setResponseMessage({
          status: 200,
          message: "OTP sent to your email successfully!",
        });
        return true;
      }
    } catch (error) {
      const status = error.response?.status;
      let errorMessage = "Failed to send OTP. Please try again.";

      if (status === 409) {
        // Username or email already exists
        errorMessage =
          error.response?.data?.message ||
          "Username or email already registered.";
      } else if (status === 400) {
        errorMessage = error.response?.data?.message || "Invalid request.";
      } else {
        errorMessage =
          error.response?.data?.message ||
          "Failed to send OTP. Please try again.";
      }

      setResponseMessage({
        status: status || 500,
        message: errorMessage,
      });
      return false;
    } finally {
      setIsSendingOtp(false);
      setTimeout(() => setResponseMessage({}), 3000);
    }
    return false;
  };

  // OTP countdown timer effect
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleNext = async () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      // Send OTP before moving to step 3
      const otpSentSuccessfully = await sendOtp();
      // Only move to step 3 if OTP was sent successfully
      if (otpSentSuccessfully) {
        setCurrentStep(3);
      }
    } else if (
      currentStep === 1 &&
      (formData.username.trim() === "" || formData.email.trim() === "")
    ) {
      setTimeout(() => {
        setErrors({});
      }, 5000);
    } else if (
      currentStep === 2 &&
      (formData.name.trim() === "" ||
        formData.password.trim() === "" ||
        formData.confirmPassword.trim() === "")
    ) {
      setTimeout(() => {
        setErrors({});
      }, 5000);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 3 && validateStep3()) {
      setIsSubmitting(true);

      try {
        const res = await axios.post(`${backend_url}/api/auth/verify-otp`, {
          email: formData.email,
          otp: formData.otp,
          username: formData.username,
          name: formData.name,
          password: formData.password,
        });
        if (res.status == 200) {
          // Set cookie expiration based on remember me
          const cookieOptions = rememberMe
            ? { expires: 30 } // 30 days if remember me is checked
            : {}; // Session cookie if remember me is not checked (deleted when browser closes)

          Cookies.set("token", res.data.token, cookieOptions);
          Cookies.set("username", res.data.username, cookieOptions);
          Cookies.set("name", res.data.name, cookieOptions);
          setResponseMessage({
            status: 200,
            message: "Account created successfully! Redirecting...",
          });
          setTimeout(() => {
            setResponseMessage({});
            navigate("/");
          }, 3000);
        }
      } catch (error) {
        if (error.response) {
          setResponseMessage({
            status: error.response.status || 500,
            message:
              error.response.data.message ||
              "An error occurred. Please try again later after few minutes!",
          });
        } else if (error.request) {
          setResponseMessage({
            status: 505,
            message: "Server is not responding!",
          });
        } else {
          setResponseMessage({
            status: 500,
            message:
              "An error occurred. Please try again later after few minutes!",
          });
        }
      } finally {
        setIsSubmitting(false);
        setTimeout(() => {
          setResponseMessage({});
        }, 3000);
      }
    } else if (currentStep === 3 && formData.otp.trim() === "") {
      setTimeout(() => {
        setErrors({});
      }, 5000);
    }
  };

  // ✅ check login status on mount
  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token); // true if token exists, false otherwise
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (isloggedIn) {
      navigate("/", { replace: true }); // ✅ safe redirect after render
    }
  }, [isloggedIn, navigate]);

  // Auto-focus username field on component mount
  useEffect(() => {
    if (nameRef.current) {
      nameRef.current.focus();
    }
  }, []);

  if (isloggedIn === null) return <Loading />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-10 to-indigo-300 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <FiUser className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">Join our community</p>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <div
                className={`w-8 h-1 mx-2 ${
                  currentStep >= 2 ? "bg-indigo-600" : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
              <div
                className={`w-8 h-1 mx-2 ${
                  currentStep >= 3 ? "bg-indigo-600" : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 3
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                3
              </div>
            </div>
          </div>

          {responseMessage.status && responseMessage.status !== 200 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <FiAlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">
                  {responseMessage.message}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Username and Email */}
            {currentStep === 1 && (
              <>
                {/* Username Field */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Username
                  </label>
                  <input
                    ref={nameRef}
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                    placeholder="Choose a username"
                  />
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                >
                  Next
                </button>
              </>
            )}

            {/* Step 2: Name, Password and Confirm Password */}
            {currentStep === 2 && (
              <>
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5" />
                      ) : (
                        <FiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5" />
                      ) : (
                        <FiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>

                {/* Navigation Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSendingOtp}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSendingOtp ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              </>
            )}

            {/* Step 3: OTP Verification */}
            {currentStep === 3 && (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Verify Your Email
                  </h3>
                  <p className="text-sm text-gray-600">
                    We've sent a 6-digit OTP to{" "}
                    <span className="font-medium text-indigo-600">
                      {formData.email}
                    </span>
                  </p>
                </div>

                {/* OTP Field */}
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    value={formData.otp}
                    onChange={handleChange}
                    maxLength="6"
                    className={`w-full px-4 py-3 rounded-lg border text-center text-2xl font-mono tracking-widest ${
                      errors.otp ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                    placeholder="000000"
                  />
                  {errors.otp && (
                    <p className="mt-2 text-sm text-red-600">{errors.otp}</p>
                  )}
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={otpCountdown > 0 || isSendingOtp}
                    className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSendingOtp
                      ? "Sending..."
                      : otpCountdown > 0
                        ? `Resend OTP in ${otpCountdown}s`
                        : "Didn't receive OTP? Resend"}
                  </button>
                </div>

                {/* Navigation Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSubmitting ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-xs text-gray-500">
            © 2025 UsChat. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
