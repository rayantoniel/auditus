import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Archive, RotateCcw, Eye, Trash2, Filter, ArrowUp, ArrowDown, ArrowUpDown, GripVertical } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { EditableCell } from "@/components/table/EditableCell";
import { useFieldOptions } from "@/hooks/useFieldOptions";
import { usePeriodFilter, PeriodFilter } from "@/hooks/usePeriodFilter";

type Reclamacao = Tables<"reclamacoes">;

type SortConfig = {
  field: "prazo" | "data_visita" | "respondido_em" | "manual";
  direction: "asc" | "desc";
};

export default function Reclamacoes() {
  const [search, setSearch] = useState("");
  const { period, setPeriod, currentYear, periodLabel, inRange } = usePeriodFilter();
  const [selectedReclamacao, setSelectedReclamacao] = useState<Reclamacao | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterConclusao, setFilterConclusao] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "prazo", direction: "desc" });
  const queryClient = useQueryClient();
  const { values: tipoOptions } = useFieldOptions("tipo_reclamacao");
  const { values: conclusaoOptions } = useFieldOptions("conclusao_reclamacao");
  const { values: equipeOptions } = useFieldOptions("equipe_reclamacao");

  const { data: reclamacoes = [], isLoading } = useQuery({
    queryKey: ["reclamacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reclamacoes")
        .select("*")
        .order("prazo", { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: unknown }) => {
      const { error } = await supabase
        .from("reclamacoes")
        .update({ [field]: value })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reclamacoes"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o campo.",
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, arquivada }: { id: string; arquivada: boolean }) => {
      const updateData: { arquivada: boolean; respondido_em?: string } = { arquivada };
      if (arquivada && !selectedReclamacao?.respondido_em) {
        updateData.respondido_em = new Date().toISOString().split("T")[0];
      }
      const { error } = await supabase
        .from("reclamacoes")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reclamacoes"] });
      toast({
        title: "Sucesso",
        description: "Reclamação atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a reclamação.",
        variant: "destructive",
      });
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async ({ ids, arquivada }: { ids: string[]; arquivada: boolean }) => {
      const today = new Date().toISOString().split("T")[0];
      if (arquivada) {
        // Para arquivar: setar respondido_em só nas que ainda não têm.
        const semData = reclamacoes
          .filter(r => ids.includes(r.id) && !r.respondido_em)
          .map(r => r.id);
        if (semData.length > 0) {
          const { error } = await supabase
            .from("reclamacoes")
            .update({ arquivada: true, respondido_em: today })
            .in("id", semData);
          if (error) throw error;
        }
        const restantes = ids.filter(id => !semData.includes(id));
        if (restantes.length > 0) {
          const { error } = await supabase
            .from("reclamacoes")
            .update({ arquivada: true })
            .in("id", restantes);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("reclamacoes")
          .update({ arquivada: false })
          .in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["reclamacoes"] });
      setSelectedIds(new Set());
      toast({
        title: "Sucesso",
        description: vars.arquivada
          ? `${vars.ids.length} reclamação(ões) arquivada(s).`
          : `${vars.ids.length} reclamação(ões) desarquivada(s).`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível arquivar em massa.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("reclamacoes")
        .delete()
        .in("id", ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reclamacoes"] });
      setSelectedIds(new Set());
      toast({
        title: "Sucesso",
        description: "Reclamação(ões) excluída(s) com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a(s) reclamação(ões).",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("reclamacoes")
          .update({ sort_order: u.sort_order })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reclamacoes"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível reordenar.",
        variant: "destructive",
      });
    },
  });

  const handleCellUpdate = async (id: string, field: string, value: unknown) => {
    await updateMutation.mutateAsync({ id, field, value });
  };

  const handleSelectAll = (list: Reclamacao[], checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(list.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = () => {
    deleteMutation.mutate(Array.from(selectedIds));
    setShowDeleteDialog(false);
  };

  const handleSort = (field: SortConfig["field"]) => {
    if (field === "manual") {
      setSortConfig({ field: "manual", direction: "asc" });
      return;
    }
    setSortConfig(prev => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "desc" };
    });
  };

  const handleMoveRow = (data: Reclamacao[], index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.length) return;

    const currentItem = data[index];
    const targetItem = data[targetIndex];

    const currentOrder = (currentItem as any).sort_order ?? index;
    const targetOrder = (targetItem as any).sort_order ?? targetIndex;

    reorderMutation.mutate([
      { id: currentItem.id, sort_order: targetOrder },
      { id: targetItem.id, sort_order: currentOrder },
    ]);
  };

  const sortData = (list: Reclamacao[]) => {
    const sorted = [...list];
    if (sortConfig.field === "manual") {
      sorted.sort((a, b) => {
        const aOrder = (a as any).sort_order ?? 0;
        const bOrder = (b as any).sort_order ?? 0;
        return aOrder - bOrder;
      });
      return sorted;
    }
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.field] as string | null;
      const bVal = b[sortConfig.field] as string | null;
      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;
      const cmp = aVal.localeCompare(bVal);
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
    return sorted;
  };

  const SortIcon = ({ field }: { field: SortConfig["field"] }) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortConfig.direction === "asc" 
      ? <ArrowUp className="w-3 h-3 ml-1" /> 
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  // Get unique values for filters
  const tiposUnicos = [...new Set([...tipoOptions, ...reclamacoes.map(r => r.tipo_reclamacao).filter(Boolean) as string[]])];
  const conclusoesUnicas = [...new Set([...conclusaoOptions, ...reclamacoes.map(r => r.conclusao).filter(Boolean) as string[]])];
  const equipesUnicas = [...new Set([...equipeOptions, ...reclamacoes.map(r => r.equipe_responsavel).filter(Boolean) as string[]])];

  const reclamacoesNoPeriodo = reclamacoes.filter(r => inRange(r.prazo ?? r.created_at));
  const ativas = reclamacoesNoPeriodo.filter(r => !r.arquivada);
  const respondidas = reclamacoesNoPeriodo.filter(r => r.arquivada);

  // Find duplicate nota_rc, nota_fs, and instalacao values
  const getDuplicateKeys = (list: Reclamacao[]) => {
    const notaRcCount = new Map<number, number>();
    const notaFsCount = new Map<number, number>();
    const instalacaoCount = new Map<number, number>();
    
    list.forEach(r => {
      if (r.nota_rc) notaRcCount.set(r.nota_rc, (notaRcCount.get(r.nota_rc) || 0) + 1);
      if (r.nota_fs) notaFsCount.set(r.nota_fs, (notaFsCount.get(r.nota_fs) || 0) + 1);
      if (r.instalacao) instalacaoCount.set(r.instalacao, (instalacaoCount.get(r.instalacao) || 0) + 1);
    });

    return {
      duplicateNotaRc: new Set([...notaRcCount.entries()].filter(([, c]) => c > 1).map(([k]) => k)),
      duplicateNotaFs: new Set([...notaFsCount.entries()].filter(([, c]) => c > 1).map(([k]) => k)),
      duplicateInstalacao: new Set([...instalacaoCount.entries()].filter(([, c]) => c > 1).map(([k]) => k)),
    };
  };

  const hasDuplicate = (r: Reclamacao, duplicates: ReturnType<typeof getDuplicateKeys>) => {
    return (
      (r.nota_rc && duplicates.duplicateNotaRc.has(r.nota_rc)) ||
      (r.nota_fs && duplicates.duplicateNotaFs.has(r.nota_fs)) ||
      (r.instalacao && duplicates.duplicateInstalacao.has(r.instalacao))
    );
  };

  const filterReclamacoes = (list: Reclamacao[]) => {
    let filtered = list;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.cidade?.toLowerCase().includes(searchLower) ||
        r.instalacao?.toString().includes(search) ||
        r.equipe_responsavel?.toLowerCase().includes(searchLower) ||
        r.tipo_reclamacao?.toLowerCase().includes(searchLower) ||
        r.conclusao?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterTipo !== "all") {
      filtered = filtered.filter(r => r.tipo_reclamacao === filterTipo);
    }
    
    if (filterConclusao !== "all") {
      filtered = filtered.filter(r => r.conclusao === filterConclusao);
    }
    
    return sortData(filtered);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const ReclamacaoTable = ({ data }: { data: Reclamacao[] }) => {
    const duplicates = getDuplicateKeys(data);
    const allSelected = data.length > 0 && data.every(r => selectedIds.has(r.id));
    const isManualSort = sortConfig.field === "manual";
    
    return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={(checked) => handleSelectAll(data, !!checked)}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              {isManualSort && <TableHead className="w-[70px]">Ordem</TableHead>}
              <TableHead className="min-w-[80px]">Cod</TableHead>
              <TableHead className="min-w-[80px]">Nota RC</TableHead>
              <TableHead className="min-w-[80px]">Nota FS</TableHead>
              <TableHead className="min-w-[100px]">Instalação</TableHead>
              <TableHead 
                className="min-w-[120px] cursor-pointer select-none hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("prazo")}
              >
                <div className="flex items-center">
                  Prazo
                  <SortIcon field="prazo" />
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">Cidade</TableHead>
              <TableHead className="min-w-[150px]">Tipo</TableHead>
              <TableHead className="min-w-[150px]">Conclusão</TableHead>
              <TableHead className="min-w-[130px]">Resolução</TableHead>
              <TableHead 
                className="min-w-[120px] cursor-pointer select-none hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("respondido_em")}
              >
                <div className="flex items-center">
                  Respondido em
                  <SortIcon field="respondido_em" />
                </div>
              </TableHead>
              <TableHead 
                className="min-w-[120px] cursor-pointer select-none hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("data_visita")}
              >
                <div className="flex items-center">
                  Data Visita
                  <SortIcon field="data_visita" />
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">Equipe</TableHead>
              <TableHead className="min-w-[200px]">Observações</TableHead>
              <TableHead className="min-w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isManualSort ? 17 : 16} className="text-center py-8 text-muted-foreground">
                  Nenhuma reclamação encontrada
                </TableCell>
              </TableRow>
            ) : (
              data.map((reclamacao, index) => {
                const isDuplicate = hasDuplicate(reclamacao, duplicates);
                const isSelected = selectedIds.has(reclamacao.id);
                return (
                  <TableRow 
                    key={reclamacao.id} 
                    className={`${isDuplicate ? "bg-destructive/10 hover:bg-destructive/20" : "hover:bg-muted/30"} ${isSelected ? "bg-primary/10" : ""}`}
                  >
                  <TableCell>
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(reclamacao.id, !!checked)}
                      aria-label="Selecionar"
                    />
                  </TableCell>
                  {isManualSort && (
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === 0 || reorderMutation.isPending}
                          onClick={() => handleMoveRow(data, index, "up")}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === data.length - 1 || reorderMutation.isPending}
                          onClick={() => handleMoveRow(data, index, "down")}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-mono">
                    <EditableCell
                      value={reclamacao.cod}
                      type="select"
                      options={["100", "200", "300"]}
                      onSave={(v) => handleCellUpdate(reclamacao.id, "cod", v ? Number(v) : null)}
                    />
                  </TableCell>
                  <TableCell className="font-mono">
                    <EditableCell
                      value={reclamacao.nota_rc}
                      type="number"
                      onSave={(v) => handleCellUpdate(reclamacao.id, "nota_rc", v)}
                    />
                  </TableCell>
                  <TableCell className="font-mono">
                    <EditableCell
                      value={reclamacao.nota_fs}
                      type="number"
                      onSave={(v) => handleCellUpdate(reclamacao.id, "nota_fs", v)}
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    <EditableCell
                      value={reclamacao.instalacao}
                      type="number"
                      onSave={(v) => handleCellUpdate(reclamacao.id, "instalacao", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.prazo}
                      type="date"
                      onSave={(v) => handleCellUpdate(reclamacao.id, "prazo", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.cidade}
                      onSave={(v) => handleCellUpdate(reclamacao.id, "cidade", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.tipo_reclamacao}
                      type="select"
                      options={tiposUnicos as string[]}
                      onSave={(v) => handleCellUpdate(reclamacao.id, "tipo_reclamacao", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.conclusao}
                      type="select"
                      options={conclusoesUnicas as string[]}
                      onSave={(v) => handleCellUpdate(reclamacao.id, "conclusao", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.resolucao}
                      type="select"
                      options={["Procedente", "Improcedente"]}
                      onSave={(v) => handleCellUpdate(reclamacao.id, "resolucao", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.respondido_em}
                      type="date"
                      onSave={(v) => handleCellUpdate(reclamacao.id, "respondido_em", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.data_visita}
                      type="date"
                      onSave={(v) => handleCellUpdate(reclamacao.id, "data_visita", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.equipe_responsavel}
                      type="select"
                      options={equipesUnicas}
                      onSave={(v) => handleCellUpdate(reclamacao.id, "equipe_responsavel", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.observacoes}
                      onSave={(v) => handleCellUpdate(reclamacao.id, "observacoes", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedReclamacao(reclamacao);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {reclamacao.arquivada ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => archiveMutation.mutate({ id: reclamacao.id, arquivada: false })}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => archiveMutation.mutate({ id: reclamacao.id, arquivada: true })}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedIds(new Set([reclamacao.id]));
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reclamações</h1>
            <p className="text-muted-foreground mt-1 capitalize">
              {periodLabel} • Clique em qualquer célula para editar
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodFilter
              period={period}
              onChange={setPeriod}
              currentYear={currentYear}
              className="w-full sm:w-56"
            />
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    bulkArchiveMutation.mutate({
                      ids: Array.from(selectedIds),
                      arquivada: true,
                    })
                  }
                  disabled={bulkArchiveMutation.isPending}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Arquivar ({selectedIds.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    bulkArchiveMutation.mutate({
                      ids: Array.from(selectedIds),
                      arquivada: false,
                    })
                  }
                  disabled={bulkArchiveMutation.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Desarquivar ({selectedIds.size})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cidade, instalação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Reclamação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tiposUnicos.map(tipo => (
                  <SelectItem key={tipo} value={tipo!}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterConclusao} onValueChange={setFilterConclusao}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Conclusão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas conclusões</SelectItem>
                {conclusoesUnicas.map(conclusao => (
                  <SelectItem key={conclusao} value={conclusao!}>{conclusao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={sortConfig.field === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("manual")}
              className="gap-1"
            >
              <GripVertical className="w-4 h-4" />
              Ordem manual
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ativas" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ativas" className="gap-2">
              Ativas
              <Badge variant="secondary" className="ml-1">{ativas.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="respondidas" className="gap-2">
              Respondidas
              <Badge variant="secondary" className="ml-1">{respondidas.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ativas" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ReclamacaoTable data={filterReclamacoes(ativas)} />
            )}
          </TabsContent>
          <TabsContent value="respondidas" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ReclamacaoTable data={filterReclamacoes(respondidas)} />
            )}
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Reclamação</DialogTitle>
              <DialogDescription>
                Instalação #{selectedReclamacao?.instalacao}
              </DialogDescription>
            </DialogHeader>
            {selectedReclamacao && (
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nota RC</p>
                  <p className="font-medium">{selectedReclamacao.nota_rc || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nota FS</p>
                  <p className="font-medium">{selectedReclamacao.nota_fs || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cidade</p>
                  <p className="font-medium">{selectedReclamacao.cidade || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prazo</p>
                  <p className="font-medium">{formatDate(selectedReclamacao.prazo)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Reclamação</p>
                  <p className="font-medium">{selectedReclamacao.tipo_reclamacao || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conclusão</p>
                  <p className="font-medium">{selectedReclamacao.conclusao || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equipe Responsável</p>
                  <p className="font-medium">{selectedReclamacao.equipe_responsavel || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Visita</p>
                  <p className="font-medium">{formatDate(selectedReclamacao.data_visita)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{selectedReclamacao.observacoes || "Sem observações"}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {selectedIds.size === 1 ? "esta reclamação" : `estas ${selectedIds.size} reclamações`}? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
