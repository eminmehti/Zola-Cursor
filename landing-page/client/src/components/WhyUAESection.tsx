import { useEffect, useRef } from "react";
import { FadeInUpDiv } from "@/lib/animations";
import "./whyuae.css";
import { initializeMetroTileInteractivity } from "./WhyUAEInteractivity";
import { initializeSmallTileModal } from "./WhyUAEModal";
import { GradientButton } from "./ui/gradient-button";
import AOS from 'aos';
import 'aos/dist/aos.css';

// Import required Lucide-React icons
import { TrendingUp, Globe, Shield, Activity, Building, Briefcase, Home, ArrowRight } from "lucide-react";

export default function WhyUAESection() {
  const sectionRef = useRef<HTMLElement>(null);
  
  // Initialize interactive effects when component mounts
  useEffect(() => {
    // Initialize AOS animations
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 100,
    });
    
    // Initialize interactive effects for metro tiles after a short delay
    // to ensure the DOM is fully loaded
    const interactivityTimeout = setTimeout(() => {
      initializeMetroTileInteractivity();
      initializeSmallTileModal(); // Initialize modal functionality for small tiles
    }, 800);
    
    // Clean up event listeners on component unmount
    return () => {
      clearTimeout(interactivityTimeout);
    };
  }, []);

  return (
    <section id="why-uae" ref={sectionRef} className="advantages-section">
      <div className="section-header">
        <h2 className="section-title">Why Choose UAE</h2>
        <p className="section-subtitle">Discover the strategic advantages that make the UAE an ideal destination for your business</p>
      </div>
      
      <div className="metro-grid">
        {/* Primary Advantage (Large Tile) */}
        <div className="metro-tile large" data-aos="fade-up">
          <div className="tile-icon">
            <TrendingUp className="advantage-icon" size={48} stroke="#c4b087" strokeWidth={1.5} />
          </div>
          <h3 className="tile-title">Tax Advantages</h3>
          <p className="tile-description">Benefit from 0% corporate tax in Free Zones, no personal income tax, and extensive double taxation treaties.</p>
          <div className="tile-highlights">
            <span className="highlight-tag">0% Corporate Tax</span>
            <span className="highlight-tag">No Personal Income Tax</span>
          </div>
        </div>
        
        {/* Secondary Advantage (Medium Tile) */}
        <div className="metro-tile medium" data-aos="fade-up" data-aos-delay="100">
          <div className="tile-icon">
            <Globe className="advantage-icon" size={48} stroke="#c4b087" strokeWidth={1.5} />
          </div>
          <h3 className="tile-title">Strategic Location</h3>
          <p className="tile-description">Access to global markets with Dubai serving as the gateway between East and West, connecting billions of consumers.</p>
        </div>
        
        {/* Secondary Advantage (Medium Tile) */}
        <div className="metro-tile medium" data-aos="fade-up" data-aos-delay="200">
          <div className="tile-icon">
            <Shield className="advantage-icon" size={48} stroke="#c4b087" strokeWidth={1.5} />
          </div>
          <h3 className="tile-title">Political Stability</h3>
          <p className="tile-description">Enjoy a secure business environment backed by strong leadership and clear developmental vision.</p>
        </div>
        
        {/* Tertiary Advantage (Small Tile) */}
        <div className="metro-tile small" data-aos="fade-up" data-aos-delay="300">
          <div className="tile-icon">
            <Activity className="advantage-icon" size={36} stroke="#c4b087" strokeWidth={1.5} />
          </div>
          <h3 className="tile-title">Economic Diversification</h3>
        </div>
        
        {/* Additional Advantage (Small Tile) */}
        <div className="metro-tile small" data-aos="fade-up" data-aos-delay="350">
          <div className="tile-icon">
            <Building className="advantage-icon" size={36} stroke="#c4b087" strokeWidth={1.5} />
          </div>
          <h3 className="tile-title">Modern Infrastructure</h3>
        </div>
        
        {/* Additional Advantage (Small Tile) */}
        <div className="metro-tile small" data-aos="fade-up" data-aos-delay="400">
          <div className="tile-icon">
            <Briefcase className="advantage-icon" size={36} stroke="#c4b087" strokeWidth={1.5} />
          </div>
          <h3 className="tile-title">Foreign Ownership</h3>
        </div>
        
        {/* Additional Advantage (Small Tile) */}
        <div className="metro-tile small" data-aos="fade-up" data-aos-delay="450">
          <div className="tile-icon">
            <Home className="advantage-icon" size={36} stroke="#c4b087" strokeWidth={1.5} />
          </div>
          <h3 className="tile-title">Quality of Life</h3>
        </div>
      </div>
      
      <div className="cta-container">
        <GradientButton
          href="/stage2/UI1.html"
          size="md"
          variant="primary"
          className="tracking-wide"
          ariaLabel="Plan your UAE business entry"
          icon={<ArrowRight size={18} />}
          iconPosition="right"
        >
          Plan Your UAE Business Entry
        </GradientButton>
      </div>
    </section>
  );
}
