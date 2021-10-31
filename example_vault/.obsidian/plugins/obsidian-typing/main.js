var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a3, b3) => {
  for (var prop in b3 || (b3 = {}))
    if (__hasOwnProp.call(b3, prop))
      __defNormalProp(a3, prop, b3[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b3)) {
      if (__propIsEnum.call(b3, prop))
        __defNormalProp(a3, prop, b3[prop]);
    }
  return a3;
};
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __require = typeof require !== "undefined" ? require : (x4) => {
  throw new Error('Dynamic require of "' + x4 + '" is not supported');
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e3) {
        reject(e3);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e3) {
        reject(e3);
      }
    };
    var step = (x4) => x4.done ? resolve(x4.value) : Promise.resolve(x4.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/main.tsx
__export(exports, {
  default: () => TypingPlugin
});
var import_obsidian8 = __toModule(require("obsidian"));

// node_modules/monkey-around/mjs/index.js
function around(obj, factories) {
  const removers = Object.keys(factories).map((key) => around1(obj, key, factories[key]));
  return removers.length === 1 ? removers[0] : function() {
    removers.forEach((r3) => r3());
  };
}
function around1(obj, method, createWrapper) {
  const original = obj[method], hadOwn = obj.hasOwnProperty(method);
  let current = createWrapper(original);
  if (original)
    Object.setPrototypeOf(current, original);
  Object.setPrototypeOf(wrapper, current);
  obj[method] = wrapper;
  return remove;
  function wrapper(...args) {
    if (current === original && obj[method] === wrapper)
      remove();
    return current.apply(this, args);
  }
  function remove() {
    if (obj[method] === wrapper) {
      if (hadOwn)
        obj[method] = original;
      else
        delete obj[method];
    }
    if (current === original)
      return;
    current = original;
    Object.setPrototypeOf(wrapper, original || Function);
  }
}

// src/marginals.ts
var import_obsidian3 = __toModule(require("obsidian"));

// src/eval.ts
var import_obsidian = __toModule(require("obsidian"));
var EvalContext = class {
  constructor(namespace) {
    this.namespace = namespace;
    this.renderMarkdown = (source, containerEl, sourcePath) => __async(this, null, function* () {
      if (!containerEl) {
        containerEl = this.namespace.containerEl;
      }
      if (!sourcePath) {
        sourcePath = this.namespace.note.path;
      }
      let subcontainerEl = containerEl.createSpan();
      yield import_obsidian.MarkdownRenderer.renderMarkdown(source, subcontainerEl, sourcePath, null);
      let parEl = subcontainerEl.querySelector("p");
      if (subcontainerEl.children.length == 1 && parEl) {
        while (parEl.firstChild) {
          subcontainerEl.appendChild(parEl.firstChild);
        }
        subcontainerEl.removeChild(parEl);
      }
    });
    this.namespace["md"] = this.renderMarkdown;
    this.preamble = "";
    for (let key in namespace) {
      this.preamble += `let ${key} = this.namespace["${key}"];`;
    }
  }
  eval(script) {
    return function() {
      return eval(this.preamble + script);
    }.call(this);
  }
  asyncEval(script2) {
    this.eval("(async () => {" + script2 + "})()");
  }
};

// src/utils.ts
var import_obsidian2 = __toModule(require("obsidian"));
function getFrontmatterLengthInLines(body) {
  let yamlSymbol = "---";
  if (!body.startsWith(yamlSymbol)) {
    return 0;
  }
  let yamlEndSymbolIndex = body.indexOf(yamlSymbol, 3);
  let yamlEndIndex = body.indexOf("\n", yamlEndSymbolIndex);
  let frontmatter = body.substring(0, yamlEndIndex);
  return frontmatter.split("\n").length;
}
function getFirstSignificantLineNumber(body) {
  let fmLength = getFrontmatterLengthInLines(body);
  let lines = body.split("\n");
  for (let i3 = fmLength; i3 < lines.length; i3++) {
    if (lines[i3].trim()) {
      return i3;
    }
  }
  return lines.length;
}
function gracefullyAlert(message) {
  new import_obsidian2.Notice("Typing: " + message);
  console.log("Typing: " + message);
}
var hideInlineFields = (el, ctx2) => {
  let parNodes = el.querySelectorAll("p");
  for (let i3 = 0; i3 < parNodes.length; i3++) {
    let par = parNodes[i3];
    let parChildren = par.childNodes;
    let childrenToRemove = [];
    for (let j4 = 0; j4 < parChildren.length; j4++) {
      let child = parChildren[j4];
      if (child.nodeType == 3 && child.textContent.match(/^\s*[0-9\w\p{Letter}][-0-9\w\p{Letter}]*\s*::/u)) {
        for (let k4 = j4; k4 < parChildren.length; k4++) {
          childrenToRemove.push(parChildren[k4]);
          if (parChildren[k4].nodeName == "BR") {
            break;
          }
        }
      }
    }
    for (let child of childrenToRemove) {
      par.removeChild(child);
    }
  }
};

// src/marginals.ts
var HEADER_CODEBLOCK_LANGUAGE = "typing-header";
var FOOTER_CODEBLOCK_LANGUAGE = "typing-footer";
var HEADER_CODEBLOCK = `\`\`\`${HEADER_CODEBLOCK_LANGUAGE}
\`\`\`
`;
var FOOTER_CODEBLOCK = `
\`\`\`${FOOTER_CODEBLOCK_LANGUAGE}
\`\`\``;
var TIMEOUT = 1e3;
var MarginalSection = class extends import_obsidian3.MarkdownRenderChild {
  constructor(containerEl, script2, plugin, ctx2, kind, namespace) {
    super(containerEl);
    this.script = script2;
    this.plugin = plugin;
    this.ctx = ctx2;
    this.kind = kind;
    this.namespace = namespace;
    this.shouldUpdate = false;
    this.canUpdate = true;
    this.onMetadataChange = (op, file) => {
      this.update();
    };
    this.update = () => {
      if (this.canUpdate) {
        this.shouldUpdate = false;
        this.hide();
        this.show();
        this.canUpdate = false;
        setTimeout(() => {
          this.canUpdate = true;
          if (this.shouldUpdate) {
            this.update();
          }
        }, TIMEOUT);
      } else {
        this.shouldUpdate = true;
      }
    };
    this.show = () => __async(this, null, function* () {
      if (this.kind == "js") {
        let scriptContext = new EvalContext(__spreadValues({
          containerEl: this.containerEl
        }, this.namespace));
        scriptContext.asyncEval(this.script);
      } else {
        import_obsidian3.MarkdownRenderer.renderMarkdown(this.script, this.containerEl, this.ctx.sourcePath, null);
      }
    });
    this.hide = () => {
      while (this.containerEl.firstChild) {
        this.containerEl.removeChild(this.containerEl.firstChild);
      }
    };
  }
  onload() {
    this.registerEvent(this.plugin.app.metadataCache.on("dataview:metadata-change", this.onMetadataChange));
    this.update();
  }
  onunload() {
  }
};
function marginalsPostProcessor(plugin) {
  return (el, ctx2) => __async(this, null, function* () {
    let info = ctx2.getSectionInfo(el);
    if (!info) {
      return;
    }
    let type = plugin.asTyped(ctx2.sourcePath);
    if (!type) {
      return;
    }
    if (!type.header && !type.footer) {
      return;
    }
    if (info.text.contains(HEADER_CODEBLOCK) || info.text.contains(FOOTER_CODEBLOCK)) {
      return;
    }
    let lastLine = (info.text.trimRight().match(/\n/g) || "").length;
    let isLastLine = lastLine === info.lineEnd;
    let isFirstLine = getFirstSignificantLineNumber(info.text) == info.lineStart;
    if (!isLastLine && !isFirstLine) {
      return;
    }
    if (isLastLine && type.footer) {
      let containerEl = el.createDiv({ cls: "typing-footer" });
      ctx2.addChild(new MarginalSection(containerEl, type.footer.source, plugin, ctx2, type.footer.kind, plugin.getDefaultContext(type)));
    }
    if (isFirstLine && type.header) {
      let containerEl = el.createDiv({ cls: "typing-header" });
      el.insertBefore(containerEl, el.firstChild);
      ctx2.addChild(new MarginalSection(containerEl, type.header.source, plugin, ctx2, type.header.kind, plugin.getDefaultContext(type)));
    }
  });
}
function monkeyPatchPreviewView(plugin) {
  plugin.register(around(import_obsidian3.MarkdownPreviewView.prototype, {
    get(oldMethod) {
      return function(...args) {
        let result = oldMethod && oldMethod.apply(this, args);
        result = result.replaceAll(HEADER_CODEBLOCK, "");
        result = result.replaceAll(FOOTER_CODEBLOCK, "");
        return result;
      };
    },
    set(oldMethod) {
      return function(...args) {
        args[0] = injectHeader(args[0], HEADER_CODEBLOCK);
        args[0] = args[0] + FOOTER_CODEBLOCK;
        const result = oldMethod && oldMethod.apply(this, args);
        return result;
      };
    }
  }));
}
function registerMarginalsPostProcessors(plugin) {
  plugin.registerMarkdownCodeBlockProcessor(HEADER_CODEBLOCK_LANGUAGE, (source, el, ctx2) => __async(this, null, function* () {
    let type = plugin.asTyped(ctx2.sourcePath);
    if (!type) {
      return;
    }
    if (!type.header) {
      return;
    }
    let containerEl = el.createDiv({ cls: "typing-header" });
    ctx2.addChild(new MarginalSection(containerEl, type.header.source, plugin, ctx2, type.header.kind, plugin.getDefaultContext(type)));
  }));
  plugin.registerMarkdownCodeBlockProcessor(FOOTER_CODEBLOCK_LANGUAGE, (source, el, ctx2) => __async(this, null, function* () {
    let type = plugin.asTyped(ctx2.sourcePath);
    if (!type) {
      return;
    }
    if (!type.footer) {
      return;
    }
    let containerEl = el.createDiv({ cls: "typing-footer" });
    ctx2.addChild(new MarginalSection(containerEl, type.footer.source, plugin, ctx2, type.footer.kind, plugin.getDefaultContext(type)));
  }));
  let postProcess = marginalsPostProcessor(plugin);
  postProcess.sortOrder = -1e3;
  plugin.registerMarkdownPostProcessor(postProcess);
}
function injectHeader(body, header) {
  let yamlSymbol = "---";
  if (!body.startsWith(yamlSymbol)) {
    return HEADER_CODEBLOCK + body;
  }
  let yamlEndSymbolIndex = body.indexOf(yamlSymbol, 3);
  let yamlEndIndex = body.indexOf("\n", yamlEndSymbolIndex);
  let frontmatter = body.substring(0, yamlEndIndex + 1);
  let note = body.substring(yamlEndIndex + 1);
  return frontmatter + HEADER_CODEBLOCK + note;
}

// src/modals.tsx
var import_obsidian4 = __toModule(require("obsidian"));

// node_modules/preact/dist/preact.mjs
var n;
var l;
var u;
var i;
var t;
var r;
var o;
var f;
var e = {};
var c = [];
var s = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function a(n2, l3) {
  for (var u3 in l3)
    n2[u3] = l3[u3];
  return n2;
}
function h(n2) {
  var l3 = n2.parentNode;
  l3 && l3.removeChild(n2);
}
function v(l3, u3, i3) {
  var t3, r3, o3, f3 = {};
  for (o3 in u3)
    o3 == "key" ? t3 = u3[o3] : o3 == "ref" ? r3 = u3[o3] : f3[o3] = u3[o3];
  if (arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : i3), typeof l3 == "function" && l3.defaultProps != null)
    for (o3 in l3.defaultProps)
      f3[o3] === void 0 && (f3[o3] = l3.defaultProps[o3]);
  return y(l3, f3, t3, r3, null);
}
function y(n2, i3, t3, r3, o3) {
  var f3 = { type: n2, props: i3, key: t3, ref: r3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: o3 == null ? ++u : o3 };
  return o3 == null && l.vnode != null && l.vnode(f3), f3;
}
function p() {
  return { current: null };
}
function d(n2) {
  return n2.children;
}
function _(n2, l3) {
  this.props = n2, this.context = l3;
}
function k(n2, l3) {
  if (l3 == null)
    return n2.__ ? k(n2.__, n2.__.__k.indexOf(n2) + 1) : null;
  for (var u3; l3 < n2.__k.length; l3++)
    if ((u3 = n2.__k[l3]) != null && u3.__e != null)
      return u3.__e;
  return typeof n2.type == "function" ? k(n2) : null;
}
function b(n2) {
  var l3, u3;
  if ((n2 = n2.__) != null && n2.__c != null) {
    for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
      if ((u3 = n2.__k[l3]) != null && u3.__e != null) {
        n2.__e = n2.__c.base = u3.__e;
        break;
      }
    return b(n2);
  }
}
function m(n2) {
  (!n2.__d && (n2.__d = true) && t.push(n2) && !g.__r++ || o !== l.debounceRendering) && ((o = l.debounceRendering) || r)(g);
}
function g() {
  for (var n2; g.__r = t.length; )
    n2 = t.sort(function(n3, l3) {
      return n3.__v.__b - l3.__v.__b;
    }), t = [], n2.some(function(n3) {
      var l3, u3, i3, t3, r3, o3;
      n3.__d && (r3 = (t3 = (l3 = n3).__v).__e, (o3 = l3.__P) && (u3 = [], (i3 = a({}, t3)).__v = t3.__v + 1, j(o3, t3, i3, l3.__n, o3.ownerSVGElement !== void 0, t3.__h != null ? [r3] : null, u3, r3 == null ? k(t3) : r3, t3.__h), z(u3, t3), t3.__e != r3 && b(t3)));
    });
}
function w(n2, l3, u3, i3, t3, r3, o3, f3, s3, a3) {
  var h3, v3, p3, _3, b3, m3, g4, w4 = i3 && i3.__k || c, A4 = w4.length;
  for (u3.__k = [], h3 = 0; h3 < l3.length; h3++)
    if ((_3 = u3.__k[h3] = (_3 = l3[h3]) == null || typeof _3 == "boolean" ? null : typeof _3 == "string" || typeof _3 == "number" || typeof _3 == "bigint" ? y(null, _3, null, null, _3) : Array.isArray(_3) ? y(d, { children: _3 }, null, null, null) : _3.__b > 0 ? y(_3.type, _3.props, _3.key, null, _3.__v) : _3) != null) {
      if (_3.__ = u3, _3.__b = u3.__b + 1, (p3 = w4[h3]) === null || p3 && _3.key == p3.key && _3.type === p3.type)
        w4[h3] = void 0;
      else
        for (v3 = 0; v3 < A4; v3++) {
          if ((p3 = w4[v3]) && _3.key == p3.key && _3.type === p3.type) {
            w4[v3] = void 0;
            break;
          }
          p3 = null;
        }
      j(n2, _3, p3 = p3 || e, t3, r3, o3, f3, s3, a3), b3 = _3.__e, (v3 = _3.ref) && p3.ref != v3 && (g4 || (g4 = []), p3.ref && g4.push(p3.ref, null, _3), g4.push(v3, _3.__c || b3, _3)), b3 != null ? (m3 == null && (m3 = b3), typeof _3.type == "function" && _3.__k === p3.__k ? _3.__d = s3 = x(_3, s3, n2) : s3 = P(n2, _3, p3, w4, b3, s3), typeof u3.type == "function" && (u3.__d = s3)) : s3 && p3.__e == s3 && s3.parentNode != n2 && (s3 = k(p3));
    }
  for (u3.__e = m3, h3 = A4; h3--; )
    w4[h3] != null && (typeof u3.type == "function" && w4[h3].__e != null && w4[h3].__e == u3.__d && (u3.__d = k(i3, h3 + 1)), N(w4[h3], w4[h3]));
  if (g4)
    for (h3 = 0; h3 < g4.length; h3++)
      M(g4[h3], g4[++h3], g4[++h3]);
}
function x(n2, l3, u3) {
  for (var i3, t3 = n2.__k, r3 = 0; t3 && r3 < t3.length; r3++)
    (i3 = t3[r3]) && (i3.__ = n2, l3 = typeof i3.type == "function" ? x(i3, l3, u3) : P(u3, i3, i3, t3, i3.__e, l3));
  return l3;
}
function A(n2, l3) {
  return l3 = l3 || [], n2 == null || typeof n2 == "boolean" || (Array.isArray(n2) ? n2.some(function(n3) {
    A(n3, l3);
  }) : l3.push(n2)), l3;
}
function P(n2, l3, u3, i3, t3, r3) {
  var o3, f3, e3;
  if (l3.__d !== void 0)
    o3 = l3.__d, l3.__d = void 0;
  else if (u3 == null || t3 != r3 || t3.parentNode == null)
    n:
      if (r3 == null || r3.parentNode !== n2)
        n2.appendChild(t3), o3 = null;
      else {
        for (f3 = r3, e3 = 0; (f3 = f3.nextSibling) && e3 < i3.length; e3 += 2)
          if (f3 == t3)
            break n;
        n2.insertBefore(t3, r3), o3 = r3;
      }
  return o3 !== void 0 ? o3 : t3.nextSibling;
}
function C(n2, l3, u3, i3, t3) {
  var r3;
  for (r3 in u3)
    r3 === "children" || r3 === "key" || r3 in l3 || H(n2, r3, null, u3[r3], i3);
  for (r3 in l3)
    t3 && typeof l3[r3] != "function" || r3 === "children" || r3 === "key" || r3 === "value" || r3 === "checked" || u3[r3] === l3[r3] || H(n2, r3, l3[r3], u3[r3], i3);
}
function $(n2, l3, u3) {
  l3[0] === "-" ? n2.setProperty(l3, u3) : n2[l3] = u3 == null ? "" : typeof u3 != "number" || s.test(l3) ? u3 : u3 + "px";
}
function H(n2, l3, u3, i3, t3) {
  var r3;
  n:
    if (l3 === "style")
      if (typeof u3 == "string")
        n2.style.cssText = u3;
      else {
        if (typeof i3 == "string" && (n2.style.cssText = i3 = ""), i3)
          for (l3 in i3)
            u3 && l3 in u3 || $(n2.style, l3, "");
        if (u3)
          for (l3 in u3)
            i3 && u3[l3] === i3[l3] || $(n2.style, l3, u3[l3]);
      }
    else if (l3[0] === "o" && l3[1] === "n")
      r3 = l3 !== (l3 = l3.replace(/Capture$/, "")), l3 = l3.toLowerCase() in n2 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u3, u3 ? i3 || n2.addEventListener(l3, r3 ? T : I, r3) : n2.removeEventListener(l3, r3 ? T : I, r3);
    else if (l3 !== "dangerouslySetInnerHTML") {
      if (t3)
        l3 = l3.replace(/xlink[H:h]/, "h").replace(/sName$/, "s");
      else if (l3 !== "href" && l3 !== "list" && l3 !== "form" && l3 !== "tabIndex" && l3 !== "download" && l3 in n2)
        try {
          n2[l3] = u3 == null ? "" : u3;
          break n;
        } catch (n3) {
        }
      typeof u3 == "function" || (u3 != null && (u3 !== false || l3[0] === "a" && l3[1] === "r") ? n2.setAttribute(l3, u3) : n2.removeAttribute(l3));
    }
}
function I(n2) {
  this.l[n2.type + false](l.event ? l.event(n2) : n2);
}
function T(n2) {
  this.l[n2.type + true](l.event ? l.event(n2) : n2);
}
function j(n2, u3, i3, t3, r3, o3, f3, e3, c3) {
  var s3, h3, v3, y3, p3, k4, b3, m3, g4, x4, A4, P3 = u3.type;
  if (u3.constructor !== void 0)
    return null;
  i3.__h != null && (c3 = i3.__h, e3 = u3.__e = i3.__e, u3.__h = null, o3 = [e3]), (s3 = l.__b) && s3(u3);
  try {
    n:
      if (typeof P3 == "function") {
        if (m3 = u3.props, g4 = (s3 = P3.contextType) && t3[s3.__c], x4 = s3 ? g4 ? g4.props.value : s3.__ : t3, i3.__c ? b3 = (h3 = u3.__c = i3.__c).__ = h3.__E : ("prototype" in P3 && P3.prototype.render ? u3.__c = h3 = new P3(m3, x4) : (u3.__c = h3 = new _(m3, x4), h3.constructor = P3, h3.render = O), g4 && g4.sub(h3), h3.props = m3, h3.state || (h3.state = {}), h3.context = x4, h3.__n = t3, v3 = h3.__d = true, h3.__h = []), h3.__s == null && (h3.__s = h3.state), P3.getDerivedStateFromProps != null && (h3.__s == h3.state && (h3.__s = a({}, h3.__s)), a(h3.__s, P3.getDerivedStateFromProps(m3, h3.__s))), y3 = h3.props, p3 = h3.state, v3)
          P3.getDerivedStateFromProps == null && h3.componentWillMount != null && h3.componentWillMount(), h3.componentDidMount != null && h3.__h.push(h3.componentDidMount);
        else {
          if (P3.getDerivedStateFromProps == null && m3 !== y3 && h3.componentWillReceiveProps != null && h3.componentWillReceiveProps(m3, x4), !h3.__e && h3.shouldComponentUpdate != null && h3.shouldComponentUpdate(m3, h3.__s, x4) === false || u3.__v === i3.__v) {
            h3.props = m3, h3.state = h3.__s, u3.__v !== i3.__v && (h3.__d = false), h3.__v = u3, u3.__e = i3.__e, u3.__k = i3.__k, u3.__k.forEach(function(n3) {
              n3 && (n3.__ = u3);
            }), h3.__h.length && f3.push(h3);
            break n;
          }
          h3.componentWillUpdate != null && h3.componentWillUpdate(m3, h3.__s, x4), h3.componentDidUpdate != null && h3.__h.push(function() {
            h3.componentDidUpdate(y3, p3, k4);
          });
        }
        h3.context = x4, h3.props = m3, h3.state = h3.__s, (s3 = l.__r) && s3(u3), h3.__d = false, h3.__v = u3, h3.__P = n2, s3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s, h3.getChildContext != null && (t3 = a(a({}, t3), h3.getChildContext())), v3 || h3.getSnapshotBeforeUpdate == null || (k4 = h3.getSnapshotBeforeUpdate(y3, p3)), A4 = s3 != null && s3.type === d && s3.key == null ? s3.props.children : s3, w(n2, Array.isArray(A4) ? A4 : [A4], u3, i3, t3, r3, o3, f3, e3, c3), h3.base = u3.__e, u3.__h = null, h3.__h.length && f3.push(h3), b3 && (h3.__E = h3.__ = null), h3.__e = false;
      } else
        o3 == null && u3.__v === i3.__v ? (u3.__k = i3.__k, u3.__e = i3.__e) : u3.__e = L(i3.__e, u3, i3, t3, r3, o3, f3, c3);
    (s3 = l.diffed) && s3(u3);
  } catch (n3) {
    u3.__v = null, (c3 || o3 != null) && (u3.__e = e3, u3.__h = !!c3, o3[o3.indexOf(e3)] = null), l.__e(n3, u3, i3);
  }
}
function z(n2, u3) {
  l.__c && l.__c(u3, n2), n2.some(function(u4) {
    try {
      n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
        n3.call(u4);
      });
    } catch (n3) {
      l.__e(n3, u4.__v);
    }
  });
}
function L(l3, u3, i3, t3, r3, o3, f3, c3) {
  var s3, a3, v3, y3 = i3.props, p3 = u3.props, d3 = u3.type, _3 = 0;
  if (d3 === "svg" && (r3 = true), o3 != null) {
    for (; _3 < o3.length; _3++)
      if ((s3 = o3[_3]) && (s3 === l3 || (d3 ? s3.localName == d3 : s3.nodeType == 3))) {
        l3 = s3, o3[_3] = null;
        break;
      }
  }
  if (l3 == null) {
    if (d3 === null)
      return document.createTextNode(p3);
    l3 = r3 ? document.createElementNS("http://www.w3.org/2000/svg", d3) : document.createElement(d3, p3.is && p3), o3 = null, c3 = false;
  }
  if (d3 === null)
    y3 === p3 || c3 && l3.data === p3 || (l3.data = p3);
  else {
    if (o3 = o3 && n.call(l3.childNodes), a3 = (y3 = i3.props || e).dangerouslySetInnerHTML, v3 = p3.dangerouslySetInnerHTML, !c3) {
      if (o3 != null)
        for (y3 = {}, _3 = 0; _3 < l3.attributes.length; _3++)
          y3[l3.attributes[_3].name] = l3.attributes[_3].value;
      (v3 || a3) && (v3 && (a3 && v3.__html == a3.__html || v3.__html === l3.innerHTML) || (l3.innerHTML = v3 && v3.__html || ""));
    }
    if (C(l3, p3, y3, r3, c3), v3)
      u3.__k = [];
    else if (_3 = u3.props.children, w(l3, Array.isArray(_3) ? _3 : [_3], u3, i3, t3, r3 && d3 !== "foreignObject", o3, f3, o3 ? o3[0] : i3.__k && k(i3, 0), c3), o3 != null)
      for (_3 = o3.length; _3--; )
        o3[_3] != null && h(o3[_3]);
    c3 || ("value" in p3 && (_3 = p3.value) !== void 0 && (_3 !== l3.value || d3 === "progress" && !_3) && H(l3, "value", _3, y3.value, false), "checked" in p3 && (_3 = p3.checked) !== void 0 && _3 !== l3.checked && H(l3, "checked", _3, y3.checked, false));
  }
  return l3;
}
function M(n2, u3, i3) {
  try {
    typeof n2 == "function" ? n2(u3) : n2.current = u3;
  } catch (n3) {
    l.__e(n3, i3);
  }
}
function N(n2, u3, i3) {
  var t3, r3;
  if (l.unmount && l.unmount(n2), (t3 = n2.ref) && (t3.current && t3.current !== n2.__e || M(t3, null, u3)), (t3 = n2.__c) != null) {
    if (t3.componentWillUnmount)
      try {
        t3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
    t3.base = t3.__P = null;
  }
  if (t3 = n2.__k)
    for (r3 = 0; r3 < t3.length; r3++)
      t3[r3] && N(t3[r3], u3, typeof n2.type != "function");
  i3 || n2.__e == null || h(n2.__e), n2.__e = n2.__d = void 0;
}
function O(n2, l3, u3) {
  return this.constructor(n2, u3);
}
function S(u3, i3, t3) {
  var r3, o3, f3;
  l.__ && l.__(u3, i3), o3 = (r3 = typeof t3 == "function") ? null : t3 && t3.__k || i3.__k, f3 = [], j(i3, u3 = (!r3 && t3 || i3).__k = v(d, null, [u3]), o3 || e, e, i3.ownerSVGElement !== void 0, !r3 && t3 ? [t3] : o3 ? null : i3.firstChild ? n.call(i3.childNodes) : null, f3, !r3 && t3 ? t3 : o3 ? o3.__e : i3.firstChild, r3), z(f3, u3);
}
function q(n2, l3) {
  S(n2, l3, q);
}
function B(l3, u3, i3) {
  var t3, r3, o3, f3 = a({}, l3.props);
  for (o3 in u3)
    o3 == "key" ? t3 = u3[o3] : o3 == "ref" ? r3 = u3[o3] : f3[o3] = u3[o3];
  return arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : i3), y(l3.type, f3, t3 || l3.key, r3 || l3.ref, null);
}
function D(n2, l3) {
  var u3 = { __c: l3 = "__cC" + f++, __: n2, Consumer: function(n3, l4) {
    return n3.children(l4);
  }, Provider: function(n3) {
    var u4, i3;
    return this.getChildContext || (u4 = [], (i3 = {})[l3] = this, this.getChildContext = function() {
      return i3;
    }, this.shouldComponentUpdate = function(n4) {
      this.props.value !== n4.value && u4.some(m);
    }, this.sub = function(n4) {
      u4.push(n4);
      var l4 = n4.componentWillUnmount;
      n4.componentWillUnmount = function() {
        u4.splice(u4.indexOf(n4), 1), l4 && l4.call(n4);
      };
    }), n3.children;
  } };
  return u3.Provider.__ = u3.Consumer.contextType = u3;
}
n = c.slice, l = { __e: function(n2, l3) {
  for (var u3, i3, t3; l3 = l3.__; )
    if ((u3 = l3.__c) && !u3.__)
      try {
        if ((i3 = u3.constructor) && i3.getDerivedStateFromError != null && (u3.setState(i3.getDerivedStateFromError(n2)), t3 = u3.__d), u3.componentDidCatch != null && (u3.componentDidCatch(n2), t3 = u3.__d), t3)
          return u3.__E = u3;
      } catch (l4) {
        n2 = l4;
      }
  throw n2;
} }, u = 0, i = function(n2) {
  return n2 != null && n2.constructor === void 0;
}, _.prototype.setState = function(n2, l3) {
  var u3;
  u3 = this.__s != null && this.__s !== this.state ? this.__s : this.__s = a({}, this.state), typeof n2 == "function" && (n2 = n2(a({}, u3), this.props)), n2 && a(u3, n2), n2 != null && this.__v && (l3 && this.__h.push(l3), m(this));
}, _.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), m(this));
}, _.prototype.render = d, t = [], r = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, g.__r = 0, f = 0;

