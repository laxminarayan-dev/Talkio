import { Link, Outlet, useParams } from "react-router-dom";
import { useEffect, useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ConnectionLoading from "./components/ConnectionLoading";
import Cookies from "js-cookie";
import { RiUserSearchLine } from "react-icons/ri";
import { GoGear } from "react-icons/go";
import { FiLogOut } from "react-icons/fi";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import socket from "./store/socket";
import { ChatProvider } from "./store/ChatContext";

// loading time function from utils
import { getTime, getDate } from "./utils/time";
// laoding sorted conversation and from hook
import { useConversations } from "./hooks/useConversations";
// creating socket connection
import { useSocket } from "./hooks/useSocket";

const Root = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isloggedIn, setIsLoggedIn] = useState(null);
  const [chatOpen, setChatOpen] = useState(null);
  const { sortedConversations } = useConversations();
  const { connection } = useSocket();
  const navigate = useNavigate();
  const param = useParams();

  // check LoggedIn
  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);
  }, [isloggedIn]);

  // sidebar handling
  useEffect(() => {
    setChatOpen(null);

    if (param.userId) {
      setChatOpen(true);
    } else {
      setChatOpen(false);
    }
  }, [param]);

  // if not login redirect to "/login"
  useEffect(() => {
    if (isloggedIn === false) {
      navigate("/login", { replace: true }); // ✅ safe redirect after render
    }
  }, [isloggedIn, navigate]);

  // filtered conversation
  const visibleConversations = useMemo(() => {
    return sortedConversations.filter((conv) =>
      (conv.otherName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, sortedConversations]);

  if (!connection) return <ConnectionLoading />;
  return (
    <div className="flex h-[100dvh]">
      {/* Sidebar - Only visible on medium+ screens by default */}
      <div
        className={`${
          chatOpen ? "hidden" : "flex"
        } w-full md:flex md:w-96 flex-col bg-white border-r border-gray-200 min-h-0`}
      >
        {/* Header */}
        <div className="sticky top-0 p-4 bg-white z-100 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-indigo-600">
                {/* {Cookies.get("name") || "Name"} */}
                <Link to={"/"}>Talkio</Link>
              </h1>
            </div>
            <button
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => {
                setIsMenuOpen((prev) => !prev);
              }}
            >
              {isMenuOpen ? <IoClose size={20} /> : <HiOutlineDotsVertical />}
            </button>
          </div>
          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-5 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              {/* new user */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => navigate("/find-user")}
              >
                <RiUserSearchLine />
                Find User
              </button>
              {/* setting */}
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <GoGear />
                Settings
              </button>
              {/* logout */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  Cookies.remove("token");
                  Cookies.remove("name");
                  Cookies.remove("username");
                  navigate("/login");
                }}
              >
                <FiLogOut />
                Log out
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
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
              placeholder="Search chat"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable Conversations List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {visibleConversations.length <= 0 ? (
            <div className="flex items-center justify-center h-full p-6 text-center text-gray-500">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <p className="text-lg font-medium text-gray-700">
                  {searchQuery
                    ? "No conversations found"
                    : "Start a new conversation"}
                </p>
                <p className="mt-1 text-sm">
                  {searchQuery
                    ? `Try a different search term`
                    : "Search for someone or start a new chat"}
                </p>
              </div>
            </div>
          ) : (
            visibleConversations.map((conv) => (
              <div
                key={conv.withUser}
                onClick={() => {
                  navigate(`/chat/${conv.withUser}`);
                }}
                className="flex items-center p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${"bg-indigo-400"}`}
                  >
                    {conv.avatar || "U"}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 ${
                      conv.isOnline ? "bg-green-400" : "bg-red-400"
                    }  border-2 border-white rounded-full`}
                  ></div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-gray-900 truncate">
                      {conv.otherName}
                    </h2>
                    <div className="flex flex-col items-end gap-2 justify-center">
                      <span className="text-xs text-gray-500">
                        {getDate(conv.lastMessageAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    {(() => {
                      const currentUserId = Cookies.get("token");
                      let unseenCount = 0;

                      for (let i = conv.messages.length - 1; i >= 0; i--) {
                        const msg = conv.messages[i];
                        if (msg.sender === currentUserId) break;
                        if (!msg.isSeen) unseenCount++;
                      }

                      return unseenCount > 0 ? (
                        <span className=" text-green-500 rounded-full h-5 w-fit flex items-center justify-center text-xs font-semibold">
                          {unseenCount > 4
                            ? "4+ new message"
                            : `${unseenCount} new message`}
                        </span>
                      ) : (
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage.content}
                        </p>
                      );
                    })()}
                    <span className="text-xs text-gray-500">
                      {getTime(conv.lastMessageAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area (Outlet) */}
      <div className="flex-1 min-h-[100vh] md:min-h-0">
        <Outlet />
      </div>
    </div>
  );
};

export default () => (
  <ChatProvider>
    <Root />
  </ChatProvider>
);
