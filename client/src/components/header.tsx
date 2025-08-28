import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Download, Bot, Info, Palette, Database } from "lucide-react";
import { exportLeadsToCSV } from "@/lib/csv-export";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleExportCSV = async () => {
    try {
      await exportLeadsToCSV();
      toast({
        title: "Exportação realizada!",
        description: "Arquivo CSV exportado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Falha ao exportar arquivo CSV.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ProspectBot</h1>
              <p className="text-xs text-muted-foreground">Sistema de Prospecção Automatizada</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleExportCSV}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="bg-muted text-muted-foreground hover:bg-accent"
                  data-testid="button-settings"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Configurações do Sistema
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-sm">Sobre o ProspectBot</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sistema automatizado de prospecção de leads via Google Maps e WhatsApp
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Database className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-sm">Armazenamento</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dados salvos em memória local - dados são resetados ao reiniciar
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Palette className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-sm">Interface</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tema claro com cores azul (#2563eb) e verde (#10b981)
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Button 
                      onClick={() => setSettingsOpen(false)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}
