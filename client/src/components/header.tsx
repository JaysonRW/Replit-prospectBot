import { Button } from "@/components/ui/button";
import { Settings, Download, Bot } from "lucide-react";
import { exportLeadsToCSV } from "@/lib/csv-export";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { toast } = useToast();

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
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-muted text-muted-foreground hover:bg-accent"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
