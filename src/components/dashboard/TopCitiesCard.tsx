import { MapPin } from "lucide-react";

interface CityData {
  city: string;
  count: number;
  percentage: number;
}

interface TopCitiesCardProps {
  cities: CityData[];
}

export function TopCitiesCard({ cities }: TopCitiesCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Cidades com Mais Reclamações</h3>
      </div>
      <div className="space-y-4">
        {cities.map((city, index) => (
          <div key={city.city} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {index + 1}. {city.city}
              </span>
              <span className="text-sm text-muted-foreground">
                {city.count} ({city.percentage}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${city.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
