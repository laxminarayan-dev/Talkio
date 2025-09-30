import Cookies from "js-cookie";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Root from "./Root";
import Loading from "./components/Loading";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import ChatSection from "./pages/ChatSection";
import ErrorPage from "./components/ErrorPage";
import FindUser from "./pages/FindUser";

const App = () => {
  const [isloggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  if (isloggedIn === null) {
    return <Loading />;
  }
  return (
    <Routes>
      <Route path="/" element={<Root />}>
        <Route index element={<Home />} />
        <Route path="chat/:userId" element={<ChatSection />} />
      </Route>
      <Route path="find-user" element={<FindUser />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
};
export default App;
