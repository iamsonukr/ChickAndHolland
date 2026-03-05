// app/(admin)/admin/contact-us/mark-as-read-button.tsx
"use client";

import { useState } from "react";
import { API_URL } from "../../../../lib/constants";

export function MarkAsReadButton({ contactId }: { contactId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMarked, setIsMarked] = useState(false);

  const handleMarkAsRead = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1] || '';

      const response = await fetch(`${API_URL}/contactus/${contactId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsMarked(true);
        // Refresh the page to update the status
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMarked) {
    return (
      <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded font-medium border border-green-300 dark:border-green-700">
        Marked ✓
      </span>
    );
  }

  return (
    <button
      onClick={handleMarkAsRead}
      disabled={isLoading}
      className={`px-2.5 py-1 text-xs rounded font-medium border transition-colors ${
        isLoading
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500'
      }`}
    >
      {isLoading ? 'Processing...' : 'Mark as Read'}
    </button>
  );
}