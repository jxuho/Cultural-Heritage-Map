import { renderHook, act } from '@testing-library/react';
import useSidePanelResizer from './useSidePanelResizer';
import useUiStore from '../../store/uiStore';
import useViewport from './useViewPort';

vi.mock('../../store/uiStore');
vi.mock('./useViewPort');

describe('useSidePanelResizer', () => {
  const setSidePanelWidth = vi.fn();

  const createMockRef = () => {
    return {
      current: {
        getBoundingClientRect: () => ({
          right: 1000,
        }),
      },
    } as any;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useUiStore as any).mockImplementation((selector: any) =>
      selector({
        sidePanelWidth: 400,
        setSidePanelWidth,
      })
    );

    (useViewport as any).mockReturnValue({
      width: 1200,
    });
  });

  test('initial state is correct', () => {
    const { result } = renderHook(() =>
      useSidePanelResizer(createMockRef())
    );

    expect(result.current.resizerPosition).toBe(400);
    expect(result.current.isResizing).toBe(false);
  });

  test('mousedown sets resizing true', () => {
    const { result } = renderHook(() =>
      useSidePanelResizer(createMockRef())
    );

    act(() => {
      result.current.resizerMouseDownHandler();
    });

    expect(result.current.isResizing).toBe(true);
  });

  test('mousemove updates resizerPosition within bounds', () => {
    const ref = createMockRef();

    const { result } = renderHook(() =>
      useSidePanelResizer(ref)
    );

    act(() => {
      result.current.resizerMouseDownHandler();
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 500 })
      );
    });

    expect(result.current.resizerPosition).toBeGreaterThanOrEqual(360);
    expect(result.current.resizerPosition).toBeLessThanOrEqual(700);
  });

  test('mouseup stops resizing and updates store', () => {
    const { result } = renderHook(() =>
      useSidePanelResizer(createMockRef())
    );

    act(() => {
      result.current.resizerMouseDownHandler();
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.isResizing).toBe(false);
    expect(setSidePanelWidth).toHaveBeenCalled();
  });

  test('resizerPosition is clamped to max 700', () => {
    const ref = createMockRef();

    const { result } = renderHook(() =>
      useSidePanelResizer(ref)
    );

    act(() => {
      result.current.resizerMouseDownHandler();
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: -1000 })
      );
    });

    expect(result.current.resizerPosition).toBe(700);
  });

  test('resizerPosition is clamped to min 360', () => {
    const ref = createMockRef();

    const { result } = renderHook(() =>
      useSidePanelResizer(ref)
    );

    act(() => {
      result.current.resizerMouseDownHandler();
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 9999 })
      );
    });

    expect(result.current.resizerPosition).toBe(360);
  });

  test('viewport change adjusts resizerPosition', () => {
    (useViewport as any).mockReturnValue({
      width: 300,
    });

    const { result } = renderHook(() =>
      useSidePanelResizer(createMockRef())
    );

    expect(result.current.resizerPosition).toBe(300);
  });
});