import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa'; 

const GoToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.scrollY > 300) { // Show button after scrolling 300px
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top when the button is clicked
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Smooth scroll
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[1000]">
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-opacity duration-300 cursor-pointer"
          aria-label="Go to top"
        >
          <FaArrowUp className="text-xl" />
        </button>
      )}
    </div>
  );
};

export default GoToTopButton;