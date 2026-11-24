export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      allocations: {
        Row: {
          amount: number;
          category_id: string;
          category_label: string;
          collection_id: string;
          currency: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          category_id: string;
          category_label: string;
          collection_id: string;
          currency: string;
          id?: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          category_label?: string;
          collection_id?: string;
          currency?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "allocations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "active_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "allocations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "allocations_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          active: boolean;
          group_name: string | null;
          id: string;
          inactive_reason: string | null;
          name: string;
          revision: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          group_name?: string | null;
          id?: string;
          inactive_reason?: string | null;
          name: string;
          revision?: number;
        };
        Update: {
          active?: boolean;
          group_name?: string | null;
          id?: string;
          inactive_reason?: string | null;
          name?: string;
          revision?: number;
        };
        Relationships: [];
      };
      collection_voids: {
        Row: {
          actor: string;
          collection_id: string;
          created_at: string;
          officer: string;
          reason: string;
        };
        ComputedFields: never;
        Insert: {
          actor: string;
          collection_id: string;
          created_at?: string;
          officer: string;
          reason: string;
        };
        Update: {
          actor?: string;
          collection_id?: string;
          created_at?: string;
          officer?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_voids_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: true;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: {
          actor: string;
          business_date: string;
          created_at: string;
          currency: string;
          id: string;
          member_id: string | null;
          method: string;
          notes: string;
          officer: string;
          payer: string;
          payer_kind: string;
          payload: NonNullable<Json>;
          receipt: string;
          reference: string;
          replaces: string | null;
          request_key: string;
          total: number;
        };
        ComputedFields: never;
        Insert: {
          actor: string;
          business_date: string;
          created_at?: string;
          currency: string;
          id?: string;
          member_id?: string | null;
          method: string;
          notes: string;
          officer: string;
          payer: string;
          payer_kind: string;
          payload: NonNullable<Json>;
          receipt?: string;
          reference: string;
          replaces?: string | null;
          request_key: string;
          total: number;
        };
        Update: {
          actor?: string;
          business_date?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          member_id?: string | null;
          method?: string;
          notes?: string;
          officer?: string;
          payer?: string;
          payer_kind?: string;
          payload?: NonNullable<Json>;
          receipt?: string;
          reference?: string;
          replaces?: string | null;
          request_key?: string;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "collections_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collections_replaces_fkey";
            columns: ["replaces"];
            isOneToOne: true;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      directory_events: {
        Row: {
          action: string;
          actor: string;
          after_record: NonNullable<Json>;
          before_record: Json | null;
          entity: string;
          id: number;
          occurred_at: string;
          record_id: string;
          staff_label: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor: string;
          after_record: NonNullable<Json>;
          before_record?: Json | null;
          entity: string;
          id?: never;
          occurred_at?: string;
          record_id: string;
          staff_label: string;
        };
        Update: {
          action?: string;
          actor?: string;
          after_record?: NonNullable<Json>;
          before_record?: Json | null;
          entity?: string;
          id?: never;
          occurred_at?: string;
          record_id?: string;
          staff_label?: string;
        };
        Relationships: [];
      };
      members: {
        Row: {
          active: boolean;
          id: string;
          inactive_reason: string | null;
          member_number: string;
          name: string;
          phone: string | null;
          revision: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          id?: string;
          inactive_reason?: string | null;
          member_number?: string;
          name: string;
          phone?: string | null;
          revision?: number;
        };
        Update: {
          active?: boolean;
          id?: string;
          inactive_reason?: string | null;
          member_number?: string;
          name?: string;
          phone?: string | null;
          revision?: number;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          active: boolean;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          name: string;
        };
        Update: {
          active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      staff_assignment_history: {
        Row: {
          assigned_user: string | null;
          id: number;
          label: string;
          occurred_at: string;
          operator_name: string;
          previous_user: string | null;
        };
        ComputedFields: never;
        Insert: {
          assigned_user?: string | null;
          id?: never;
          label: string;
          occurred_at?: string;
          operator_name: string;
          previous_user?: string | null;
        };
        Update: {
          assigned_user?: string | null;
          id?: never;
          label?: string;
          occurred_at?: string;
          operator_name?: string;
          previous_user?: string | null;
        };
        Relationships: [];
      };
      staff_slots: {
        Row: {
          label: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          label: string;
          user_id?: string | null;
        };
        Update: {
          label?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      active_categories: {
        Row: {
          group_name: string | null;
          id: string;
          name: string;
          revision: number;
        };
        ComputedFields: never;
        Insert: {
          group_name?: string | null;
          id?: string | null;
          name?: string | null;
          revision?: number | null;
        };
        Update: {
          group_name?: string | null;
          id?: string | null;
          name?: string | null;
          revision?: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      current_officer: { Args: Record<PropertyKey, never>; Returns: string };
      find_members: {
        Args: { term: string };
        Returns: {
          active: boolean;
          id: string;
          inactive_reason: string | null;
          member_number: string;
          name: string;
          phone: string | null;
          revision: number;
        }[];
        SetofOptions: {
          from: "*";
          to: "members";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      post_collection: {
        Args: { entry: Json; request_key_input: string };
        Returns: string;
      };
      void_collection: {
        Args: { explanation: string; target: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
