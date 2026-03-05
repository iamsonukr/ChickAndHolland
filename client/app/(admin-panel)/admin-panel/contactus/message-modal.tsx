// message-modal.tsx
"use client";

import { useState, useEffect } from 'react';

interface Message {
  id: string | number;
  name: string;
  email: string;
  subject: string;
  message: string;
  phoneNumber?: string;
  createdAt: string;
  country?: string;
  state?: string;
  isRead: boolean;
}

interface MessageModalProps {
  contacts: Message[];
}

export function MessageModal({ contacts }: MessageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element is a view message button
      if (target.closest('.message-view-button')) {
        e.preventDefault();
        const button = target.closest('.message-view-button') as HTMLElement;
        const messageId = button.getAttribute('data-message-id');
        const message = contacts.find(c => c.id.toString() === messageId);
        
        if (message) {
          setSelectedMessage(message);
          setIsOpen(true);
        }
      }
    };

    // Add click event listener to the document
    document.addEventListener('click', handleClick);

    // Close modal on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contacts, isOpen]);

  // Function to format message with line breaks
  const formatMessage = (message: string) => {
    return message.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < message.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (!isOpen || !selectedMessage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      ></div>
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        
        {/* Modal Header */}
        <div className="p-4 bg-gray-800 dark:bg-gray-900 text-white border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Message Details</h2>
              <p className="text-sm text-gray-300 mt-1">
                {selectedMessage.subject}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white p-1 rounded hover:bg-gray-700"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Sender Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sender</h3>
              <p className="font-medium text-gray-800 dark:text-white">{selectedMessage.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedMessage.email}</p>
              {selectedMessage.phoneNumber && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">📱 {selectedMessage.phoneNumber}</p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 rounded p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Details</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Date:</span> {new Date(selectedMessage.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Time:</span> {new Date(selectedMessage.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </p>
              {selectedMessage.country && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Location:</span> {selectedMessage.country} {selectedMessage.state ? `, ${selectedMessage.state}` : ''}
                </p>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                <span className="font-medium">Status:</span>{" "}
                <span className={`px-2 py-1 rounded-full text-xs ml-2 ${
                  selectedMessage.isRead 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {selectedMessage.isRead ? 'Read' : 'Unread'}
                </span>
              </p>
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">Message</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedMessage.message.length} characters
              </span>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded p-4 border border-gray-300 dark:border-gray-600">
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                {formatMessage(selectedMessage.message)}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap gap-2 justify-end">
            {/* <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Close
            </button> */}
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}