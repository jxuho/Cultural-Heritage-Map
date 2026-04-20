import { useNavigate } from 'react-router';
import { FaArrowLeft } from 'react-icons/fa'; // For a simple left arrow icon

const BackButton = ({
  className = '', 
  iconSize = '18px', 
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <button
      onClick={handleGoBack}
      className={`
        flex items-center justify-center
        w-10 h-10 rounded-full
        bg-gray-50 text-gray-700
        hover:bg-gray-300 hover:text-gray-800
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-gray-400
        shadow-md cursor-pointer
        ${className}
      `}
      aria-label="Go Back"
      title="Go back to the previous page"
    >
      <FaArrowLeft size={iconSize} /> {/* Only the icon, no text or conditional class */}
    </button>
  );
};

export default BackButton;