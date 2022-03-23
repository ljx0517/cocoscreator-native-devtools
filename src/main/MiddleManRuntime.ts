import fs from 'fs'
import ProtocolProxyApi from 'devtools-protocol/types/protocol-proxy-api'
import Protocol from 'devtools-protocol';
import Runtime = ProtocolProxyApi.RuntimeApi
import path from 'path'
import { ObjectDescription } from '../common/Constants'
// type Runtime = typeof Runtime
const {ipcMain: ipc} = require('electron-better-ipc');


export class MiddleManRuntime {
  private _runtime: Runtime;
  private injectScriptId: any;
  constructor(runtime: Runtime) {
    this._runtime = runtime;
  }

  async injectScript() {
    const injectScriptPath = path.join(__dirname, './inject.js')
    console.log('injectScriptPath', injectScriptPath);
    const s =  fs.readFileSync(injectScriptPath);
    let result = await this._runtime.compileScript({expression: s.toString(), sourceURL: '', persistScript: true })
    console.log(1, result);
    this.injectScriptId = result.scriptId
    const r = await this._runtime.runScript(<Protocol.Runtime.RunScriptRequest>{ scriptId: result.scriptId/*, returnByValue: true*/ })
    console.log(2, r)
  }
  async $eval(code: string) {
    // const result = await this._runtime.callFunctionOn({functionDeclaration: `function() {return cc.director.getScene();}`, executionContextId: 1, returnByValue: true})
    const result = await this._runtime.evaluate({expression: code, returnByValue: true})
    // console.log(JSON.stringify(result))
    // @ts-ignore
    // let object = new ObjectDescription[result.result.className];
    if (result.result.objectId) {
      console.log('is object ref, code:',code)
      const props = await this._runtime.getProperties({objectId: result.result.objectId});
      console.log(JSON.stringify(props));

      // for (let i=0;i <props.result.length; i++) {
      //   if (props.result[i].name === 'constructor') {
      //     // @ts-ignore
      //     object = ObjectDescription[props.result[i].value.description]
      //   }
      // }
      // for (let i=0;i <props.result.length; i++) {
      //   const d = props.result[i] as PropertyDescriptor & {name: string};
      //   try{
      //     Object.defineProperty(object, d.name, d);
      //   } catch (e) {
      //     // console.log('error prop', d.name );
      //   }
      // }
      // return object;
    } else {
      return result.result.value;
    }

  }
  async call(fnName: string, ...args: any) {
    const r = await this._runtime.callFunctionOn({functionDeclaration: fnName, arguments: [{value: args}],  executionContextId:1, awaitPromise: true, returnByValue: true})
  }
}
