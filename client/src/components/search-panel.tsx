import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { searchLeadsSchema, type SearchLeads, type InsertLead } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SearchPanel() {
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SearchLeads>({
    resolver: zodResolver(searchLeadsSchema),
    defaultValues: {
      businessType: "",
      location: "",
      freeSearch: "",
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (data: SearchLeads) => {
      setIsSearching(true);
      
      // Buscar leads reais do Google Maps via API
      const response = await apiRequest("POST", "/api/leads/search", data);
      const leads = await response.json();
      
      return leads;
    },
    onSuccess: (leads) => {
      setIsSearching(false);
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-metrics"] });
      
      const searchType = form.getValues("freeSearch") ? "busca livre" : "tipo predefinido";
      toast({
        title: "Busca realizada com sucesso!",
        description: `${leads.length} empresas encontradas via ${searchType} no Google Maps.`,
      });
      form.reset();
    },
    onError: () => {
      setIsSearching(false);
      toast({
        title: "Erro na busca",
        description: "Falha ao buscar leads no Google Maps. Verifique sua conexão.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SearchLeads) => {
    // Validar se pelo menos uma opção de busca foi fornecida
    if (!data.freeSearch?.trim() && !data.businessType) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha a busca livre ou selecione um tipo de empresa.",
        variant: "destructive",
      });
      return;
    }
    
    // Se não houver localização, usar padrão
    if (!data.location?.trim()) {
      data.location = "São Paulo, SP";
    }
    
    searchMutation.mutate(data);
  };

  return (
    <Card className="rounded-xl shadow-md p-6 border border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        <Search className="inline w-5 h-5 mr-2 text-primary" />
        🔍 Busca Inteligente de Empresas
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Barra de Busca Livre - Prioridade */}
          <FormField
            control={form.control}
            name="freeSearch"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">
                  🔍 Busca Livre (Recomendado)
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Lojas de Material de Construção, Agências de Viagem, Escritórios de Advocacia..." 
                    {...field}
                    data-testid="input-free-search"
                    className="text-base"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Digite qualquer tipo de negócio que deseja encontrar
                </p>
              </FormItem>
            )}
          />

          <div className="text-center text-sm text-muted-foreground">
            — ou use as opções predefinidas abaixo —
          </div>

          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Tipo de Empresa (Predefinido)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-business-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Restaurantes">Restaurantes</SelectItem>
                    <SelectItem value="Academias">Academias</SelectItem>
                    <SelectItem value="Clínicas">Clínicas</SelectItem>
                    <SelectItem value="Escritórios">Escritórios</SelectItem>
                    <SelectItem value="Comércio">Comércio</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Localização</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: São Paulo, SP" 
                    {...field}
                    data-testid="input-location"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Filtros de Lead Scoring */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">🎯 Filtros de Qualidade do Lead</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-foreground">Nota mínima</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        placeholder="4.5"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minUserRatings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-foreground">Mín. avaliações</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-foreground">Website</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Qualquer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="false">Sem website (Alta oportunidade)</SelectItem>
                        <SelectItem value="true">Com website</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-foreground">Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Qualquer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Quente">🔥 Quente (Alta prioridade)</SelectItem>
                        <SelectItem value="Morno">🌡️ Morno (Média prioridade)</SelectItem>
                        <SelectItem value="Frio">❄️ Frio (Baixa prioridade)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={isSearching}
            data-testid="button-search-leads"
          >
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? "Buscando no Google Maps..." : "🔍 Buscar Empresas no Google Maps"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}

function generateMockLeads(searchData: SearchLeads): InsertLead[] {
  const businessNames = {
    "Restaurantes": ["Bella Vista", "Sabor & Arte", "Casa do Chef", "Tempero Mineiro", "Vila Gastronômica"],
    "Academias": ["Força Total", "Body Fitness", "Iron Gym", "Vida Saudável", "Power House"],
    "Clínicas": ["São João", "Vida & Saúde", "Centro Médico", "Clínica Popular", "Bem Estar"],
    "Escritórios": ["Advocacia Silva", "Contábil Santos", "Consultoria Lima", "Engenharia Costa", "Arquitetura Moderna"],
    "Comércio": ["Loja da Esquina", "Mega Store", "Boutique Elegante", "Casa & Decoração", "Tech Point"],
  };

  const addresses = [
    "Rua das Flores, 123 - Centro",
    "Av. Paulista, 456 - Bela Vista", 
    "Rua da Saúde, 789 - Vila Madalena",
    "Rua Augusta, 321 - Consolação",
    "Av. Faria Lima, 654 - Itaim Bibi",
  ];

  const phones = [
    "(11) 98765-4321",
    "(11) 91234-5678",
    "(11) 95555-1234",
    "(11) 97777-8888",
    "(11) 96666-9999",
  ];

  const businessType = searchData.businessType || "Restaurantes";
  const location = searchData.location || "São Paulo, SP";
  const names = businessNames[businessType as keyof typeof businessNames] || businessNames.Restaurantes;

  return Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, i) => ({
    name: `${businessType.slice(0, -1)} ${names[i % names.length]}`,
    address: `${addresses[i % addresses.length]}, ${location}`,
    phone: phones[i % phones.length],
    email: `contato@${names[i % names.length].toLowerCase().replace(/\s+/g, '')}.com`,
    status: "Não Contatado" as const,
    businessType,
    location,
  }));
}
