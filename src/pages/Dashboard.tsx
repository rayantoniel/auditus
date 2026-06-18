import { MainLayout } from "@/components/layout/MainLayout";
import { useMemo } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResponsesChart } from "@/components/dashboard/ResponsesChart";
import { MonthlyResponsesChart } from "@/components/dashboard/MonthlyResponsesChart";
import { TopCitiesCard } from "@/components/dashboard/TopCitiesCard";
import { FrequencyCard } from "@/components/dashboard/FrequencyCard";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { 
  FileWarning, 
  CheckCircle2, 
  AlertTriangle, 
  Home,
  FileText,
  ClipboardCheck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePeriodFilter, PeriodFilter, parseLocalDate } from "@/hooks/usePeriodFilter";

export default function Dashboard() {
  const { period, setPeriod, currentYear, rangeStart, rangeEnd, periodLabel, inRange } = usePeriodFilter();

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

  // Filtered datasets — usa a data da reclamação (prazo / prazo_resposta) e
  // cai para created_at quando o campo estiver vazio.
  const reclamacoesFiltradas = useMemo(
    () => reclamacoes.filter(r => inRange(r.prazo ?? r.created_at)),
    [reclamacoes, rangeStart, rangeEnd]
  );
  const apclsFiltradas = useMemo(
    () => apcls.filter(a => inRange(a.prazo_resposta ?? a.created_at)),
    [apcls, rangeStart, rangeEnd]
  );

  // Calculate metrics (scoped to period)
  const totalReclamacoes = reclamacoesFiltradas.length;

  const reclamacoesRespondidas = reclamacoesFiltradas.filter(r => r.respondido_em).length;

  const reclamacoesSemCampo = reclamacoesFiltradas.filter(r =>
    r.respondido_em && r.nota_fs == null
  ).length;

  // Instalações reincidentes
  const instalacaoCount: Record<number, number> = {};
  reclamacoesFiltradas.forEach(r => {
    if (r.instalacao) {
      instalacaoCount[r.instalacao] = (instalacaoCount[r.instalacao] || 0) + 1;
    }
  });
  const instalacoesReincidentes = Object.values(instalacaoCount).filter(c => c > 1).length;

  // Top cities (scoped to period)
  const cidadeCount: Record<string, number> = {};
  reclamacoesFiltradas.forEach(r => {
    if (r.cidade) {
      cidadeCount[r.cidade] = (cidadeCount[r.cidade] || 0) + 1;
    }
  });
  
  const topCities = Object.entries(cidadeCount)
    .sort(([, a], [, b]) => b - a)
    .map(([city, count]) => ({
      city,
      count,
      percentage: Math.round((count / totalReclamacoes) * 100) || 0,
    }));

  // Top motivos (tipos de reclamação)
  const motivoCount: Record<string, number> = {};
  reclamacoesFiltradas.forEach(r => {
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
  reclamacoesFiltradas.forEach(r => {
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
      percentage: Math.round((count / reclamacoesFiltradas.filter(r => r.conclusao).length) * 100) || 0,
    }));

  // Top conclusões de APCL
  const conclusaoApclCount: Record<string, number> = {};
  apclsFiltradas.forEach(a => {
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
      percentage: Math.round((count / apclsFiltradas.filter(a => a.conclusao).length) * 100) || 0,
    }));

  // Responses by month — todos os meses do ano corrente
  const monthsOfYear = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i, 1);
    return {
      month: format(date, "MMM", { locale: ptBR }),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  // Respondidas: quando "ano", uma barra por mês; quando mês, uma por dia do mês selecionado.
  const responsesByDay = useMemo(() => {
    if (period === "year") {
      return monthsOfYear.map(({ month, start, end }) => {
        const rec = reclamacoes.filter(r => {
          const date = parseLocalDate(r.respondido_em);
          return date !== null && date >= start && date <= end;
        }).length;
        const ap = apcls.filter(a => {
          if (!a.arquivada) return false;
          const date = parseLocalDate(a.data_visita) ?? parseLocalDate(a.updated_at);
          return date !== null && date >= start && date <= end;
        }).length;
        return { date: month, count: rec + ap };
      });
    }
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    return days.map(day => {
      const sameDay = (d: Date | null) =>
        d !== null &&
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate();
      const rec = reclamacoes.filter(r => sameDay(parseLocalDate(r.respondido_em))).length;
      const ap = apcls.filter(a => {
        if (!a.arquivada) return false;
        return sameDay(parseLocalDate(a.data_visita) ?? parseLocalDate(a.updated_at));
      }).length;
      return { date: format(day, "dd"), count: rec + ap };
    });
  }, [period, reclamacoes, apcls, rangeStart, rangeEnd, monthsOfYear]);

  const responsesByMonth = monthsOfYear.map(({ month, start, end }) => {
    const reclamacoesCount = reclamacoes.filter(r => {
      const date = parseLocalDate(r.respondido_em);
      return date !== null && date >= start && date <= end;
    }).length;

    const apclCount = apcls.filter(a => {
      if (!a.arquivada) return false;
      const date = parseLocalDate(a.data_visita) ?? parseLocalDate(a.updated_at);
      return date !== null && date >= start && date <= end;
    }).length;

    return { month, reclamacoes: reclamacoesCount, apcl: apclCount };
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 capitalize">
              Visão geral - {periodLabel}
            </p>
          </div>
          <PeriodFilter period={period} onChange={setPeriod} currentYear={currentYear} />
        </div>

        {/* Summary Table */}
        <DashboardSummary
          reclamacoes={reclamacoesFiltradas}
          apcls={apclsFiltradas}
          title={period === "year" ? `Resumo Anual ${currentYear}` : `Resumo de ${periodLabel}`}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Reclamações"
            value={totalReclamacoes}
            subtitle={period === "year" ? "No ano" : "No mês"}
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
        <div className="grid grid-cols-1 gap-6">
          <ResponsesChart
            data={responsesByDay}
            title={
              period === "year"
                ? `Reclamações Respondidas por Mês — ${currentYear}`
                : `Reclamações Respondidas por Dia — ${periodLabel}`
            }
          />
        </div>

        {/* Monthly Chart */}
        <div className="grid grid-cols-1 gap-6">
          <MonthlyResponsesChart data={responsesByMonth} />
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

        {/* Top Cities - All cities */}
        <TopCitiesCard cities={topCities.length > 0 ? topCities : [
          { city: "Sem dados", count: 0, percentage: 0 }
        ]} />
      </div>
    </MainLayout>
  );
}
