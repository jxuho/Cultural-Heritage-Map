import { renderHook, act } from "@testing-library/react";
import useViewPort from "./useViewPort";

describe("useViewPort", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  test("returns initial window width", () => {
    const { result } = renderHook(() => useViewPort());

    expect(result.current.width).toBe(1024);
  });

  test("updates width on window resize", () => {
    const { result } = renderHook(() => useViewPort());

    act(() => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.width).toBe(500);
  });
});