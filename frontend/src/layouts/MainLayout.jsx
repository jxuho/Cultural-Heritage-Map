// src/MainLayout.jsx

import { Outlet } from "react-router";
import Footer from "../components/Footer";
import Header from "../components/Header";
import FilterPanel from "../components/FilterPanel";
import { useLocation } from 'react-router'
import AccountManager from "../components/AccountManager/AccountManager";

const MainLayout = () => {
  let location = useLocation();
  
  return (
    <div className="flex flex-col h-screen">
      <Header currentUser={""} onLogout={""} />
      <AccountManager/>
      {/* {location.pathname === '/' && <FilterPanel />} */}
      <main className="grow relative">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
