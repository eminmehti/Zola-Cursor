import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

interface AnimatedGradientBgProps {
  children: React.ReactNode;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  opacity?: number;
  blur?: number;
  interactive?: boolean;
}

export function AnimatedGradientBg({
  children,
  className = "",
  primaryColor = "#1A1B40",
  secondaryColor = "#2D2F67",
  accentColor = "#c4b087",
  opacity = 0.05,
  blur = 70,
  interactive = true
}: AnimatedGradientBgProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (interactive) {
        setMousePosition({
          x: e.clientX / windowSize.width,
          y: e.clientY / windowSize.height,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [windowSize.width, windowSize.height, interactive]);

  // Convert mouse position to gradient position
  const gradientPosition = {
    x: isMounted ? mousePosition.x * 100 : 50,
    y: isMounted ? mousePosition.y * 100 : 50,
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background gradient that responds to mouse movement */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out z-0"
        style={{
          opacity: isMounted ? opacity : 0,
          backgroundImage: interactive
            ? `radial-gradient(circle at ${gradientPosition.x}% ${gradientPosition.y}%, ${accentColor}40 0%, ${primaryColor}30 30%, ${secondaryColor}20 70%)`
            : `linear-gradient(45deg, ${primaryColor}15, ${secondaryColor}10, ${accentColor}15, ${primaryColor}10)`,
          backgroundSize: interactive ? "100% 100%" : "400% 400%",
          backgroundPosition: "0% 0%",
          backgroundRepeat: "no-repeat",
          animation: !interactive ? "gradient-shift 15s ease infinite" : undefined,
          filter: `blur(${blur}px)`,
        }}
      />

      {/* Animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute rounded-full opacity-20"
          style={{
            width: "40%",
            height: "40%",
            backgroundImage: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            top: "10%",
            right: "10%",
          }}
          animate={{
            x: interactive ? mousePosition.x * 20 - 10 : 0,
            y: interactive ? mousePosition.y * 20 - 10 : 0,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 30 }}
        />
        <motion.div
          className="absolute rounded-full opacity-10"
          style={{
            width: "60%",
            height: "60%",
            backgroundImage: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            bottom: "-20%",
            left: "-10%",
          }}
          animate={{
            x: interactive ? mousePosition.x * -20 + 10 : 0,
            y: interactive ? mousePosition.y * -20 + 10 : 0,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 30 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}