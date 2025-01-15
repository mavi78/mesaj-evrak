import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { serviceManager } from './services/service-manager'
import { migrationManager } from './sql/migrations'
import database from './sql/connection'
import * as fs from 'fs/promises'
import * as path from 'path'
import { IpcManager } from './ipc-handlers/ipc-manager'

let mainWindow: BrowserWindow | null = null

function getLogPath(): string {
  if (is.dev) {
    // Development modunda proje dizininde oluştur
    return path.join(process.cwd(), 'logs')
  } else {
    // Production modunda executable'ın bulunduğu dizinde oluştur
    return path.join(path.dirname(process.execPath), 'logs')
  }
}

async function logStartupError(error: Error): Promise<void> {
  try {
    const logDir = getLogPath()
    await fs.mkdir(logDir, { recursive: true })

    const logFile = path.join(logDir, 'startup-error.log')
    const logEntry = `[${new Date().toISOString()}] ${error.name}: ${error.message}\n${error.stack}\n\n`

    await fs.appendFile(logFile, logEntry, 'utf8')
    console.error('Kritik başlatma hatası loglandı:', error)
  } catch (logError) {
    console.error('Hata loglanırken sorun oluştu:', logError)
  }
}

async function initializeApp(): Promise<boolean> {
  try {
    // Veritabanını başlat
    mainWindow?.webContents.send('app:onLoadingMessage', 'Veritabanı başlatılıyor...')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await database.init()
    console.log('Veritabanı başlatıldı')

    // Migration'ları çalıştır
    mainWindow?.webContents.send('app:onLoadingMessage', 'Migration işlemleri başlatılıyor...')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    migrationManager.init()
    await migrationManager.runMigrations()
    console.log('Migration işlemleri tamamlandı')

    // Servisleri başlat
    mainWindow?.webContents.send('app:onLoadingMessage', 'Servisler başlatılıyor...')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const manager = await serviceManager
    await manager.init(database.get())
    console.log('Servisler başlatıldı')

    // IPC handler'ları başlat
    mainWindow?.webContents.send('app:onLoadingMessage', "IPC handler'ları başlatılıyor...")
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const ipcManager = IpcManager.getInstance()
    await ipcManager.register()
    console.log("IPC handler'ları başlatıldı")

    // Uygulama
    await new Promise((resolve) => setTimeout(resolve, 1000))
    mainWindow?.webContents.send('app:onLoadingMessage', 'Uygulama açılıyor...')
    console.log('Uygulama başarıyla başlatıldı')
    return true
  } catch (error) {
    // Kritik başlatma hatalarını dosyaya yaz
    await logStartupError(error as Error)
    return false
  }
}

async function cleanupApp(): Promise<void> {
  try {
    // Servisleri temizle
    const manager = await serviceManager
    await manager.cleanup()

    // Veritabanını kapat
    database.close()

    console.log('Uygulama başarıyla temizlendi')
  } catch (error) {
    console.error('Uygulama temizlenirken hata oluştu:', error)
  }
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // ServiceManager'a main window'u ilet
  serviceManager.then((manager) => {
    manager.setMainWindow(mainWindow!)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.maximize()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  try {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Log dizinini ayarla
    const logPath = getLogPath()
    app.setAppLogsPath(logPath)

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Önce pencereyi aç
    createWindow()

    // Pencere hazır olana kadar bekle
    await new Promise<void>((resolve) => {
      const checkWindow = setInterval(() => {
        if (mainWindow?.webContents) {
          clearInterval(checkWindow)
          resolve()
        }
      }, 4000)
    })

    // Sonra uygulamayı başlat
    const initialized = await initializeApp()
    if (!initialized) {
      app.quit()
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
    mainWindow?.webContents.send('app:onLoadingComplete')

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error) {
    console.error('Uygulama başlatılırken hata oluştu:', error)
    await logStartupError(error as Error)
    app.quit()
  }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await cleanupApp()
    app.quit()
  }
})

// Uygulama tamamen kapanmadan önce son temizlik
app.on('before-quit', async (event) => {
  if (mainWindow) {
    event.preventDefault()
    mainWindow.close()
    mainWindow = null
  }
  await cleanupApp()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
