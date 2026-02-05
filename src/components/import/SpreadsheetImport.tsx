import { useState, useCallback, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, X } from "lucide-react";
import * as XLSX from "xlsx";

type ImportType = "reclamacao" | "apcl";

interface ColumnMapping {
  [key: string]: string;
}

const RECLAMACAO_FIELDS = [
  { key: "nota_rc", label: "Nota RC", type: "number" },
  { key: "nota_fs", label: "Nota FS", type: "number" },
  { key: "instalacao", label: "Instalação", type: "number" },
  { key: "prazo", label: "Prazo", type: "date" },
  { key: "cidade", label: "Cidade", type: "string" },
  { key: "tipo_reclamacao", label: "Tipo de Reclamação", type: "string" },
  { key: "respondido_em", label: "Respondido em", type: "date" },
  { key: "conclusao", label: "Conclusão", type: "string" },
  { key: "observacoes", label: "Observações", type: "string" },
  { key: "equipe_responsavel", label: "Equipe Responsável", type: "string" },
  { key: "data_visita", label: "Data de Visita", type: "date" },
];

const APCL_FIELDS = [
  { key: "origem", label: "Origem", type: "string" },
  { key: "nota_av", label: "Nota AV", type: "number" },
  { key: "nota_fs", label: "Nota FS", type: "number" },
  { key: "unidade_consumidora", label: "Unidade Consumidora", type: "number" },
  { key: "prazo_resposta", label: "Prazo Máximo Resposta", type: "date" },
  { key: "cidade", label: "Cidade", type: "string" },
  { key: "data_visita", label: "Data de Visita", type: "date" },
  { key: "visitado", label: "Visitado", type: "date" },
  { key: "tratativa", label: "Tratativa", type: "string" },
  { key: "cod", label: "Código", type: "number" },
  { key: "equipe", label: "Equipe", type: "string" },
  { key: "conclusao", label: "Conclusão", type: "string" },
  { key: "devolutiva", label: "Devolutiva", type: "string" },
  { key: "observacoes", label: "Observações", type: "string" },
];

interface SpreadsheetImportProps {
  type: ImportType;
}

