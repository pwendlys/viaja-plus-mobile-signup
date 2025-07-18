export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_history: {
        Row: {
          document_type: string
          document_url: string
          id: string
          rejection_reason: string | null
          status: string | null
          uploaded_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          document_type: string
          document_url: string
          id?: string
          rejection_reason?: string | null
          status?: string | null
          uploaded_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          document_type?: string
          document_url?: string
          id?: string
          rejection_reason?: string | null
          status?: string | null
          uploaded_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_balance: {
        Row: {
          available_balance: number
          driver_id: string
          id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string
        }
        Insert: {
          available_balance?: number
          driver_id: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
        }
        Update: {
          available_balance?: number
          driver_id?: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_balance_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_bank_data: {
        Row: {
          account_number: string | null
          agency: string | null
          bank_name: string | null
          created_at: string
          driver_id: string
          id: string
          pix_key: string | null
          pix_key_type: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string
          driver_id: string
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_bank_data_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_ratings: {
        Row: {
          comment: string | null
          created_at: string
          driver_id: string
          id: string
          patient_id: string
          rating: number
          ride_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          driver_id: string
          id?: string
          patient_id: string
          rating: number
          ride_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          patient_id?: string
          rating?: number
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_ratings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_ratings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          cnh_back_photo: string | null
          cnh_front_photo: string | null
          cnh_number: string
          custom_price_per_km: number | null
          has_accessibility: boolean | null
          id: string
          selfie_with_document: string | null
          vehicle_color: string
          vehicle_document: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_photo: string | null
          vehicle_plate: string
          vehicle_year: number
        }
        Insert: {
          cnh_back_photo?: string | null
          cnh_front_photo?: string | null
          cnh_number: string
          custom_price_per_km?: number | null
          has_accessibility?: boolean | null
          id: string
          selfie_with_document?: string | null
          vehicle_color: string
          vehicle_document?: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_photo?: string | null
          vehicle_plate: string
          vehicle_year: number
        }
        Update: {
          cnh_back_photo?: string | null
          cnh_front_photo?: string | null
          cnh_number?: string
          custom_price_per_km?: number | null
          has_accessibility?: boolean | null
          id?: string
          selfie_with_document?: string | null
          vehicle_color?: string
          vehicle_document?: string | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_photo?: string | null
          vehicle_plate?: string
          vehicle_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "drivers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          patient_id: string
          phone: string
          relationship: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          patient_id: string
          phone: string
          relationship?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          patient_id?: string
          phone?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      km_pricing: {
        Row: {
          car_type: string
          created_at: string
          id: string
          price_per_km: number
          updated_at: string
        }
        Insert: {
          car_type: string
          created_at?: string
          id?: string
          price_per_km: number
          updated_at?: string
        }
        Update: {
          car_type?: string
          created_at?: string
          id?: string
          price_per_km?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_favorites: {
        Row: {
          address: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          patient_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          patient_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_favorites_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_ratings: {
        Row: {
          comment: string | null
          created_at: string
          driver_id: string
          id: string
          patient_id: string
          rating: number
          ride_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          driver_id: string
          id?: string
          patient_id: string
          rating: number
          ride_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          patient_id?: string
          rating?: number
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_ratings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_ratings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          dependency_description: string | null
          has_dependency: boolean | null
          id: string
          special_needs: string | null
          sus_card: string
        }
        Insert: {
          dependency_description?: string | null
          has_dependency?: boolean | null
          id: string
          special_needs?: string | null
          sus_card: string
        }
        Update: {
          dependency_description?: string | null
          has_dependency?: boolean | null
          id?: string
          special_needs?: string | null
          sus_card?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          cep: string | null
          city: string | null
          complement: string | null
          cpf: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_resubmission_at: string | null
          neighborhood: string | null
          number: string | null
          phone: string
          profile_photo: string | null
          rejected_documents: string[] | null
          rejection_reason: string | null
          residence_proof: string | null
          resubmission_count: number | null
          rg: string | null
          state: string | null
          status: string | null
          street: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          cpf: string
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          last_resubmission_at?: string | null
          neighborhood?: string | null
          number?: string | null
          phone: string
          profile_photo?: string | null
          rejected_documents?: string[] | null
          rejection_reason?: string | null
          residence_proof?: string | null
          resubmission_count?: number | null
          rg?: string | null
          state?: string | null
          status?: string | null
          street?: string | null
          updated_at?: string | null
          user_type: string
        }
        Update: {
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_resubmission_at?: string | null
          neighborhood?: string | null
          number?: string | null
          phone?: string
          profile_photo?: string | null
          rejected_documents?: string[] | null
          rejection_reason?: string | null
          residence_proof?: string | null
          resubmission_count?: number | null
          rg?: string | null
          state?: string | null
          status?: string | null
          street?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      ride_cancellation_requests: {
        Row: {
          id: string
          reason: string
          requested_at: string
          requested_by: string
          responded_at: string | null
          responded_by: string | null
          response_reason: string | null
          ride_id: string
          status: string
        }
        Insert: {
          id?: string
          reason: string
          requested_at?: string
          requested_by: string
          responded_at?: string | null
          responded_by?: string | null
          response_reason?: string | null
          ride_id: string
          status?: string
        }
        Update: {
          id?: string
          reason?: string
          requested_at?: string
          requested_by?: string
          responded_at?: string | null
          responded_by?: string | null
          response_reason?: string | null
          ride_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_cancellation_requests_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          ride_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          ride_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          ride_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_chat_messages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_locations: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          ride_id: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          ride_id: string
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          ride_id?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_locations_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          actual_price: number | null
          created_at: string | null
          destination_address: string
          driver_id: string | null
          estimated_price: number | null
          id: string
          patient_id: string
          pickup_address: string
          pickup_date: string
          pickup_time: string
          rating_id: string | null
          scheduled_for: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_price?: number | null
          created_at?: string | null
          destination_address: string
          driver_id?: string | null
          estimated_price?: number | null
          id?: string
          patient_id: string
          pickup_address: string
          pickup_date: string
          pickup_time: string
          rating_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_price?: number | null
          created_at?: string | null
          destination_address?: string
          driver_id?: string | null
          estimated_price?: number | null
          id?: string
          patient_id?: string
          pickup_address?: string
          pickup_date?: string
          pickup_time?: string
          rating_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "driver_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          driver_id: string
          id: string
          processed_at: string | null
          requested_at: string
          status: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          driver_id: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          driver_id?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_settings: {
        Row: {
          created_at: string
          end_date: string
          end_time: string
          id: string
          is_active: boolean
          start_date: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          end_time: string
          id?: string
          is_active?: boolean
          start_date: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          end_time?: string
          id?: string
          is_active?: boolean
          start_date?: string
          start_time?: string
          updated_at?: string
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