// node_modules/preact/hooks/dist/hooks.mjs
var t2;
var u2;
var r2;
var o2 = 0;
var i2 = [];
var c2 = l.__b;
var f2 = l.__r;
var e2 = l.diffed;
var a2 = l.__c;
var v2 = l.unmount;
function m2(t3, r3) {
  l.__h && l.__h(u2, t3, o2 || r3), o2 = 0;
  var i3 = u2.__H || (u2.__H = { __: [], __h: [] });
  return t3 >= i3.__.length && i3.__.push({}), i3.__[t3];
}
function l2(n2) {
  return o2 = 1, p2(w2, n2);
}
function p2(n2, r3, o3) {
  var i3 = m2(t2++, 2);
  return i3.t = n2, i3.__c || (i3.__ = [o3 ? o3(r3) : w2(void 0, r3), function(n3) {
    var t3 = i3.t(i3.__[0], n3);
    i3.__[0] !== t3 && (i3.__ = [t3, i3.__[1]], i3.__c.setState({}));
  }], i3.__c = u2), i3.__;
}
function y2(r3, o3) {
  var i3 = m2(t2++, 3);
  !l.__s && k2(i3.__H, o3) && (i3.__ = r3, i3.__H = o3, u2.__H.__h.push(i3));
}
function h2(r3, o3) {
  var i3 = m2(t2++, 4);
  !l.__s && k2(i3.__H, o3) && (i3.__ = r3, i3.__H = o3, u2.__h.push(i3));
}
function s2(n2) {
  return o2 = 5, A2(function() {
    return { current: n2 };
  }, []);
}
function _2(n2, t3, u3) {
  o2 = 6, h2(function() {
    typeof n2 == "function" ? n2(t3()) : n2 && (n2.current = t3());
  }, u3 == null ? u3 : u3.concat(n2));
}
function A2(n2, u3) {
  var r3 = m2(t2++, 7);
  return k2(r3.__H, u3) && (r3.__ = n2(), r3.__H = u3, r3.__h = n2), r3.__;
}
function F(n2, t3) {
  return o2 = 8, A2(function() {
    return n2;
  }, t3);
}
function T2(n2) {
  var r3 = u2.context[n2.__c], o3 = m2(t2++, 9);
  return o3.c = n2, r3 ? (o3.__ == null && (o3.__ = true, r3.sub(u2)), r3.props.value) : n2.__;
}
function d2(t3, u3) {
  l.useDebugValue && l.useDebugValue(u3 ? u3(t3) : t3);
}
function x2() {
  i2.forEach(function(t3) {
    if (t3.__P)
      try {
        t3.__H.__h.forEach(g2), t3.__H.__h.forEach(j2), t3.__H.__h = [];
      } catch (u3) {
        t3.__H.__h = [], l.__e(u3, t3.__v);
      }
  }), i2 = [];
}
l.__b = function(n2) {
  u2 = null, c2 && c2(n2);
}, l.__r = function(n2) {
  f2 && f2(n2), t2 = 0;
  var r3 = (u2 = n2.__c).__H;
  r3 && (r3.__h.forEach(g2), r3.__h.forEach(j2), r3.__h = []);
}, l.diffed = function(t3) {
  e2 && e2(t3);
  var o3 = t3.__c;
  o3 && o3.__H && o3.__H.__h.length && (i2.push(o3) !== 1 && r2 === l.requestAnimationFrame || ((r2 = l.requestAnimationFrame) || function(n2) {
    var t4, u3 = function() {
      clearTimeout(r3), b2 && cancelAnimationFrame(t4), setTimeout(n2);
    }, r3 = setTimeout(u3, 100);
    b2 && (t4 = requestAnimationFrame(u3));
  })(x2)), u2 = null;
}, l.__c = function(t3, u3) {
  u3.some(function(t4) {
    try {
      t4.__h.forEach(g2), t4.__h = t4.__h.filter(function(n2) {
        return !n2.__ || j2(n2);
      });
    } catch (r3) {
      u3.some(function(n2) {
        n2.__h && (n2.__h = []);
      }), u3 = [], l.__e(r3, t4.__v);
    }
  }), a2 && a2(t3, u3);
}, l.unmount = function(t3) {
  v2 && v2(t3);
  var u3 = t3.__c;
  if (u3 && u3.__H)
    try {
      u3.__H.__.forEach(g2);
    } catch (t4) {
      l.__e(t4, u3.__v);
    }
};
var b2 = typeof requestAnimationFrame == "function";
function g2(n2) {
  var t3 = u2;
  typeof n2.__c == "function" && n2.__c(), u2 = t3;
}
function j2(n2) {
  var t3 = u2;
  n2.__c = n2.__(), u2 = t3;
}
function k2(n2, t3) {
  return !n2 || n2.length !== t3.length || t3.some(function(t4, u3) {
    return t4 !== n2[u3];
  });
}
function w2(n2, t3) {
  return typeof t3 == "function" ? t3(n2) : t3;
}

