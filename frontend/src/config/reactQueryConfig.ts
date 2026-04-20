import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분 동안 "신선한" 상태 유지
      gcTime: 1000 * 60 * 30, // 30분 동안 캐시에 유지
      refetchOnWindowFocus: false, // 창이 다시 포커스 될 때 자동 refetch 비활성화
      retry: 2, // 실패 시 2번 재시도
    },
  },
});

export { queryClient };