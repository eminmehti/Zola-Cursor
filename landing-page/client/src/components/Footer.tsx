import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const subscribeSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type SubscribeFormValues = z.infer<typeof subscribeSchema>;

export default function Footer() {
  const { toast } = useToast();
  
  const form = useForm<SubscribeFormValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      email: "",
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: (data: SubscribeFormValues) => {
      return apiRequest("POST", "/api/subscribe", data);
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    }
  });

  function onSubmit(data: SubscribeFormValues) {
    subscribeMutation.mutate(data);
  }

  return (
    <footer className="bg-primary text-secondary pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-2xl font-bold font-playfair mb-6">Zola</h3>
            <p className="text-secondary/70 mb-6">
              Your trusted partner for business setup and growth in the UAE. Elevating businesses with expert solutions since 2015.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full border border-secondary/30 flex items-center justify-center hover:bg-[#C9C9C9] hover:border-[#C9C9C9] hover:text-primary transition-colors">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-secondary/30 flex items-center justify-center hover:bg-[#C9C9C9] hover:border-[#C9C9C9] hover:text-primary transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-secondary/30 flex items-center justify-center hover:bg-[#C9C9C9] hover:border-[#C9C9C9] hover:text-primary transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#services" className="text-secondary/70 hover:text-[#C9C9C9] transition">Our Services</a>
              </li>
              <li>
                <a href="#process" className="text-secondary/70 hover:text-[#C9C9C9] transition">The Process</a>
              </li>
              <li>
                <a href="#industry-best" className="text-secondary/70 hover:text-[#C9C9C9] transition">Best in Industry</a>
              </li>
              <li>
                <a href="#why-uae" className="text-secondary/70 hover:text-[#C9C9C9] transition">Why UAE</a>
              </li>
              <li>
                <a href="#testimonials" className="text-secondary/70 hover:text-[#C9C9C9] transition">Testimonials</a>
              </li>
              <li>
                <a href="#about" className="text-secondary/70 hover:text-[#C9C9C9] transition">About Us</a>
              </li>
              <li>
                <a href="/stage2/UI1.html" className="text-secondary/70 hover:text-[#C9C9C9] transition">Contact</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-6">Services</h4>
            <ul className="space-y-3">
              <li>
                <a href="/stage2/UI1.html" className="text-secondary/70 hover:text-[#C9C9C9] transition">Business Incorporation</a>
              </li>
              <li>
                <a href="/stage2/UI1.html" className="text-secondary/70 hover:text-[#C9C9C9] transition">Visa Solutions</a>
              </li>
              <li>
                <a href="/stage2/UI1.html" className="text-secondary/70 hover:text-[#C9C9C9] transition">Banking Solutions</a>
              </li>
              <li>
                <a href="/stage2/UI1.html" className="text-secondary/70 hover:text-[#C9C9C9] transition">Legal Services</a>
              </li>
              <li>
                <a href="/stage2/UI1.html" className="text-secondary/70 hover:text-[#C9C9C9] transition">Business Consulting</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-6">Subscribe</h4>
            <p className="text-secondary/70 mb-4">
              Stay updated with our latest insights on UAE business.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mb-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex">
                        <FormControl>
                          <Input
                            placeholder="Your email"
                            type="email"
                            className="w-full p-3 bg-[#384062]/50 text-secondary border-0 rounded-sm rounded-r-none focus:outline-none focus:ring-1 focus:ring-[#C9C9C9]"
                            {...field}
                          />
                        </FormControl>
                        <button 
                          type="submit" 
                          className="bg-[#C9C9C9] text-primary px-4 rounded-sm rounded-l-none hover:bg-secondary transition-colors duration-300"
                          disabled={subscribeMutation.isPending}
                        >
                          {subscribeMutation.isPending ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-paper-plane"></i>
                          )}
                        </button>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>
        
        <div className="border-t border-secondary/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-secondary/60">
              © {new Date().getFullYear()} Zola Consultancy. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <a href="#" className="text-sm text-secondary/60 hover:text-[#C9C9C9] mr-6 transition">Privacy Policy</a>
              <a href="#" className="text-sm text-secondary/60 hover:text-[#C9C9C9] transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
