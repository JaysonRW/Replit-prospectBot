import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { List, Phone, Mail, MessageCircle, CheckCircle, Plus } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { Lead } from "@shared/schema";
import { sendWhatsAppMessage } from "@/lib/whatsapp-simulator";
import { useToast } from "@/hooks/use-toast";

export default function LeadsList() {
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const whatsappMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return await sendWhatsAppMessage(leadId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-metrics"] });
      toast({
        title: "Mensagem enviada!",
        description: `Mensagem enviada para ${data.lead.name} via WhatsApp!`,
      });
    },
    onError: () => {
      toast({
        title: "Erro no envio",
        description: "Falha ao enviar mensagem via WhatsApp.",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads.filter(lead => 
    statusFilter === "Todos" || lead.status === statusFilter
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Não Contatado":
        return "bg-red-100 text-red-800";
      case "Mensagem Enviada":
        return "bg-green-100 text-green-800";
      case "Já Contatado":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md border border-border">
        <div className="p-6 border-b border-border">
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-xl p-4 animate-pulse">
                <div className="h-20 bg-background rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-md border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">
            <List className="inline w-5 h-5 mr-2 text-primary" />
            Lista de Leads
          </h2>
          <div className="flex items-center space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Não Contatado">Não Contatado</SelectItem>
                <SelectItem value="Mensagem Enviada">Mensagem Enviada</SelectItem>
                <SelectItem value="Já Contatado">Já Contatado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              {statusFilter === "Todos" 
                ? "Nenhum lead encontrado. Use a busca para adicionar novos leads."
                : `Nenhum lead com status "${statusFilter}" encontrado.`
              }
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="bg-muted rounded-xl p-4 border border-border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground" data-testid={`text-lead-name-${lead.id}`}>
                      {lead.name}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-lead-address-${lead.id}`}>
                      {lead.address}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeVariant(lead.status)}`}>
                      {lead.status}
                    </Badge>
                    
                    {/* Lead Score Badge */}
                    {lead.leadScore && (
                      <div className="flex flex-col items-end space-y-1">
                        <Badge 
                          className={`text-xs px-2 py-1 rounded-full ${
                            lead.leadCategory === "Quente" 
                              ? "bg-red-100 text-red-800 border border-red-200" 
                              : lead.leadCategory === "Morno"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {lead.leadCategory || "N/A"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Score: {lead.leadScore}/100
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="w-4 h-4 mr-2" />
                    <span data-testid={`text-lead-phone-${lead.id}`}>{lead.phone}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="w-4 h-4 mr-2" />
                    <span data-testid={`text-lead-email-${lead.id}`}>{lead.email}</span>
                  </div>
                </div>
                
                {/* Informações adicionais do Lead */}
                {lead.rating || lead.userRatingsTotal || lead.website ? (
                  <div className="grid grid-cols-3 gap-4 mb-3 text-xs text-muted-foreground">
                    {lead.rating && (
                      <div className="flex items-center">
                        <span className="mr-1">⭐</span>
                        <span>{lead.rating}</span>
                      </div>
                    )}
                    {lead.userRatingsTotal && (
                      <div className="flex items-center">
                        <span className="mr-1">👥</span>
                        <span>{lead.userRatingsTotal} avaliações</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="mr-1">{lead.website ? "🌐" : "❌"}</span>
                      <span>{lead.website ? "Com site" : "Sem site"}</span>
                    </div>
                  </div>
                ) : null}
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Adicionado: {formatDate(lead.dateAdded)}
                  </span>
                  
                  {lead.status === "Não Contatado" && (
                    <Button 
                      onClick={() => whatsappMutation.mutate(lead.id)}
                      disabled={whatsappMutation.isPending}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-sm"
                      data-testid={`button-send-whatsapp-${lead.id}`}
                    >
                      <FaWhatsapp className="w-4 h-4 mr-2" />
                      {whatsappMutation.isPending && whatsappMutation.variables === lead.id 
                        ? "Enviando..." 
                        : "Enviar WhatsApp"
                      }
                    </Button>
                  )}
                  
                  {lead.status === "Mensagem Enviada" && (
                    <Button 
                      disabled
                      variant="ghost"
                      className="bg-muted text-muted-foreground cursor-not-allowed text-sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Enviado
                    </Button>
                  )}
                  
                  {lead.status === "Já Contatado" && (
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
                      data-testid={`button-contact-again-${lead.id}`}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contatar Novamente
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            data-testid="button-load-more-leads"
          >
            <Plus className="w-4 h-4 mr-2" />
            Carregar Mais Leads
          </Button>
        </div>
      </div>
    </Card>
  );
}
