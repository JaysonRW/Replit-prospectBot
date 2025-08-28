import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Gauge } from "lucide-react";
import { insertSpeedConfigSchema, type InsertSpeedConfig, type SpeedConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SpeedControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery<SpeedConfig>({
    queryKey: ["/api/speed-config"],
  });

  const form = useForm<InsertSpeedConfig>({
    resolver: zodResolver(insertSpeedConfigSchema),
    defaultValues: {
      messagesPerMinute: 3,
      messagesPerHour: 30,
    },
  });

  // Update form when config data loads
  useEffect(() => {
    if (config && !form.formState.isDirty) {
      form.reset({
        messagesPerMinute: config.messagesPerMinute,
        messagesPerHour: config.messagesPerHour,
      });
    }
  }, [config, form]);

  const updateConfigMutation = useMutation({
    mutationFn: async (data: InsertSpeedConfig) => {
      const response = await apiRequest("POST", "/api/speed-config", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/speed-config"] });
      toast({
        title: "Configuração salva!",
        description: "Configuração de velocidade atualizada.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao atualizar configuração de velocidade.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSpeedConfig) => {
    updateConfigMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md p-6 border border-border">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-6 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  const messagesPerMinute = form.watch("messagesPerMinute");
  const messagesPerHour = form.watch("messagesPerHour");

  return (
    <Card className="rounded-xl shadow-md p-6 border border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        <Gauge className="inline w-5 h-5 mr-2 text-primary" />
        Controle de Velocidade
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="messagesPerMinute"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Mensagens por Minuto</FormLabel>
                <div className="flex items-center space-x-3">
                  <FormControl>
                    <Slider
                      min={2}
                      max={5}
                      step={1}
                      value={[field.value || 3]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="flex-1"
                      data-testid="slider-messages-per-minute"
                    />
                  </FormControl>
                  <span className="bg-muted text-muted-foreground px-3 py-1 rounded text-sm font-medium min-w-[2rem] text-center">
                    {messagesPerMinute}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Recomendado: 2-5 mensagens</p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="messagesPerHour"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Mensagens por Hora</FormLabel>
                <div className="flex items-center space-x-3">
                  <FormControl>
                    <Slider
                      min={20}
                      max={50}
                      step={1}
                      value={[field.value || 30]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="flex-1"
                      data-testid="slider-messages-per-hour"
                    />
                  </FormControl>
                  <span className="bg-muted text-muted-foreground px-3 py-1 rounded text-sm font-medium min-w-[2rem] text-center">
                    {messagesPerHour}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Recomendado: 20-50 mensagens</p>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={updateConfigMutation.isPending}
            data-testid="button-save-speed-config"
          >
            {updateConfigMutation.isPending ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
