import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleMapsService } from "./google-maps-service";
import {
  insertLeadSchema,
  insertMessageTemplateSchema,
  insertSpeedConfigSchema,
  updateLeadStatusSchema,
  searchLeadsSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const googleMapsService = new GoogleMapsService();
  // Leads routes
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid lead data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id/status", async (req, res) => {
    try {
      const statusUpdate = updateLeadStatusSchema.parse(req.body);
      const lead = await storage.updateLeadStatus(req.params.id, statusUpdate);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid status data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update lead status" });
    }
  });

  app.post("/api/leads/search", async (req, res) => {
    try {
      const searchParams = searchLeadsSchema.parse(req.body);
      
      // Buscar leads reais do Google Maps
      const realLeads = await googleMapsService.searchBusinesses(searchParams);
      
      // Criar os leads no storage
      const createdLeads = await Promise.all(
        realLeads.map(lead => storage.createLead(lead))
      );
      
      res.json(createdLeads);
    } catch (error) {
      console.error("Search error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search parameters", details: error.errors });
      }
      res.status(500).json({ error: "Failed to search leads from Google Maps" });
    }
  });

  // Message template routes
  app.get("/api/message-template", async (req, res) => {
    try {
      const template = await storage.getActiveMessageTemplate();
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch message template" });
    }
  });

  app.post("/api/message-template", async (req, res) => {
    try {
      const templateData = insertMessageTemplateSchema.parse(req.body);
      const template = await storage.updateMessageTemplate(templateData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid template data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update message template" });
    }
  });

  // Speed config routes
  app.get("/api/speed-config", async (req, res) => {
    try {
      const config = await storage.getSpeedConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch speed config" });
    }
  });

  app.post("/api/speed-config", async (req, res) => {
    try {
      const configData = insertSpeedConfigSchema.parse(req.body);
      const config = await storage.updateSpeedConfig(configData);
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid config data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update speed config" });
    }
  });

  // Dashboard metrics routes
  app.get("/api/dashboard-metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // CSV export route
  app.get("/api/export/csv", async (req, res) => {
    try {
      const csvContent = await storage.exportLeadsToCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // WhatsApp simulation route
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { leadId } = req.body;
      if (!leadId) {
        return res.status(400).json({ error: "Lead ID is required" });
      }

      // Simulate WhatsApp sending delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update lead status to "Mensagem Enviada"
      const lead = await storage.updateLeadStatus(leadId, { status: "Mensagem Enviada" });
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({ success: true, message: "WhatsApp message sent successfully", lead });
    } catch (error) {
      res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
