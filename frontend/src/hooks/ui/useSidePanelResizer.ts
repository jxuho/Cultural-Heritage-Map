// src/hooks/ui/useSidePanelResizer.js
import { useCallback, useEffect, useState } from "react";
import useUiStore from "../../store/uiStore";
import useViewport from "./useViewPort";

// detailRef를 인자로 받도록 변경합니다.
const useSidePanelResizer = (detailRef: React.RefObject<HTMLDivElement>) => {
  const sidePanelWidth = useUiStore((state) => state.sidePanelWidth);
  const setSidePanelWidth = useUiStore((state) => state.setSidePanelWidth);
  const { width: viewportWidth } = useViewport();

  // detailRef는 이제 외부에서 주입받습니다.
  const [isResizing, setIsResizing] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [resizerPosition, setResizerPosition] = useState(sidePanelWidth);

  const resizerMouseDownHandler = useCallback(() => {
    setIsResizing(true);
  }, []);

  const resizerMouseUpHandler = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      setSidePanelWidth(resizerPosition);
    }
  }, [isResizing, resizerPosition, setSidePanelWidth]);

  const resizeHandler = useCallback(
    (event: MouseEvent) => {
      // 주입받은 detailRef를 사용합니다.
      if (!isResizing || !detailRef.current) return;
      let calculatedPosition =
        detailRef.current.getBoundingClientRect().right - event.clientX;
      if (calculatedPosition > 700) {
        calculatedPosition = 700;
      }
      if (calculatedPosition < 360) {
        calculatedPosition = 360;
      }
      setResizerPosition(calculatedPosition);
    },
    [isResizing, detailRef] // detailRef도 의존성에 추가
  );

  useEffect(() => {
    document.addEventListener("mousemove", resizeHandler);
    document.addEventListener("mouseup", resizerMouseUpHandler);
    return () => {
      document.removeEventListener("mousemove", resizeHandler);
      document.removeEventListener("mouseup", resizerMouseUpHandler);
    };
  }, [resizeHandler, resizerMouseUpHandler]);

  useEffect(() => {
    if (viewportWidth <= 450 || sidePanelWidth > viewportWidth) {
      setResizerPosition(viewportWidth);
    } 
  }, [viewportWidth, sidePanelWidth, setSidePanelWidth]);

  return {
    sidePanelWidth,
    resizerPosition,
    isHover,
    isResizing,
    resizerMouseDownHandler,
    setIsHover,
  };
};

export default useSidePanelResizer;