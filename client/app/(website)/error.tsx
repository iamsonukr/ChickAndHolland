"use client";

const Error = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-2">
      <h2 className="text-center text-lg text-destructive md:text-2xl">
        Something went wrong! Please try again later
      </h2>
    </div>
  );
};

export default Error;
