import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaUserAlt } from "react-icons/fa";

const FindUser = () => {
  const [query, setQuery] = useState(""); // search input
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const fetchResults = async (searchTerm) => {
    if (!searchTerm) return setResults([]);
    setLoading(true);
    try {
      const response = await axios.get(
        `http://192.168.29.98:8000/api/user/find?q=${searchTerm}`
      );
      setResults(response.data.results); // Adjust according to your API response
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // Throttling function using useCallback
  const throttledFetch = useCallback(() => {
    const handler = setTimeout(() => {
      fetchResults(query);
    }, 500); // wait 500ms before making API call

    return () => clearTimeout(handler);
  }, [query]);

  // Trigger throttled API call whenever query changes
  useEffect(() => {
    const cleanup = throttledFetch();
    return cleanup;
  }, [query, throttledFetch]);

  const handleStartChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3">
        <div className="relative max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => navigate(-1)}
            className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="max-w-xl mx-auto px-3 space-y-2 pt-2">
            {results.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    <FaUserAlt size={20} />
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-gray-900">
                        {user.name}
                      </h3>
                      {user.isVerified && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-blue-500 ml-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartChat(user._id)}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full pt-16 px-6 text-center text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No users found
            </h3>
            <p className="text-sm">Try searching for a name or username</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindUser;
