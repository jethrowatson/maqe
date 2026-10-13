'use client';

import React, { useState, useEffect } from 'react';
import { store } from '../lib/db/store';
import {
  MatchCandidateResult,
  MatchDirection,
  CompanyRecord,
  Opportunity,
  OpportunityState,
  PlanTier
} from '../lib/domain/types';

import { Header } from '../components/Header';
import { BrochureView } from '../components/BrochureView';
import { LoginPage, AuthSession } from '../components/LoginPage';

import { MemberMatchingView } from '../components/MemberMatchingView';
import { DirectorySearchView } from '../components/DirectorySearchView';
import { OpportunityCRMView } from '../components/OpportunityCRMView';
import { MessagingView } from '../components/MessagingView';
import { RFQManagerView } from '../components/RFQManagerView';
import { CompanyProfileView } from '../components/CompanyProfileView';
import { BillingCreditsView } from '../components/BillingCreditsView';

import { OperatorIntakeView } from '../components/OperatorIntakeView';
import { OperatorDiscoveryView } from '../components/OperatorDiscoveryView';
import { OperatorMatchingLabView } from '../components/OperatorMatchingLabView';
import { OperatorJobsView } from '../components/OperatorJobsView';

import {
  Sparkles,
  Search,
  Kanban,
  MessageSquare,
  FileText,
  Building2,
  CreditCard,
  Database,
  Compass,
  Sliders,
  Activity,
  Bell
} from 'lucide-react';

