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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Archive, RotateCcw, Eye, CheckCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

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

  const ativas = reclamacoes.filter(r => !r.arquivada);
  const arquivadas = reclamacoes.filter(r => r.arquivada);

  const filterReclamacoes = (list: Reclamacao[]) => {
    if (!search) return list;
    const searchLower = search.toLowerCase();
    return list.filter(r => 
      r.cidade?.toLowerCase().includes(searchLower) ||
      r.instalacao?.toString().includes(search) ||
      r.equipe_responsavel?.toLowerCase().includes(searchLower) ||
      r.tipo_reclamacao?.toLowerCase().includes(searchLower)
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const ReclamacaoTable = ({ data }: { data: Reclamacao[] }) => (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Nota RC</TableHead>
            <TableHead>Nota FS</TableHead>
            <TableHead>Instalação</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Respondido em</TableHead>
            <TableHead>Equipe</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Nenhuma reclamação encontrada
              </TableCell>
            </TableRow>
          ) : (
            data.map((reclamacao) => (
              <TableRow key={reclamacao.id} className="hover:bg-muted/30">
                <TableCell className="font-mono">{reclamacao.nota_rc || "-"}</TableCell>
                <TableCell className="font-mono">{reclamacao.nota_fs || "-"}</TableCell>
                <TableCell className="font-mono font-medium">{reclamacao.instalacao || "-"}</TableCell>
                <TableCell>{formatDate(reclamacao.prazo)}</TableCell>
                <TableCell>{reclamacao.cidade || "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{reclamacao.tipo_reclamacao || "-"}</Badge>
                </TableCell>
                <TableCell>
                  {reclamacao.respondido_em ? (
                    <span className="badge-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {formatDate(reclamacao.respondido_em)}
                    </span>
                  ) : (
                    <span className="badge-warning">Pendente</span>
                  )}
                </TableCell>
                <TableCell>{reclamacao.equipe_responsavel || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
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
              Gerencie todas as reclamações do sistema
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
