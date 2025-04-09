import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { AnimatedSection, FadeInUpDiv } from '@/lib/animations';
import { useIsMobile } from '@/hooks/use-mobile';
import { GradientButton } from './ui/gradient-button';
import { ArrowRight } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function ComparisonSection() {
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const controls = useAnimation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Mock comparison data
  const comparisonData = [
    {
      label: 'Processing Time',
      zola: { value: '3-5 days', subtext: 'AI-accelerated processing' },
      competitor: { value: '2-3 weeks', subtext: 'Standard timeline' }
    },
    {
      label: 'Success Rate',
      zola: { value: '99.7%', subtext: 'With validation checks' },
      competitor: { value: '85%', subtext: 'Industry average' }
    },
    {
      label: 'Document Verification',
      zola: { value: 'Automated', subtext: 'Real-time feedback' },
      competitor: { value: 'Manual', subtext: 'Prone to delays' }
    },
    {
      label: 'Service Fees',
      zola: { value: 'Transparent', subtext: 'All-inclusive packages' },
      competitor: { value: 'Variable', subtext: 'Additional fees apply' }
    },
    {
      label: 'Support Channels',
      zola: { value: '24/7', subtext: 'Multi-channel support' },
      competitor: { value: 'Business hours', subtext: 'Limited availability' }
    }
  ];

  // Set up intersection observer for animations and initialize AOS
  useEffect(() => {
    if (!sectionRef.current) return;
    
    // Initialize AOS
    AOS.init({
      duration: 800,
      once: true,
      offset: 100
    });
    
    // Add data-aos attributes to comparison rows programmatically
    document.querySelectorAll('.comparison-row').forEach((row, index) => {
      row.querySelectorAll('.comparison-label, .zola-value, .competitor-value').forEach(cell => {
        cell.setAttribute('data-aos', 'fade-up');
        cell.setAttribute('data-aos-delay', (index * 100).toString() + 'ms');
      });
    });
    
    // Import and initialize the comparison section interactivity
    import('./ComparisonSectionInteractivity.ts').then(() => {
      console.log('Comparison section interactivity initialized');
    });
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          controls.start('visible');
        }
      },
      { threshold: 0.2 }
    );
    
    observer.observe(sectionRef.current);
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [controls]);
  
  const handleRowHover = (index: number) => {
    setActiveRow(index);
  };
  
  const handleRowLeave = () => {
    setActiveRow(null);
  };

  return (
    <section
      id="comparison-section"
      className="py-20 bg-gray-50 relative overflow-hidden"
      ref={sectionRef}
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-[#F8F9FC] z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8F9FC] to-[#F0F2F9] z-0"></div>
      <div className="absolute inset-0 bg-[#1A1B40]/[0.02] z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, #1A1B40 1px, transparent 1px), linear-gradient(to bottom, #1A1B40 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.05
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeInUpDiv className="text-center mb-12">
          <span className="text-[#C9C9C9] uppercase tracking-wider text-sm font-medium mb-3 block">
            Direct Comparison
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold relative inline-block">
            Zola vs. The Competition
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-[#C9C9C9] to-[#E5E5E5] mx-auto mt-4 mb-6"></div>
          <p className="text-[#384062]/80 text-lg max-w-2xl mx-auto">
            See how our revolutionary approach to UAE business setup delivers superior results compared to traditional providers
          </p>

        </FadeInUpDiv>
        
        <div className="comparison-section mx-auto">
          <motion.div 
            className="comparison-container"
            initial="hidden"
            animate={controls}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {/* Headers */}
            <div className="column-header">Category</div>
            <div className="column-header zola">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-[#1A1B40]">Zola</span>
                <div className="bg-[#1A1B40] text-white text-xs px-2 py-0.5 rounded">We Are Here</div>
              </div>
            </div>
            <div className="column-header competitor">Traditional Providers</div>
            
            {/* Data rows */}
            {comparisonData.map((item, index) => (
              <div className="comparison-row" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                <motion.div 
                  className="comparison-label"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  transition={{ duration: 0.5 }}
                  onMouseEnter={() => handleRowHover(index)}
                  onMouseLeave={handleRowLeave}
                >
                  {item.label}
                </motion.div>
                
                <motion.div 
                  className={`zola-value ${activeRow === index ? 'active' : ''}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.5 }}
                  onMouseEnter={() => handleRowHover(index)}
                  onMouseLeave={handleRowLeave}
                >
                  <span className="value-text">{item.zola.value}</span>
                  <span className="value-label">{item.zola.subtext}</span>
                  <div className="advantage-indicator">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="#c4b087" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </motion.div>
                
                <motion.div 
                  className={`competitor-value ${activeRow === index ? 'active' : ''}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.5 }}
                  onMouseEnter={() => handleRowHover(index)}
                  onMouseLeave={handleRowLeave}
                >
                  <span className="value-text">{item.competitor.value}</span>
                  <span className="value-label">{item.competitor.subtext}</span>
                </motion.div>
              </div>
            ))}
          </motion.div>
          

          
          <div className="mt-16 text-center">
            <GradientButton
              href="/stage2/UI1.html"
              size="md"
              variant="primary"
              className="tracking-wide"
              ariaLabel="Experience the Zola difference"
              icon={<ArrowRight size={18} />}
              iconPosition="right"
            >
              Experience the Zola Difference
            </GradientButton>
          </div>
        </div>
      </div>
      
      {/* Add CSS for comparison section - we'll also add this as a style tag */}
      <style>{`
        .comparison-section {
          max-width: 1400px;
          margin: 100px auto;
          padding: 0 24px;
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          position: relative;
        }

        .comparison-header {
          text-align: center;
          padding: 60px 20px 40px;
          max-width: 800px;
          margin: 0 auto;
        }

        .comparison-title {
          color: #1a2340;
          font-size: 42px;
          font-weight: 600;
          margin-bottom: 16px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .comparison-subtitle {
          color: #64748b;
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .comparison-container {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0;
          margin-bottom: 60px;
        }

        .comparison-label {
          grid-column: 1;
          padding: 24px 32px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          font-weight: 600;
          color: #1e293b;
          font-size: 18px;
        }

        .zola-value {
          grid-column: 2;
          background-color: #f1f5fb;
          padding: 24px 40px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
        }

        .competitor-value {
          grid-column: 3;
          padding: 24px 40px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.3s ease;
        }

        .column-header {
          grid-row: 1;
          padding: 30px 20px;
          text-align: center;
          font-weight: 600;
          font-size: 20px;
          color: #1a2340;
          background-color: #f8f9fc;
        }

        .column-header.zola {
          grid-column: 2;
          background-color: #e8f0fb;
          color: #1a2340;
          border-bottom: 2px solid #1a2340;
        }

        .column-header.competitor {
          grid-column: 3;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }

        .value-text {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .zola-value .value-text {
          color: #1a2340;
        }

        .competitor-value .value-text {
          color: #64748b;
        }

        .value-label {
          font-size: 14px;
          color: #64748b;
        }

        .zola-value:hover, .competitor-value:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          z-index: 2;
        }

        .zola-value:hover {
          background-color: #e8f0fb;
        }

        .zola-value::after {
          content: '';
          position: absolute;
          width: 4px;
          height: 0;
          background-color: #c4b087; /* Gold accent color */
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          transition: height 0.3s ease;
        }

        .zola-value:hover::after, .zola-value.active::after {
          height: 40px;
        }
        

        
        /* Enhanced hover effects */
        .comparison-row {
          position: relative;
          display: contents;
        }
        
        .comparison-row.highlighted .zola-value {
          background-color: #e8f0fb;
          box-shadow: 0 0 15px rgba(196, 176, 135, 0.3);
        }
        
        .comparison-row:hover .zola-value {
          background-color: #e8f0fb;
          animation: pulseGlow 1.5s infinite;
        }
        
        .comparison-row:hover .competitor-value {
          opacity: 0.8;
        }
        
        .advantage-indicator {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .zola-value:hover .advantage-indicator {
          opacity: 1;
          right: 20px;
        }
        
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(196, 176, 135, 0.3); }
          70% { box-shadow: 0 0 0 10px rgba(196, 176, 135, 0); }
          100% { box-shadow: 0 0 0 0 rgba(196, 176, 135, 0); }
        }
        

        
        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .comparison-container {
            display: flex;
            flex-direction: column;
          }
          
          .column-header {
            padding: 20px 15px;
            font-size: 18px;
          }
          
          .comparison-label, .zola-value, .competitor-value {
            padding: 16px 20px;
            width: 100%;
          }
          
          .comparison-section {
            margin: 40px auto;
            padding: 0 12px;
          }
          
          .value-text {
            font-size: 20px;
          }
        }
      `}</style>
    </section>
  );
}