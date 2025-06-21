import { MdKeyboardArrowRight } from "react-icons/md";
import {
  PiUserCircleThin,
  PiTrashThin,
  PiMapPinLineThin,
  PiChatCircleTextThin,
  PiClipboardTextThin, 
  PiUsersThreeThin, 
} from "react-icons/pi";
import useAuthStore from "../../store/authStore";
import useUiStore from "../../store/uiStore";
import defaultProfileImg from "../../assets/profile_image.svg";
import { Link } from 'react-router'; 

const ProfileView = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);

  // user 정보가 없을 경우를 대비한 로딩 또는 에러 처리
  if (!user) {
    // 로딩 스피너 또는 메시지 표시
    return <div className="text-center p-4">Loading user data...</div>;
  }

  const signOutHandler = () => {
    openModal(
      <div>
        <h3 className="text-lg font-bold mb-2">Sign Out?</h3>
        <p>Are you sure you want to sign out of your account?</p>
        <button
          onClick={() => {
            closeModal();
            logout();
            window.location.reload(); // 새로고침은 JWT 쿠키 방식에서 필요할 수 있습니다.
          }}
          className="mt-3 px-3 py-1.5 bg-red-500 text-white rounded hover:cursor-pointer font-semibold"
        >
          Sign Out
        </button>
      </div>
    );
  };

  return (
    <div className="m-6 grid gap-12 grid-cols-1 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 xl:grid-cols-4">
      {/* Profile Card */}
      <div
        className="min-[640px]:h-[600px] row-span-2 flex flex-col justify-between max-w-xs p-4 bg-white rounded"
        style={{
          boxShadow:
            "0px 5px 10px rgba(0,0,0,0.1), 0px 1.6px 3.6px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 overflow-hidden rounded-full">
            {user.profileImage ? (
              <img
                className="rounded-full"
                src={user.profileImage}
                alt="profile image"
                referrerPolicy="no-referrer"
              />
            ) : (
              <img
                className="rounded-full"
                src={defaultProfileImg}
                alt="profile image"
              />
            )}
          </div>
          <div className="flex flex-col items-center my-2 ">
            <div className="text-2xl font-medium mb-2">
              {user.username ?? user.email}
            </div>
            <div className="font-normal mb-2">{user.email}</div>
          </div>
        </div>

        <button onClick={signOutHandler} className="flex justify-center border-t pt-3 font-medium border-bg-border text-chemnitz-blue hover:cursor-pointer hover:underline">
          Sign out
        </button>
      </div>

      {/* Update Profile Card */}
      <div
        className="flex flex-col max-w-xs p-4 bg-white rounded h-full row-span-1"
        style={{
          boxShadow:
            "0px 5px 10px rgba(0,0,0,0.1), 0px 1.6px 3.6px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex flex-col items-center justify-between h-full mt-4">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-normal pb-4 max-[400px]:text-lg">
              Profile
            </div>
            <PiUserCircleThin
              className="text-light-text scale-x-[-1]"
              size={"60px"}
            />
            <p className="py-3 text-center">
              Update your personal information.
            </p>
          </div>
          <Link
            className="font-medium text-chemnitz-blue flex hover:underline hover:cursor-pointer pb-2 pt-4 border-t"
            to="update-profile"
          >
            <span className="uppercase max-[400px]:text-sm" title="update profile">
              Update Profile
            </span>
            <span>
              <MdKeyboardArrowRight size={"22px"} />
            </span>
          </Link>
        </div>
      </div>

      {/* Favorite Sites Card */}
      <div
        className="flex flex-col max-w-xs p-4 bg-white rounded h-full row-span-1"
        style={{
          boxShadow:
            "0px 5px 10px rgba(0,0,0,0.1), 0px 1.6px 3.6px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex flex-col items-center justify-between h-full mt-4">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-normal pb-4 max-[400px]:text-lg">
              Favorite Sites
            </div>
            <PiMapPinLineThin
              className="text-light-text scale-x-[-1]"
              size={"60px"}
            />
            <p className="py-3 text-center">
              See your favorite cultural sites.
            </p>
          </div>
          <Link
            className="font-medium text-chemnitz-blue flex hover:underline hover:cursor-pointer pb-2 pt-4 border-t"
            to="favorite-sites"
          >
            <span className="uppercase max-[400px]:text-sm" title="go to favorites">
              Go to favorites
            </span>
            <span>
              <MdKeyboardArrowRight size={"22px"} />
            </span>
          </Link>
        </div>
      </div>

      {/* Reviews Card */}
      <div
        className="flex flex-col max-w-xs p-4 bg-white rounded h-full row-span-1"
        style={{
          boxShadow:
            "0px 5px 10px rgba(0,0,0,0.1), 0px 1.6px 3.6px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex flex-col items-center justify-between h-full mt-4">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-normal pb-4 max-[400px]:text-lg" >
              Reviews
            </div>
            <PiChatCircleTextThin
              className="text-light-text scale-x-[-1]"
              size={"60px"}
            />
            <p className="py-3 text-center">
              Check your reviews
            </p>
          </div>
          <Link
            className="font-medium text-chemnitz-blue flex hover:underline hover:cursor-pointer pb-2 pt-4 border-t"
            to="reviews"
          >
            <span className="uppercase max-[400px]:text-sm" title="check reviews">
              Check reviews
            </span>
            <span>
              <MdKeyboardArrowRight size={"22px"} />
            </span>
          </Link>
        </div>
      </div>

      {/* Admin: View Proposals Card (Conditionally Rendered) */}
      {user.role === 'admin' && (
        <div
          className="flex flex-col max-w-xs p-4 bg-white rounded h-full row-span-1"
          style={{
            boxShadow:
              "0px 5px 10px rgba(0,0,0,0.1), 0px 1.6px 3.6px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex flex-col items-center justify-between h-full mt-4">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-normal pb-4 max-[400px]:text-lg">
                View Proposals
              </div>
              <PiClipboardTextThin // Using the new icon
                className="text-light-text"
                size={"60px"}
              />
              <p className="py-3 text-center">
                Review and manage user-submitted proposals.
              </p>
            </div>
            <Link
              className="font-medium text-chemnitz-blue flex hover:underline hover:cursor-pointer pb-2 pt-4 border-t"
              to="proposals" // Link to the new proposals route
            >
              <span className="uppercase max-[400px]:text-sm" title="view proposals">
                View Proposals
              </span>
              <span>
                <MdKeyboardArrowRight size={"22px"} />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* ✨ NEW: Admin: Check Users Card (Conditionally Rendered) */}
      {user.role === 'admin' && (
        <div
          className="flex flex-col max-w-xs p-4 bg-white rounded h-full row-span-1"
          style={{
            boxShadow:
              "0px 5px 10px rgba(0,0,0,0.1), 0px 1.6px 3.6px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex flex-col items-center justify-between h-full mt-4">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-normal pb-4 max-[400px]:text-lg">
                Check Users
              </div>
              <PiUsersThreeThin // Using the new icon
                className="text-light-text"
                size={"60px"}
              />
              <p className="py-3 text-center">
                View and manage all registered users.
              </p>
            </div>
            <Link
              className="font-medium text-chemnitz-blue flex hover:underline hover:cursor-pointer pb-2 pt-4 border-t"
              to="users" // Link to the new users route (e.g., /profile/users)
            >
              <span className="uppercase max-[400px]:text-sm" title="check users">
                Check Users
              </span>
              <span>
                <MdKeyboardArrowRight size={"22px"} />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Delete Account Card */}
      <div
        className="flex flex-col max-w-xs p-4 bg-white rounded h-full row-span-1 "
        style={{
          boxShadow:
            "0px 5px 10px rgba(0,0,0,0.1), 0px 1.6px 3.6px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex flex-col items-center justify-between h-full mt-4">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-normal pb-4 max-[400px]:text-lg">
              Delete Account
            </div>
            <PiTrashThin
              className="text-light-text scale-x-[-1]"
              size={"60px"}
            />
            <p className="py-3 text-center">
              Delete your account. <br />
              You can't recover the data.
            </p>
          </div>
          <Link
            className="font-medium text-alert-error flex hover:underline hover:cursor-pointer pb-2 pt-4 border-t "
            to="delete-account"
          >
            <span className="uppercase max-[400px]:text-xs" title="delete account">
              Delete Account
            </span>
            <span>
                <MdKeyboardArrowRight size={"22px"} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;