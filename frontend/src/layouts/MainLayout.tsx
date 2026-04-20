import { Outlet } from "react-router";
import Footer from "../components/Footer";
import Header from "../components/Header";
import AccountManager from "../components/AccountManager/AccountManager";

const MainLayout = () => {
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <AccountManager/>
      <main className="grow relative">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
