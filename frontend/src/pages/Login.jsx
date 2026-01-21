import axios from "axios";
import Cookies from "js-cookie";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiLock,
  FiAlertTriangle,
  FiEye,
  FiEyeOff,
  FiLoader,
} from "react-icons/fi";
import Loading from "../components/Loading";
const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isloggedIn, setIsLoggedIn] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const usernameRef = useRef(null);

  const validate = () => {
    const newErrors = {};
    if (!username) {
      newErrors.username = "Username is required";
    }
    if (!password) {
      newErrors.password = "Password is required!";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("backend_url", backend_url);

    if (validate()) {
      setIsLoading(true);
      try {
        const res = await axios.post(`${backend_url}/api/auth/login`, {
          username,
          password,
        });
        if (res.status == 200) {
          // display successfull login and store cookies
          setResponseMessage({
            status: res.status,
            message: "Login Successfull",
          });

          // Set cookie expiration based on remember me
          const cookieOptions = rememberMe
            ? { expires: 30 } // 30 days if remember me is checked
            : {}; // Session cookie if remember me is not checked (deleted when browser closes)

          Cookies.set("token", res.data.token, cookieOptions);
          Cookies.set("username", res.data.username, cookieOptions);
          Cookies.set("name", res.data.name, cookieOptions);

          // hide loading & message and then navigate
          setTimeout(() => {
            setResponseMessage({});
            setIsLoading(false);
            navigate("/");
          }, 2000);
        }
      } catch (error) {
        if (error.status) {
          setResponseMessage({
            status: 400,
            message: "Incorrect username or password!",
          });
        } else {
          setResponseMessage({
            status: 500,
            message: "Network or Server Issue!",
          });
        }

        setIsLoading(false);

        setTimeout(() => {
          setResponseMessage({});
        }, 2000);
      }
    } else if (username.trim() === "" || password.trim() === "") {
      setTimeout(() => {
        setErrors({});
      }, 5000);
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
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  if (isloggedIn === null) return <Loading />;

  return (
    <div className=" min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-gray-10 to-indigo-300 p-4">
      {isLoading && (
        <div className="absolute w-full bg-slate-800/50 top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] z-90">
          <Loading />
        </div>
      )}
      <div className=" relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <FiLock className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
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
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                ref={usernameRef}
                id="username"
                name="username"
                type="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.username ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                placeholder="user_name"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                  placeholder="••••••••"
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
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

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

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 font-medium ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <FiLoader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign up
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
