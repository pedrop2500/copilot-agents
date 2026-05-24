import * as vscode from 'vscode';
import { AgentsIndex, LoadedAgent } from './types';

const CACHE_KEY = 'agentsData';
const CACHE_VERSION_KEY = 'agentsVersion';

export class AgentManager {
  constructor(private readonly context: vscode.ExtensionContext) {}

  private get rawBaseUrl(): string {
    const config = vscode.workspace.getConfiguration('copilotAgents');
    return config.get<string>('repoRawUrl', 'https://raw.githubusercontent.com/pedrop2500/copilot-agents/main');
  }

  async fetchAgents(forceRefresh = false): Promise<LoadedAgent[]> {
    try {
      const index = await this.get<AgentsIndex>(`${this.rawBaseUrl}/agents/index.json`);
      const cachedVersion = this.context.globalState.get<string>(CACHE_VERSION_KEY);

      if (!forceRefresh && cachedVersion === index.version) {
        const cached = this.context.globalState.get<LoadedAgent[]>(CACHE_KEY);
        if (cached?.length) {
          return cached;
        }
      }

      const agents = await Promise.all(
        index.agents.map(async (def) => {
          const instructions = await this.getText(`${this.rawBaseUrl}/${def.instructionsFile}`);
          return { ...def, instructions };
        })
      );

      await this.context.globalState.update(CACHE_KEY, agents);
      await this.context.globalState.update(CACHE_VERSION_KEY, index.version);

      return agents;
    } catch {
      const cached = this.context.globalState.get<LoadedAgent[]>(CACHE_KEY);
      if (cached?.length) {
        return cached;
      }
      throw new Error('No se pudo conectar con GitHub y no hay caché local disponible.');
    }
  }

  private async get<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al obtener ${url}`);
    }
    return res.json() as Promise<T>;
  }

  private async getText(url: string): Promise<string> {
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al obtener ${url}`);
    }
    return res.text();
  }
}
