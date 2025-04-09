import { FadeInUpDiv, StaggerContainer } from "@/lib/animations";
import { motion, useAnimation, useInView, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { GradientButton } from "./ui/gradient-button";

// Custom hook for 3D perspective tilt effect
function useCardTilt(strength: number = 50) {
  const [isHovering, setIsHovering] = useState(false);
  const [tiltValues, setTiltValues] = useState({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    shadowOpacity: 0.05,
    glowOpacity: 0.5
  });
  
  // Motion values for the card (internal use only)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Update all values when motion values change
  useEffect(() => {
    // Function to calculate and update the tilt values
    const updateTiltValues = () => {
      const xValue = x.get();
      const yValue = y.get();
      
      setTiltValues({
        rotateX: yValue * 2 * strength,
        rotateY: xValue * 2 * -strength,
        scale: isHovering ? 1.02 : 1,
        shadowOpacity: isHovering ? 0.35 : 0.05,
        glowOpacity: isHovering ? 1 : 0.5
      });
    };
    
    // Set up a listener for motion value changes
    const unsubscribeX = x.on("change", updateTiltValues);
    const unsubscribeY = y.on("change", updateTiltValues);
    
    // Initial update
    updateTiltValues();
    
    // Clean up the subscriptions
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [x, y, strength, isHovering]);
  
  function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    if (!isHovering) return;
    
    // Get the dimensions and position of the element
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    
    // Calculate position of the mouse relative to the element (normalized from -0.5 to 0.5)
    const normalizedX = (clientX - left) / width - 0.5;
    const normalizedY = (clientY - top) / height - 0.5;
    
    // Update the motion values
    x.set(normalizedX);
    y.set(normalizedY);
  }
  
  function onMouseEnter() {
    setIsHovering(true);
  }
  
  function onMouseLeave() {
    setIsHovering(false);
    // Reset the card position when the mouse leaves
    x.set(0);
    y.set(0);
  }
  
  return {
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
    style: tiltValues
  };
}

export default function IndustryBestSectionNew() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });
  const controls = useAnimation();
  
  // Custom cursor state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  
  // For sticky scroll behavior with precise control over scroll sections
  const { scrollYProgress } = useScroll({
    target: scrollContainerRef,
    offset: ["start start", "end end"],
  });
  
  // Start animations when section comes into view
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
    
    // Track mouse position for ambient glow effects
    const trackMouse = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', trackMouse);
    return () => window.removeEventListener('mousemove', trackMouse);
  }, [isInView, controls]);

  const features = [
    {
      icon: "fas fa-robot",
      title: "AI-Powered Solutions",
      description: "Our cutting-edge artificial intelligence systems streamline documentation, reduce processing times, and minimize human error in all our services.",
      accentColor: "rgb(193, 217, 255)",
      delay: 0
    },
    {
      icon: "fas fa-bolt",
      title: "Unmatched Efficiency",
      description: "Complete processes in days that traditionally take weeks, with our optimized workflows and automated verification systems.",
      accentColor: "rgb(252, 225, 129)",
      delay: 0.1
    },
    {
      icon: "fas fa-dollar-sign",
      title: "Cost-Effective Service",
      description: "Leverage our technology-driven approach to enjoy premium consulting services at competitive rates without sacrificing quality.",
      accentColor: "rgb(204, 246, 172)",
      delay: 0.2
    },
    {
      icon: "fas fa-users-cog",
      title: "All-in-One Portal",
      description: "Access our exclusive client portal to manage your company formation, visa applications, and banking setup all in one seamless interface.",
      accentColor: "rgb(202, 185, 241)",
      delay: 0.3
    }
  ];

  // Animation for levitation effect
  const floatingAnimation = {
    y: [0, -8, 0, -5, 0],
    transition: {
      duration: 10, 
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut"
    }
  };
  
  // Create interactive glow effect that follows mouse position
  const renderInteractiveGlow = () => {
    if (!isInView) return null;
    
    return (
      <motion.div 
        className="absolute pointer-events-none z-[1]"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          opacity: 0.8
        }}
        transition={{ type: "tween", ease: "linear", duration: 0.1 }}
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,201,201,0.05) 0%, rgba(201,201,201,0) 50%)",
          transform: "translate(-50%, -50%)"
        }}
      />
    );
  };
  
  return (
    <section id="industry-best" className="py-20 relative overflow-hidden" ref={sectionRef}>
      {/* Futuristic mesh background with dynamic lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F7FB] to-[#F5F7FB]/90 z-0">
        {/* Decorative mesh grid with finer details */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(to right, #1A1B40 1px, transparent 1px), linear-gradient(to bottom, #1A1B40 1px, transparent 1px), radial-gradient(circle, #1A1B40 1px, transparent 1px)',
            backgroundSize: '40px 40px, 40px 40px, 80px 80px'
          }}></div>
        </div>
        
        {/* Enhanced ambient light effects for depth with more natural distribution */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#C9C9C9]/15 blur-[120px]"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 rounded-full bg-[#1A1B40]/10 blur-[100px]"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 rounded-full bg-[#1A1B40]/8 blur-[140px] transform -translate-x-1/2"></div>
      </div>
      
      {/* Interactive glow effect following mouse position */}
      {renderInteractiveGlow()}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeInUpDiv className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-[#C9C9C9] uppercase tracking-wider text-sm font-light mb-3 block">
            Industry Excellence
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-playfair relative inline-block">
            The Best in the Industry
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-[#C9C9C9] to-[#E5E5E5] mx-auto mt-4 mb-6"></div>
          <p className="mt-4 text-[#384062]/80 font-light text-lg leading-relaxed">
            What sets Zola apart as the UAE's leading consultancy service
          </p>
        </FadeInUpDiv>

        {/* Sticky scroll container */}
        <div 
          ref={scrollContainerRef}
          className="relative min-h-[150vh]"
        >
          {/* Main content with sticky left panel and scrolling right panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sticky left panel */}
            <motion.div 
              ref={leftPanelRef}
              className="lg:col-span-5 space-y-6 relative z-10 lg:sticky lg:top-24 lg:self-start"
              initial={{ opacity: 0, y: 20 }}
              animate={controls}
              variants={{
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                }
              }}
            >
              {/* Main title card with enhanced 3D effects */}
              <div className="group" onMouseEnter={() => setCursorHover(true)} onMouseLeave={() => setCursorHover(false)}>
                {(() => {
                  // Create a tilt controller for this specific card
                  const tiltCardMain = useCardTilt(10);
                  
                  return (
                    <motion.div 
                      animate={floatingAnimation}
                      // Apply the 3D tilt effect on mouse movement
                      onMouseMove={tiltCardMain.onMouseMove}
                      onMouseEnter={tiltCardMain.onMouseEnter}
                      onMouseLeave={tiltCardMain.onMouseLeave}
                      style={{
                        rotateX: tiltCardMain.style.rotateX,
                        rotateY: tiltCardMain.style.rotateY,
                        transformPerspective: 2000,
                        scale: tiltCardMain.style.scale,
                        boxShadow: `0 20px 50px rgba(0,0,0,${tiltCardMain.style.shadowOpacity})`,
                      }}
                      className="backdrop-blur-md bg-white/60 border border-white/20 p-8 rounded-sm overflow-hidden relative will-change-transform"
                    >
                      {/* Dynamic glass reflections that move with cursor */}
                      <motion.div 
                        className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 blur-xl rounded-full transform rotate-12"
                        style={{ 
                          opacity: tiltCardMain.style.glowOpacity,
                          translateX: -tiltCardMain.style.rotateY, // Move opposite to tilt for realistic light effect
                          translateY: -tiltCardMain.style.rotateX
                        }}
                      />
                      <motion.div 
                        className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 blur-lg rounded-full"
                        style={{ 
                          opacity: tiltCardMain.style.glowOpacity,
                          translateX: tiltCardMain.style.rotateY * 1.5, // Move with tilt for realistic light effect
                          translateY: tiltCardMain.style.rotateX * 1.5
                        }}
                      />
                      
                      {/* Light refraction effect - subtle rainbow edge on hover */}
                      <motion.div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(201,201,201,0.1) 100%)",
                          rotate: tiltCardMain.style.rotateY,
                        }}
                      />
                      
                      {/* Content with parallax effect */}
                      <div className="relative z-10">
                        {/* Title with subtle parallax movement */}
                        <motion.h3 
                          className="text-2xl font-bold font-playfair text-primary mb-4 tracking-tight"
                          style={{ 
                            translateY: tiltCardMain.style.rotateX * -0.3, 
                            translateX: tiltCardMain.style.rotateY * -0.3
                          }}
                        >
                          The Best in the Industry
                        </motion.h3>
                        
                        {/* Description with delayed parallax for depth */}
                        <motion.p 
                          className="text-[#384062]/90 mb-6 font-light leading-relaxed"
                          style={{ 
                            translateY: tiltCardMain.style.rotateX * -0.5, 
                            translateX: tiltCardMain.style.rotateY * -0.5
                          }}
                        >
                          Zola is revolutionizing the consultancy industry in the UAE by harnessing the power of artificial intelligence to deliver faster, more accurate, and cost-effective business solutions.
                        </motion.p>
                        
                        {/* Decorative elements with enhanced parallax movement */}
                        <motion.div 
                          className="flex items-center" 
                          style={{ 
                            translateY: tiltCardMain.style.rotateX * -0.8, 
                            translateX: tiltCardMain.style.rotateY * -0.8
                          }}
                        >
                          <div className="w-14 h-0.5 bg-gradient-to-r from-[#C9C9C9] to-[#C9C9C9]/60"></div>
                          <div className="w-0.5 h-8 ml-1 bg-gradient-to-b from-[#C9C9C9] to-[#C9C9C9]/60"></div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })()}
              </div>
            </motion.div>
            
            {/* Animated scrolling feature cards - right side */}
            <div className="lg:col-span-7 relative z-10 h-[400vh]">
              {features.map((feature, index) => {
                // Create a separate tilt effect controller for each card
                const tiltCard = useCardTilt(15);
                
                // Calculate the scroll trigger points
                const scrollStartPercent = index * 0.25; // Starts at 0, 0.25, 0.5, 0.75
                const scrollEndPercent = scrollStartPercent + 0.25; // Each card appears for 25% of the scroll range
                
                return (
                  <motion.div
                    key={index}
                    className="group h-full lg:sticky lg:top-24 overflow-visible"
                    style={{ opacity: 0 }}
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                    onViewportEnter={() => {
                      // For debugging
                      console.log(`Card ${index} entered viewport`);
                    }}
                  >
                    <motion.div
                      // The animation based on scroll progress
                      style={{
                        opacity: useTransform(
                          scrollYProgress,
                          [scrollStartPercent, scrollStartPercent + 0.05, scrollEndPercent - 0.05, scrollEndPercent],
                          [0, 1, 1, 0]
                        ),
                        y: useTransform(
                          scrollYProgress,
                          [scrollStartPercent, scrollStartPercent + 0.05, scrollEndPercent - 0.05, scrollEndPercent],
                          [100, 0, 0, -100]
                        ),
                        rotateX: tiltCard.style.rotateX,
                        rotateY: tiltCard.style.rotateY,
                        transformPerspective: 2000,
                        scale: tiltCard.style.scale,
                        position: "relative",
                      }}
                      // Apply the 3D tilt effect on mouse movement
                      onMouseMove={tiltCard.onMouseMove}
                      onMouseEnter={tiltCard.onMouseEnter}
                      onMouseLeave={tiltCard.onMouseLeave}
                      className="backdrop-blur-lg bg-white/75 border border-white/20 p-8 rounded-sm 
                               shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden relative will-change-transform"
                    >
                      {/* Advanced glass reflections that react to movement */}
                      <motion.div
                        className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 blur-xl rounded-full transform rotate-12 opacity-40"
                        style={{ opacity: tiltCard.style.glowOpacity }}
                      />
                      <motion.div 
                        className="absolute -bottom-10 -left-10 w-24 h-24 blur-lg rounded-full"
                        style={{ 
                          opacity: tiltCard.style.glowOpacity,
                          background: `radial-gradient(circle, ${feature.accentColor}10 0%, rgba(201,201,201,0.05) 70%)`
                        }}
                      />
                      
                      {/* Main content with parallax effect */}
                      <div className="relative z-10 flex lg:flex-row flex-col gap-6">
                        {/* Icon with 3D-like highlight effect */}
                        <motion.div 
                          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1A1B40]/5 to-[#1A1B40]/10 backdrop-blur-sm flex items-center justify-center shrink-0"
                          style={{ 
                            boxShadow: "inset 0 1px 8px rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.04)",
                            // Subtle movement in the opposite direction to enhance depth perception
                            translateY: tiltCard.style.rotateX,
                            translateX: tiltCard.style.rotateY,
                          }}
                        >
                          <i className={`${feature.icon} text-[#C9C9C9] text-2xl`}></i>
                        </motion.div>
                        
                        {/* Text content with slight movement for parallax effect */}
                        <motion.div 
                          style={{ 
                            translateY: tiltCard.style.rotateX * -0.2,
                            translateX: tiltCard.style.rotateY * -0.2
                          }}
                          className="flex-1"
                        >
                          <h3 className="text-xl font-bold font-playfair mb-3 text-primary tracking-tight">{feature.title}</h3>
                          <p className="text-[#384062]/80 font-light leading-relaxed">{feature.description}</p>
                          
                          {/* Bottom divider */}
                          <div className="mt-4 pt-2 overflow-hidden">
                            <motion.div 
                              initial={{ x: "-100%" }}
                              animate={{ x: 0 }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="h-0.5 w-full"
                              style={{
                                background: `linear-gradient(to right, ${feature.accentColor}90, transparent)`
                              }}
                            ></motion.div>
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Animated highlight on hover */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{ 
                          // Moving highlight based on tilt
                          rotate: String(tiltCard.style.rotateY).includes('px') ? 0 : Number(tiltCard.style.rotateY) * 0.5,
                          skewX: String(tiltCard.style.rotateX).includes('px') ? 0 : Number(tiltCard.style.rotateX) * 0.1,
                          skewY: String(tiltCard.style.rotateY).includes('px') ? 0 : Number(tiltCard.style.rotateY) * 0.1
                        }}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
              
              {/* Invisible spacers to help with scrolling */}
              <div className="w-full h-[100vh]"></div>
            </div>
          </div>
        </div>

        {/* Bottom CTA glass panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={controls}
          variants={{
            visible: { 
              opacity: 1, 
              y: 0, 
              transition: { 
                duration: 0.8, 
                delay: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }
            }
          }}
          className="mt-16 relative z-10"
        >
          <motion.div
            animate={floatingAnimation}
            className="backdrop-blur-lg bg-[#1A1B40]/10 border border-white/10 p-8 rounded-sm mx-auto max-w-4xl text-center relative overflow-hidden"
          >
            {/* Glass reflections */}
            <div className="absolute -top-20 left-1/2 w-80 h-80 bg-white/5 blur-[80px] rounded-full transform -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-bold font-playfair text-primary mb-3">
                Experience the Future of UAE Business Consulting
              </h3>
              <p className="text-[#384062]/80 mb-6 max-w-2xl mx-auto font-light">
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
        </motion.div>
      </div>
    </section>
  );
}