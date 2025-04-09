// Blog Data Structure
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  thumbnailColor: string; // Color for the thumbnail's gradient
  thumbnailAccent: string; // Accent color for the thumbnail
  url: string;
  date: string;
  category: string;
}

// Sample blog posts data
export const blogPosts: BlogPost[] = [
  {
    id: "blog-1",
    title: "Top 5 Free Zones for Tech Startups in the UAE",
    excerpt: "Discover which free zones offer the best incentives and infrastructure for technology companies in 2023.",
    thumbnailColor: "#3498db",
    thumbnailAccent: "#2c3e50",
    url: "/blog/top-free-zones-tech-startups",
    date: "2023-08-15",
    category: "Free Zones"
  },
  {
    id: "blog-2",
    title: "New UAE Corporate Tax: What Business Owners Need to Know",
    excerpt: "A comprehensive guide to understanding the new UAE corporate tax framework and how it affects your business.",
    thumbnailColor: "#e74c3c",
    thumbnailAccent: "#c0392b",
    url: "/blog/uae-corporate-tax-guide",
    date: "2023-09-02",
    category: "Taxation"
  },
  {
    id: "blog-3",
    title: "The Ultimate Guide to UAE Business Banking",
    excerpt: "Everything you need to know about opening and managing business bank accounts in the UAE.",
    thumbnailColor: "#2ecc71",
    thumbnailAccent: "#27ae60",
    url: "/blog/uae-business-banking-guide",
    date: "2023-09-18",
    category: "Banking"
  },
  {
    id: "blog-4",
    title: "How to Obtain a Golden Visa in the UAE",
    excerpt: "Step-by-step guide to qualifying for and obtaining the prestigious UAE Golden Visa for entrepreneurs and investors.",
    thumbnailColor: "#f39c12",
    thumbnailAccent: "#d35400",
    url: "/blog/uae-golden-visa-guide",
    date: "2023-10-05",
    category: "Visas"
  },
  {
    id: "blog-5",
    title: "Navigating Import-Export Regulations in the UAE",
    excerpt: "Understanding customs procedures, documentation requirements, and regulatory compliance for trading businesses.",
    thumbnailColor: "#9b59b6",
    thumbnailAccent: "#8e44ad",
    url: "/blog/uae-import-export-regulations",
    date: "2023-10-21",
    category: "Trade"
  },
  {
    id: "blog-6",
    title: "Virtual Companies in the UAE: Regulations and Benefits",
    excerpt: "The complete guide to establishing and operating a virtual company in the UAE's evolving business landscape.",
    thumbnailColor: "#1abc9c",
    thumbnailAccent: "#16a085",
    url: "/blog/virtual-companies-uae",
    date: "2023-11-08",
    category: "Business Setup"
  },
  {
    id: "blog-7",
    title: "Securing Investors for Your UAE Startup",
    excerpt: "Strategies and best practices for attracting and securing investment for your UAE-based startup.",
    thumbnailColor: "#e67e22",
    thumbnailAccent: "#d35400",
    url: "/blog/securing-investors-uae-startup",
    date: "2023-11-25",
    category: "Funding"
  },
  {
    id: "blog-8",
    title: "UAE Business Etiquette: Do's and Don'ts",
    excerpt: "Cultural insights and business etiquette guidelines for successfully conducting business in the UAE.",
    thumbnailColor: "#34495e",
    thumbnailAccent: "#2c3e50",
    url: "/blog/uae-business-etiquette",
    date: "2023-12-12",
    category: "Culture"
  },
  {
    id: "blog-9",
    title: "Digital Marketing Strategies for UAE Businesses",
    excerpt: "Effective digital marketing approaches tailored to the unique market conditions of the UAE.",
    thumbnailColor: "#3498db",
    thumbnailAccent: "#2980b9",
    url: "/blog/digital-marketing-uae",
    date: "2024-01-05",
    category: "Marketing"
  },
  {
    id: "blog-10",
    title: "Sustainability Initiatives for UAE Companies",
    excerpt: "How UAE businesses can implement sustainable practices while meeting regulatory requirements and enhancing brand reputation.",
    thumbnailColor: "#2ecc71",
    thumbnailAccent: "#27ae60",
    url: "/blog/sustainability-uae-companies",
    date: "2024-01-22",
    category: "Sustainability"
  }
];