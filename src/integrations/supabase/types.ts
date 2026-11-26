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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      expense_participants: {
        Row: {
          expense_id: string
          id: string
          member_id: string
          percentage_bps: number | null
          share_minor: number
        }
        Insert: {
          expense_id: string
          id?: string
          member_id: string
          percentage_bps?: number | null
          share_minor: number
        }
        Update: {
          expense_id?: string
          id?: string
          member_id?: string
          percentage_bps?: number | null
          share_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_participants_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_minor: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string
          description: string
          expense_date: string
          expense_time: string | null
          group_id: string
          id: string
          notes: string
          paid_by: string
          split_method: Database["public"]["Enums"]["split_method"]
          title: string
          updated_at: string
        }
        Insert: {
          amount_minor: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by: string
          description?: string
          expense_date?: string
          expense_time?: string | null
          group_id: string
          id?: string
          notes?: string
          paid_by: string
          split_method?: Database["public"]["Enums"]["split_method"]
          title: string
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          expense_time?: string | null
          group_id?: string
          id?: string
          notes?: string
          paid_by?: string
          split_method?: Database["public"]["Enums"]["split_method"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          esewa_phone: string | null
          esewa_qr_path: string | null
          group_id: string
          id: string
          joined_at: string
          name: string
          role: Database["public"]["Enums"]["group_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          esewa_phone?: string | null
          esewa_qr_path?: string | null
          group_id: string
          id?: string
          joined_at?: string
          name: string
          role?: Database["public"]["Enums"]["group_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          esewa_phone?: string | null
          esewa_qr_path?: string | null
          group_id?: string
          id?: string
          joined_at?: string
          name?: string
          role?: Database["public"]["Enums"]["group_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_settings: {
        Row: {
          default_split_method: Database["public"]["Enums"]["split_method"]
          group_id: string
          members_can_add_expenses: boolean
          members_can_edit_own_expenses: boolean
          members_can_record_settlements: boolean
          updated_at: string
        }
        Insert: {
          default_split_method?: Database["public"]["Enums"]["split_method"]
          group_id: string
          members_can_add_expenses?: boolean
          members_can_edit_own_expenses?: boolean
          members_can_record_settlements?: boolean
          updated_at?: string
        }
        Update: {
          default_split_method?: Database["public"]["Enums"]["split_method"]
          group_id?: string
          members_can_add_expenses?: boolean
          members_can_edit_own_expenses?: boolean
          members_can_record_settlements?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_settings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          id: string
          invite_token: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          invite_token?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          invite_token?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_pins: {
        Row: {
          auth_user_id: string
          failed_attempts: number
          locked_until: string | null
          member_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          failed_attempts?: number
          locked_until?: string | null
          member_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          failed_attempts?: number
          locked_until?: string | null
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_pins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          group_id: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          group_id?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          group_id?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          delivered_at: string | null
          error_message: string | null
          group_id: string
          html_body: string | null
          id: string
          idempotency_key: string | null
          max_retries: number
          metadata: Json | null
          next_retry_at: string | null
          notification_id: string | null
          notification_type: string
          provider: string | null
          recipient_email: string
          recipient_member_id: string | null
          recipient_name: string | null
          resend_email_id: string | null
          retry_count: number
          sent_at: string | null
          status: string
          subject: string
          text_body: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          group_id: string
          html_body?: string | null
          id?: string
          idempotency_key?: string | null
          max_retries?: number
          metadata?: Json | null
          next_retry_at?: string | null
          notification_id?: string | null
          notification_type: string
          provider?: string | null
          recipient_email: string
          recipient_member_id?: string | null
          recipient_name?: string | null
          resend_email_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject: string
          text_body?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          group_id?: string
          html_body?: string | null
          id?: string
          idempotency_key?: string | null
          max_retries?: number
          metadata?: Json | null
          next_retry_at?: string | null
          notification_id?: string | null
          notification_type?: string
          provider?: string | null
          recipient_email?: string
          recipient_member_id?: string | null
          recipient_name?: string | null
          resend_email_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject?: string
          text_body?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount_minor: number
          completed_at: string | null
          created_at: string
          created_by: string
          group_id: string
          id: string
          notes: string
          payer_member_id: string
          receiver_member_id: string
          settlement_date: string
          status: Database["public"]["Enums"]["settlement_status"]
        }
        Insert: {
          amount_minor: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          group_id: string
          id?: string
          notes?: string
          payer_member_id: string
          receiver_member_id: string
          settlement_date?: string
          status?: Database["public"]["Enums"]["settlement_status"]
        }
        Update: {
          amount_minor?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
          notes?: string
          payer_member_id?: string
          receiver_member_id?: string
          settlement_date?: string
          status?: Database["public"]["Enums"]["settlement_status"]
        }
        Relationships: [
          {
            foreignKeyName: "settlements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_payer_member_id_fkey"
            columns: ["payer_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_receiver_member_id_fkey"
            columns: ["receiver_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_member_payment: {
        Args: { _member_id: string }
        Returns: boolean
      }
      claim_memberships: { Args: never; Returns: number }
      complete_settlement: {
        Args: { p_settlement_id: string }
        Returns: undefined
      }
      create_group: {
        Args: { p_currency?: string; p_member_name?: string; p_name: string }
        Returns: string
      }
      delete_expense: { Args: { p_expense_id: string }; Returns: undefined }
      delete_settlement: {
        Args: { p_settlement_id: string }
        Returns: undefined
      }
      is_group_admin: { Args: { _group_id: string }; Returns: boolean }
      is_group_member: { Args: { _group_id: string }; Returns: boolean }
      my_member_id: { Args: { _group_id: string }; Returns: string }
      notify_member: {
        Args: {
          p_body: string
          p_group_id: string
          p_link: string
          p_member_id: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      payment_qr_can_read: { Args: { _name: string }; Returns: boolean }
      payment_qr_can_write: { Args: { _name: string }; Returns: boolean }
      record_settlement: {
        Args: {
          p_amount_minor: number
          p_date: string
          p_group_id: string
          p_notes: string
          p_payer: string
          p_receiver: string
          p_status?: Database["public"]["Enums"]["settlement_status"]
        }
        Returns: string
      }
      regenerate_invite_token: { Args: { p_group_id: string }; Returns: string }
      save_expense: {
        Args: {
          p_amount_minor: number
          p_category: Database["public"]["Enums"]["expense_category"]
          p_description: string
          p_expense_date: string
          p_expense_id: string
          p_expense_time: string
          p_group_id: string
          p_notes: string
          p_paid_by: string
          p_participants: Json
          p_split_method: Database["public"]["Enums"]["split_method"]
          p_title: string
        }
        Returns: string
      }
      set_member_payment_info: {
        Args: { p_esewa_phone: string; p_member_id: string; p_qr_path: string }
        Returns: undefined
      }
    }
    Enums: {
      expense_category:
        | "food"
        | "groceries"
        | "rent"
        | "electricity"
        | "internet"
        | "transportation"
        | "fuel"
        | "entertainment"
        | "shopping"
        | "medical"
        | "education"
        | "household"
        | "other"
      group_role: "admin" | "member"
      member_status: "active" | "inactive"
      settlement_status: "pending" | "completed"
      split_method: "equal" | "exact" | "percentage" | "individual"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      expense_category: [
        "food",
        "groceries",
        "rent",
        "electricity",
        "internet",
        "transportation",
        "fuel",
        "entertainment",
        "shopping",
        "medical",
        "education",
        "household",
        "other",
      ],
      group_role: ["admin", "member"],
      member_status: ["active", "inactive"],
      settlement_status: ["pending", "completed"],
      split_method: ["equal", "exact", "percentage", "individual"],
    },
  },
} as const
