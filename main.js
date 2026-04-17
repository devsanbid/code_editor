const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");

let nextServer;
let mainWindow;

function checkServer() {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.once("connect", () => {
      client.destroy();
      resolve(true);
    });
    client.once("error", () => {
      client.destroy();
      resolve(false);
    });
    client.connect(3000, "127.0.0.1");
  });
}

async function waitForServer() {
  while (!(await checkServer())) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    autoHideMenuBar: true,
    title: "Opencode Editor",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:3000");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const isRunning = await checkServer();

  if (!isRunning) {
    // Start Next.js production server locally
    nextServer = spawn("npm", ["run", "start"], {
      cwd: app.getAppPath(),
      shell: true,
      stdio: "inherit",
      detached: process.platform !== "win32", // Create a new process group to cleanly kill later
    });
  }

  await waitForServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
  // Cleanly kill the Next.js process tree
  if (nextServer) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", nextServer.pid, "/f", "/t"]);
    } else {
      try {
        process.kill(-nextServer.pid);
      } catch (e) {
        console.error("Failed to kill server process:", e);
      }
    }
  }
});
