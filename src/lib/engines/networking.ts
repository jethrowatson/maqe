/**
 * C08 Connections, Networking & RFQ Engine
 * Manages lead opportunities, contact event history, internal participant messaging,
 * RFQ distribution with isolated bidder threads, and referral claims (Sections 14, 14A).
 * Backed by real UK engineering businesses from the Phase One 1,000-company cohort.
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
  FIXTURE_RFQ_TEMPLATES,
  DEFAULT_ORG_ID,
  THIRD_ORG_ID
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
        opportunity_id: 'opp_regent_dmeng_01',
        org_id: DEFAULT_ORG_ID,
        channel: 'rfq',
        summary: 'Sent capability pack & presswork tolerance data to D & M Engineering Limited (#02706103)',
        details: 'Up to 700-tonne press capacity, ISO 9001:2015 & BS EN 1090 certified in Wednesbury (WS10 8XB).',
        occurred_at: '2026-10-14T10:00:00Z'
      }
    ];

    this.conversations = new Map();
    this.messages = [];

    const convId = 'conv_regent_dmeng';
    this.conversations.set(convId, {
      conversation_id: convId,
      participant_org_ids: [DEFAULT_ORG_ID, THIRD_ORG_ID],
      subject: 'Subcontract Pressings & Stamped Gear Housing Blanks (SIC 25500 -> 28150)',
      resource_type: 'opportunity',
      resource_id: 'opp_regent_dmeng_01',
      created_at: '2026-10-14T10:15:00Z'
    });

    this.messages.push(
      {
        message_id: 'msg_01',
        conversation_id: convId,
        sender_org_id: DEFAULT_ORG_ID,
        sender_user_id: 'usr_regent_ops',
        sender_name: 'Operations Director (Regent Engineering Co (Walsall) Limited)',
        body: 'Hello D & M Engineering team, MAQE matched our 700-tonne metal pressing and welded assembly facility in Wednesbury (#00551421, ISO 9001:2015 / BS EN 1090) with your transmission and bearing housing requirements (#02706103). Would you like to review our presswork capacity schedule?',
        sent_at: '2026-10-14T10:15:00Z'
      },
      {
        message_id: 'msg_02',
        conversation_id: convId,
        sender_org_id: THIRD_ORG_ID,
        sender_user_id: 'usr_dmeng_purchasing',
        sender_name: 'Procurement Lead (D & M Engineering Limited)',
        body: 'Thank you for reaching out. We are actively sourcing heavy-gauge pressed steel mounting brackets and blanking for our precision machining lines. Please share your lead times for scheduled call-off batches.',
        sent_at: '2026-10-14T11:20:00Z'
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