// node_modules/preact/compat/dist/compat.mjs
function S2(n2, t3) {
  for (var e3 in t3)
    n2[e3] = t3[e3];
  return n2;
}
function C2(n2, t3) {
  for (var e3 in n2)
    if (e3 !== "__source" && !(e3 in t3))
      return true;
  for (var r3 in t3)
    if (r3 !== "__source" && n2[r3] !== t3[r3])
      return true;
  return false;
}
function E(n2) {
  this.props = n2;
}
function g3(n2, t3) {
  function e3(n3) {
    var e4 = this.props.ref, r4 = e4 == n3.ref;
    return !r4 && e4 && (e4.call ? e4(null) : e4.current = null), t3 ? !t3(this.props, n3) || !r4 : C2(this.props, n3);
  }
  function r3(t4) {
    return this.shouldComponentUpdate = e3, v(n2, t4);
  }
  return r3.displayName = "Memo(" + (n2.displayName || n2.name) + ")", r3.prototype.isReactComponent = true, r3.__f = true, r3;
}
(E.prototype = new _()).isPureReactComponent = true, E.prototype.shouldComponentUpdate = function(n2, t3) {
  return C2(this.props, n2) || C2(this.state, t3);
};
var w3 = l.__b;
l.__b = function(n2) {
  n2.type && n2.type.__f && n2.ref && (n2.props.ref = n2.ref, n2.ref = null), w3 && w3(n2);
};
var R = typeof Symbol != "undefined" && Symbol.for && Symbol.for("react.forward_ref") || 3911;
function x3(n2) {
  function t3(t4, e3) {
    var r3 = S2({}, t4);
    return delete r3.ref, n2(r3, (e3 = t4.ref || e3) && (typeof e3 != "object" || "current" in e3) ? e3 : null);
  }
  return t3.$$typeof = R, t3.render = t3, t3.prototype.isReactComponent = t3.__f = true, t3.displayName = "ForwardRef(" + (n2.displayName || n2.name) + ")", t3;
}
var N2 = function(n2, t3) {
  return n2 == null ? null : A(A(n2).map(t3));
};
var k3 = { map: N2, forEach: N2, count: function(n2) {
  return n2 ? A(n2).length : 0;
}, only: function(n2) {
  var t3 = A(n2);
  if (t3.length !== 1)
    throw "Children.only";
  return t3[0];
}, toArray: A };
var A3 = l.__e;
l.__e = function(n2, t3, e3) {
  if (n2.then) {
    for (var r3, u3 = t3; u3 = u3.__; )
      if ((r3 = u3.__c) && r3.__c)
        return t3.__e == null && (t3.__e = e3.__e, t3.__k = e3.__k), r3.__c(n2, t3);
  }
  A3(n2, t3, e3);
};
var O2 = l.unmount;
function L2() {
  this.__u = 0, this.t = null, this.__b = null;
}
function U(n2) {
  var t3 = n2.__.__c;
  return t3 && t3.__e && t3.__e(n2);
}
function F2(n2) {
  var t3, e3, r3;
  function u3(u4) {
    if (t3 || (t3 = n2()).then(function(n3) {
      e3 = n3.default || n3;
    }, function(n3) {
      r3 = n3;
    }), r3)
      throw r3;
    if (!e3)
      throw t3;
    return v(e3, u4);
  }
  return u3.displayName = "Lazy", u3.__f = true, u3;
}
function M2() {
  this.u = null, this.o = null;
}
l.unmount = function(n2) {
  var t3 = n2.__c;
  t3 && t3.__R && t3.__R(), t3 && n2.__h === true && (n2.type = null), O2 && O2(n2);
}, (L2.prototype = new _()).__c = function(n2, t3) {
  var e3 = t3.__c, r3 = this;
  r3.t == null && (r3.t = []), r3.t.push(e3);
  var u3 = U(r3.__v), o3 = false, i3 = function() {
    o3 || (o3 = true, e3.__R = null, u3 ? u3(l3) : l3());
  };
  e3.__R = i3;
  var l3 = function() {
    if (!--r3.__u) {
      if (r3.state.__e) {
        var n3 = r3.state.__e;
        r3.__v.__k[0] = function n4(t5, e4, r4) {
          return t5 && (t5.__v = null, t5.__k = t5.__k && t5.__k.map(function(t6) {
            return n4(t6, e4, r4);
          }), t5.__c && t5.__c.__P === e4 && (t5.__e && r4.insertBefore(t5.__e, t5.__d), t5.__c.__e = true, t5.__c.__P = r4)), t5;
        }(n3, n3.__c.__P, n3.__c.__O);
      }
      var t4;
      for (r3.setState({ __e: r3.__b = null }); t4 = r3.t.pop(); )
        t4.forceUpdate();
    }
  }, c3 = t3.__h === true;
  r3.__u++ || c3 || r3.setState({ __e: r3.__b = r3.__v.__k[0] }), n2.then(i3, i3);
}, L2.prototype.componentWillUnmount = function() {
  this.t = [];
}, L2.prototype.render = function(n2, t3) {
  if (this.__b) {
    if (this.__v.__k) {
      var e3 = document.createElement("div"), r3 = this.__v.__k[0].__c;
      this.__v.__k[0] = function n3(t4, e4, r4) {
        return t4 && (t4.__c && t4.__c.__H && (t4.__c.__H.__.forEach(function(n4) {
          typeof n4.__c == "function" && n4.__c();
        }), t4.__c.__H = null), (t4 = S2({}, t4)).__c != null && (t4.__c.__P === r4 && (t4.__c.__P = e4), t4.__c = null), t4.__k = t4.__k && t4.__k.map(function(t5) {
          return n3(t5, e4, r4);
        })), t4;
      }(this.__b, e3, r3.__O = r3.__P);
    }
    this.__b = null;
  }
  var u3 = t3.__e && v(d, null, n2.fallback);
  return u3 && (u3.__h = null), [v(d, null, t3.__e ? null : n2.children), u3];
};
var T3 = function(n2, t3, e3) {
  if (++e3[1] === e3[0] && n2.o.delete(t3), n2.props.revealOrder && (n2.props.revealOrder[0] !== "t" || !n2.o.size))
    for (e3 = n2.u; e3; ) {
      for (; e3.length > 3; )
        e3.pop()();
      if (e3[1] < e3[0])
        break;
      n2.u = e3 = e3[2];
    }
};
function D2(n2) {
  return this.getChildContext = function() {
    return n2.context;
  }, n2.children;
}
function I2(n2) {
  var t3 = this, e3 = n2.i;
  t3.componentWillUnmount = function() {
    S(null, t3.l), t3.l = null, t3.i = null;
  }, t3.i && t3.i !== e3 && t3.componentWillUnmount(), n2.__v ? (t3.l || (t3.i = e3, t3.l = { nodeType: 1, parentNode: e3, childNodes: [], appendChild: function(n3) {
    this.childNodes.push(n3), t3.i.appendChild(n3);
  }, insertBefore: function(n3, e4) {
    this.childNodes.push(n3), t3.i.appendChild(n3);
  }, removeChild: function(n3) {
    this.childNodes.splice(this.childNodes.indexOf(n3) >>> 1, 1), t3.i.removeChild(n3);
  } }), S(v(D2, { context: t3.context }, n2.__v), t3.l)) : t3.l && t3.componentWillUnmount();
}
function W(n2, t3) {
  return v(I2, { __v: n2, i: t3 });
}
(M2.prototype = new _()).__e = function(n2) {
  var t3 = this, e3 = U(t3.__v), r3 = t3.o.get(n2);
  return r3[0]++, function(u3) {
    var o3 = function() {
      t3.props.revealOrder ? (r3.push(u3), T3(t3, n2, r3)) : u3();
    };
    e3 ? e3(o3) : o3();
  };
}, M2.prototype.render = function(n2) {
  this.u = null, this.o = new Map();
  var t3 = A(n2.children);
  n2.revealOrder && n2.revealOrder[0] === "b" && t3.reverse();
  for (var e3 = t3.length; e3--; )
    this.o.set(t3[e3], this.u = [1, 0, this.u]);
  return n2.children;
}, M2.prototype.componentDidUpdate = M2.prototype.componentDidMount = function() {
  var n2 = this;
  this.o.forEach(function(t3, e3) {
    T3(n2, e3, t3);
  });
};
var j3 = typeof Symbol != "undefined" && Symbol.for && Symbol.for("react.element") || 60103;
var P2 = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|marker(?!H|W|U)|overline|paint|stop|strikethrough|stroke|text(?!L)|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;
var V = typeof document != "undefined";
var z2 = function(n2) {
  return (typeof Symbol != "undefined" && typeof Symbol() == "symbol" ? /fil|che|rad/i : /fil|che|ra/i).test(n2);
};
function B2(n2, t3, e3) {
  return t3.__k == null && (t3.textContent = ""), S(n2, t3), typeof e3 == "function" && e3(), n2 ? n2.__c : null;
}
function H2(n2, t3, e3) {
  return q(n2, t3), typeof e3 == "function" && e3(), n2 ? n2.__c : null;
}
_.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(n2) {
  Object.defineProperty(_.prototype, n2, { configurable: true, get: function() {
    return this["UNSAFE_" + n2];
  }, set: function(t3) {
    Object.defineProperty(this, n2, { configurable: true, writable: true, value: t3 });
  } });
});
var Z = l.event;
function Y() {
}
function $2() {
  return this.cancelBubble;
}
function q2() {
  return this.defaultPrevented;
}
l.event = function(n2) {
  return Z && (n2 = Z(n2)), n2.persist = Y, n2.isPropagationStopped = $2, n2.isDefaultPrevented = q2, n2.nativeEvent = n2;
};
var G;
var J = { configurable: true, get: function() {
  return this.class;
} };
var K = l.vnode;
l.vnode = function(n2) {
  var t3 = n2.type, e3 = n2.props, r3 = e3;
  if (typeof t3 == "string") {
    var u3 = t3.indexOf("-") === -1;
    for (var o3 in r3 = {}, e3) {
      var i3 = e3[o3];
      V && o3 === "children" && t3 === "noscript" || o3 === "value" && "defaultValue" in e3 && i3 == null || (o3 === "defaultValue" && "value" in e3 && e3.value == null ? o3 = "value" : o3 === "download" && i3 === true ? i3 = "" : /ondoubleclick/i.test(o3) ? o3 = "ondblclick" : /^onchange(textarea|input)/i.test(o3 + t3) && !z2(e3.type) ? o3 = "oninput" : /^on(Ani|Tra|Tou|BeforeInp)/.test(o3) ? o3 = o3.toLowerCase() : u3 && P2.test(o3) ? o3 = o3.replace(/[A-Z0-9]/, "-$&").toLowerCase() : i3 === null && (i3 = void 0), r3[o3] = i3);
    }
    t3 == "select" && r3.multiple && Array.isArray(r3.value) && (r3.value = A(e3.children).forEach(function(n3) {
      n3.props.selected = r3.value.indexOf(n3.props.value) != -1;
    })), t3 == "select" && r3.defaultValue != null && (r3.value = A(e3.children).forEach(function(n3) {
      n3.props.selected = r3.multiple ? r3.defaultValue.indexOf(n3.props.value) != -1 : r3.defaultValue == n3.props.value;
    })), n2.props = r3;
  }
  t3 && e3.class != e3.className && (J.enumerable = "className" in e3, e3.className != null && (r3.class = e3.className), Object.defineProperty(r3, "className", J)), n2.$$typeof = j3, K && K(n2);
};
var Q = l.__r;
l.__r = function(n2) {
  Q && Q(n2), G = n2.__c;
};
var X = { ReactCurrentDispatcher: { current: { readContext: function(n2) {
  return G.__n[n2.__c].props.value;
} } } };
function tn(n2) {
  return v.bind(null, n2);
}
function en(n2) {
  return !!n2 && n2.$$typeof === j3;
}
function rn(n2) {
  return en(n2) ? B.apply(null, arguments) : n2;
}
function un(n2) {
  return !!n2.__k && (S(null, n2), true);
}
function on(n2) {
  return n2 && (n2.base || n2.nodeType === 1 && n2) || null;
}
var ln = function(n2, t3) {
  return n2(t3);
};
var cn = function(n2, t3) {
  return n2(t3);
};
var compat_default = { useState: l2, useReducer: p2, useEffect: y2, useLayoutEffect: h2, useRef: s2, useImperativeHandle: _2, useMemo: A2, useCallback: F, useContext: T2, useDebugValue: d2, version: "17.0.2", Children: k3, render: B2, hydrate: H2, unmountComponentAtNode: un, createPortal: W, createElement: v, createContext: D, createFactory: tn, cloneElement: rn, createRef: p, Fragment: d, isValidElement: en, findDOMNode: on, Component: _, PureComponent: E, memo: g3, forwardRef: x3, flushSync: cn, unstable_batchedUpdates: ln, StrictMode: d, Suspense: L2, SuspenseList: M2, lazy: F2, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: X };

