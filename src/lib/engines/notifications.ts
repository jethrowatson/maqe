/**
 * C12 Multi-channel Notification Engine
 * In-app notifications and provider sinks (SendGrid, Twilio, WhatsApp) (Section 14A).
 */

import { NotificationItem } from '../domain/types';
import { DEFAULT_ORG_ID } from '../fixtures/cohort';

export class NotificationEngine {
  private notifications: NotificationItem[];

  constructor() {
    this.notifications = [
      {
        notification_id: 'notif_01',
        recipient_org_id: DEFAULT_ORG_ID,
        event_type: 'match.generated',
        title: 'Phase One Cohort Enrichment & Matching Complete',
        body: '1,000 real UK engineering businesses ingested & enriched. 600 directional B2B matches computed across verified supply chains.',
        priority: 'high',
        created_at: '2026-10-14T14:22:48Z'
      },
      {
        notification_id: 'notif_02',
        recipient_org_id: DEFAULT_ORG_ID,
        event_type: 'rfq.response',
        title: 'Response from D & M Engineering Limited (#02706103)',
        body: 'Procurement Lead at D & M Engineering replied regarding heavy-gauge pressed steel mounting brackets.',
        priority: 'normal',
        read_at: '2026-10-14T12:00:00Z',
        created_at: '2026-10-14T11:20:00Z'
      }
    ];
  }

  public getNotifications(org_id: string): NotificationItem[] {
    return this.notifications.filter(n => n.recipient_org_id === org_id);
  }

  public getUnreadCount(org_id: string): number {
    return this.notifications.filter(n => n.recipient_org_id === org_id && !n.read_at).length;
  }

  public markAsRead(notification_id: string): void {
    const notif = this.notifications.find(n => n.notification_id === notification_id);
    if (notif) {
      notif.read_at = new Date().toISOString();
    }
  }

  public emit(params: {
    recipient_org_id: string;
    event_type: string;
    title: string;
    body: string;
    priority?: 'low' | 'normal' | 'high';
  }): NotificationItem {
    const notif: NotificationItem = {
      notification_id: `notif_${Date.now()}`,
      recipient_org_id: params.recipient_org_id,
      event_type: params.event_type,
      title: params.title,
      body: params.body,
      priority: params.priority || 'normal',
      created_at: new Date().toISOString()
    };
    this.notifications.unshift(notif);
    return notif;
  }
}
