import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import ProcessSection from "@/components/ProcessSection";
import IndustryBestSectionCarousel from "@/components/IndustryBestSectionCarousel";
import ComparisonSection from "@/components/ComparisonSection";
import WhyUAESection from "@/components/WhyUAESection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import BlogPreviewSection from "@/components/BlogPreviewSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="font-poppins text-primary bg-secondary">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <ProcessSection />
      <IndustryBestSectionCarousel />
      <ComparisonSection />
      <WhyUAESection />
      <TestimonialsSection />
      <FAQSection />
      <BlogPreviewSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
