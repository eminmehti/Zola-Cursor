import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeInUpDiv } from "@/lib/animations";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { GradientButton } from "./ui/gradient-button";

export default function IndustryBestSectionCarousel() {
  // State for carousel control
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [cardRevealed, setCardRevealed] = useState<boolean[]>([]);
  
  // References for DOM elements
  const sectionRef = useRef<HTMLElement>(null);
  const featuresTrackRef = useRef<HTMLDivElement>(null);
  
  // Check for mobile view
  const isMobile = useIsMobile();
  
  // Features data with enhanced content
  const features = [
    {
      title: "AI-Powered Solutions",
      description: "Our proprietary AI system scans, validates, and processes all required documentation in minutes, not days, with 99.9% accuracy.",
      content: "Our advanced AI algorithms have been trained on thousands of successful UAE business incorporations, allowing us to anticipate and resolve common issues before they arise. The system continuously learns from each new case, making it increasingly efficient and accurate with every client served.",
      icon: "microchip",
      accentColor: "#8A6FE8",
      tags: [
        { label: "Neural Networks", color: "#8A6FE8" },
        { label: "Document Processing", color: "#6F8AE8" },
        { label: "Real-time Validation", color: "#5EBBAC" }
      ]
    },
    {
      title: "Unmatched Efficiency",
      description: "What traditionally takes weeks is completed in days with our streamlined processes and AI-assisted document verification system.",
      content: "We've optimized every step of the business setup process by eliminating redundancies and unnecessary waiting periods. Our clients experience an average reduction of 67% in total incorporation time compared to traditional consultancy services.",
      icon: "bolt",
      accentColor: "#E8896F",
      tags: [
        { label: "Fast Processing", color: "#E8896F" },
        { label: "Streamlined", color: "#DFB059" },
        { label: "Time-saving", color: "#6F8AE8" }
      ]
    },
    {
      title: "Cost-Effective Service",
      description: "No hidden fees or surprise charges. Our all-inclusive packages provide complete cost transparency while reducing operational expenses.",
      content: "By automating resource-intensive processes, we've reduced our operational costs by 40%, and we pass these savings directly to our clients. Our pricing model is fully transparent with no hidden fees or unexpected charges at any stage of the incorporation process.",
      icon: "coins",
      accentColor: "#DFB059",
      tags: [
        { label: "Transparent Pricing", color: "#DFB059" },
        { label: "All-inclusive", color: "#5EBBAC" },
        { label: "Value-driven", color: "#8A6FE8" }
      ]
    },
    {
      title: "All-in-One Portal",
      description: "Monitor your business setup progress in real-time through our intuitive dashboard with milestone notifications and comprehensive support.",
      content: "Our secure client portal provides a centralized hub for all your incorporation needs. Track document submission status, receive real-time updates, communicate with your dedicated consultant, and access all your incorporation documents in one place.",
      icon: "tablet-alt",
      accentColor: "#5EBBAC",
      tags: [
        { label: "Real-time Tracking", color: "#5EBBAC" },
        { label: "Secure Access", color: "#6F8AE8" },
        { label: "Document Management", color: "#8A6FE8" }
      ]
    },
    {
      title: "Expert Consultancy",
      description: "Our team combines decades of UAE business expertise with cutting-edge technological solutions for unmatched guidance and support.",
      content: "Each of our consultants brings specialized knowledge in different aspects of UAE business incorporation, ensuring you receive precise guidance tailored to your specific industry and business model. We stay continuously updated on the latest regulatory changes to provide accurate, timely advice.",
      icon: "users-cog",
      accentColor: "#6F8AE8",
      tags: [
        { label: "Industry Specialists", color: "#6F8AE8" },
        { label: "Personalized Guidance", color: "#8A6FE8" },
        { label: "Regulatory Experts", color: "#E8896F" }
      ]
    }
  ];

  // Setup carousel events
  useEffect(() => {
    if (!api) return;
    
    // Set initial state
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    
    // Set up event listeners for the carousel
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      // Collapse any expanded card when navigating
      setActiveCard(null);
    };
    
    api.on("select", onSelect);
    
    // Clean up
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);
  
  // Initialize cardRevealed state and trigger animation immediately
  useEffect(() => {
    // Set initial state to all revealed to fix visibility issue
    setCardRevealed(new Array(features.length).fill(true));
  }, [features.length]);
  
  // Setup responsive handling
  useEffect(() => {
    if (!api) return;
    
    const updateCardWidth = () => {
      const viewportWidth = window.innerWidth;
      return viewportWidth > 1024 ? 3 : viewportWidth > 640 ? 2 : 1;
    };
    
    // Handle window resize
    const handleResize = () => {
      // Recalculate visible items based on screen size
      const visibleItems = updateCardWidth();
      
      // If we're at the end of the carousel, adjust position
      if (current > features.length - visibleItems) {
        api?.scrollTo(features.length - visibleItems);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [api, current, features.length]);

  // Function to toggle card expansion
  const toggleCard = (index: number) => {
    if (activeCard === index) {
      setActiveCard(null);
    } else {
      setActiveCard(index);
    }
  };

  // Get the appropriate icon for a feature
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "microchip":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
            <path d="M9 9h6v6H9z" strokeWidth="2" />
            <path d="M4 12h2" strokeWidth="2" />
            <path d="M18 12h2" strokeWidth="2" />
            <path d="M12 4v2" strokeWidth="2" />
            <path d="M12 18v2" strokeWidth="2" />
          </svg>
        );
      case "bolt":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "coins":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="7" r="5" strokeWidth="2" />
            <circle cx="15" cy="17" r="5" strokeWidth="2" />
            <path d="M8 12a5 5 0 0 0 10 0" strokeWidth="2" />
          </svg>
        );
      case "tablet-alt":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case "users-cog":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="7" r="4" strokeWidth="2" />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2" />
            <circle cx="19" cy="11" r="2" strokeWidth="2" />
            <path d="M19 8v1" strokeWidth="2" />
            <path d="M19 13v1" strokeWidth="2" />
            <path d="M16 11h1" strokeWidth="2" />
            <path d="M21 11h1" strokeWidth="2" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" strokeWidth="2" />
            <path d="M12 8v4l3 3" strokeWidth="2" />
          </svg>
        );
    }
  };

  return (
    <section
      id="industry-excellence-section"
      ref={sectionRef}
      className="py-20 relative overflow-hidden bg-gradient-to-b from-[#F8F9FC] to-[#F0F2F9]"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[#1A1B40]/[0.02] z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, #1A1B40 1px, transparent 1px), linear-gradient(to bottom, #1A1B40 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.05
        }}></div>
      </div>
      
      {/* Ambient light effects */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#C9C9C9]/10 blur-[120px]"></div>
      <div className="absolute top-1/2 -right-20 w-96 h-96 rounded-full bg-[#1A1B40]/5 blur-[100px]"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeInUpDiv className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-subtitle text-[#C9C9C9] uppercase tracking-wider text-sm font-medium mb-3 block" style={{ 
            fontFamily: "'Inter', sans-serif", 
            fontSize: '16px', 
            fontWeight: 500, 
            letterSpacing: '0.05em' 
          }}>
            Industry Excellence
          </span>
          <h2 className="section-title text-3xl md:text-4xl lg:text-[42px] font-bold relative inline-block" style={{ 
            fontFamily: "'Poppins', sans-serif", 
            fontWeight: 600, 
            lineHeight: 1.2, 
            letterSpacing: '-0.02em',
            marginBottom: '16px',
            fontSize: '30px' // Mobile first
          }}>
            The Best in the Industry
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-[#C9C9C9] to-[#E5E5E5] mx-auto mt-4 mb-6"></div>
          <p className="section-description mt-4 text-[#384062]/80 text-lg" style={{ 
            fontFamily: "'Inter', sans-serif",
            fontSize: '18px',
            lineHeight: 1.6,
            color: 'var(--color-text-secondary, #384062)',
            maxWidth: '700px',
            margin: '0 auto 48px'
          }}>
            What sets Zola apart as the UAE's leading consultancy service
          </p>
        </FadeInUpDiv>

        <div className="features-showcase mx-auto max-w-7xl overflow-visible" style={{ position: 'relative' }}>
          <Carousel
            setApi={setApi}
            className="w-full"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent 
              className="features-track"
              style={{
                display: 'flex',
                gap: '24px',
              }}
            >
              {features.map((feature, index) => (
                <CarouselItem 
                  key={index} 
                  className="basis-full md:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)] min-w-full sm:min-w-[320px] md:min-w-[280px]"
                >
                  <div className="feature-card p-1 h-full">
                    <motion.div
                      className={`relative bg-white rounded-xl p-8 transition-all duration-500 cursor-pointer h-full overflow-hidden
                        ${activeCard === index ? 'shadow-lg sm:h-[400px] h-auto max-h-[500px]' : 'shadow-md hover:shadow-lg h-[240px]'}
                        ${cardRevealed[index] ? 'revealed' : ''}`}
                      style={{
                        boxShadow: activeCard === index 
                          ? `0 10px 25px rgba(0, 0, 0, 0.08), 0 6px 12px ${feature.accentColor}15`
                          : '0 4px 20px rgba(0, 0, 0, 0.05)'
                      }}
                      initial={{ 
                        opacity: 0, 
                        y: 30
                      }}
                      animate={{ 
                        opacity: 1, 
                        y: 0
                      }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      onClick={() => toggleCard(index)}
                      layout
                    >
                      {/* Card Header */}
                      <div className="flex items-start gap-4">
                        <div 
                          className="feature-icon rounded-full flex items-center justify-center transition-all duration-300"
                          style={{ 
                            width: '48px', 
                            height: '48px',
                            color: feature.accentColor,
                            backgroundColor: `${feature.accentColor}15`,
                          }}
                        >
                          {getIcon(feature.icon)}
                        </div>
                        
                        <div>
                          <h3 
                            className="feature-title font-semibold text-xl transition-all duration-300"
                            style={{ 
                              color: feature.accentColor,
                              fontWeight: 600,
                              letterSpacing: '-0.01em'
                            }}
                          >
                            {feature.title}
                          </h3>
                          <p className="feature-description mt-2 text-[#475569]" style={{
                            lineHeight: 1.6,
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Expandable content */}
                      <AnimatePresence>
                        {activeCard === index && (
                          <motion.div 
                            className="feature-content pt-6 mt-6 border-t border-gray-100"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p className="text-[#475569]/90 mb-4" style={{
                              fontFamily: "'Inter', sans-serif", 
                              lineHeight: 1.6,
                              fontSize: '15px'
                            }}>
                              {feature.content}
                            </p>
                            
                            <div className="feature-tags flex flex-wrap gap-2">
                              {feature.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="feature-tag px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${tag.color}15`,
                                    color: tag.color,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '0.02em'
                                  }}
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Hint to expand/collapse */}
                      <div 
                        className="absolute bottom-3 right-3 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300"
                        style={{ 
                          backgroundColor: `${feature.accentColor}10`,
                          color: feature.accentColor,
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-transform duration-300"
                          style={{
                            transform: activeCard === index ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        >
                          {activeCard === index ? (
                            <path d="M18 15l-6-6-6 6" />
                          ) : (
                            <path d="M6 9l6 6 6-6" />
                          )}
                        </svg>
                      </div>
                    </motion.div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Custom navigation controls */}
            <div className="mt-6 sm:mt-8 md:mt-8 lg:mt-8 flex items-center justify-center gap-2">
              <CarouselPrevious 
                className="static transform-none translate-x-0 translate-y-0 mx-2 bg-white border-[#E2E8F0] hover:bg-[#1A1B40] hover:text-white transition-all duration-300"
              />
              
              <div className="dots flex gap-2">
                {Array.from({ length: count }).map((_, index) => (
                  <button
                    key={index}
                    className={`dot transition-all duration-300 ${
                      current === index ? "active w-6 bg-[#1A1B40]" : "w-2 bg-[#E2E8F0]"
                    }`}
                    style={{
                      height: '8px',
                      borderRadius: current === index ? '4px' : '50%'
                    }}
                    onClick={() => api?.scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              <CarouselNext 
                className="static transform-none translate-x-0 translate-y-0 mx-2 bg-white border-[#E2E8F0] hover:bg-[#1A1B40] hover:text-white transition-all duration-300"
              />
            </div>
          </Carousel>
        </div>
        
        {/* CTA Section */}
        <div className="features-cta flex flex-col md:flex-row gap-4 md:gap-6 justify-center mt-16 md:mt-20">
          <GradientButton
            href="#contact"
            size="md"
            variant="primary"
            className="tracking-wide rounded-sm"
            ariaLabel="Discover our difference"
            icon={
              <svg 
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            }
            iconPosition="right"
          >
            Discover Our Difference
          </GradientButton>
        </div>
        

      </div>
    </section>
  );
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
/* Text shimmer animation */
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

/* Features section animations */
.features-showcase {
  position: relative;
}

/* Responsive adjustments for cards */
@media (max-width: 640px) {
  .features-track {
    flex-direction: column;
    gap: 16px;
  }
  
  .feature-card {
    flex: 0 0 100%;
    min-width: 100%;
  }
  
  .section-title {
    font-size: 30px;
  }
  
  .controls {
    margin-top: 24px;
  }
  
  .feature-card.active {
    height: auto;
    max-height: 500px;
  }
}
`;
document.head.appendChild(style);