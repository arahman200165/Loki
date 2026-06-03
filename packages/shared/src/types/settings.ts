// User-facing privacy and app settings models

// 'polling' mode is post-MVP (high-anonymity option deferred)
export type NotificationMode = 'push';

export interface ChatMuteEntry {
  chat_id: string;
  muted_until: string | null; // ISO-8601 or null = indefinite
}

export interface NotificationSettings {
  mode: NotificationMode;
  muted_chats: ChatMuteEntry[];
}

// null = disappearing messages off for new chats by default
export interface DisappearingMessageSettings {
  default_timer_seconds: number | null;
}

export interface VaultSettings {
  is_configured: boolean;
}

export interface PrivacySettings {
  notifications: NotificationSettings;
  disappearing_messages: DisappearingMessageSettings;
  vault: VaultSettings;
}

// Contact request status — shared between server model and mobile UI
export type ContactRequestStatus = 'pending' | 'accepted' | 'denied' | 'expired';
