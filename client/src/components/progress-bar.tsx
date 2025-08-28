import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import type { DashboardMetrics, SpeedConfig } from "@shared/schema";

export default function ProgressBar() {
  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard-metrics"],
  });

  const { data: speedConfig } = useQuery<SpeedConfig>({
    queryKey: ["/api/speed-config"],
  });

  const dailyGoal = speedConfig?.messagesPerHour || 30;
  const messagesSentToday = metrics?.messagesToday || 0;
  const progressPercentage = Math.min((messagesSentToday / dailyGoal) * 100, 100);

  return (
    <Card className="mt-8 rounded-xl shadow-md p-6 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          <BarChart3 className="inline w-5 h-5 mr-2 text-primary" />
          Progresso Diário
        </h3>
        <span className="text-sm text-muted-foreground" data-testid="text-progress-summary">
          {messagesSentToday} de {dailyGoal} mensagens enviadas hoje
        </span>
      </div>
      <Progress 
        value={progressPercentage} 
        className="w-full h-3 bg-muted"
        data-testid="progress-daily-messages"
      />
      <p className="text-xs text-muted-foreground mt-2" data-testid="text-progress-percentage">
        {progressPercentage.toFixed(0)}% da meta diária alcançada
      </p>
    </Card>
  );
}
