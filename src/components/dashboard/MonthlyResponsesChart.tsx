import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MonthlyResponsesChartProps {
  data: { month: string; reclamacoes: number; apcl: number }[];
}

export function MonthlyResponsesChart({ data }: MonthlyResponsesChartProps) {
  return (
    <div className="stat-card h-80 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Respondidas por Mês</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(214, 32%, 91%)",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            labelStyle={{ color: "hsl(222, 47%, 11%)", fontWeight: 600 }}
          />
          <Legend />
          <Bar 
            dataKey="reclamacoes" 
            name="Reclamações"
            fill="hsl(217, 91%, 50%)" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="apcl" 
            name="APCL"
            fill="hsl(142, 71%, 45%)" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
