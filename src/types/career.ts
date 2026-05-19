export type JobStatus = "pending" | "running" | "done" | "error";

export interface CareerConfig {
  contact?: { phone?: string; location?: string; twitter?: string };
  target_roles?: {
    primary?: string[];
    archetypes?: Array<{ name: string; level: string; fit: string }>;
  };
  narrative?: { headline?: string; exit_story?: string; superpowers?: string[] };
  compensation?: {
    target_range?: string;
    currency?: string;
    minimum?: string;
    location_flexibility?: string;
  };
  location?: { country?: string; city?: string; timezone?: string; visa_status?: string };
  cv_output_format?: string;
}

export interface StatusResponse {
  status?: string;
  log?: string[];
  pdfPath?: string;
  error?: string;
}

export interface EvaluateResponse {
  jobId?: string;
  error?: string;
}

export interface PublishResponse {
  ok?: boolean;
  publishedAt?: string;
  error?: string;
}

export interface SyncResponse {
  ok?: boolean;
  profileFields?: string[];
  error?: string;
}
