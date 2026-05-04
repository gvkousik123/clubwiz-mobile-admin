import React from 'react';
import { Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SchemaField {
  field: string;
  presentIn: string;
  type: string;
  notes?: string;
}

export function QuickReference() {
  const { toast } = useToast();

  const ticketSchema: SchemaField[] = [
    {
      field: 'id',
      presentIn: 'Both',
      type: 'string',
      notes: 'MongoDB ObjectId',
    },
    {
      field: 'type',
      presentIn: 'Both',
      type: 'string',
      notes: '"FEEDBACK" or "BUSINESS"',
    },
    {
      field: 'username',
      presentIn: 'Both',
      type: 'string',
      notes: 'Submitter email or username',
    },
    {
      field: 'createdAt',
      presentIn: 'Both',
      type: 'ISO 8601 datetime',
      notes: 'UTC timestamp',
    },
    {
      field: 'rating',
      presentIn: 'FEEDBACK',
      type: 'integer',
      notes: '1–5',
    },
    {
      field: 'review',
      presentIn: 'FEEDBACK',
      type: 'string',
    },
    {
      field: 'feedback',
      presentIn: 'FEEDBACK',
      type: 'string',
      notes: 'Detailed feedback',
    },
    {
      field: 'photoOrVideo',
      presentIn: 'FEEDBACK',
      type: 'string',
      notes: 'Media URL',
    },
    {
      field: 'name',
      presentIn: 'BUSINESS',
      type: 'string',
      notes: 'Contact name',
    },
    {
      field: 'email',
      presentIn: 'BUSINESS',
      type: 'string',
      notes: 'Contact email',
    },
    {
      field: 'contactNumber',
      presentIn: 'BUSINESS',
      type: 'string',
      notes: 'Phone with country code',
    },
    {
      field: 'instagramLink',
      presentIn: 'BUSINESS',
      type: 'string',
      notes: 'Instagram URL',
    },
    {
      field: 'whatsAppLink',
      presentIn: 'BUSINESS',
      type: 'string',
      notes: 'WhatsApp URL',
    },
    {
      field: 'message',
      presentIn: 'BUSINESS',
      type: 'string',
      notes: 'Inquiry message',
    },
  ];

  const httpHeaders = [
    { key: 'Authorization', value: 'Bearer <JWT_TOKEN>', description: 'Required for all endpoints' },
    { key: 'Content-Type', value: 'application/json', description: 'For POST requests' },
    { key: 'Accept', value: '*/*', description: 'Accept any response format' },
  ];

  const errorCodes = [
    { code: 200, meaning: 'Success' },
    { code: 401, meaning: 'Unauthorized — token missing, expired, or invalid' },
    { code: 500, meaning: 'Server error — affects GET by ID endpoint' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Copied!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HTTP Headers */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur">
        <h2 className="text-xl font-bold text-white mb-4">HTTP Headers</h2>
        <div className="space-y-3">
          {httpHeaders.map((header) => (
            <div key={header.key} className="bg-slate-900/50 rounded p-4 border border-slate-700/50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-cyan-400 font-mono font-bold">{header.key}</code>
                    <span className="text-xs text-slate-400">Header</span>
                  </div>
                  <code className="text-xs text-slate-300 block mb-1">{header.value}</code>
                  <p className="text-xs text-slate-400">{header.description}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(header.value)}
                  className="p-2 hover:bg-slate-800 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Schema */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur overflow-x-auto">
        <h2 className="text-xl font-bold text-white mb-4">Ticket Object Schema</h2>
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left py-3 px-3 text-slate-300 font-semibold">Field</th>
              <th className="text-left py-3 px-3 text-slate-300 font-semibold">Present In</th>
              <th className="text-left py-3 px-3 text-slate-300 font-semibold">Type</th>
              <th className="text-left py-3 px-3 text-slate-300 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ticketSchema.map((field, idx) => {
              const fieldColor =
                field.presentIn === 'FEEDBACK'
                  ? 'bg-emerald-900/20'
                  : field.presentIn === 'BUSINESS'
                    ? 'bg-blue-900/20'
                    : '';
              return (
                <tr key={idx} className={`border-b border-slate-700/30 ${fieldColor}`}>
                  <td className="py-3 px-3">
                    <code className="text-cyan-400 font-mono">{field.field}</code>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <span className="text-xs bg-slate-700/50 px-2 py-1 rounded inline-block">
                      {field.presentIn}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{field.type}</td>
                  <td className="py-3 px-3 text-slate-400 text-xs">{field.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* HTTP Status Codes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {errorCodes.map((error) => (
          <div
            key={error.code}
            className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl font-bold text-slate-300">{error.code}</div>
              <div>
                <p className="text-slate-300 font-semibold text-sm">{error.meaning}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6 backdrop-blur">
          <h3 className="text-green-300 font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Best Practices
          </h3>
          <ul className="space-y-2 text-green-100/80 text-sm">
            <li>✓ Always use fresh JWT tokens (check exp field)</li>
            <li>✓ Use List All Tickets instead of Get by ID for reliability</li>
            <li>✓ Include all required fields in POST requests</li>
            <li>✓ Handle 401 errors with token refresh</li>
            <li>✓ Validate email and phone formats client-side</li>
          </ul>
        </div>

        <div className="bg-orange-900/20 border border-orange-700/50 rounded-xl p-6 backdrop-blur">
          <h3 className="text-orange-300 font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Important Notes
          </h3>
          <ul className="space-y-2 text-orange-100/80 text-sm">
            <li>⚠ All timestamps in UTC ISO 8601 format</li>
            <li>⚠ GET /clubwiz_business/{'{id}'} may return 500 error</li>
            <li>⚠ Username field format: email-username-number</li>
            <li>⚠ photoOrVideo must be valid URL</li>
            <li>⚠ contactNumber must include country code</li>
          </ul>
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur">
        <h2 className="text-xl font-bold text-white mb-4">Common Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pattern 1 */}
          <div>
            <h4 className="text-slate-300 font-semibold mb-2 text-sm">URL Construction</h4>
            <div className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
              <code className="text-xs text-slate-300 font-mono block break-words">
                https://clubwiz.in/contact-form/contact/[endpoint]
              </code>
            </div>
          </div>

          {/* Pattern 2 */}
          <div>
            <h4 className="text-slate-300 font-semibold mb-2 text-sm">Token Format</h4>
            <div className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
              <code className="text-xs text-slate-300 font-mono block break-words">
                Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
              </code>
            </div>
          </div>

          {/* Pattern 3 */}
          <div>
            <h4 className="text-slate-300 font-semibold mb-2 text-sm">Request Example (curl)</h4>
            <div className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
              <code className="text-xs text-slate-300 font-mono block break-words whitespace-pre-wrap">
                {`-H "Authorization: Bearer TOKEN" \
-H "Content-Type: application/json"`}
              </code>
            </div>
          </div>

          {/* Pattern 4 */}
          <div>
            <h4 className="text-slate-300 font-semibold mb-2 text-sm">Ticket Type Check</h4>
            <div className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
              <code className="text-xs text-slate-300 font-mono block break-words">
                {`if (ticket.type === "FEEDBACK") {
  // Handle feedback fields
} else if (ticket.type === "BUSINESS") {
  // Handle business fields
}`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
