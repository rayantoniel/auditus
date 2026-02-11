import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { startOfMonth, endOfMonth, isBefore } from "date-fns";
import { FileWarning, ClipboardCheck } from "lucide-react";

type Reclamacao = Tables<"reclamacoes">;
type APCL = Tables<"apcl">;

interface DashboardSummaryProps {
  reclamacoes: Reclamacao[];
  apcls: APCL[];
}

export function DashboardSummary({ reclamacoes, apcls }: DashboardSummaryProps) {
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);

  // Filter current month
  const recMes = reclamacoes.filter(r => {
    if (!r.created_at) return false;
    const d = new Date(r.created_at);
    return d >= startMonth && d <= endMonth;
  });

  const apclMes = apcls.filter(a => {
    if (!a.created_at) return false;
    const d = new Date(a.created_at);
    return d >= startMonth && d <= endMonth;
  });

  // Cod 100: count of records (total do mês)
  const recCod100 = recMes.length;
  const apclCod100 = apclMes.filter(a => a.cod === 100).length;

  // % Tratadas: respondidas antes do prazo
  const recTratadasCount = recMes.filter(r => {
    if (!r.respondido_em || !r.prazo) return false;
    return isBefore(new Date(r.respondido_em), new Date(r.prazo)) || r.respondido_em <= r.prazo;
  }).length;
  const recTratadas = recMes.length > 0 ? Math.round((recTratadasCount / recMes.length) * 100) : 0;

  const apclTratadasCount = apclMes.filter(a => {
    if (!a.arquivada || !a.prazo_resposta) return false;
    if (!a.data_visita) return false;
    return a.data_visita <= a.prazo_resposta;
  }).length;
  const apclTratadas = apclMes.length > 0 ? Math.round((apclTratadasCount / apclMes.length) * 100) : 0;

  // % Procedentes: têm conclusão e conclusão != "medição normal" e não é vazio
  const recProcedenteCount = recMes.filter(r => {
    if (!r.conclusao || r.conclusao.trim() === "") return false;
    return r.conclusao.toLowerCase() !== "medição normal";
  }).length;
  const recProcedentes = recMes.length > 0 ? Math.round((recProcedenteCount / recMes.length) * 100) : 0;

  const apclProcedenteCount = apclMes.filter(a => {
    if (!a.conclusao || a.conclusao.trim() === "") return false;
    return a.conclusao.toLowerCase() !== "medição normal";
  }).length;
  const apclProcedentes = apclMes.length > 0 ? Math.round((apclProcedenteCount / apclMes.length) * 100) : 0;

  const rows = [
    { label: "Cod 100", recValue: recCod100.toString(), apclValue: apclCod100.toString() },
    { label: "% Tratadas no Prazo", recValue: `${recTratadas}%`, apclValue: `${apclTratadas}%` },
    { label: "% Procedentes", recValue: `${recProcedentes}%`, apclValue: `${apclProcedentes}%` },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Resumo do Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Indicador</th>
                <th className="text-center p-3 font-medium">
                  <div className="flex items-center justify-center gap-1.5">
                    <FileWarning className="w-4 h-4 text-primary" />
                    Reclamações
                  </div>
                </th>
                <th className="text-center p-3 font-medium">
                  <div className="flex items-center justify-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    APCL
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3 font-medium text-muted-foreground">{row.label}</td>
                  <td className="p-3 text-center text-lg font-bold">{row.recValue}</td>
                  <td className="p-3 text-center text-lg font-bold">{row.apclValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
