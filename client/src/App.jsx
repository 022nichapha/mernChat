import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  console.log({ onlineUsers });

  // การใช้ useEffect เพื่อตรวจสอบว่ามี token ใน localStorage หรือไม่
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log({ authUser });

  useEffect(() => {
    document.querySelector("html").setAttribute("data-theme", theme);
  }, [theme]);

  // ถ้ากำลังตรวจสอบ auth และ authUser ยังไม่มีค่า ให้แสดง Loader
  if (isCheckingAuth && !authUser)
    return (
      // h-screen คือการทำให้ Loader แสดงเต็มหน้าจอ
      <div className="flex items-center justify-center h-dvh">
        {/* size คือขนาดของ animate-spin คือการทำให้ Loader หมุน */}
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        {/* !authUser? ถ้ายังไม่มี user ให้ไปหน้า signup : ถ้ามี user แล้ว ให้ไปหน้า / ส่วนของ / คือหน้าแรก*/}
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        {/* !authUser? ถ้ายังไม่มี user ให้ไปหน้า login : ถ้ามี user แล้ว ให้ไปหน้า / ส่วนของ / คือหน้าแรก*/}
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* ถ้ามี authUser (Login แล้ว) ให้ไปหน้า ProfilePage : ถ้าไม่มี (ไม่มี token) ให้เด้งกลับไปหน้า Login */}
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
