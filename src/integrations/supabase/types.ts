export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      apcl: {
        Row: {
          arquivada: boolean
          cidade: string | null
          cod: number | null
          conclusao: string | null
          created_at: string
          data_visita: string | null
          devolutiva: string | null
          equipe: string | null
          id: string
          nota_av: number | null
          nota_fs: number | null
          observacoes: string | null
          origem: string | null
          prazo_resposta: string | null
          resolucao: string | null
          sort_order: number | null
          tratativa: string | null
          unidade_consumidora: number | null
          updated_at: string
          user_id: string
          visitado: string | null
        }
        Insert: {
          arquivada?: boolean
          cidade?: string | null
          cod?: number | null
          conclusao?: string | null
          created_at?: string
          data_visita?: string | null
          devolutiva?: string | null
          equipe?: string | null
          id?: string
          nota_av?: number | null
          nota_fs?: number | null
          observacoes?: string | null
          origem?: string | null
          prazo_resposta?: string | null
          resolucao?: string | null
          sort_order?: number | null
          tratativa?: string | null
          unidade_consumidora?: number | null
          updated_at?: string
          user_id: string
          visitado?: string | null
        }
        Update: {
          arquivada?: boolean
          cidade?: string | null
          cod?: number | null
          conclusao?: string | null
          created_at?: string
          data_visita?: string | null
          devolutiva?: string | null
          equipe?: string | null
          id?: string
          nota_av?: number | null
          nota_fs?: number | null
          observacoes?: string | null
          origem?: string | null
          prazo_resposta?: string | null
          resolucao?: string | null
          sort_order?: number | null
          tratativa?: string | null
          unidade_consumidora?: number | null
          updated_at?: string
          user_id?: string
          visitado?: string | null
        }
        Relationships: []
      }
      opcoes_campos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          valor: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          valor: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          valor?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reclamacoes: {
        Row: {
          arquivada: boolean
          cidade: string | null
          cod: number | null
          conclusao: string | null
          created_at: string
          data_visita: string | null
          equipe_responsavel: string | null
          id: string
          instalacao: number | null
          nota_fs: number | null
          nota_rc: number | null
          observacoes: string | null
          prazo: string | null
          resolucao: string | null
          respondido_em: string | null
          sort_order: number | null
          tipo_reclamacao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivada?: boolean
          cidade?: string | null
          cod?: number | null
          conclusao?: string | null
          created_at?: string
          data_visita?: string | null
          equipe_responsavel?: string | null
          id?: string
          instalacao?: number | null
          nota_fs?: number | null
          nota_rc?: number | null
          observacoes?: string | null
          prazo?: string | null
          resolucao?: string | null
          respondido_em?: string | null
          sort_order?: number | null
          tipo_reclamacao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivada?: boolean
          cidade?: string | null
          cod?: number | null
          conclusao?: string | null
          created_at?: string
          data_visita?: string | null
          equipe_responsavel?: string | null
          id?: string
          instalacao?: number | null
          nota_fs?: number | null
          nota_rc?: number | null
          observacoes?: string | null
          prazo?: string | null
          resolucao?: string | null
          respondido_em?: string | null
          sort_order?: number | null
          tipo_reclamacao?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
