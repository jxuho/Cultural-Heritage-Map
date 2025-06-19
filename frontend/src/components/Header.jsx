import useUiStore from "../store/uiStore";
import { CgProfile } from "react-icons/cg";
import { FaThList, FaMapMarkedAlt } from "react-icons/fa"; // NEW: 지도 아이콘 임포트
import { useNavigate, useLocation } from 'react-router'; // NEW: useLocation 훅 임포트

const Header = () => {
  const isAccountManagerOpen = useUiStore(
    (state) => state.isAccountManagerOpen
  );
  const openAccountManager = useUiStore((state) => state.openAccountManager);
  const closeAccountManager = useUiStore((state) => state.closeAccountManager);

  const navigate = useNavigate();
  const location = useLocation(); // NEW: useLocation 훅 초기화

  // 현재 경로가 '/list'인지 확인
  const isListPage = location.pathname === '/list';

  const headerButtonsClickHandler = (option) => {
    switch (option) {
      case "accountManager":
        if (isAccountManagerOpen) {
          closeAccountManager();
        } else {
          openAccountManager();
        }
        break;
      case "toggleListView": // NEW: 버튼 동작을 위한 새로운 case
        if (isListPage) {
          navigate('/'); // 현재 /list 페이지면 홈으로 이동
        } else {
          navigate('/list'); // 아니면 /list 페이지로 이동
        }
        break;
      default:
        break;
    }
  };

  return (
    <header className="flex flex-row justify-between items-center h-12 text-white-text bg-chemnitz-blue">
      <nav className="container mx-auto flex justify-between items-center">
        <a
          href="/"
          className="text-2xl font-bold text-white hover:cursor-pointer pl-4 "
        >
          Chemnitz Culture Finder
        </a>
        <div className="flex items-center pr-4"> {/* Header 버튼들을 담을 컨테이너 */}
          {/* "See All Cultural Sites" / "Go to Map" 버튼 */}
          <div
            id="toggleListViewButton" // ID 변경
            className={`flex justify-center items-center h-12 w-12 hover:bg-[#44a1bd] transition ease-in-out duration-100 hover:cursor-pointer`}
            onClick={() => headerButtonsClickHandler("toggleListView")} // 동작 변경
            title={isListPage ? "Go to Map View" : "See All Cultural Sites"} // 타이틀 변경
          >
            {isListPage ? ( // 현재 /list 페이지인지에 따라 아이콘 변경
              <FaMapMarkedAlt size="20px" className="text-white" /> // 지도 아이콘
            ) : (
              <FaThList size="20px" className="text-white" /> // 목록 아이콘
            )}
          </div>

          <div
            id="accountManagerButton"
            className={`flex justify-center items-center h-12 w-12 hover:bg-[#44a1bd] transition ease-in-out duration-100 hover:cursor-pointer`}
            onClick={() => headerButtonsClickHandler("accountManager")}
            title="Account manager"
          >
            <CgProfile size="20px" className="text-white" />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;