import useAuthStore from './authStore';
import axios from 'axios';

// Axios mocking
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn().mockReturnThis(),
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

// Helper for retrieving instances created with axios.create()
const mockedApi = vi.mocked(axios.create());

describe('authStore', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  // Initialize store state before each test
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: true,
    });
    vi.clearAllMocks();
    consoleSpy.mockClear();
  });
  afterAll(() => {
    consoleSpy.mockRestore();
  });

  test('Initial state must be set correctly', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(true);
  });

  test('When the login action is executed, user information is saved and the authentication status is changed to true.change authentication status to true', () => {
    const mockUser = { _id: '1', username: 'tester', email: 'test@test.com', role: 'user' };
    
    useAuthStore.getState().login(mockUser as any);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  test('When the updateUser action is executed, it merges new information with existing user information', () => {
    // Initial user settings
    useAuthStore.setState({ user: { _id: '1', username: 'oldName', role: 'user' } as any });

    useAuthStore.getState().updateUser({ username: 'newName' });

    const state = useAuthStore.getState();
    expect(state.user?.username).toBe('newName');
    expect(state.user?.role).toBe('user'); // Maintain existing information
  });

  describe('checkAuthStatus', () => {
    test('When authentication check is successful, user information is saved and loading is changed to false', async () => {
      const mockUserData = { user: { _id: '1', username: 'tester' } };
      mockedApi.get.mockResolvedValueOnce({ data: { data: mockUserData } });

      await useAuthStore.getState().checkAuthStatus();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUserData.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    test('When authentication check fails, the state is reset and loading is changed to false', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

      await useAuthStore.getState().checkAuthStatus();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('logout', () => {
    test('When logout is successful, a request is sent to the server and the state is reset', async () => {
      // Start logged in
      useAuthStore.setState({ user: { username: 'tester' } as any, isAuthenticated: true });
      mockedApi.post.mockResolvedValueOnce({});

      await useAuthStore.getState().logout();

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    test('When logout communication error occurs, the client state is still reset', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Logout failed'));

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});