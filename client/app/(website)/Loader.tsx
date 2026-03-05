"use client";
import React, { useState, useEffect } from "react";

const Loaders = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Path: public/images/loader-img/CH.gif
  const loaderGif = "/loader/CH.gif"; 

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // ⏳ 6 seconds tak dikhega

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      {/* GIF Loader */}
      <img 
        src={loaderGif} 
        alt="Loading..." 
        className="w-32 md:w-56 h-auto" 
      />
    </div>
  );
};

export default Loaders;