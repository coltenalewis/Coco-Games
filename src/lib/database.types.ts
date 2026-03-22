export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          discord_id: string;
          discord_username: string;
          discord_avatar: string | null;
          roblox_id: string | null;
          roblox_username: string | null;
          is_owner: boolean;
          role: "owner" | "executive" | "admin" | "developer" | "coordinator" | "mod" | "contractor" | "user";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          discord_id: string;
          discord_username: string;
          discord_avatar?: string | null;
          roblox_id?: string | null;
          roblox_username?: string | null;
          is_owner?: boolean;
          role?: "owner" | "executive" | "admin" | "developer" | "coordinator" | "mod" | "contractor" | "user";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          discord_id?: string;
          discord_username?: string;
          discord_avatar?: string | null;
          roblox_id?: string | null;
          roblox_username?: string | null;
          is_owner?: boolean;
          role?: "owner" | "executive" | "admin" | "developer" | "coordinator" | "mod" | "contractor" | "user";
          updated_at?: string;
        };
      };
      guild_configs: {
        Row: {
          id: string;
          guild_id: string;
          welcome_enabled: boolean;
          welcome_channel: string | null;
          welcome_message: string | null;
          auto_roles: string[];
          verified_role_id: string | null;
          moderator_role_id: string | null;
          admin_role_id: string | null;
          announcement_channel: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          guild_id: string;
          welcome_enabled?: boolean;
          welcome_channel?: string | null;
          welcome_message?: string | null;
          auto_roles?: string[];
          verified_role_id?: string | null;
          moderator_role_id?: string | null;
          admin_role_id?: string | null;
          announcement_channel?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          guild_id?: string;
          welcome_enabled?: boolean;
          welcome_channel?: string | null;
          welcome_message?: string | null;
          auto_roles?: string[];
          verified_role_id?: string | null;
          moderator_role_id?: string | null;
          admin_role_id?: string | null;
          announcement_channel?: string | null;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          user_discord_id: string;
          subject: string;
          category: "discord_appeal" | "game_appeal" | "question" | "business" | "bug_report" | "game_report";
          status: "open" | "in_progress" | "closed";
          priority: "low" | "normal" | "high" | "urgent";
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          user_discord_id: string;
          subject: string;
          category?: "discord_appeal" | "game_appeal" | "question" | "business" | "bug_report" | "game_report";
          status?: "open" | "in_progress" | "closed";
          priority?: "low" | "normal" | "high" | "urgent";
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: {
          subject?: string;
          category?: "discord_appeal" | "game_appeal" | "question" | "business" | "bug_report" | "game_report";
          status?: "open" | "in_progress" | "closed";
          priority?: "low" | "normal" | "high" | "urgent";
          assigned_to?: string | null;
          updated_at?: string;
          closed_at?: string | null;
        };
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author_discord_id: string;
          content: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_discord_id: string;
          content: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          image_url?: string | null;
        };
      };
      discipline_log: {
        Row: {
          id: string;
          target_discord_id: string;
          guild_id: string | null;
          guild_name: string | null;
          action_type: "ban" | "unban" | "kick" | "warn" | "note" | "timeout";
          reason: string | null;
          moderator_discord_id: string | null;
          moderator_username: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_discord_id: string;
          guild_id?: string | null;
          guild_name?: string | null;
          action_type: "ban" | "unban" | "kick" | "warn" | "note" | "timeout";
          reason?: string | null;
          moderator_discord_id?: string | null;
          moderator_username?: string | null;
          created_at?: string;
        };
        Update: {
          reason?: string | null;
          moderator_discord_id?: string | null;
          moderator_username?: string | null;
        };
      };
      announcements: {
        Row: {
          id: string;
          author_discord_id: string;
          content: string;
          guild_ids: string[];
          sent_at: string;
        };
        Insert: {
          id?: string;
          author_discord_id: string;
          content: string;
          guild_ids: string[];
          sent_at?: string;
        };
        Update: {
          content?: string;
          guild_ids?: string[];
        };
      };
      accounting_transactions: {
        Row: {
          id: string;
          type: "income" | "expense";
          category: string;
          description: string;
          amount: number;
          date: string;
          reference: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: "income" | "expense";
          category: string;
          description: string;
          amount: number;
          date: string;
          reference?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: "income" | "expense";
          category?: string;
          description?: string;
          amount?: number;
          date?: string;
          reference?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          type: "contract" | "invoice" | "letter" | "memo";
          title: string;
          content: string;
          status: "draft" | "final";
          created_by: string;
          recipient_name: string | null;
          recipient_title: string | null;
          effective_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: "contract" | "invoice" | "letter" | "memo";
          title: string;
          content: string;
          status?: "draft" | "final";
          created_by: string;
          recipient_name?: string | null;
          recipient_title?: string | null;
          effective_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: "contract" | "invoice" | "letter" | "memo";
          title?: string;
          content?: string;
          status?: "draft" | "final";
          recipient_name?: string | null;
          recipient_title?: string | null;
          effective_date?: string | null;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          calendar: "development" | "executive" | "staff";
          title: string;
          description: string | null;
          event_type: "event" | "deadline" | "meeting" | "reminder" | "subscription" | "release";
          start_date: string;
          end_date: string | null;
          all_day: boolean;
          color: string;
          recurring: "none" | "daily" | "weekly" | "monthly" | "yearly" | null;
          recurring_until: string | null;
          amount: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          calendar: "development" | "executive" | "staff";
          title: string;
          description?: string | null;
          event_type?: "event" | "deadline" | "meeting" | "reminder" | "subscription" | "release";
          start_date: string;
          end_date?: string | null;
          all_day?: boolean;
          color?: string;
          recurring?: "none" | "daily" | "weekly" | "monthly" | "yearly" | null;
          recurring_until?: string | null;
          amount?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          calendar?: "development" | "executive" | "staff";
          title?: string;
          description?: string | null;
          event_type?: "event" | "deadline" | "meeting" | "reminder" | "subscription" | "release";
          start_date?: string;
          end_date?: string | null;
          all_day?: boolean;
          color?: string;
          recurring?: "none" | "daily" | "weekly" | "monthly" | "yearly" | null;
          recurring_until?: string | null;
          amount?: number | null;
          updated_at?: string;
        };
      };
    };
  };
}
