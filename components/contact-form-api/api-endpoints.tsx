import React, { useState } from 'react';
import { ChevronDown, Copy, Code } from 'lucide-react';

interface Endpoint {
  id: string;
  method: 'POST' | 'GET';
  path: string;
  title: string;
  description: string;
  fields?: { name: string; type: string; description: string }[];
  example?: Record<string, any>;
  response?: Record<string, any>;
  notes?: string;
  hasIssue?: boolean;
}

export function ApiEndpoints() {
  const [expandedId, setExpandedId] = useState<string | null>('endpoint1');

  const endpoints: Endpoint[] = [
    {
      id: 'endpoint1',
      method: 'POST',
      path: '/contact/rating_feedback',
      title: 'Submit Rating & Feedback',
      description: 'Submits a user rating and review for the platform.',
      fields: [
        { name: 'username', type: 'string', description: 'User unique identifier (e.g. kaushikchand.baurasi-231)' },
        { name: 'rating', type: 'integer', description: 'Rating out of 5' },
        { name: 'review', type: 'string', description: 'Short review text' },
        { name: 'feedback', type: 'string', description: 'Detailed feedback' },
        { name: 'photoOrVideo', type: 'string', description: 'URL to photo or video attachment' },
      ],
      example: {
        username: 'kaushikchand.baurasi-231',
        rating: 5,
        review: 'Excellent service, highly recommended!',
        feedback: 'Loved the smooth experience and fast response.',
        photoOrVideo: 'https://example.com/image1.jpg',
      },
      response: {
        status: 'success',
        message: 'Feedback submitted successfully!',
        timestamp: '2026-03-17T18:07:05.796453848',
      },
    },
    {
      id: 'endpoint2',
      method: 'POST',
      path: '/contact/clubwiz_business',
      title: 'Submit Business Inquiry',
      description: 'Submits a business inquiry or partnership request.',
      fields: [
        { name: 'name', type: 'string', description: 'Contact person name' },
        { name: 'email', type: 'string', description: 'Email address' },
        { name: 'contactNumber', type: 'string', description: 'Phone with country code' },
        { name: 'instagramLink', type: 'string', description: 'Instagram profile URL' },
        { name: 'whatsAppLink', type: 'string', description: 'WhatsApp link (e.g. https://wa.me/number)' },
        { name: 'message', type: 'string', description: 'Inquiry message body' },
      ],
      example: {
        name: 'Shubham',
        email: 'kaushikchand.baurasi@gmail.com',
        contactNumber: '+919876543210',
        instagramLink: 'https://instagram.com/shubham.dev',
        whatsAppLink: 'https://wa.me/919876543210',
        message: 'Hi, I would like to know more about your services. Please get in touch.',
      },
      response: {
        status: 'success',
        message: 'Business inquiry submitted successfully!',
        timestamp: '2026-03-17T18:08:56.003911523',
      },
    },
    {
      id: 'endpoint3',
      method: 'GET',
      path: '/contact/tickets/business-admin',
      title: 'List All Tickets',
      description: 'Returns all submitted tickets (FEEDBACK and BUSINESS types) for authenticated business admin.',
      response: [
        {
          id: '69b99849e3c258192edeea05',
          type: 'FEEDBACK',
          username: 'kaushikchand.baurasi@gmail.com',
          rating: 5,
          review: 'Excellent service, highly recommended!',
          feedback: 'Loved the smooth experience and fast response.',
          photoOrVideo: 'https://example.com/image1.jpg',
          createdAt: '2026-03-17T18:07:05.565Z',
        },
        {
          id: '69b998b7e3c258192edeea07',
          type: 'BUSINESS',
          name: 'Shubham',
          message: 'Hi, I would like to know more about your services.',
          contactNumber: '+919876543210',
          instagramLink: 'https://instagram.com/shubham.dev',
          whatsAppLink: 'https://wa.me/919876543210',
          username: 'kaushikchand.baurasi@gmail.com',
          createdAt: '2026-03-17T18:08:55.799Z',
        },
      ],
      notes: 'Returns array of both FEEDBACK and BUSINESS ticket types.',
    },
    {
      id: 'endpoint4',
      method: 'GET',
      path: '/contact/clubwiz_business/{id}',
      title: 'Get Business Ticket by ID',
      description: 'Fetches a single business inquiry ticket by its ID.',
      notes: 'Use ticket ID from List All Tickets response.',
      hasIssue: true,
      response: {
        status: 'error',
        message: 'An unexpected error occurred',
        details: 'Returns 500 error on certain IDs. Backend validation needed.',
        timestamp: '2026-03-17T18:09:59.140116491',
      },
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'POST':
        return 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50';
      case 'GET':
        return 'bg-blue-900/30 text-blue-300 border-blue-700/50';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-600/50';
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {endpoints.map((endpoint) => (
        <div
          key={endpoint.id}
          className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur hover:border-slate-600/50 transition-all"
        >
          {/* Header */}
          <button
            onClick={() => setExpandedId(expandedId === endpoint.id ? null : endpoint.id)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-4 text-left flex-1">
              <span
                className={`px-3 py-1 rounded font-mono text-sm font-bold border ${getMethodColor(endpoint.method)}`}
              >
                {endpoint.method}
              </span>
              <div>
                <h3 className="text-white font-bold">{endpoint.title}</h3>
                <code className="text-sm text-slate-400 font-mono">{endpoint.path}</code>
              </div>
              {endpoint.hasIssue && (
                <span className="ml-auto px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded border border-red-700/50">
                  ⚠️ Issue
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${
                expandedId === endpoint.id ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Expanded Content */}
          {expandedId === endpoint.id && (
            <div className="border-t border-slate-700/50 bg-slate-900/30 px-6 py-4 space-y-4">
              <p className="text-slate-300">{endpoint.description}</p>

              {endpoint.fields && (
                <div>
                  <h4 className="text-sm font-bold text-slate-200 mb-3">Request Fields</h4>
                  <div className="space-y-2">
                    {endpoint.fields.map((field) => (
                      <div key={field.name} className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-cyan-400 font-mono text-sm">{field.name}</code>
                          <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                            {field.type}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{field.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {endpoint.example && (
                <div>
                  <h4 className="text-sm font-bold text-slate-200 mb-2">Example Request</h4>
                  <div className="bg-slate-900/50 rounded p-3 border border-slate-700/50 relative group">
                    <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                      {JSON.stringify(endpoint.example, null, 2)}
                    </pre>
                    <button
                      onClick={() => copyCode(JSON.stringify(endpoint.example, null, 2))}
                      className="absolute top-2 right-2 p-2 bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>
              )}

              {endpoint.response && (
                <div>
                  <h4 className="text-sm font-bold text-slate-200 mb-2">Response (200 OK)</h4>
                  <div className="bg-slate-900/50 rounded p-3 border border-slate-700/50 relative group">
                    <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                      {JSON.stringify(endpoint.response, null, 2)}
                    </pre>
                    <button
                      onClick={() => copyCode(JSON.stringify(endpoint.response, null, 2))}
                      className="absolute top-2 right-2 p-2 bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>
              )}

              {endpoint.notes && (
                <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
                  <p className="text-blue-200 text-sm">💡 {endpoint.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
