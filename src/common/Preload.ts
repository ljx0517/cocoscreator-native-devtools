import { contextBridge, ipcRenderer } from 'electron'
import { IpcRendererEvent } from 'electron/main'
import { IPCKey } from './Constants'
const {ipcRenderer: ipc} = require('electron-better-ipc');
contextBridge.exposeInMainWorld('ipc', ipc);
contextBridge.exposeInMainWorld('API', {
  dispatch:async (cmd: any, ...args: any): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      console.log('[callMain]', cmd);
      ipc.callMain(cmd, ...args).then((r: any) => {
        resolve(r);
      }).catch((e: any) => {
        reject(e);
      });
    })
  },
  sendMessage: async (targetWindowId: number, message: string): Promise<void> =>
    await ipcRenderer.invoke(IPCKey.SendMessage, targetWindowId, message),

  createNewWindow: async (): Promise<void> =>
    await ipcRenderer.invoke(IPCKey.CreateNewWindow),
  createDebugWindow: async (): Promise<void> =>
    await ipcRenderer.invoke(IPCKey.CreateDebugWindow),
  getWindowIds: async (): Promise<number[]> =>
    await ipcRenderer.invoke(IPCKey.GetWindowIds),

  onUpdateMessage: (listener: (message: string) => void) =>
    ipcRenderer.on(
      IPCKey.UpdateMessage,
      (ev: IpcRendererEvent, message: string) => listener(message)
    ),

  onUpdateWindowIds: (listener: (windowIds: number[]) => void) =>
    ipcRenderer.on(
      IPCKey.UpdateWindowIds,
      (ev: IpcRendererEvent, windowIds: number[]) => listener(windowIds)
    )
})
