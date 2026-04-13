# OpenCode - Minimal Full-Stack Code Editor

A fast, distraction-free online code editor inspired by DartPad. It supports Python, JavaScript, TypeScript, Dart, Java, C, and Rust. Features a split-pane layout, Night Owl theme, Vim mode (by default), and secure backend execution utilizing Docker.

## Features
- **Multi-language Support**: Python, JS, TS, Dart, Java, C, Rust
- **Distraction-Free Environment**: No code-completion, no italics/bold styling, no auto-brackets, and hidden scrollbars
- **Secure Code Execution**: Runs isolated code in a single universal Ubuntu-based Docker container
- **Persistent File System**: Creates folders, files, and nested structures saved directly to your host machine's `./workspace`
- **Interactive Terminal**: An integrated terminal that has internet access inside the container (e.g., to run `npm install`, `pip install`)
- **Syntax Highlighting**: Industry-standard syntax highlighting powered by VS Code's TextMate engine (Shiki)

---

## Prerequisites
Before running the project, you must have the following installed:
1. [Node.js](https://nodejs.org/en/download/) (v18+)
2. [Docker](https://docs.docker.com/engine/install/) (Must be running on your machine)

---

## 🚀 Quick Start (Automated Script)

For first-time users, the easiest way to start the project is by running the automated setup script. 
It will build the required Docker image, install all NPM dependencies, and start the Next.js development server automatically.

```bash
# Make the script executable (Mac/Linux)
chmod +x setup.sh

# Run the script
./setup.sh
```

---

## 🛠️ Manual Installation (Without Script)

If you prefer to set up the project manually or the automated script fails, follow these steps:

### 1. Build the Docker Image
The application requires a secure execution environment to run your code. You must build this image locally.

```bash
docker build -t opencode-env .
```

### 2. Install NPM Dependencies
Install the required packages. *(Note: `--legacy-peer-deps` is required due to upstream React 19 / Monaco version conflicts)*

```bash
npm install --legacy-peer-deps
```

### 3. Start the Development Server
Once the Docker image is built and the packages are installed, start Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the editor.