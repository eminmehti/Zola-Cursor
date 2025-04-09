import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contactFormSchema, subscribeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const result = contactFormSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.errors 
        });
      }

      // In production, here you would typically:
      // 1. Store the form submission in a database
      // 2. Send notification emails
      // 3. Possibly integrate with a CRM

      // For this demo, we'll just return success
      res.status(200).json({ 
        message: "Contact form submitted successfully",
        data: result.data
      });
      
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/subscribe", async (req: Request, res: Response) => {
    try {
      const result = subscribeSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.errors 
        });
      }

      // In production, here you would:
      // 1. Add the email to a newsletter service or database
      // 2. Send a confirmation email

      // For this demo, we'll just return success
      res.status(200).json({ 
        message: "Successfully subscribed to newsletter",
        data: result.data
      });
      
    } catch (error) {
      console.error("Subscribe error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