export default function MAQEApp() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [pageState, setPageState] = useState<'brochure' | 'login' | 'app'>('brochure');
  const [loginRoleTarget, setLoginRoleTarget] = useState<'member' | 'operator'>('member');

  const [mode, setMode] = useState<'member' | 'operator'>('member');
  const [memberView, setMemberView] = useState<string>('matches');
  const [operatorView, setOperatorView] = useState<string>('intake');
  const [direction, setDirection] = useState<MatchDirection>('customer');
  const [cloudConnected, setCloudConnected] = useState<boolean>(true);
  const [creditBalance, setCreditBalance] = useState<number>(50);
  const [candidates, setCandidates] = useState<MatchCandidateResult[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [selectedCompanyForDossier, setSelectedCompanyForDossier] = useState<CompanyRecord | null>(null);

  // Initialize session from localStorage & ping cloud API
  useEffect(() => {
    store.checkRemoteApi().then(connected => setCloudConnected(connected));
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maqe_auth_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as AuthSession;
          if (parsed && parsed.isAuthenticated) {
            setAuthSession(parsed);
            setMode(parsed.role);
            setPageState('app');
          }
        } catch {
          localStorage.removeItem('maqe_auth_session');
        }
      }
    }
    refreshState();
  }, []);

  useEffect(() => {
    refreshState();
  }, [direction, memberView, operatorView]);

  const refreshState = () => {
    setCreditBalance(store.getCreditBalance());
    setCandidates(store.getMatches('demo_delta', direction));
    setOpportunities(store.getOpportunities());
  };

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    setMode(session.role);
    setPageState('app');
    refreshState();
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('maqe_auth_session');
    }
    setAuthSession(null);
    setPageState('login');
  };

  const handleGoToLogin = (targetRole?: 'member' | 'operator') => {
    if (targetRole) {
      setLoginRoleTarget(targetRole);
    }
    setPageState('login');
  };

  const handleUnlockCandidate = async (cand: MatchCandidateResult) => {
    const res = await store.unlockCandidate('demo_delta', cand.counterparty_company_id, direction);
    refreshState();
  };

  const handleOpenConversation = (opp: Opportunity) => {
    setMemberView('messages');
  };

  const handleContactFromMatch = (cand: MatchCandidateResult) => {
    setMemberView('messages');
  };

  const handleSendRFQFromMatch = (cand: MatchCandidateResult) => {
    setMemberView('rfq');
  };

  const handleUpgradePlan = (tier: PlanTier) => {
    store.upgradePlan(tier);
    refreshState();
  };

  const handlePurchasePack = (credits: number, packId: string, price: number) => {
    store.purchasePack(credits, packId, price);
    refreshState();
  };

  // 1. Brochure Landing Page
  if (pageState === 'brochure') {
    return (
      <BrochureView
        onGoToLogin={handleGoToLogin}
        cloudConnected={cloudConnected}
      />
    );
  }

  // 2. Dedicated Secure Login Page
  if (pageState === 'login') {
    return (
      <LoginPage
        initialRole={loginRoleTarget}
        onLoginSuccess={handleLoginSuccess}
        onBackToBrochure={() => setPageState('brochure')}
      />
    );
  }

  // 3. Authenticated Secure Platform
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Primary Top Header */}
      <Header
        mode={mode}
        setMode={setMode}
        activeView={mode === 'member' ? memberView : operatorView}
        setActiveView={mode === 'member' ? setMemberView : setOperatorView}
        creditBalance={creditBalance}
        cloudConnected={cloudConnected}
        unreadCount={store.notificationEngine.getUnreadCount('org_delta')}
        onOpenNotifications={() => setShowNotifications(true)}
        onLogout={handleLogout}
        onViewBrochure={() => setPageState('brochure')}
      />

      {/* Sub Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none">
            {mode === 'member' ? (
              <>
                <button
                  onClick={() => { setMemberView('matches'); setSelectedCompanyForDossier(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    memberView === 'matches' && !selectedCompanyForDossier
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  AI Matching & Leads
                </button>
                <button
                  onClick={() => { setMemberView('directory'); setSelectedCompanyForDossier(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    memberView === 'directory' && !selectedCompanyForDossier
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Engineering Directory
                </button>
                <button
                  onClick={() => { setMemberView('crm'); setSelectedCompanyForDossier(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    memberView === 'crm'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Opportunity CRM
                </button>
                <button
                  onClick={() => { setMemberView('messages'); setSelectedCompanyForDossier(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    memberView === 'messages'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  In-App Messaging
                </button>
                <button
                  onClick={() => { setMemberView('rfq'); setSelectedCompanyForDossier(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    memberView === 'rfq'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  RFQ Procurement
                </button>
                <button
                  onClick={() => { setMemberView('profile'); setSelectedCompanyForDossier(store.getCompany('demo_delta') || null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    memberView === 'profile' || selectedCompanyForDossier
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Company Profile & Proof
                </button>
                <button
                  onClick={() => { setMemberView('billing'); setSelectedCompanyForDossier(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    memberView === 'billing'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Plans & Credits
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setOperatorView('intake')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    operatorView === 'intake'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  C01 Registry Intake
                </button>
                <button
                  onClick={() => setOperatorView('discovery')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    operatorView === 'discovery'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  C02 Discovery & Sources
                </button>
                <button
                  onClick={() => setOperatorView('matching_lab')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    operatorView === 'matching_lab'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  C05 Matching Lab
                </button>
                <button
                  onClick={() => setOperatorView('jobs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center shrink-0 ${
                    operatorView === 'jobs'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  C10 Jobs & Audit Trail
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Body Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {mode === 'member' ? (
          <>
            {selectedCompanyForDossier ? (
              <CompanyProfileView
                company={selectedCompanyForDossier}
                profile={store.getProfile(selectedCompanyForDossier.company_id)}
                assertions={store.enrichmentEngine.getAssertions(selectedCompanyForDossier.company_id)}
                onClaimCompany={(id) => {
                  alert(`Verification claim token generated for ${id}`);
                }}
              />
            ) : memberView === 'matches' ? (
              <MemberMatchingView
                candidates={candidates}
                direction={direction}
                setDirection={(dir) => { setDirection(dir); refreshState(); }}
                onUnlock={handleUnlockCandidate}
                onContact={handleContactFromMatch}
                onSendRFQ={handleSendRFQFromMatch}
                creditBalance={creditBalance}
              />
            ) : memberView === 'directory' ? (
              <DirectorySearchView
                companies={store.getCompanies()}
                getProfile={(id) => store.getProfile(id)}
                onSelectCompany={(c) => setSelectedCompanyForDossier(c)}
              />
            ) : memberView === 'crm' ? (
              <OpportunityCRMView
                opportunities={opportunities}
                onUpdateState={(id, state, notes) => {
                  store.updateOpportunityState(id, state, notes);
                  refreshState();
                }}
                onLogContact={(id, channel, summary) => {
                  store.networkingEngine.logContactEvent(id, 'org_delta', channel, summary);
                  refreshState();
                }}
                onOpenConversation={handleOpenConversation}
              />
            ) : memberView === 'messages' ? (
              <MessagingView
                conversations={store.getConversations()}
                onSendMessage={(cid, text) => {
                  store.sendMessage(cid, text);
                  refreshState();
                }}
              />
            ) : memberView === 'rfq' ? (
              <RFQManagerView
                rfqs={store.getRFQs()}
                templates={store.networkingEngine.getRFQTemplates('org_delta')}
                availableSuppliers={store.getCompanies()}
                onDispatchRFQ={(title, desc, date, sups) => {
                  store.dispatchRFQ(title, desc, date, sups);
                  refreshState();
                }}
              />
            ) : memberView === 'profile' ? (
              <CompanyProfileView
                company={store.getCompany('demo_delta')!}
                profile={store.getProfile('demo_delta')}
                assertions={store.enrichmentEngine.getAssertions('demo_delta')}
                onClaimCompany={(id) => {
                  alert(`Ownership verified for Delta Metalworks`);
                }}
              />
            ) : memberView === 'billing' ? (
              <BillingCreditsView
                wallet={store.getWallet()}
                ledger={store.getLedger()}
                currentPlan="premium"
                onUpgradePlan={handleUpgradePlan}
                onPurchasePack={handlePurchasePack}
              />
            ) : null}
          </>
        ) : (
          <>
            {operatorView === 'intake' ? (
              <OperatorIntakeView
                partitions={store.intakeEngine.getPartitions()}
                watermarks={store.intakeEngine.getWatermarks()}
                onPause={() => { store.intakeEngine.pauseBackfill(); refreshState(); }}
                onResume={() => { store.intakeEngine.resumeBackfill(); refreshState(); }}
                onStepPartition={(id) => { store.intakeEngine.stepPartition(id); refreshState(); }}
                status={store.intakeEngine.getStatus()}
                onStepLiveScrape={(sic) => {
                  const res = store.intakeEngine.stepLiveScrape(sic);
                  refreshState();
                  return res;
                }}
                eventLog={store.intakeEngine.getEventLog()}
                newlyScrapedCompanies={store.intakeEngine.getNewlyScrapedCompanies()}
                onSetSpeed={(spd) => store.intakeEngine.setScraperSpeed(spd)}
              />
            ) : operatorView === 'discovery' ? (
              <OperatorDiscoveryView
                associations={store.discoveryEngine.getAssociations()}
                documents={store.discoveryEngine.getDocuments()}
                onUpdateDecision={(id, dec, reason) => {
                  store.discoveryEngine.updateDecision(id, dec, 'Operator', reason);
                  refreshState();
                }}
              />
            ) : operatorView === 'matching_lab' ? (
              <OperatorMatchingLabView />
            ) : operatorView === 'jobs' ? (
              <OperatorJobsView
                jobs={store.jobEngine.getJobs()}
                auditEvents={store.jobEngine.getAuditEvents()}
                onRetryJob={(id) => {
                  store.jobEngine.retryJob(id);
                  refreshState();
                }}
              />
            ) : null}
          </>
        )}
      </main>

      {/* Notification Center Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Notifications & Alerts</h3>
              </div>
              <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100 overflow-y-auto flex-1">
              {store.notificationEngine.getNotifications('org_delta').map(n => (
                <div
                  key={n.notification_id}
                  onClick={() => store.notificationEngine.markAsRead(n.notification_id)}
                  className={`py-3 px-2 rounded-lg cursor-pointer ${n.read_at ? 'opacity-70' : 'bg-blue-50/40'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{n.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span className="font-bold text-slate-800">MAQE Engineering Intelligence Platform</span> • Protected Gateway
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setPageState('brochure')} className="hover:text-blue-600">
              Platform Overview
            </button>
            <span>•</span>
            <button onClick={handleLogout} className="text-rose-600 hover:text-rose-800">
              Lock Session
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
