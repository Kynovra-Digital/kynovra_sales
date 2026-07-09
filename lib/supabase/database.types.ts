export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      ai_agent_knowledge_bases: {
        Row: {
          agent_id: string;
          created_at: string;
          id: string;
          knowledge_base_id: string;
          organization_id: string;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          id?: string;
          knowledge_base_id: string;
          organization_id: string;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          id?: string;
          knowledge_base_id?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_knowledge_bases_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_knowledge_bases_knowledge_base_id_fkey";
            columns: ["knowledge_base_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_bases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_knowledge_bases_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_usage: {
        Row: {
          agent_id: string | null;
          cost_estimate: number | null;
          created_at: string;
          id: string;
          input_tokens: number;
          metadata: Json;
          model: string | null;
          organization_id: string;
          output_tokens: number;
          provider: string | null;
          session_id: string | null;
          session_type: string | null;
          tool: string | null;
        };
        Insert: {
          agent_id?: string | null;
          cost_estimate?: number | null;
          created_at?: string;
          id?: string;
          input_tokens?: number;
          metadata?: Json;
          model?: string | null;
          organization_id: string;
          output_tokens?: number;
          provider?: string | null;
          session_id?: string | null;
          session_type?: string | null;
          tool?: string | null;
        };
        Update: {
          agent_id?: string | null;
          cost_estimate?: number | null;
          created_at?: string;
          id?: string;
          input_tokens?: number;
          metadata?: Json;
          model?: string | null;
          organization_id?: string;
          output_tokens?: number;
          provider?: string | null;
          session_id?: string | null;
          session_type?: string | null;
          tool?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_usage_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agents: {
        Row: {
          agent_type: string;
          common_topics: string | null;
          created_at: string;
          daily_message_limit: number | null;
          daily_token_limit: number | null;
          display_name: string;
          enabled_tools: string[];
          fallback_message: string | null;
          id: string;
          initial_message: string | null;
          internal_name: string;
          is_managed_by_product: boolean;
          knowledge_base: string | null;
          limit_action: string | null;
          max_tokens_per_response: number | null;
          monthly_message_limit: number | null;
          monthly_token_limit: number | null;
          organization_id: string;
          product_id: string | null;
          prompt: string | null;
          resolution_steps: string | null;
          response_rules: string | null;
          restrictions: string | null;
          status: string;
          tone: string | null;
          tool_permissions: Json;
          updated_at: string;
        };
        Insert: {
          agent_type: string;
          common_topics?: string | null;
          created_at?: string;
          daily_message_limit?: number | null;
          daily_token_limit?: number | null;
          display_name: string;
          enabled_tools?: string[];
          fallback_message?: string | null;
          id?: string;
          initial_message?: string | null;
          internal_name: string;
          is_managed_by_product?: boolean;
          knowledge_base?: string | null;
          limit_action?: string | null;
          max_tokens_per_response?: number | null;
          monthly_message_limit?: number | null;
          monthly_token_limit?: number | null;
          organization_id: string;
          product_id?: string | null;
          prompt?: string | null;
          resolution_steps?: string | null;
          response_rules?: string | null;
          restrictions?: string | null;
          status?: string;
          tone?: string | null;
          tool_permissions?: Json;
          updated_at?: string;
        };
        Update: {
          agent_type?: string;
          common_topics?: string | null;
          created_at?: string;
          daily_message_limit?: number | null;
          daily_token_limit?: number | null;
          display_name?: string;
          enabled_tools?: string[];
          fallback_message?: string | null;
          id?: string;
          initial_message?: string | null;
          internal_name?: string;
          is_managed_by_product?: boolean;
          knowledge_base?: string | null;
          limit_action?: string | null;
          max_tokens_per_response?: number | null;
          monthly_message_limit?: number | null;
          monthly_token_limit?: number | null;
          organization_id?: string;
          product_id?: string | null;
          prompt?: string | null;
          resolution_steps?: string | null;
          response_rules?: string | null;
          restrictions?: string | null;
          status?: string;
          tone?: string | null;
          tool_permissions?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_bad_responses: {
        Row: {
          agent_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          message: string | null;
          message_id: string | null;
          metadata: Json;
          note: string | null;
          organization_id: string;
          reason: string | null;
          session_id: string | null;
          session_type: string | null;
          tool: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          message?: string | null;
          message_id?: string | null;
          metadata?: Json;
          note?: string | null;
          organization_id: string;
          reason?: string | null;
          session_id?: string | null;
          session_type?: string | null;
          tool?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          message?: string | null;
          message_id?: string | null;
          metadata?: Json;
          note?: string | null;
          organization_id?: string;
          reason?: string | null;
          session_id?: string | null;
          session_type?: string | null;
          tool?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_bad_responses_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_provider_logs: {
        Row: {
          created_at: string;
          error_code: string | null;
          id: string;
          latency_ms: number | null;
          metadata: Json;
          model: string;
          organization_id: string;
          provider: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          error_code?: string | null;
          id?: string;
          latency_ms?: number | null;
          metadata?: Json;
          model: string;
          organization_id: string;
          provider: string;
          status: string;
        };
        Update: {
          created_at?: string;
          error_code?: string | null;
          id?: string;
          latency_ms?: number | null;
          metadata?: Json;
          model?: string;
          organization_id?: string;
          provider?: string;
          status?: string;
        };
        Relationships: [];
      };
      ai_rules: {
        Row: {
          created_at: string;
          id: string;
          instructions: string;
          name: string;
          organization_id: string;
          priority: number;
          rule_type: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          instructions: string;
          name: string;
          organization_id: string;
          priority?: number;
          rule_type?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          instructions?: string;
          name?: string;
          organization_id?: string;
          priority?: number;
          rule_type?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_rules_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_usage_events: {
        Row: {
          agent_id: string | null;
          created_at: string;
          id: string;
          input_tokens: number;
          metadata: Json;
          model: string | null;
          organization_id: string;
          output_tokens: number;
          provider: string | null;
          session_id: string | null;
          session_type: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string;
          id?: string;
          input_tokens?: number;
          metadata?: Json;
          model?: string | null;
          organization_id: string;
          output_tokens?: number;
          provider?: string | null;
          session_id?: string | null;
          session_type?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string;
          id?: string;
          input_tokens?: number;
          metadata?: Json;
          model?: string | null;
          organization_id?: string;
          output_tokens?: number;
          provider?: string | null;
          session_id?: string | null;
          session_type?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json;
          organization_id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
        };
        Relationships: [];
      };
      billing_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          organization_id: string;
          payload: Json;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          organization_id: string;
          payload?: Json;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          organization_id?: string;
          payload?: Json;
        };
        Relationships: [];
      };
      campaign_metrics_daily: {
        Row: {
          campaign_id: string;
          checkouts_accessed: number;
          checkouts_sent: number;
          created_at: string;
          id: string;
          leads: number;
          metric_date: string;
          organization_id: string;
          product_views: number;
          sales_confirmed: number;
          vitrine_accesses: number;
        };
        Insert: {
          campaign_id: string;
          checkouts_accessed?: number;
          checkouts_sent?: number;
          created_at?: string;
          id?: string;
          leads?: number;
          metric_date: string;
          organization_id: string;
          product_views?: number;
          sales_confirmed?: number;
          vitrine_accesses?: number;
        };
        Update: {
          campaign_id?: string;
          checkouts_accessed?: number;
          checkouts_sent?: number;
          created_at?: string;
          id?: string;
          leads?: number;
          metric_date?: string;
          organization_id?: string;
          product_views?: number;
          sales_confirmed?: number;
          vitrine_accesses?: number;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_daily_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_products: {
        Row: {
          campaign_id: string;
          created_at: string;
          id: string;
          organization_id: string;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          campaign_id: string;
          created_at?: string;
          id?: string;
          organization_id: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          campaign_id?: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_tracking_events: {
        Row: {
          campaign_id: string | null;
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json;
          organization_id: string;
          product_id: string | null;
          public_token: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
          product_id?: string | null;
          public_token?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          product_id?: string | null;
          public_token?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_tracking_events_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_tracking_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          banner_url: string | null;
          created_at: string;
          description: string | null;
          ends_at: string | null;
          headline: string | null;
          id: string;
          name: string;
          organization_id: string;
          section_banner_url: string | null;
          slug: string;
          starts_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          banner_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          headline?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          section_banner_url?: string | null;
          slug: string;
          starts_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          banner_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          headline?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          section_banner_url?: string | null;
          slug?: string;
          starts_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      checkout_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json;
          organization_id: string;
          product_id: string | null;
          sales_session_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
          product_id?: string | null;
          sales_session_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          product_id?: string | null;
          sales_session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "checkout_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkout_events_sales_session_id_fkey";
            columns: ["sales_session_id"];
            isOneToOne: false;
            referencedRelation: "sales_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      continuity_codes: {
        Row: {
          code: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          organization_id: string;
          support_session_id: string;
          used_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          organization_id: string;
          support_session_id: string;
          used_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          organization_id?: string;
          support_session_id?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "continuity_codes_support_session_id_fkey";
            columns: ["support_session_id"];
            isOneToOne: false;
            referencedRelation: "support_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      evaluations: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          organization_id: string;
          product_id: string | null;
          rating: number | null;
          ratings: Json;
          resolved_status: string | null;
          session_id: string;
          session_type: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          organization_id: string;
          product_id?: string | null;
          rating?: number | null;
          ratings?: Json;
          resolved_status?: string | null;
          session_id: string;
          session_type: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          organization_id?: string;
          product_id?: string | null;
          rating?: number | null;
          ratings?: Json;
          resolved_status?: string | null;
          session_id?: string;
          session_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evaluations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          organization_id: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          organization_id: string;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          organization_id?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      group_permissions: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          permission_id: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          permission_id: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          permission_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_permissions_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hardness_master_prompts: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          sales_master_prompt: string;
          support_master_prompt: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          sales_master_prompt?: string;
          support_master_prompt?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          sales_master_prompt?: string;
          support_master_prompt?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hardness_master_prompts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      human_message_warnings: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          metadata: Json;
          organization_id: string;
          profile_id: string | null;
          session_id: string | null;
          session_type: string | null;
          warning_type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          metadata?: Json;
          organization_id: string;
          profile_id?: string | null;
          session_id?: string | null;
          session_type?: string | null;
          warning_type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          metadata?: Json;
          organization_id?: string;
          profile_id?: string | null;
          session_id?: string | null;
          session_type?: string | null;
          warning_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "human_message_warnings_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          created_at: string;
          id: string;
          metadata: Json;
          movement_type: string;
          organization_id: string;
          product_id: string;
          quantity: number;
          reason: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          movement_type: string;
          organization_id: string;
          product_id: string;
          quantity: number;
          reason?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          movement_type?: string;
          organization_id?: string;
          product_id?: string;
          quantity?: number;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount: number | null;
          created_at: string;
          due_at: string | null;
          id: string;
          organization_id: string;
          paid_at: string | null;
          status: string;
          subscription_id: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          organization_id: string;
          paid_at?: string | null;
          status?: string;
          subscription_id?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          organization_id?: string;
          paid_at?: string | null;
          status?: string;
          subscription_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_bases: {
        Row: {
          archived_at: string | null;
          category: string | null;
          content_text: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          file_name: string;
          file_size: number;
          id: string;
          mime_type: string;
          organization_id: string;
          public_url: string | null;
          status: string;
          storage_bucket: string;
          storage_path: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          category?: string | null;
          content_text?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          file_name: string;
          file_size?: number;
          id?: string;
          mime_type?: string;
          organization_id: string;
          public_url?: string | null;
          status?: string;
          storage_bucket?: string;
          storage_path: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          category?: string | null;
          content_text?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          file_name?: string;
          file_size?: number;
          id?: string;
          mime_type?: string;
          organization_id?: string;
          public_url?: string | null;
          status?: string;
          storage_bucket?: string;
          storage_path?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
          organization_id: string;
          phone: string | null;
          product_id: string | null;
          source: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          organization_id: string;
          phone?: string | null;
          product_id?: string | null;
          source?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          phone?: string | null;
          product_id?: string | null;
          source?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          read_at: string | null;
          recipient_id: string | null;
          title: string;
          type: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          organization_id: string;
          read_at?: string | null;
          recipient_id?: string | null;
          title: string;
          type: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          read_at?: string | null;
          recipient_id?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      organization_ai_settings: {
        Row: {
          ai_auto_takeover_enabled: boolean;
          api_key_encrypted: string | null;
          base_url: string | null;
          created_at: string;
          daily_message_limit: number | null;
          daily_token_limit: number | null;
          fallback_enabled: boolean;
          fallback_model: string | null;
          fallback_model_id: string | null;
          fallback_provider: string | null;
          human_accept_timeout_seconds: number;
          id: string;
          is_active: boolean;
          max_output_tokens: number | null;
          model: string;
          model_id: string;
          monthly_message_limit: number | null;
          monthly_token_limit: number | null;
          organization_id: string;
          provider: string;
          temperature: number | null;
          timeout_seconds: number | null;
          updated_at: string;
        };
        Insert: {
          ai_auto_takeover_enabled?: boolean;
          api_key_encrypted?: string | null;
          base_url?: string | null;
          created_at?: string;
          daily_message_limit?: number | null;
          daily_token_limit?: number | null;
          fallback_enabled?: boolean;
          fallback_model?: string | null;
          fallback_model_id?: string | null;
          fallback_provider?: string | null;
          human_accept_timeout_seconds?: number;
          id?: string;
          is_active?: boolean;
          max_output_tokens?: number | null;
          model: string;
          model_id: string;
          monthly_message_limit?: number | null;
          monthly_token_limit?: number | null;
          organization_id: string;
          provider: string;
          temperature?: number | null;
          timeout_seconds?: number | null;
          updated_at?: string;
        };
        Update: {
          ai_auto_takeover_enabled?: boolean;
          api_key_encrypted?: string | null;
          base_url?: string | null;
          created_at?: string;
          daily_message_limit?: number | null;
          daily_token_limit?: number | null;
          fallback_enabled?: boolean;
          fallback_model?: string | null;
          fallback_model_id?: string | null;
          fallback_provider?: string | null;
          human_accept_timeout_seconds?: number;
          id?: string;
          is_active?: boolean;
          max_output_tokens?: number | null;
          model?: string;
          model_id?: string;
          monthly_message_limit?: number | null;
          monthly_token_limit?: number | null;
          organization_id?: string;
          provider?: string;
          temperature?: number | null;
          timeout_seconds?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_settings: {
        Row: {
          ai_takeover_timeout_seconds: number;
          created_at: string;
          id: string;
          organization_id: string;
          sales_public_enabled: boolean;
          support_public_enabled: boolean;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          ai_takeover_timeout_seconds?: number;
          created_at?: string;
          id?: string;
          organization_id: string;
          sales_public_enabled?: boolean;
          support_public_enabled?: boolean;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          ai_takeover_timeout_seconds?: number;
          created_at?: string;
          id?: string;
          organization_id?: string;
          sales_public_enabled?: boolean;
          support_public_enabled?: boolean;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          about: string | null;
          cnpj: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          person_type: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          about?: string | null;
          cnpj?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          person_type?: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          about?: string | null;
          cnpj?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          person_type?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number | null;
          created_at: string;
          id: string;
          invoice_id: string | null;
          metadata: Json;
          organization_id: string;
          provider: string | null;
          status: string;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          id?: string;
          invoice_id?: string | null;
          metadata?: Json;
          organization_id: string;
          provider?: string | null;
          status: string;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          id?: string;
          invoice_id?: string | null;
          metadata?: Json;
          organization_id?: string;
          provider?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          key: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          key: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          key?: string;
        };
        Relationships: [];
      };
      plan_limits: {
        Row: {
          created_at: string;
          id: string;
          key: string;
          plan_id: string;
          value: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key: string;
          plan_id: string;
          value: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          key?: string;
          plan_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          organization_id: string;
          parent_slug: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          organization_id: string;
          parent_slug?: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          parent_slug?: string;
          slug?: string;
        };
        Relationships: [];
      };
      product_knowledge_bases: {
        Row: {
          created_at: string;
          id: string;
          knowledge_base_id: string;
          organization_id: string;
          product_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          knowledge_base_id: string;
          organization_id: string;
          product_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          knowledge_base_id?: string;
          organization_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_knowledge_bases_knowledge_base_id_fkey";
            columns: ["knowledge_base_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_bases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_knowledge_bases_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_knowledge_bases_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_knowledge_embeddings: {
        Row: {
          created_at: string;
          embedding: Json | null;
          id: string;
          knowledge_item_id: string;
          model: string | null;
          organization_id: string;
          provider: string | null;
        };
        Insert: {
          created_at?: string;
          embedding?: Json | null;
          id?: string;
          knowledge_item_id: string;
          model?: string | null;
          organization_id: string;
          provider?: string | null;
        };
        Update: {
          created_at?: string;
          embedding?: Json | null;
          id?: string;
          knowledge_item_id?: string;
          model?: string | null;
          organization_id?: string;
          provider?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_knowledge_embeddings_knowledge_item_id_fkey";
            columns: ["knowledge_item_id"];
            isOneToOne: false;
            referencedRelation: "product_knowledge_items";
            referencedColumns: ["id"];
          },
        ];
      };
      product_knowledge_items: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          metadata: Json;
          organization_id: string;
          product_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
          product_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          product_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_knowledge_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_subcategories: {
        Row: {
          category_id: string;
          created_at: string;
          id: string;
          name: string;
          organization_id: string;
          slug: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          id?: string;
          name: string;
          organization_id: string;
          slug: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_subcategories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_support_reasons: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          organization_id: string;
          product_id: string;
          reason: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          organization_id: string;
          product_id: string;
          reason: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          organization_id?: string;
          product_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_support_reasons_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category: string | null;
          checkout_url: string | null;
          commission_margin: number | null;
          created_at: string;
          difficulty: string | null;
          discount_type: string;
          discount_value: number | null;
          id: string;
          image_url: string | null;
          image_urls: string[];
          is_featured: boolean;
          main_benefit: string | null;
          name: string;
          organization_id: string;
          price: number | null;
          priority: number;
          product_type: string | null;
          public_benefits: string | null;
          public_cta: string | null;
          public_description: string | null;
          public_headline: string | null;
          short_description: string | null;
          show_price_publicly: boolean;
          slug: string;
          status: string;
          stock_control_enabled: boolean;
          stock_minimum: number;
          stock_quantity: number;
          subcategory: string | null;
          support_info: string | null;
          updated_at: string;
          warranty: string | null;
        };
        Insert: {
          category?: string | null;
          checkout_url?: string | null;
          commission_margin?: number | null;
          created_at?: string;
          difficulty?: string | null;
          discount_type?: string;
          discount_value?: number | null;
          id?: string;
          image_url?: string | null;
          image_urls?: string[];
          is_featured?: boolean;
          main_benefit?: string | null;
          name: string;
          organization_id: string;
          price?: number | null;
          priority?: number;
          product_type?: string | null;
          public_benefits?: string | null;
          public_cta?: string | null;
          public_description?: string | null;
          public_headline?: string | null;
          short_description?: string | null;
          show_price_publicly?: boolean;
          slug: string;
          status?: string;
          stock_control_enabled?: boolean;
          stock_minimum?: number;
          stock_quantity?: number;
          subcategory?: string | null;
          support_info?: string | null;
          updated_at?: string;
          warranty?: string | null;
        };
        Update: {
          category?: string | null;
          checkout_url?: string | null;
          commission_margin?: number | null;
          created_at?: string;
          difficulty?: string | null;
          discount_type?: string;
          discount_value?: number | null;
          id?: string;
          image_url?: string | null;
          image_urls?: string[];
          is_featured?: boolean;
          main_benefit?: string | null;
          name?: string;
          organization_id?: string;
          price?: number | null;
          priority?: number;
          product_type?: string | null;
          public_benefits?: string | null;
          public_cta?: string | null;
          public_description?: string | null;
          public_headline?: string | null;
          short_description?: string | null;
          show_price_publicly?: boolean;
          slug?: string;
          status?: string;
          stock_control_enabled?: boolean;
          stock_minimum?: number;
          stock_quantity?: number;
          subcategory?: string | null;
          support_info?: string | null;
          updated_at?: string;
          warranty?: string | null;
        };
        Relationships: [];
      };
      profile_permissions: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          permission_id: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          permission_id: string;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          permission_id?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_permissions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_permissions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          is_banned: boolean;
          organization_id: string;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          is_banned?: boolean;
          organization_id: string;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          is_banned?: boolean;
          organization_id?: string;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sales_confirmations: {
        Row: {
          amount: number | null;
          confirmed_by: string | null;
          created_at: string;
          id: string;
          metadata: Json;
          organization_id: string;
          product_id: string | null;
          sales_session_id: string | null;
          source: string;
        };
        Insert: {
          amount?: number | null;
          confirmed_by?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
          product_id?: string | null;
          sales_session_id?: string | null;
          source?: string;
        };
        Update: {
          amount?: number | null;
          confirmed_by?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          product_id?: string | null;
          sales_session_id?: string | null;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_confirmations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_confirmations_sales_session_id_fkey";
            columns: ["sales_session_id"];
            isOneToOne: false;
            referencedRelation: "sales_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          metadata: Json;
          organization_id: string;
          sender_id: string | null;
          sender_type: string;
          session_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
          sender_id?: string | null;
          sender_type: string;
          session_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          sender_id?: string | null;
          sender_type?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sales_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_sessions: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          ai_takeover_at: string | null;
          closed_at: string | null;
          created_at: string;
          handled_by_type: string | null;
          id: string;
          lead_id: string | null;
          opened_at: string | null;
          organization_id: string;
          product_id: string;
          public_token: string;
          session_code: string;
          source: string;
          status: string;
          updated_at: string;
          visitor_expires_at: string | null;
          visitor_id: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          ai_takeover_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          handled_by_type?: string | null;
          id?: string;
          lead_id?: string | null;
          opened_at?: string | null;
          organization_id: string;
          product_id: string;
          public_token: string;
          session_code: string;
          source?: string;
          status?: string;
          updated_at?: string;
          visitor_expires_at?: string | null;
          visitor_id?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          ai_takeover_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          handled_by_type?: string | null;
          id?: string;
          lead_id?: string | null;
          opened_at?: string | null;
          organization_id?: string;
          product_id?: string;
          public_token?: string;
          session_code?: string;
          source?: string;
          status?: string;
          updated_at?: string;
          visitor_expires_at?: string | null;
          visitor_id?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          organization_id: string;
          plan_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          organization_id: string;
          plan_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          organization_id?: string;
          plan_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      support_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          metadata: Json;
          organization_id: string;
          sender_id: string | null;
          sender_type: string;
          session_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
          sender_id?: string | null;
          sender_type: string;
          session_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          sender_id?: string | null;
          sender_type?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "support_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      support_sessions: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          ai_takeover_at: string | null;
          closed_at: string | null;
          continuity_code: string | null;
          created_at: string;
          custom_reason: string | null;
          handled_by_type: string | null;
          id: string;
          opened_at: string | null;
          organization_id: string;
          product_id: string | null;
          public_token: string;
          reason: string;
          source: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          ai_takeover_at?: string | null;
          closed_at?: string | null;
          continuity_code?: string | null;
          created_at?: string;
          custom_reason?: string | null;
          handled_by_type?: string | null;
          id?: string;
          opened_at?: string | null;
          organization_id: string;
          product_id?: string | null;
          public_token: string;
          reason: string;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          ai_takeover_at?: string | null;
          closed_at?: string | null;
          continuity_code?: string | null;
          created_at?: string;
          custom_reason?: string | null;
          handled_by_type?: string | null;
          id?: string;
          opened_at?: string | null;
          organization_id?: string;
          product_id?: string | null;
          public_token?: string;
          reason?: string;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_records: {
        Row: {
          created_at: string;
          id: string;
          key: string;
          organization_id: string;
          period_end: string | null;
          period_start: string | null;
          quantity: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key: string;
          organization_id: string;
          period_end?: string | null;
          period_start?: string | null;
          quantity?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          key?: string;
          organization_id?: string;
          period_end?: string | null;
          period_start?: string | null;
          quantity?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_sales_ticket: { Args: { p_session_id: string }; Returns: Json };
      accept_support_ticket: { Args: { p_session_id: string }; Returns: Json };
      ai_takeover_waiting_sessions: {
        Args: { p_timeout_seconds?: number };
        Returns: Json;
      };
      close_sales_ticket: { Args: { p_session_id: string }; Returns: Json };
      close_support_ticket: { Args: { p_session_id: string }; Returns: Json };
      confirm_checkout_sale: { Args: { p_event_id: string }; Returns: Json };
      confirm_lead_sale: { Args: { p_lead_id: string }; Returns: Json };
      confirm_manual_sale: {
        Args: { p_amount?: number; p_session_id: string };
        Returns: Json;
      };
      create_initial_organization: {
        Args: {
          p_about: string;
          p_cnpj?: string;
          p_name: string;
          p_person_type: string;
        };
        Returns: Json;
      };
      create_lead: {
        Args: {
          p_email: string;
          p_name: string;
          p_phone?: string;
          p_product_id?: string;
          p_source?: string;
        };
        Returns: Json;
      };
      create_sales_session_from_product: {
        Args: {
          p_customer_email: string;
          p_customer_name: string;
          p_product_slug: string;
        };
        Returns: Json;
      };
      create_support_session: {
        Args: {
          p_custom_reason?: string;
          p_initial_message?: string;
          p_product_id: string;
          p_reason: string;
        };
        Returns: Json;
      };
      current_user_has_permission: {
        Args: { p_permission_key: string };
        Returns: boolean;
      };
      current_user_is_manager: { Args: never; Returns: boolean };
      current_user_is_operator: { Args: never; Returns: boolean };
      current_user_is_owner: { Args: never; Returns: boolean };
      current_user_organization_id: { Args: never; Returns: string };
      current_user_permissions: { Args: never; Returns: string[] };
      generate_continuity_code: {
        Args: { p_session_id: string };
        Returns: Json;
      };
      generate_unique_campaign_slug: {
        Args: {
          p_exclude_campaign_id?: string;
          p_name: string;
          p_organization_id: string;
        };
        Returns: string;
      };
      generate_unique_product_code: {
        Args: { p_exclude_product_id?: string; p_organization_id: string };
        Returns: string;
      };
      generate_unique_product_slug: {
        Args: {
          p_exclude_product_id?: string;
          p_name: string;
          p_organization_id: string;
        };
        Returns: string;
      };
      get_dashboard_overview: { Args: { p_period?: string }; Returns: Json };
      get_global_ai_settings: {
        Args: { p_organization_id: string };
        Returns: Json;
      };
      get_hardness_master_prompts: {
        Args: { p_organization_id: string };
        Returns: Json;
      };
      get_public_product_by_slug: {
        Args: { p_product_slug: string };
        Returns: Json;
      };
      get_public_product_reviews: {
        Args: { p_product_slug: string };
        Returns: Json;
      };
      get_public_sales_messages: {
        Args: { p_public_token: string };
        Returns: {
          content: string;
          created_at: string;
          id: string;
          metadata: Json;
          organization_id: string;
          sender_id: string | null;
          sender_type: string;
          session_id: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "sales_messages";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_public_sales_session: {
        Args: { p_public_token: string };
        Returns: Json;
      };
      get_public_storefront: { Args: never; Returns: Json };
      get_public_storefront_categories: { Args: never; Returns: Json };
      get_public_support_messages: {
        Args: { p_public_token: string };
        Returns: {
          content: string;
          created_at: string;
          id: string;
          metadata: Json;
          organization_id: string;
          sender_id: string | null;
          sender_type: string;
          session_id: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "support_messages";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_public_support_session: {
        Args: { p_public_token: string };
        Returns: Json;
      };
      get_team_management_data: { Args: never; Returns: Json };
      insert_manual_product_evaluation: {
        Args: {
          p_comment?: string;
          p_product_id: string;
          p_rating: number;
          p_ratings?: Json;
        };
        Returns: Json;
      };
      list_public_active_products: { Args: never; Returns: Json };
      mark_all_notifications_read: { Args: never; Returns: Json };
      mark_bad_ai_response: {
        Args: {
          p_agent_id?: string;
          p_message_id?: string;
          p_organization_id: string;
          p_reason?: string;
          p_session_id?: string;
          p_session_type?: string;
        };
        Returns: Json;
      };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: Json;
      };
      open_sales_ticket: { Args: { p_session_id: string }; Returns: Json };
      open_support_ticket: { Args: { p_session_id: string }; Returns: Json };
      organization_read_policy: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      public_email_is_registered: {
        Args: { p_email: string };
        Returns: boolean;
      };
      register_ai_usage: {
        Args: {
          p_agent_id?: string;
          p_input_tokens?: number;
          p_metadata?: Json;
          p_model?: string;
          p_organization_id: string;
          p_output_tokens?: number;
          p_provider?: string;
          p_session_id?: string;
          p_session_type?: string;
        };
        Returns: Json;
      };
      save_global_ai_settings:
        | {
            Args: {
              p_ai_auto_takeover_enabled?: boolean;
              p_fallback_enabled?: boolean;
              p_fallback_model_id?: string;
              p_human_accept_timeout_seconds?: number;
              p_max_output_tokens?: number;
              p_model_id: string;
              p_organization_id: string;
              p_provider?: string;
              p_temperature?: number;
              p_timeout_seconds?: number;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_api_key_encrypted?: string;
              p_base_url?: string;
              p_fallback_enabled?: boolean;
              p_fallback_model?: string;
              p_fallback_provider?: string;
              p_max_output_tokens?: number;
              p_model: string;
              p_organization_id: string;
              p_provider: string;
              p_temperature?: number;
              p_timeout_seconds?: number;
            };
            Returns: Json;
          };
      save_hardness_master_prompts: {
        Args: {
          p_organization_id: string;
          p_sales_master_prompt: string;
          p_support_master_prompt: string;
        };
        Returns: Json;
      };
      save_member_permissions: {
        Args: {
          p_organization_id: string;
          p_permission_keys?: string[];
          p_profile_id: string;
        };
        Returns: Json;
      };
      save_product_ai_configuration: {
        Args: {
          p_knowledge_base_ids?: string[];
          p_organization_id: string;
          p_product_id: string;
          p_sales: Json;
          p_support: Json;
        };
        Returns: Json;
      };
      save_team_group: {
        Args: {
          p_description?: string;
          p_group_id: string;
          p_member_ids?: string[];
          p_name: string;
          p_organization_id: string;
          p_permission_keys?: string[];
        };
        Returns: Json;
      };
      send_public_sales_message: {
        Args: { p_content: string; p_public_token: string };
        Returns: Json;
      };
      send_public_support_message: {
        Args: { p_content: string; p_public_token: string };
        Returns: Json;
      };
      send_sales_message: {
        Args: { p_content: string; p_session_id: string };
        Returns: Json;
      };
      send_support_message: {
        Args: { p_content: string; p_session_id: string };
        Returns: Json;
      };
      slugify_organization_name: { Args: { p_name: string }; Returns: string };
      storefront_primary_categories: { Args: never; Returns: Json };
      submit_public_session_feedback: {
        Args: {
          p_comment?: string;
          p_public_token: string;
          p_ratings: Json;
          p_session_type: string;
        };
        Returns: Json;
      };
      take_over_ai_sales_ticket: {
        Args: { p_session_id: string };
        Returns: Json;
      };
      take_over_ai_support_ticket: {
        Args: { p_session_id: string };
        Returns: Json;
      };
      transfer_sales_ticket: { Args: { p_session_id: string }; Returns: Json };
      transfer_support_ticket: {
        Args: { p_session_id: string };
        Returns: Json;
      };
      validate_continuity_code: { Args: { p_code: string }; Returns: Json };
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
