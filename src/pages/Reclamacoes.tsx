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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Archive, RotateCcw, Eye, CheckCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { EditableCell } from "@/components/table/EditableCell";

type Reclamacao = Tables<"reclamacoes">;

export default function Reclamacoes() {
  const [search, setSearch] = useState("");
  const [selectedReclamacao, setSelectedReclamacao] = useState<Reclamacao | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  const { data: reclamacoes = [], isLoading } = useQuery({
    queryKey: ["reclamacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reclamacoes")
        .select("*")
        .order("created_at", { ascending: false });
      
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

  const handleCellUpdate = async (id: string, field: string, value: unknown) => {
    await updateMutation.mutateAsync({ id, field, value });
  };

  const ativas = reclamacoes.filter(r => !r.arquivada);
  const arquivadas = reclamacoes.filter(r => r.arquivada);

  const filterReclamacoes = (list: Reclamacao[]) => {
    if (!search) return list;
    const searchLower = search.toLowerCase();
    return list.filter(r => 
      r.cidade?.toLowerCase().includes(searchLower) ||
      r.instalacao?.toString().includes(search) ||
      r.equipe_responsavel?.toLowerCase().includes(searchLower) ||
      r.tipo_reclamacao?.toLowerCase().includes(searchLower) ||
      r.conclusao?.toLowerCase().includes(searchLower)
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const ReclamacaoTable = ({ data }: { data: Reclamacao[] }) => (
    <div className="rounded-lg border bg-card overflow-hidden">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[80px]">Nota RC</TableHead>
              <TableHead className="min-w-[80px]">Nota FS</TableHead>
              <TableHead className="min-w-[100px]">Instalação</TableHead>
              <TableHead className="min-w-[120px]">Prazo</TableHead>
              <TableHead className="min-w-[120px]">Cidade</TableHead>
              <TableHead className="min-w-[150px]">Tipo</TableHead>
              <TableHead className="min-w-[150px]">Conclusão</TableHead>
              <TableHead className="min-w-[120px]">Respondido em</TableHead>
              <TableHead className="min-w-[120px]">Data Visita</TableHead>
              <TableHead className="min-w-[120px]">Equipe</TableHead>
              <TableHead className="min-w-[200px]">Observações</TableHead>
              <TableHead className="min-w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  Nenhuma reclamação encontrada
                </TableCell>
              </TableRow>
            ) : (
              data.map((reclamacao) => (
                <TableRow key={reclamacao.id} className="hover:bg-muted/30">
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
                      onSave={(v) => handleCellUpdate(reclamacao.id, "tipo_reclamacao", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={reclamacao.conclusao}
                      onSave={(v) => handleCellUpdate(reclamacao.id, "conclusao", v)}
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
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
            <h1 className="text-3xl font-bold text-foreground">Reclamações</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as reclamações do sistema • Clique em qualquer célula para editar
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cidade, instalação..."
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
              <ReclamacaoTable data={filterReclamacoes(ativas)} />
            )}
          </TabsContent>
          <TabsContent value="arquivadas" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ReclamacaoTable data={filterReclamacoes(arquivadas)} />
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
      </div>
    </MainLayout>
  );
}
