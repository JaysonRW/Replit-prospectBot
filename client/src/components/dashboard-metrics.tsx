import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Users, MessageCircle, Calendar, TrendingUp, CheckCircle, Clock } from "lucide-react";
import type { DashboardMetrics } from "@shared/schema";

export default function DashboardMetrics() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard-metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total de Leads",
      value: metrics?.totalLeads || 0,
      icon: Users,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Mensagens Hoje",
      value: metrics?.messagesToday || 0,
      icon: MessageCircle,
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      title: "Mensagens Mês",
      value: metrics?.messagesMonth || 0,
      icon: Calendar,
      bgColor: "bg-accent/10",
      iconColor: "text-muted-foreground",
    },
    {
      title: "Taxa Conversão",
      value: metrics?.conversionRate || "0%",
      icon: TrendingUp,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Contatados",
      value: metrics?.contacted || 0,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Não Contatados",
      value: metrics?.notContacted || 0,
      icon: Clock,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {metricCards.map((metric, index) => (
        <Card key={index} className="rounded-xl shadow-md p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">{metric.title}</p>
              <p className="text-2xl font-bold text-foreground" data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {metric.value}
              </p>
            </div>
            <div className={`${metric.bgColor} ${metric.iconColor} w-12 h-12 rounded-lg flex items-center justify-center`}>
              <metric.icon className="w-5 h-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
