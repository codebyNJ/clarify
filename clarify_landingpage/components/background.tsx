"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const getFileExtension = (url: string): string => {
  return url.split(".").pop()?.toLowerCase() || "";
};

const isVideo = (extension: string): boolean => {
  const videoExtensions = ["mp4", "webm", "ogg", "mov", "avi", "m4v"];
  return videoExtensions.includes(extension);
};

const VideoWithPlaceholder = ({
  src,
  className,
  placeholder,
}: {
  src: string;
  className?: string;
  placeholder?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && !placeholder) {
      console.warn("No placeholder provided for video");
    }
  }, [placeholder]);

  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      const handleLoadedData = () => {
        setVideoLoaded(true);
      };
      
      const handleCanPlay = () => {
        setVideoLoaded(true);
      };

      video.addEventListener("loadeddata", handleLoadedData);
      video.addEventListener("canplay", handleCanPlay);
      video.load();
      
      if (video.readyState >= 2) {
        setVideoLoaded(true);
      }
      
      return () => {
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("canplay", handleCanPlay);
      };
    }
  }, [src]);

  useEffect(() => {
    if (videoRef.current && videoLoaded) {
      videoRef.current.play();
    }
  }, [videoLoaded]);

  return (
    <div className="contents">
      {placeholder ? (
        <Image
          src={placeholder}
          loading="eager"
          priority
          sizes="100vw"
          alt="Background"
          className={cn(className, { invisible: videoLoaded })}
          quality={100}
          fill
        />
      ) : null}
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        loop
        controls={false}
        preload="auto"
        className={cn(className, { invisible: !videoLoaded })}
      />
    </div>
  );
};

export const Background = ({
  src,
  placeholder,
}: {
  src: string;
  placeholder?: string;
}) => {
  const extension = getFileExtension(src);
  const isVideoFile = isVideo(extension);

  const classNames =
    "absolute bg-background left-4 md:left-8 lg:left-12 top-0 w-full h-full object-cover rounded-[20px] md:rounded-[28px]";

  const content = isVideoFile ? (
    <VideoWithPlaceholder src={src} className={classNames} placeholder={placeholder} />
  ) : (
    <Image
      priority
      loading="eager"
      src={src}
      alt="Background"
      className={classNames}
      sizes="100vw"
      fill
    />
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}>
      {content}
    </motion.div>
  );
};
