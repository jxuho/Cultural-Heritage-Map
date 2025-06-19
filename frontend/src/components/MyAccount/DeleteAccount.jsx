import React, { useEffect } from 'react';
import { useNavigate } from 'react-router'; // Assuming you're using React Router for navigation
import { useDeleteMyAccount } from '../../hooks/useCulturalSitesQueries'; // Adjust the import path as needed

const DeleteAccount = () => {
  const navigate = useNavigate();
  const {
    mutate: deleteAccount,
    isPending: isDeleting,
    isSuccess: isDeleted,
    isError: isDeleteError,
    error: deleteError,
  } = useDeleteMyAccount();

  // Redirect after successful account deletion
  useEffect(() => {
    if (isDeleted) {
      // It's a good practice to also clear any client-side authentication tokens
      // if your application uses them (e.g., localStorage.removeItem('authToken')).
      // If relying solely on httpOnly cookies, this might not be strictly necessary here,
      // as the backend should invalidate the session.
      console.log('Account deleted, redirecting to login...');
      navigate('/login'); // Redirect to the login page
    }
  }, [isDeleted, navigate]);

  const handleDeleteAccount = () => {
    // Show a confirmation dialog before proceeding
    if (window.confirm('Are you absolutely sure you want to delete your account? This action is irreversible and all your data will be permanently lost.')) {
      deleteAccount(); // Trigger the mutation to delete the account
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg mt-10">
      <div className="bg-white p-8 rounded-lg shadow-xl border border-red-200">
        <h2 className="text-3xl font-bold text-red-700 mb-6 text-center">Delete Your Account</h2>

        <p className="text-gray-700 mb-6 leading-relaxed">
          Please be aware that deleting your account is a permanent action. All your associated data, including your reviews, favorite sites, and personal information, will be irreversibly removed from our system. This action cannot be undone.
        </p>

        {isDeleteError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{deleteError.message || 'Failed to delete account. Please try again.'}</span>
          </div>
        )}

        <button
          onClick={handleDeleteAccount}
          className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting Account...' : 'Confirm Account Deletion'}
        </button>

        <p className="text-sm text-gray-500 mt-6 text-center">
          If you have any questions or concerns, please contact support.
        </p>
      </div>
    </div>
  );
};

export default DeleteAccount;