// src/components/prefix.tsx
var PrefixComponent = class extends _ {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      expanded: true
    };
  }
  render() {
    return /* @__PURE__ */ compat_default.createElement("div", {
      className: this.props.className,
      onClick: () => {
        this.setState({ expanded: !this.state.expanded });
      }
    }, this.state.expanded ? this.props.prefix : /* @__PURE__ */ compat_default.createElement("i", {
      className: "fas fa-ellipsis"
    }));
  }
};

// src/context.ts
var GlobalContext = class {
  setApp(app) {
    this.app = app;
  }
  setPlugin(plugin) {
    this.plugin = plugin;
  }
};
var ctx = new GlobalContext();

// src/components/textarea.tsx
var TextArea = class extends _ {
  constructor(props) {
    super(props);
    this.props = props;
    this.textArea = p();
    this.autoResize = () => {
      this.textArea.current.style.height = "0px";
      const scrollHeight = this.textArea.current.scrollHeight;
      this.textArea.current.style.height = scrollHeight + "px";
    };
    this.state = {
      value: props.value,
      receivedEnter: false
    };
  }
  componentDidMount() {
    this.autoResize();
    this.textArea.current.focus();
  }
  render() {
    return /* @__PURE__ */ compat_default.createElement("textarea", {
      ref: this.textArea,
      className: this.props.className,
      value: this.state.value,
      onChange: (event) => {
        this.setState({ value: event.target.value });
        this.props.setValueCallback(event.target.value);
        this.autoResize();
      },
      onKeyUp: (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          if (this.state.receivedEnter) {
            this.props.submitCallback(this.state.value);
          }
        }
      },
      onKeyDown: (event) => {
        if (event.key === "Enter") {
          this.setState({ receivedEnter: true });
          event.preventDefault();
        }
      }
    });
  }
};

