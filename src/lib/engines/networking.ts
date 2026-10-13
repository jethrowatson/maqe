/**
 * C08 Connections, Networking & RFQ Engine
 * Manages lead opportunities, contact event history, internal participant messaging,
 * RFQ distribution with isolated bidder threads, and referral claims (Sections 14, 14A).
 */

import {
  Opportunity,
  OpportunityState,
  ContactEvent,
  Conversation,
  Message,
  RFQ,
  RFQRecipient,
  RFQTemplate,
  ReferralInvitation
} from '../domain/types';
import {
  FIXTURE_OPPORTUNITIES,
  FIXTURE_RFQ_TEMPLATES
} from '../fixtures/cohort';

export class NetworkingEngine {
  private opportunities: Map<string, Opportunity>;
  private contactEvents: ContactEvent[];
  private conversations: Map<string, Conversation>;
  private messages: Message[];
  private rfqTemplates: Map<string, RFQTemplate>;
  private rfqs: Map<string, RFQ>;
  private rfqRecipients: RFQRecipient[];
  private invitations: Map<string, ReferralInvitation>;

  constructor() {
    this.opportunities = new Map();
    for (const opp of FIXTURE_OPPORTUNITIES) {
      this.opportunities.set(opp.opportunity_id, { ...opp });
    }

    this.contactEvents = [
      {
        event_id: 'ce_01',
        opportunity_id: 'opp_delta_enclosures',
        org_id: 'org_delta',
        channel: 'rfq',
        summary: 'Sent RFQ for server rack sheet metal panels',
        details: 'Batch size 250 units, delivery to Nottingham within 4 weeks.',
        occurred_at: '2026-10-06T14:00:00Z'
      }
    ];

    this.conversations = new Map();
    this.messages = [];

    // Seed initial conversation
    const convId = 'conv_delta_enclosures';
    this.conversations.set(convId, {
      conversation_id: convId,
      participant_org_ids: ['org_delta', 'org_enclosures'],
      subject: 'Enquiry regarding custom server rack laser profiling',
      resource_type: 'opportunity',
      resource_id: 'opp_delta_enclosures',
      created_at: '2026-10-06T14:15:00Z'
    });

    this.messages.push(
      {
        message_id: 'msg_01',
        conversation_id: convId,
        sender_org_id: 'org_delta',
        sender_user_id: 'usr_delta_ops',
        sender_name: 'Marcus Vance (Delta Metalworks)',
        body: 'Hello Apex Enclosures team, we noticed your server rack production requirements. Delta Metalworks operates 10kW fiber laser cutters with automated robotic press forming in Sheffield. Would you like to review our tolerance specifications?',
        sent_at: '2026-10-06T14:15:00Z'
      },
      {
        message_id: 'msg_02',
        conversation_id: convId,
        sender_org_id: 'org_enclosures',
        sender_user_id: 'usr_enc_purchasing',
        sender_name: 'David Croft (Apex Enclosures)',
        body: 'Hi Marcus, thank you for reaching out. We are currently looking for a secondary supplier for 3mm mild steel front panels. What is your standard lead time for batch sizes of 250?',
        sent_at: '2026-10-07T09:30:00Z'
      }
    );

    this.rfqTemplates = new Map();
    for (const tmpl of FIXTURE_RFQ_TEMPLATES) {
      this.rfqTemplates.set(tmpl.template_id, { ...tmpl });
    }

    this.rfqs = new Map();
    this.rfqRecipients = [];
    this.invitations = new Map();
  }

  // --- Opportunities & CRM ---

  public getOpportunities(org_id: string): Opportunity[] {
    return Array.from(this.opportunities.values()).filter(o => o.org_id === org_id);
  }

  public updateOpportunityState(
    opportunity_id: string,
    state: OpportunityState,
    notes?: string
  ): Opportunity | null {
    const opp = this.opportunities.get(opportunity_id);
    if (!opp) return null;
    opp.state = state;
    if (notes) opp.notes = notes;
    opp.updated_at = new Date().toISOString();
    return { ...opp };
  }

  public logContactEvent(
    opportunity_id: string,
    org_id: string,
    channel: 'maqe_message' | 'email' | 'phone' | 'rfq',
    summary: string,
    details?: string
  ): ContactEvent {
    const event: ContactEvent = {
      event_id: `ce_${Date.now()}`,
      opportunity_id,
      org_id,
      channel,
      summary,
      details,
      occurred_at: new Date().toISOString()
    };
    this.contactEvents.unshift(event);
    return event;
  }

  public getContactEvents(opportunity_id: string): ContactEvent[] {
    return this.contactEvents.filter(e => e.opportunity_id === opportunity_id);
  }

  // --- Messaging ---

  public getConversations(org_id: string): Conversation[] {
    const list = Array.from(this.conversations.values()).filter(c =>
      c.participant_org_ids.includes(org_id)
    );
    for (const conv of list) {
      conv.messages = this.messages.filter(m => m.conversation_id === conv.conversation_id);
    }
    return list;
  }

  public sendMessage(
    conversation_id: string,
    sender_org_id: string,
    sender_user_id: string,
    sender_name: string,
    body: string
  ): Message {
    const msg: Message = {
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversation_id,
      sender_org_id,
      sender_user_id,
      sender_name,
      body,
      sent_at: new Date().toISOString()
    };
    this.messages.push(msg);
    return msg;
  }

  // --- RFQs ---

  public getRFQTemplates(org_id: string): RFQTemplate[] {
    return Array.from(this.rfqTemplates.values()).filter(t => t.org_id === org_id);
  }

  public dispatchRFQ(
    issuer_org_id: string,
    title: string,
    description: string,
    response_date: string,
    supplier_companies: { id: string; name: string }[]
  ): RFQ {
    const rfqId = `rfq_${Date.now()}`;
    const rfq: RFQ = {
      rfq_id: rfqId,
      issuer_org_id,
      title,
      requirement_description: description,
      requested_response_date: response_date,
      state: 'open',
      created_at: new Date().toISOString(),
      recipients: []
    };

    for (const sup of supplier_companies) {
      const threadId = `conv_rfq_${rfqId}_${sup.id}`;
      // Isolated conversation thread per supplier so bidders cannot see competitors
      this.conversations.set(threadId, {
        conversation_id: threadId,
        participant_org_ids: [issuer_org_id, sup.id],
        subject: `RFQ Enquiry: ${title}`,
        resource_type: 'rfq',
        resource_id: rfqId,
        created_at: new Date().toISOString()
      });

      const recipient: RFQRecipient = {
        recipient_id: `recip_${rfqId}_${sup.id}`,
        rfq_id: rfqId,
        supplier_company_id: sup.id,
        supplier_company_name: sup.name,
        individual_thread_id: threadId,
        status: 'sent',
        created_at: new Date().toISOString()
      };
      this.rfqRecipients.push(recipient);
      rfq.recipients?.push(recipient);
    }

    this.rfqs.set(rfqId, rfq);
    return rfq;
  }

  public getRFQs(org_id: string): RFQ[] {
    const list = Array.from(this.rfqs.values()).filter(r => r.issuer_org_id === org_id);
    for (const r of list) {
      r.recipients = this.rfqRecipients.filter(rec => rec.rfq_id === r.rfq_id);
    }
    return list;
  }
}
