# repo-dashboard

**[English](README.md)** | **[中文](README.zh-CN.md)** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)** | **[Español](README.es.md)**

Panel de estado universal para repositorios — plugin de línea de estado para [Claude Code](https://claude.ai/code).

Detecta automáticamente la estructura Git de tu proyecto (repositorio único o múltiples sub-repositorios) y muestra un panel de estado enriquecido y configurable directamente en tu sesión de Claude Code.

## Vista previa

```
Opus │ ████░░░░░░ 35% │ Branch:master │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

Modo multi-repositorio (detección automática):
```
Opus │ ████░░░░░░ 35% │ AClient │ Branch:master │ ~0 +0 -0 │ ↑0 ↓0
Source │ Branch:dev │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

## Instalación

```bash
/plugin install github:keywei/repo-dashboard
```

Luego ejecuta el comando de configuración:
```
/repo-dashboard:setup
```

## Módulos de funcionalidad

| Módulo | Por defecto | Descripción |
|--------|-------------|-------------|
| `context` | ✅ activo | Nombre del modelo + barra de progreso del contexto |
| `git` | ✅ activo | Rama, cambios de archivos (modificados/añadidos/eliminados), ahead/behind |
| `stats` | ✅ activo | Hora actual, commits de hoy, último mensaje de commit |
| `subRepos` | ✅ activo | Detección automática y visualización de sub-repositorios |

### Detección automática

- Si el directorio de trabajo es un repositorio git → modo repositorio único
- Si los subdirectorios contienen `.git` → modo multi-repositorio (ej. monorepo, submódulos)
- Directorios sin git → degradación elegante (solo muestra modelo + contexto)

## Configuración

Personaliza la visualización con `/repo-dashboard:configure` o edita directamente el archivo de configuración:

**Ruta del archivo:** `~/.claude/plugins/repo-dashboard/config.json`

```json
{
  "modules": {
    "context": true,
    "git": true,
    "stats": true,
    "subRepos": true
  },
  "git": {
    "showFileStats": true,
    "showAheadBehind": true
  },
  "stats": {
    "showTime": true,
    "showTodayCommits": true,
    "showLastCommit": true,
    "lastCommitMaxLen": 40
  },
  "contextBar": {
    "length": 10
  }
}
```

Todos los campos son opcionales — los campos no configurados utilizan valores por defecto.

## Configuración manual

Si prefieres configuración manual, añade esto al `settings.json` de Claude Code:

```json
{
  "statusLine": {
    "enabled": true,
    "command": "node /path/to/repo-dashboard/dist/index.js"
  }
}
```

## Desarrollo

```bash
git clone https://github.com/keywei/repo-dashboard.git
cd repo-dashboard
npm install
npm run build

# Prueba local
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":35},"cwd":"."}' | node dist/index.js
```

## Cómo funciona

Es una herramienta CLI sin estado que sigue el protocolo de línea de estado de Claude Code:

1. Claude Code envía un contexto JSON por stdin (info del modelo, ventana de contexto, directorio de trabajo)
2. El plugin lee stdin, detecta repositorios git y consulta el estado de git
3. Renderiza texto con formato ANSI en stdout
4. Claude Code muestra la salida en el área de la línea de estado

Todos los comandos git se ejecutan con un timeout de 5 segundos para evitar bloqueos.

## Licencia

MIT
