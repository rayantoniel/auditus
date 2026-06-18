import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

// Parse "YYYY-MM-DD" como data local (evita off-by-one por timezone).
export const parseLocalDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

export function usePeriodFilter() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [period, setPeriod] = useState<string>(String(now.getMonth()));

  const { rangeStart, rangeEnd, periodLabel } = useMemo(() => {
    if (period === "year") {
      return {
        rangeStart: startOfYear(new Date(currentYear, 0, 1)),
        rangeEnd: endOfYear(new Date(currentYear, 11, 31)),
        periodLabel: `Ano ${currentYear} (acumulado)`,
      };
    }
    const m = parseInt(period, 10);
    const ref = new Date(currentYear, m, 1);
    return {
      rangeStart: startOfMonth(ref),
      rangeEnd: endOfMonth(ref),
      periodLabel: format(ref, "MMMM yyyy", { locale: ptBR }),
    };
  }, [period, currentYear]);

  const inRange = (d: string | null | undefined) => {
    const date = parseLocalDate(d);
    if (!date) return false;
    return date >= rangeStart && date <= rangeEnd;
  };

  return { period, setPeriod, currentYear, rangeStart, rangeEnd, periodLabel, inRange };
}

interface PeriodFilterProps {
  period: string;
  onChange: (v: string) => void;
  currentYear: number;
  className?: string;
}

export function PeriodFilter({ period, onChange, currentYear, className }: PeriodFilterProps) {
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(currentYear, i, 1), "MMMM", { locale: ptBR }),
  }));

  return (
    <div className={className ?? "w-full sm:w-64"}>
      <Select value={period} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="year">Ano {currentYear} (acumulado)</SelectItem>
          {monthOptions.map(o => (
            <SelectItem key={o.value} value={o.value} className="capitalize">
              {o.label} {currentYear}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}