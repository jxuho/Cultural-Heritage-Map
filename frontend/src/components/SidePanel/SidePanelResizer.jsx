// src/components/SidePanel/SidePanelResizer.jsx
import useSidePanelResizer from '../../hooks/ui/useSidePanelResizer'; // useSidePanelResizer 훅 임포트

const SidePanelResizer = ({ detailRef }) => { // detailRef를 prop으로 받습니다.
  const {
    resizerPosition,
    isHover,
    isResizing,
    resizerMouseDownHandler,
    setIsHover,
  } = useSidePanelResizer(detailRef); // detailRef를 훅에 전달

  return (
    <div
      className={`w-1 absolute top-0 h-full m-0 p-0 box-border bg-gray-500 opacity-0 translate-x-1 ${
        (isHover || isResizing) && "opacity-40 cursor-ew-resize"
      } `}
      onMouseDown={resizerMouseDownHandler}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{ right: resizerPosition, zIndex: "200" }}
    ></div>
  );
};

export default SidePanelResizer;