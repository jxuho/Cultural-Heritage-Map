import { useLocation } from "react-router";
import useAuthStore from "../store/authStore";
import useModalStore from "../store/modalStore";

function Header() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);

  const signInClickHandler = () => {
    window.location.href = "http://localhost:5000/api/v1/auth/google";
  };

  const onSignOutClickHandler = () => {
    closeModal();
    logout();
  };

  const signOutModalOpenHandler = () => {
    openModal(
      <div>
        <h3 className="text-lg font-bold mb-2">Sign Out?</h3>
        <p>Are you sure you want to sign out of your account?</p>
        <button
          onClick={onSignOutClickHandler}
          className="mt-3 px-3 py-1.5 bg-red-500 text-white rounded hover:cursor-pointer font-semibold"
        >
          Sign Out
        </button>
      </div>
    );
  };

  return (
    <header className="flex flex-row justify-between items-center h-12 text-white-text bg-blue-600">
      <nav className="container mx-auto flex justify-between items-center">
        <a
          href="/"
          className="text-2xl font-bold text-white hover:cursor-pointer"
        >
          Chemnitz Cultural Sites
        </a>
        {location.pathname !== "/auth" && (
          <ul className="flex space-x-6">
            {isAuthenticated ? (
              <li>
                <button
                  onClick={signOutModalOpenHandler}
                  className="bg-blue-700 hover:bg-blue-800 hover:cursor-pointer text-white font-bold py-1.5 px-3 rounded text-sm"
                >
                  Sign out
                </button>
              </li>
            ) : (
              <li>
                <button
                  onClick={signInClickHandler}
                  className="bg-blue-700 hover:bg-blue-800 hover:cursor-pointer text-white font-bold py-1.5 px-3 rounded text-sm"
                >
                  Sign in
                </button>
              </li>
            )}
          </ul>
        )}
      </nav>
    </header>
  );
}

export default Header;
