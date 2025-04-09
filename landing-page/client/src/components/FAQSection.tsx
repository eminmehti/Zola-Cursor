import { useState, useRef, useEffect } from 'react';
import { PlusIcon, MinusIcon } from 'lucide-react';
import './faq.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Define types for FAQ items
interface FAQItem {
  question: string;
  answer: string;
}

// Sample FAQ data
const faqData: FAQItem[] = [
  {
    question: "How do you handle sensitive documents and personal data?",
    answer: "We only ask for the information we truly need to provide our services, and we never store it unnecessarily. Rest assured, we don't share your details with any third party without your explicit consent."
  },
  {
    question: "Do I need to be physically present in the UAE at any stage of the process?",
    answer: "No. Our streamlined process lets you handle everything from the comfort of your home. We use technology to keep things simple, so there's usually no need for in-person visits."
  },
  {
    question: "How quickly can I expect my visa to be processed using your services?",
    answer: "Timeframes can vary based on government regulations and individual circumstances. However, our AI-powered approach significantly speeds up approvals. Many clients find that their visas are issued in a fraction of the usual time."
  },
  {
    question: "What type of businesses benefit most from setting up in the UAE through Zola?",
    answer: "We work with everyone—from freelancers and small startups to large corporations. Our AI-driven workflows handle everything from straightforward business licenses to more complex Free Zone or Mainland company structures."
  },
  {
    question: "Are there hidden fees or unexpected costs I should anticipate?",
    answer: "We're all about transparency. Our custom proposal clearly outlines the total price and provides a detailed cost breakdown. If anything extra comes up—such as translations or official attestations—we'll let you know right away."
  },
  {
    question: "Does Zola handle renewals, expansions, or additional government applications down the road?",
    answer: "Yes. We view ourselves as long-term partners, not just a one-time service. We support clients with ongoing compliance and renewals, and can also help if you decide to expand or modify your trade license later on."
  },
  {
    question: "Why are your fees lower if you're also offering more advanced solutions?",
    answer: "Our AI automates a lot of processes, so we don't need large teams to handle repetitive tasks. We pass those savings on to you, providing top-notch services at competitive rates."
  },
  {
    question: "How do I get a personalized quote or proposal?",
    answer: "Just click \"Start Now\" and tell us what you need. Our system does the heavy lifting behind the scenes, and we'll send you a customized plan tailored to your requirements."
  }
];

// FAQ Accordion Item Component
const FAQItem = ({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div className={`faq-item ${isOpen ? 'active' : ''}`}>
      <button 
        className="faq-question" 
        onClick={onClick}
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        <div className="faq-icon">
          {isOpen ? (
            <MinusIcon className="minus-icon" size={20} />
          ) : (
            <PlusIcon className="plus-icon" size={20} />
          )}
        </div>
      </button>
      <div 
        className="faq-answer-container" 
        style={{ height: height !== undefined ? `${height}px` : 'auto' }}
      >
        <div className="faq-answer" ref={contentRef}>
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  // Initialize AOS animations
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      offset: 100,
    });
  }, []);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-section">
      {/* Premium background elements */}
      <div className="faq-background">
        <div className="bg-circle circle-1" data-aos="fade-in" data-aos-duration="1500"></div>
        <div className="bg-circle circle-2" data-aos="fade-in" data-aos-duration="1500" data-aos-delay="200"></div>
        <div className="accent-line" data-aos="fade-in" data-aos-duration="1500" data-aos-delay="400"></div>
      </div>
      
      <div className="container">
        {/* Section header */}
        <div className="section-header" data-aos="fade-up">
          <h4 className="section-subtitle">FREQUENTLY ASKED QUESTIONS</h4>
          <h2 className="section-title">Got Questions? We've Got Answers</h2>
          <p className="section-description">
            Everything you need to know about our services and the UAE business setup process
          </p>
        </div>
        
        {/* FAQ Container */}
        <div className="faq-container" data-aos="fade-up" data-aos-delay="200">
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              item={faq}
              isOpen={openIndex === index}
              onClick={() => handleToggle(index)}
            />
          ))}
        </div>
        
        {/* No CTA here */}
      </div>
    </section>
  );
}