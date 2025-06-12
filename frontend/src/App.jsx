import { Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import MainLayout from "./layouts/MainLayout";
import AuthPage from "./pages/AuthPage";
import useAuthStore from "./store/authStore";
import { useEffect } from "react";
import Modal from "./components/Modal";

function App() {
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    checkAuthStatus();
    console.log("check auth");
  }, [checkAuthStatus]);

  if (loading) {
    return <div>Loading...</div>; // 인증 상태 로딩 중
  }

  return (
    <>
      <Modal />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="auth" element={<AuthPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
