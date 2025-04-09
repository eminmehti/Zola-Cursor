import { FadeInUpDiv, StaggerContainer } from "@/lib/animations";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AnimatedGradientBg } from "./ui/animated-gradient-bg";
import { FloatingCard } from "./ui/floating-card";
import { GradientButton } from "./ui/gradient-button";

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
  index: number;
  total: number;
}

const ServiceCard = ({ icon, title, description, features, index, total }: ServiceCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate a pleasing gradient based on index
  const colors = [
    { primary: '#1A1B40', accent: '#c4b087' },
    { primary: '#2D2F67', accent: '#c4b087' },
    { primary: '#454884', accent: '#c4b087' }
  ];
  
  const colorSet = colors[index % colors.length];
  
  return (
    <div ref={cardRef} className="group">
      <FloatingCard
        className="p-8 h-full bg-white/80 backdrop-blur-md"
        rotateIntensity={0.5}
        floatIntensity={0.2}
        hoverScale={1.02}
        borderColor="rgba(196, 176, 135, 0.1)"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ 
            duration: 0.6, 
            delay: index * 0.2,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="flex flex-col h-full"
        >
          {/* Service icon with number - enhanced visual hierarchy */}
          <div className="flex items-center gap-5 mb-8 relative">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1A1B40] to-[#2D2F67] flex items-center justify-center shadow-lg">
                <i className={`${icon} text-white text-xl`}></i>
              </div>
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1A1B40]/10 to-[#c4b087]/20 blur-md"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Service number with modern styling */}
              <div className="absolute -right-4 -top-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold text-[#1A1B40]">
                0{index + 1}
              </div>
            </div>
            
            <div>
              <span className="text-[#c4b087] text-sm font-medium uppercase tracking-wider">Premium Service</span>
              <h3 className="text-xl font-bold text-[#1A1B40] mt-1">{title}</h3>
            </div>
          </div>
          
          {/* Enhanced description */}
          <p className="text-[#1A1B40]/70 leading-relaxed text-base flex-grow mb-6">{description}</p>
          
          {/* Features with animated checkmarks - enhanced presentation */}
          <div className="mb-8">
            <h4 className="text-[#1A1B40] font-medium text-sm uppercase tracking-wider mb-4">Key Benefits</h4>
            <ul className="space-y-4">
              {features.map((feature, idx) => (
                <motion.li 
                  key={idx} 
                  className="flex items-start"
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.1 + 0.4 + idx * 0.1, duration: 0.5 }}
                >
                  <motion.div 
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-[#c4b087]/10 flex items-center justify-center mt-0.5 mr-4"
                    whileHover={{ scale: 1.2, backgroundColor: 'rgba(196, 176, 135, 0.2)' }}
                  >
                    <i className="fas fa-check text-[#c4b087] text-xs"></i>
                  </motion.div>
                  <span className="text-[#1A1B40]/80 text-sm transition-transform duration-300 group-hover:translate-x-1">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          
          {/* Enhanced CTA button using GradientButton component */}
          <div className="mt-auto">
            <GradientButton 
              href="/stage2/UI1.html"
              size="sm"
              variant="secondary"
              className="w-full"
              icon={
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              }
              iconPosition="right"
            >
              Explore {title}
            </GradientButton>
          </div>
        </motion.div>
      </FloatingCard>
    </div>
  );
};

export default function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [serviceFilter, setServiceFilter] = useState("all");
  
  const services = [
    {
      icon: "fas fa-building",
      title: "Business Incorporation",
      description: "Streamlined company formation across Free Zones, Mainland, and Offshore jurisdictions with expert legal guidance tailored to your industry and operational requirements.",
      features: [
        "AI-optimized trade license acquisition",
        "Strategic corporate structure optimization",
        "Full legal documentation support"
      ],
      category: "incorporation"
    },
    {
      icon: "fas fa-passport",
      title: "Visa Solutions",
      description: "Comprehensive visa services for entrepreneurs, investors, professionals, and their families with expedited processing through our proprietary digital workflow system.",
      features: [
        "Premium investor and golden visas",
        "Streamlined employment and family visas",
        "Automated visa renewal and status adjustments"
      ],
      category: "visa"
    },
    {
      icon: "fas fa-landmark",
      title: "Banking Solutions",
      description: "Simplified access to the UAE's banking system with personalized guidance and machine learning-powered financial optimization for your specific business model and revenue streams.",
      features: [
        "Digital corporate account setup",
        "Integrated merchant services & payment solutions",
        "AI-driven financial compliance guidance"
      ],
      category: "banking"
    }
  ];

  const filteredServices = serviceFilter === "all" 
    ? services 
    : services.filter(service => service.category === serviceFilter);

  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };
  
  const decorativeLineVariants = {
    hidden: { width: 0 },
    visible: { 
      width: "100%",
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2
      }
    }
  };

  return (
    <section id="services" className="py-24 bg-gradient-to-b from-white to-[#f8f9ff] relative overflow-hidden">
      <AnimatedGradientBg 
        className="absolute inset-0" 
        primaryColor="#1A1B40"
        accentColor="#c4b087"
        opacity={0.03}
        blur={40}
        interactive={false}
      >
        <div className="hidden" />
      </AnimatedGradientBg>
      
      <div className="container mx-auto px-6 relative z-10" ref={sectionRef}>
        <div className="max-w-3xl mx-auto mb-16 lg:mb-24">
          <div className="text-center">
            {/* Enhanced decorative element */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="mb-3 inline-flex items-center justify-center px-4 py-1.5 bg-[#1A1B40]/5 rounded-full"
            >
              <span className="text-[#1A1B40] text-sm font-medium">Comprehensive Business Solutions</span>
            </motion.div>
            
            {/* Enhanced main heading with animated underline */}
            <motion.h2
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={titleVariants}
              className="text-4xl md:text-5xl font-bold text-[#1A1B40] mt-4"
            >
              Our Premier Services
            </motion.h2>
            
            {/* Animated gradient underline */}
            <div className="relative h-1 w-32 mx-auto mt-6 mb-8 overflow-hidden rounded-full">
              <motion.div 
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={decorativeLineVariants}
                className="absolute inset-0 bg-gradient-to-r from-[#1A1B40] to-[#c4b087]"
              ></motion.div>
            </div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-[#1A1B40]/70 text-lg max-w-2xl mx-auto leading-relaxed"
            >
              AI-powered solutions tailored to your business needs in the UAE's dynamic market landscape
            </motion.p>
          </div>
        </div>
        
        {/* Enhanced filter tabs for service categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center mb-12 flex-wrap gap-2"
        >
          {["all", "incorporation", "visa", "banking"].map((category, idx) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setServiceFilter(category)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                serviceFilter === category 
                  ? "bg-[#1A1B40] text-white shadow-md" 
                  : "bg-white/80 text-[#1A1B40]/70 hover:bg-[#1A1B40]/5 border border-[#1A1B40]/10"
              }`}
            >
              {category === "all" ? "All Services" : 
               category === "incorporation" ? "Business Incorporation" : 
               category === "visa" ? "Visa Solutions" : "Banking Solutions"}
            </motion.button>
          ))}
        </motion.div>
        
        {/* Enhanced services grid with better spacing and responsiveness */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {filteredServices.map((service, index) => (
            <ServiceCard 
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              features={service.features}
              index={index}
              total={filteredServices.length}
            />
          ))}
        </div>
        
        {/* Enhanced bottom CTA with GradientButton component */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <GradientButton 
            href="/stage2/UI1.html"
            size="lg"
            variant="primary"
            icon={
              <span className="relative w-7 h-7 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                <svg 
                  className="w-4 h-4 text-white transform group-hover:translate-x-6 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <svg 
                  className="w-4 h-4 text-white absolute -left-6 transform group-hover:translate-x-6 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            }
            iconPosition="right"
          >
            Get Personalized Service Package
          </GradientButton>
          
          {/* Enhanced additional info with subtle animation */}
          <motion.p 
            className="text-[#1A1B40]/50 text-sm mt-5"
            animate={{ opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            Book a free consultation to discover how we can elevate your business
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
