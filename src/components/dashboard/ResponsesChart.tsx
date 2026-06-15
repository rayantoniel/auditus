import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ResponsesChartProps {
  data: { date: string; count: number }[];
}

export function ResponsesChart({ data }: ResponsesChartProps) {
  return (
    <div className="stat-card h-80 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Reclamações Respondidas por Mês</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
          <XAxis 
            dataKey="date" 
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
            formatter={(value: number) => [value, "Respondidas"]}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="hsl(217, 91%, 50%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
