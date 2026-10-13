/**
 * C12 Multi-channel Notification Engine
 * In-app notifications and provider sinks (SendGrid, Twilio, WhatsApp) (Section 14A).
 */

import { NotificationItem } from '../domain/types';

export class NotificationEngine {
  private notifications: NotificationItem[];

  constructor() {
    this.notifications = [
      {
        notification_id: 'notif_01',
        recipient_org_id: 'org_delta',
        event_type: 'match.generated',
        title: 'New High-Score Customer Leads Available',
        body: '3 new customer recommendations (Apex Enclosures Ltd, Vanguard Auto Components) have been precomputed for Delta Metalworks.',
        priority: 'high',
        created_at: '2026-10-12T10:00:00Z'
      },
      {
        notification_id: 'notif_02',
        recipient_org_id: 'org_delta',
        event_type: 'rfq.response',
        title: 'Response received for Sheet Metal RFQ',
        body: 'David Croft from Apex Enclosures replied to your laser cutting tolerance query.',
        priority: 'normal',
        read_at: '2026-10-12T14:00:00Z',
        created_at: '2026-10-07T09:30:00Z'
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
