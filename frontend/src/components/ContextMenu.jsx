import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useFloating,
  autoUpdate,
  flip,
  offset,
  shift,
  useRole,
  useDismiss,
  useInteractions,
  useListNavigation,
  useTypeahead,
  FloatingPortal,
  FloatingFocusManager,
} from "@floating-ui/react";
import useUiStore from "../store/uiStore";

// MenuItem
export const MenuItem = ({ children, disabled, ...props }) => {
  return (
    <button
      {...props}
      className="flex text-sm hover:bg-white-hover items-center min-h-[38px] pl-3 pr-4 text-text-dark"
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};


// MenuSeparator
export const MenuSeparator = (props) => {
  return (
    <div
      {...props}
      className="border-b border-solid border-input-hover my-1.5 mx-0"
    />
  );
};


// Menu
export const Menu = ({ children }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const isContextMenuOpen = useUiStore((state) => state.isContextMenuOpen);
  const closeContextMenu = useUiStore((state) => state.closeContextMenu);

  const listItemsRef = useRef([]);
  const listContentRef = useRef(
    Children.map(children, (child) =>
      isValidElement(child) && typeof child.props.label === "string"
        ? child.props.label
        : ""
    )
  );

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset({ mainAxis: 5, alignmentAxis: 4 }),
      flip({
        fallbackPlacements: ["left-start"],
      }),
      shift({ padding: 10 }),
    ],
    placement: "right-start",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
  });

  const role = useRole(context, { role: "menu" });
  const dismiss = useDismiss(context);
  const listNavigation = useListNavigation(context, {
    listRef: listItemsRef,
    onNavigate: setActiveIndex,
    activeIndex,
  });
  const typeahead = useTypeahead(context, {
    enabled: isOpen,
    listRef: listContentRef,
    onMatch: setActiveIndex,
    activeIndex,
  });

  const { getFloatingProps, getItemProps } = useInteractions([
    role,
    dismiss,
    listNavigation,
    typeahead,
  ]);

  useEffect(() => {
    function onContextMenu(e) {
      if (isContextMenuOpen) {
        e.preventDefault();
        refs.setPositionReference({
          getBoundingClientRect() {
            return {
              width: 0,
              height: 0,
              x: e.clientX,
              y: e.clientY,
              top: e.clientY,
              right: e.clientX,
              bottom: e.clientY,
              left: e.clientX,
            };
          },
        });

        setIsOpen(true);
        closeContextMenu();
      }
    }

    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [refs, isContextMenuOpen, closeContextMenu]);

  return (
    <FloatingPortal id="root">
      {isOpen && (
        <FloatingFocusManager
          context={context}
          initialFocus={() => listItemsRef.current[0] ?? refs.floating.current}
        >
          <div
            className="rounded bg-white flex flex-col overflow-hidden z-50 shadow-menu"
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps({
              onContextMenu: (e) => {
                e.preventDefault(); // 기본 브라우저 컨텍스트 메뉴를 막습니다.
              },
            })}
          >
            {Children.map(children, (child, index) => {
              return (
                isValidElement(child) &&
                cloneElement(
                  child,
                  getItemProps({
                    tabIndex: activeIndex === index ? 0 : -1,
                    ref: (node) => {
                      listItemsRef.current[index] = node ?? null;
                    },
                    onClick: (e) => {
                      child.props.onClick?.(e);
                      setIsOpen(false);
                    },
                  })
                )
              );
            })}
          </div>
        </FloatingFocusManager>
      )}
    </FloatingPortal>
  );
};
