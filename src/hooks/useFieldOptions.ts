import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FieldCategory =
  | "tipo_reclamacao"
  | "conclusao_reclamacao"
  | "equipe_reclamacao"
  | "origem_apcl"
  | "conclusao_apcl"
  | "equipe_apcl";

interface FieldOption {
  id: string;
  categoria: string;
  valor: string;
  created_at: string;
}

export function useFieldOptions(categoria: FieldCategory) {
  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["opcoes_campos", categoria],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opcoes_campos" as any)
        .select("*")
        .eq("categoria", categoria)
        .order("valor");

      if (error) throw error;
      return (data as unknown as FieldOption[]) ?? [];
    },
  });

  const addOption = useMutation({
    mutationFn: async (valor: string) => {
      const { error } = await supabase
        .from("opcoes_campos" as any)
        .insert({ categoria, valor } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opcoes_campos", categoria] });
    },
  });

  const removeOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("opcoes_campos" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opcoes_campos", categoria] });
    },
  });

  const values = options.map((o) => o.valor);

  return { options, values, isLoading, addOption, removeOption };
}
