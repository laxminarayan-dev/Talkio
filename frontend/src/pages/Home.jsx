import { useState } from "react";

const Home = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Chat Area (Placeholder) */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Your messages
          </h2>
          <p className="text-gray-600">
            Select a conversation from the list to start chatting
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
