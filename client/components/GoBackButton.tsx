"use client";

import { useRouter } from "next/navigation";

type GoBackButtonProps = {
  label?: string;
  className?: string;
  fallbackPath?: string; // if no history
};

export default function GoBackButton({
  label = "Go Back",
  className = "",
  fallbackPath = "/",
}: GoBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800 ${className}`}
    >
      ← {label}
    </button>
  );
}
