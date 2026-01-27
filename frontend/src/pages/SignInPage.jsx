import googleImg from '../assets/googleLogo.png'


const SignInPage = () => {


const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";
  const handleGoogleLogin = () => {
  // 이미 위에서 정의한 API_BASE_URL을 사용합니다.
  // API_BASE_URL이 "https://.../api/v1"이므로 뒤에 "/auth/google"만 붙여주면 됩니다.
  window.location.replace(`${API_BASE_URL}/auth/google`);
};

  return (
    <div className="absolute h-full w-full flex flex-col items-center justify-center bg-background ">
      <div
        className={`w-full h-full min-[600px]:w-[440px] min-[600px]:h-[380px] bg-white text-text-dark `}
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
      >
        <div className="p-11 w-full h-full flex flex-col overflow-auto">
          <h2 className="text-xl font-medium pb-4 text-light-text">
            Welcome!
          </h2>

          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold mb-2">Sign-in options</h1>
            <div
              className="flex flex-col hover:bg-white-hover hover:cursor-pointer py-3 px-11 ml-[-44px] mr-[-44px]"
              onClick={handleGoogleLogin}
            >
              <div className="flex flex-row">
                <img src={googleImg} alt="goole logo" className="w-10 h-10" />
                <div className="flex flex-col w-full px-3">
                  <p className="text-text-dark font-medium">
                    Sign in with Google
                  </p>
                  <p className="text-light-text text-sm">
                    Redirects to the sign in page
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end py-3 ">
            <button
              className="py-1 px-3 bg-bg-border min-w-[108px] min-h-[32px] mr-2 hover:bg-gray-button-hover hover:cursor-pointer"
              onClick={() => (window.location.pathname = "/")}
            >
              Back
            </button>
          </div>
        </div>



      </div>
    </div>
  );
};

export default SignInPage;
