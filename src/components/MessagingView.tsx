'use client';

import React, { useState } from 'react';
import { Conversation, Message } from '../lib/domain/types';
import {
  MessageSquare,
  Send,
  Building,
  User,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface MessagingViewProps {
  conversations: Conversation[];
  onSendMessage: (conversationId: string, text: string) => void;
}

export function MessagingView({
  conversations,
  onSendMessage
}: MessagingViewProps) {
  const [activeConvId, setActiveConvId] = useState<string>(
    conversations[0]?.conversation_id || ''
  );
  const [inputText, setInputText] = useState('');

  const activeConv = conversations.find(c => c.conversation_id === activeConvId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;
    onSendMessage(activeConvId, inputText);
    setInputText('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[550px]">
      {/* Sidebar: Conversation List */}
      <div className="border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <MessageSquare className="w-4 h-4 text-blue-600 mr-2" />
            In-App Messaging Network
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Authorised Participant Threads</p>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {conversations.map(c => {
            const isSelected = c.conversation_id === activeConvId;
            const lastMsg = c.messages?.[c.messages.length - 1];
            return (
              <div
                key={c.conversation_id}
                onClick={() => setActiveConvId(c.conversation_id)}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 line-clamp-1">{c.subject}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {c.messages?.length || 0} msgs
                  </span>
                </div>
                {lastMsg && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {lastMsg.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Pane */}
      <div className="col-span-2 flex flex-col bg-white">
        {activeConv ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeConv.subject}</h3>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>MAQE Authenticated Channel • End-to-end participant isolated</span>
                </div>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {activeConv.messages?.map(msg => {
                const isMe = msg.sender_org_id === 'org_regent_00551421';
                return (
                  <div
                    key={msg.message_id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800">{msg.sender_name || msg.sender_org_id}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-slate-100 text-slate-900 rounded-tl-xs border border-slate-200'
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-slate-50 flex items-center space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your authenticated message..."
                className="flex-1 text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            Select a conversation thread to view messages
          </div>
        )}
      </div>
    </div>
  );
}
