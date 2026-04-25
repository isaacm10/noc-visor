const { app, BrowserWindow, Tray, Menu, nativeImage } = require("electron");
const path = require("path");

let win = null;
let tray = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "NOC Visor",
    icon: path.join(__dirname, "public", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "electron-preload.cjs"),
      webSecurity: false,
    },
    backgroundColor: "#080B12",
    show: false,
  });

  win.loadFile(path.join(__dirname, "dist", "index.html"));
  win.once("ready-to-show", () => win.show());

  win.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "public", "icon.ico"));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);

  const menu = Menu.buildFromTemplate([
    { label: "📡 Abrir NOC Visor", click: () => { win.show(); win.focus(); } },
    { type: "separator" },
    { label: "🔄 Actualizar App", click: () => { win.webContents.reload(); } },
    { type: "separator" },
    { label: "❌ Cerrar", click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setToolTip("NOC Visor — DWDM Monitoring");
  tray.setContextMenu(menu);
  tray.on("double-click", () => { win.show(); win.focus(); });
}

function setAutoStart() {
  app.setLoginItemSettings({
    openAtLogin: true,
    name: "NOC Visor",
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  setAutoStart();
});

app.on("window-all-closed", (e) => e.preventDefault());
app.on("before-quit", () => { app.isQuitting = true; });
