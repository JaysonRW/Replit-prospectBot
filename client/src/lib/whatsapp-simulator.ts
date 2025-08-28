import { apiRequest } from "./queryClient";
import type { Lead } from "@shared/schema";

export async function sendWhatsAppMessage(leadId: string): Promise<{ success: boolean; message: string; lead: Lead }> {
  try {
    const response = await apiRequest("POST", "/api/whatsapp/send", { leadId });
    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
