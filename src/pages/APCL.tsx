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
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Archive, RotateCcw, Eye, CheckCircle, AlertCircle, Trash2, Filter, ArrowUp, ArrowDown, ArrowUpDown, GripVertical } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { EditableCell } from "@/components/table/EditableCell";
import { useFieldOptions } from "@/hooks/useFieldOptions";

type APCL = Tables<"apcl">;

type SortConfig = {
  field: "prazo_resposta" | "data_visita" | "manual";
  direction: "asc" | "desc";
};

export default function APCLPage() {
  const [search, setSearch] = useState("");
  const [selectedAPCL, setSelectedAPCL] = useState<APCL | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filterOrigem, setFilterOrigem] = useState<string>("all");
  const [filterConclusao, setFilterConclusao] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "prazo_resposta", direction: "desc" });
  const queryClient = useQueryClient();
  const { values: origemOptions } = useFieldOptions("origem_apcl");
  const { values: conclusaoOptions } = useFieldOptions("conclusao_apcl");
  const { values: equipeOptions } = useFieldOptions("equipe_apcl");

  const { data: apcls = [], isLoading } = useQuery({
    queryKey: ["apcl"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apcl")
        .select("*")
        .order("prazo_resposta", { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: unknown }) => {
      const { error } = await supabase
        .from("apcl")
        .update({ [field]: value })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apcl"] });
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
      const { error } = await supabase
        .from("apcl")
        .update({ arquivada })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apcl"] });
      toast({
        title: "Sucesso",
        description: "APCL atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a APCL.",
        variant: "destructive",
      });
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async ({ ids, arquivada }: { ids: string[]; arquivada: boolean }) => {
      const { error } = await supabase
        .from("apcl")
        .update({ arquivada })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["apcl"] });
      setSelectedIds(new Set());
      toast({
        title: "Sucesso",
        description: vars.arquivada
          ? `${vars.ids.length} APCL(s) arquivada(s).`
          : `${vars.ids.length} APCL(s) desarquivada(s).`,
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
        .from("apcl")
        .delete()
        .in("id", ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apcl"] });
      setSelectedIds(new Set());
      toast({
        title: "Sucesso",
        description: "APCL(s) excluída(s) com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a(s) APCL(s).",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("apcl")
          .update({ sort_order: u.sort_order })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apcl"] });
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

  const handleSelectAll = (list: APCL[], checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(list.map(a => a.id)));
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

  const handleMoveRow = (data: APCL[], index: number, direction: "up" | "down") => {
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

  const sortData = (list: APCL[]) => {
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
  const origensUnicas = [...new Set([...origemOptions, ...apcls.map(a => a.origem).filter(Boolean) as string[]])];
  const conclusoesUnicas = [...new Set([...conclusaoOptions, ...apcls.map(a => a.conclusao).filter(Boolean) as string[]])];
  const equipesUnicas = [...new Set([...equipeOptions, ...apcls.map(a => a.equipe).filter(Boolean) as string[]])];

  const ativas = apcls.filter(a => !a.arquivada);
  const respondidas = apcls.filter(a => a.arquivada);

  // Find duplicate nota_av, nota_fs, and unidade_consumidora values
  const getDuplicateKeys = (list: APCL[]) => {
    const notaAvCount = new Map<number, number>();
    const notaFsCount = new Map<number, number>();
    const ucCount = new Map<number, number>();
    
    list.forEach(a => {
      if (a.nota_av) notaAvCount.set(a.nota_av, (notaAvCount.get(a.nota_av) || 0) + 1);
      if (a.nota_fs) notaFsCount.set(a.nota_fs, (notaFsCount.get(a.nota_fs) || 0) + 1);
      if (a.unidade_consumidora) ucCount.set(a.unidade_consumidora, (ucCount.get(a.unidade_consumidora) || 0) + 1);
    });

    return {
      duplicateNotaAv: new Set([...notaAvCount.entries()].filter(([, c]) => c > 1).map(([k]) => k)),
      duplicateNotaFs: new Set([...notaFsCount.entries()].filter(([, c]) => c > 1).map(([k]) => k)),
      duplicateUC: new Set([...ucCount.entries()].filter(([, c]) => c > 1).map(([k]) => k)),
    };
  };

  const hasDuplicate = (a: APCL, duplicates: ReturnType<typeof getDuplicateKeys>) => {
    return (
      (a.nota_av && duplicates.duplicateNotaAv.has(a.nota_av)) ||
      (a.nota_fs && duplicates.duplicateNotaFs.has(a.nota_fs)) ||
      (a.unidade_consumidora && duplicates.duplicateUC.has(a.unidade_consumidora))
    );
  };

  const filterAPCL = (list: APCL[]) => {
    let filtered = list;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(a => 
        a.cidade?.toLowerCase().includes(searchLower) ||
        a.unidade_consumidora?.toString().includes(search) ||
        a.equipe?.toLowerCase().includes(searchLower) ||
        a.origem?.toLowerCase().includes(searchLower) ||
        a.conclusao?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterOrigem !== "all") {
      filtered = filtered.filter(a => a.origem === filterOrigem);
    }
    
    if (filterConclusao !== "all") {
      filtered = filtered.filter(a => a.conclusao === filterConclusao);
    }
    
    return sortData(filtered);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getPrazoStatus = (dataVisita: string | null) => {
    if (!dataVisita) return null;
    const today = new Date();
    const visitDate = new Date(dataVisita);
    return isAfter(visitDate, today) ? "dentro" : "fora";
  };

  const APCLTable = ({ data }: { data: APCL[] }) => {
    const duplicates = getDuplicateKeys(data);
    const allSelected = data.length > 0 && data.every(a => selectedIds.has(a.id));
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
              <TableHead className="min-w-[100px]">Origem</TableHead>
              <TableHead className="min-w-[80px]">Código</TableHead>
              <TableHead className="min-w-[80px]">Nota AV</TableHead>
              <TableHead className="min-w-[80px]">Nota FS</TableHead>
              <TableHead className="min-w-[100px]">UC</TableHead>
              <TableHead 
                className="min-w-[120px] cursor-pointer select-none hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("prazo_resposta")}
              >
                <div className="flex items-center">
                  Prazo Resp.
                  <SortIcon field="prazo_resposta" />
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">Cidade</TableHead>
              <TableHead 
                className="min-w-[120px] cursor-pointer select-none hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("data_visita")}
              >
                <div className="flex items-center">
                  Data Visita
                  <SortIcon field="data_visita" />
                </div>
              </TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Visitado</TableHead>
              <TableHead className="min-w-[120px]">Equipe</TableHead>
              <TableHead className="min-w-[150px]">Tratativa</TableHead>
              <TableHead className="min-w-[150px]">Conclusão</TableHead>
              <TableHead className="min-w-[130px]">Resolução</TableHead>
              <TableHead className="min-w-[150px]">Devolutiva</TableHead>
              <TableHead className="min-w-[200px]">Observações</TableHead>
              <TableHead className="min-w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isManualSort ? 20 : 19} className="text-center py-8 text-muted-foreground">
                  Nenhuma APCL encontrada
                </TableCell>
              </TableRow>
            ) : (
              data.map((apcl, index) => {
                const prazoStatus = getPrazoStatus(apcl.data_visita);
                const isDuplicate = hasDuplicate(apcl, duplicates);
                const isSelected = selectedIds.has(apcl.id);
                return (
                  <TableRow 
                    key={apcl.id} 
                    className={`${isDuplicate ? "bg-destructive/10 hover:bg-destructive/20" : "hover:bg-muted/30"} ${isSelected ? "bg-primary/10" : ""}`}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(apcl.id, !!checked)}
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
                    <TableCell>
                      <EditableCell
                        value={apcl.origem}
                        type="select"
                        options={origensUnicas as string[]}
                        onSave={(v) => handleCellUpdate(apcl.id, "origem", v)}
                      />
                    </TableCell>
                    <TableCell className="font-mono">
                      <EditableCell
                        value={apcl.cod}
                        type="select"
                        options={["100", "200", "300"]}
                        onSave={(v) => handleCellUpdate(apcl.id, "cod", v ? Number(v) : null)}
                      />
                    </TableCell>
                    <TableCell className="font-mono">
                      <EditableCell
                        value={apcl.nota_av}
                        type="number"
                        onSave={(v) => handleCellUpdate(apcl.id, "nota_av", v)}
                      />
                    </TableCell>
                    <TableCell className="font-mono">
                      <EditableCell
                        value={apcl.nota_fs}
                        type="number"
                        onSave={(v) => handleCellUpdate(apcl.id, "nota_fs", v)}
                      />
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      <EditableCell
                        value={apcl.unidade_consumidora}
                        type="number"
                        onSave={(v) => handleCellUpdate(apcl.id, "unidade_consumidora", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={apcl.prazo_resposta}
                        type="date"
                        onSave={(v) => handleCellUpdate(apcl.id, "prazo_resposta", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={apcl.cidade}
                        onSave={(v) => handleCellUpdate(apcl.id, "cidade", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={apcl.data_visita}
                        type="date"
                        onSave={(v) => handleCellUpdate(apcl.id, "data_visita", v)}
                      />
                    </TableCell>
                    <TableCell>
                      {prazoStatus === "dentro" ? (
                        <span className="badge-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Dentro
                        </span>
                      ) : prazoStatus === "fora" ? (
                        <span className="badge-danger">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Fora
                        </span>
                      ) : (
                        <span className="badge-warning">Pendente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={apcl.visitado}
                        type="date"
                        onSave={(v) => handleCellUpdate(apcl.id, "visitado", v)}
                      />
                    </TableCell>
                    <TableCell>
                    <EditableCell
                      value={apcl.equipe}
                      type="select"
                      options={equipesUnicas}
                      onSave={(v) => handleCellUpdate(apcl.id, "equipe", v)}
                    />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={apcl.tratativa}
                        onSave={(v) => handleCellUpdate(apcl.id, "tratativa", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={apcl.conclusao}
                        type="select"
                        options={conclusoesUnicas as string[]}
                        onSave={(v) => handleCellUpdate(apcl.id, "conclusao", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={apcl.resolucao}
                        type="select"
                        options={["Procedente", "Improcedente"]}
                        onSave={(v) => handleCellUpdate(apcl.id, "resolucao", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={apcl.devolutiva}
                        onSave={(v) => handleCellUpdate(apcl.id, "devolutiva", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={apcl.observacoes}
                        onSave={(v) => handleCellUpdate(apcl.id, "observacoes", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAPCL(apcl);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {apcl.arquivada ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => archiveMutation.mutate({ id: apcl.id, arquivada: false })}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => archiveMutation.mutate({ id: apcl.id, arquivada: true })}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedIds(new Set([apcl.id]));
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
            <h1 className="text-3xl font-bold text-foreground">APCL - Ouvidorias</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as ouvidorias APCL • Clique em qualquer célula para editar
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              placeholder="Buscar por cidade, UC, equipe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterOrigem} onValueChange={setFilterOrigem}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas origens</SelectItem>
                {origensUnicas.map(origem => (
                  <SelectItem key={origem} value={origem!}>{origem}</SelectItem>
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
              <APCLTable data={filterAPCL(ativas)} />
            )}
          </TabsContent>
          <TabsContent value="respondidas" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <APCLTable data={filterAPCL(respondidas)} />
            )}
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da APCL</DialogTitle>
              <DialogDescription>
                Unidade Consumidora #{selectedAPCL?.unidade_consumidora}
              </DialogDescription>
            </DialogHeader>
            {selectedAPCL && (
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Origem</p>
                  <p className="font-medium">{selectedAPCL.origem || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-medium">{selectedAPCL.cod || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nota AV</p>
                  <p className="font-medium">{selectedAPCL.nota_av || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nota FS</p>
                  <p className="font-medium">{selectedAPCL.nota_fs || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cidade</p>
                  <p className="font-medium">{selectedAPCL.cidade || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prazo Resposta</p>
                  <p className="font-medium">{formatDate(selectedAPCL.prazo_resposta)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Visita</p>
                  <p className="font-medium">{formatDate(selectedAPCL.data_visita)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visitado</p>
                  <p className="font-medium">{formatDate(selectedAPCL.visitado)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equipe</p>
                  <p className="font-medium">{selectedAPCL.equipe || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tratativa</p>
                  <p className="font-medium">{selectedAPCL.tratativa || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conclusão</p>
                  <p className="font-medium">{selectedAPCL.conclusao || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Devolutiva</p>
                  <p className="font-medium">{selectedAPCL.devolutiva || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{selectedAPCL.observacoes || "Sem observações"}</p>
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
                Tem certeza que deseja excluir {selectedIds.size === 1 ? "esta APCL" : `estas ${selectedIds.size} APCLs`}? 
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
