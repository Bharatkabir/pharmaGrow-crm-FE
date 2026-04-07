import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, reset } from "../features/auth/authSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isSuccess, isError, message } = useSelector((state) => state.auth);

  // Redirect after login success & show toast
  useEffect(() => {
    if (isSuccess && user) {
      toast.success("Login successful!");
      navigate("/dashboard");
      dispatch(reset());
    }
  }, [isSuccess, user, navigate, dispatch]);

  // Show toast on error
  useEffect(() => {
  if (isError && message) {
    // If message is an object with a "message" key, show that value
    const msg = typeof message === "object" && message.message ? message.message : message;
    toast.error(msg);
    dispatch(reset());
  }
}, [isError, message, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-green-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        {/* Logo + Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 flex items-center justify-center bg-blue-600 rounded-full">
              <span className="text-white text-2xl">🛡️</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">PharmaGrow CRM</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pharmaceutical Customer Relationship Management
          </p>
        </div>

        {/* Welcome Back */}
        <h2 className="text-lg font-semibold text-gray-700 text-center">Welcome Back</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Sign in to your PharmaGrow CRM account
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
