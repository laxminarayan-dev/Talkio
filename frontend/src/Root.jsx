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
import {
  ChatProvider,
  ChatContext,
  DEFAULT_CHAT_BACKGROUND,
} from "./store/ChatContext";

// loading time function from utils
import { getTime, getDate } from "./utils/time";
// laoding sorted conversation and from hook
import { useConversations } from "./hooks/useConversations";
// creating socket connection
import { useSocket } from "./hooks/useSocket";

const Root = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backgroundInput, setBackgroundInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isloggedIn, setIsLoggedIn] = useState(null);
  const [chatOpen, setChatOpen] = useState(null);
  const { sortedConversations } = useConversations();
  const { connection } = useSocket();
  const {
    getChatBackground,
    setChatBackgroundForConversation,
    resetChatBackgroundForConversation,
  } = useContext(ChatContext);
  const navigate = useNavigate();
  const param = useParams();
  const activeConversationId = param.userId || "";

  const presetBackgrounds = [
    DEFAULT_CHAT_BACKGROUND,
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80",
  ];
  const maxUploadSizeInBytes = 3 * 1024 * 1024;

  const applyBackgroundForActiveConversation = (nextUrl) => {
    if (!activeConversationId) return;

    const normalized = (nextUrl || "").trim() || DEFAULT_CHAT_BACKGROUND;
    setChatBackgroundForConversation(activeConversationId, normalized);
    socket.emit("chat-background-update", {
      to: String(activeConversationId),
      backgroundUrl: normalized,
    });
  };

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });

  const handleBackgroundFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > maxUploadSizeInBytes) {
      setUploadError("Image is too large. Please use an image under 3MB.");
      e.target.value = "";
      return;
    }

    try {
      setIsUploadingBackground(true);
      const imageDataUrl = await readFileAsDataURL(file);
      applyBackgroundForActiveConversation(imageDataUrl);
      setBackgroundInput(imageDataUrl);
    } catch (error) {
      setUploadError("Could not upload image. Try another file.");
    } finally {
      setIsUploadingBackground(false);
      e.target.value = "";
    }
  };

  // check LoggedIn
  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);
  }, [isloggedIn]);

  useEffect(() => {
    if (isSettingsOpen) {
      setBackgroundInput(getChatBackground(activeConversationId));
      setUploadError("");
    }
  }, [isSettingsOpen, activeConversationId, getChatBackground]);

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
      (conv.otherName || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, sortedConversations]);

  if (!connection) return <ConnectionLoading />;
  return (
    <div className="flex h-[100dvh] bg-slate-950 text-slate-100">
      {/* Sidebar - Only visible on medium+ screens by default */}
      <div
        className={`${
          chatOpen ? "hidden" : "flex"
        } w-full md:flex md:w-96 flex-col bg-slate-900 border-r border-slate-800 min-h-0`}
      >
        {/* Header */}
        <div className="sticky top-0 p-4 bg-slate-900 z-100 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-indigo-600">
                {/* {Cookies.get("name") || "Name"} */}
                <Link to={"/"}>Talkio</Link>
              </h1>
            </div>
            <button
              className="p-2 rounded-full text-slate-300 hover:bg-slate-800"
              onClick={() => {
                setIsMenuOpen((prev) => !prev);
              }}
            >
              {isMenuOpen ? <IoClose size={20} /> : <HiOutlineDotsVertical />}
            </button>
          </div>
          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-5 w-48 bg-slate-900 rounded-lg shadow-lg border border-slate-700 py-1 z-20">
              {/* new user */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                onClick={() => navigate("/find-user")}
              >
                <RiUserSearchLine />
                Find User
              </button>
              {/* setting */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                onClick={() => {
                  setIsSettingsOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <GoGear />
                Settings
              </button>
              {/* logout */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
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
                className="h-5 w-5 text-slate-500"
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
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable Conversations List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {visibleConversations.length <= 0 ? (
            <div className="flex items-center justify-center h-full p-6 text-center text-slate-400">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-slate-500 mb-3"
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
                <p className="text-lg font-medium text-slate-200">
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
                className="flex items-center p-4 hover:bg-slate-800/80 border-b border-slate-800 cursor-pointer"
              >
                {console.log("Conversation:", { ...conv })}
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${"bg-indigo-400"}`}
                  >
                    {conv.avatar || "U"}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 ${
                      conv.isOnline ? "bg-green-400" : "bg-red-400"
                    }  border-2 border-slate-900 rounded-full`}
                  ></div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-slate-100 truncate">
                      {conv.otherName}
                    </h2>
                    <div className="flex flex-col items-end gap-2 justify-center">
                      <span className="text-xs text-slate-500">
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

                      if (conv.isTyping) {
                        return (
                          <p className="text-sm text-emerald-400 truncate">typing...</p>
                        );
                      }

                      return unseenCount > 0 ? (
                        <span className=" text-green-500 rounded-full h-5 w-fit flex items-center justify-center text-xs font-semibold">
                          {unseenCount > 4
                            ? "4+ new message"
                            : `${unseenCount} new message`}
                        </span>
                      ) : (
                        <p className="text-sm text-slate-400 truncate">
                          {conv.lastMessage.content}
                        </p>
                      );
                    })()}
                    <span className="text-xs text-slate-500">
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

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-100">
                Chat Background Settings
              </h2>
              <button
                className="p-2 rounded-full text-slate-300 hover:bg-slate-800"
                onClick={() => setIsSettingsOpen(false)}
              >
                <IoClose size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-3">
              Paste an image URL or pick a preset. Changes are saved automatically.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={backgroundInput}
                onChange={(e) => setBackgroundInput(e.target.value)}
                placeholder="https://example.com/chat-wallpaper.jpg"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!activeConversationId}
              />
              <button
                onClick={() => applyBackgroundForActiveConversation(backgroundInput)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                disabled={!activeConversationId}
              >
                Save
              </button>
              <button
                onClick={() => {
                  if (!activeConversationId) return;
                  resetChatBackgroundForConversation(activeConversationId);
                  socket.emit("chat-background-update", {
                    to: String(activeConversationId),
                    backgroundUrl: DEFAULT_CHAT_BACKGROUND,
                  });
                  setBackgroundInput(DEFAULT_CHAT_BACKGROUND);
                }}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium"
                disabled={!activeConversationId}
              >
                Reset
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3 truncate">
              Current: {getChatBackground(activeConversationId)}
            </p>

            {!activeConversationId && (
              <p className="text-xs text-amber-400 mb-3">
                Open a conversation first to set a shared background for that chat.
              </p>
            )}

            <div className="mb-4 rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-200">Upload from your device</p>
                  <p className="text-xs text-slate-500">Accepted: image files up to 3MB</p>
                </div>
                <label className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium cursor-pointer">
                  {isUploadingBackground ? "Uploading..." : "Choose Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBackgroundFileChange}
                    disabled={isUploadingBackground || !activeConversationId}
                  />
                </label>
              </div>
              {uploadError && <p className="mt-2 text-xs text-red-400">{uploadError}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetBackgrounds.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    applyBackgroundForActiveConversation(preset);
                    setBackgroundInput(preset);
                  }}
                  className={`relative rounded-xl overflow-hidden border-2 ${
                    getChatBackground(activeConversationId) === preset
                      ? "border-indigo-500"
                      : "border-slate-700"
                  } ${!activeConversationId ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div
                    className="h-20 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${preset}')` }}
                  ></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default () => (
  <ChatProvider>
    <Root />
  </ChatProvider>
);
