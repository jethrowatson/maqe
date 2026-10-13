/**
 * C07 Allocation & Credits Ledger Engine
 * Enforces atomic double-entry credit ledger, permanent match access,
 * and the non-double-charging invariant (Section 13 & 13A).
 */

import {
  CreditWallet,
  LedgerEntry,
  MemberMatchAccess,
  Opportunity,
  MatchDirection
} from '../domain/types';

export interface UnlockResult {
  success: boolean;
  already_unlocked: boolean;
  access_id: string;
  balance_remaining: number;
  transaction_id?: string;
  error?: string;
}

export class CreditLedgerEngine {
  private wallets: Map<string, CreditWallet>; // Key: org_id
  private ledger: LedgerEntry[];
  private unlockedAccess: Map<string, MemberMatchAccess>; // Key: `${org_id}_${focus}_${counterparty}`

  constructor(
    initialWallets?: CreditWallet[],
    initialLedger?: LedgerEntry[],
    initialAccess?: MemberMatchAccess[]
  ) {
    this.wallets = new Map();
    if (initialWallets) {
      for (const w of initialWallets) {
        this.wallets.set(w.org_id, { ...w });
      }
    }

    this.ledger = initialLedger ? [...initialLedger] : [];
    this.unlockedAccess = new Map();
    if (initialAccess) {
      for (const a of initialAccess) {
        const key = this.getAccessKey(a.org_id, a.focus_company_id, a.counterparty_company_id);
        this.unlockedAccess.set(key, { ...a });
      }
    }
  }

  public getAccessKey(org_id: string, focus_id: string, counterparty_id: string): string {
    return `${org_id}:${focus_id}:${counterparty_id}`;
  }

  public isUnlocked(org_id: string, focus_id: string, counterparty_id: string): boolean {
    return this.unlockedAccess.has(this.getAccessKey(org_id, focus_id, counterparty_id));
  }

  public getWallet(org_id: string): CreditWallet {
    let wallet = this.wallets.get(org_id);
    if (!wallet) {
      wallet = {
        wallet_id: `wallet_${org_id}`,
        org_id,
        allowance_balance: 20,
        purchased_balance: 0,
        updated_at: new Date().toISOString()
      };
      this.wallets.set(org_id, wallet);
    }
    return wallet;
  }

  public getTotalCredits(org_id: string): number {
    const w = this.getWallet(org_id);
    return w.allowance_balance + w.purchased_balance;
  }

  public getLedger(org_id: string): LedgerEntry[] {
    const wallet = this.getWallet(org_id);
    return this.ledger.filter(l => l.wallet_id === wallet.wallet_id);
  }

  public unlockMatch(
    org_id: string,
    focus_company_id: string,
    counterparty_company_id: string,
    direction: MatchDirection = 'customer'
  ): UnlockResult {
    const accessKey = this.getAccessKey(org_id, focus_company_id, counterparty_company_id);

    // Invariant 1: Check if already unlocked (Never double-charge!)
    const existing = this.unlockedAccess.get(accessKey);
    if (existing) {
      return {
        success: true,
        already_unlocked: true,
        access_id: existing.access_id,
        balance_remaining: this.getTotalCredits(org_id)
      };
    }

    const wallet = this.getWallet(org_id);
    const totalCredits = wallet.allowance_balance + wallet.purchased_balance;

    if (totalCredits < 1) {
      return {
        success: false,
        already_unlocked: false,
        access_id: '',
        balance_remaining: totalCredits,
        error: 'Insufficient credit balance. Upgrade your plan or purchase a credit pack.'
      };
    }

    // Debit 1 credit: prefer monthly allowance balance first
    if (wallet.allowance_balance > 0) {
      wallet.allowance_balance -= 1;
    } else {
      wallet.purchased_balance -= 1;
    }
    wallet.updated_at = new Date().toISOString();

    const balAfter = wallet.allowance_balance + wallet.purchased_balance;
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const accessId = `acc_${org_id}_${counterparty_company_id}`;

    // Record immutable ledger entry
    const entry: LedgerEntry = {
      entry_id: txId,
      wallet_id: wallet.wallet_id,
      entry_type: 'match_unlock_debit',
      amount: -1,
      balance_after: balAfter,
      reference_id: accessId,
      description: `Unlocked contact and deep intelligence for ${counterparty_company_id}`,
      created_at: new Date().toISOString()
    };
    this.ledger.unshift(entry);

    // Save permanent access grant
    const accessRecord: MemberMatchAccess = {
      access_id: accessId,
      org_id,
      focus_company_id,
      counterparty_company_id,
      unlocked_at: new Date().toISOString(),
      source_transaction_id: txId
    };
    this.unlockedAccess.set(accessKey, accessRecord);

    return {
      success: true,
      already_unlocked: false,
      access_id: accessId,
      balance_remaining: balAfter,
      transaction_id: txId
    };
  }

  public grantCredits(
    org_id: string,
    amount: number,
    type: 'monthly_grant' | 'pack_purchase',
    reference_id: string,
    description: string
  ): number {
    const wallet = this.getWallet(org_id);
    if (type === 'monthly_grant') {
      wallet.allowance_balance += amount;
    } else {
      wallet.purchased_balance += amount;
    }
    wallet.updated_at = new Date().toISOString();

    const balAfter = wallet.allowance_balance + wallet.purchased_balance;
    const entry: LedgerEntry = {
      entry_id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      wallet_id: wallet.wallet_id,
      entry_type: type,
      amount,
      balance_after: balAfter,
      reference_id,
      description,
      created_at: new Date().toISOString()
    };
    this.ledger.unshift(entry);
    return balAfter;
  }
}
