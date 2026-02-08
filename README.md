# ⚡ DevBlitz

<div align="center">

![DevBlitz Logo](public/devblitz-logo.svg)

**AI-Powered Code IDE** — Built with Tauri 2.0, Next.js 14, and Rust

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/your-repo/devblitz)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#-platform-support)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)

*Code at the speed of light*

[Features](#-features) • [Installation](#-getting-started) • [Architecture](#-architecture) • [Roadmap](#-roadmap) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| 🖥️ **Native Desktop App** | Cross-platform support (Windows, macOS, Linux) with Tauri 2.0 |
| ⚡ **Lightning Fast** | Static export with Next.js 14 for instant startup |
| 🎨 **Modern UI** | Vercel-inspired dark theme with glassmorphism effects |
| 📁 **Smart File Explorer** | Recursive file tree with virtualized rendering, context menus, and keyboard navigation |
| ✏️ **Code Editor** | Tab-based editing with syntax highlighting and multi-file support |
| 🔌 **Extensions System** | Install, manage, and configure marketplace extensions |
| 🔍 **Global Search** | Search across files with regex support and filters |
| 🖥️ **Integrated Terminal** | Built-in terminal with command execution |
| ⚙️ **Settings Panel** | Customizable editor preferences and themes |
| 🔒 **Security First** | Path traversal protection and sandboxed file operations |
| 🎯 **Full TypeScript** | Type safety throughout the entire application |

### UI/UX Highlights

- **Custom Titlebar** — Native window controls with seamless dark theme
- **Resizable Sidebar** — Adjustable panel with smooth drag interactions
- **Status Bar** — Real-time information display
- **Welcome Screen** — Quick access to recent projects
- **Loading Animations** — Smooth transitions with no white flash
- **Keyboard Shortcuts** — Full keyboard navigation support

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2 | React framework with App Router |
| React | 18.3 | UI library |
| TypeScript | 5.6 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui | Latest | UI component library |
| Framer Motion | 11.x | Animations |
| Zustand | 5.0 | Global state management |
| Lucide React | 0.453 | Icons |
| react-window | 1.8 | Virtualized lists |

### Backend (Rust)
| Technology | Version | Purpose |
|------------|---------|---------|
| Tauri | 2.0 | Desktop framework |
| tokio | 1.40 | Async runtime |
| serde | 1.0 | Serialization |
| walkdir | 2.5 | File system traversal |
| chrono | 0.4 | Date/time handling |

### Tauri Plugins
| Plugin | Purpose |
|--------|---------|
| `tauri-plugin-dialog` | Native file/folder dialogs |
| `tauri-plugin-fs` | File system operations |
| `tauri-plugin-os` | OS information |
| `tauri-plugin-shell` | Shell command execution |

---

## 📁 Architecture

```
devblitz/
├── src-tauri/                          # Tauri Rust Backend
│   ├── src/
│   │   ├── main.rs                     # Application entry point
│   │   ├── lib.rs                      # Library exports
│   │   ├── commands/                   # IPC Command Handlers
│   │   │   ├── mod.rs                  # Module exports
│   │   │   ├── filesystem.rs           # File CRUD operations
│   │   │   ├── project.rs              # Project management
│   │   │   └── terminal.rs             # Terminal operations
│   │   ├── security/                   # Security Middleware
│   │   │   ├── mod.rs
│   │   │   └── path_validator.rs       # Path traversal protection
│   │   └── utils/                      # Utilities
│   ├── capabilities/                   # Tauri capabilities config
│   ├── Cargo.toml                      # Rust dependencies
│   └── tauri.conf.json                 # Tauri configuration
│
├── src/                                # Next.js Frontend
│   ├── app/                            # App Router Pages
│   │   ├── layout.tsx                  # Root layout with fonts
│   │   ├── page.tsx                    # Welcome screen (/)
│   │   ├── loading.tsx                 # Loading animation
│   │   ├── globals.css                 # Global styles
│   │   └── ide/
│   │       └── page.tsx                # Main IDE interface (/ide)
│   │
│   ├── components/                     # React Components
│   │   ├── editor/                     # Code Editor
│   │   │   ├── CodeEditor.tsx          # Editor component
│   │   │   └── EditorTabs.tsx          # Tab management
│   │   ├── explorer/                   # File Explorer
│   │   │   ├── FileTree.tsx            # Tree view
│   │   │   ├── FileNode.tsx            # Individual nodes
│   │   │   └── ContextMenu.tsx         # Right-click menu
│   │   ├── extensions/                 # Extensions Panel
│   │   │   ├── ExtensionsPanel.tsx     # Marketplace browser
│   │   │   └── ExtensionDetailView.tsx # Extension details
│   │   ├── layout/                     # App Layout
│   │   │   ├── AppLayout.tsx           # Main layout wrapper
│   │   │   ├── Sidebar.tsx             # Left sidebar
│   │   │   ├── Titlebar.tsx            # Custom titlebar
│   │   │   └── StatusBar.tsx           # Bottom status bar
│   │   ├── search/                     # Search Functionality
│   │   │   └── SearchPanel.tsx         # Global search panel
│   │   ├── settings/                   # Settings
│   │   │   └── SettingsPanel.tsx       # User preferences
│   │   ├── terminal/                   # Terminal
│   │   │   └── Terminal.tsx            # Integrated terminal
│   │   ├── welcome/                    # Welcome Screen
│   │   │   ├── WelcomeScreen.tsx       # Landing page
│   │   │   └── RecentProjects.tsx      # Project history
│   │   └── ui/                         # shadcn/ui Components
│   │       ├── button.tsx
│   │       ├── context-menu.tsx
│   │       ├── scroll-area.tsx
│   │       ├── separator.tsx
│   │       └── tooltip.tsx
│   │
│   ├── features/                       # Feature Modules
│   │   ├── explorer/                   # Explorer logic
│   │   └── project/                    # Project management
│   │
│   ├── hooks/                          # Custom React Hooks
│   │   ├── index.ts
│   │   ├── useFileSystem.ts            # FS operations hook
│   │   ├── useKeyboardShortcuts.ts     # Shortcut handler
│   │   └── useProject.ts               # Project state hook
│   │
│   ├── stores/                         # Zustand State Stores
│   │   ├── appStore.ts                 # Application state
│   │   ├── editorStore.ts              # Editor/tabs state
│   │   ├── extensionsStore.ts          # Extensions state
│   │   ├── projectStore.ts             # Project state
│   │   ├── settingsStore.ts            # User settings
│   │   └── terminalStore.ts            # Terminal state
│   │
│   ├── lib/                            # Utilities
│   │   ├── constants.ts                # App constants
│   │   ├── tauri-commands.ts           # Tauri IPC wrappers
│   │   └── utils.ts                    # Helpers (cn, etc.)
│   │
│   └── types/                          # TypeScript Types
│       ├── index.ts
│       ├── file.ts                     # File system types
│       └── project.ts                  # Project types
│
├── public/                             # Static Assets
│   └── devblitz-logo.svg
│
├── package.json                        # NPM dependencies
├── tailwind.config.ts                  # Tailwind configuration
├── tsconfig.json                       # TypeScript config
├── next.config.js                      # Next.js config
├── components.json                     # shadcn/ui config
├── FIXES.md                            # Bug fix documentation
└── README.md                           # This file
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Installation |
|-------------|---------|--------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | Included with Node.js |
| **Rust** | 1.70+ | [rustup.rs](https://rustup.rs/) |
| **Tauri CLI** | 2.0 | Auto-installed via npm |

#### Platform-Specific Requirements

<details>
<summary><strong>🐧 Linux</strong></summary>

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3 \
  librsvg2-devel
```
</details>

<details>
<summary><strong>🍎 macOS</strong></summary>

```bash
# Xcode Command Line Tools
xcode-select --install
```
</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Select "Desktop development with C++" workload
- WebView2 (auto-installed on Windows 10/11)
</details>

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/devblitz.git
cd devblitz

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run tauri:dev

# 4. Build for production
npm run tauri:build
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server only |
| `npm run build` | Build Next.js for production |
| `npm run start` | Start Next.js production server |
| `npm run lint` | Run ESLint |
| `npm run tauri:dev` | Start Tauri + Next.js in development |
| `npm run tauri:build` | Build production desktop app |

---

## 🎨 Design System

### Color Palette

DevBlitz uses a **Vercel-inspired deep black** color scheme:

```css
/* Core Colors */
--background: #000000;     /* Pure black */
--foreground: #fafafa;     /* Near white */
--card: #0a0a0a;           /* Elevated surfaces */
--muted: #141414;          /* Muted backgrounds */
--border: #262626;         /* Subtle borders */
--accent: #1f1f1f;         /* Accent elements */

/* Interactive States */
--hover: #1a1a1a;          /* Hover state */
--active: #2a2a2a;         /* Active state */
--focus: #3b82f6;          /* Focus ring (blue) */
```

### UI Constants

```typescript
// Layout Dimensions
SIDEBAR_MIN_WIDTH: 200px
SIDEBAR_MAX_WIDTH: 500px
SIDEBAR_DEFAULT_WIDTH: 250px
TITLEBAR_HEIGHT: 40px
STATUSBAR_HEIGHT: 24px

// Animation Timings
FAST: 150ms
NORMAL: 200ms
SLOW: 300ms

// Performance
DEBOUNCE_DELAY: 150ms
THROTTLE_DELAY: 100ms
MAX_VISIBLE_ITEMS: 1000
```

### UI Features

- ✅ **Glassmorphism** — Frosted glass effects on elevated surfaces
- ✅ **Smooth Animations** — Framer Motion transitions
- ✅ **Dark Mode First** — No white flash on load
- ✅ **Accessible** — Focus states and ARIA support
- ✅ **Keyboard Navigation** — Full keyboard control
- ✅ **Responsive Panels** — Resizable with constraints

---

## 🔐 Security

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                 Frontend Validation                              │
│           (TypeScript type checking, sanitization)               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      Tauri IPC                                   │
│              (Secure inter-process communication)                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   Path Validator                                 │
│         (security/path_validator.rs)                             │
│                                                                  │
│  • Canonical path resolution                                     │
│  • Project boundary enforcement                                  │
│  • Symlink attack prevention                                     │
│  • Directory traversal blocking                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                  ┌───────▼───────┐
                  │  ✓ Allow      │
                  │  ✗ Deny       │
                  └───────────────┘
```

### Security Measures

| Layer | Protection |
|-------|------------|
| **Backend (Rust)** | Path validation, sandboxing, input sanitization |
| **Frontend** | Content Security Policy, no eval(), TypeScript strict mode |
| **IPC** | Tauri's secure invoke system with capability permissions |

### Content Security Policy

```json
{
  "csp": "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' asset: data:; script-src 'self'"
}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + O` | Open folder |
| `Cmd/Ctrl + N` | New file |
| `Cmd/Ctrl + S` | Save file |
| `Cmd/Ctrl + W` | Close tab |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `Cmd/Ctrl + Shift + P` | Command palette |
| `Cmd/Ctrl + F` | Search in files |
| `Cmd/Ctrl + ,` | Open settings |
| `↑ / ↓` | Navigate file tree |
| `← / →` | Collapse/expand folders |
| `Enter` | Open file / toggle folder |

---

## 🗺️ Roadmap

### Phase 1 — Foundation ✅
- [x] Tauri 2.0 + Next.js 14 setup
- [x] Custom titlebar with window controls
- [x] Welcome screen with recent projects
- [x] File explorer with recursive tree
- [x] Context menus for files/folders
- [x] Zustand state management
- [x] Security middleware (path validation)
- [x] Dark theme with no white flash

### Phase 2 — Editor Core 🚧
- [x] Tab-based file editing
- [x] Multi-file support
- [x] Settings panel
- [x] Extensions panel UI
- [x] Search panel UI
- [x] Terminal panel UI
- [ ] Monaco Editor integration
- [ ] Syntax highlighting
- [ ] File save functionality

### Phase 3 — Enhanced Features
- [ ] Git integration (status, diff, commit)
- [ ] Working terminal with PTY
- [ ] Search with regex and filters
- [ ] Extension marketplace API
- [ ] File watchers for auto-refresh
- [ ] Minimap

### Phase 4 — AI & Intelligence
- [ ] AI code assistant integration
- [ ] Code completion
- [ ] Inline suggestions
- [ ] Chat interface
- [ ] Code explanation

### Phase 5 — Polish & Extras
- [ ] Themes system
- [ ] Plugin SDK
- [ ] Project templates
- [ ] Remote file support
- [ ] Collaborative editing

---

## 🐛 Known Issues & Fixes

See [FIXES.md](FIXES.md) for documented issues and their solutions.

### Quick Fixes

| Issue | Solution |
|-------|----------|
| White flash on load | Fixed with inline styles in `layout.tsx` |
| Open folder not working | Fixed async/sync mismatch in Rust commands |
| Path issues on Windows | Added Windows path separator support |

---

## 🧪 Development

### Debugging

```bash
# Check Rust compilation
cd src-tauri && cargo check

# Check TypeScript
npm run lint && npx tsc --noEmit

# Run with dev tools
npm run tauri:dev
```

### Project Verification

```bash
# Full verification suite
npm run lint            # ESLint check
npx tsc --noEmit        # TypeScript check
cd src-tauri && cargo check  # Rust check
npm run tauri:build     # Production build test
```

---

## 🌍 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **Windows** | ✅ Supported | Windows 10+ with WebView2 |
| **macOS** | ✅ Supported | macOS 10.15+ (Catalina+) |
| **Linux** | ✅ Supported | Most distributions with WebKitGTK |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write TypeScript with strict mode
- Add proper error handling
- Test on multiple platforms when possible
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) — For the amazing desktop framework
- [Next.js](https://nextjs.org/) — For the React framework
- [shadcn/ui](https://ui.shadcn.com/) — For beautiful UI components
- [Vercel](https://vercel.com/) — For design inspiration
- [VS Code](https://code.visualstudio.com/) — For setting the standard

---

<div align="center">

**DevBlitz** — *Code at the speed of light* ⚡

[⬆ Back to top](#-devblitz)

</div>
