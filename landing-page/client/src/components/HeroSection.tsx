import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { colors } from "../lib/colors";
import { fontSizes, fontWeights, letterSpacings, lineHeights, typographyClasses } from "../lib/fonts";
import { AnimatedGradientBg } from "./ui/animated-gradient-bg";
import { GradientButton } from "./ui/gradient-button";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  
  useEffect(() => {
    // Handle mouse movement for desktop-only interactive elements
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current && !isMobileOrTablet) {
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;
        setCursorPosition({ x, y });
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    // Initial check
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMobileOrTablet]);

  // Calculate movement for parallax effect
  const moveX = cursorPosition.x * 20 - 10; // -10px to 10px
  const moveY = cursorPosition.y * 20 - 10; // -10px to 10px

  // Animation variants
  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: (delay = 0) => ({
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.9, 
        ease: [0.25, 0.1, 0.25, 1],
        delay 
      }
    })
  };

  return (
    <section 
      id="hero"
      ref={containerRef}
      className="relative overflow-hidden h-screen min-h-[700px] md:min-h-[800px] bg-[#fafafa]"
    >
      {/* Luxurious animated gradient background */}
      <AnimatedGradientBg 
        className="absolute inset-0 z-0" 
        primaryColor={colors.primary.DEFAULT}
        secondaryColor={colors.primary.light}
        accentColor={colors.accent.DEFAULT}
        opacity={0.05}
        blur={90}
        interactive={true}
      >
        <div className="hidden"></div>
      </AnimatedGradientBg>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxQTFCNDAiIGZpbGwtb3BhY2l0eT0iMC4wMiIgZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaC00djFoNHYtMXptNiAwaC00djFoNHYtMXptLTYtM2gtNHYxaDR2LTF6bTYgMGgtNHYxaDR2LTF6bS02LTNoLTR2MWg0di0xem0tNi0yaC00djFoNHYtMXptMTIgMGgtNHYxaDR2LTF6bS02LTNoLTR2MWg0di0xem02IDBoLTR2MWg0di0xeiIvPjwvZz48L3N2Zz4=')] opacity-10 z-0"></div>

      {/* Dynamic accent elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Luxury accent elements */}
        <motion.div 
          animate={{ 
            x: isMobileOrTablet ? 0 : moveX * 0.5, 
            y: isMobileOrTablet ? 0 : moveY * 0.5,
            opacity: [0.6, 0.7, 0.6]
          }}
          transition={{ 
            x: { type: "spring", stiffness: 50, damping: 20 },
            y: { type: "spring", stiffness: 50, damping: 20 },
            opacity: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#c4b087]/[0.03] to-transparent blur-3xl"
          style={{ filter: 'blur(120px)' }}
        />
        
        <motion.div 
          animate={{ 
            x: isMobileOrTablet ? 0 : moveX * -0.8, 
            y: isMobileOrTablet ? 0 : moveY * -0.8,
            opacity: [0.5, 0.65, 0.5]
          }}
          transition={{ 
            x: { type: "spring", stiffness: 50, damping: 20 },
            y: { type: "spring", stiffness: 50, damping: 20 },
            opacity: { duration: 7, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bottom-[20%] left-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#1A1B40]/[0.04] to-transparent blur-3xl"
          style={{ filter: 'blur(100px)' }}
        />
      </div>

      {/* Content with enhanced animations and layout */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex flex-col justify-center pt-16">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-5 gap-12 items-center">
          {/* Left side content - text and CTA (spans 3 columns) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Luxury brand badge */}
            <motion.div 
              custom={0.2}
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariant}
              className="inline-flex items-center gap-2 py-1 px-3 rounded-full border border-[#c4b087]/20 bg-white/50 backdrop-blur-sm shadow-sm"
            >
              <span className="text-xs font-medium tracking-widest uppercase text-[#c4b087]">Premium Service</span>
            </motion.div>
            
            {/* Headline with luxury styling */}
            <div className="space-y-3">
              <motion.h1 
                custom={0.3}
                initial="hidden"
                animate="visible"
                variants={fadeInUpVariant}
                className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#18182B] leading-[1.1]"
              >
                <span className="block">Transform Your</span>
                <span className="relative">
                  <span className="relative z-10 inline-block">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#c4b087] to-[#aa9566] mr-2">UAE</span>
                    <span>Business</span>
                  </span>
                  <span className="absolute bottom-2 left-0 w-full h-[6px] bg-[#c4b087]/10 rounded-sm -z-10"></span>
                </span>
                <span className="inline-block">Ambitions into Reality</span>
              </motion.h1>

              <motion.p 
                custom={0.5}
                initial="hidden"
                animate="visible"
                variants={fadeInUpVariant}
                className="text-[#4B4B66] text-lg md:text-xl max-w-2xl leading-relaxed font-light opacity-90"
              >
                Effortlessly navigate the complexities of UAE business setup with our sophisticated, AI-powered solutions. Enjoy streamlined company incorporation, accelerated visa processes, and seamless banking setups—all from one intuitive platform.
              </motion.p>
            </div>

            {/* Enhanced CTA section with luxury styling */}
            <motion.div 
              custom={0.7}
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariant}
              className="flex flex-wrap gap-5 items-center pt-4"
            >
              {/* Primary CTA with premium gradient effect */}
              <GradientButton
                href="/start-now"
                size="md"
                variant="primary"
                className="tracking-wide rounded-sm"
                ariaLabel="Begin consultation"
                icon={
                  <svg 
                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                }
                iconPosition="right"
              >
                START NOW
              </GradientButton>
              
              {/* Secondary CTA - more minimal */}
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="/start-now"
                className="group inline-flex items-center px-6 py-3.5 text-[#1A1B40] text-base font-medium transition-all duration-300"
              >
                <span className="relative overflow-hidden">
                  <span className="relative z-10">Discover Services</span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#c4b087]/40 group-hover:bg-[#c4b087] transition-colors duration-300"></span>
                </span>
                <svg 
                  className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </motion.a>
            </motion.div>
            
            {/* Enhanced Business Metrics section */}
            <motion.div 
              custom={0.9}
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariant}
              className="relative mt-16 grid grid-cols-3 gap-4 max-w-3xl pt-8 border-t border-[#c4b087]/10"
            >
              {[
                { value: "98%", label: "Client Satisfaction", sublabel: "Trusted and verified by thousands" },
                { value: "24h", label: "Response Guarantee", sublabel: "Prompt, professional service every time" },
                { value: "2,500+", label: "Businesses Successfully Launched", sublabel: "Your success story could be next" }
              ].map((stat, index) => (
                <div key={index} className="flex flex-col group">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.6, ease: "easeOut" }}
                    className="text-3xl font-semibold text-[#1A1B40] mb-1 group-hover:text-[#c4b087] transition-colors duration-300"
                  >
                    {stat.value}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + index * 0.1, duration: 0.6 }}
                    className="text-sm font-medium text-[#1A1B40]/90 mb-0.5"
                  >
                    {stat.label}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 + index * 0.1, duration: 0.6 }}
                    className="text-xs text-[#1A1B40]/50"
                  >
                    {stat.sublabel}
                  </motion.span>
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Right side - Luxury branding visual (spans 2 columns) */}
          <motion.div 
            custom={0.6}
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariant}
            className="lg:col-span-2 hidden lg:flex items-center justify-center relative h-[500px]"
          >
            {/* Luxurious Abstract Shape */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Base circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-[#fafafa] border border-[#c4b087]/10 shadow-[0_0_60px_rgba(196,176,135,0.1)] flex items-center justify-center">
                {/* Inner content */}
                <div className="relative flex flex-col items-center justify-center">
                  {/* Decorative elements */}
                  <div className="absolute top-0 left-0 w-full h-full">
                    {/* Decorative lines */}
                    <svg width="100%" height="100%" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="150" cy="150" r="120" stroke="#c4b087" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
                      <circle cx="150" cy="150" r="100" stroke="#c4b087" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
                      <circle cx="150" cy="150" r="80" stroke="#c4b087" strokeWidth="0.5" opacity="0.5" />
                    </svg>
                  </div>
                  
                  {/* Animated rotating elements */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px]"
                  >
                    <svg width="100%" height="100%" viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="125" cy="125" r="120" stroke="url(#gradientRotate)" strokeWidth="0.5" />
                      <defs>
                        <linearGradient id="gradientRotate" x1="0" y1="0" x2="250" y2="250" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#1A1B40" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#c4b087" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
                  
                  {/* Slower counter-rotating element */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px]"
                  >
                    <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="100" cy="100" r="95" stroke="#1A1B40" strokeWidth="0.5" strokeDasharray="1 5" opacity="0.2" />
                    </svg>
                  </motion.div>
                  
                  {/* Logo & name */}
                  <div className="z-10 flex flex-col items-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="w-20 h-20 mb-5 bg-[#1A1B40] rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span className="text-white text-2xl font-bold tracking-widest">Z</span>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1, duration: 1 }}
                      className="text-center"
                    >
                      <div className="text-2xl font-semibold tracking-widest text-[#1A1B40] mb-1">ZOLA</div>
                      <div className="text-xs tracking-[0.15em] uppercase text-[#c4b087] font-medium">Consultancy</div>
                    </motion.div>
                  </div>
                  
                  {/* Floating particles */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        opacity: [0.4, 0.8, 0.4], 
                        scale: [1, 1.2, 1],
                        x: [0, (i % 2 === 0 ? 5 : -5), 0],
                        y: [0, (i % 3 === 0 ? 5 : -5), 0],
                      }}
                      transition={{ 
                        duration: 3 + i % 2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: i * 0.7
                      }}
                      className="absolute w-1.5 h-1.5 rounded-full bg-[#c4b087]"
                      style={{ 
                        top: `${130 + Math.sin(i) * 80}px`, 
                        left: `${130 + Math.cos(i) * 80}px` 
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Enhanced scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer"
        onClick={() => {
          document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <motion.span 
          className="text-[#1A1B40]/60 text-xs tracking-widest uppercase font-medium mb-2"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Discover More
        </motion.span>
        <motion.div 
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-9 rounded-full border border-[#c4b087]/30 flex items-center justify-center"
        >
          <motion.div
            animate={{ height: [3, 6, 3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-0.5 bg-[#c4b087] rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
