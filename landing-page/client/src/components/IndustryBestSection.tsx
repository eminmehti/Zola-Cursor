import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { GradientButton } from "./ui/gradient-button";

export default function IndustryBestSection() {
  // Feature cards data with brand color palette
  // Primary colors: #1A1B40 (dark blue), #C9C9C9 (silver), and white
  // With light tones of different colors at 30% opacity for the card accents
  const features = [
    {
      title: "AI-Powered Solutions",
      description: "Our proprietary AI system scans, validates, and processes all required documentation in minutes, not days, with 99.9% accuracy.",
      icon: "fas fa-brain", // Changed to brain icon to better represent AI
      accentColor: "#5E77A6", // Muted blue at 30% opacity
      glowColor: "rgba(94, 119, 166, 0.12)",
      tags: [
        { label: "AI", color: "#5E77A6" },
        { label: "Fast", color: "#5E77A6" },
        { label: "Secure", color: "#5E77A6" }
      ]
    },
    {
      title: "Unmatched Efficiency",
      description: "What traditionally takes weeks is completed in days with our streamlined processes and AI-assisted document verification system.",
      icon: "fas fa-bolt",
      accentColor: "#C9C9C9", // Silver - brand accent
      glowColor: "rgba(201, 201, 201, 0.12)",
      tags: [
        { label: "AI", color: "#C9C9C9" },
        { label: "Fast", color: "#C9C9C9" },
        { label: "Secure", color: "#C9C9C9" }
      ]
    },
    {
      title: "Streamlined End-to-End Process",
      description: "From initial consultation to final incorporation, our seamless workflow eliminates bureaucratic hurdles and expedites your business launch.",
      icon: "fas fa-sitemap", // Changed to sitemap icon to better represent the process flow
      accentColor: "#8B90B0", // Muted lavender at 30% opacity
      glowColor: "rgba(139, 144, 176, 0.12)",
      tags: [
        { label: "AI", color: "#8B90B0" },
        { label: "Fast", color: "#8B90B0" },
        { label: "Secure", color: "#8B90B0" }
      ]
    },
    {
      title: "Cost-Effective Service",
      description: "No hidden fees or surprise charges. Our all-inclusive packages provide complete cost transparency while reducing operational expenses.",
      icon: "fas fa-hand-holding-usd", // Changed to hand holding USD to better represent cost savings
      accentColor: "#1A1B40", // Dark blue - primary brand color
      glowColor: "rgba(26, 27, 64, 0.12)",
      tags: [
        { label: "AI", color: "#1A1B40" },
        { label: "Fast", color: "#1A1B40" },
        { label: "Secure", color: "#1A1B40" }
      ]
    },
    {
      title: "All-in-One Portal",
      description: "Monitor your business setup progress in real-time through our intuitive dashboard with milestone notifications and comprehensive support.",
      icon: "fas fa-tablet-alt",
      accentColor: "#9A9A9A", // Lighter silver tone
      glowColor: "rgba(154, 154, 154, 0.12)",
      tags: [
        { label: "AI", color: "#9A9A9A" },
        { label: "Fast", color: "#9A9A9A" },
        { label: "Secure", color: "#9A9A9A" }
      ]
    }
  ];

  // Use refs for mouse position to avoid unnecessary renders
  const mousePosition = useRef({ x: 0, y: 0 });
  
  // DOM Refs
  const sectionRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const leftPanelContentRef = useRef<HTMLDivElement>(null);
  
  // Setup mouse move handler for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      
      // Calculate position
      const sectionRect = sectionRef.current.getBoundingClientRect();
      const x = ((e.clientX - sectionRect.left) / sectionRect.width) * 2 - 1;
      const y = ((e.clientY - sectionRect.top) / sectionRect.height) * 2 - 1;
      
      // Store in ref - no state update, no re-render
      mousePosition.current = { x, y };
      
      // Update DOM directly
      if (gridRef.current) {
        gridRef.current.style.transform = `perspective(1000px) rotateX(${y * 5}deg) rotateY(${x * -5}deg)`;
      }
      
      if (leftPanelContentRef.current) {
        leftPanelContentRef.current.style.transform = `perspective(1000px) rotateY(${x * -5}deg) rotateX(${y * 5}deg)`;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Floating animation for visual elements
  const floatingAnimation = {
    y: [0, -8, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <section 
      id="industry-best" 
      ref={sectionRef} 
      className="py-28 overflow-hidden relative"
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(250, 250, 252, 1) 0%, rgba(245, 246, 250, 1) 100%)'
      }}
    >
      {/* 3D grid lines and micro-detail patterns background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div 
          ref={gridRef}
          className="absolute inset-0" 
          style={{ 
            backgroundImage: `
              linear-gradient(to right, rgba(201, 201, 201, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(201, 201, 201, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out'
          }}
        ></div>
      </div>

      {/* Additional subtle micro dots pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(#1A1B40 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '10px 10px',
        }}
      ></div>

      {/* Ultra-subtle floating diagonal lines */}
      <div className="absolute inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #C9C9C9, #C9C9C9 1px, transparent 1px, transparent 20px)`,
          backgroundSize: '30px 30px',
        }}
      ></div>
      
      {/* Main background glow - using limited color palette */}
      <motion.div 
        className="absolute top-[30%] left-[50%] w-[90vw] h-[60vh] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ 
          background: 'radial-gradient(ellipse, rgba(138, 111, 232, 0.08), rgba(111, 138, 232, 0.05), transparent 70%)',
          zIndex: 0
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 2 }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <div className="relative inline-block">
            <h2 className="relative inline-block">
              <span className="text-3xl md:text-5xl font-light font-sans tracking-wide block md:inline">
                Industry
              </span>{" "}
              <span className="text-3xl md:text-5xl font-bold text-[#1A1B40] block md:inline">
                Excellence
              </span>
            </h2>
            <div className="absolute -bottom-3 left-0 w-full h-0.5 bg-gradient-to-r from-[#C9C9C9]/10 via-[#1A1B40] to-[#C9C9C9]/10"></div>
          </div>
          <p className="mt-6 text-[#384062]/80 text-lg leading-relaxed max-w-2xl mx-auto" style={{ fontWeight: 300 }}>
            What sets Zola apart as the UAE's leading consultancy service
          </p>
        </div>

        {/* Main grid container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column - fixed content */}
          <div 
            ref={leftPanelRef}
            className="lg:col-span-5 lg:sticky lg:top-32 self-start h-fit z-20 relative"
          >
            {/* Abstract geometric shape for visual interest */}
            <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] opacity-[0.08] z-0 pointer-events-none">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="#1A1B40" d="M44.7,-76.4C58.9,-69.2,71.8,-59.3,79.6,-46.1C87.4,-32.9,90.2,-16.4,88.8,-0.8C87.4,14.8,81.8,29.6,73.5,42.8C65.2,56,54.2,67.6,41.2,75.2C28.1,82.9,14.1,86.6,-0.8,87.9C-15.6,89.2,-31.2,88,-44.9,81.3C-58.5,74.6,-70.2,62.4,-78.9,47.8C-87.6,33.3,-93.3,16.6,-93.3,0C-93.4,-16.6,-87.7,-33.3,-78.1,-46.6C-68.5,-59.9,-55,-69.8,-40.9,-76.9C-26.8,-84,-13.4,-88.3,0.5,-89.1C14.3,-89.9,28.7,-87.3,44.7,-76.4Z" transform="translate(100 100)" />
              </svg>
            </div>
            <div className="pl-4 pr-6 lg:pl-8">
              {/* Left panel content with 3D hover effects */}
              <motion.div 
                ref={leftPanelContentRef}
                animate={floatingAnimation}
                className="backdrop-blur-md bg-white/60 border border-white/20 p-8 rounded-sm overflow-hidden relative transition-all duration-300 group"
                style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.5s ease'
                }}
                whileHover={{ 
                  boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                }}
              >
                {/* 3D floating elements - using limited color palette */}
                <div 
                  className="absolute right-12 top-12 w-12 h-12 rounded-full opacity-80"
                  style={{ 
                    background: 'linear-gradient(135deg, #1A1B40, #2D2F67)',
                    transform: 'translateZ(20px)',
                    boxShadow: '0 5px 15px rgba(26, 27, 64, 0.3)'
                  }}
                ></div>
                <div 
                  className="absolute left-[25%] bottom-[20%] w-8 h-8 rounded-sm opacity-60 rotate-12"
                  style={{ 
                    background: 'linear-gradient(135deg, #1A1B40, #C9C9C9)',
                    transform: 'translateZ(30px)',
                    boxShadow: '0 5px 15px rgba(26, 27, 64, 0.3)'
                  }}
                ></div>
                
                {/* Glass reflection effects */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 blur-xl rounded-full transform rotate-12"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 blur-lg rounded-full"></div>
                
                {/* Light refraction on hover */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(201,201,201,0.1) 100%)",
                  }}
                />
                
                {/* Content with 3D transforms */}
                <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
                  {/* Title with animated gradient */}
                  <div>
                    <h3 className="text-2xl md:text-3xl font-light text-primary mb-2 tracking-wide">
                      Get Better Results with
                    </h3>
                    <h3 className="text-2xl md:text-3xl font-bold mb-10 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1A1B40] to-[#C9C9C9] animate-text-shimmer">
                      Stunning Features
                    </h3>
                  </div>
                  
                  {/* Description with staggered fade-in */}
                  <p className="text-[#384062]/90 mb-6 font-light leading-[1.6] tracking-wide">
                    Zola is revolutionizing the consultancy industry in the UAE by harnessing the power of artificial intelligence to deliver faster, more accurate, and cost-effective business solutions.
                  </p>
                  
                  <p className="text-[#384062]/90 mb-10 font-light leading-[1.6] tracking-wide">
                    Our innovative approach combines cutting-edge technology with deep market expertise to streamline every aspect of business incorporation and management.
                  </p>
                  
                  {/* Futuristic feature highlights with subtle separators */}
                  <div className="mb-8 relative">
                    {/* Subtle background separator lines */}
                    <div className="absolute left-5 top-1 bottom-1 w-[1px] bg-gradient-to-b from-[#C9C9C9]/0 via-[#C9C9C9]/10 to-[#C9C9C9]/0"></div>
                    <div className="absolute right-1/2 top-1 bottom-1 w-[1px] bg-gradient-to-b from-[#C9C9C9]/0 via-[#C9C9C9]/10 to-[#C9C9C9]/0"></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: "fas fa-check", text: "AI-Powered" },
                        { icon: "fas fa-check", text: "Time-Saving" },
                        { icon: "fas fa-check", text: "Cost-Effective" },
                        { icon: "fas fa-check", text: "Secure" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#1A1B40] to-[#2D2F67] flex items-center justify-center text-white text-xs shadow-lg shadow-gray-500/10">
                            <i className={item.icon}></i>
                          </div>
                          <span className="text-sm text-[#384062] font-light">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Horizontal separator line at bottom */}
                    <div className="mt-4 h-[1px] w-full bg-gradient-to-r from-[#C9C9C9]/0 via-[#C9C9C9]/10 to-[#C9C9C9]/0"></div>
                  </div>
                  
                  {/* Premium CTA button - replaced with GradientButton */}
                  <div className="text-center">
                    <GradientButton
                      href="/stage2/UI1.html"
                      size="md"
                      variant="primary"
                      className="rounded-sm tracking-wide"
                      ariaLabel="Learn more about our services"
                      icon={
                        <svg 
                          className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      }
                      iconPosition="right"
                    >
                      Learn More
                    </GradientButton>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Right column - simple vertical stack of cards */}
          <div className="lg:col-span-7 relative z-10">
            <div className="space-y-12 w-[95%] mx-auto">
              {/* Simple vertical stack of feature cards with increased spacing */}
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="feature-card transition-all duration-300"
                  style={{
                    borderRadius: "16px",
                    boxShadow: `0 12px 24px rgba(0, 0, 0, 0.04), 0 4px 8px ${feature.glowColor}20`
                  }}
                  whileHover={{ 
                    y: -5,
                    scale: 1.02,
                    boxShadow: `0 16px 30px rgba(0, 0, 0, 0.06), 0 6px 12px ${feature.glowColor}30`
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Card Content with background color shift on hover */}
                  <div 
                    className="backdrop-blur-md p-8 rounded-xl overflow-hidden relative group transition-all duration-300"
                    style={{
                      background: `linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.87))`,
                      boxShadow: `0 4px 20px rgba(0, 0, 0, 0.08)`,
                      padding: '32px',
                      transition: 'background 0.3s ease-out',
                    }}
                  >
                    {/* Hover background layer - will be visible on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.92))`,
                        zIndex: 1,
                        borderRadius: 'inherit'
                      }}
                    ></div>
                    {/* Glow effect behind card */}
                    <div 
                      className="absolute inset-0 -z-10 rounded-lg"
                      style={{
                        background: feature.glowColor,
                        opacity: 0.7,
                        filter: 'blur(20px)'
                      }}
                    ></div>

                    {/* Background accent */}
                    <div 
                      className="absolute top-0 right-0 h-full w-24"
                      style={{
                        background: `linear-gradient(to bottom, ${feature.accentColor}15, ${feature.accentColor}05)`,
                        borderTopRightRadius: '16px',
                        borderBottomRightRadius: '16px',
                      }}
                    ></div>
                    
                    {/* Animated dots pattern */}
                    <div className="absolute inset-0 overflow-hidden opacity-10">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: feature.accentColor,
                            top: `${15 + (i * 20)}%`,
                            right: `${10 + (i % 3) * 5}%`,
                            opacity: 0.7
                          }}
                          animate={{
                            opacity: [0.3, 0.7, 0.3],
                            scale: [0.8, 1.2, 0.8],
                            transition: { 
                              duration: 3, 
                              repeat: Infinity, 
                              delay: i * 0.4 
                            }
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Feature card content */}
                    <div className="relative z-10 flex items-start gap-6">
                      {/* Icon with animation */}
                      <motion.div 
                        className="w-[72px] h-[72px] rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{ 
                          backgroundColor: `${feature.accentColor}08`,
                          boxShadow: `0 8px 24px ${feature.accentColor}10`
                        }}
                        animate={{
                          boxShadow: [
                            `0 0 0 rgba(${parseInt(feature.accentColor.slice(1,3), 16)}, ${parseInt(feature.accentColor.slice(3,5), 16)}, ${parseInt(feature.accentColor.slice(5,7), 16)}, 0.1)`,
                            `0 0 20px rgba(${parseInt(feature.accentColor.slice(1,3), 16)}, ${parseInt(feature.accentColor.slice(3,5), 16)}, ${parseInt(feature.accentColor.slice(5,7), 16)}, 0.2)`,
                            `0 0 0 rgba(${parseInt(feature.accentColor.slice(1,3), 16)}, ${parseInt(feature.accentColor.slice(3,5), 16)}, ${parseInt(feature.accentColor.slice(5,7), 16)}, 0.1)`
                          ],
                          transition: { duration: 3, repeat: Infinity }
                        }}
                        whileHover={{ 
                          scale: 1.08,
                          rotate: 5,
                          backgroundColor: `${feature.accentColor}15` 
                        }}
                      >
                        {/* Custom monoline icon with 2px stroke */}
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={feature.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {feature.title.includes("AI") && (
                            <>
                              <circle cx="12" cy="9" r="5" />
                              <path d="M12 14v2" />
                              <path d="M8 17h8" />
                              <path d="M8 3l1 2" />
                              <path d="M16 3l-1 2" />
                              <path d="M9 14a8 8 0 0 0 8 0" />
                            </>
                          )}
                          {feature.title.includes("Efficiency") && (
                            <>
                              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </>
                          )}
                          {feature.title.includes("Process") && (
                            <>
                              <rect x="3" y="3" width="18" height="5" rx="1" />
                              <rect x="3" y="15" width="5" height="6" rx="1" />
                              <rect x="9.5" y="15" width="5" height="6" rx="1" />
                              <rect x="16" y="15" width="5" height="6" rx="1" />
                              <path d="M12 8v3" />
                              <path d="M5.5 11.5h13" />
                              <path d="M5.5 11.5L9 15" />
                              <path d="M12 11.5V15" />
                              <path d="M18.5 11.5L15 15" />
                            </>
                          )}
                          {feature.title.includes("Cost") && (
                            <>
                              <path d="M6 12h3a3 3 0 0 0 0-6H4.5a1.5 1.5 0 0 0-1.5 1.5V18c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-5" />
                              <path d="M12 6v16" />
                              <path d="M 12 6 a 4 4 0 0 1 4 4" />
                              <path d="M 16 3 v 4" />
                              <path d="M 14 5 h 4" />
                            </>
                          )}
                          {feature.title.includes("Portal") && (
                            <>
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M3 9h18" />
                              <path d="M9 21V9" />
                            </>
                          )}
                          {feature.title.includes("Consultancy") && (
                            <>
                              <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H10" />
                              <path d="M14 2h3.5A2.5 2.5 0 0120 4.5v15" />
                              <path d="M12 22l-2-2m2 2l2-2m-2 2v-5" />
                              <path d="M8 10h8" />
                              <path d="M8 6h4" />
                              <path d="M8 14h4" />
                            </>
                          )}
                        </svg>
                      </motion.div>
                      
                      {/* Text content */}
                      <div className="flex-1">
                        <h3 
                          className="text-xl font-bold mb-3 tracking-tight"
                          style={{ color: feature.accentColor }}
                        >
                          {feature.title}
                        </h3>
                        
                        <p className="text-[#384062]/90 font-light leading-[1.6] tracking-wide" style={{ fontWeight: 300 }}>
                          {feature.description}
                        </p>
                        
                        {/* Technology chips */}
                        <div className="mt-6 pt-2 flex flex-wrap gap-3">
                          {feature.tags.map((chip, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium tracking-wider"
                              style={{
                                backgroundColor: `${chip.color}30`,
                                color: chip.color,
                                border: `1px solid ${chip.color}40`
                              }}
                            >
                              {chip.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress indicator bar at bottom of card */}
                    <div 
                      className="absolute bottom-0 left-0 h-1 w-full"
                      style={{
                        background: `linear-gradient(to right, ${feature.accentColor}, ${feature.accentColor}50, transparent)`,
                        filter: `drop-shadow(0 0 3px ${feature.accentColor}50)`
                      }}
                    ></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA panel */}
        <div className="mt-24 relative z-10">
          <motion.div
            animate={floatingAnimation}
            className="backdrop-blur-xl bg-white/20 p-10 mx-auto max-w-4xl text-center relative overflow-hidden"
            style={{
              borderRadius: '16px',
              padding: '32px',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.87))',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(26, 27, 64, 0.08)'
            }}
          >
            {/* Glass reflections and highlights */}
            <div className="absolute -top-[300px] left-1/2 w-[120%] h-[400px] bg-white/10 blur-[80px] rounded-full transform -translate-x-1/2 rotate-12"></div>
            <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-[#1A1B40]/10 to-transparent blur-xl"></div>
            <div className="absolute -right-20 top-10 w-60 h-60 rounded-full bg-gradient-to-l from-[#C9C9C9]/10 to-transparent blur-xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-primary mb-4 tracking-tight">
                Experience the Future of UAE Business Consulting
              </h3>
              
              <p className="text-[#384062]/80 mb-8 max-w-2xl mx-auto leading-[1.6] tracking-wide" style={{ fontWeight: 300 }}>
                Join the growing number of businesses leveraging our cutting-edge approach to UAE company formation and related services.
              </p>
              
              <a
                href="/stage2/UI1.html"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#1A1B40] to-[#9a8a5a] text-white rounded-none text-lg font-medium tracking-wide group transition-all duration-300"
              >
                Discover Our Difference
                <svg 
                  className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Add this to your global styles or index.css
const style = document.createElement('style');
style.textContent = `
@keyframes text-shimmer {
  0% {
    background-position: -100% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

.animate-text-shimmer {
  animation: text-shimmer 4s ease infinite;
  background-size: 200% auto;
}
`;
document.head.appendChild(style);