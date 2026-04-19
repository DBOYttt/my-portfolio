export interface AgentRunResult {
  title: string;
  summary: string;
  sources: string[];
  rawData: unknown;
  /** Optional config updates the CLI runner should persist back to the Agent row after a successful run. */
  _updatedConfig?: Record<string, unknown>;
}
