import axios from "axios";

const API_BASE_URL = import.meta.env.PROD
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1"
  : "http://localhost:5000/api/v1";

// axios.create는 커스텀 Axios 인스턴스(객체)를 생성한다. 이 인스턴스는 기본 URL, 헤더, 타임아웃 등과 같은 공통 설정을 포함할 수 있으며, 이를 통해 API 요청을 보다 간편하게 관리할 수 있다. 예를 들어, 모든 요청에 대해 동일한 베이스 URL과 인증 토큰을 사용해야 하는 경우, axios.create로 생성된 인스턴스를 사용하면 코드 중복을 줄이고 유지보수를 쉽게 할 수 있다.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 모든 요청에 쿠키 포함
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient