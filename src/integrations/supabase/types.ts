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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          new_value: Json | null
          previous_value: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          new_value?: Json | null
          previous_value?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          new_value?: Json | null
          previous_value?: Json | null
        }
        Relationships: []
      }
      campaign_requirements: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          operator: Database["public"]["Enums"]["requirement_operator"]
          required: boolean
          requirement_type: string
          updated_at: string
          value: Json
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          operator?: Database["public"]["Enums"]["requirement_operator"]
          required?: boolean
          requirement_type: string
          updated_at?: string
          value: Json
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          operator?: Database["public"]["Enums"]["requirement_operator"]
          required?: boolean
          requirement_type?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "campaign_requirements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_tasks: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          max_duration: number | null
          required: boolean
          sequence: number
          success_criteria: string | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          max_duration?: number | null
          required?: boolean
          sequence?: number
          success_criteria?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          max_duration?: number | null
          required?: boolean
          sequence?: number
          success_criteria?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          client_notes: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          login_required: boolean
          name: string
          objective: string | null
          organization_id: string
          paid_at: string | null
          participant_target: number
          pricing_snapshot: Json
          product_name: string | null
          product_type: Database["public"]["Enums"]["product_type"] | null
          product_url: string | null
          quoted_at: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["campaign_status"]
          submitted_at: string | null
          test_account_instructions: string | null
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_notes?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          login_required?: boolean
          name: string
          objective?: string | null
          organization_id: string
          paid_at?: string | null
          participant_target?: number
          pricing_snapshot?: Json
          product_name?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          product_url?: string | null
          quoted_at?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["campaign_status"]
          submitted_at?: string | null
          test_account_instructions?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_notes?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          login_required?: boolean
          name?: string
          objective?: string | null
          organization_id?: string
          paid_at?: string | null
          participant_target?: number
          pricing_snapshot?: Json
          product_name?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          product_url?: string | null
          quoted_at?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["campaign_status"]
          submitted_at?: string | null
          test_account_instructions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          participant_role: Database["public"]["Enums"]["participant_role"]
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          participant_role: Database["public"]["Enums"]["participant_role"]
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          participant_role?: Database["public"]["Enums"]["participant_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_admin_id: string | null
          campaign_id: string | null
          created_at: string
          created_by: string
          id: string
          organization_id: string
          payment_id: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          subject: string
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          campaign_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          subject: string
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          campaign_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      file_assets: {
        Row: {
          bucket: string
          campaign_id: string | null
          created_at: string
          file_name: string | null
          id: string
          kind: Database["public"]["Enums"]["file_asset_kind"]
          metadata: Json
          mime_type: string | null
          organization_id: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          bucket?: string
          campaign_id?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["file_asset_kind"]
          metadata?: Json
          mime_type?: string | null
          organization_id?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bucket?: string
          campaign_id?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["file_asset_kind"]
          metadata?: Json
          mime_type?: string | null
          organization_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount_cents: number
          campaign_id: string | null
          created_at: string
          currency: string
          description: string | null
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          metadata: Json
          organization_id: string | null
          payment_id: string | null
          tester_id: string | null
        }
        Insert: {
          amount_cents: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          metadata?: Json
          organization_id?: string | null
          payment_id?: string | null
          tester_id?: string | null
        }
        Update: {
          amount_cents?: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          metadata?: Json
          organization_id?: string | null
          payment_id?: string | null
          tester_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_tester_id_fkey"
            columns: ["tester_id"]
            isOneToOne: false
            referencedRelation: "tester_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          metadata: Json
          sender_id: string
          updated_at: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json
          sender_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          event_type: string
          id: string
          metadata: Json
          read_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          status: Database["public"]["Enums"]["org_member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          status?: Database["public"]["Enums"]["org_member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          status?: Database["public"]["Enums"]["org_member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          status: Database["public"]["Enums"]["org_status"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          status?: Database["public"]["Enums"]["org_status"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          status?: Database["public"]["Enums"]["org_status"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          external_reference: string | null
          id: string
          is_default: boolean
          label: string | null
          metadata: Json
          method_type: Database["public"]["Enums"]["payment_method_type"]
          organization_id: string
          provider_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_reference?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          metadata?: Json
          method_type: Database["public"]["Enums"]["payment_method_type"]
          organization_id: string
          provider_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_reference?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          metadata?: Json
          method_type?: Database["public"]["Enums"]["payment_method_type"]
          organization_id?: string
          provider_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_providers: {
        Row: {
          code: string
          config: Json
          created_at: string
          enabled: boolean
          id: string
          method_type: Database["public"]["Enums"]["payment_method_type"]
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          method_type: Database["public"]["Enums"]["payment_method_type"]
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          method_type?: Database["public"]["Enums"]["payment_method_type"]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          payment_id: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          payment_id: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          payment_id?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          campaign_id: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json
          organization_id: string
          payment_method_id: string | null
          provider_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          organization_id: string
          payment_method_id?: string | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          organization_id?: string
          payment_method_id?: string | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          email_verified: boolean
          first_name: string | null
          id: string
          last_name: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_verified?: boolean
          first_name?: string | null
          id: string
          last_name?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_verified?: boolean
          first_name?: string | null
          id?: string
          last_name?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      tester_devices: {
        Row: {
          browser: string | null
          browser_version: string | null
          created_at: string
          device_type: Database["public"]["Enums"]["device_type"]
          id: string
          manufacturer: string | null
          model: string | null
          operating_system: string | null
          os_version: string | null
          platform: Database["public"]["Enums"]["device_platform"]
          rejection_reason: string | null
          tester_id: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["attribute_verification_status"]
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          created_at?: string
          device_type: Database["public"]["Enums"]["device_type"]
          id?: string
          manufacturer?: string | null
          model?: string | null
          operating_system?: string | null
          os_version?: string | null
          platform?: Database["public"]["Enums"]["device_platform"]
          rejection_reason?: string | null
          tester_id: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["attribute_verification_status"]
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          manufacturer?: string | null
          model?: string | null
          operating_system?: string | null
          os_version?: string | null
          platform?: Database["public"]["Enums"]["device_platform"]
          rejection_reason?: string | null
          tester_id?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["attribute_verification_status"]
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tester_devices_tester_id_fkey"
            columns: ["tester_id"]
            isOneToOne: false
            referencedRelation: "tester_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tester_profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["user_status"]
          age_range: string | null
          availability_status: Database["public"]["Enums"]["availability_status"]
          bio: string | null
          city: string | null
          completed_jobs_count: number
          completion_rate: number
          country: string | null
          created_at: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          expired_jobs_count: number
          fraud_risk_score: number
          id: string
          occupation: string | null
          quality_score: number
          rejected_jobs_count: number
          reliability_score: number
          scores_calculated_at: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["user_status"]
          age_range?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          bio?: string | null
          city?: string | null
          completed_jobs_count?: number
          completion_rate?: number
          country?: string | null
          created_at?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          expired_jobs_count?: number
          fraud_risk_score?: number
          id?: string
          occupation?: string | null
          quality_score?: number
          rejected_jobs_count?: number
          reliability_score?: number
          scores_calculated_at?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          account_status?: Database["public"]["Enums"]["user_status"]
          age_range?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          bio?: string | null
          city?: string | null
          completed_jobs_count?: number
          completion_rate?: number
          country?: string | null
          created_at?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          expired_jobs_count?: number
          fraud_risk_score?: number
          id?: string
          occupation?: string | null
          quality_score?: number
          rejected_jobs_count?: number
          reliability_score?: number
          scores_calculated_at?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      tester_skills: {
        Row: {
          created_at: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          skill: string
          tester_id: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["attribute_verification_status"]
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          skill: string
          tester_id: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["attribute_verification_status"]
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          skill?: string
          tester_id?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["attribute_verification_status"]
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tester_skills_tester_id_fkey"
            columns: ["tester_id"]
            isOneToOne: false
            referencedRelation: "tester_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tester_verifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json
          rejection_reason: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          tester_id: string
          updated_at: string
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          tester_id: string
          updated_at?: string
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          tester_id?: string
          updated_at?: string
          verification_type?: Database["public"]["Enums"]["verification_type"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tester_verifications_tester_id_fkey"
            columns: ["tester_id"]
            isOneToOne: false
            referencedRelation: "tester_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      admin_campaign_stats: {
        Args: never
        Returns: {
          cancelled: number
          drafts: number
          submitted: number
          total: number
        }[]
      }
      admin_list_campaigns: {
        Args: {
          _limit?: number
          _offset?: number
          _organization_id?: string
          _search?: string
          _service?: Database["public"]["Enums"]["service_type"]
          _status?: Database["public"]["Enums"]["campaign_status"]
        }
        Returns: {
          created_at: string
          created_by: string
          creator_email: string
          deadline: string
          id: string
          name: string
          organization_id: string
          organization_name: string
          participant_target: number
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["campaign_status"]
          total_count: number
          updated_at: string
        }[]
      }
      admin_list_testers: {
        Args: {
          _account_status?: Database["public"]["Enums"]["user_status"]
          _availability?: Database["public"]["Enums"]["availability_status"]
          _country?: string
          _experience?: Database["public"]["Enums"]["experience_level"]
          _limit?: number
          _offset?: number
          _platform?: Database["public"]["Enums"]["device_platform"]
          _search?: string
          _verification?: Database["public"]["Enums"]["verification_status"]
        }
        Returns: {
          account_status: Database["public"]["Enums"]["user_status"]
          availability_status: Database["public"]["Enums"]["availability_status"]
          city: string
          country: string
          created_at: string
          device_count: number
          email: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          first_name: string
          id: string
          last_name: string
          skill_count: number
          timezone: string
          total_count: number
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      admin_review_device: {
        Args: {
          _device_id: string
          _reason?: string
          _status: Database["public"]["Enums"]["attribute_verification_status"]
        }
        Returns: undefined
      }
      admin_review_skill: {
        Args: {
          _skill_id: string
          _status: Database["public"]["Enums"]["attribute_verification_status"]
        }
        Returns: undefined
      }
      admin_review_verification: {
        Args: {
          _reason?: string
          _status: Database["public"]["Enums"]["verification_status"]
          _tester_id: string
          _type: Database["public"]["Enums"]["verification_type"]
        }
        Returns: undefined
      }
      admin_set_campaign_status: {
        Args: {
          _campaign_id: string
          _reason?: string
          _status: Database["public"]["Enums"]["campaign_status"]
        }
        Returns: Database["public"]["Enums"]["campaign_status"]
      }
      admin_set_tester_availability: {
        Args: {
          _availability: Database["public"]["Enums"]["availability_status"]
          _tester_id: string
        }
        Returns: undefined
      }
      admin_set_tester_status: {
        Args: {
          _reason?: string
          _status: Database["public"]["Enums"]["user_status"]
          _tester_id: string
        }
        Returns: undefined
      }
      admin_tester_network_stats: {
        Args: never
        Returns: {
          active: number
          pending_verification: number
          suspended: number
          total: number
        }[]
      }
      campaign_cancel: {
        Args: { _campaign_id: string; _reason: string }
        Returns: Database["public"]["Enums"]["campaign_status"]
      }
      campaign_core_completeness: {
        Args: { _campaign_id: string }
        Returns: Json
      }
      campaign_delete_draft: {
        Args: { _campaign_id: string }
        Returns: undefined
      }
      campaign_submit: {
        Args: { _campaign_id: string }
        Returns: Database["public"]["Enums"]["campaign_status"]
      }
      campaign_withdraw_to_draft: {
        Args: { _campaign_id: string }
        Returns: Database["public"]["Enums"]["campaign_status"]
      }
      can_access_campaign: { Args: { _campaign_id: string }; Returns: boolean }
      can_access_conversation: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      can_manage_campaigns: { Args: { _org_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_org_manager: { Args: { _org_id: string }; Returns: boolean }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      notify_tester: {
        Args: {
          _body: string
          _event: string
          _title: string
          _user_id: string
        }
        Returns: undefined
      }
      owns_tester_profile: { Args: { _tester_id: string }; Returns: boolean }
      record_tester_audit: {
        Args: {
          _action: string
          _entity_id: string
          _entity_type: string
          _metadata?: Json
          _new: Json
          _previous: Json
        }
        Returns: undefined
      }
      self_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "CLIENT" | "TESTER" | "ADMIN"
      attribute_verification_status:
        | "UNVERIFIED"
        | "PENDING"
        | "VERIFIED"
        | "REJECTED"
      availability_status: "AVAILABLE" | "BUSY" | "UNAVAILABLE" | "LIMITED"
      campaign_status:
        | "DRAFT"
        | "QUOTED"
        | "PAYMENT_PENDING"
        | "PAID"
        | "RECRUITING"
        | "MATCHING"
        | "ASSIGNING"
        | "TESTING"
        | "QUALITY_REVIEW"
        | "REPLACEMENTS"
        | "COMPLETED"
        | "ANALYZING"
        | "REPORT_READY"
        | "CLOSED"
        | "PAUSED"
        | "CANCELLED"
      conversation_status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED"
      conversation_type:
        | "CAMPAIGN"
        | "GENERAL_SUPPORT"
        | "PAYMENT"
        | "TECHNICAL_SUPPORT"
      device_platform:
        | "IPHONE"
        | "ANDROID"
        | "IPAD"
        | "MAC"
        | "WINDOWS"
        | "LINUX"
        | "OTHER"
      device_type:
        | "PHONE"
        | "TABLET"
        | "LAPTOP"
        | "DESKTOP"
        | "WEARABLE"
        | "TV"
        | "OTHER"
      experience_level:
        | "BEGINNER"
        | "INTERMEDIATE"
        | "ADVANCED"
        | "EXPERT"
        | "EXPERIENCED"
      file_asset_kind:
        | "SCREENSHOT"
        | "BUG_EVIDENCE"
        | "SCREEN_RECORDING"
        | "VIDEO"
        | "AUDIO"
        | "DOCUMENT"
        | "REPORT"
        | "OTHER"
      ledger_entry_type:
        | "CLIENT_PAYMENT"
        | "TESTER_REWARD"
        | "PLATFORM_REVENUE"
        | "PROCESSING_FEE"
        | "OPERATIONAL_COST"
        | "REFUND"
        | "ADJUSTMENT"
      message_type: "TEXT" | "SYSTEM"
      notification_channel: "IN_APP" | "EMAIL" | "PUSH"
      notification_status: "PENDING" | "SENT" | "READ" | "FAILED"
      org_member_role: "OWNER" | "ADMIN" | "MEMBER" | "BILLING"
      org_member_status: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED"
      org_status: "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED"
      participant_role: "CLIENT" | "ADMIN"
      payment_method_type:
        | "CARD"
        | "CRYPTO"
        | "BANK_TRANSFER"
        | "MOBILE_MONEY"
        | "OTHER"
      payment_status:
        | "PENDING"
        | "PROCESSING"
        | "SUCCEEDED"
        | "FAILED"
        | "CANCELLED"
        | "REFUNDED"
        | "PARTIALLY_REFUNDED"
      product_type:
        | "WEBSITE"
        | "WEB_APP"
        | "MOBILE_APP"
        | "DESKTOP_APP"
        | "PROTOTYPE"
        | "CONCEPT"
        | "OTHER"
      requirement_operator:
        | "EQUALS"
        | "NOT_EQUALS"
        | "IN"
        | "NOT_IN"
        | "GREATER_THAN"
        | "GREATER_THAN_OR_EQUAL"
        | "LESS_THAN"
        | "LESS_THAN_OR_EQUAL"
        | "CONTAINS"
        | "BOOLEAN_IS"
      service_type:
        | "USER_FEEDBACK"
        | "BUG_TESTING"
        | "USABILITY_TESTING"
        | "BETA_TESTING"
        | "TARGETED_RESEARCH"
      transaction_type:
        | "CHARGE"
        | "REFUND"
        | "CHARGEBACK"
        | "ADJUSTMENT"
        | "FEE"
      user_status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED"
      verification_status:
        | "PENDING"
        | "VERIFIED"
        | "FAILED"
        | "EXPIRED"
        | "NOT_STARTED"
        | "REJECTED"
      verification_type:
        | "EMAIL"
        | "PHONE"
        | "IDENTITY"
        | "COUNTRY"
        | "DEVICE"
        | "SKILL"
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
      app_role: ["CLIENT", "TESTER", "ADMIN"],
      attribute_verification_status: [
        "UNVERIFIED",
        "PENDING",
        "VERIFIED",
        "REJECTED",
      ],
      availability_status: ["AVAILABLE", "BUSY", "UNAVAILABLE", "LIMITED"],
      campaign_status: [
        "DRAFT",
        "QUOTED",
        "PAYMENT_PENDING",
        "PAID",
        "RECRUITING",
        "MATCHING",
        "ASSIGNING",
        "TESTING",
        "QUALITY_REVIEW",
        "REPLACEMENTS",
        "COMPLETED",
        "ANALYZING",
        "REPORT_READY",
        "CLOSED",
        "PAUSED",
        "CANCELLED",
      ],
      conversation_status: ["OPEN", "PENDING", "RESOLVED", "CLOSED"],
      conversation_type: [
        "CAMPAIGN",
        "GENERAL_SUPPORT",
        "PAYMENT",
        "TECHNICAL_SUPPORT",
      ],
      device_platform: [
        "IPHONE",
        "ANDROID",
        "IPAD",
        "MAC",
        "WINDOWS",
        "LINUX",
        "OTHER",
      ],
      device_type: [
        "PHONE",
        "TABLET",
        "LAPTOP",
        "DESKTOP",
        "WEARABLE",
        "TV",
        "OTHER",
      ],
      experience_level: [
        "BEGINNER",
        "INTERMEDIATE",
        "ADVANCED",
        "EXPERT",
        "EXPERIENCED",
      ],
      file_asset_kind: [
        "SCREENSHOT",
        "BUG_EVIDENCE",
        "SCREEN_RECORDING",
        "VIDEO",
        "AUDIO",
        "DOCUMENT",
        "REPORT",
        "OTHER",
      ],
      ledger_entry_type: [
        "CLIENT_PAYMENT",
        "TESTER_REWARD",
        "PLATFORM_REVENUE",
        "PROCESSING_FEE",
        "OPERATIONAL_COST",
        "REFUND",
        "ADJUSTMENT",
      ],
      message_type: ["TEXT", "SYSTEM"],
      notification_channel: ["IN_APP", "EMAIL", "PUSH"],
      notification_status: ["PENDING", "SENT", "READ", "FAILED"],
      org_member_role: ["OWNER", "ADMIN", "MEMBER", "BILLING"],
      org_member_status: ["INVITED", "ACTIVE", "SUSPENDED", "REMOVED"],
      org_status: ["PENDING", "ACTIVE", "SUSPENDED", "CLOSED"],
      participant_role: ["CLIENT", "ADMIN"],
      payment_method_type: [
        "CARD",
        "CRYPTO",
        "BANK_TRANSFER",
        "MOBILE_MONEY",
        "OTHER",
      ],
      payment_status: [
        "PENDING",
        "PROCESSING",
        "SUCCEEDED",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ],
      product_type: [
        "WEBSITE",
        "WEB_APP",
        "MOBILE_APP",
        "DESKTOP_APP",
        "PROTOTYPE",
        "CONCEPT",
        "OTHER",
      ],
      requirement_operator: [
        "EQUALS",
        "NOT_EQUALS",
        "IN",
        "NOT_IN",
        "GREATER_THAN",
        "GREATER_THAN_OR_EQUAL",
        "LESS_THAN",
        "LESS_THAN_OR_EQUAL",
        "CONTAINS",
        "BOOLEAN_IS",
      ],
      service_type: [
        "USER_FEEDBACK",
        "BUG_TESTING",
        "USABILITY_TESTING",
        "BETA_TESTING",
        "TARGETED_RESEARCH",
      ],
      transaction_type: ["CHARGE", "REFUND", "CHARGEBACK", "ADJUSTMENT", "FEE"],
      user_status: ["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"],
      verification_status: [
        "PENDING",
        "VERIFIED",
        "FAILED",
        "EXPIRED",
        "NOT_STARTED",
        "REJECTED",
      ],
      verification_type: [
        "EMAIL",
        "PHONE",
        "IDENTITY",
        "COUNTRY",
        "DEVICE",
        "SKILL",
      ],
    },
  },
} as const
