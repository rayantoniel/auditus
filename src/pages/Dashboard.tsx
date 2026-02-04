import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResponsesChart } from "@/components/dashboard/ResponsesChart";
import { TopCitiesCard } from "@/components/dashboard/TopCitiesCard";
import { FrequencyCard } from "@/components/dashboard/FrequencyCard";
import { 
  FileWarning, 
  CheckCircle2, 
  AlertTriangle, 
  Home,
  TrendingUp,
  FileText,
  ClipboardCheck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const currentMonth = new Date();
  const startMonth = startOfMonth(currentMonth);
  const endMonth = endOfMonth(currentMonth);

  // Fetch reclamações
  const { data: reclamacoes = [] } = useQuery({
    queryKey: ["reclamacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reclamacoes")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch APCLs
  const { data: apcls = [] } = useQuery({
    queryKey: ["apcl"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apcl")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const totalReclamacoes = reclamacoes.length;
  
  const reclamacoesRespondidas = reclamacoes.filter(r => r.respondido_em).length;
  
  const reclamacoesSemCampo = reclamacoes.filter(r => 
    r.respondido_em && !r.data_visita
  ).length;

  // Instalações reincidentes
  const instalacaoCount: Record<number, number> = {};
  reclamacoes.forEach(r => {
    if (r.instalacao) {
      instalacaoCount[r.instalacao] = (instalacaoCount[r.instalacao] || 0) + 1;
    }
  });
  const instalacoesReincidentes = Object.values(instalacaoCount).filter(c => c > 1).length;

  // Top cities
  const cidadeCount: Record<string, number> = {};
  reclamacoes
    .filter(r => {
      if (!r.created_at) return false;
      const date = new Date(r.created_at);
      return date >= startMonth && date <= endMonth;
    })
    .forEach(r => {
      if (r.cidade) {
        cidadeCount[r.cidade] = (cidadeCount[r.cidade] || 0) + 1;
      }
    });
  
  const topCities = Object.entries(cidadeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([city, count]) => ({
      city,
      count,
      percentage: Math.round((count / totalReclamacoes) * 100) || 0,
    }));

  // Top motivos (tipos de reclamação)
  const motivoCount: Record<string, number> = {};
  reclamacoes.forEach(r => {
    if (r.tipo_reclamacao) {
      motivoCount[r.tipo_reclamacao] = (motivoCount[r.tipo_reclamacao] || 0) + 1;
    }
  });
  
  const topMotivos = Object.entries(motivoCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalReclamacoes) * 100) || 0,
    }));

  // Top conclusões de reclamações
  const conclusaoRecCount: Record<string, number> = {};
  reclamacoes.forEach(r => {
    if (r.conclusao) {
      conclusaoRecCount[r.conclusao] = (conclusaoRecCount[r.conclusao] || 0) + 1;
    }
  });
  
  const topConclusoesRec = Object.entries(conclusaoRecCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / reclamacoes.filter(r => r.conclusao).length) * 100) || 0,
    }));

  // Top conclusões de APCL
  const conclusaoApclCount: Record<string, number> = {};
  apcls.forEach(a => {
    if (a.conclusao) {
      conclusaoApclCount[a.conclusao] = (conclusaoApclCount[a.conclusao] || 0) + 1;
    }
  });
  
  const topConclusoesApcl = Object.entries(conclusaoApclCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / apcls.filter(a => a.conclusao).length) * 100) || 0,
    }));

  // Responses by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, "dd/MM", { locale: ptBR }),
      fullDate: format(date, "yyyy-MM-dd"),
    };
  });

  const responsesByDay = last7Days.map(({ date, fullDate }) => {
    const count = reclamacoes.filter(r => 
      r.respondido_em && format(new Date(r.respondido_em), "yyyy-MM-dd") === fullDate
    ).length;
    return { date, count };
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das reclamações - {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Reclamações"
            value={totalReclamacoes}
            subtitle="Este mês"
            icon={<FileWarning className="w-6 h-6" />}
            variant="primary"
          />
          <StatCard
            title="Respondidas"
            value={reclamacoesRespondidas}
            subtitle={`${Math.round((reclamacoesRespondidas / totalReclamacoes) * 100) || 0}% do total`}
            icon={<CheckCircle2 className="w-6 h-6" />}
            variant="success"
          />
          <StatCard
            title="Instalações Reincidentes"
            value={instalacoesReincidentes}
            subtitle="Com mais de uma reclamação"
            icon={<AlertTriangle className="w-6 h-6" />}
            variant="warning"
          />
          <StatCard
            title="Sem Visita a Campo"
            value={reclamacoesSemCampo}
            subtitle="Resolvidas remotamente"
            icon={<Home className="w-6 h-6" />}
            variant="default"
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ResponsesChart data={responsesByDay} />
          </div>
          <TopCitiesCard cities={topCities.length > 0 ? topCities : [
            { city: "Sem dados", count: 0, percentage: 0 }
          ]} />
        </div>

        {/* Frequency Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FrequencyCard
            title="Motivos Mais Frequentes"
            items={topMotivos}
            icon={<FileText className="w-5 h-5 text-primary" />}
            emptyMessage="Nenhum tipo de reclamação registrado"
          />
          <FrequencyCard
            title="Conclusões - Reclamações"
            items={topConclusoesRec}
            icon={<ClipboardCheck className="w-5 h-5 text-primary" />}
            emptyMessage="Nenhuma conclusão registrada"
          />
          <FrequencyCard
            title="Conclusões - APCL"
            items={topConclusoesApcl}
            icon={<ClipboardCheck className="w-5 h-5 text-primary" />}
            emptyMessage="Nenhuma conclusão registrada"
          />
        </div>

        {/* Quick Stats */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Resumo Rápido</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-foreground">
                {totalReclamacoes - reclamacoesRespondidas}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round((reclamacoesRespondidas / totalReclamacoes) * 100) || 0}%
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total APCL</p>
              <p className="text-2xl font-bold text-foreground">
                {apcls.length}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Arquivadas</p>
              <p className="text-2xl font-bold text-foreground">
                {reclamacoes.filter(r => r.arquivada).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
