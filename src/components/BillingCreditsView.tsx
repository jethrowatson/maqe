'use client';

import React from 'react';
import { CreditWallet, LedgerEntry, PlanTier } from '../lib/domain/types';
import { COMMERCIAL_PLANS, CREDIT_PACKS } from '../lib/engines/commerce';
import {
  CreditCard,
  Coins,
  Check,
  ArrowUpRight,
  ShieldCheck,
  History,
  Clock
} from 'lucide-react';

interface BillingCreditsViewProps {
  wallet: CreditWallet;
  ledger: LedgerEntry[];
  currentPlan: PlanTier;
  onUpgradePlan: (tier: PlanTier) => void;
  onPurchasePack: (credits: number, packId: string, price: number) => void;
}

export function BillingCreditsView({
  wallet,
  ledger,
  currentPlan,
  onUpgradePlan,
  onPurchasePack
}: BillingCreditsViewProps) {
  const total = wallet.allowance_balance + wallet.purchased_balance;

  return (
    <div className="space-y-6">
      {/* Wallet Balance Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-bold text-slate-900">Intelligence Credit Balance</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Credits allow permanently unlocking verified counterparty contact details and deep dossiers.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <div className="text-right">
              <div className="text-3xl font-black text-slate-900">{total}</div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Available Credits</div>
            </div>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-600 block">Monthly Plan Allowance</span>
              <span className="font-bold text-blue-900 text-sm">{wallet.allowance_balance} Credits</span>
            </div>
            <span className="text-[10px] text-blue-700 font-medium">Resets on billing cycle</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-600 block">Purchased Credit Packs</span>
              <span className="font-bold text-emerald-900 text-sm">{wallet.purchased_balance} Credits</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">Never expire</span>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Membership Plans & Monthly Allowances</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COMMERCIAL_PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline">
                    <span className="text-2xl font-black text-slate-900">£{plan.price_gbp_monthly}</span>
                    <span className="text-xs text-slate-500 ml-1">/ month</span>
                  </div>

                  <div className="text-xs font-semibold text-blue-700 mt-1">
                    {plan.monthly_credits} matching credits / month
                  </div>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-3.5 h-3.5 text-blue-600 mr-2 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    disabled={isCurrent}
                    onClick={() => onUpgradePlan(plan.id)}
                    className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* One-Time Credit Packs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">One-Time Credit Top-Up Packs</h2>
        <p className="text-xs text-slate-500 mb-4">Packs add permanent credits to your wallet that never expire.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CREDIT_PACKS.map(pack => (
            <div key={pack.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{pack.name}</h4>
                <div className="text-lg font-black text-slate-900 mt-0.5">+{pack.credits} Credits</div>
                <div className="text-xs text-slate-500">£{pack.price_gbp} one-time</div>
              </div>

              <button
                onClick={() => onPurchasePack(pack.credits, pack.id, pack.price_gbp)}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 hover:border-blue-500 text-slate-900 rounded-lg shadow-2xs"
              >
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Immutable Credit Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <History className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Immutable Ledger & Audit Trail</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Every credit grant, debit, and transaction is permanently recorded with full auditability.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Balance After</th>
                <th className="py-2.5 px-3">Reference / Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.map(entry => (
                <tr key={entry.entry_id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">
                    {entry.entry_type}
                  </td>
                  <td className={`py-2.5 px-3 font-bold ${entry.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                    {entry.balance_after}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {entry.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
