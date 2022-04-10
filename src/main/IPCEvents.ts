import { BrowserWindow } from 'electron'
import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { IPCKey } from '../common/Constants'
import { DebuggerHelperUtil } from './DebuggerHelper'
import { MiddleManRuntime } from './MiddleManRuntime'
const {ipcMain: ipc} = require('electron-better-ipc');

export class IPCEvents {
  private runtime: MiddleManRuntime
  private isInjected: boolean
  private rendererWindow: Electron.CrossProcessExports.BrowserWindow
  constructor(runtime: MiddleManRuntime, rendererWindow: BrowserWindow) {
    this.runtime = runtime;
    this.isInjected = false;
    this.rendererWindow = rendererWindow;
  }
  initialize() {
    // ipc.answerRenderer(IPCKey.InjectScripts, this.injectScript)
    ipc.answerRenderer(IPCKey.GetNodeTree, this.getNodeTree)
    // ipc.answerRenderer(IPCKey.GetNodeById, this.getNodeById)
    ipc.answerRenderer(IPCKey.GetNodeDetailById, this.getNodeDetailById)
    ipc.answerRenderer(IPCKey.DrawBoundingClientRect, this.drawBoundingClientRect)
    ipc.answerRenderer(IPCKey.UpdateNodeAttrs, this.updateNodeAttrs)
    ipc.answerRenderer(IPCKey.SetGlobalNodeVar, this.SetGlobalNodeVar)
    ipc.answerRenderer(IPCKey.ToggleFPS, this.toggleFPS)
    ipc.answerRenderer(IPCKey.SetFPS, this.setFPS)
    ipc.answerRenderer(IPCKey.TogglePauseGame, this.togglePauseGame)
    ipc.answerRenderer(IPCKey.SetGlobalComponentAttrVar, this.setGlobalComponentAttrVar)
    ipc.answerRenderer(IPCKey.SetGlobalComponentVar, this.setGlobalComponentVar)
  }
  emit(cmd: string, ...args: any) {
    ipc.callRenderer(this.rendererWindow, cmd, ...args);
  }

  getNodeTree = async () => {
    const result = await this.runtime.$eval(`getChildren(cc.director.getScene())`)
    return result;
  }
  getNodeDetailById = async (nodeId: string) => {
    const result = await this.runtime.$eval(`getNodeDetailById('${nodeId}')`)
    return result;
  }

  drawBoundingClientRect = async (nodeId: string) => {
    const result = await this.runtime.$eval(`drawBoundingClientRect('${nodeId}')`)
    return result;
  }
  updateNodeAttrs = async(obj: any) => {
    await this.runtime.call(`updateNodeAttrs`, obj )
  }
  SetGlobalNodeVar = async(obj: any) => {
    const result = await this.runtime.call(`SetGlobalNodeVar`, obj)
    return result;
  }
  toggleFPS = async(obj: any) => {
    console.log('cc.debug.setDisplayStats(!cc.debug.isDisplayStats())')
    await this.runtime.$eval(`cc.debug.setDisplayStats(!cc.debug.isDisplayStats())` )
  }
  setFPS = async(fps: any) => {
    console.log('setFPS', fps);
    await this.runtime.call(`setFrameRate`, fps )
  }
  togglePauseGame = async(obj: any) => {
    await this.runtime.$eval(`togglePauseGame()` )
  }
  setGlobalComponentAttrVar = async(obj: any) => {
    await this.runtime.call(`setGlobalComponentAttrVar`, obj)
  }

  setGlobalComponentVar = async(obj: any) => {
    await this.runtime.call(`setGlobalComponentVar`, obj)
  }

}