// src/components/action.tsx
var ActionCard = (action, callback) => {
  let content;
  if (action.display.icon) {
    content = /* @__PURE__ */ compat_default.createElement("i", {
      className: action.display.icon
    });
  } else {
    content = /* @__PURE__ */ compat_default.createElement("div", {
      className: "typing-action-card-name"
    }, action.display.name);
  }
  return /* @__PURE__ */ compat_default.createElement("div", {
    className: "typing-action-card",
    onClick: callback
  }, content);
};
var ActionLine = (action, callback) => {
  let slug;
  if (action.display.icon) {
    slug = /* @__PURE__ */ compat_default.createElement("i", {
      className: action.display.icon
    });
  } else {
    slug = /* @__PURE__ */ compat_default.createElement(compat_default.Fragment, null);
  }
  return /* @__PURE__ */ compat_default.createElement("div", {
    className: "typing-action-line",
    onClick: callback
  }, /* @__PURE__ */ compat_default.createElement("div", {
    className: "typing-action-line-pin"
  }, action.pinned ? /* @__PURE__ */ compat_default.createElement("i", {
    className: "fa-regular fa-star"
  }) : {}), /* @__PURE__ */ compat_default.createElement("div", {
    className: "typing-action-line-slug"
  }, slug), /* @__PURE__ */ compat_default.createElement("div", {
    className: "typing-action-line-name"
  }, action.name));
};

// src/modals.tsx
function promptName(prefix, oldName, conf) {
  return __async(this, null, function* () {
    if (prefix == null) {
      prefix = "";
    }
    if (oldName == null) {
      oldName = "";
    }
    return new Promise((resolve) => {
      new NamePromptModal(ctx.app, prefix, oldName, (name) => {
        if (name === null) {
          resolve(null);
        }
        resolve(`${prefix} ${name}`.trim());
      }).open();
    });
  });
}
function promptField(field, oldValue, conf) {
  return __async(this, null, function* () {
    if (oldValue == null) {
      oldValue = "";
    }
    return new Promise((resolve) => {
      new FieldPromptModal(ctx.app, field, oldValue, (value) => {
        if (value === null) {
          resolve(null);
        }
        resolve(`${value}`.trim());
      }).open();
    });
  });
}
var ReactModal = class extends import_obsidian4.Modal {
  render(modalComponent) {
    this.modalEl.className = modalComponent.props.className;
    compat_default.render(modalComponent.props.children, this.modalEl);
  }
};
var ReactCallbackModal = class extends ReactModal {
  constructor(app, oldValue, callback) {
    super(app);
    this.oldValue = oldValue;
    this.callback = callback;
    this.success = false;
    this.submitCallback = (value) => {
      this.success = true;
      this.callback(value);
      this.close();
    };
    this.setValueCallback = (value) => {
      this.value = value;
    };
    this.value = oldValue;
  }
  onClose() {
    if (!this.success) {
      if (this.value !== this.oldValue) {
        this.callback(this.value);
      } else {
        this.callback(null);
      }
    }
  }
};
var NamePromptModal = class extends ReactCallbackModal {
  constructor(app, prefix, oldName, callback) {
    super(app, oldName, callback);
    this.prefix = prefix;
  }
  onOpen() {
    this.render(/* @__PURE__ */ compat_default.createElement("div", {
      className: "modal typing-modal-name"
    }, this.prefix ? /* @__PURE__ */ compat_default.createElement(PrefixComponent, {
      className: "typing-modal-name-prefix",
      prefix: this.prefix
    }) : {}, /* @__PURE__ */ compat_default.createElement(TextArea, {
      responsive: true,
      value: this.value,
      className: "typing-modal-name-input",
      submitCallback: this.submitCallback,
      setValueCallback: this.setValueCallback
    })));
  }
};
var FieldPromptModal = class extends ReactCallbackModal {
  constructor(app, fieldName, oldValue, callback) {
    super(app, oldValue, callback);
    this.fieldName = fieldName;
  }
  onOpen() {
    this.render(/* @__PURE__ */ compat_default.createElement("div", {
      className: "modal typing-modal-field"
    }, /* @__PURE__ */ compat_default.createElement("div", {
      className: "typing-modal-field-name"
    }, this.fieldName, ": "), /* @__PURE__ */ compat_default.createElement(TextArea, {
      responsive: true,
      value: this.value,
      className: "typing-modal-field-input",
      submitCallback: this.submitCallback,
      setValueCallback: this.setValueCallback
    })));
  }
};
var ActionsModal = class extends ReactModal {
  constructor(app, actions, pinnedActions, note) {
    super(app);
    this.actions = actions;
    this.pinnedActions = pinnedActions;
    this.note = note;
  }
  onOpen() {
    let actionCards = [];
    for (let action of this.actions) {
      actionCards.push(ActionCard(action, () => {
        this.close();
        this.note.runAction(action.name);
      }));
    }
    let pinnedActionCards = [];
    for (let actionName in this.pinnedActions) {
      let action = this.pinnedActions[actionName];
      pinnedActionCards.push(ActionCard(action, () => {
        this.close();
        this.note.runPinnedAction(action.name);
      }));
    }
    this.render(/* @__PURE__ */ compat_default.createElement("div", {
      className: "modal typing-modal-actions"
    }, /* @__PURE__ */ compat_default.createElement("div", {
      className: "typing-note-actions"
    }, actionCards), /* @__PURE__ */ compat_default.createElement("div", {
      className: "typing-pinned-actions"
    }, pinnedActionCards)));
  }
};
var ActionsFuzzySuggestModal = class extends import_obsidian4.SuggestModal {
  constructor(app, actions, pinnedActions, note) {
    super(app);
    this.actions = actions;
    this.pinnedActions = pinnedActions;
    this.note = note;
  }
  renderSuggestion(action, el) {
    return __async(this, null, function* () {
      return compat_default.render(ActionLine(action, () => {
      }), el);
    });
  }
  getSuggestions(query) {
    let preparedQuery = (0, import_obsidian4.prepareQuery)(query);
    let result = [];
    for (let actionName in this.pinnedActions) {
      let action = this.pinnedActions[actionName];
      if ((0, import_obsidian4.fuzzySearch)(preparedQuery, action.name)) {
        result.push(action);
      }
    }
    for (let action of this.actions) {
      if ((0, import_obsidian4.fuzzySearch)(preparedQuery, action.name)) {
        result.push(action);
      }
    }
    return result;
  }
  onChooseSuggestion(action) {
    if (action.pinned) {
      this.note.runPinnedAction(action.name);
    } else {
      this.note.runAction(action.name);
    }
  }
};
var TypeSuggestModal = class extends import_obsidian4.FuzzySuggestModal {
  constructor(app, callback) {
    super(app);
    this.callback = callback;
  }
  getItems() {
    return registry.typesList;
  }
  getItemText(type) {
    return type.name;
  }
  onChooseItem(type) {
    this.callback(type);
  }
};
var StringSuggestModal = class extends import_obsidian4.FuzzySuggestModal {
  constructor(app, strings, callback) {
    super(app);
    this.strings = strings;
    this.callback = callback;
  }
  getItems() {
    return this.strings;
  }
  getItemText(s3) {
    return s3;
  }
  onChooseItem(s3) {
    this.callback(s3);
  }
};

