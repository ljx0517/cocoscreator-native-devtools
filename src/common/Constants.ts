/**
 * IPC keys.
 */
export enum IPCKey {
  SendMessage = 'SendMessage',
  CreateNewWindow = 'CreateNewWindow',
  CreateDebugWindow = 'CreateDebugWindow',
  GetWindowIds = 'GetWindowIds',
  UpdateMessage = 'UpdateMessage',
  UpdateWindowIds = 'UpdateWindowIds',



  TreeEvent = 'TreeEvent',
  CatEvent = 'CatEvent',
  ListEvent = 'ListEvent',
  WhereEvent = 'WhereEvent',
  CacheEvent = 'CacheEvent',
  SelectedNodeEvent = 'SelectedNodeEvent',
  // GetChildrenNodes = 'GetChildrenNodes',
  GetNodeById = 'GetNodeById',
  GetDebugWs = 'GetDebugWs',
  DebuggerReady = 'DebuggerReady',
  WaitClientConnect = 'WaitClientConnect',
  ConnectError = 'ConnectError',
  GetNodeTree = 'GetNodeTree',
  GetNodeDetailById = "GetNodeDetailById",
  DrawBoundingClientRect = "DrawBoundingClientRect",
  UpdateNodeAttrs = "UpdateNodeAttrs",
  SetGlobalNodeVar = "SetGlobalNodeVar",
  SetGlobalComponentAttrVar = "SetGlobalComponentAttrVar",
  SetDebugDeviceAddress = "SetDebugDeviceAddress",
  SetGlobalComponentVar = "SetGlobalComponentVar",




  ToggleFPS = "ToggleFPS",
  SetFPS = "SetFPS",
  TogglePauseGame = "togglePauseGame",



  InjectScripts = 'InjectScripts',
}

export const ObjectDescription = {
  "function Array() { [native code] }": [],
  "Array": Array
}
