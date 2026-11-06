export interface Message {
  id: string;
  sender: string;
  role: 'user' | 'agent' | 'system' | 'engineer';
  content: string;
  timestamp: string;
}

export interface ExecutionResult {
  success: boolean;
  steps_executed: string[];
  simulated_output: string[];
  execution_time_ms: number;
  notes: string;
}

export interface DiagnosticInsights {
  matched_pattern_title: string;
  matched_ticket_id?: string | null;
  confidence_percent: number;
  detected_signature: string;
  root_cause_analysis: string;
  recommended_solution: string;
  prevention_tip?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  client_name: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'L1' | 'L2';
  status: 'RESOLVED_AUTONOMOUSLY' | 'RESOLVED_HUMAN_VERIFIED' | 'PENDING_HUMAN_REVIEW' | 'IN_PROGRESS' | string;
  error_signature: string;
  resolution_steps: string;
  confidence_score: number;
  resolution_type: 'AUTONOMOUS' | 'HUMAN_IN_THE_LOOP' | null;
  execution_result: ExecutionResult | null;
  messages: Message[];
  diagnostic_insights?: DiagnosticInsights | null;
  screenshot_preview?: string | null;
  company_id: string;
  created_at: string;
  resolved_at: string | null;
  tags: string[];
}

export interface MemoryStats {
  bank_id: string;
  is_cloud_connected: boolean;
  total_records: number;
  autonomous_resolutions: number;
  human_verified_resolutions: number;
  confidence_threshold: number;
  last_updated: string;
}

export interface UserSession {
  email: string;
  name: string;
  role: string;
  company_id: string;
  company_name: string;
}
