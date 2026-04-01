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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      daily_snapshots: {
        Row: {
          date: string
          id: string
          meal_count: number | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          total_saturated_fat_g: number | null
          total_sodium_mg: number | null
          total_sugar_g: number | null
          total_water_ml: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          meal_count?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          total_saturated_fat_g?: number | null
          total_sodium_mg?: number | null
          total_sugar_g?: number | null
          total_water_ml?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          meal_count?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          total_saturated_fat_g?: number | null
          total_sodium_mg?: number | null
          total_sugar_g?: number | null
          total_water_ml?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          active: boolean | null
          calories_target: number | null
          carbs_g: number | null
          created_at: string | null
          custom_targets: Json | null
          fat_g: number | null
          fiber_g: number | null
          goal_type: string
          id: string
          net_carbs_g: number | null
          protein_g: number | null
          protein_per_kg: number | null
          rationale: string | null
          saturated_fat_g: number | null
          sodium_mg: number | null
          sugar_g: number | null
          user_id: string
          version: number
          water_ml: number | null
        }
        Insert: {
          active?: boolean | null
          calories_target?: number | null
          carbs_g?: number | null
          created_at?: string | null
          custom_targets?: Json | null
          fat_g?: number | null
          fiber_g?: number | null
          goal_type: string
          id?: string
          net_carbs_g?: number | null
          protein_g?: number | null
          protein_per_kg?: number | null
          rationale?: string | null
          saturated_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          user_id: string
          version?: number
          water_ml?: number | null
        }
        Update: {
          active?: boolean | null
          calories_target?: number | null
          carbs_g?: number | null
          created_at?: string | null
          custom_targets?: Json | null
          fat_g?: number | null
          fiber_g?: number | null
          goal_type?: string
          id?: string
          net_carbs_g?: number | null
          protein_g?: number | null
          protein_per_kg?: number | null
          rationale?: string | null
          saturated_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          user_id?: string
          version?: number
          water_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_embeddings: {
        Row: {
          created_at: string | null
          description_text: string
          embedding: string | null
          id: string
          meal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description_text: string
          embedding?: string | null
          id?: string
          meal_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description_text?: string
          embedding?: string | null
          id?: string
          meal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_embeddings_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_embeddings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_items: {
        Row: {
          calories: number | null
          carbs_g: number | null
          confidence: string | null
          created_at: string | null
          fat_g: number | null
          fiber_g: number | null
          food_group: string | null
          id: string
          ingredient_name: string
          meal_id: string
          original_ai_estimate: Json | null
          protein_g: number | null
          quantity: number
          saturated_fat_g: number | null
          sodium_mg: number | null
          source: string
          sugar_g: number | null
          unit: string
          was_corrected: boolean | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          confidence?: string | null
          created_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_group?: string | null
          id?: string
          ingredient_name: string
          meal_id: string
          original_ai_estimate?: Json | null
          protein_g?: number | null
          quantity: number
          saturated_fat_g?: number | null
          sodium_mg?: number | null
          source?: string
          sugar_g?: number | null
          unit: string
          was_corrected?: boolean | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          confidence?: string | null
          created_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_group?: string | null
          id?: string
          ingredient_name?: string
          meal_id?: string
          original_ai_estimate?: Json | null
          protein_g?: number | null
          quantity?: number
          saturated_fat_g?: number | null
          sodium_mg?: number | null
          source?: string
          sugar_g?: number | null
          unit?: string
          was_corrected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string | null
          human_description: string | null
          id: string
          image_url: string | null
          logged_at: string
          meal_type: string
          revision_of: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          human_description?: string | null
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_type?: string
          revision_of?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          human_description?: string | null
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_type?: string
          revision_of?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_revision_of_fkey"
            columns: ["revision_of"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portion_priors: {
        Row: {
          avg_quantity: number
          avg_unit: string
          id: string
          ingredient_name: string
          sample_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_quantity: number
          avg_unit: string
          id?: string
          ingredient_name: string
          sample_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_quantity?: number
          avg_unit?: string
          id?: string
          ingredient_name?: string
          sample_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portion_priors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          body_fat_pct: number | null
          cooking_frequency: string | null
          created_at: string | null
          dietary_preferences: string[] | null
          height_cm: number | null
          id: string
          meals_per_day: number | null
          sex: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          body_fat_pct?: number | null
          cooking_frequency?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          height_cm?: number | null
          id: string
          meals_per_day?: number | null
          sex?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          body_fat_pct?: number | null
          cooking_frequency?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          height_cm?: number | null
          id?: string
          meals_per_day?: number | null
          sex?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      rate_limit_counters: {
        Row: {
          last_rpd_reset: string
          last_rpm_reset: string
          provider: string
          rpd: number
          rpm: number
        }
        Insert: {
          last_rpd_reset?: string
          last_rpm_reset?: string
          provider: string
          rpd?: number
          rpm?: number
        }
        Update: {
          last_rpd_reset?: string
          last_rpm_reset?: string
          provider?: string
          rpd?: number
          rpm?: number
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
