'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  TicketIcon,
  Zap,
  Eye,
  Copy,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { ApiEndpoints } from '@/components/contact-form-api/api-endpoints';
import { QuickReference } from '@/components/contact-form-api/quick-reference';
import { ApiTester } from '@/components/contact-form-api/api-tester';
import { useToast } from '@/hooks/use-toast';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function ContactFormAPIPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [baseUrl] = useState('https://clubwiz.in/contact-form');

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'endpoints', label: 'Endpoints', icon: <Send className="w-4 h-4" /> },
    { id: 'reference', label: 'Quick Reference', icon: <TicketIcon className="w-4 h-4" /> },
    { id: 'tester', label: 'API Tester', icon: <Zap className="w-4 h-4" /> },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Copied to clipboard!', 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-purple-400" />
                Clubwiz Contact Form API
              </h1>
              <p className="mt-2 text-slate-400">Complete API reference & interactive tester</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 w-fit">
              <span className="text-sm text-slate-400">Base URL:</span>
              <code className="text-sm font-mono text-purple-400">{baseUrl}</code>
              <button
                onClick={() => copyToClipboard(baseUrl)}
                className="ml-2 p-1 hover:bg-slate-700 rounded"
              >
                <Copy className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-16 z-30 border-b border-slate-700 bg-slate-900/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 sm:px-6 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Info Card */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  Overview
                </h2>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex gap-3">
                    <span className="text-blue-400">→</span>
                    <span>Submit ratings and feedback from users</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-400">→</span>
                    <span>Handle business inquiries and partnerships</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-400">→</span>
                    <span>Manage tickets for admin and business users</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-400">→</span>
                    <span>Optional media uploads for feedback</span>
                  </li>
                </ul>
              </div>

              {/* Authentication Card */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Authentication
                </h2>
                <div className="space-y-2">
                  <p className="text-slate-300 text-sm">All endpoints require Bearer token:</p>
                  <div className="bg-slate-900/50 rounded p-3 mt-2 border border-slate-600">
                    <code className="text-xs text-slate-300">
                      Authorization: Bearer &lt;JWT_TOKEN&gt;
                    </code>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    • Role: ROLE_BUSINESS_ADMIN
                    <br />
                    • Token expires (check exp field)
                    <br />• Generate fresh token before each request
                  </p>
                </div>
              </div>
            </div>

            {/* Known Issues */}
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-6 backdrop-blur flex gap-4">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-amber-300 font-bold mb-2">Known Issue</h3>
                <p className="text-amber-100/80 text-sm">
                  GET endpoint for business tickets returns 500 error on some IDs. Use List All Tickets
                  endpoint instead. Backend validation needed.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Endpoints', value: '4', icon: '📡' },
                { label: 'Ticket Types', value: '2', icon: '🎫' },
                { label: 'Auth Method', value: 'JWT', icon: '🔐' },
                { label: 'Response Format', value: 'JSON', icon: '📋' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 text-center backdrop-blur"
                >
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-white font-bold text-lg">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && <ApiEndpoints />}

        {/* Quick Reference Tab */}
        {activeTab === 'reference' && <QuickReference />}

        {/* API Tester Tab */}
        {activeTab === 'tester' && <ApiTester baseUrl={baseUrl} />}
      </div>
    </div>
  );
}
