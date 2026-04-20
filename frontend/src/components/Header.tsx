import React from "react";
import useUiStore from "../store/uiStore";
import { CgProfile } from "react-icons/cg";
import { FaThList, FaMapMarkedAlt } from "react-icons/fa";
import { useNavigate, useLocation } from 'react-router';

// 클릭 핸들러에서 사용할 옵션 타입 정의
type HeaderOption = "accountManager" | "toggleListView";

const Header: React.FC = () => {
    // Zustand 스토어에서 상태와 액션을 개별적으로 가져옵니다.
    // store/uiStore.ts에 정의된 타입이 자동으로 적용됩니다.
    const isAccountManagerOpen = useUiStore((state) => state.isAccountManagerOpen);
    const openAccountManager = useUiStore((state) => state.openAccountManager);
    const closeAccountManager = useUiStore((state) => state.closeAccountManager);

    const navigate = useNavigate();
    const location = useLocation();

    const isNotRootPath = location.pathname !== '/';

    const headerButtonsClickHandler = (option: HeaderOption) => {
        switch (option) {
            case "accountManager":
                if (isAccountManagerOpen) {
                    closeAccountManager();
                } else {
                    openAccountManager();
                }
                break;
            case "toggleListView":
                if (isNotRootPath) { 
                    navigate('/');
                } else {
                    navigate('/list');
                }
                break;
            default:
                // TypeScript의 exhaustive check를 위해 작성 (선택 사항)
                break;
        }
    };

    return (
        <header className="flex flex-row justify-between items-center h-12 text-white bg-chemnitz-blue">
            <nav className="container mx-auto flex justify-between items-center relative">
                {/* 리스트/지도 보기 전환 버튼 */}
                <div
                    id="toggleListViewButton"
                    className="flex justify-center items-center h-12 w-12 hover:bg-[#44a1bd] transition ease-in-out duration-100 hover:cursor-pointer"
                    onClick={() => headerButtonsClickHandler("toggleListView")}
                    title={isNotRootPath ? "Go to Map View" : "See All Cultural Sites"}
                >
                    {isNotRootPath ? (
                        <FaMapMarkedAlt size="20px" className="text-white" /> 
                    ) : (
                        <FaThList size="20px" className="text-white" />
                    )}
                </div>

                {/* 중앙 로고 */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <a
                        href="/"
                        className="font-bold text-white hover:cursor-pointer text-base sm:text-lg md:text-xl lg:text-2xl whitespace-nowrap"
                    >
                        Chemnitz Culture Finder
                    </a>
                </div>

                {/* 계정 관리 버튼 */}
                <div className="flex items-center pr-4">
                    <div
                        id="accountManagerButton"
                        className="flex justify-center items-center h-12 w-12 hover:bg-[#44a1bd] transition ease-in-out duration-100 hover:cursor-pointer"
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