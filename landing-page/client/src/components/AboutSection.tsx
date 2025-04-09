import { FadeInUpDiv } from "@/lib/animations";

interface StatProps {
  value: string;
  label: string;
}

const Stat = ({ value, label }: StatProps) => (
  <div>
    <div className="text-[#C9C9C9] text-3xl font-playfair font-bold">{value}</div>
    <p className="text-secondary/70 text-sm mt-1">{label}</p>
  </div>
);

export default function AboutSection() {
  const stats = [
    { value: "200+", label: "Businesses Established" },
    { value: "500+", label: "Visas Processed" },
    { value: "40+", label: "Countries Represented" },
    { value: "95%", label: "Client Satisfaction" }
  ];

  return (
    <section id="about" className="py-20 bg-primary text-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <FadeInUpDiv className="order-2 md:order-1">
            <h2 className="text-3xl md:text-4xl font-bold font-playfair relative inline-block pb-4 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-24 after:h-1 after:bg-gradient-to-r after:from-[#C9C9C9] after:to-[#E5E5E5]">
              Our Vision
            </h2>
            <p className="mt-6 text-secondary/80">
              At Zola, we envision a world where geographical boundaries no longer limit business potential. Our mission is to empower entrepreneurs and enterprises to thrive in the UAE's dynamic business ecosystem.
            </p>
            <p className="mt-4 text-secondary/80">
              Founded by a team of industry veterans with over 20 years of combined experience, we bring unparalleled insights into UAE's business regulations, banking systems, and immigration procedures.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mt-10">
              {stats.map((stat, index) => (
                <Stat key={index} value={stat.value} label={stat.label} />
              ))}
            </div>
          </FadeInUpDiv>
          
          <FadeInUpDiv delay={0.2} className="order-1 md:order-2">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80" 
                alt="Professional business meeting in Dubai" 
                className="rounded-sm shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#C9C9C9] rounded-sm flex items-center justify-center">
                <div className="text-primary font-playfair font-bold">
                  <div className="text-sm">Since</div>
                  <div className="text-2xl">2015</div>
                </div>
              </div>
            </div>
          </FadeInUpDiv>
        </div>
      </div>
    </section>
  );
}
