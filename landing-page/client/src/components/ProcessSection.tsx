import { FadeInUpDiv, fadeInLeft, fadeInRight, StaggerContainer } from "@/lib/animations";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { GradientButton } from "./ui/gradient-button";

export default function ProcessSection() {
  const [isInView, setIsInView] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const processContainerRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  
  // Function to mark steps as complete
  const markStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => {
      if (prev.includes(stepIndex)) return prev;
      return [...prev, stepIndex];
    });
  };
  
  // Update progress line based on completed steps
  useEffect(() => {
    const updateProgressLine = () => {
      if (!progressLineRef.current) return;
      
      const totalSteps = 5; // Total number of steps
      const progressPercentage = (completedSteps.length / totalSteps) * 100;
      
      // We're updating the CSS custom property using JavaScript
      document.documentElement.style.setProperty(
        '--process-line-progress', 
        `${progressPercentage}%`
      );
    };
    
    updateProgressLine();
  }, [completedSteps]);
  
  // Progressive completion animation for demonstration
  useEffect(() => {
    if (isInView) {
      const timeout1 = setTimeout(() => markStepComplete(0), 1500);
      const timeout2 = setTimeout(() => markStepComplete(1), 2000);
      const timeout3 = setTimeout(() => markStepComplete(2), 2500);
      const timeout4 = setTimeout(() => markStepComplete(3), 3000);
      const timeout5 = setTimeout(() => markStepComplete(4), 3500);
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        clearTimeout(timeout5);
      };
    }
  }, [isInView]);
  
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Add visible class to the process container directly
            if (processContainerRef.current) {
              processContainerRef.current.classList.add('visible');
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    
    // Observe both the section and the process container
    const section = document.getElementById('process');
    const processContainer = processContainerRef.current;
    
    if (section) observer.observe(section);
    if (processContainer) observer.observe(processContainer);
    
    return () => {
      if (section) observer.unobserve(section);
      if (processContainer) observer.unobserve(processContainer);
    };
  }, []);

  const steps = [
    {
      number: "01",
      title: "Clarify Your Needs",
      description: "Share your business goals and requirements with our consultants. We'll help you articulate exactly what services you need for your UAE venture.",
      icon: "fas fa-comments",
      svg: (
        <svg className="step-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.418 16.97 20 12 20C10.5 20 9.10 19.68 7.86 19.12L3 20L4.2 16.25C3.5 15.11 3 13.65 3 12C3 7.582 7.03 4 12 4C16.97 4 21 7.582 21 12Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      number: "02",
      title: "Receive Tailored Proposals",
      description: "Within 24 hours, you'll receive customized proposals designed specifically for your business needs and budget constraints.",
      icon: "fas fa-file-alt",
      svg: (
        <svg className="step-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12H15M9 16H15M9 8H15M5 21H19C20.105 21 21 20.105 21 19V5C21 3.895 20.105 3 19 3H5C3.895 3 3 3.895 3 5V19C3 20.105 3.895 21 5 21Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      number: "03",
      title: "Select Your Preferred Plan",
      description: "Choose the proposal that best aligns with your vision. Our experts are available to answer any questions to help you make an informed decision.",
      icon: "fas fa-check-circle",
      svg: (
        <svg className="step-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12.75L11.25 15L15 9.75M5 4H19C20.105 4 21 4.895 21 6V18C21 19.105 20.105 20 19 20H5C3.895 20 3 19.105 3 18V6C3 4.895 3.895 4 5 4Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      number: "04",
      title: "Submit Your Documents",
      description: "Upload your necessary documents through our intuitive client portal, with step-by-step guidance to ensure a smooth process.",
      icon: "fas fa-upload",
      svg: (
        <svg className="step-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 16L4 17C4 18.657 5.343 20 7 20H17C18.657 20 20 18.657 20 17V16M16 8L12 4M12 4L8 8M12 4L12 16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      number: "05",
      title: "Receive Your Solutions",
      description: "Once your services are fulfilled, you'll receive all necessary documentation and confirmations directly through your personalized portal.",
      icon: "fas fa-trophy",
      svg: (
        <svg className="step-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12L11 14L15 10M21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3C16.971 3 21 7.029 21 12Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  return (
    <section id="process" className="py-20 bg-gradient-to-b from-secondary to-secondary/95">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInUpDiv className="text-center max-w-3xl mx-auto mb-16">
          <div className="section-subtitle">Our Process</div>
          <h2 className="section-title relative inline-block pb-4 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-32 after:h-1 after:bg-gradient-to-r after:from-[#C9C9C9] after:to-[#E5E5E5] after:-translate-x-1/2">
            From Dreams to Results
          </h2>
          <p className="section-description mt-4">
            Our proven 5-step process takes you from initial consultation to complete business setup in the UAE with expert guidance at every stage.
          </p>
        </FadeInUpDiv>

        {/* Desktop view (5 columns) and responsive layout */}
        <div className="relative">
          <div 
            ref={processContainerRef}
            className={`process-container ${isInView ? 'visible' : ''}`}
          >
            {/* Progress line */}
            <div 
              ref={progressLineRef}
              className="process-progress-line"
            ></div>
            {steps.map((step, index) => (
              <div 
                key={index}
                className="step-card"
                style={{ "--step-index": index } as React.CSSProperties}
              >
                <div className={`step-number ${completedSteps.includes(index) ? 'completed' : ''}`}>
                  {index + 1}
                </div>
                <div className="text-center mb-4">
                  {step.svg}
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Premium CTA Button with Gradient Effect */}
        <div className="process-cta">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <GradientButton 
              href="/stage2/UI1.html" 
              size="md"
              variant="primary"
              ariaLabel="Start your journey with us"
              className="tracking-wide"
              icon={
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              }
              iconPosition="right"
            >
              Start Your Journey
            </GradientButton>
          </motion.div>
        </div>
      </div>
    </section>
  );
}