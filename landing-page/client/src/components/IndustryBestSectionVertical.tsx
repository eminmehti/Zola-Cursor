import { FadeInUpDiv } from "@/lib/animations";
import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { useLayoutEffect } from "react";

export default function IndustryBestSectionVertical() {
  // Feature cards data with the updated content
  const features = [
    {
      title: "UAE's First AI-Powered Consultancy",
      description: "Zola leverages cutting-edge artificial intelligence to revolutionize the business incorporation process in the UAE, providing unprecedented accuracy and speed.",
      icon: "fas fa-robot",
      accentColor: "#8A6FE8",
      glowColor: "rgba(138, 111, 232, 0.15)" 
    },
    {
      title: "AI-Powered Solutions",
      description: "Our proprietary AI system scans, validates, and processes all required documentation in minutes, not days, with 99.9% accuracy.",
      icon: "fas fa-microchip",
      accentColor: "#5EBBAC",
      glowColor: "rgba(94, 187, 172, 0.15)"
    },
    {
      title: "Unmatched Efficiency",
      description: "What traditionally takes weeks is completed in days with our streamlined processes and AI-assisted document verification system.",
      icon: "fas fa-bolt",
      accentColor: "#E8896F",
      glowColor: "rgba(232, 137, 111, 0.15)"
    },
    {
      title: "Streamlined End-to-End Process",
      description: "From initial consultation to final incorporation, our seamless workflow eliminates bureaucratic hurdles and expedites your business launch.",
      icon: "fas fa-chart-line",
      accentColor: "#6F8AE8",
      glowColor: "rgba(111, 138, 232, 0.15)"
    },
    {
      title: "Cost-Effective Service",
      description: "No hidden fees or surprise charges. Our all-inclusive packages provide complete cost transparency while reducing operational expenses.",
      icon: "fas fa-coins",
      accentColor: "#DFB059",
      glowColor: "rgba(223, 176, 89, 0.15)"
    },
    {
      title: "All-in-One Portal",
      description: "Monitor your business setup progress in real-time through our intuitive dashboard with milestone notifications and comprehensive support.",
      icon: "fas fa-tablet-alt",
      accentColor: "#5EA0D0",
      glowColor: "rgba(94, 160, 208, 0.15)"
    }
  ];
  
  // State for section control
  const [isInView, setIsInView] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Refs for DOM elements
  const sectionRef = useRef<HTMLElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  
  // Check if the left panel is in view
  const isLeftPanelInView = useInView(leftPanelRef, { once: false, amount: 0.4 });
  
  // Animation controls
  const backgroundGlowControls = useAnimation();
  const titleControls = useAnimation();
  
  // Particle animation setup
  const [particles, setParticles] = useState(Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 0.5 + 0.2,
    opacity: Math.random() * 0.5 + 0.3
  })));
  
  // Run particle animation
  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: (particle.y + particle.speed) % 100,
        x: particle.x + (Math.sin(particle.y / 10) * 0.2),
        opacity: 0.3 + Math.sin(Date.now() / 1000 + particle.id) * 0.2
      })));
    }, 50);
    
    return () => clearInterval(interval);
  }, [isInView]);

  // Floating animation for visual elements
  const floatingAnimation = {
    y: [0, -8, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };
  
  // GSAP ScrollTrigger initialization
  useLayoutEffect(() => {
    if (!sectionRef.current || !cardsContainerRef.current) return;
    
    // Initialize GSAP animations
    const cards = cardRefs.current.filter(Boolean);
    let ctx = gsap.context(() => {
      // Basic setup - ensure the section is tall enough
      gsap.set(sectionRef.current, {
        minHeight: `calc(100vh + ${features.length * 60}vh)` // Make taller for smoother scroll
      });
      
      // Set initial states for cards
      cards.forEach((card, index) => {
        if (!card) return;
        
        // Position cards absolutely, initially off-screen below
        gsap.set(card, { 
          y: '100%',
          opacity: 0,
          zIndex: features.length - index,
          position: 'absolute',
          top: 0,
          left: 0, 
          width: '100%'
        });
      });

      // Create the scroll animation sequence
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 20%", // Start when section is 20% in view
          end: `+=${features.length * 60}vh`, // End after scrolling through all cards
          scrub: 0.5, // Smooth scrubbing effect
          pin: cardsContainerRef.current, // Pin the card container
          anticipatePin: 1,
          onUpdate: (self) => {
            // Calculate active card based on scroll progress
            const newActiveIndex = Math.min(
              features.length - 1,
              Math.floor(self.progress * features.length)
            );
            
            if (newActiveIndex !== activeCardIndex) {
              setActiveCardIndex(newActiveIndex);
              
              // Update the progress counter
              if (counterRef.current) {
                counterRef.current.textContent = `${newActiveIndex + 1} / ${features.length}`;
              }
              
              // Update progress bar
              if (progressRef.current) {
                const progressWidth = ((newActiveIndex + 1) / features.length) * 100;
                gsap.to(progressRef.current, {
                  width: `${progressWidth}%`,
                  duration: 0.3,
                  ease: "power1.out"
                });
              }
            }
          }
        }
      });
      
      // Add each card to the timeline
      cards.forEach((card, index) => {
        if (!card) return;
        
        const cardProgress = 1 / features.length;
        const startProgress = index * cardProgress;
        const endProgress = (index + 1) * cardProgress;
        
        // Entry animation (slide up, fade in)
        tl.fromTo(card, 
          { 
            y: index === 0 ? '30%' : '100%',
            opacity: 0
          },
          { 
            y: '0%', 
            opacity: 1,
            duration: cardProgress * 0.5,
            ease: "power2.out" 
          },
          startProgress
        );
        
        // Exit animation (slide up out of view) for all but the last card
        if (index < cards.length - 1) {
          tl.to(card, 
            { 
              y: '-80%', 
              opacity: 0.3,
              ease: "power2.in"
            },
            endProgress - cardProgress * 0.1
          );
        }
      });
    });
    
    // Animation for entering the section
    gsap.fromTo(
      leftPanelRef.current,
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          toggleActions: "play none none reverse"
        } 
      }
    );
    
    // Parallax background effect
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      
      const sectionRect = sectionRef.current.getBoundingClientRect();
      const x = ((e.clientX - sectionRect.left) / sectionRect.width) * 2 - 1;
      const y = ((e.clientY - sectionRect.top) / sectionRect.height) * 2 - 1;
      
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      ctx.revert(); // Clean up all GSAP animations
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [features.length, activeCardIndex]); // Only re-run if feature count or active card changes

  return (
    <section 
      id="industry-best" 
      ref={sectionRef} 
      className="py-20 overflow-hidden relative"
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(246, 246, 249, 1) 0%, rgba(239, 240, 246, 1) 100%)'
      }}
    >
      {/* 3D grid lines background - adds futuristic feel */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `
            linear-gradient(to right, rgba(201, 201, 201, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(201, 201, 201, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: `perspective(1000px) rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * -5}deg)`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out'
        }}></div>
      </div>
      
      {/* Moving particles background */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              background: particle.id % 2 === 0 ? '#1A1B40' : '#C9C9C9',
              boxShadow: particle.id % 3 === 0 ? `0 0 6px ${particle.id % 2 === 0 ? '#1A1B40' : '#C9C9C9'}` : 'none'
            }}
          />
        ))}
      </div>
      
      {/* Main background glow */}
      <motion.div 
        className="absolute top-[30%] left-[50%] w-[90vw] h-[60vh] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ 
          background: 'radial-gradient(ellipse, rgba(138, 111, 232, 0.15), rgba(111, 138, 232, 0.1), transparent 70%)',
          zIndex: 0
        }}
        animate={backgroundGlowControls}
        initial={{ opacity: 0, scale: 0.8 }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h2 className="text-3xl md:text-4xl font-bold font-playfair relative inline-block">
              Industry <span className="text-[#8A6FE8]">Excellence</span>
            </h2>
            <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-[#8A6FE8]/10 via-[#8A6FE8] to-[#8A6FE8]/10"></div>
          </div>
          <p className="mt-4 text-[#384062]/80 text-lg">
            What sets Zola apart as the UAE's leading consultancy service
          </p>
        </div>

        {/* Main grid container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left sticky panel - Fixed content */}
          <div 
            ref={leftPanelRef}
            className="lg:col-span-5 lg:sticky lg:top-32 self-start h-fit z-20"
            style={{ perspective: '1000px' }}
          >
            <div className="pr-6">
              {/* Left panel content with 3D hover effects */}
              <motion.div 
                animate={floatingAnimation}
                className="backdrop-blur-md bg-white/60 border border-white/20 p-8 rounded-sm overflow-hidden relative transition-all duration-300 group"
                style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  transform: isLeftPanelInView ? 
                    `perspective(1000px) rotateY(${mousePosition.x * -5}deg) rotateX(${mousePosition.y * 5}deg)` : 
                    'perspective(1000px) rotateY(0deg) rotateX(0deg)',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.5s ease'
                }}
                whileHover={{ 
                  boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                }}
              >
                {/* 3D floating elements */}
                <div 
                  className="absolute right-12 top-12 w-12 h-12 rounded-full opacity-80"
                  style={{ 
                    background: 'linear-gradient(135deg, #8A6FE8, #6F8AE8)',
                    transform: 'translateZ(20px)',
                    boxShadow: '0 5px 15px rgba(138, 111, 232, 0.3)'
                  }}
                ></div>
                <div 
                  className="absolute left-[25%] bottom-[20%] w-8 h-8 rounded-sm opacity-60 rotate-12"
                  style={{ 
                    background: 'linear-gradient(135deg, #5EBBAC, #6F8AE8)',
                    transform: 'translateZ(30px)',
                    boxShadow: '0 5px 15px rgba(94, 187, 172, 0.3)'
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
                    <h3 className="text-3xl font-bold font-playfair text-primary mb-2 tracking-tight">
                      Get Better Results with
                    </h3>
                    <h3 className="text-3xl font-bold font-playfair mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#8A6FE8] to-[#6F8AE8] animate-text-shimmer">
                      Stunning Features
                    </h3>
                  </div>
                  
                  {/* Description with staggered fade-in */}
                  <p className="text-[#384062]/90 mb-6 font-light leading-relaxed">
                    Zola is revolutionizing the consultancy industry in the UAE by harnessing the power of artificial intelligence to deliver faster, more accurate, and cost-effective business solutions.
                  </p>
                  
                  <p className="text-[#384062]/90 mb-8 font-light leading-relaxed">
                    Our innovative approach combines cutting-edge technology with deep market expertise to streamline every aspect of business incorporation and management.
                  </p>
                  
                  {/* Futuristic feature highlights */}
                  <div className="mb-8 grid grid-cols-2 gap-4">
                    {[
                      { icon: "fas fa-check", text: "AI-Powered" },
                      { icon: "fas fa-check", text: "Time-Saving" },
                      { icon: "fas fa-check", text: "Cost-Effective" },
                      { icon: "fas fa-check", text: "Secure" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#8A6FE8] to-[#6F8AE8] flex items-center justify-center text-white text-xs">
                          <i className={item.icon}></i>
                        </div>
                        <span className="text-sm text-[#384062]">{item.text}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Feature counter - shows which card is active */}
                  <div className="mt-8 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#384062]/70">Feature Progress</span>
                      <span ref={counterRef} className="text-[#8A6FE8] font-medium">
                        1 / {features.length}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-[#F0F0F5] rounded-full overflow-hidden">
                      <div 
                        ref={progressRef}
                        className="h-full bg-gradient-to-r from-[#8A6FE8] to-[#6F8AE8]"
                        style={{ width: '16.6%' }} // 1/6 initially
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Right column with stacked cards that overlay on scroll */}
          <div className="lg:col-span-7 relative z-10">
            {/* Cards container - this gets pinned while scrolling */}
            <div 
              ref={cardsContainerRef}
              className="w-full h-[70vh] flex items-center justify-center overflow-visible"
              style={{ position: 'relative' }}
            >
              {/* The card stack container */}
              <div className="relative w-full max-w-2xl mx-auto h-[500px]">
                {/* The actual cards that will stack and overlay */}
                {features.map((feature, index) => (
                  <div
                    key={index}
                    ref={el => cardRefs.current[index] = el}
                    className="rounded-lg overflow-hidden"
                  >
                    {/* Glow effect behind card */}
                    <div 
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: feature.glowColor,
                        opacity: 0.7,
                        filter: 'blur(20px)',
                        zIndex: -1
                      }}
                    ></div>
                    
                    {/* Card content */}
                    <div 
                      className="backdrop-blur-md border border-white/20 p-8 rounded-sm overflow-hidden relative"
                      style={{
                        borderTopRightRadius: "6rem",
                        borderBottomLeftRadius: "1rem",
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        boxShadow: `0 20px 50px ${feature.glowColor}`
                      }}
                    >
                      {/* Background accent */}
                      <div 
                        className="absolute top-0 right-0 h-full w-24 rounded-tr-[6rem]"
                        style={{
                          background: `linear-gradient(to bottom, ${feature.accentColor}30, ${feature.accentColor}05)`,
                          opacity: 1
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
                          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                          style={{ 
                            backgroundColor: '#f7f5ff',
                            boxShadow: `0 8px 20px ${feature.accentColor}20`
                          }}
                          animate={{
                            boxShadow: [
                              `0 0 0 rgba(${parseInt(feature.accentColor.slice(1,3), 16)}, ${parseInt(feature.accentColor.slice(3,5), 16)}, ${parseInt(feature.accentColor.slice(5,7), 16)}, 0.3)`,
                              `0 0 20px rgba(${parseInt(feature.accentColor.slice(1,3), 16)}, ${parseInt(feature.accentColor.slice(3,5), 16)}, ${parseInt(feature.accentColor.slice(5,7), 16)}, 0.6)`,
                              `0 0 0 rgba(${parseInt(feature.accentColor.slice(1,3), 16)}, ${parseInt(feature.accentColor.slice(3,5), 16)}, ${parseInt(feature.accentColor.slice(5,7), 16)}, 0.3)`
                            ],
                            transition: { duration: 3, repeat: Infinity }
                          }}
                        >
                          <i 
                            className={`${feature.icon} text-2xl`}
                            style={{ color: feature.accentColor }}
                          ></i>
                        </motion.div>
                        
                        {/* Text content */}
                        <div className="flex-1">
                          <h3 
                            className="text-xl font-bold font-playfair mb-3 tracking-tight"
                            style={{ color: feature.accentColor }}
                          >
                            {feature.title}
                          </h3>
                          
                          <p className="text-[#384062] font-light leading-relaxed">
                            {feature.description}
                          </p>
                          
                          {/* Technology chips */}
                          <div className="mt-4 pt-2 flex flex-wrap gap-2">
                            {[
                              { label: "AI", color: feature.accentColor },
                              { label: "Fast", color: feature.accentColor },
                              { label: "Secure", color: feature.accentColor }
                            ].map((chip, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wider"
                                style={{
                                  backgroundColor: `${chip.color}15`,
                                  color: chip.color,
                                  border: `1px solid ${chip.color}30`
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
                  </div>
                ))}
              </div>
            </div>
            
            {/* This spacer creates the scrollable area needed for the GSAP ScrollTrigger effect
                 It's invisible but takes up vertical space to allow scrolling through all cards */}
            <div className="invisible">
              {/* Spacer divs - one for each feature card */}
              {features.map((_, i) => (
                <div key={i} style={{ height: "60vh" }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA panel - appears after viewing all cards */}
        <div className="mt-24 relative z-10">
          <motion.div
            animate={floatingAnimation}
            className="backdrop-blur-xl bg-white/20 border border-white/20 p-10 rounded-sm mx-auto max-w-4xl text-center relative overflow-hidden"
            style={{
              boxShadow: '0 20px 80px rgba(0, 0, 0, 0.07)',
              borderImage: 'linear-gradient(to right, rgba(138, 111, 232, 0.3), rgba(201, 201, 201, 0.1), rgba(111, 138, 232, 0.3)) 1',
              borderImageSlice: 1,
              borderWidth: '1px'
            }}
          >
            {/* Glass reflections and highlights */}
            <div className="absolute -top-[300px] left-1/2 w-[120%] h-[400px] bg-white/10 blur-[80px] rounded-full transform -translate-x-1/2 rotate-12"></div>
            <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-[#8A6FE8]/10 to-transparent blur-xl"></div>
            <div className="absolute -right-20 top-10 w-60 h-60 rounded-full bg-gradient-to-l from-[#6F8AE8]/10 to-transparent blur-xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold font-playfair text-primary mb-3">
                Experience the Future of UAE Business Consulting
              </h3>
              
              <p className="text-[#384062]/80 mb-6 max-w-2xl mx-auto font-light">
                Join the growing number of businesses leveraging our cutting-edge approach to UAE company formation and related services.
              </p>
              
              <motion.a
                href="#contact"
                className="inline-flex items-center px-8 py-3.5 relative rounded-sm overflow-hidden group"
                style={{
                  background: 'linear-gradient(45deg, #1A1B40, #2D2F67)'
                }}
                whileHover={{ 
                  y: -5, 
                  boxShadow: "0 20px 40px rgba(26, 27, 64, 0.3)",
                  scale: 1.03
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Button background animation */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#8A6FE8] to-[#6F8AE8] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                
                {/* Light effect */}
                <span className="absolute inset-0 w-[20%] h-full bg-white/30 skew-x-[45deg] -translate-x-[200%] group-hover:translate-x-[400%] transition-all duration-700 ease-out"></span>
                
                <span className="relative z-10 text-white font-medium">Discover Our Difference</span>
                <i className="fas fa-arrow-right relative z-10 ml-3 text-white group-hover:translate-x-1 transition-transform duration-300"></i>
              </motion.a>
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