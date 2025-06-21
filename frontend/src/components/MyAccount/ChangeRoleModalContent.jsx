// src/components/ChangeRoleModalContent.jsx
import React, { useState } from 'react';
import useUiStore from '../../store/uiStore'; // Assuming this path is correct
import { useUpdateUserRole } from '../../hooks/data/useUserQueries'; // Adjust path to your hooks file

export const ChangeRoleModalContent = ({ user }) => {
  const { closeModal } = useUiStore();
  const [selectedRole, setSelectedRole] = useState(user.role);
  const updateUserRoleMutation = useUpdateUserRole();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedRole === user.role) {
      alert("역할이 변경되지 않았습니다.");
      closeModal();
      return;
    }

    try {
      await updateUserRoleMutation.mutateAsync({
        userId: user._id,
        newRole: selectedRole,
      });
      // If mutation is successful, it will invalidate queries and update UI automatically.
      // We can close the modal here or let the success message/toast handle it.
      closeModal();
    } catch (error) {
      // The onError in useUpdateUserRole hook will show an alert.
      // You can add more specific error handling here if needed.
      console.error("Failed to change role in modal:", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Change Role for "{user.username}"
      </h2>
      {updateUserRoleMutation.isError && (
        <p className="text-red-500 text-sm mb-3">
          Error: {updateUserRoleMutation.error.message || 'Failed to update role.'}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="role-select" className="block text-gray-700 text-sm font-bold mb-2">
            Select New Role:
          </label>
          <select
            id="role-select"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={updateUserRoleMutation.isPending}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
            disabled={updateUserRoleMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            disabled={updateUserRoleMutation.isPending}
          >
            {updateUserRoleMutation.isPending ? 'Updating...' : 'Update Role'}
          </button>
        </div>
      </form>
    </div>
  );
};