import { render, screen, fireEvent, within } from "@testing-library/react";
import UsersManagementPage from "./UsersManagementPage";
import { useAllUsers } from "../../hooks/data/useUserQueries";
import useAuthStore from "../../store/authStore";
import { MemoryRouter } from "react-router";
import { User } from "@/types/user";

// Mock up the required modules
vi.mock("../../hooks/data/useUserQueries", () => ({
  useAllUsers: vi.fn(),
}));

vi.mock("../../store/authStore", () => ({
  default: vi.fn(),
}));

// Mock up child components (to focus on sorting and list rendering)
vi.mock("./UserProfileCard", () => ({
  default: ({ user }: { user: any }) => (
    <div data-testid="user-profile-card">
      {user.username}'s Detailed Profile
    </div>
  ),
}));

vi.mock("../BackButton", () => ({
  default: () => <button>Back</button>,
}));

describe("UsersManagementPage", () => {
  const mockCurrentUser: User = {
    _id: "admin-id",
    username: "AdminUser",
    email: "admin@test.com",
    googleId: "google-admin-12345",
    role: "admin",
    favoriteSites: [],
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  };

  const mockUsers: User[] = [
    {
      _id: "admin-id",
      username: "AdminUser",
      email: "admin@test.com",
      googleId: "google-admin-123",
      role: "admin",
      favoriteSites: [],
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    },
    {
      _id: "user-1",
      username: "Zebra",
      email: "zebra@test.com",
      googleId: "google-zebra-456",
      role: "user",
      favoriteSites: ["site-1"],
      createdAt: "2023-02-01T00:00:00Z",
      updatedAt: "2023-02-01T00:00:00Z",
    },
    {
      _id: "user-2",
      username: "Apple",
      email: "apple@test.com",
      googleId: "google-apple-789",
      role: "user",
      favoriteSites: [],
      createdAt: "2023-01-15T00:00:00Z",
      updatedAt: "2023-01-15T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ user: mockCurrentUser });
  });

  test("Display a loading spinner and message when loading", () => {
    (useAllUsers as any).mockReturnValue({ isLoading: true });
    render(<UsersManagementPage />);
    expect(screen.getByText(/Loading users.../i)).toBeInTheDocument();
  });

  test("Displays an error message when an error occurs", () => {
    (useAllUsers as any).mockReturnValue({
      isError: true,
      error: { message: "Fetch failed" },
    });
    render(<UsersManagementPage />);
    expect(screen.getByText("Fetch failed")).toBeInTheDocument();
  });

  test("Render the user list and place the logged in user at the top (showing You).", () => {
    (useAllUsers as any).mockReturnValue({ data: mockUsers, isLoading: false });
    render(
      <MemoryRouter>
        <UsersManagementPage />
      </MemoryRouter>,
    );

    const userNames = screen.getAllByRole("heading", { level: 2 });
    // Check if the top-level user is AdminUser (current user)
    expect(userNames[0]).toHaveTextContent(/AdminUser/i);
    expect(screen.getByText("(You)")).toBeInTheDocument();
  });

  test("Click the Sort by Name button to change the order.", () => {
    (useAllUsers as any).mockReturnValue({ data: mockUsers, isLoading: false });
    render(
      <MemoryRouter>
        <UsersManagementPage />
      </MemoryRouter>,
    );

    const sortBtn = screen.getByRole("button", { name: /Sort by Username/i });

    // Default alignment (asc): Admin (me) fixed then Apple -> Zebra
    let names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(names[1]).toContain("Apple");
    expect(names[2]).toContain("Zebra");

    // Click once more to sort desc
    fireEvent.click(sortBtn);
    expect(screen.getByText(/Sort by Username ↓/i)).toBeInTheDocument();

    names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(names[1]).toContain("Zebra");
    expect(names[2]).toContain("Apple");
  });

  test("Clicking the View Profile button toggles the detail card.", () => {
    (useAllUsers as any).mockReturnValue({ data: mockUsers, isLoading: false });
    render(
      <MemoryRouter>
        <UsersManagementPage />
      </MemoryRouter>,
    );

    const appleText = screen.getByText("Apple");
    const appleCard = appleText.closest(
      ".bg-white.rounded-lg.shadow-md",
    ) as HTMLElement;
    // Or even safer: appleText.parentElement?.parentElement?.parentElement;

    if (!appleCard) throw new Error("Apple card container not found");

    // 3. Now a button exists within this range.
    const viewBtn = within(appleCard).getByRole("button", {
      name: /View Profile/i,
    });

    fireEvent.click(viewBtn);
    expect(screen.getByTestId("user-profile-card")).toBeInTheDocument();

    const hideBtn = within(appleCard).getByRole("button", {
      name: /Hide Profile/i,
    });
    expect(hideBtn).toBeInTheDocument();
  });

  test("Displays a message when no users are found", () => {
    (useAllUsers as any).mockReturnValue({ data: [], isLoading: false });
    render(<UsersManagementPage />);
    expect(screen.getByText(/No Users Found/i)).toBeInTheDocument();
  });
});
