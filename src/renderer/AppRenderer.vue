<script lang="ts">
/* tslint:disable */
import {IPCKey} from '../common/Constants';
const _ = require('lodash');
/*
const debounce = function(func: CallableFunction, wait: number, immediate = false) {
  let timeout: NodeJS.Timeout|null, result: any;
  return function() {
    // @ts-ignore
    let context: any = this;
    let args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) result = func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout as NodeJS.Timeout);
    timeout = setTimeout(later, wait);
    if (callNow) result = func.apply(context, args);
    return result;
  };
};
*/
type UPDATE_ATTR = {
  attrName: string;
  attrValue: any;
}
type INTERNAL_DATA = {
  errorMsg: string,
  debugHost: string;
  isDebugReady: boolean;
  needRefreshView: boolean;
  fps: number;
  NativeDebugPath: string;
  drawer: boolean;
  cacheDialog: boolean
  cacheTitle: string,
  cacheHeaders: any,
  cacheRawData: any[],
  cacheData: any[],
  cacheSearchText: any,
  cacheOnlyTexture: boolean,
  treeData: any[],
  selectedNodes:  cc.Node[];
  treeSearchText: string,
  nodeSchema: any,
  componentsSchema: any[],
  selectedNode: any;
  updateAttrFn: any;
}
import Vue, { VNode } from 'vue'
// import promiseIpc from 'electron-promise-ipc';
// import { PromiseIpc } from 'electron-promise-ipc/build/renderer'
// const promiseIpc = new PromiseIpc({ maxTimeoutMs: 2000 });
export default Vue.extend({
  data() : INTERNAL_DATA{
    return {
      fps: .1,
      debugHost: '',
      errorMsg: '',
      NativeDebugPath: '',
      drawer: true,
      cacheDialog: false,
      needRefreshView: false,
      cacheTitle: '',
      cacheHeaders: [
        { text: 'Type', value: 'type' },
        { text: 'Name', value: 'name' },
        { text: 'Preivew', value: 'preview' },
        { text: 'ID', value: 'id' },
        { text: 'Size', value: 'size' },
      ],
      cacheRawData: [],
      cacheData: [],
      cacheSearchText: null,
      cacheOnlyTexture: true,
      treeData: [],
      selectedNodes: [],
      treeSearchText: '',
      nodeSchema: {},
      componentsSchema: [],
      selectedNode: {},
      updateAttrFn: null,
      isDebugReady: false,
    }
  },
  created(){

    let host = window.location.hash;
    if (host.startsWith('#')) {
      host = host.substring(1)
    }
    console.log(host);
    // devtools://devtools/bundled/js_app.html?v8only=true&ws=

    window.ipc.answerMain(IPCKey.WaitClientConnect, async (port) => {
      console.log('WaitClientConnect', port);
      this.NativeDebugPath = `devtools://devtools/bundled/js_app.html?v8only=true&ws=${host}/00010002-0003-4004-8005-000600070008`
      this.isDebugReady = true;
    });
    window.ipc.answerMain(IPCKey.DebuggerReady, async () => {
      console.log('DebuggerReady');
      this.startUpdateTree();
    });
    window.ipc.answerMain(IPCKey.ConnectError, async (e) => {
      console.log('ConnectError', e);
      this.errorMsg = '网络错误，请检查ip和端口是否正确';
    });


    this.updateAttrFn = _.debounce((param: any) => {
      console.log('updateNodeAttrs!', param)
      window.API.dispatch(IPCKey.UpdateNodeAttrs, param).then((result) => {
      })
    }, 500)
  },
  watch: {
    cacheOnlyTexture() {
      this.updateCacheData();
    },
    selectedNodes: {
      handler(newV, oldV) {
        if (!newV.length) return undefined;
        window.API.dispatch(IPCKey.GetNodeDetailById, this.selectedNodes[0]).then((result) => {
          console.log('selectedNode3', result)
          this.$set(this, 'selectedNode', result)
          // this.selectedNode = result;
        })
      },
      deep: true,
    },
  },
  computed: {
    treeFilter() {
      return (item: any, search: string, textKey: string) => {
        console.log(item, search, textKey);
        return item[textKey].indexOf(search) > -1;
      }
    },

  },
  methods: {
    attrChange(type: string, attrName: string, attrType: string,  event: Event) {
      if (!this.selectedNode) {
        return
      }
      const obj: {
        id: string;
        components: any[];
        attrs: UPDATE_ATTR[]
      } = {
        id: this.selectedNode.id,
        components: [],
        attrs: []
      }
      if (type == 'node') {
        const has = obj.attrs.find(a => {
          return a.attrName == attrName
        }) as any;
        let val = this.selectedNode[attrName];
        if (attrType == 'bool') {
          val = !!val;
        } else if (attrType == 'number') {
          val = parseInt(val, 10);
        }
        if (has) {
          has[attrName] = val
        } else {
          obj.attrs.push({
            attrName,
            attrValue: val
          })
        }
      } else {
        const c = this.selectedNode.components.find((c: any) => c.id == type);
        let val = c[attrName];
        if (attrType == 'bool') {
          val = !!val;
        } else if (attrType == 'number') {
          val = parseInt(val, 10);
        }
        obj.components.push({
          id: type,
          attrName,
          attrValue: val
        })
      }


      this.updateAttrFn(obj);
    },
    async toggleFps() {
      window.API.dispatch(IPCKey.ToggleFPS)
    },
    async changeFPS(event: Event){
      // @ts-ignore
      window.API.dispatch(IPCKey.SetFPS, event.target.value )
    },
    async togglePauseGame(){
      window.API.dispatch(IPCKey.TogglePauseGame )
    },
    async refreshTree () {
      return new Promise<void>(async (resolve, reject) => {
        if (!this.needRefreshView) {
          return reject()
        }
        const data = await window.API.dispatch(IPCKey.GetNodeTree);
        console.log(data)
        if (this.fps) {
          this.$data.treeData = data;
          setTimeout(() => {
            resolve()
          }, 1000 / this.fps);
        } else {
          this.$data.treeData = data;
        }
      }).then(() => {
        this.refreshTree();
      }).catch(e => {
        if (e) {
          console.error(e)
        }
        console.log('stop refresh')
      })
      // if (!this.$data.drawer || !window.cc || !cc.director.getScene() || !cc.director.getScene().children) return;
      // if (!this.$data.drawer) {
      //   return;
      // }

    },
    async outputComponentAttrRefHandler(nodeId: string, compId: string, key: string) {
      window.API.dispatch(IPCKey.SetGlobalComponentAttrVar, {nodeId, compId, key})
    },
    async startUpdateTree () {
      this.needRefreshView = true;
      this.refreshTree();
    },
    async stopUpdateTree () {
      this.needRefreshView = false;
    },
    async outputNodeHandler(id: number) {
      console.log('outputNodeHandler', id);
      window.API.dispatch(IPCKey.SetGlobalNodeVar, id)
    },
    // @ts-ignore
    async outputComponentHandler(nodeId, compId) {
      await window.API.dispatch(IPCKey.SetGlobalComponentVar,  {nodeId, compId});
    },
    async drawNodeRect() {
      // cc.where(this.selectedNode);
      console.log(this.selectedNode);
      await window.API.dispatch(IPCKey.DrawBoundingClientRect,  this.selectedNode.id);
    },
    async updateCacheData() {
      if (this.$data.cacheOnlyTexture) {
        this.$data.cacheData = this.$data.cacheRawData.filter(item => item.type === 'cc.Texture2D');
      } else {
        this.$data.cacheData = this.$data.cacheRawData;
      }
    },

    async connectDevice() {
      this.errorMsg = '';
      window.API.dispatch(IPCKey.SetDebugDeviceAddress, this.debugHost)
    }

  }
})
</script>

