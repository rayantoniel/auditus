import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { FileWarning, MessageSquareWarning, Loader2, FileSpreadsheet, PenLine } from "lucide-react";
import { SpreadsheetImport } from "@/components/import/SpreadsheetImport";

export default function Cadastrar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("reclamacao");
  const [mode, setMode] = useState<"manual" | "import">("manual");

  // Reclamação form state
  const [reclamacaoForm, setReclamacaoForm] = useState({
    nota_rc: "",
    nota_fs: "",
    instalacao: "",
    prazo: "",
    cidade: "",
    tipo_reclamacao: "",
    equipe_responsavel: "",
    observacoes: "",
  });

  // APCL form state
  const [apclForm, setAPCLForm] = useState({
    origem: "",
    nota_av: "",
    nota_fs: "",
    unidade_consumidora: "",
    prazo_resposta: "",
    cidade: "",
    equipe: "",
    tratativa: "",
    cod: "",
    conclusao: "",
    observacoes: "",
  });

  const reclamacaoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reclamacoes").insert({
        user_id: user!.id,
        nota_rc: reclamacaoForm.nota_rc ? parseInt(reclamacaoForm.nota_rc) : null,
        nota_fs: reclamacaoForm.nota_fs ? parseInt(reclamacaoForm.nota_fs) : null,
        instalacao: reclamacaoForm.instalacao ? parseInt(reclamacaoForm.instalacao) : null,
        prazo: reclamacaoForm.prazo || null,
        cidade: reclamacaoForm.cidade || null,
        tipo_reclamacao: reclamacaoForm.tipo_reclamacao || null,
        equipe_responsavel: reclamacaoForm.equipe_responsavel || null,
        observacoes: reclamacaoForm.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reclamacoes"] });
      toast({
        title: "Sucesso!",
        description: "Reclamação cadastrada com sucesso.",
      });
      setReclamacaoForm({
        nota_rc: "",
        nota_fs: "",
        instalacao: "",
        prazo: "",
        cidade: "",
        tipo_reclamacao: "",
        equipe_responsavel: "",
        observacoes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const apclMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("apcl").insert({
        user_id: user!.id,
        origem: apclForm.origem || null,
        nota_av: apclForm.nota_av ? parseInt(apclForm.nota_av) : null,
        nota_fs: apclForm.nota_fs ? parseInt(apclForm.nota_fs) : null,
        unidade_consumidora: apclForm.unidade_consumidora ? parseInt(apclForm.unidade_consumidora) : null,
        prazo_resposta: apclForm.prazo_resposta || null,
        cidade: apclForm.cidade || null,
        equipe: apclForm.equipe || null,
        tratativa: apclForm.tratativa || null,
        cod: apclForm.cod ? parseInt(apclForm.cod) : null,
        conclusao: apclForm.conclusao || null,
        observacoes: apclForm.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apcl"] });
      toast({
        title: "Sucesso!",
        description: "APCL cadastrada com sucesso.",
      });
      setAPCLForm({
        origem: "",
        nota_av: "",
        nota_fs: "",
        unidade_consumidora: "",
        prazo_resposta: "",
        cidade: "",
        equipe: "",
        tratativa: "",
        cod: "",
        conclusao: "",
        observacoes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cadastrar</h1>
            <p className="text-muted-foreground mt-1">
              Adicione novas reclamações ou ouvidorias ao sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              onClick={() => setMode("manual")}
              size="sm"
            >
              <PenLine className="w-4 h-4 mr-2" />
              Manual
            </Button>
            <Button
              variant={mode === "import" ? "default" : "outline"}
              onClick={() => setMode("import")}
              size="sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Importar Planilha
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="reclamacao" className="gap-2">
              <FileWarning className="w-4 h-4" />
              Reclamação
            </TabsTrigger>
            <TabsTrigger value="apcl" className="gap-2">
              <MessageSquareWarning className="w-4 h-4" />
              APCL
            </TabsTrigger>
          </TabsList>

          {/* Reclamação Content */}
          <TabsContent value="reclamacao" className="mt-6 space-y-6">
            {mode === "import" ? (
              <SpreadsheetImport type="reclamacao" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Nova Reclamação</CardTitle>
                  <CardDescription>
                    Preencha os dados da reclamação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      reclamacaoMutation.mutate();
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nota_rc">Nota RC</Label>
                        <Input
                          id="nota_rc"
                          type="number"
                          placeholder="Ex: 12345"
                          value={reclamacaoForm.nota_rc}
                          onChange={(e) => setReclamacaoForm({ ...reclamacaoForm, nota_rc: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nota_fs">Nota FS</Label>
                        <Input
                          id="nota_fs"
                          type="number"
                          placeholder="Ex: 67890"
                          value={reclamacaoForm.nota_fs}
                          onChange={(e) => setReclamacaoForm({ ...reclamacaoForm, nota_fs: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instalacao">Instalação</Label>
                        <Input
                          id="instalacao"
                          type="number"
                          placeholder="Número da instalação"
                          value={reclamacaoForm.instalacao}
                          onChange={(e) => setReclamacaoForm({ ...reclamacaoForm, instalacao: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prazo">Prazo</Label>
                        <Input
                          id="prazo"
                          type="date"
                          value={reclamacaoForm.prazo}
                          onChange={(e) => setReclamacaoForm({ ...reclamacaoForm, prazo: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          placeholder="Nome da cidade"
                          value={reclamacaoForm.cidade}
                          onChange={(e) => setReclamacaoForm({ ...reclamacaoForm, cidade: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tipo_reclamacao">Tipo de Reclamação</Label>
                        <Input
                          id="tipo_reclamacao"
                          placeholder="Ex: Falta de energia"
                          value={reclamacaoForm.tipo_reclamacao}
                          onChange={(e) => setReclamacaoForm({ ...reclamacaoForm, tipo_reclamacao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="equipe_responsavel">Equipe Responsável</Label>
                        <Input
                          id="equipe_responsavel"
                          placeholder="Nome da equipe"
                          value={reclamacaoForm.equipe_responsavel}
                          onChange={(e) => setReclamacaoForm({ ...reclamacaoForm, equipe_responsavel: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoes_rec">Observações</Label>
                      <Textarea
                        id="observacoes_rec"
                        placeholder="Observações adicionais..."
                        rows={4}
                        value={reclamacaoForm.observacoes}
                        onChange={(e) => setReclamacaoForm({ ...reclamacaoForm, observacoes: e.target.value })}
                      />
                    </div>

                    <Button type="submit" disabled={reclamacaoMutation.isPending} className="w-full md:w-auto">
                      {reclamacaoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Cadastrar Reclamação
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* APCL Content */}
          <TabsContent value="apcl" className="mt-6 space-y-6">
            {mode === "import" ? (
              <SpreadsheetImport type="apcl" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Nova APCL</CardTitle>
                  <CardDescription>
                    Preencha os dados da ouvidoria APCL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      apclMutation.mutate();
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="origem">Origem</Label>
                        <Input
                          id="origem"
                          placeholder="Ex: ANEEL"
                          value={apclForm.origem}
                          onChange={(e) => setAPCLForm({ ...apclForm, origem: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nota_av">Nota AV</Label>
                        <Input
                          id="nota_av"
                          type="number"
                          placeholder="Ex: 12345"
                          value={apclForm.nota_av}
                          onChange={(e) => setAPCLForm({ ...apclForm, nota_av: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nota_fs_apcl">Nota FS</Label>
                        <Input
                          id="nota_fs_apcl"
                          type="number"
                          placeholder="Ex: 67890"
                          value={apclForm.nota_fs}
                          onChange={(e) => setAPCLForm({ ...apclForm, nota_fs: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unidade_consumidora">Unidade Consumidora</Label>
                        <Input
                          id="unidade_consumidora"
                          type="number"
                          placeholder="Número da UC"
                          value={apclForm.unidade_consumidora}
                          onChange={(e) => setAPCLForm({ ...apclForm, unidade_consumidora: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cod">Código</Label>
                        <Input
                          id="cod"
                          type="number"
                          placeholder="Código"
                          value={apclForm.cod}
                          onChange={(e) => setAPCLForm({ ...apclForm, cod: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prazo_resposta">Prazo Máximo Resposta</Label>
                        <Input
                          id="prazo_resposta"
                          type="date"
                          value={apclForm.prazo_resposta}
                          onChange={(e) => setAPCLForm({ ...apclForm, prazo_resposta: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cidade_apcl">Cidade</Label>
                        <Input
                          id="cidade_apcl"
                          placeholder="Nome da cidade"
                          value={apclForm.cidade}
                          onChange={(e) => setAPCLForm({ ...apclForm, cidade: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="equipe">Equipe</Label>
                        <Input
                          id="equipe"
                          placeholder="Nome da equipe"
                          value={apclForm.equipe}
                          onChange={(e) => setAPCLForm({ ...apclForm, equipe: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tratativa">Tratativa</Label>
                        <Input
                          id="tratativa"
                          placeholder="Tratativa aplicada"
                          value={apclForm.tratativa}
                          onChange={(e) => setAPCLForm({ ...apclForm, tratativa: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="conclusao_apcl">Conclusão</Label>
                        <Input
                          id="conclusao_apcl"
                          placeholder="Conclusão da APCL"
                          value={apclForm.conclusao}
                          onChange={(e) => setAPCLForm({ ...apclForm, conclusao: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoes_apcl">Observações</Label>
                      <Textarea
                        id="observacoes_apcl"
                        placeholder="Observações adicionais..."
                        rows={4}
                        value={apclForm.observacoes}
                        onChange={(e) => setAPCLForm({ ...apclForm, observacoes: e.target.value })}
                      />
                    </div>

                    <Button type="submit" disabled={apclMutation.isPending} className="w-full md:w-auto">
                      {apclMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Cadastrar APCL
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
