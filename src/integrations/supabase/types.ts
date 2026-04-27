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
      banner_images: {
        Row: {
          alt_text: string | null
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_profile_fields: {
        Row: {
          applies_to: Database["public"]["Enums"]["user_type"]
          created_at: string
          display_order: number
          field_label: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean
          placeholder: string | null
          updated_at: string
        }
        Insert: {
          applies_to: Database["public"]["Enums"]["user_type"]
          created_at?: string
          display_order?: number
          field_label: string
          field_name: string
          field_type?: string
          id?: string
          is_required?: boolean
          placeholder?: string | null
          updated_at?: string
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["user_type"]
          created_at?: string
          display_order?: number
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean
          placeholder?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_profile_values: {
        Row: {
          created_at: string
          field_id: string
          id: string
          profile_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          profile_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          profile_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_profile_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_profile_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_profile_values_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      deal_bids: {
        Row: {
          bid_amount: number
          bid_status: string
          created_at: string
          deal_id: string
          distributor_profile_id: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          bid_amount: number
          bid_status?: string
          created_at?: string
          deal_id: string
          distributor_profile_id: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          bid_status?: string
          created_at?: string
          deal_id?: string
          distributor_profile_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_bids_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_bids_distributor_profile_id_fkey"
            columns: ["distributor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          deal_status: string
          description: string | null
          document_url: string | null
          id: string
          min_bid_amount: number | null
          raised_amount: number
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          deal_status?: string
          description?: string | null
          document_url?: string | null
          id?: string
          min_bid_amount?: number | null
          raised_amount?: number
          target_amount?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          deal_status?: string
          description?: string | null
          document_url?: string | null
          id?: string
          min_bid_amount?: number | null
          raised_amount?: number
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      invite_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          is_active: boolean
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      keyword_suggestions: {
        Row: {
          created_at: string
          field_name: string
          id: string
          keyword: string
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          keyword: string
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          keyword?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          profile_id: string
          related_profile_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          profile_id: string
          related_profile_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          profile_id?: string
          related_profile_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_profile_id_fkey"
            columns: ["related_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_submissions: {
        Row: {
          created_at: string
          deal_id: string | null
          description: string | null
          estimated_value: number | null
          id: string
          submission_status: string
          submitted_by: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          submission_status?: string
          submitted_by: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          submission_status?: string
          submitted_by?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_submissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_otps: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          avatar_url: string | null
          bio: string | null
          company_size: string | null
          company_type: string | null
          contact_number: string | null
          created_at: string
          distribution_capacity: string | null
          education: string | null
          email: string
          experience: string | null
          expertise: string | null
          founded_year: number | null
          full_name: string
          headline: string | null
          id: string
          industry_expertise: string | null
          invite_token_id: string | null
          languages: string | null
          linkedin_url: string | null
          location: string | null
          mentoring_areas: string | null
          organisation: string | null
          region: string | null
          research_areas: string | null
          services: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          verification_document_url: string | null
          website_url: string | null
          years_of_experience: number | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          avatar_url?: string | null
          bio?: string | null
          company_size?: string | null
          company_type?: string | null
          contact_number?: string | null
          created_at?: string
          distribution_capacity?: string | null
          education?: string | null
          email: string
          experience?: string | null
          expertise?: string | null
          founded_year?: number | null
          full_name: string
          headline?: string | null
          id?: string
          industry_expertise?: string | null
          invite_token_id?: string | null
          languages?: string | null
          linkedin_url?: string | null
          location?: string | null
          mentoring_areas?: string | null
          organisation?: string | null
          region?: string | null
          research_areas?: string | null
          services?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          verification_document_url?: string | null
          website_url?: string | null
          years_of_experience?: number | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          avatar_url?: string | null
          bio?: string | null
          company_size?: string | null
          company_type?: string | null
          contact_number?: string | null
          created_at?: string
          distribution_capacity?: string | null
          education?: string | null
          email?: string
          experience?: string | null
          expertise?: string | null
          founded_year?: number | null
          full_name?: string
          headline?: string | null
          id?: string
          industry_expertise?: string | null
          invite_token_id?: string | null
          languages?: string | null
          linkedin_url?: string | null
          location?: string | null
          mentoring_areas?: string | null
          organisation?: string | null
          region?: string | null
          research_areas?: string | null
          services?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verification_document_url?: string | null
          website_url?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invite_token_id_fkey"
            columns: ["invite_token_id"]
            isOneToOne: false
            referencedRelation: "invite_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          created_at: string
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          profile_id: string
          publication_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          profile_id: string
          publication_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          profile_id?: string
          publication_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_otps: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: { Args: { check_email: string }; Returns: boolean }
      get_admin_profile_ids: {
        Args: never
        Returns: {
          profile_id: string
        }[]
      }
      get_deal_active_bid_counts: {
        Args: never
        Returns: {
          active_bids: number
          deal_id: string
        }[]
      }
      get_deal_aggregate_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      validate_invite_token_lookup: {
        Args: { _token: string }
        Returns: {
          expires_at: string
          id: string
          is_active: boolean
          used_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "rejected" | "deactivated"
      connection_status: "pending" | "accepted" | "rejected"
      user_type: "advisor" | "laboratory" | "distributor"
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
    Enums: {
      app_role: ["admin", "user"],
      approval_status: ["pending", "approved", "rejected", "deactivated"],
      connection_status: ["pending", "accepted", "rejected"],
      user_type: ["advisor", "laboratory", "distributor"],
    },
  },
} as const
