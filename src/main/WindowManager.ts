import { app, BrowserWindow, session } from 'electron'
import path from 'path'
import { IPCKey } from '../common/Constants'
import http from 'http'
const {ipcMain: ipc} = require('electron-better-ipc');
const portfinder = require('portfinder');
const CDP = require('../common/remote-debugger-interface/');
const Chrome = require('../common/remote-debugger-interface/lib/chrome');
const { WebSocketServer, WebSocket } =require('ws');
import { MiddleManRuntime } from './MiddleManRuntime'
import EventEmitter from 'events';
import { IPCEvents } from './IPCEvents'

/**
 * Create a window and add it to the list.
 */
let TreeWindow: BrowserWindow;
let MiddleManWSServer: any;
let cocosContext: any;
let runtime: MiddleManRuntime;
type WS = WebSocket & EventEmitter
let DebugWs:string = '';
let DebugHost = '127.0.0.1';
let DebugPort = 8014;
let DebugWsPath = '/00010002-0003-4004-8005-000600070008'
const DebugServer = http.createServer()
let IPC_EVENT: IPCEvents|null = null;
let isInitStage = true;
export const createMainWindow = () => {
  portfinder.getPort(function (err: any, port: number) {
    DebugPort = port;
    console.log('debug port is :', port)
    if (err){
      console.error(err)
      return;
    }
    DebugWs = `${DebugHost}:${DebugPort}`
    TreeWindow = createNewWindow(`file://${path.join(__dirname, 'index.html')}#${DebugWs}`);
    DebugServer.listen(port);
    DebugServer.on('upgrade', function (request, socket, head) {
      console.log(`DebugServer upgrade`)
      // MiddleManWSServer.handleUpgrade(request, socket, head, function (ws) {
      //   MiddleManWSServer.emit('connection', ws, request);
      // })
      // setTimeout(() => {
      //   // @ts-ignore
      //   IPC_EVENT.emit(IPCKey.WaitClientConnect, DebugWs)
      //   console.log(`ipc create finish`)
      // }, 2000)
    })
    //
    // `port` is guaranteed to be a free port
    // in this scope.
    //
  });
}
function initMiddleServer(middleMan: typeof Chrome) {
  if(!MiddleManWSServer) {
    MiddleManWSServer = new WebSocketServer({ server: DebugServer });
  }

  const runtime = new MiddleManRuntime(middleMan.Runtime);
  IPC_EVENT = new IPCEvents(runtime, TreeWindow);
  IPC_EVENT.initialize();
  setTimeout(() => {
    // @ts-ignore
    IPC_EVENT.emit(IPCKey.WaitClientConnect, DebugWs)
    console.log(`ipc create finish`)
  }, 2000)


  MiddleManWSServer.on('connection', async function connection(clientWs: WS) {
    console.log('client connect');

    middleMan.setClientWs(clientWs);
    if (isInitStage) {
      isInitStage = false;
      await middleMan.Runtime.enable()
      await runtime.injectScript();
      middleMan.on('disconnect', () => {
        console.log('client disconnect');
        MiddleManWSServer.clients.forEach(function each(client: WS) {
          client.close()
        });
      })
    }

    clientWs.on('message', function message(data, flags) {
      console.log('forward to Server:', data.toString());
      middleMan.sendRawToServer( data.toString(), flags)
    });
    clientWs.on('close', ()=>{
      console.log('client close')
      // middleMan.close()
    });
    clientWs.on('open', ()=>{
      console.log('client open')
    });
    if (IPC_EVENT) {
      IPC_EVENT.emit(IPCKey.DebuggerReady)
    }
  });
}
function createDebugServer(h: string) {
  const u = new URL(`ws://${h}`);
  // console.log(u,  !!MiddleManWSServer, DebugWs )
  // if (MiddleManWSServer) {
  //   // @ts-ignore
  //   IPC_EVENT.emit(IPCKey.WaitClientConnect, DebugWs)
  //   return
  // }
  const cdp = CDP({
    local: true, host: u.hostname, port: u.port ,target: DebugWsPath
  }).then(async (middleMan: typeof Chrome) => {
    console.log(`dev server is connected`);
    console.log(`create middle dev server: ${DebugWs}`);
    initMiddleServer(middleMan)
  }).catch((e: any) => {

    ipc.callRenderer(TreeWindow, IPCKey.ConnectError, e);
    console.log(22222222, e)
  })

}
export const createNewWindow = (url: string) => {
  // const filePath = path.join(__dirname, 'index.html');
  // if (TreeWindow) {
  //   return TreeWindow.loadURL(`file://${filePath}#${TreeWindow.id}`)
  // }

  const TreeWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    minWidth: 480,
    minHeight: 320,
    resizable: true,
    webPreferences: {
      webSecurity: false,
      webviewTag: true,
      devTools: true,
      allowRunningInsecureContent: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  const devtools = new BrowserWindow();
  TreeWindow.webContents.setDevToolsWebContents(devtools.webContents);
  TreeWindow.webContents.openDevTools({ mode: 'detach' });
  // TreeWindow.on('closed', () => {
  //   /// #if env == 'DEBUG'
  //   console.log(`Window was closed, id = ${windowId}`)
  //   /// #endif
  // })
  // TreeWindow.webContents.on("new-window", async (event, url) => {
  //   event.preventDefault();
  //   console.log('createNewWindow  event', TreeWindow);
  //   return
  // });

  // The window identifier can be checked from the Renderer side.
  // `win.loadFile` will escape `#` to `%23`, So use `win.loadURL`
  TreeWindow.loadURL(url);
  return TreeWindow
}




// cocosContext



ipc.answerRenderer(IPCKey.GetDebugWs, async (): Promise<string> => {
  return DebugWs;
});

ipc.answerRenderer(IPCKey.SetDebugDeviceAddress, async (h: string) => {
  console.log('target host', h);
  createDebugServer(h)
});
