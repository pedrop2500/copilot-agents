export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  instructionsFile: string;
  icon?: string;
}

export interface AgentsIndex {
  version: string;
  updatedAt: string;
  agents: AgentDefinition[];
}

export interface LoadedAgent extends AgentDefinition {
  instructions: string;
}
