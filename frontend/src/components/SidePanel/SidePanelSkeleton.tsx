interface SidePanelSkeletonProps {
  onClose?: () => void;
}


const SidePanelSkeleton = ({ onClose }: SidePanelSkeletonProps) => {
  return (
    <div className="p-4 animate-pulse relative">
      {/* Close Button */}
      {onClose && (
        <div className="absolute top-4 right-4">
          <button
            className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
            onClick={onClose}
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>
      )}

      {/* Skeleton Content */}
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
      {/* Optionally add loading text */}
      <p className="mt-4 text-center text-gray-500">Loading cultural site information...</p>
    </div>
  );
};

export default SidePanelSkeleton;