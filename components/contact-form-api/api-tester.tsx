'use client';

import React, { useState } from 'react';
import { Play, Copy, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface ApiRequest {
  method: 'GET' | 'POST';
  endpoint: string;
  body?: Record<string, any>;
}

interface ApiResponse {
  status: number;
  data: any;
  error?: string;
}

const requests: Record<
  string,
  {
    method: 'GET' | 'POST';
    endpoint: string;
    label: string;
    defaultBody?: Record<string, any>;
    description: string;
  }
> = {
  feedback: {
    method: 'POST',
    endpoint: '/contact/rating_feedback',
    label: 'Submit Feedback',
    description: 'Submit user rating and feedback',
    defaultBody: {
      username: 'kaushikchand.baurasi-231',
      rating: 5,
      review: 'Excellent service!',
      feedback: 'Great experience overall.',
      photoOrVideo: 'https://example.com/image1.jpg',
    },
  },
  business: {
    method: 'POST',
    endpoint: '/contact/clubwiz_business',
    label: 'Submit Business Inquiry',
    description: 'Submit business partnership inquiry',
    defaultBody: {
      name: 'John Doe',
      email: 'john@example.com',
      contactNumber: '+919876543210',
      instagramLink: 'https://instagram.com/johndoe',
      whatsAppLink: 'https://wa.me/919876543210',
      message: 'I would like to know more about your services.',
    },
  },
  tickets: {
    method: 'GET',
    endpoint: '/contact/tickets/business-admin',
    label: 'List All Tickets',
    description: 'Retrieve all feedback and business tickets',
  },
  ticketById: {
    method: 'GET',
    endpoint: '/contact/clubwiz_business/{id}',
    label: 'Get Ticket by ID',
    description: 'Retrieve a specific business ticket',
  },
};

export function ApiTester({ baseUrl }: { baseUrl: string }) {
  const [selectedRequest, setSelectedRequest] = useState<string>('feedback');
  const [token, setToken] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('');
  const [body, setBody] = useState<string>(JSON.stringify(requests.feedback.defaultBody, null, 2));
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRequest = requests[selectedRequest];

  const handleRequestChange = (requestKey: string) => {
    setSelectedRequest(requestKey);
    setResponse(null);
    setError(null);
    if (requests[requestKey].defaultBody) {
      setBody(JSON.stringify(requests[requestKey].defaultBody, null, 2));
    } else {
      setBody('');
    }
  };

  const executeRequest = async () => {
    if (!token) {
      setError('JWT token is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let endpoint = currentRequest.endpoint;
      if (selectedRequest === 'ticketById') {
        if (!ticketId) {
          setError('Ticket ID is required');
          return;
        }
        endpoint = endpoint.replace('{id}', ticketId);
      }

      const url = `${baseUrl}${endpoint}`;
      const options: RequestInit = {
        method: currentRequest.method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
      };

      if (currentRequest.method === 'POST' && body) {
        try {
          options.body = body;
        } catch (e) {
          setError('Invalid JSON in request body');
          return;
        }
      }

      const res = await fetch(url, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
    }
  };

  const copyUrl = () => {
    let endpoint = currentRequest.endpoint;
    if (selectedRequest === 'ticketById') {
      endpoint = endpoint.replace('{id}', ticketId || 'YOUR_TICKET_ID');
    }
    navigator.clipboard.writeText(`${baseUrl}${endpoint}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-4">Request</h3>

            {/* Request Selector */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Select Endpoint</label>
              <select
                value={selectedRequest}
                onChange={(e) => handleRequestChange(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-slate-200 text-sm"
              >
                {Object.entries(requests).map(([key, req]) => (
                  <option key={key} value={key}>
                    {req.method} {req.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">{currentRequest.description}</p>
            </div>

            {/* Token Input */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">JWT Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your Bearer token here..."
                className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-slate-200 text-sm placeholder-slate-500 font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">Required for all requests</p>
            </div>

            {/* Ticket ID Input (for Get by ID) */}
            {selectedRequest === 'ticketById' && (
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-2">Ticket ID</label>
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="69b99849e3c258192edeea05"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-slate-200 text-sm placeholder-slate-500 font-mono"
                />
              </div>
            )}

            {/* Request Body */}
            {currentRequest.method === 'POST' && (
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-2">Request Body (JSON)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-slate-200 text-sm font-mono"
                />
              </div>
            )}

            {/* URL Display */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">URL</label>
              <div className="bg-slate-900/50 border border-slate-600 rounded px-3 py-2 flex items-center justify-between">
                <code className="text-xs text-slate-400 font-mono break-all pr-2">
                  {currentRequest.method} {baseUrl}
                  {currentRequest.endpoint === '/contact/clubwiz_business/{id}'
                    ? currentRequest.endpoint.replace('{id}', ticketId || '{id}')
                    : currentRequest.endpoint}
                </code>
                <button onClick={copyUrl} className="p-1 hover:bg-slate-700 rounded flex-shrink-0">
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={executeRequest}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute Request
                </>
              )}
            </button>
          </div>
        </div>

        {/* Response Panel */}
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-4">Response</h3>

            {error && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {response && (
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center gap-2 mb-3">
                  {response.status >= 200 && response.status < 300 ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">{response.status} Success</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-semibold">{response.status} Error</span>
                    </>
                  )}
                </div>

                {/* Response Body */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-300">Response Body</label>
                    <button
                      onClick={copyResponse}
                      className="p-1 hover:bg-slate-700 rounded"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-700/50 rounded p-3 max-h-96 overflow-auto">
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Response Details */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/30">
                  <div className="bg-slate-900/50 rounded p-2">
                    <p className="text-xs text-slate-400">Status Code</p>
                    <p className="text-sm font-mono text-slate-200">{response.status}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <p className="text-xs text-slate-400">Content-Type</p>
                    <p className="text-sm font-mono text-slate-200">application/json</p>
                  </div>
                </div>
              </div>
            )}

            {!response && !error && (
              <div className="text-center py-12">
                <p className="text-slate-400">Execute a request to see response here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4 backdrop-blur">
        <p className="text-blue-200 text-sm">
          💡 <strong>Tip:</strong> Get a fresh JWT token from your auth system, then test each endpoint. The
          "List All Tickets" endpoint is more reliable than "Get by ID" for retrieving individual tickets.
        </p>
      </div>
    </div>
  );
}
