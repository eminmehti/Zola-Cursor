import { useEffect, useRef } from 'react';
import { MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './testimonials.css';
import { GradientButton } from './ui/gradient-button';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Import Swiper and its styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

// Define testimonial interface
interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  image: string;
}

// Sample testimonial data
const testimonials: TestimonialProps[] = [
  {
    quote: "Zola transformed our expansion to Dubai from a complex challenge into a seamless process. Their expert guidance on free zone incorporation saved us time and resources.",
    name: "Robert Chen",
    title: "CEO, Nexus Technologies",
    image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    quote: "Working with Zola for our UAE market entry was the best decision we made. Their consultants navigated the regulatory landscape and helped us establish our business in just 3 weeks.",
    name: "Sarah Johnson",
    title: "Operations Director, Global Retail",
    image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    quote: "As a tech startup entering the UAE, we needed a partner who understood our unique needs. Zola provided tailored solutions that accelerated our growth in the MENA region.",
    name: "Mohammed Al-Farsi",
    title: "Founder, InnovateAI",
    image: "https://randomuser.me/api/portraits/men/22.jpg"
  },
  {
    quote: "The team at Zola has been instrumental in our successful market expansion. Their knowledge of the local business ecosystem opened doors we didn't know existed.",
    name: "Emma Roberts",
    title: "International Director, Healthtech Solutions",
    image: "https://randomuser.me/api/portraits/women/29.jpg"
  },
  {
    quote: "Setting up our logistics hub in the UAE seemed daunting until we partnered with Zola. Their comprehensive approach simplified the complex regulatory requirements.",
    name: "Khalid Ahmed",
    title: "COO, Global Supply Chain",
    image: "https://randomuser.me/api/portraits/men/54.jpg"
  }
];

// Star component for rating display
const Star = () => (
  <svg className="star" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const swiperRef = useRef<any>(null);

  // Initialize AOS animations
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      offset: 100,
    });
  }, []);

  return (
    <section ref={sectionRef} className="testimonials-section" id="testimonials">
      {/* Luxury modern background */}
      <div className="testimonials-background">
        <div className="shape shape-1" data-aos="fade-in" data-aos-duration="1500"></div>
        <div className="shape shape-2" data-aos="fade-in" data-aos-duration="1500" data-aos-delay="200"></div>
        <div className="accent-line" data-aos="fade-in" data-aos-duration="1500" data-aos-delay="400"></div>
      </div>
      
      <div className="section-content">
        {/* Section header */}
        <div className="section-header" data-aos="fade-up">
          <h4 className="section-subtitle">CLIENT TESTIMONIALS</h4>
          <h2 className="section-title">Success Stories from Industry Leaders</h2>
          <p className="section-description">Hear what our satisfied clients have to say about their experience with Zola</p>
        </div>
        
        {/* Testimonial carousel container */}
        <div 
          className="testimonial-carousel-container" 
          data-aos="fade-up" 
          data-aos-delay="200"
          onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
          onMouseLeave={() => swiperRef.current?.autoplay?.start()}
        >
          <Swiper
            className="testimonial-carousel"
            modules={[Autoplay, Navigation, Pagination, EffectCoverflow]}
            slidesPerView="auto"
            centeredSlides={true}
            spaceBetween={30}
            loop={true}
            speed={800}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            effect="slide"
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: false,
            }}
            navigation={{
              prevEl: '.testimonial-button-prev',
              nextEl: '.testimonial-button-next',
            }}
            // Pagination removed
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 20
              },
              768: {
                slidesPerView: 'auto',
                spaceBetween: 30
              }
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={index} className="testimonial-card">
                <div className="card-content">
                  {/* Decorative quote mark */}
                  <div className="testimonial-card-quote">"</div>
                  
                  {/* Star rating */}
                  <div className="rating">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} />
                    ))}
                  </div>
                  
                  {/* Testimonial quote */}
                  <div className="testimonial-text">
                    <p>{testimonial.quote}</p>
                  </div>
                  
                  {/* Client information */}
                  <div className="client-info">
                    <div className="client-avatar">
                      <img src={testimonial.image} alt={testimonial.name} />
                    </div>
                    <div className="client-details">
                      <h4 className="client-name">{testimonial.name}</h4>
                      <p className="client-position">{testimonial.title}</p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Navigation Controls */}
          <div className="testimonial-controls">
            <button className="testimonial-button-prev">
              <ChevronLeft size={24} />
            </button>
            <button className="testimonial-button-next">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Call-to-action button */}
      <div className="testimonials-cta" data-aos="fade-up" data-aos-delay="400">
        <GradientButton
          href="/stage2/UI1.html"
          size="md"
          variant="primary"
          className="tracking-wide"
          ariaLabel="Join our success stories"
          icon={<MoveRight size={18} />}
          iconPosition="right"
        >
          Join Our Success Stories
        </GradientButton>
      </div>
    </section>
  );
}