// src/field.ts
var FieldKind = class {
};
var AnyFieldKind = class extends FieldKind {
  suggest(field, note) {
  }
};
var FIELD_KINDS = {
  any: new AnyFieldKind()
};
var Field = class {
  constructor(conf, name, kind, args) {
    this.conf = conf;
    this.name = name;
    this.kind = kind;
    this.args = args;
  }
  static fromSpec(spec, conf) {
    let result = new Field(conf, spec.name, spec.kind, spec.args);
    return result;
  }
  prompt(oldValue) {
    return __async(this, null, function* () {
      if (oldValue == null) {
        oldValue = "";
      }
      return promptField(this.name, oldValue, this.conf);
    });
  }
};

// src/config.ts
var Settings = class {
  static fromSpec(spec, conf) {
    return __async(this, null, function* () {
      let result = new this();
      result.preamble = yield Text.fromSpec(spec.preamble, conf);
      return result;
    });
  }
};
var Hook = class {
  static fromSpec(spec, conf) {
    return __async(this, null, function* () {
      let result = new this();
      result.event = spec.event;
      result.script = yield Text.fromSpec(spec.script, conf);
      return result;
    });
  }
};
var Text = class {
  constructor(conf, source) {
    this.conf = conf;
    this.source = source;
  }
  static fromSpec(spec, conf) {
    return __async(this, null, function* () {
      let source = null;
      if (spec.source && spec.file) {
        gracefullyAlert(`both source and file are specified in TextSpec: ${spec.file}`);
        spec.file = null;
      }
      if (spec.file) {
        source = yield ctx.app.vault.adapter.read(spec.file);
      }
      if (spec.source) {
        source = spec.source;
      }
      if (!source) {
        gracefullyAlert(`either source or file should be specified`);
      }
      return new this(conf, source);
    });
  }
};
var Marginal = class extends Text {
  constructor(conf, source, kind = "js") {
    super(conf, source);
    this.kind = kind;
  }
  static fromSpec(spec, conf) {
    var __super = (key) => super[key];
    return __async(this, null, function* () {
      var _a;
      let result = yield __super("fromSpec").call(this, spec, conf);
      if (spec.kind) {
        result.kind = spec.kind;
      }
      if (result.kind == "js" && ((_a = conf.settings) == null ? void 0 : _a.preamble)) {
        result.source = conf.settings.preamble.source + ";" + result.source;
      }
      return result;
    });
  }
};
var Action = class extends Text {
  constructor(conf, source, name, pinned, display = {}) {
    super(conf, source);
    this.name = name;
    this.pinned = pinned;
    this.display = display;
  }
  static fromSpec(spec, conf) {
    var __super = (key) => super[key];
    return __async(this, null, function* () {
      var _a;
      let result = yield __super("fromSpec").call(this, spec, conf);
      result.name = spec.name;
      result.pinned = spec.pinned;
      if (spec.display != null) {
        result.display = spec.display;
      }
      if ((_a = conf.settings) == null ? void 0 : _a.preamble) {
        result.source = conf.settings.preamble.source + ";" + result.source;
      }
      return result;
    });
  }
};
var Rendering = class {
  constructor(conf, link, card) {
    this.conf = conf;
    this.link = link;
    this.card = card;
  }
  static fromSpec(spec, conf) {
    return __async(this, null, function* () {
      var _a, _b;
      let link = null;
      let card = null;
      if (spec.link != null) {
        link = yield Text.fromSpec(spec.link, conf);
      }
      if (spec.card != null) {
        card = yield Text.fromSpec(spec.card, conf);
      }
      if (link && ((_a = conf.settings) == null ? void 0 : _a.preamble)) {
        link.source = conf.settings.preamble.source + ";" + link.source;
      }
      if (card && ((_b = conf.settings) == null ? void 0 : _b.preamble)) {
        card.source = conf.settings.preamble.source + ";" + card.source;
      }
      return new this(conf, link, card);
    });
  }
};
var Config = class {
  constructor(types = {}, actions = {}, overrides = [], hooks = [], settings = null, pinnedActions = {}) {
    this.types = types;
    this.actions = actions;
    this.overrides = overrides;
    this.hooks = hooks;
    this.settings = settings;
    this.pinnedActions = pinnedActions;
  }
  static fromSpec(spec) {
    return __async(this, null, function* () {
      registry.clear();
      let result = new this();
      result.settings = yield Settings.fromSpec(spec.settings, result);
      if (spec.actions) {
        for (let specId in spec.actions) {
          let actionSpec = spec.actions[specId];
          let newAction = yield Action.fromSpec(actionSpec, result);
          result.actions[specId] = newAction;
          if (newAction.pinned) {
            result.pinnedActions[newAction.name] = newAction;
          }
        }
      }
      for (let typeSpec of spec.types) {
        let newType = yield Type2.fromSpec(typeSpec, result);
        registry.addType(newType);
        result.types[newType.name] = newType;
      }
      if (spec.overrides) {
        for (let overrideSpec of spec.overrides) {
          let newOverride = yield Override.fromSpec(overrideSpec, result);
          registry.addOverride(newOverride);
          result.overrides.push(newOverride);
        }
      }
      if (spec.hooks) {
        for (let hookSpec of spec.hooks) {
          let newHook = yield Hook.fromSpec(hookSpec, result);
          result.hooks.push(newHook);
        }
      }
      return result;
    });
  }
};

// src/field_accessor.ts
var import_obsidian5 = __toModule(require("obsidian"));
var regexField = RegExp(`^\\s*(?<field>[0-9\\w\\p{Letter}][-0-9\\w\\p{Letter}]*)\\s*::\\s*(?<value>.*)\\s*`);
var EditorFieldAccessor = class {
  constructor(editor, note) {
    this.editor = editor;
    this.note = note;
  }
  locateField(key) {
    let match;
    for (let lineno = 0; lineno < this.editor.lineCount(); lineno++) {
      let line = this.editor.getLine(lineno);
      if ((match = regexField.exec(line)) && match.groups.field == key) {
        return { success: true, lineno, match };
      }
    }
    return { success: false };
  }
  getValue(key) {
    return __async(this, null, function* () {
      let result = this.locateField(key);
      if (result.success) {
        return result.match.groups.value;
      }
      return null;
    });
  }
  setValue(key, value) {
    let result = this.locateField(key);
    let newLine = `${key} :: ${value}`;
    if (result.success) {
      let line = this.editor.getLine(result.lineno);
      this.editor.replaceRange(newLine, {
        line: result.lineno,
        ch: 0
      }, {
        line: result.lineno,
        ch: line.length
      });
    } else {
      let lineno = 0;
      if (this.editor.getLine(0).trim() === "---") {
        lineno = 1;
        while (lineno < this.editor.lineCount() && this.editor.getLine(lineno).trim() !== "---") {
          lineno++;
        }
        if (lineno == this.editor.lineCount()) {
          lineno = 1;
        } else {
          lineno++;
        }
      }
      let firstLineAfterFrontmatter = lineno;
      while (lineno < this.editor.lineCount() && !this.editor.getLine(lineno).trim().length) {
        lineno++;
      }
      if (lineno == this.editor.lineCount()) {
        lineno = firstLineAfterFrontmatter;
      } else {
        let fieldOrder = this.note.type.getFieldOrder();
        let currentFieldOrder = fieldOrder[key];
        for (; lineno < this.editor.lineCount(); lineno++) {
          let line = this.editor.getLine(lineno);
          let match = regexField.exec(line);
          if (!match) {
            break;
          }
          let order = fieldOrder[match.groups.field];
          if (order > currentFieldOrder) {
            break;
          }
        }
      }
      this.editor.replaceRange(newLine + "\n", {
        line: lineno,
        ch: 0
      });
    }
  }
};
var PreviewFieldAccessor = class {
  constructor(file, plugin, note) {
    this.file = file;
    this.plugin = plugin;
    this.note = note;
  }
  getLines() {
    return __async(this, null, function* () {
      if (this.lines) {
        return this.lines;
      }
      this.content = yield this.plugin.app.vault.read(this.file);
      this.lines = this.content.split("\n");
      return this.lines;
    });
  }
  locateField(key) {
    return __async(this, null, function* () {
      let lines = yield this.getLines();
      let match;
      for (let lineno = 0; lineno < lines.length; lineno++) {
        let line = lines[lineno];
        if ((match = regexField.exec(line)) && match.groups.field == key) {
          return { success: true, lineno, match };
        }
      }
      return { success: false };
    });
  }
  getValue(key) {
    return __async(this, null, function* () {
      let result = yield this.locateField(key);
      if (result.success) {
        return result.match.groups.value;
      }
      return null;
    });
  }
  setValue(key, value) {
    return __async(this, null, function* () {
      let result = yield this.locateField(key);
      let lines = yield this.getLines();
      let newLine = `${key} :: ${value}`;
      if (result.success) {
        lines[result.lineno] = newLine;
        let newContent = lines.join("\n");
        yield this.plugin.app.vault.modify(this.file, newContent);
        return;
      } else {
        let lineno = 0;
        if (lines[0].trim() === "---") {
          lineno = 1;
          while (lineno < lines.length && lines[lineno].trim() !== "---") {
            lineno++;
          }
          if (lineno == lines.length) {
            lineno = 1;
          } else {
            lineno++;
          }
        }
        let firstLineAfterFrontmatter = lineno;
        while (lineno < lines.length && !lines[lineno].trim().length) {
          lineno++;
        }
        if (lineno == lines.length) {
          lineno = firstLineAfterFrontmatter;
        } else {
          let fieldOrder = this.note.type.getFieldOrder();
          let currentFieldOrder = fieldOrder[key];
          for (; lineno < lines.length; lineno++) {
            let line = lines[lineno];
            let match = regexField.exec(line);
            if (!match) {
              break;
            }
            let order = fieldOrder[match.groups.field];
            if (order > currentFieldOrder) {
              break;
            }
          }
        }
        lines.splice(lineno, 0, newLine);
        let newContent = lines.join("\n");
        yield this.plugin.app.vault.modify(this.file, newContent);
        return;
      }
    });
  }
};
function autoFieldAccessor(path, plugin) {
  return __async(this, null, function* () {
    let note = yield plugin.asTyped(path);
    let activeView = plugin.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    if (activeView && activeView.getMode() == "source" && activeView.file.path === path) {
      return new EditorFieldAccessor(activeView.editor, note);
    } else {
      return new PreviewFieldAccessor(plugin.app.vault.getAbstractFileByPath(path), plugin, note);
    }
  });
}

