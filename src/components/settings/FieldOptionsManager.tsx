import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFieldOptions, type FieldCategory } from "@/hooks/useFieldOptions";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Loader2 } from "lucide-react";

interface FieldOptionsManagerProps {
  categoria: FieldCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function FieldOptionsManager({ categoria, title, description, icon }: FieldOptionsManagerProps) {
  const { options, addOption, removeOption, isLoading } = useFieldOptions(categoria);
  const [newValue, setNewValue] = useState("");

  const handleAdd = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;

    if (options.some((o) => o.valor.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Valor já existe", variant: "destructive" });
      return;
    }

    try {
      await addOption.mutateAsync(trimmed);
      setNewValue("");
      toast({ title: "Opção adicionada" });
    } catch {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeOption.mutateAsync(id);
      toast({ title: "Opção removida" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Nova opção..."
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-9"
          />
          <Button size="sm" onClick={handleAdd} disabled={addOption.isPending || !newValue.trim()}>
            {addOption.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : options.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma opção cadastrada</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <Badge key={opt.id} variant="secondary" className="gap-1 pr-1">
                {opt.valor}
                <button
                  onClick={() => handleRemove(opt.id)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                  disabled={removeOption.isPending}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
