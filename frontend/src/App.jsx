import { Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import MainLayout from "./layouts/MainLayout";
import useAuthStore from "./store/authStore";
import { useEffect } from "react";
import Modal from "./components/Modal";
import SignInPage from "./pages/SignInPage";
import MyAccountPage from "./pages/MyAccountPage";
import LoadingSpinner from "./components/LoadingSpinner";
import UpdateProfile from "./components/MyAccount/UpdateProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileView from "./components/MyAccount/ProfileView";
import MyReviews from "./components/MyAccount/MyReviews";
import FavoriteSites from "./components/MyAccount/FavoriteSites";
import Proposals from "./components/MyAccount/Proposals";
import DeleteAccount from "./components/MyAccount/DeleteAccount";
import ListPage from "./pages/ListPage";
import UsersManagementPage from "./components/MyAccount/UsersManagementPage";

const App = () => {
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    checkAuthStatus(); // Always re-validate login status
  }, [checkAuthStatus]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Modal />
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="list" element={<ListPage />} /> 
          
          <Route element={<ProtectedRoute />}>
            <Route path="my-account" element={<MyAccountPage />}>
              <Route index element={<ProfileView />} />
              <Route path="update-profile" element={<UpdateProfile />} />
              <Route path="reviews" element={<MyReviews />} />
              <Route path="favorite-sites" element={<FavoriteSites />} />
              <Route path="proposals" element={<Proposals />} />
              <Route path="delete-account" element={<DeleteAccount />} />
              <Route path="users" element={<UsersManagementPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;