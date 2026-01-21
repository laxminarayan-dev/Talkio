import axios from "axios";
import Cookies from "js-cookie";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiAlertTriangle, FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import Loading from "../components/Loading";
const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function Signup() {
  const [isloggedIn, setIsLoggedIn] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const nameRef = useRef(null);
  // const [showPassword, setShowPassword] = useState(false);
  // const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const [rememberMe, setRememberMe] = useState(false);
  // const nameRef = useRef(null);

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

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 2 && validateStep2()) {
      setIsSubmitting(true);

      try {
        const res = await axios.post(`${backend_url}/api/auth/register`, {
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
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token); // true if token exists, false otherwise
  }, []);

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
                className={`w-12 h-1 mx-2 ${
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
            {/* Step 1: Username and Password */}
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

            {/* Step 2: Name and Confirm Password */}
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
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
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
