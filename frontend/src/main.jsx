import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router"; // react-router-dom에서 BrowserRouter 임포트 확인
import "./index.css";
import App from "./App.jsx";

// --- TanStack Query 관련 추가 ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // 개발 도구 (선택 사항)

// QueryClient 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분 동안 "신선한" 상태 유지
      cacheTime: 1000 * 60 * 30, // 30분 동안 캐시에 유지
      refetchOnWindowFocus: false, // 창이 다시 포커스 될 때 자동 refetch 비활성화
      retry: 2, // 실패 시 2번 재시도
    },
  },
});
// --- TanStack Query 관련 추가 끝 ---


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/* QueryClientProvider로 App 컴포넌트를 감싸줍니다 */}
      <QueryClientProvider client={queryClient}>
        <App />
        {/* 개발 환경에서만 보이는 React Query 개발 도구 (선택 사항) */}
        {/* 개발 중에는 유용하지만, 배포 시에는 제거하거나 환경 변수로 제어하는 것이 좋습니다. */}
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);