<template>
  <div>
    <Split  v-if='isDebugReady' style="height: 100vh;">
      <SplitArea :size="50">
          <div class="toolbar">
            <div class="item">
              <v-btn id="btn-show-fps" color="primary" class="primary" small height="25" @click='toggleFps'>Toggle FPS</v-btn>
            </div>
            <div class="item">
              <span style="font-size: small;color: #333;" class="item">FPS:</span>
              <input class='input' id="input-set-fps" type="number" value='60' @change='changeFPS($event)' />
            </div>
            <div class="item">
              <v-btn id="btn-pause"  small height="25" class="error" color="error"
                     @click='togglePauseGame()'>Pause</v-btn>
            </div>
          </div>
        <v-divider></v-divider>
        <div class='main' style='display: flex'  app clipped fixed width="512">
          <v-container class='tree-view' style="height: 50%;overflow: auto;">
            <v-text-field v-model="treeSearchText"
                          class='input'
                          dense label="Search Node or Component"
                          dark flat solo-inverted
                          hide-details clearable clear-icon="mdi-close-circle-outline"></v-text-field>
            <v-divider style='margin: 12px'></v-divider>
            <v-treeview open-all  item-key="id"
                        hoverable
                        dense activatable
                        :items="treeData"
                        :search="treeSearchText"
                        :filter="treeFilter"
                        :active.sync="selectedNodes">
              <template v-slot:label="{ item, active }">
                <label v-if="item.active"><{{ item.name }}></label>
                <label v-else style="color: gray;"><{{ item.name }}></label>
              </template>
            </v-treeview>
          </v-container>
          <v-container class='attrs-view' style="height: 100%;overflow-y: auto;">
            <template v-if="selectedNode && selectedNode.id">
              <!-- Node -->
              <div class="attrs-table" style="width: 100%;">
                <div class="hbox head" style="text-align: left;display:inline-flex;">
                  <v-simple-checkbox
                    @change.capture="attrChange('node','active', 'bool', $event)"
                    v-model="selectedNode.active"></v-simple-checkbox>
                  <div class='node-name' style="margin-left: 10px;">{{ selectedNode.name }}</div>
                  <v-icon style="margin-left: 10px;margin-right: 10px;" @click="drawNodeRect()">
                    mdi-adjust</v-icon>
                  <v-icon @click="outputNodeHandler(selectedNode.id)">mdi-send</v-icon>
                </div>
                <div class="hbox" >
                  <div class='label'>ID</div>
                  <div class='value-box'>
                    <input class='input' type="text"  :value='selectedNode.id' readonly style="width: 100%;">
                  </div>
                </div>
                <div class="hbox" v-for="attr in selectedNode.attrs" :key="attr.key">
                  <div class='label'>{{ attr.name }}</div>
                  <div class='value-box'>
                    <!--
                    <v-color-picker v-if="attr.type == 'color'"
                                    class="ma-2"
                                    canvas-height="80" width="100%"
                                    v-model="selectedNode[attr.key]"></v-color-picker>
                    -->
                    <v-simple-checkbox v-if="attr.type == 'bool'"
                                       @change.capture="attrChange('node', attr.key, attr.type, $event)"
                                       v-model="selectedNode[attr.key]"
                                       style="padding: 10px;width: 100%;"></v-simple-checkbox>
                    <input class='input' v-else :type="attr.type"
                           @change.capture="attrChange(attr.key, attr.type,  $event)"
                           v-model="selectedNode[attr.key]"
                           style="width: 100%;">
                  </div>
                </div>
              </div>
              <!-- Components -->
              <div v-for="(component, index) in selectedNode.components" class="attrs-table components" >
                <div class="hbox head" style="text-align: left;">
                    <div class="float-left" style="display:inline-flex;">
                      <v-simple-checkbox
                        @change.capture="attrChange(component.id, 'enabled', 'bool', $event)"
                        v-model="selectedNode.components[index].enabled">
                      </v-simple-checkbox>
                      <span style="margin-left: 10px;">{{ component.name }}</span>
                    </div>
                    <div class="float-right">
                      <v-icon @click="outputComponentHandler(selectedNode.id, component.id)">mdi-send</v-icon>
                    </div>
                  </div>
                <div class="hbox" >
                  <div class='label'>ID</div>
                  <div class='value-box'>
                    <input class='input' type="text" :value='component.id' readonly style="width: 100%;">
                  </div>
                </div>
                <div class="hbox" v-for="row in component.attrs" :key="row.key">
                  <div class='label'>{{ row.name }}</div>
                  <div class='value-box'>

                    <!--
                     <v-color-picker v-if="row.type == 'color'" class="ma-2" canvas-height="80" width="100%"
                                     v-model="selectedNode[component.key][row.key]"></v-color-picker>
                     -->
                    <textarea readonly v-if="row.type == 'textarea'" rows="1"
                              v-model="selectedNode.components[index][row.key]" style="padding: 10px;width: 100%;">
                                </textarea>
                    <v-simple-checkbox readonly v-else-if="row.type == 'bool'"
                                       v-model="selectedNode.components[index][row.key]" style="padding: 10px;width: 100%;">
                    </v-simple-checkbox>
                    <div class='comp-attr-ref' v-else-if="!['string', 'number', 'boolean'].includes(row.type)">
                      <input class='input' readonly
                             type="text"
                             :value='row.type'
                             @change.capture="attrChange(component.id, row.key, row.type,  $event)"
                             style="width: 100%;">
                      <v-icon @click="outputComponentAttrRefHandler(selectedNode.id, component.id, row.key)">mdi-send</v-icon>
                    </div>

                    <input class='input' readonly v-else :type="row.type"
                           @change.capture="attrChange(component.id, row.key, row.type,  $event)"
                           v-model="selectedNode.components[index][row.key]"
                           style="width: 100%;">
                  </div>
                </div>
              </div>
            </template>
          </v-container>
        </div>

        <v-main style='display: none;'>
          <v-container fill-height>
            <div id="content" class="content">
              <div class="contentWrap">
                <div id="GameDiv" class="wrapper"><canvas id="GameCanvas"></canvas>
                  <div id="splash">
                    <div class="progress-bar stripes"><span></span></div>
                  </div>
                  <div id="bulletin">
                    <div id="sceneIsEmpty" class="inner">预览场景中啥都没有，加点什么，或在编辑器中打开其它场景吧</div>
                  </div>
                </div>
              </div>
            </div>
          </v-container>
        </v-main>

        <v-dialog v-model="cacheDialog" persistent scrollable>
          <v-card>
            <v-card-title>
              {{ cacheTitle }}
              <v-spacer></v-spacer>
              <v-text-field v-model="cacheSearchText" append-icon="mdi-magnify" label="Search" single-line
                            hide-details>
              </v-text-field>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-data-table :headers="cacheHeaders" :items="cacheData" :search="cacheSearchText" :sort-by="['size']"
                            :sort-desc="[true]" :footer-props="{
                        showFirstLastPage: true,
                        firstIcon: 'mdi-chevron-double-left',
                        lastIcon: 'mdi-chevron-double-right',
                      }">
                <template v-slot:item.size="{ item }">
                  {{ item.size == -1 ? '_' : (item.size +'MB') }}
                </template>
                <template v-slot:item.preview="{ item }">
                  <div style="height: 60px;display: flex;align-items: center;">
                    <img :src="window.location.protocol + '//' + window.location.host + '/' + item.preview"
                         style="max-height: 60px;max-width: 120px;" v-if="item.preview">
                    <template v-else>_</template>
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-btn color="blue darken-1" text @click="cacheDialog = false">Close</v-btn>
              <v-spacer></v-spacer>
              <v-switch v-model="cacheOnlyTexture" label="只显示纹理"></v-switch>
            </v-card-actions>
          </v-card>
        </v-dialog>

      </SplitArea>
      <SplitArea :size="50">
        <webview id="debugger"

                 webpreferences="allowRunningInsecureContent, webSecurity=no"
                 disablewebsecurity
                 :src=NativeDebugPath
                 style="display:inline-flex; width:100%; height:100vh"></webview>

      </SplitArea>
    </Split>
    <div v-else>
      <v-alert
        v-if='errorMsg'
        dense
        text
        style='color: red;'
        type="success"
      >
        {{errorMsg}}
      </v-alert>
      <div class='connect-page'>
        <div class='ip-addr'>
          <v-card>
            <v-card-title class="text-h5">
              Device IP:PORT(default: 6086)
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col
                  sm="12"
                  md="12"
                >
                  <input v-model='debugHost' style='width: 100%' type='text' class='input'>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>

              <v-btn
                color="green darken-1"
                text
                @click="connectDevice()"
              >
                ok
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </div>

    </div>
  </div>
</template>
