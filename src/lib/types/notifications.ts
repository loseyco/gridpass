export type NotificationType =
  | 'news_digest'
  | 'comment_reply'
  | 'comment_like'
  | 'vehicle_vote'
  | 'event_pass'
  | 'trackside_attendance'
  | 'system';

export interface UserNotification {
  id: string;
  user_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  link_url: string;
  read: boolean;
  count?: number; // e.g. 5 new articles, 12 new votes
  category?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationTab {
  id: 'all' | 'news' | 'comments' | 'events';
  label: string;
  icon: string;
}
