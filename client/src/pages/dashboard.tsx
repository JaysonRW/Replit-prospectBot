import Header from "@/components/header";
import DashboardMetrics from "@/components/dashboard-metrics";
import SearchPanel from "@/components/search-panel";
import MessageTemplateEditor from "@/components/message-template-editor";
import SpeedControl from "@/components/speed-control";
import LeadsList from "@/components/leads-list";
import ProgressBar from "@/components/progress-bar";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardMetrics />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <SearchPanel />
            <MessageTemplateEditor />
            <SpeedControl />
          </div>
          
          <div className="lg:col-span-2">
            <LeadsList />
          </div>
        </div>

        <ProgressBar />
      </div>
    </div>
  );
}
