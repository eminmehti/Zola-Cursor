import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { blogPosts, BlogPost } from '@/data/blogData';
import { fadeIn, fadeInUp, staggerContainer } from '@/lib/animations';
import './blog-preview.css';

// Utility function to get the current week number
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Get random blogs based on the week number
const getRandomBlogsForWeek = (allBlogs: BlogPost[], count: number = 3): BlogPost[] => {
  // Use the current week number as the seed for random selection
  const currentDate = new Date();
  const weekNumber = getWeekNumber(currentDate);
  const yearNumber = currentDate.getFullYear();
  
  // Combine week and year to create a unique seed for each week
  const seed = yearNumber * 100 + weekNumber;
  
  // Create a seeded random number generator
  const seededRandom = (seed: number, index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };
  
  // Create a copy of the blogs array to avoid mutating the original
  const blogsCopy = [...allBlogs];
  
  // Sort the array using the seeded random numbers
  blogsCopy.sort((a, b) => {
    const indexA = allBlogs.findIndex(blog => blog.id === a.id);
    const indexB = allBlogs.findIndex(blog => blog.id === b.id);
    return seededRandom(seed, indexA) - seededRandom(seed, indexB);
  });
  
  // Return the first 'count' blogs
  return blogsCopy.slice(0, count);
};

// Blog Card Component
interface BlogCardProps {
  blog: BlogPost;
  index: number;
}

const BlogCard = ({ blog, index }: BlogCardProps) => {
  // Format the date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <motion.div 
      className="blog-card"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={index * 0.2 + 0.3}
      whileHover={{ 
        y: -5, 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
      }}
      transition={{ duration: 0.3 }}
    >
      <a href={blog.url} className="blog-card-link">
        <div className="blog-card-image-container">
          <div className="blog-card-category">{blog.category}</div>
          <div 
            className="blog-card-image" 
            style={{ 
              background: `linear-gradient(135deg, ${blog.thumbnailColor} 0%, ${blog.thumbnailAccent} 100%)`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Abstract shapes for visual interest */}
            <div className="blog-thumbnail-shape shape-1" style={{ background: `${blog.thumbnailColor}30` }}></div>
            <div className="blog-thumbnail-shape shape-2" style={{ background: `${blog.thumbnailAccent}40` }}></div>
            <div className="blog-thumbnail-shape shape-3" style={{ background: `${blog.thumbnailColor}20` }}></div>
          </div>
        </div>
        <div className="blog-card-content">
          <h3 className="blog-card-title">{blog.title}</h3>
          <p className="blog-card-excerpt">{blog.excerpt}</p>
          <div className="blog-card-meta">
            <div className="blog-card-date">
              <Calendar size={14} />
              <span>{formatDate(blog.date)}</span>
            </div>
            <div className="blog-card-read-more">Read More</div>
          </div>
        </div>
      </a>
    </motion.div>
  );
};

export default function BlogPreviewSection() {
  // Get 3 random blogs based on the current week
  const [randomBlogs, setRandomBlogs] = useState<BlogPost[]>([]);
  const [nextRefreshDate, setNextRefreshDate] = useState<Date>(new Date());
  
  useEffect(() => {
    // Initialize AOS animations
    AOS.init({
      duration: 800,
      once: false,
      offset: 100,
    });
    
    // Get 3 random blogs for this week
    const selectedBlogs = getRandomBlogsForWeek(blogPosts, 3);
    setRandomBlogs(selectedBlogs);
    
    // Calculate the date for the next refresh (next week's start)
    const currentDate = new Date();
    const daysUntilNextWeek = 7 - currentDate.getDay();
    const nextWeekDate = new Date(currentDate);
    nextWeekDate.setDate(currentDate.getDate() + daysUntilNextWeek);
    nextWeekDate.setHours(0, 0, 0, 0);
    setNextRefreshDate(nextWeekDate);
  }, []);

  // Format the next refresh date
  const formatRefreshDate = (): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return nextRefreshDate.toLocaleDateString('en-US', options);
  };

  return (
    <section id="blog" className="blog-preview-section">
      {/* Premium background elements */}
      <div className="blog-background">
        <div className="blog-bg-circle circle-1" data-aos="fade-in" data-aos-duration="1500"></div>
        <div className="blog-bg-circle circle-2" data-aos="fade-in" data-aos-duration="1500" data-aos-delay="200"></div>
        <div className="blog-accent-line" data-aos="fade-in" data-aos-duration="1500" data-aos-delay="400"></div>
      </div>
      
      <div className="blog-container">
        {/* Section header */}
        <div className="blog-section-header" data-aos="fade-up">
          <h4 className="blog-section-subtitle">BUSINESS INSIGHTS</h4>
          <h2 className="blog-section-title">Latest From Our Blog</h2>
          <p className="blog-section-description">
            Expert insights and practical guides to help navigate the UAE business landscape
          </p>
          <div className="blog-refresh-info">
            <Clock size={16} />
            <span>Next refresh: {formatRefreshDate()}</span>
          </div>
        </div>
        
        {/* Blog Cards Container */}
        <motion.div 
          className="blog-cards-container"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {randomBlogs.map((blog, index) => (
            <BlogCard key={blog.id} blog={blog} index={index} />
          ))}
        </motion.div>
        
        {/* CTA Button */}
        <div className="blog-cta-container" data-aos="fade-up" data-aos-delay="400">
          <a href="/start-now" className="blog-cta-button">
            Explore More Blogs
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
              className="blog-cta-icon"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}