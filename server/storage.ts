import {
  type Lead,
  type InsertLead,
  type MessageTemplate,
  type InsertMessageTemplate,
  type SpeedConfig,
  type InsertSpeedConfig,
  type DashboardMetrics,
  type UpdateLeadStatus,
  type SearchLeads,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Leads operations
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLeadStatus(id: string, status: UpdateLeadStatus): Promise<Lead | undefined>;
  searchLeads(params: SearchLeads): Promise<Lead[]>;

  // Message template operations
  getActiveMessageTemplate(): Promise<MessageTemplate | undefined>;
  updateMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;

  // Speed config operations
  getSpeedConfig(): Promise<SpeedConfig>;
  updateSpeedConfig(config: InsertSpeedConfig): Promise<SpeedConfig>;

  // Dashboard metrics operations
  getDashboardMetrics(): Promise<DashboardMetrics>;
  updateDashboardMetrics(metrics: Partial<DashboardMetrics>): Promise<DashboardMetrics>;

  // CSV export
  exportLeadsToCSV(): Promise<string>;
}

export class MemStorage implements IStorage {
  private leads: Map<string, Lead>;
  private messageTemplates: Map<string, MessageTemplate>;
  private speedConfig: SpeedConfig;
  private dashboardMetrics: DashboardMetrics;

  constructor() {
    this.leads = new Map();
    this.messageTemplates = new Map();
    
    // Initialize default speed config
    this.speedConfig = {
      id: randomUUID(),
      messagesPerMinute: 3,
      messagesPerHour: 30,
    };

    // Initialize default dashboard metrics
    this.dashboardMetrics = {
      id: randomUUID(),
      totalLeads: 0,
      messagesToday: 0,
      messagesMonth: 0,
      conversionRate: "0%",
      contacted: 0,
      notContacted: 0,
      lastUpdated: new Date(),
    };

    // Initialize default message template
    const defaultTemplateId = randomUUID();
    this.messageTemplates.set(defaultTemplateId, {
      id: defaultTemplateId,
      template: "Olá! Somos uma empresa especializada em soluções digitais para negócios como o {NOME_DA_EMPRESA}. Gostaria de agendar uma conversa rápida para apresentar como podemos ajudar a aumentar suas vendas? Sem compromisso! 😊",
      isActive: 1,
    });
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      dateAdded: new Date(),
      status: insertLead.status || "Não Contatado",
      businessType: insertLead.businessType || null,
      location: insertLead.location || null,
    };
    this.leads.set(id, lead);
    
    // Update dashboard metrics
    await this.updateDashboardMetrics({
      totalLeads: (this.dashboardMetrics.totalLeads || 0) + 1,
      notContacted: (this.dashboardMetrics.notContacted || 0) + 1,
    });
    
    return lead;
  }

  async updateLeadStatus(id: string, statusUpdate: UpdateLeadStatus): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const oldStatus = lead.status;
    const updatedLead = { ...lead, status: statusUpdate.status };
    this.leads.set(id, updatedLead);

    // Update dashboard metrics based on status change
    if (oldStatus === "Não Contatado" && statusUpdate.status === "Mensagem Enviada") {
      await this.updateDashboardMetrics({
        notContacted: Math.max(0, (this.dashboardMetrics.notContacted || 0) - 1),
        messagesToday: (this.dashboardMetrics.messagesToday || 0) + 1,
        messagesMonth: (this.dashboardMetrics.messagesMonth || 0) + 1,
      });
    } else if (oldStatus === "Mensagem Enviada" && statusUpdate.status === "Já Contatado") {
      await this.updateDashboardMetrics({
        contacted: (this.dashboardMetrics.contacted || 0) + 1,
      });
    }

    return updatedLead;
  }

  async searchLeads(params: SearchLeads): Promise<Lead[]> {
    const allLeads = await this.getLeads();
    return allLeads.filter(lead => {
      if (params.businessType && !lead.businessType?.toLowerCase().includes(params.businessType.toLowerCase())) {
        return false;
      }
      if (params.location && !lead.location?.toLowerCase().includes(params.location.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  async getActiveMessageTemplate(): Promise<MessageTemplate | undefined> {
    return Array.from(this.messageTemplates.values()).find(template => template.isActive === 1);
  }

  async updateMessageTemplate(templateData: InsertMessageTemplate): Promise<MessageTemplate> {
    // Deactivate all existing templates
    const templateEntries = Array.from(this.messageTemplates.entries());
    templateEntries.forEach(([key, template]) => {
      template.isActive = 0;
      this.messageTemplates.set(key, template);
    });

    const id = randomUUID();
    const template: MessageTemplate = {
      ...templateData,
      id,
      isActive: 1,
    };
    this.messageTemplates.set(id, template);
    return template;
  }

  async getSpeedConfig(): Promise<SpeedConfig> {
    return this.speedConfig;
  }

  async updateSpeedConfig(config: InsertSpeedConfig): Promise<SpeedConfig> {
    this.speedConfig = {
      ...this.speedConfig,
      ...config,
    };
    return this.speedConfig;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.dashboardMetrics;
  }

  async updateDashboardMetrics(updates: Partial<DashboardMetrics>): Promise<DashboardMetrics> {
    this.dashboardMetrics = {
      ...this.dashboardMetrics,
      ...updates,
      lastUpdated: new Date(),
    };

    // Calculate conversion rate
    const contacted = this.dashboardMetrics.contacted || 0;
    const totalLeads = this.dashboardMetrics.totalLeads || 0;
    if (contacted > 0 && totalLeads > 0) {
      const rate = (contacted / totalLeads) * 100;
      this.dashboardMetrics.conversionRate = `${rate.toFixed(1)}%`;
    }

    return this.dashboardMetrics;
  }

  async exportLeadsToCSV(): Promise<string> {
    const leads = await this.getLeads();
    const headers = ["Nome", "Endereço", "Telefone", "Email", "Status", "Data Adicionado", "Tipo de Empresa", "Localização"];
    
    const csvContent = [
      headers.join(","),
      ...leads.map(lead => [
        `"${lead.name}"`,
        `"${lead.address}"`,
        `"${lead.phone}"`,
        `"${lead.email}"`,
        `"${lead.status}"`,
        `"${lead.dateAdded.toLocaleDateString('pt-BR')}"`,
        `"${lead.businessType || ''}"`,
        `"${lead.location || ''}"`
      ].join(","))
    ].join("\n");

    return csvContent;
  }
}

export const storage = new MemStorage();
