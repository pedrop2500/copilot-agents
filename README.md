# Copilot Agents

Repositorio de agentes para GitHub Copilot Chat. La extensión VSIX descarga automáticamente los agentes desde este repo al arrancar VS Code.

## Instalación de la extensión

1. Ve a la sección [**Releases**](../../releases) del repositorio
2. Descarga el archivo `.vsix` de la release más reciente
3. En VS Code: **Extensions** → `···` → **Install from VSIX…**
4. Selecciona el archivo descargado y recarga VS Code

## Uso

Abre Copilot Chat (`Ctrl+Alt+I` / `Cmd+Alt+I`) y escribe:

```
@copilot-agents /help
```

Para usar un agente específico:

```
@copilot-agents /code-reviewer revisa esta función para detectar bugs
@copilot-agents /docs-writer genera JSDoc para esta clase
```

## Agentes disponibles

| ID | Nombre | Descripción |
|----|--------|-------------|
| `code-reviewer` | Code Reviewer | Revisa código en busca de bugs, performance y seguridad |
| `docs-writer` | Docs Writer | Genera documentación en Markdown o JSDoc |

## Añadir o modificar agentes

1. Crea una carpeta en `agents/TU-AGENTE/`
2. Añade un archivo `instructions.md` con el system prompt del agente
3. Registra el agente en [`agents/index.json`](agents/index.json)
4. **Incrementa el campo `version`** en `index.json` — esto fuerza la actualización en todos los clientes

> La extensión compara el campo `version` de `index.json` con su caché local. Si cambia, descarga las instrucciones nuevas automáticamente al arrancar VS Code.

### Ejemplo de entrada en `index.json`

```json
{
  "id": "mi-agente",
  "name": "Mi Agente",
  "description": "Descripción corta de lo que hace",
  "instructionsFile": "agents/mi-agente/instructions.md",
  "icon": "sparkle"
}
```

Los iconos disponibles son cualquier [ThemeIcon de VS Code](https://code.visualstudio.com/api/references/icons-in-labels).

## Configuración de la extensión

En VS Code Settings (`Ctrl+,`), busca `copilotAgents`:

| Setting | Descripción | Default |
|---------|-------------|---------|
| `copilotAgents.repoRawUrl` | URL base del raw content de tu repo | `https://raw.githubusercontent.com/OWNER/REPO/main` |

Cambia `OWNER/REPO` por tu usuario y nombre de repositorio.

## Publicar una nueva release

```bash
git tag v1.2.3
git push origin v1.2.3
```

El workflow de GitHub Actions construye el `.vsix` y crea la release automáticamente.

## Estructura del repositorio

```
.github/
  workflows/
    release.yml       # Construye y publica el VSIX al crear un tag v*
    validate.yml      # Valida agents/index.json en cada PR
agents/
  index.json          # Índice de agentes (la extensión lo descarga al arrancar)
  code-reviewer/
    instructions.md
  docs-writer/
    instructions.md
extension/
  src/
    extension.ts      # Punto de entrada de la extensión
    agentManager.ts   # Descarga y cachea agentes desde GitHub
    types.ts
  package.json
  webpack.config.js
  tsconfig.json
```
