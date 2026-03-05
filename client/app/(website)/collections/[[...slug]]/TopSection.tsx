import React, { memo } from "react";

const TopSection = ({
  subCategoryId,
  name,
}: {
  subCategoryId: number;
  name: string;
}) => {
  const videoMap = {
    80: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Homepage-videos/Sequence%2001.mp4",
    82: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Homepage-videos/Sequence%2001_1.mp4",
    83: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Homepage-videos/Sequence%2001_1.mp4",
    84: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Homepage-videos/Sequence%2001_4.mp4",
    85: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Homepage-videos/Sequence%2001_1.mp4",
  };

  const customVideo = videoMap[subCategoryId];
  const showMultipleVideos = [65, 67, 68].includes(subCategoryId);

  const getVideoSrc = () => {
    if (customVideo) return customVideo;
    return "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/vidieos/bannervideo.mp4";
  };

  return (
    <section className="relative flex h-[50vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-[1] bg-black/50"></div>

      {showMultipleVideos ? (
        <div className="absolute inset-0 z-0 flex h-full w-full">
          {[
            "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/NewUplodes/HEIA0374.mp4",
            "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/NewUplodes/LPUZ7971.mp4",
            "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/NewUplodes/PNPL0514.mp4",
            "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/NewUplodes/INKV6548.mp4",
          ].map((src, idx) => (
            <video
              key={idx}
              className="h-full w-1/4 object-cover will-change-transform"
              src={src}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              controlsList="nodownload"
            />
          ))}
        </div>
      ) : (
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover will-change-transform"
          src={getVideoSrc()}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controlsList="nodownload"
        />
      )}

{/* <h1 className="z-[2] text-center font-adornstoryserif text-3xl font-bold tracking-wide text-white">
        {name}
      </h1> */}
    </section>
  );
};

export default memo(TopSection);
