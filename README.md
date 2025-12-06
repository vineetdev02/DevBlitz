# ⚡ DevBlitz

**AI-Powered Code IDE** built with Tauri 2.0, Next.js 14, and React 18.

![DevBlitz Banner](public/devblitz-logo.svg)

## ✨ Features

- **🖥️ Native Desktop App** - Built with Tauri 2.0 for cross-platform support (Windows, macOS, Linux)
- **⚡ Lightning Fast** - Next.js 14 with static export for instant startup
- **🎨 Modern UI** - Vercel-inspired dark theme with glassmorphism effects
- **📁 File Explorer** - Recursive file tree with keyboard navigation
- **🔒 Secure** - Path traversal protection and sandboxed file operations
- **🎯 TypeScript** - Full type safety throughout the application
- **📦 Lightweight** - Zustand for minimal state management

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Desktop Framework | Tauri 2.0 |
| Frontend | Next.js 14 (App Router) |
| UI Library | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Components | shadcn/ui |
| Icons | Lucide React |
| Animations | Framer Motion |
| State Management | Zustand |
| Backend | Rust |

## 📁 Project Structure

```
devblitz/
├── src-tauri/                    # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   ├── commands/            # Tauri commands
│   │   │   ├── filesystem.rs    # File operations
│   │   │   └── project.rs       # Project management
│   │   ├── security/            # Security middleware
│   │   │   └── path_validator.rs
│   │   └── utils/
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                         # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Welcome screen
│   │   ├── globals.css          # Global styles
│   │   └── ide/
│   │       └── page.tsx         # IDE interface
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── layout/              # App layout components
│   │   ├── welcome/             # Welcome screen
│   │   └── explorer/            # File explorer
│   │
│   ├── features/                # Feature modules
│   │   ├── project/
│   │   └── explorer/
│   │
│   ├── lib/                     # Utilities
│   │   ├── tauri-commands.ts    # Tauri command wrappers
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── hooks/                   # Custom hooks
│   ├── stores/                  # Zustand stores
│   └── types/                   # TypeScript types
│
├── public/                      # Static assets
├── package.json
├── tailwind.config.ts
└── next.config.js
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (latest stable) - [Install Rust](https://rustup.rs/)
- **Tauri CLI** - Will be installed with npm dependencies

### Installation

1. **Clone the repository**
   ```bash
   cd devblitz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri:dev
   ```

4. **Build for production**
   ```bash
   npm run tauri:build
   ```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build Next.js for production |
| `npm run tauri:dev` | Start Tauri in development |
| `npm run tauri:build` | Build Tauri for production |
| `npm run lint` | Run ESLint |

## 🎨 Design System

DevBlitz uses a **Vercel-inspired deep black** color scheme:

```css
--background: #000000;     /* Pure black */
--foreground: #fafafa;     /* Near white */
--card: #0a0a0a;           /* Elevated black */
--muted: #141414;          /* Muted backgrounds */
--border: #262626;         /* Subtle borders */
--accent: #1f1f1f;         /* Accent elements */
```

### UI Features

- **Glass morphism** effects on elevated surfaces
- **Smooth animations** with Framer Motion
- **Accessible** focus states and keyboard navigation
- **Consistent spacing** using 4px base unit

## 🔐 Security

DevBlitz implements multiple security measures:

### Backend (Rust)
- **Path validation** - Prevents directory traversal attacks
- **Sandboxing** - File access restricted to user-selected directories
- **Input sanitization** - All inputs validated before processing

### Frontend
- **Strict CSP** - Content Security Policy configured in Tauri
- **No eval()** - Dynamic code execution disabled
- **Type safety** - TypeScript strict mode enabled

## 🛡️ Security Architecture

```
User Request → Frontend Validation → Tauri IPC → Path Validator → File System
                                                      ↓
                                              Canonical Path Check
                                                      ↓
                                              Within Project Boundary?
                                                      ↓
                                              ✓ Allow / ✗ Deny
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + O` | Open folder |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `Cmd/Ctrl + N` | New file (coming soon) |
| `↑ / ↓` | Navigate file tree |
| `← / →` | Collapse/expand folders |
| `Enter` | Toggle folder / Open file |

## 📝 Roadmap

### Phase 1 (Current) ✅
- [x] Project structure setup
- [x] Welcome screen
- [x] File tree explorer
- [x] Custom titlebar
- [x] Zustand state management

### Phase 2 (Next)
- [ ] Monaco Editor integration
- [ ] File opening/editing
- [ ] Syntax highlighting
- [ ] Tab management

### Phase 3 (Future)
- [ ] Terminal integration
- [ ] Git integration
- [ ] AI assistant features
- [ ] Extensions system

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>DevBlitz</strong> - Code at the speed of light ⚡
</p>