export const SpreadsheetImport = forwardRef<HTMLDivElement, SpreadsheetImportProps>(
  function SpreadsheetImport({ type }, ref) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "done">("upload");

  const fields = type === "reclamacao" ? RECLAMACAO_FIELDS : APCL_FIELDS;
  const tableName = type === "reclamacao" ? "reclamacoes" : "apcl";

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  }, []);

  const parseFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { raw: false });

      if (jsonData.length === 0) {
        toast({
          title: "Planilha vazia",
          description: "A planilha selecionada não contém dados.",
          variant: "destructive",
        });
        return;
      }

      const extractedHeaders = Object.keys(jsonData[0]);
      setHeaders(extractedHeaders);
      setParsedData(jsonData);

      // Auto-map columns based on name similarity
      const autoMapping: ColumnMapping = {};
      extractedHeaders.forEach((header) => {
        const normalizedHeader = header.toLowerCase().trim();
        const matchedField = fields.find((field) => {
          const normalizedLabel = field.label.toLowerCase();
          const normalizedKey = field.key.toLowerCase().replace(/_/g, " ");
          return (
            normalizedHeader.includes(normalizedLabel) ||
            normalizedLabel.includes(normalizedHeader) ||
            normalizedHeader.includes(normalizedKey) ||
            normalizedKey.includes(normalizedHeader)
          );
        });
        if (matchedField) {
          autoMapping[header] = matchedField.key;
        }
      });
      setColumnMapping(autoMapping);
      setStep("mapping");

      toast({
        title: "Arquivo carregado",
        description: `${jsonData.length} registros encontrados. Configure o mapeamento das colunas.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o arquivo selecionado.",
        variant: "destructive",
      });
    }
  };

  const handleMappingChange = (header: string, value: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [header]: value === "ignore" ? "" : value,
    }));
  };

  const parseValue = (value: unknown, fieldType: string): unknown => {
    if (value === null || value === undefined || value === "") return null;

    const strValue = String(value).trim();
    if (strValue === "") return null;

    switch (fieldType) {
      case "number":
        const num = parseInt(strValue.replace(/\D/g, ""), 10);
        return isNaN(num) ? null : num;
      case "date":
        // Try parsing different date formats
        if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
          return strValue;
        }
        // DD/MM/YYYY format
        const dateMatch = strValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
        // Excel serial date
        const serial = parseFloat(strValue);
        if (!isNaN(serial) && serial > 0) {
          const excelEpoch = new Date(1899, 11, 30);
          const date = new Date(excelEpoch.getTime() + serial * 86400000);
          return date.toISOString().split("T")[0];
        }
        return null;
      default:
        return strValue;
    }
  };

  const transformData = (): Record<string, unknown>[] => {
    return parsedData.map((row) => {
      const transformedRow: Record<string, unknown> = { user_id: user!.id };

      Object.entries(columnMapping).forEach(([header, fieldKey]) => {
        if (fieldKey) {
          const field = fields.find((f) => f.key === fieldKey);
          if (field) {
            transformedRow[fieldKey] = parseValue(row[header], field.type);
          }
        }
      });

      return transformedRow;
    });
  };

  const handleImport = async () => {
    const transformedData = transformData();

    if (transformedData.length === 0) {
      toast({
        title: "Nenhum dado para importar",
        description: "Configure o mapeamento das colunas primeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Insert in batches of 50
      const batchSize = 50;
      let imported = 0;

      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        const { error } = await supabase.from(tableName).insert(batch as never[]);

        if (error) throw error;

        imported += batch.length;
        setImportProgress(Math.round((imported / transformedData.length) * 100));
      }

      queryClient.invalidateQueries({ queryKey: [tableName] });

      toast({
        title: "Importação concluída!",
        description: `${transformedData.length} registros importados com sucesso.`,
      });

      setStep("done");
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro ao importar dados.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({});
    setImportProgress(0);
    setStep("upload");
  };

  const mappedFieldsCount = Object.values(columnMapping).filter(Boolean).length;

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Importar Planilha
        </CardTitle>
        <CardDescription>
          Importe dados de uma planilha Excel ou CSV para cadastrar múltiplos registros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Arraste um arquivo ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground">Suporta arquivos .xlsx, .xls e .csv</p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload" asChild>
              <Button variant="outline" className="cursor-pointer">
                Selecionar Arquivo
              </Button>
            </Label>
          </div>
        )}

        {step === "mapping" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {parsedData.length} registros • {mappedFieldsCount} colunas mapeadas
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetImport}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>

            <div className="space-y-4">
              <Label>Mapeamento de Colunas</Label>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-3">
                  {headers.map((header) => (
                    <div key={header} className="flex items-center gap-4">
                      <div className="w-1/2 truncate text-sm font-medium">{header}</div>
                      <Select
                        value={columnMapping[header] || "ignore"}
                        onValueChange={(value) => handleMappingChange(header, value)}
                      >
                        <SelectTrigger className="w-1/2">
                          <SelectValue placeholder="Selecionar campo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">— Ignorar —</SelectItem>
                          {fields.map((field) => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep("preview")}>
                Pré-visualizar
              </Button>
              <Button onClick={handleImport} disabled={mappedFieldsCount === 0 || isImporting}>
                {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Importar {parsedData.length} Registros
              </Button>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pré-visualização dos Dados</p>
                <p className="text-sm text-muted-foreground">
                  Mostrando primeiros 5 de {parsedData.length} registros
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep("mapping")}>
                Voltar ao Mapeamento
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {fields
                      .filter((f) => Object.values(columnMapping).includes(f.key))
                      .map((field) => (
                        <TableHead key={field.key}>{field.label}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transformData()
                    .slice(0, 5)
                    .map((row, idx) => (
                      <TableRow key={idx}>
                        {fields
                          .filter((f) => Object.values(columnMapping).includes(f.key))
                          .map((field) => (
                            <TableCell key={field.key}>
                              {row[field.key] != null ? String(row[field.key]) : "—"}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Importação
              </Button>
            </div>
          </>
        )}

        {isImporting && (
          <div className="space-y-2">
            <Progress value={importProgress} />
            <p className="text-sm text-muted-foreground text-center">
              Importando... {importProgress}%
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="w-16 h-16 text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">Importação Concluída!</p>
              <p className="text-muted-foreground">
                {parsedData.length} registros foram importados com sucesso.
              </p>
            </div>
            <Button onClick={resetImport}>Importar Outra Planilha</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
