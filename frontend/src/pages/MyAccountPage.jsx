import { Outlet } from "react-router";

const MyAccountPage = () => {
  return (
    <div className="w-full h-full p-4 md:p-12 mx-auto max-w-[1680px] overflow-auto">
      <Outlet />
    </div>
  );
};

export default MyAccountPage;