// src/prefix.tsx
var _Prefix = class {
  constructor(format) {
    this.format = format;
  }
  static fromString(format) {
    let result = new this(format);
    let regex = "^" + format;
    for (let providerName in this.providers) {
      regex = regex.replace(`{${providerName}}`, this.providers[providerName].regex);
    }
    result.regex = RegExp(regex);
    return result;
  }
  splitByPrefix(name) {
    let match = this.regex.exec(name);
    if (!match) {
      return { prefix: "", name };
    }
    let prefix = name.slice(0, match[0].length).trim();
    let significantName = name.slice(match[0].length).trim();
    return { prefix, name: significantName };
  }
  static registerProvider(name, regex, callback) {
    this.providers[name] = callback;
    this.providers[name].regex = regex;
  }
  exec(args) {
    let result = this.format;
    for (let key in args) {
      result = result.replace(`{${key}}`, args[key]);
    }
    return result;
  }
  new(type, name, fields) {
    let result = this.format;
    for (let providerName in _Prefix.providers) {
      console.log("result", result, "provider", providerName);
      result = result.replace(`{${providerName}}`, _Prefix.providers[providerName](type, name, fields, this));
    }
    console.log("result", result);
    return result;
  }
};
var Prefix = _Prefix;
Prefix.providers = {};
var b62range = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
Prefix.registerProvider("date_compact", "[0-9A-Za-z]+[0-9A-C]{1}[0-9A-V]{1}[0-9A-N]{1}[0-9A-Za-x]{2}\\s*", (type, name, fields, prefix) => {
  let result = "";
  let date = new Date();
  let year = date.getFullYear() - 2e3;
  while (true) {
    result = b62range[year % 62] + result;
    year = ~~(year / 62);
    if (year == 0) {
      break;
    }
  }
  result += b62range[date.getMonth() + 1];
  result += b62range[date.getDate()];
  result += b62range[date.getHours()];
  result += b62range[date.getMinutes()];
  result += b62range[date.getSeconds()];
  return result;
});
Prefix.registerProvider("serial", "[1-9]+[0-9]*\\s*", (type, name, fields, prefix) => {
  let vault = ctx.app.vault;
  let serial = 1;
  while (true) {
    let fullname = `${type.folder}/${prefix.exec({
      serial: serial.toString()
    })} ${name}`.trim();
    if (!vault.getAbstractFileByPath(`${fullname}.md`)) {
      break;
    }
    serial += 1;
  }
  return serial.toString();
});

// src/type.ts
var StaticTypeAttributesMixin = class {
};
var Type2 = class extends StaticTypeAttributesMixin {
  static fromSpec(spec, conf) {
    return __async(this, null, function* () {
      let result = new this();
      result.conf = conf;
      result.name = spec.name;
      result.folder = spec.folder;
      result.fields = [];
      if (spec.parents != null) {
        for (let parentName of spec.parents) {
          let parent = conf.types[parentName];
          if (parent == null) {
            gracefullyAlert(`unknown parent of ${spec.name}: ${parent}`);
            continue;
          }
          if (parent.header) {
            result.header = parent.header;
          }
          if (parent.footer) {
            result.footer = parent.footer;
          }
          if (parent.fields) {
            result.fields.push(...parent.fields);
          }
        }
      }
      if (spec.header != null) {
        result.header = yield Marginal.fromSpec(spec.header, conf);
      }
      if (spec.footer != null) {
        result.footer = yield Marginal.fromSpec(spec.footer, conf);
      }
      if (spec.fields != null) {
        for (let fieldSpec of spec.fields) {
          let newField = Field.fromSpec(fieldSpec, conf);
          result.fields.push(newField);
        }
      }
      result.fieldMapping = {};
      for (let field of result.fields) {
        result.fieldMapping[field.name] = field;
      }
      result.init = [];
      if (spec.init != null) {
        for (let field of spec.init) {
          if (field in result.init) {
            gracefullyAlert(`duplicated field in init of ${result.name}: ${field}`);
            continue;
          }
          result.init.push(field);
        }
      }
      if (spec.icon != null) {
        result.icon = spec.icon;
      }
      if (spec.render != null) {
        result.render = yield Rendering.fromSpec(spec.render, conf);
      }
      if (spec.prefix != null) {
        result.prefix = Prefix.fromString(spec.prefix);
      }
      result.createable = true;
      if (spec.createable != null) {
        result.createable = spec.createable;
      }
      result.actions = [];
      result.actionMapping = {};
      if (spec.actions) {
        for (let actionSpec of spec.actions) {
          let action;
          if (typeof actionSpec == "string") {
            if (actionSpec in conf.actions) {
              action = conf.actions[actionSpec];
            } else {
              gracefullyAlert(`unknown action (${actionSpec}) in type: ${result.name}`);
              continue;
            }
          } else {
            action = yield Action.fromSpec(actionSpec, conf);
          }
          result.actions.push(action);
          result.actionMapping[action.name] = action;
        }
      }
      return result;
    });
  }
  getActionByName(name) {
    if (name in this.actionMapping) {
      return this.actionMapping[name];
    }
    gracefullyAlert(`unknown action: ${name}`);
    return null;
  }
  getFieldByName(name) {
    if (name in this.fieldMapping) {
      return this.fieldMapping[name];
    }
    gracefullyAlert(`unknown field: ${name}`);
    return null;
  }
  new(name, fields) {
    return __async(this, null, function* () {
      let vault = ctx.app.vault;
      if (!vault.getAbstractFileByPath(this.folder)) {
        yield vault.createFolder(this.folder);
      }
      if (!name && !this.prefix) {
        gracefullyAlert(`either name or prefix should be specified when creating type ${this.name}`);
        return;
      }
      if (!name) {
        name = "";
      }
      if (!fields) {
        fields = {};
      }
      let prefix = "";
      if (this.prefix) {
        prefix = this.prefix.new(this, name, fields);
      }
      let fullname = `${prefix} ${name}`.trim();
      let newPath = `${this.folder}/${fullname}.md`;
      console.log("creating", newPath);
      yield vault.create(newPath, "");
      if (fields) {
        let accessor = yield autoFieldAccessor(newPath, ctx.plugin);
        for (let field in fields) {
          yield accessor.setValue(field, fields[field]);
        }
      }
      return newPath;
    });
  }
  promptNew() {
    return __async(this, arguments, function* (name = null, fields = {}) {
      var _a;
      if ((_a = this.init) == null ? void 0 : _a.length) {
        for (let initField of this.init) {
          if (initField == "name") {
            if (name != null) {
              continue;
            }
            name = yield promptName("", "", this.conf);
            if (name === null) {
              return { success: false };
            }
          } else {
            if (initField in fields) {
              continue;
            }
            for (let field of this.fields) {
              if (field.name == initField) {
                let value = yield field.prompt();
                if (value != null) {
                  fields[initField] = value;
                }
              }
            }
          }
        }
      } else {
        if (name == null) {
          name = yield promptName("", "", this.conf);
        }
        for (let field of this.fields) {
          if (field.name in fields) {
            continue;
          }
          let value = yield field.prompt();
          if (value != null) {
            fields[field.name] = value;
          }
        }
      }
      return { name, fields, success: true };
    });
  }
  getFieldOrder() {
    let result = {};
    if (!this.fields) {
      return result;
    }
    for (let i3 = 0; i3 < this.fields.length; i3++) {
      result[this.fields[i3].name] = i3;
    }
    return result;
  }
};
var Override = class {
  constructor(conf, condition, header, footer, icon) {
    this.conf = conf;
    this.condition = condition;
    this.header = header;
    this.footer = footer;
    this.icon = icon;
  }
  static fromSpec(spec, conf) {
    return __async(this, null, function* () {
      var _a;
      let header = null;
      if (spec.header != null) {
        header = yield Marginal.fromSpec(spec.header, conf);
      }
      let footer = null;
      if (spec.footer != null) {
        footer = yield Marginal.fromSpec(spec.footer, conf);
      }
      let condition = spec.condition;
      if (condition && ((_a = conf.settings) == null ? void 0 : _a.preamble)) {
        condition = conf.settings.preamble.source + ";" + condition;
      }
      return new this(conf, condition, header, footer, spec.icon);
    });
  }
  check(note) {
    let evalCtx = new EvalContext(ctx.plugin.getDefaultContext(note));
    try {
      return evalCtx.eval(this.condition);
    } catch (e3) {
      return false;
    }
  }
  apply(note) {
    if (this.header) {
      note.header = this.header;
    }
    if (this.footer) {
      note.footer = this.footer;
    }
    if (this.icon) {
      note.icon = this.icon;
    }
  }
};
var TypeRegistry = class {
  constructor() {
    this.types = {};
    this.typesList = [];
    this.overrides = [];
    this.folderIndex = {};
  }
  addType(newType) {
    for (let name in this.types) {
      if (name == newType.name) {
        gracefullyAlert("duplicate type name: " + name);
        return;
      }
      if (this.types[name].folder == newType.folder) {
        gracefullyAlert("duplicate type folder: " + newType.folder);
        return;
      }
    }
    this.types[newType.name] = newType;
    this.folderIndex[newType.folder] = newType;
    this.typesList = Object.keys(this.types).map((name) => this.types[name]);
  }
  addOverride(override) {
    this.overrides.push(override);
  }
  getTypeByName(name) {
    return this.types[name];
  }
  getTypeByFolder(folder) {
    let type = this.folderIndex[folder];
    if (!type) {
      return null;
    }
    return type;
  }
  getTypeByPath(path) {
    let lastIndexOfPathSep = path.lastIndexOf("/");
    if (lastIndexOfPathSep == -1) {
      return null;
    }
    let folder = path.substring(0, lastIndexOfPathSep);
    let type = this.getTypeByFolder(folder);
    return type;
  }
  applyOverrides(note) {
    for (let override of this.overrides) {
      if (override.check(note)) {
        override.apply(note);
      }
    }
    return note;
  }
  clear() {
    this.types = {};
    this.typesList = [];
    this.folderIndex = {};
    this.overrides = [];
  }
};
var registry = new TypeRegistry();

