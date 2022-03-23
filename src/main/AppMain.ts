import { app, Menu } from 'electron'
// import { initializeIpcEvents, releaseIpcEvents } from './IPCEvents'
import { createMainMenu } from './MainMenu'
import { createMainWindow } from './WindowManager'

app.name = 'CocosCreator native debugger Windows'
app.commandLine.appendSwitch('disable-site-isolation-trials')
app.on('ready', () => {
  /// #if env == 'DEBUG'
  console.log('Initialize Application')
  /// #endif

  createMainWindow()
  // createDebugWindow()
  createMainMenu()
})

/// #if env == 'DEBUG'
app.on('quit', () => {
  console.log('Application is quit')
})
/// #endif

app.on('window-all-closed', () => {
  /// #if env == 'DEBUG'
  console.log('All of the window was closed.')
  /// #endif

  app.quit()
})
