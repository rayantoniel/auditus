import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FrequencyItem {
  name: string;
  count: number;
  percentage: number;
}

interface FrequencyCardProps {
  title: string;
  items: FrequencyItem[];
  icon: React.ReactNode;
  emptyMessage?: string;
}

export function FrequencyCard({ title, items, icon, emptyMessage = "Sem dados" }: FrequencyCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[70%]" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-muted-foreground">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
