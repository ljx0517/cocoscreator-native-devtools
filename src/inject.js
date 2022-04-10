if (!globalThis.___inject___) {
  globalThis.___inject___ = true;
  // const randomDrawNodeName = `debugDrawBoundingClientRectNode${Date.now()}`
  const randomDrawNodeName = `debugDrawBoundingClientRectNode${Date.now()}`
  const NODE_CACHER = {};
  let GlobalVarIndex = 1;
  const AttrConfig = {
    "nodeSchema": {
      "node2d": {
        "title": "Node",
        "key": "cc.Node",
        "rows": [
          // { "name": "Active", "key": "active", "type": "boolean" },
          { "name": "Name", "key": "name", "type": "text" },
          { "name": "X", "key": "x", "type": "number" },
          { "name": "Y", "key": "y", "type": "number" },
          { "name": "Width", "key": "width", "type": "number" },
          { "name": "Height", "key": "height", "type": "number" },
          { "name": "Angle", "key": "angle", "type": "number" },
          { "name": "ScaleX", "key": "scaleX", "type": "number" },
          { "name": "ScaleY", "key": "scaleY", "type": "number" },
          { "name": "Opacity", "key": "opacity", "type": "number" },
          { "name": "Color", "key": "hex_color", "type": "color" },
          { "name": "Group", "key": "group", "type": "text" }
        ]
      },
      "node3d": {
        "title": "Node",
        "key": "cc.Node",
        "rows": [
        ]
      }
    },
    "componentsSchema": {
      "cc.Camera": {
        "title": "cc.Camera",
        "key": "cc.Camera",
        "rows": [
          { "name": "Zoom Ratio", "key": "zoomRatio", "type": "number" },
          { "name": "Depth", "key": "depth", "type": "number" },
          // { "name": "Background Color", "key": "hex_backgroundColor", "rawKey": "backgroundColor", "type": "color" },
          { "name": "Align with Screen", "key": "alignWithScreen", "type": "bool" }
        ]
      },
      "cc.Sprite": {
        "key": "cc.Sprite",
        "title": "cc.Sprite",
        "rows": []
      },
      "cc.Label": {
        "title": "cc.Label",
        "key": "cc.Label",
        "rows": [
          { "name": "String", "key": "string", "type": "textarea" },
          { "name": "Font Size", "key": "fontSize", "type": "number" },
          { "name": "Line Height", "key": "lineHeight", "type": "number" }
        ]
      }
    }
  };

  function getChildren(node) {
    return  node.children
      .filter(child => {
        return (!child.__debug_node_type__ && child.name.toUpperCase() != 'PROFILER-NODE')
      }).map(child => {
      let children = (child.children && child.children.length > 0) ? getChildren(child) : [];
      return { id: child._id, name: child.name, active: child.activeInHierarchy, children };
    });
  }

  function getNodeById(id) {
    const node = NODE_CACHER[id]
    if (node) {
      return node;
    }
    let target;
    const search = function (node) {
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
    NODE_CACHER[id] = target;
    return target;
  }


  function getNodeDetailById(nodeId) {
    const node = getNodeById(nodeId);
    const info = {
      name: 'Node',
      active: node.active,
      id: node._id,
      attrs:[],
      components:[]
    }
    if (node) {
      if (!node.hex_color) {
        cc.js.getset(node, 'hex_color', () => {
          return '#' + node.color.toHEX('#rrggbb');
        }, (hex) => {
          node.color = new cc.Color().fromHEX(hex);
        }, false, true);
      }

      let superPreLoad = node._onPreDestroy;
      node._onPreDestroy = () => {
        superPreLoad.apply(node);
        // if (this.selectedNodes.length > 0 && this.selectedNodes[0] === node._id) {
        //   this.selectedNodes.pop();
        // }
      }
      const attrRows = JSON.parse(JSON.stringify(AttrConfig.nodeSchema.node2d.rows));
      // { "name": "Name", "key": "name", "type": "text" },
      info.name = node.name;
      for (let i = 0; i < attrRows.length; i++) {
        const attr = attrRows[i];
        info[attr.key] = node[attr.key]
        info.attrs.push(attr)
      }

      for (let component of node._components) {
        const compAttrs = {
          enabled: component.enabled,
        }
        //
        const props = Object.getOwnPropertyNames(component);
        const customRows = []
        for (let i = 0; i < props.length; i++) {
          const prop = props[i];
          if (prop[0] == '_') {
            continue
          }
          if (prop == 'color') {
            continue
          }
          if (prop == 'node') {
            continue
          }

          const t = typeof component[prop];
          if (component[prop].__classname__) {
            customRows.push({ "name": prop,"key": prop, "type": component[prop].__classname__ })
            continue
          }
          if (!['string', 'number', 'boolean'].includes(t)) {
            continue
          }
          customRows.push({ "name": prop, "key": prop, "type": t})
        }

        if (AttrConfig.componentsSchema[component.__classname__]) {
          let schema = JSON.parse(JSON.stringify(AttrConfig.componentsSchema[component.__classname__]));


          schema.rows = schema.rows.concat(customRows)



          // node[schema.key]
          const comp = node.getComponent(schema.key);
          compAttrs.name = comp.__classname__;
          compAttrs.id = comp._id;
          compAttrs.attrs = schema.rows
          for (let i = 0; i < schema.rows.length; i++) {
            if (comp[schema.rows[i].key].__classname__) {
              compAttrs[schema.rows[i].key] = schema.rows[i].type;
            } else {
              compAttrs[schema.rows[i].key] = comp[schema.rows[i].key]
            }
            if (schema.rows[i].type === 'color') {
              if (!node[schema.key][schema.rows[i].key]) {
                cc.js.getset(node[schema.key], schema.rows[i].key, () => {
                  return '#' + node.getComponent(schema.key)[schema.rows[i].rawKey].toHEX('#rrggbb');
                }, (hex) => {
                  node.getComponent(schema.key)[schema.rows[i].rawKey] = new cc.Color().fromHEX(hex);
                }, false, true);
              }
            }
          }
        } else {
          // schema = {
          //   name: component.__classname__,
          //   key: component.__classname__,
          //   attrs:[],
          //   components:[]
          // };
          // node[schema.key] = node.getComponent(schema.key);
          compAttrs.name = component.__classname__
          compAttrs.attrs = customRows;
          for (let i = 0; i < customRows.length; i++) {
            const r = customRows[i];
            if (component[r.key].__classname__) {
              compAttrs[r.key] = r.type
            } else {
              compAttrs[r.key] = component[r.key]
            }
          }
          compAttrs.id = component._id;
        }
        info.components.push(compAttrs);
      }
      return info;
    }

  }

  function drawBoundingClientRect(nodeId) {
    const target = getNodeById(nodeId);
    let rect = target.getBoundingBoxToWorld();
    let bgNode = new cc.Node();
    bgNode.__debug_node_type__=randomDrawNodeName
    let graphics = bgNode.addComponent(cc.Graphics);
    let scene = cc.director.getScene();
    scene.addChild(bgNode);
    const bgLblNode = new cc.Node();
    const lbl = bgLblNode.addComponent(cc.Label);

    bgLblNode.parent = bgNode;

    // bgLblNode.x = Math.abs(bgNode.width / 2 - bgLblNode.width / 2)
    // bgLblNode.y = -Math.abs(bgNode.height / 2 - bgLblNode.height / 2)

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
    lbl.string = `${Math.round(bgNode.width)} x ${Math.round(bgNode.height)}`
    setTimeout(() => {
      if (cc.isValid(bgNode)) {
        bgNode.destroy();
      }
    }, 20000);
  }

  function updateNodeAttrs(args) {
    const obj = args[0]
    const node = getNodeById(obj.id);
    if (node) {
      for (let i = 0; i < obj.attrs.length; i++) {
        const {attrName, attrValue} = obj.attrs[i];
        node[attrName] = attrValue;
      }
      for (let i = 0; i < obj.components.length; i++) {
        const {id, attrName, attrValue} = obj.components[i];
        const c = node._components.find(c => c._id == id)
        c[attrName] = attrValue;
      }
    }
  }

  function SetGlobalNodeVar(nodeId) {
    const node = getNodeById(nodeId);
    const name = `tmpNode${GlobalVarIndex}`
    globalThis[name] = node;
    console.log(name)
    console.log(node)
    GlobalVarIndex += 1;
  }
  function setGlobalComponentAttrVar(args) {
    const {nodeId, compId, key} = args[0];
    const node = getNodeById(nodeId);
    const c = node._components.find(c => c._id == compId)
    const name = `tmpComp${GlobalVarIndex}${key}`
    globalThis[name] = c[key];
    console.log(name)
    console.log(c[key])
    GlobalVarIndex += 1;
  }

  function setGlobalComponentVar(args) {
    const {nodeId, compId} = args[0];
    const node = getNodeById(nodeId);
    const c = node._components.find(c => c._id == compId)
    const name = `tmpComp${GlobalVarIndex}`
    console.log(name)
    console.log(c)
    GlobalVarIndex += 1;

  }

  function setFrameRate(args){
    const fps = args[0]
    cc.game.setFrameRate(fps);
  }
  function togglePauseGame(){
    if (cc.director.isPaused()) {
      cc.director.resume()
    } else {
      cc.director.pause()
    }
  }
}
