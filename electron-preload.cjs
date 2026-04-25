const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  playSound: (type) => ipcRenderer.send("play-sound", type),
  notify: (title, body) => ipcRenderer.send("notify", { title, body }),
});