// src/link.ts
var import_obsidian6 = __toModule(require("obsidian"));
var LinkChild = class extends import_obsidian6.MarkdownRenderChild {
  constructor(containerEl, plugin, path, text) {
    super(containerEl);
    this.plugin = plugin;
    this.path = path;
    this.text = text;
    this.show = () => __async(this, null, function* () {
      var _a;
      if (this.note.icon) {
        let iconEl = document.createElement("span");
        iconEl.className = "typing-icon " + this.note.icon;
        this.containerEl.prepend(iconEl);
        this.containerEl.appendText(this.text);
        return;
      }
      if ((_a = this.note.render) == null ? void 0 : _a.link) {
        let namespace = this.plugin.getDefaultContext(this.note);
        let scriptContext = new EvalContext(__spreadValues({
          containerEl: this.containerEl
        }, namespace));
        scriptContext.asyncEval(this.note.render.link.source);
        return;
      }
      this.containerEl.appendText(this.text);
    });
    this.onMetadataChange = (op, file) => __async(this, null, function* () {
      if (file.path === this.path) {
        yield this.update();
      }
    });
    this.update = () => __async(this, null, function* () {
      this.note = this.plugin.asTyped(this.path);
      if (!this.note) {
        return;
      }
      this.hide();
      yield this.show();
    });
    this.hide = () => {
      while (this.containerEl.firstChild) {
        this.containerEl.removeChild(this.containerEl.firstChild);
      }
    };
    this.update();
  }
  onload() {
    this.registerEvent(this.plugin.app.metadataCache.on("dataview:metadata-change", this.onMetadataChange));
    this.update();
  }
  onunload() {
  }
};
function linksPostProcessor(plugin) {
  return (el, ctx2) => __async(this, null, function* () {
    el.querySelectorAll("a.internal-link").forEach((link) => __async(this, null, function* () {
      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }
      let path = link.getAttr("href");
      let resolvedTFile = plugin.app.metadataCache.getFirstLinkpathDest(path, ctx2.sourcePath);
      if (!resolvedTFile) {
        return;
      }
      let resolvedPath = resolvedTFile.path;
      ctx2.addChild(new LinkChild(link, plugin, resolvedPath, link.innerText));
    }));
  });
}
function registerLinksPostProcessor(plugin) {
  let postProcess = linksPostProcessor(plugin);
  plugin.registerMarkdownPostProcessor(postProcess);
}

// src/typed_note.ts
var TypedNote = class extends StaticTypeAttributesMixin {
  get fields() {
    let dv = ctx.plugin.syncDataviewApi();
    return dv.page(this.path);
  }
  get folder() {
    let lastIndexOfPathSep = this.path.lastIndexOf("/");
    if (lastIndexOfPathSep != -1) {
      return this.path.slice(0, lastIndexOfPathSep);
    } else {
      return "";
    }
  }
  get name() {
    let lastIndexOfPathSep = this.path.lastIndexOf("/");
    if (lastIndexOfPathSep != -1) {
      return this.path.slice(lastIndexOfPathSep + 1, this.path.lastIndexOf("."));
    } else {
      return this.path.slice(0, this.path.lastIndexOf("."));
    }
  }
  get actions() {
    if (!this.type) {
      return [];
    }
    return this.type.actions;
  }
  static fromPath(path, conf) {
    let type = registry.getTypeByPath(path);
    let result = new this();
    result.conf = conf;
    result.path = path;
    result.type = type;
    if (type) {
      result.header = type.header;
      result.footer = type.footer;
      result.icon = type.icon;
      result.render = type.render;
      result.prefix = type.prefix;
      result = registry.applyOverrides(result);
    }
    return result;
  }
  getField(name) {
    return __async(this, null, function* () {
      let fieldAccessor = yield autoFieldAccessor(this.path, ctx.plugin);
      return yield fieldAccessor.getValue(name);
    });
  }
  setField(name, value) {
    return __async(this, null, function* () {
      let fieldAccessor = yield autoFieldAccessor(this.path, ctx.plugin);
      yield fieldAccessor.setValue(name, value);
    });
  }
  runAction(name) {
    return __async(this, null, function* () {
      let evalCtx = new EvalContext(ctx.plugin.getDefaultContext(this));
      evalCtx.asyncEval(this.type.getActionByName(name).source);
    });
  }
  runPinnedAction(name) {
    return __async(this, null, function* () {
      let evalCtx = new EvalContext(ctx.plugin.getDefaultContext(this));
      evalCtx.asyncEval(this.conf.pinnedActions[name].source);
    });
  }
  rename(name) {
    return __async(this, null, function* () {
      let vault = ctx.app.vault;
      let file = vault.getAbstractFileByPath(this.path);
      let newPath = `${this.folder}/${name}.md`;
      yield vault.rename(file, newPath);
    });
  }
  move(path) {
    return __async(this, null, function* () {
      let vault = ctx.app.vault;
      let file = vault.getAbstractFileByPath(this.path);
      yield vault.rename(file, path);
    });
  }
  promptName() {
    return __async(this, null, function* () {
      if (this.prefix) {
        let tmp = this.prefix.splitByPrefix(this.name);
        return promptName(tmp.prefix, tmp.name, this.conf);
      } else {
        return promptName(null, this.name, this.conf);
      }
    });
  }
  promptField(name) {
    return __async(this, null, function* () {
      if (this.type) {
        return yield this.type.getFieldByName(name).prompt(yield this.getField(name));
      }
    });
  }
};

// src/components/view_title.tsx
var import_obsidian7 = __toModule(require("obsidian"));
var ViewTitle = class extends _ {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render() {
    let shouldRenderPrefix = this.props.prefix && (!import_obsidian7.Platform.isMobile || !this.props.name);
    let shouldRenderName = this.props.name;
    return /* @__PURE__ */ compat_default.createElement(compat_default.Fragment, null, shouldRenderPrefix ? /* @__PURE__ */ compat_default.createElement(PrefixComponent, {
      className: "view-header-title typing-view-title-prefix",
      prefix: this.props.prefix
    }) : {}, shouldRenderName ? /* @__PURE__ */ compat_default.createElement("div", {
      className: "view-header-title typing-view-title-name",
      onClick: this.props.onNameClick
    }, this.props.name) : {});
  }
};

// src/main.tsx
var TypingPlugin = class extends import_obsidian8.Plugin {
  constructor() {
    super(...arguments);
    this.configPath = "typing.yaml";
    this.processLeaves = () => {
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view.getViewType() != "markdown") {
          return;
        }
        let view = leaf.view;
        let note = this.asTyped(view.file.path);
        this.addViewActionsMenu(view, note);
        this.setViewTitle(view, note);
      });
    };
  }
  onload() {
    return __async(this, null, function* () {
      console.log("Typing: loading");
      ctx.setApp(this.app);
      ctx.setPlugin(this);
      (0, import_obsidian8.addIcon)("grid", `<path stroke="currentColor" fill="currentColor" d="m 34.375,0 h -25 c -5.1777344,0 -9.375,4.1972656 -9.375,9.375 v 25 c 0,5.175781 4.1972656,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.1777344 -4.199219,-9.375 -9.375,-9.375 z m 56.25,56.25 h -25 c -5.175781,0 -9.375,4.199219 -9.375,9.375 v 25 c 0,5.177734 4.197266,9.375 9.375,9.375 h 25 c 5.177734,0 9.375,-4.197266 9.375,-9.375 v -25 c 0,-5.175781 -4.199219,-9.375 -9.375,-9.375 z m 0,-56.25 h -25 c -5.175781,0 -9.375,4.1972656 -9.375,9.375 v 25 c 0,5.175781 4.199219,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.1777344 -4.199219,-9.375 -9.375,-9.375 z m -56.25,56.25 h -25 c -5.1777344,0 -9.375,4.199219 -9.375,9.375 v 25 c 0,5.175781 4.1972656,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.175781 -4.199219,-9.375 -9.375,-9.375 z" />`);
      this.addCommand({
        id: "typing-find",
        name: "Find",
        callback: () => {
        }
      });
      this.addCommand({
        id: "typing-new",
        name: "New",
        callback: () => __async(this, null, function* () {
          new TypeSuggestModal(this.app, (type) => __async(this, null, function* () {
            let options = yield type.promptNew();
            if (!options.success) {
              return;
            }
            let newPath = yield type.new(options.name, options.fields);
            this.app.workspace.activeLeaf.openFile(this.app.vault.getAbstractFileByPath(newPath));
          })).open();
        })
      });
      this.addCommand({
        id: "typing-field",
        name: "Set Field",
        callback: () => __async(this, null, function* () {
          let note = this.currentNote;
          if (note) {
            let fieldNames = note.type.fields.map((field) => field.name);
            new StringSuggestModal(this.app, fieldNames, (field) => __async(this, null, function* () {
              let newValue = yield note.promptField(field);
              if (newValue != null) {
                note.setField(field, newValue);
              }
            })).open();
          }
        })
      });
      this.addCommand({
        id: "typing-actions",
        name: "Open Actions",
        callback: () => {
          let note = this.currentNote;
          if (note) {
            this.openActions(note);
          }
        }
      });
      registerMarginalsPostProcessors(this);
      monkeyPatchPreviewView(this);
      registerLinksPostProcessor(this);
      this.registerMarkdownPostProcessor(hideInlineFields);
      this.reloadConfig();
      this.setConfigReloader();
      this.app.workspace.onLayoutReady(this.processLeaves);
      this.app.workspace.on("layout-change", this.processLeaves);
    });
  }
  get currentNote() {
    let leaf = this.app.workspace.activeLeaf;
    if (leaf.view.getViewType() != "markdown") {
      return null;
    }
    let view = leaf.view;
    let note = this.asTyped(view.file.path);
    return note;
  }
  addViewActionsMenu(view, note) {
    let actionsEl = view.containerEl.querySelector(".view-actions");
    if (!actionsEl.querySelector(`a.view-action[aria-label="Actions"]`)) {
      view.addAction("grid", "Actions", () => {
        this.openActions(this.asTyped(view.file.path));
      });
    }
  }
  openActions(note) {
    if (import_obsidian8.Platform.isMobile) {
      new ActionsModal(this.app, note.actions, this.conf.pinnedActions, note).open();
    } else {
      new ActionsFuzzySuggestModal(this.app, note.actions, this.conf.pinnedActions, note).open();
    }
  }
  setViewTitle(view, note) {
    let titleContainerEl = view.containerEl.querySelector(".view-header-title-container");
    let name = null, prefix = null;
    if (note.prefix) {
      let tmp = note.prefix.splitByPrefix(note.name);
      name = tmp.name;
      prefix = tmp.prefix;
    } else {
      name = note.name;
    }
    compat_default.render(/* @__PURE__ */ compat_default.createElement(ViewTitle, {
      prefix,
      name,
      onNameClick: () => __async(this, null, function* () {
        let newName = yield note.promptName();
        if (newName != null) {
          yield note.rename(newName);
        }
      })
    }), titleContainerEl);
  }
  asTyped(path) {
    return TypedNote.fromPath(path, this.conf);
  }
  getDefaultContext(note) {
    return {
      dv: this.syncDataviewApi(),
      plugin: this,
      app: this.app,
      note,
      type: note.type,
      TypedNote,
      registry
    };
  }
  onunload() {
    console.log("Typing: unloading");
    this.app.workspace.off("layout-change", this.processLeaves);
  }
  asyncDataviewApi() {
    return __async(this, null, function* () {
      let dvPlugin = this.app.plugins.plugins.dataview;
      if (dvPlugin.api) {
        return dvPlugin.api;
      }
      return yield new Promise((resolve) => {
        this.app.metadataCache.on("dataview:api-ready", (api) => {
          resolve(api);
        });
      });
    });
  }
  syncDataviewApi() {
    return this.app.plugins.plugins.dataview.api;
  }
  setConfigReloader() {
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file.path === this.configPath) {
        this.reloadConfig();
      }
    }));
  }
  reloadConfig() {
    return __async(this, null, function* () {
      let configSpec = (0, import_obsidian8.parseYaml)(yield this.app.vault.adapter.read(this.configPath));
      this.conf = yield Config.fromSpec(configSpec);
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
