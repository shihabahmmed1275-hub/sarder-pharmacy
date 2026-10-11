const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function startBackend() {
  // backend/server.js ফাইলটি চাইল্ড প্রসেসে রান করা
  const serverPath = path.join(__dirname, 'backend', 'server.js');
  serverProcess = fork(serverPath);

  serverProcess.on('error', (err) => {
    console.error('ব্যাকএন্ড ব্যাকগ্রাউন্ড প্রসেস এরর:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // public/index.html ফাইল লোড করা
  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

  // প্রয়োজনে ডিবাগিংয়ের জন্য ডেভেলপমেন্ট টুলস চালু রাখতে পারেন
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  // ব্যাকএন্ড স্টার্ট এবং উইন্ডো ক্রিয়েট
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// অ্যাপ বন্ধ হয়ে গেলে ব্যাকএন্ড সার্ভার প্রসেস বন্ধ করে দেওয়া
app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});