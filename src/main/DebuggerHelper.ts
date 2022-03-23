const {ipcMain: ipc} = require('electron-better-ipc');
import { IPCKey } from '../common/Constants';
import { ATTR_CONFIG } from '../attr_config'
let initialized = false;
const selectedNodes: any[] = [];
export const DebuggerHelperUtil = function () {
  if (initialized) return;
  const tree = function (key: number) {
    let index: number= key || 0;
    let treeNode = function (node: cc.Node) {
      let nameStyle =
        `color: ${node.parent === null || node.activeInHierarchy ? 'green' : 'grey'}; font-size: 14px;font-weight:bold`;
      let propStyle =
        `color: black; background: lightgrey;margin-left: 5px;border-radius:3px;padding: 0 3px;font-size: 10px;font-weight:bold`;
      let indexStyle =
        `color: orange; background: black;margin-left: 5px;border-radius:3px;padding:0 3px;fonrt-size: 10px;font-weight:bold;`
      let nameValue = `%c${node.name}`;
      let propValue =
        `%c${node.x.toFixed(0) + ',' + node.y.toFixed(0) + ',' + node.width.toFixed(0) + ',' + node.height.toFixed(0) + ',' + node.scale.toFixed(1)}`
      let indexValue = `%c${index++}`;
      if (node.childrenCount > 0) {
        console.groupCollapsed(nameValue + propValue + indexValue, nameStyle,
          propStyle, indexStyle);
        for (let i = 0; i < node.childrenCount; i++) {
          treeNode(node.children[i]);
        }
        console.groupEnd();
      } else {
        console.log(nameValue + propValue + indexValue, nameStyle, propStyle,
          indexStyle);
      }
    }
    if (key) {
      let node = cc.cat(key);
      index = node['tempIndex'];
      treeNode(node);
    } else {
      let scene = cc.director.getScene();
      treeNode(scene);
    }
    return '属性依次为x,y,width,height,scale.使用cc.cat(id)查看详细属性.';
  }
  const cat = function (key: number|string) {
    let index = 0;
    let target: any;
    let sortId = function (node: cc.Node) {
      if (target) return;
      if (cc.js.isNumber(key)) {
        if (key === index++) {
          target = node;
          return;
        }
      } else {
        if ((key as string).toLowerCase() === node.name.toLowerCase()) {
          target = node;
          return;
        } else {
          index++;
        }
      }
      if (node.childrenCount > 0) {
        for (let i = 0; i < node.childrenCount; i++) {
          sortId(node.children[i]);
        }
      }
    }
    let scene = cc.director.getScene();
    sortId(scene);
    target['tempIndex'] = cc.js.isNumber(key) ? key : index;
    return target;
  }
  const list = function (key: number|string) {
    let targets: cc.Node[] = [];
    let step = function (node: cc.Node) {
      if (node.name.toLowerCase().indexOf((key as string).toLowerCase()) > -1) {
        targets.push(node);
      }
      if (node.childrenCount > 0) {
        for (let i = 0; i < node.childrenCount; i++) {
          step(node.children[i]);
        }
      }
    }
    let scene = cc.director.getScene();
    step(scene);
    if (targets.length === 1) {
      return targets[0];
    } else {
      return targets;
    }
  }
  const where = function (key: any) {
    let target = key.name ? key : cc.cat(key);
    if (!target) {
      return null;
    }
    let rect = target.getBoundingBoxToWorld();
    let bgNode = new cc.Node();
    let graphics = bgNode.addComponent(cc.Graphics);
    let scene = cc.director.getScene();
    scene.addChild(bgNode);
    bgNode.position = rect.center;
    bgNode.group = target.group;
    bgNode.zIndex = cc.macro.MAX_ZINDEX;
    let isZeroSize = rect.width === 0 || rect.height === 0;
    if (isZeroSize) {
      graphics.circle(0, 0, 100);
      graphics.fillColor = cc.Color.GREEN;
      graphics.fill();
    } else {
      bgNode.width = rect.width;
      bgNode.height = rect.height;
      graphics.rect(-bgNode.width / 2, -bgNode.height / 2, bgNode.width, bgNode.height);
      graphics.fillColor = new cc.Color().fromHEX('#E91E6390');
      graphics.fill();
    }
    setTimeout(() => {
      if (cc.isValid(bgNode)) {
        bgNode.destroy();
      }
    }, 2000);
    return target;
  }
  const cache = function () {
    // @ts-ignore
    let rawCacheData = cc.assetManager.assets._map;
    let cacheData = [];
    let totalTextureSize = 0;
    for (let k in rawCacheData) {
      let item = rawCacheData[k];
      if (item.type !== 'js' && item.type !== 'json') {
        let itemName = '_';
        let preview = '';
        let content = item.__classname__;
        let formatSize = -1;
        if (item.type === 'png' || item.type === 'jpg') {
          let texture = rawCacheData[k.replace('.' + item.type, '.json')];
          if (texture && texture._owner && texture._owner._name) {
            itemName = texture._owner._name;
            preview = texture.content.url;
          }
        } else {
          if (item.name) {
            itemName = item.name;
          } else if (item._owner) {
            itemName = (item._owner && item._owner.name) || '_';
          }
          if (content === 'cc.Texture2D') {
            preview = item.nativeUrl;
            let textureSize = item.width * item.height * ((item._native === '.jpg' ? 3 : 4) / 1024 / 1024);
            totalTextureSize += textureSize;
            // sizeStr = textureSize.toFixed(3) + 'M';
            formatSize = Math.round(textureSize * 1000) / 1000;
          } else if (content === 'cc.SpriteFrame') {
            preview = item._texture.nativeUrl;
          }
        }
        cacheData.push({
          queueId: item.queueId,
          type: content,
          name: itemName,
          preview: preview,
          id: item._uuid,
          size: formatSize
        });
      }
    }
    let cacheTitle = `缓存 [文件总数:${cacheData.length}][纹理缓存:${totalTextureSize.toFixed(2) + 'M'}]`;
    return [cacheData, cacheTitle];
  }
  const getChildren = function (id: string| number| cc.Node) {
    let node = id;
    debugger
    console.log('id.constructor.name', id.constructor.name, typeof cc)
    if (id.constructor.name !== 'CC_NODE') {
      // @ts-ignore
      const obj = getNodeById(id);
      node = obj.node
    }

    return (node as cc.Node).children.map((child: cc.Node) => {
      let children: any = (child.children && child.children.length > 0) ? getChildren(child) : [];
      // @ts-ignore
      return { id: child._id, name: child.name, active: child.activeInHierarchy, children };
    });
  }
  const getNodeById = function  (id: string| number) {
    let target: any;
    const search = function (node: cc.Node) {
      // @ts-ignore
      if (node._id === id) {
        target = node;
        return;
      }
      if (node.childrenCount) {
        for (let i = 0; i < node.childrenCount; i++) {
          if (!target) {
            search(node.children[i]);
          }
        }
      }
    }
    const scene = cc.director.getScene();
    search(scene);
    return target;
  }
  ipc.answerRenderer(IPCKey.TreeEvent, async (args: any) => {
    return tree(args);
  });
  ipc.answerRenderer(IPCKey.CatEvent, async (args: any) => {
    return cat(args);;
  });
  ipc.answerRenderer(IPCKey.ListEvent, async (args: any) => {
    return list(args);
  });
  ipc.answerRenderer(IPCKey.WhereEvent, async (args: any) => {
    // console.log(IPCKey.WhereEvent, event)
    // return where(args);
  });
  ipc.answerRenderer(IPCKey.CacheEvent, async (args: any) => {
    return cache();
  });
  ipc.answerRenderer(IPCKey.SelectedNodeEvent, async (args: any) => {
    let node = getNodeById(args);
    let componentsSchema: any[] = []
    let nodeSchemaKey = 'node2d';
    if (node) {
      if (!node.hex_color) {
        cc.js.getset(node, 'hex_color', () => {
          return '#' + node.color.toHEX('#rrggbb');
        }, (hex: string) => {
          node.color = new cc.Color().fromHEX(hex);
        }, false, true);
      }

      let superPreLoad = node._onPreDestroy;
      node._onPreDestroy = () => {
        superPreLoad.apply(node);
        if (selectedNodes.length > 0 && selectedNodes[0] === node._id) {
          selectedNodes.pop();
        }
      }
      // nodeSchema = ATTR_CONFIG.nodeSchema.node2d;
      // let componentsSchema = [];
      for (let component of node._components) {
        // @ts-ignore
        let schema = ATTR_CONFIG.componentsSchema[component.__classname__];
        if (schema) {
          node[schema.key] = node.getComponent(schema.key);
          for (let i = 0; i < schema.rows.length; i++) {
            if (schema.rows[i].type === 'color') {
              if (!node[schema.key][schema.rows[i].key]) {
                cc.js.getset(node[schema.key], schema.rows[i].key, () => {
                  return '#' + node.getComponent(schema.key)[schema.rows[i].rawKey].toHEX('#rrggbb');
                }, (hex: string) => {
                  node.getComponent(schema.key)[schema.rows[i].rawKey] = new cc.Color().fromHEX(hex);
                }, false, true);
              }
            }
          }
        } else {
          schema = {
            title: component.__classname__,
            key: component.__classname__
          };
          node[schema.key] = node.getComponent(schema.key);
        }
        componentsSchema.push(schema);
      }
      return {
        node, componentsSchema, nodeSchemaKey
      }
    }
    return {
      node, componentsSchema, nodeSchemaKey
    }
  });
  ipc.answerRenderer(IPCKey.GetChildrenNodes, async (args: any) => {
    debugger
    console.log(IPCKey.GetChildrenNodes, args )
    return getChildren(args);
  });
  ipc.answerRenderer(IPCKey.GetNodeById, async (args: any) => {
    return getNodeById(args);
  });

}
