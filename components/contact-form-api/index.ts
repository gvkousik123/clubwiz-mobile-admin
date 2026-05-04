// Main Components
export { ApiEndpoints } from './api-endpoints';
export { QuickReference } from './quick-reference';
export { ApiTester } from './api-tester';

// Types
export interface Endpoint {
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

export interface ApiRequest {
  method: 'GET' | 'POST';
  endpoint: string;
  body?: Record<string, any>;
}

export interface ApiResponse {
  status: number;
  data: any;
  error?: string;
}
