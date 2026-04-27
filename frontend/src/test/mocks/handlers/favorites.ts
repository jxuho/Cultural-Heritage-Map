import { http, HttpResponse } from 'msw';

const createMockSite = (id: string, name: string) => ({
  _id: id,
  name: name,
  description: `This is an explanation of the ${name}.`,
  category: 'artwork',
  location: {
    type: 'Point',
    coordinates: [126.9774, 37.5663],
  },
  address: 'Chemnitz address example',
  favoritesCount: 1,
  averageRating: 4.5, // Aggregation으로 추가되는 필드
  reviewCount: 10,    // Aggregation으로 추가되는 필드
});

let mockFavorites = [createMockSite('site-123', 'ABC Historic Site')];

export const favoriteHandlers = [
  // [GET] 즐겨찾기 목록 조회
  http.get('*/users/me/favorites', () => {
    return HttpResponse.json({
      status: 'success',
      results: mockFavorites.length,
      data: {
        favoriteSites: mockFavorites
      }
    });
  }),

  // [POST] 즐겨찾기 추가
  http.post('*/users/me/favorites/:siteId', ({ params }) => {
    const { siteId } = params as { siteId: string };
    const newSite = createMockSite(siteId, 'new historic site');
    
    // 테스트 환경의 가짜 상태 업데이트 (선택 사항)
    mockFavorites.push(newSite);

    return HttpResponse.json({
      status: 'success',
      message: 'Successfully added.',
      data: {
        user: { _id: 'user-1', favoriteSites: mockFavorites.map(s => s._id) },
        culturalSite: newSite,
        // 중요: 프론트엔드 api/favoriteApi.ts가 이 경로를 참조함
        favoriteSites: mockFavorites 
      }
    });
  }),

  // [DELETE] 즐겨찾기 삭제
  http.delete('*/users/me/favorites/:siteId', ({ params }) => {
    const { siteId } = params as { siteId: string };
    mockFavorites = mockFavorites.filter(s => s._id !== siteId);

    return HttpResponse.json({
      status: 'success',
      message: 'Successfully removed.',
      data: {
        user: { _id: 'user-1', favoriteSites: mockFavorites.map(s => s._id) }
      }
    });
  }),
];