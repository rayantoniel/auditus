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
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Archive, RotateCcw, Eye, CheckCircle, AlertCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { EditableCell } from "@/components/table/EditableCell";

type APCL = Tables<"apcl">;

export default function APCLPage() {
  const [search, setSearch] = useState("");
  const [selectedAPCL, setSelectedAPCL] = useState<APCL | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  const { data: apcls = [], isLoading } = useQuery({
    queryKey: ["apcl"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apcl")
        .select("*")
        .order("created_at", { ascending: false });
      
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

  const handleCellUpdate = async (id: string, field: string, value: unknown) => {
    await updateMutation.mutateAsync({ id, field, value });
  };

  const ativas = apcls.filter(a => !a.arquivada);
  const arquivadas = apcls.filter(a => a.arquivada);

  const filterAPCL = (list: APCL[]) => {
    if (!search) return list;
    const searchLower = search.toLowerCase();
    return list.filter(a => 
      a.cidade?.toLowerCase().includes(searchLower) ||
      a.unidade_consumidora?.toString().includes(search) ||
      a.equipe?.toLowerCase().includes(searchLower) ||
      a.origem?.toLowerCase().includes(searchLower) ||
      a.conclusao?.toLowerCase().includes(searchLower)
    );
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

  const APCLTable = ({ data }: { data: APCL[] }) => (
    <div className="rounded-lg border bg-card overflow-hidden">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[100px]">Origem</TableHead>
              <TableHead className="min-w-[80px]">Código</TableHead>
              <TableHead className="min-w-[80px]">Nota AV</TableHead>
              <TableHead className="min-w-[80px]">Nota FS</TableHead>
              <TableHead className="min-w-[100px]">UC</TableHead>
              <TableHead className="min-w-[120px]">Prazo Resp.</TableHead>
              <TableHead className="min-w-[120px]">Cidade</TableHead>
              <TableHead className="min-w-[120px]">Data Visita</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Visitado</TableHead>
              <TableHead className="min-w-[120px]">Equipe</TableHead>
              <TableHead className="min-w-[150px]">Tratativa</TableHead>
              <TableHead className="min-w-[150px]">Conclusão</TableHead>
              <TableHead className="min-w-[150px]">Devolutiva</TableHead>
              <TableHead className="min-w-[200px]">Observações</TableHead>
              <TableHead className="min-w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
                  Nenhuma APCL encontrada
                </TableCell>
              </TableRow>
            ) : (
              data.map((apcl) => {
                const prazoStatus = getPrazoStatus(apcl.data_visita);
                return (
                  <TableRow key={apcl.id} className="hover:bg-muted/30">
                    <TableCell>
                      <EditableCell
                        value={apcl.origem}
                        onSave={(v) => handleCellUpdate(apcl.id, "origem", v)}
                      />
                    </TableCell>
                    <TableCell className="font-mono">
                      <EditableCell
                        value={apcl.cod}
                        type="number"
                        onSave={(v) => handleCellUpdate(apcl.id, "cod", v)}
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
                        onSave={(v) => handleCellUpdate(apcl.id, "conclusao", v)}
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
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cidade, UC, equipe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ativas" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ativas" className="gap-2">
              Ativas
              <Badge variant="secondary" className="ml-1">{ativas.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="arquivadas" className="gap-2">
              Arquivadas
              <Badge variant="secondary" className="ml-1">{arquivadas.length}</Badge>
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
          <TabsContent value="arquivadas" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <APCLTable data={filterAPCL(arquivadas)} />
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
                  <p className="text-sm text-muted-foreground">Visitado em</p>
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
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Devolutiva</p>
                  <p className="font-medium">{selectedAPCL.devolutiva || "Sem devolutiva"}</p>
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
      </div>
    </MainLayout>
  );
}
