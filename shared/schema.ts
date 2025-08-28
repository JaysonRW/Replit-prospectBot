import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("Não Contatado"),
  dateAdded: timestamp("date_added").defaultNow().notNull(),
  businessType: text("business_type"),
  location: text("location"),
});

export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  template: text("template").notNull(),
  isActive: integer("is_active").default(1),
});

export const speedConfig = pgTable("speed_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messagesPerMinute: integer("messages_per_minute").default(3),
  messagesPerHour: integer("messages_per_hour").default(30),
});

export const dashboardMetrics = pgTable("dashboard_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalLeads: integer("total_leads").default(0),
  messagesToday: integer("messages_today").default(0),
  messagesMonth: integer("messages_month").default(0),
  conversionRate: text("conversion_rate").default("0%"),
  contacted: integer("contacted").default(0),
  notContacted: integer("not_contacted").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  dateAdded: true,
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
});

export const insertSpeedConfigSchema = createInsertSchema(speedConfig).omit({
  id: true,
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(["Não Contatado", "Mensagem Enviada", "Já Contatado"]),
});

export const searchLeadsSchema = z.object({
  businessType: z.string().optional(),
  location: z.string().optional(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type SpeedConfig = typeof speedConfig.$inferSelect;
export type InsertSpeedConfig = z.infer<typeof insertSpeedConfigSchema>;
export type DashboardMetrics = typeof dashboardMetrics.$inferSelect;
export type UpdateLeadStatus = z.infer<typeof updateLeadStatusSchema>;
export type SearchLeads = z.infer<typeof searchLeadsSchema>;
