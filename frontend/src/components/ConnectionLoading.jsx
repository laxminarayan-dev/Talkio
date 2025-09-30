// ConnectionLoading.jsx
import React from "react";

const ConnectionLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-400 flex flex-col items-center justify-center p-4">
      <div className="bg-transparent rounded-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {/* GIF */}
          <div className="flex justify-center">
            <img
              src="/networking.gif"
              alt="Connecting animation"
              className="w-40 object-contain"
            />
          </div>

          {/* Animated connecting dots */}
          <div className="flex justify-center space-x-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Connecting to Server
        </h2>
        <p className="text-gray-600">
          Please wait while we establish a secure connection...
        </p>
        <p className="mt-4 text-gray-600 text-sm">
          Establishing secure connection • Do not refresh
        </p>
        {/* Progress bar */}
      </div>

      {/* Optional footer */}
      <p className="fixed bottom-10 mt-8 text-gray-900 text-sm font-semibold">
        {/* Establishing secure connection • Do not refresh */}
        Developed by • Lucky Jaiswal
      </p>
    </div>
  );
};

export default ConnectionLoading;
