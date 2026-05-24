import * as vscode from 'vscode';
import { AgentManager } from './agentManager';
import { LoadedAgent } from './types';

const PARTICIPANT_ID = 'copilot-agents.hub';

export async function activate(context: vscode.ExtensionContext) {
  const manager = new AgentManager(context);
  let agents: LoadedAgent[] = [];

  const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, async (
    request: vscode.ChatRequest,
    _ctx: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ) => {
    if (!agents.length) {
      stream.markdown('⚠️ Los agentes aún no están cargados. Usa el comando **Copilot Agents: Actualizar** e inténtalo de nuevo.');
      return;
    }

    const command = request.command;

    if (!command || command === 'help') {
      stream.markdown('## Agentes disponibles\n\n');
      for (const a of agents) {
        stream.markdown(`- **\`/${a.id}\`** — ${a.description}\n`);
      }
      stream.markdown('\n**Uso:** `@copilot-agents /ID-del-agente tu pregunta`');
      return;
    }

    const agent = agents.find(a => a.id === command);
    if (!agent) {
      stream.markdown(`❌ Agente \`/${command}\` no encontrado.\n\nUsa \`@copilot-agents /help\` para ver los agentes disponibles.`);
      return;
    }

    if (!request.prompt.trim()) {
      stream.markdown(`Estás usando **${agent.name}**. ¿Cuál es tu pregunta o qué código quieres que procese?`);
      return;
    }

    const models = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });
    if (!models.length) {
      stream.markdown('❌ No se encontró ningún modelo de Copilot disponible. Asegúrate de tener GitHub Copilot instalado y activo.');
      return;
    }

    const [model] = models;
    const messages = [
      vscode.LanguageModelChatMessage.User(`${agent.instructions}\n\n---\n\n${request.prompt}`)
    ];

    try {
      const response = await model.sendRequest(messages, {}, token);
      for await (const chunk of response.text) {
        stream.markdown(chunk);
      }
    } catch (err) {
      if (err instanceof vscode.LanguageModelError) {
        stream.markdown(`❌ Error del modelo: ${err.message}`);
      } else {
        throw err;
      }
    }
  });

  participant.iconPath = new vscode.ThemeIcon('robot');

  async function loadAgents(force = false) {
    try {
      agents = await manager.fetchAgents(force);
      // Rebuild slash commands metadata
      participant.followupProvider = {
        provideFollowups(_result, _ctx, _token) {
          return agents.map(a => ({
            prompt: `/${a.id} `,
            label: a.name,
            command: a.id
          }));
        }
      };
      return agents.length;
    } catch (err) {
      vscode.window.showWarningMessage(`Copilot Agents: ${(err as Error).message}`);
      return 0;
    }
  }

  context.subscriptions.push(
    participant,
    vscode.commands.registerCommand('copilotAgents.refresh', async () => {
      const count = await loadAgents(true);
      if (count > 0) {
        vscode.window.showInformationMessage(`Copilot Agents: ${count} agente(s) actualizados correctamente.`);
      }
    })
  );

  await loadAgents();
}

export function deactivate() {}
