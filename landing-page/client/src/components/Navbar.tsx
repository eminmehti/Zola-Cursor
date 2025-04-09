import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { colors } from "../lib/colors";
import { typographyClasses, letterSpacings } from "../lib/fonts";
import { GradientButton } from "./ui/gradient-button";

// Refined navigation links with optimized structure for premium experience
const navLinks = [
  { text: "Services", href: "#services", icon: "fas fa-briefcase" },
  { text: "Process", href: "#process", icon: "fas fa-route" },
  { text: "Why UAE", href: "#why-uae", icon: "fas fa-map-marker-alt" },
  { text: "Industry Excellence", href: "#industry-best", icon: "fas fa-award" },
  { text: "Direct Comparison", href: "#comparison-section", icon: "fas fa-chart-bar" },
  { text: "Testimonials", href: "#testimonials", icon: "fas fa-star" },
  { text: "Blog", href: "#blog", icon: "fas fa-rss" },
  { text: "FAQ", href: "#faq", icon: "fas fa-question-circle" },
  { text: "Contact", href: "#contact", icon: "fas fa-envelope" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }
      
      // Handle navbar visibility
      if (scrollDirection === "down" && currentScrollY > 80) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      
      // Update scrolled state for styling
      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Determine active section for highlighting
      const sections = navLinks.map(link => link.href.substring(1));
      
      // Find the section that is currently in view
      let currentSection = "";
      let maxVisibility = 0;

      sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          
          // Calculate how much of the section is visible
          const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
          const visibility = visibleHeight > 0 ? visibleHeight / Math.max(rect.height, 1) : 0;
          
          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            currentSection = sectionId;
          }
        }
      });

      setActiveSection(`#${currentSection}`);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Call once on mount
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, scrollDirection]);

  const handleToggle = () => setIsOpen(!isOpen);

  const scrollToSection = (sectionId: string) => {
    setIsOpen(false);
    const element = document.querySelector(sectionId);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  const navbarVariants = {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
    hidden: { y: -100, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }
  };

  const mobileMenuVariants = {
    closed: { 
      height: 0, 
      opacity: 0,
      transition: { 
        duration: 0.3,
        opacity: { duration: 0.2 }
      }
    },
    open: { 
      height: "auto", 
      opacity: 1,
      transition: { 
        duration: 0.4,
        opacity: { duration: 0.3, delay: 0.1 }
      }
    }
  };

  return (
    <motion.nav 
      initial="initial"
      animate={isNavVisible ? (scrolled ? "visible" : "animate") : "hidden"}
      variants={navbarVariants}
      className={cn(
        "fixed w-full z-50 transition-all duration-300",
        scrolled 
          ? "py-3 backdrop-blur-xl bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)]" 
          : "py-5 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo - enhanced with luxury styling */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative flex items-center">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center"
              >
                <span className="text-2xl font-bold tracking-tight text-[#1A1B40] mr-[0.5px]">
                  ZOLA
                </span>
                <span className="text-2xl text-[#c4b087]">.</span>
              </motion.div>
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                whileHover={{ width: '100%', opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className="absolute -bottom-0.5 left-0 h-[1.5px] bg-gradient-to-r from-[#c4b087] to-[#c4b087]/0"
              ></motion.div>
            </div>
          </Link>

          {/* Desktop navigation - enhanced with luxury styling */}
          <div className="hidden md:block">
            <div className="relative" ref={navRef}>
              <div className="flex items-center space-x-1 lg:space-x-1">
                {navLinks.map((link, index) => (
                  <motion.button
                    key={index}
                    data-href={link.href}
                    onClick={() => scrollToSection(link.href)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative px-4 py-2 text-sm transition-all duration-300 group overflow-hidden",
                      activeSection === link.href 
                        ? "text-[#c4b087]" 
                        : "text-[#1A1B40]/80 hover:text-[#1A1B40]"
                    )}
                  >
                    {/* Subtle hover background */}
                    <div className="absolute inset-0 bg-[#1A1B40]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Link text with minimal icon */}
                    <div className="relative flex items-center space-x-1.5">
                      <span className={`text-[13px] tracking-wide font-medium transition-colors duration-300 ${activeSection === link.href ? 'text-[#c4b087]' : ''}`}>
                        {link.text.toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Active indicator */}
                    {activeSection === link.href && (
                      <motion.div 
                        layoutId="activeSection"
                        className="absolute bottom-0 left-0 right-0 mx-auto w-5 h-[2px] bg-[#c4b087]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    
                    {/* Hover indicator */}
                    <motion.div 
                      initial={{ scaleX: 0, opacity: 0 }}
                      whileHover={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`absolute bottom-0 left-0 right-0 mx-auto w-5 h-[2px] bg-[#1A1B40]/20 origin-left ${activeSection === link.href ? 'opacity-0' : ''}`}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact button - enhanced with luxury styling */}
          <div className="hidden md:flex items-center">
            {/* Primary CTA button with luxury styling */}
            <GradientButton
              href="/start-now"
              size="sm"
              variant="primary"
              className="tracking-wide rounded-sm"
              ariaLabel="Start now"
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
              START NOW
            </GradientButton>
          </div>

          {/* Mobile menu button - enhanced with luxury styling */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="md:hidden w-10 h-10 flex items-center justify-center text-[#1A1B40] focus:outline-none relative"
            onClick={handleToggle}
            aria-label="Toggle Menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center items-center">
              <span className={`bg-[#1A1B40] block transition-all duration-300 ease-out h-[1px] w-5 rounded-sm ${isOpen ? 'rotate-45 translate-y-[2px]' : '-translate-y-[3px]'}`}></span>
              <span className={`bg-[#1A1B40] block transition-all duration-300 ease-out h-[1px] w-5 rounded-sm my-[2px] ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`bg-[#1A1B40] block transition-all duration-300 ease-out h-[1px] w-5 rounded-sm ${isOpen ? '-rotate-45 -translate-y-[2px]' : 'translate-y-[3px]'}`}></span>
            </div>
          </motion.button>
        </div>

        {/* Mobile navigation - enhanced with luxury styling */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileMenuVariants}
              className="md:hidden overflow-hidden"
            >
              <motion.div 
                className="py-6 px-3 space-y-0.5 mt-4 rounded-sm backdrop-blur-xl bg-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.06)] border-t border-t-[#c4b087]/10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {navLinks.map((link, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => scrollToSection(link.href)}
                    className={cn(
                      "flex items-center w-full py-3 px-4 text-left transition-all relative overflow-hidden group",
                      activeSection === link.href 
                        ? "text-[#c4b087]" 
                        : "text-[#1A1B40]/80 hover:text-[#1A1B40]"
                    )}
                  >
                    {/* Subtle active indicator */}
                    {activeSection === link.href && (
                      <motion.div 
                        layoutId="activeMobileSection"
                        className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#c4b087]"
                      />
                    )}
                    
                    <div className="flex items-center">
                      <span className="text-xs tracking-widest font-medium uppercase">{link.text}</span>
                    </div>
                    
                    {/* Animated arrow on hover */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-auto"
                    >
                      <svg 
                        className="w-3 h-3 text-current opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  </motion.button>
                ))}
                
                <div className="pt-4 mt-4 border-t border-[#1A1B40]/5 flex justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: navLinks.length * 0.04 }}
                  >
                    <GradientButton
                      href="/start-now"
                      size="sm"
                      variant="primary"
                      className="tracking-wide rounded-sm w-full"
                      ariaLabel="Start now"
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
                      START NOW
                    </GradientButton>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Subtle separator line when scrolled */}
      {scrolled && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-0 left-0 h-[1px] w-full bg-[#1A1B40]/[0.03]"
        />
      )}
    </motion.nav>
  );
}
