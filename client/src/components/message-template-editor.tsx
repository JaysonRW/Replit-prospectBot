import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, Save } from "lucide-react";
import { insertMessageTemplateSchema, type InsertMessageTemplate, type MessageTemplate } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MessageTemplateEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: template, isLoading } = useQuery<MessageTemplate>({
    queryKey: ["/api/message-template"],
  });

  const form = useForm<InsertMessageTemplate>({
    resolver: zodResolver(insertMessageTemplateSchema),
    defaultValues: {
      template: template?.template || "",
    },
  });

  // Update form when template data loads
  if (template && !form.getValues().template) {
    form.setValue("template", template.template);
  }

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: InsertMessageTemplate) => {
      const response = await apiRequest("POST", "/api/message-template", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-template"] });
      toast({
        title: "Template salvo!",
        description: "Template de mensagem salvo com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar template de mensagem.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMessageTemplate) => {
    updateTemplateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md p-6 border border-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-md p-6 border border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        <Edit className="inline w-5 h-5 mr-2 text-primary" />
        Modelo de Mensagem
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="template"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Mensagem Template</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={6}
                    placeholder="Digite sua mensagem..."
                    className="text-sm"
                    {...field}
                    data-testid="textarea-message-template"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Placeholders disponíveis:</p>
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              {"{NOME_DA_EMPRESA}"}
            </Badge>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
            disabled={updateTemplateMutation.isPending}
            data-testid="button-save-template"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateTemplateMutation.isPending ? "Salvando..." : "Salvar Template"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
