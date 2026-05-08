"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "../../../../lib/constants";

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
  city?: string;
  productCodes?: string;
  page?: string | null;
  queryType?: "contact" | "product";
  isRead: boolean;
}

interface MessageModalProps {
  contacts: Message[];
}

export function MessageModal({ contacts }: MessageModalProps) {
  const router = useRouter();
  const markingReadIds = useRef<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const markMessageAsRead = useCallback(async (message: Message) => {
    if (message.isRead) return;

    const key = `${message.queryType || "contact"}-${message.id}`;
    if (markingReadIds.current.has(key)) return;
    markingReadIds.current.add(key);

    try {
      const token =
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1] || "";
      const endpoint =
        message.queryType === "product"
          ? getApiUrl(`/product-queries/${message.id}/read`)
          : getApiUrl(`/contactus/${message.id}/read`);

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSelectedMessage((current) =>
          current && current.id.toString() === message.id.toString()
            ? { ...current, isRead: true }
            : current,
        );
        router.refresh();
      }
    } catch (error) {
      console.error("Error marking opened message as read:", error);
    } finally {
      markingReadIds.current.delete(key);
    }
  }, [router]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest(".message-view-button") as HTMLElement | null;

      if (!button) return;

      event.preventDefault();
      const messageId = button.getAttribute("data-message-id");
      const message = contacts.find((item) => item.id.toString() === messageId);

      if (message) {
        setSelectedMessage(message);
        setIsOpen(true);
        void markMessageAsRead(message);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contacts, isOpen, markMessageAsRead]);

  const formatMessage = (message: string) =>
    message.split("\n").map((line, index, lines) => (
      <span key={`${line}-${index}`}>
        {line}
        {index < lines.length - 1 && <br />}
      </span>
    ));

  if (!isOpen || !selectedMessage) return null;

  const location = [
    selectedMessage.city,
    selectedMessage.state,
    selectedMessage.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-700 bg-gray-800 p-4 text-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Query Details</h2>
              <p className="mt-1 text-sm text-gray-300">
                {selectedMessage.subject}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-gray-300 hover:bg-gray-700 hover:text-white"
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/30">
              <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Sender
              </h3>
              <p className="font-medium text-gray-800 dark:text-white">
                {selectedMessage.name}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {selectedMessage.email}
              </p>
              {selectedMessage.phoneNumber && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Phone: {selectedMessage.phoneNumber}
                </p>
              )}
            </div>

            <div className="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/30">
              <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Details
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Date:</span>{" "}
                {new Date(selectedMessage.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Time:</span>{" "}
                {new Date(selectedMessage.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
              {location && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Location:</span> {location}
                </p>
              )}
              {selectedMessage.productCodes && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Product Codes:</span>{" "}
                  {selectedMessage.productCodes}
                </p>
              )}
              {selectedMessage.page && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Source:</span>{" "}
                  {selectedMessage.page}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={`ml-2 rounded-full px-2 py-1 text-xs ${
                    selectedMessage.isRead
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {selectedMessage.isRead ? "Read" : "Unread"}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/30">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                Message
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedMessage.message.length} characters
              </span>
            </div>

            <div className="rounded border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
              <div className="whitespace-pre-wrap break-words leading-relaxed text-gray-700 dark:text-gray-300">
                {formatMessage(selectedMessage.message)}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/30">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
