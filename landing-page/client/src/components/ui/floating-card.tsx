import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { useRef, useState } from "react";
import { colors } from "../../lib/colors";

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  variant?: "default" | "glass" | "outline" | "luxe" | "minimal" | "accent";
  borderRadius?: number;
  shadow?: boolean;
  background?: string;
  borderColor?: string;
  accentColor?: string;
  borderWidth?: number;
  hoverScale?: number;
  rotateIntensity?: number;
  floatIntensity?: number;
  hoverEffect?: "lift" | "glow" | "outline" | "accent" | "shine" | "none";
  interactive?: boolean;
  glareEffect?: boolean;
  pulseEffect?: boolean;
}

export function FloatingCard({
  children,
  className = "",
  depth = 1,
  variant = "default",
  borderRadius = 2,
  shadow = true,
  background = "white",
  borderColor = "rgba(26, 27, 64, 0.05)",
  accentColor = "#c4b087",
  borderWidth = 1,
  hoverScale = 1.02,
  rotateIntensity = 0.7,
  floatIntensity = 0.1,
  hoverEffect = "lift",
  interactive = true,
  glareEffect = false,
  pulseEffect = false
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for the card
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // For glare effect
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  
  // Smooth spring physics for natural card movement
  const rotateX = useSpring(
    useTransform(y, [-100, 100], [rotateIntensity, -rotateIntensity]), 
    { damping: 25, stiffness: 200 }
  );
  const rotateY = useSpring(
    useTransform(x, [-100, 100], [-rotateIntensity, rotateIntensity]), 
    { damping: 25, stiffness: 200 }
  );

  // Vertical floating animation
  const float = useTransform(
    y, 
    [-100, 100], 
    [floatIntensity, -floatIntensity]
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current || !interactive) return;

    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate the position of the mouse relative to the center of the card
    const xPos = e.clientX - rect.left - rect.width / 2;
    const yPos = e.clientY - rect.top - rect.height / 2;
    
    // Calculate glare position (percentage values)
    const glareXPos = ((e.clientX - rect.left) / rect.width) * 100;
    const glareYPos = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Update motion values
    x.set(xPos);
    y.set(yPos);
    
    if (glareEffect) {
      glareX.set(glareXPos);
      glareY.set(glareYPos);
    }
  }

  // Reset the card position when mouse leaves
  function handleMouseLeave() {
    if (!interactive) return;
    
    x.set(0);
    y.set(0);
    
    if (glareEffect) {
      glareX.set(50);
      glareY.set(50);
    }
    
    setIsHovered(false);
  }
  
  function handleMouseEnter() {
    setIsHovered(true);
  }

  // Apply card styling based on variant
  let cardBackground = background;
  let cardBorderColor = borderColor;
  let cardBorderWidth = borderWidth;
  let cardShadow = "";

  switch (variant) {
    case "glass":
      cardBackground = "rgba(255, 255, 255, 0.7)";
      cardBorderColor = "rgba(255, 255, 255, 0.2)";
      cardBorderWidth = 1;
      break;
    case "outline":
      cardBackground = "transparent";
      cardBorderColor = colors.primary.DEFAULT; 
      cardBorderWidth = 1;
      break;
    case "luxe":
      cardBackground = "#fafafa";
      cardBorderColor = accentColor;
      cardBorderWidth = 1;
      break;
    case "minimal":
      cardBackground = "white";
      cardBorderColor = "transparent";
      cardBorderWidth = 0;
      break;
    case "accent":
      cardBackground = accentColor;
      cardBorderColor = "transparent";
      cardBorderWidth = 0;
      break;
    default:
      break;
  }

  // Apply shadow based on depth and variant
  if (shadow) {
    if (variant === "glass") {
      cardShadow = "shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]";
    } else if (variant === "luxe") {
      cardShadow = depth === 1
        ? "shadow-[0_5px_20px_-5px_rgba(196,176,135,0.1)]"
        : depth === 2
          ? "shadow-[0_10px_30px_-5px_rgba(196,176,135,0.15)]"
          : "shadow-[0_20px_40px_-5px_rgba(196,176,135,0.2)]";
    } else {
      cardShadow = depth === 1
        ? "shadow-sm hover:shadow-md"
        : depth === 2
          ? "shadow-md hover:shadow-lg"
          : "shadow-lg hover:shadow-xl";
    }
  }

  // Generate hover animations based on hoverEffect
  let hoverStyles = {};
  
  if (interactive) {
    switch (hoverEffect) {
      case "lift":
        hoverStyles = { 
          scale: hoverScale, 
          y: -5, 
          transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } 
        };
        break;
      case "glow":
        hoverStyles = {
          boxShadow: `0 10px 25px -10px ${accentColor}40`,
          scale: 1.01,
          transition: { duration: 0.4 }
        };
        break;
      case "outline":
        // Outline effect handled in CSS
        hoverStyles = {
          scale: 1.01,
          transition: { duration: 0.2 }
        };
        break;
      case "accent":
        // Accent effect handled in CSS
        hoverStyles = {
          y: -3,
          transition: { duration: 0.3 }
        };
        break;
      case "shine":
        // Shine effect handled via pseudo-element in CSS
        hoverStyles = {
          scale: 1.01,
          transition: { duration: 0.3 }
        };
        break;
      case "none":
        hoverStyles = {};
        break;
      default:
        hoverStyles = { 
          scale: hoverScale,
          transition: { duration: 0.2 } 
        };
    }
  }

  // Construct the classes based on effects
  const effectClasses = [
    hoverEffect === "outline" ? "hover-outline-effect" : "",
    hoverEffect === "accent" ? "hover-accent-effect" : "",
    hoverEffect === "shine" ? "hover-shine-effect" : "",
    pulseEffect ? "pulse-effect" : "",
    variant === "glass" ? "backdrop-blur-md" : ""
  ].filter(Boolean).join(" ");

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className} ${cardShadow} ${effectClasses} transition-all duration-300`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        background: cardBackground,
        borderRadius: borderRadius,
        border: `${cardBorderWidth}px solid ${cardBorderColor}`,
        transformStyle: "preserve-3d",
        x: interactive ? float : 0,
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
        willChange: "transform, box-shadow"
      }}
      whileHover={interactive ? hoverStyles : {}}
    >
      {/* Glare effect */}
      {glareEffect && interactive && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-40 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 80%)",
            backgroundPosition: `${glareX.get()}% ${glareY.get()}%`,
            backgroundSize: "150% 150%",
            mixBlendMode: "overlay"
          }}
        />
      )}
      
      {/* Border accent for luxe variant */}
      {variant === "luxe" && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c4b087] to-transparent opacity-60"></div>
      )}
      
      {children}
    </motion.div>
  );
}