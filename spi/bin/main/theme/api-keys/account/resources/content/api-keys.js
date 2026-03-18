import { jsxs as Se, jsx as H } from "react/jsx-runtime";
import * as s from "react";
import Oe, { useRef as cn, useEffect as Ct, forwardRef as zc, useImperativeHandle as Uc, useMemo as ii, useState as pe, useCallback as Gc } from "react";
import * as tl from "react-dom";
function P(e, t) {
  var n = {};
  for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var a = 0, r = Object.getOwnPropertySymbols(e); a < r.length; a++)
      t.indexOf(r[a]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[a]) && (n[r[a]] = e[r[a]]);
  return n;
}
function g(...e) {
  const t = [], n = {}.hasOwnProperty;
  return e.filter(Boolean).forEach((r) => {
    const a = typeof r;
    if (a === "string" || a === "number")
      t.push(r);
    else if (Array.isArray(r) && r.length) {
      const i = g(...r);
      i && t.push(i);
    } else if (a === "object")
      for (const i in r)
        n.call(r, i) && r[i] && t.push(i);
  }), t.join(" ");
}
const Pi = {
  modifiers: {
    "4xl": "pf-m-4xl",
    "3xl": "pf-m-3xl",
    "2xl": "pf-m-2xl",
    xl: "pf-m-xl",
    lg: "pf-m-lg",
    md: "pf-m-md"
  },
  title: "pf-v5-c-title"
}, Kc = {
  value: "576px"
}, Xc = {
  value: "768px"
}, Yc = {
  value: "992px"
}, Jc = {
  value: "1200px"
}, Zc = {
  value: "1450px"
}, Qc = {
  value: "0"
}, ed = {
  value: "40rem"
}, td = {
  value: "48rem"
}, nd = {
  value: "60rem"
}, rd = {
  value: "80rem"
};
var hn;
(function(e) {
  e.success = "success", e.error = "error", e.warning = "warning", e.default = "default";
})(hn || (hn = {}));
const bn = {
  Escape: "Escape",
  Enter: "Enter"
}, Rt = {
  sm: parseInt(Kc.value),
  md: parseInt(Xc.value),
  lg: parseInt(Yc.value),
  xl: parseInt(Jc.value),
  "2xl": parseInt(Zc.value)
}, Lt = {
  sm: parseInt(Qc.value),
  md: parseInt(ed.value),
  lg: parseInt(td.value),
  xl: parseInt(nd.value),
  "2xl": parseInt(rd.value)
};
/*!
* tabbable 6.4.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
var nl = ["input:not([inert]):not([inert] *)", "select:not([inert]):not([inert] *)", "textarea:not([inert]):not([inert] *)", "a[href]:not([inert]):not([inert] *)", "button:not([inert]):not([inert] *)", "[tabindex]:not(slot):not([inert]):not([inert] *)", "audio[controls]:not([inert]):not([inert] *)", "video[controls]:not([inert]):not([inert] *)", '[contenteditable]:not([contenteditable="false"]):not([inert]):not([inert] *)', "details>summary:first-of-type:not([inert]):not([inert] *)", "details:not([inert]):not([inert] *)"], gn = /* @__PURE__ */ nl.join(","), rl = typeof Element > "u", dt = rl ? function() {
} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, vn = !rl && Element.prototype.getRootNode ? function(e) {
  var t;
  return e == null || (t = e.getRootNode) === null || t === void 0 ? void 0 : t.call(e);
} : function(e) {
  return e == null ? void 0 : e.ownerDocument;
}, yn = function(t, n) {
  var r;
  n === void 0 && (n = !0);
  var a = t == null || (r = t.getAttribute) === null || r === void 0 ? void 0 : r.call(t, "inert"), i = a === "" || a === "true", o = i || n && t && // closest does not exist on shadow roots, so we fall back to a manual
  // lookup upward, in case it is not defined.
  (typeof t.closest == "function" ? t.closest("[inert]") : yn(t.parentNode));
  return o;
}, ad = function(t) {
  var n, r = t == null || (n = t.getAttribute) === null || n === void 0 ? void 0 : n.call(t, "contenteditable");
  return r === "" || r === "true";
}, al = function(t, n, r) {
  if (yn(t))
    return [];
  var a = Array.prototype.slice.apply(t.querySelectorAll(gn));
  return n && dt.call(t, gn) && a.unshift(t), a = a.filter(r), a;
}, xn = function(t, n, r) {
  for (var a = [], i = Array.from(t); i.length; ) {
    var o = i.shift();
    if (!yn(o, !1))
      if (o.tagName === "SLOT") {
        var l = o.assignedElements(), c = l.length ? l : o.children, d = xn(c, !0, r);
        r.flatten ? a.push.apply(a, d) : a.push({
          scopeParent: o,
          candidates: d
        });
      } else {
        var u = dt.call(o, gn);
        u && r.filter(o) && (n || !t.includes(o)) && a.push(o);
        var f = o.shadowRoot || // check for an undisclosed shadow
        typeof r.getShadowRoot == "function" && r.getShadowRoot(o), p = !yn(f, !1) && (!r.shadowRootFilter || r.shadowRootFilter(o));
        if (f && p) {
          var h = xn(f === !0 ? o.children : f.children, !0, r);
          r.flatten ? a.push.apply(a, h) : a.push({
            scopeParent: o,
            candidates: h
          });
        } else
          i.unshift.apply(i, o.children);
      }
  }
  return a;
}, il = function(t) {
  return !isNaN(parseInt(t.getAttribute("tabindex"), 10));
}, lt = function(t) {
  if (!t)
    throw new Error("No node provided");
  return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || ad(t)) && !il(t) ? 0 : t.tabIndex;
}, id = function(t, n) {
  var r = lt(t);
  return r < 0 && n && !il(t) ? 0 : r;
}, od = function(t, n) {
  return t.tabIndex === n.tabIndex ? t.documentOrder - n.documentOrder : t.tabIndex - n.tabIndex;
}, ol = function(t) {
  return t.tagName === "INPUT";
}, sd = function(t) {
  return ol(t) && t.type === "hidden";
}, ld = function(t) {
  var n = t.tagName === "DETAILS" && Array.prototype.slice.apply(t.children).some(function(r) {
    return r.tagName === "SUMMARY";
  });
  return n;
}, cd = function(t, n) {
  for (var r = 0; r < t.length; r++)
    if (t[r].checked && t[r].form === n)
      return t[r];
}, dd = function(t) {
  if (!t.name)
    return !0;
  var n = t.form || vn(t), r = function(l) {
    return n.querySelectorAll('input[type="radio"][name="' + l + '"]');
  }, a;
  if (typeof window < "u" && typeof window.CSS < "u" && typeof window.CSS.escape == "function")
    a = r(window.CSS.escape(t.name));
  else
    try {
      a = r(t.name);
    } catch (o) {
      return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", o.message), !1;
    }
  var i = cd(a, t.form);
  return !i || i === t;
}, ud = function(t) {
  return ol(t) && t.type === "radio";
}, fd = function(t) {
  return ud(t) && !dd(t);
}, pd = function(t) {
  var n, r = t && vn(t), a = (n = r) === null || n === void 0 ? void 0 : n.host, i = !1;
  if (r && r !== t) {
    var o, l, c;
    for (i = !!((o = a) !== null && o !== void 0 && (l = o.ownerDocument) !== null && l !== void 0 && l.contains(a) || t != null && (c = t.ownerDocument) !== null && c !== void 0 && c.contains(t)); !i && a; ) {
      var d, u, f;
      r = vn(a), a = (d = r) === null || d === void 0 ? void 0 : d.host, i = !!((u = a) !== null && u !== void 0 && (f = u.ownerDocument) !== null && f !== void 0 && f.contains(a));
    }
  }
  return i;
}, Ai = function(t) {
  var n = t.getBoundingClientRect(), r = n.width, a = n.height;
  return r === 0 && a === 0;
}, md = function(t, n) {
  var r = n.displayCheck, a = n.getShadowRoot;
  if (r === "full-native" && "checkVisibility" in t) {
    var i = t.checkVisibility({
      // Checking opacity might be desirable for some use cases, but natively,
      // opacity zero elements _are_ focusable and tabbable.
      checkOpacity: !1,
      opacityProperty: !1,
      contentVisibilityAuto: !0,
      visibilityProperty: !0,
      // This is an alias for `visibilityProperty`. Contemporary browsers
      // support both. However, this alias has wider browser support (Chrome
      // >= 105 and Firefox >= 106, vs. Chrome >= 121 and Firefox >= 122), so
      // we include it anyway.
      checkVisibilityCSS: !0
    });
    return !i;
  }
  if (getComputedStyle(t).visibility === "hidden")
    return !0;
  var o = dt.call(t, "details>summary:first-of-type"), l = o ? t.parentElement : t;
  if (dt.call(l, "details:not([open]) *"))
    return !0;
  if (!r || r === "full" || // full-native can run this branch when it falls through in case
  // Element#checkVisibility is unsupported
  r === "full-native" || r === "legacy-full") {
    if (typeof a == "function") {
      for (var c = t; t; ) {
        var d = t.parentElement, u = vn(t);
        if (d && !d.shadowRoot && a(d) === !0)
          return Ai(t);
        t.assignedSlot ? t = t.assignedSlot : !d && u !== t.ownerDocument ? t = u.host : t = d;
      }
      t = c;
    }
    if (pd(t))
      return !t.getClientRects().length;
    if (r !== "legacy-full")
      return !0;
  } else if (r === "non-zero-area")
    return Ai(t);
  return !1;
}, hd = function(t) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t.tagName))
    for (var n = t.parentElement; n; ) {
      if (n.tagName === "FIELDSET" && n.disabled) {
        for (var r = 0; r < n.children.length; r++) {
          var a = n.children.item(r);
          if (a.tagName === "LEGEND")
            return dt.call(n, "fieldset[disabled] *") ? !0 : !a.contains(t);
        }
        return !0;
      }
      n = n.parentElement;
    }
  return !1;
}, En = function(t, n) {
  return !(n.disabled || sd(n) || md(n, t) || // For a details element with a summary, the summary element gets the focus
  ld(n) || hd(n));
}, Da = function(t, n) {
  return !(fd(n) || lt(n) < 0 || !En(t, n));
}, bd = function(t) {
  var n = parseInt(t.getAttribute("tabindex"), 10);
  return !!(isNaN(n) || n >= 0);
}, sl = function(t) {
  var n = [], r = [];
  return t.forEach(function(a, i) {
    var o = !!a.scopeParent, l = o ? a.scopeParent : a, c = id(l, o), d = o ? sl(a.candidates) : l;
    c === 0 ? o ? n.push.apply(n, d) : n.push(l) : r.push({
      documentOrder: i,
      tabIndex: c,
      item: a,
      isScope: o,
      content: d
    });
  }), r.sort(od).reduce(function(a, i) {
    return i.isScope ? a.push.apply(a, i.content) : a.push(i.content), a;
  }, []).concat(n);
}, gd = function(t, n) {
  n = n || {};
  var r;
  return n.getShadowRoot ? r = xn([t], n.includeContainer, {
    filter: Da.bind(null, n),
    flatten: !1,
    getShadowRoot: n.getShadowRoot,
    shadowRootFilter: bd
  }) : r = al(t, n.includeContainer, Da.bind(null, n)), sl(r);
}, vd = function(t, n) {
  n = n || {};
  var r;
  return n.getShadowRoot ? r = xn([t], n.includeContainer, {
    filter: En.bind(null, n),
    flatten: !0,
    getShadowRoot: n.getShadowRoot
  }) : r = al(t, n.includeContainer, En.bind(null, n)), r;
}, xt = function(t, n) {
  if (n = n || {}, !t)
    throw new Error("No node provided");
  return dt.call(t, gn) === !1 ? !1 : Da(n, t);
}, yd = /* @__PURE__ */ nl.concat("iframe:not([inert]):not([inert] *)").join(","), $n = function(t, n) {
  if (n = n || {}, !t)
    throw new Error("No node provided");
  return dt.call(t, yd) === !1 ? !1 : En(n, t);
};
/*!
* focus-trap 7.6.2
* @license MIT, https://github.com/focus-trap/focus-trap/blob/master/LICENSE
*/
function ja(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function xd(e) {
  if (Array.isArray(e)) return ja(e);
}
function Ed(e, t, n) {
  return (t = Id(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function _d(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Cd() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Mi(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Di(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Mi(Object(n), !0).forEach(function(r) {
      Ed(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Mi(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function wd(e) {
  return xd(e) || _d(e) || Td(e) || Cd();
}
function Od(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Id(e) {
  var t = Od(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
function Td(e, t) {
  if (e) {
    if (typeof e == "string") return ja(e, t);
    var n = {}.toString.call(e).slice(8, -1);
    return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ja(e, t) : void 0;
  }
}
var ji = {
  activateTrap: function(t, n) {
    if (t.length > 0) {
      var r = t[t.length - 1];
      r !== n && r.pause();
    }
    var a = t.indexOf(n);
    a === -1 || t.splice(a, 1), t.push(n);
  },
  deactivateTrap: function(t, n) {
    var r = t.indexOf(n);
    r !== -1 && t.splice(r, 1), t.length > 0 && t[t.length - 1].unpause();
  }
}, Nd = function(t) {
  return t.tagName && t.tagName.toLowerCase() === "input" && typeof t.select == "function";
}, Sd = function(t) {
  return (t == null ? void 0 : t.key) === "Escape" || (t == null ? void 0 : t.key) === "Esc" || (t == null ? void 0 : t.keyCode) === 27;
}, qt = function(t) {
  return (t == null ? void 0 : t.key) === "Tab" || (t == null ? void 0 : t.keyCode) === 9;
}, kd = function(t) {
  return qt(t) && !t.shiftKey;
}, Rd = function(t) {
  return qt(t) && t.shiftKey;
}, Fi = function(t) {
  return setTimeout(t, 0);
}, Pt = function(t) {
  for (var n = arguments.length, r = new Array(n > 1 ? n - 1 : 0), a = 1; a < n; a++)
    r[a - 1] = arguments[a];
  return typeof t == "function" ? t.apply(void 0, r) : t;
}, rn = function(t) {
  return t.target.shadowRoot && typeof t.composedPath == "function" ? t.composedPath()[0] : t.target;
}, Ld = [], Pd = function(t, n) {
  var r = (n == null ? void 0 : n.document) || document, a = (n == null ? void 0 : n.trapStack) || Ld, i = Di({
    returnFocusOnDeactivate: !0,
    escapeDeactivates: !0,
    delayInitialFocus: !0,
    isKeyForward: kd,
    isKeyBackward: Rd
  }, n), o = {
    // containers given to createFocusTrap()
    // @type {Array<HTMLElement>}
    containers: [],
    // list of objects identifying tabbable nodes in `containers` in the trap
    // NOTE: it's possible that a group has no tabbable nodes if nodes get removed while the trap
    //  is active, but the trap should never get to a state where there isn't at least one group
    //  with at least one tabbable node in it (that would lead to an error condition that would
    //  result in an error being thrown)
    // @type {Array<{
    //   container: HTMLElement,
    //   tabbableNodes: Array<HTMLElement>, // empty if none
    //   focusableNodes: Array<HTMLElement>, // empty if none
    //   posTabIndexesFound: boolean,
    //   firstTabbableNode: HTMLElement|undefined,
    //   lastTabbableNode: HTMLElement|undefined,
    //   firstDomTabbableNode: HTMLElement|undefined,
    //   lastDomTabbableNode: HTMLElement|undefined,
    //   nextTabbableNode: (node: HTMLElement, forward: boolean) => HTMLElement|undefined
    // }>}
    containerGroups: [],
    // same order/length as `containers` list
    // references to objects in `containerGroups`, but only those that actually have
    //  tabbable nodes in them
    // NOTE: same order as `containers` and `containerGroups`, but __not necessarily__
    //  the same length
    tabbableGroups: [],
    nodeFocusedBeforeActivation: null,
    mostRecentlyFocusedNode: null,
    active: !1,
    paused: !1,
    // timer ID for when delayInitialFocus is true and initial focus in this trap
    //  has been delayed during activation
    delayInitialFocusTimer: void 0,
    // the most recent KeyboardEvent for the configured nav key (typically [SHIFT+]TAB), if any
    recentNavEvent: void 0
  }, l, c = function(b, E, T) {
    return b && b[E] !== void 0 ? b[E] : i[T || E];
  }, d = function(b, E) {
    var T = typeof (E == null ? void 0 : E.composedPath) == "function" ? E.composedPath() : void 0;
    return o.containerGroups.findIndex(function(A) {
      var F = A.container, M = A.tabbableNodes;
      return F.contains(b) || // fall back to explicit tabbable search which will take into consideration any
      //  web components if the `tabbableOptions.getShadowRoot` option was used for
      //  the trap, enabling shadow DOM support in tabbable (`Node.contains()` doesn't
      //  look inside web components even if open)
      (T == null ? void 0 : T.includes(F)) || M.find(function(D) {
        return D === b;
      });
    });
  }, u = function(b) {
    var E = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, T = E.hasFallback, A = T === void 0 ? !1 : T, F = E.params, M = F === void 0 ? [] : F, D = i[b];
    if (typeof D == "function" && (D = D.apply(void 0, wd(M))), D === !0 && (D = void 0), !D) {
      if (D === void 0 || D === !1)
        return D;
      throw new Error("`".concat(b, "` was specified but was not a node, or did not return a node"));
    }
    var q = D;
    if (typeof D == "string") {
      try {
        q = r.querySelector(D);
      } catch (z) {
        throw new Error("`".concat(b, '` appears to be an invalid selector; error="').concat(z.message, '"'));
      }
      if (!q && !A)
        throw new Error("`".concat(b, "` as selector refers to no known node"));
    }
    return q;
  }, f = function() {
    var b = u("initialFocus", {
      hasFallback: !0
    });
    if (b === !1)
      return !1;
    if (b === void 0 || b && !$n(b, i.tabbableOptions))
      if (d(r.activeElement) >= 0)
        b = r.activeElement;
      else {
        var E = o.tabbableGroups[0], T = E && E.firstTabbableNode;
        b = T || u("fallbackFocus");
      }
    else b === null && (b = u("fallbackFocus"));
    if (!b)
      throw new Error("Your focus-trap needs to have at least one focusable element");
    return b;
  }, p = function() {
    if (o.containerGroups = o.containers.map(function(b) {
      var E = gd(b, i.tabbableOptions), T = vd(b, i.tabbableOptions), A = E.length > 0 ? E[0] : void 0, F = E.length > 0 ? E[E.length - 1] : void 0, M = T.find(function(z) {
        return xt(z);
      }), D = T.slice().reverse().find(function(z) {
        return xt(z);
      }), q = !!E.find(function(z) {
        return lt(z) > 0;
      });
      return {
        container: b,
        tabbableNodes: E,
        focusableNodes: T,
        /** True if at least one node with positive `tabindex` was found in this container. */
        posTabIndexesFound: q,
        /** First tabbable node in container, __tabindex__ order; `undefined` if none. */
        firstTabbableNode: A,
        /** Last tabbable node in container, __tabindex__ order; `undefined` if none. */
        lastTabbableNode: F,
        // NOTE: DOM order is NOT NECESSARILY "document position" order, but figuring that out
        //  would require more than just https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
        //  because that API doesn't work with Shadow DOM as well as it should (@see
        //  https://github.com/whatwg/dom/issues/320) and since this first/last is only needed, so far,
        //  to address an edge case related to positive tabindex support, this seems like a much easier,
        //  "close enough most of the time" alternative for positive tabindexes which should generally
        //  be avoided anyway...
        /** First tabbable node in container, __DOM__ order; `undefined` if none. */
        firstDomTabbableNode: M,
        /** Last tabbable node in container, __DOM__ order; `undefined` if none. */
        lastDomTabbableNode: D,
        /**
         * Finds the __tabbable__ node that follows the given node in the specified direction,
         *  in this container, if any.
         * @param {HTMLElement} node
         * @param {boolean} [forward] True if going in forward tab order; false if going
         *  in reverse.
         * @returns {HTMLElement|undefined} The next tabbable node, if any.
         */
        nextTabbableNode: function(Z) {
          var W = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0, U = E.indexOf(Z);
          return U < 0 ? W ? T.slice(T.indexOf(Z) + 1).find(function(Y) {
            return xt(Y);
          }) : T.slice(0, T.indexOf(Z)).reverse().find(function(Y) {
            return xt(Y);
          }) : E[U + (W ? 1 : -1)];
        }
      };
    }), o.tabbableGroups = o.containerGroups.filter(function(b) {
      return b.tabbableNodes.length > 0;
    }), o.tabbableGroups.length <= 0 && !u("fallbackFocus"))
      throw new Error("Your focus-trap must have at least one container with at least one tabbable node in it at all times");
    if (o.containerGroups.find(function(b) {
      return b.posTabIndexesFound;
    }) && o.containerGroups.length > 1)
      throw new Error("At least one node with a positive tabindex was found in one of your focus-trap's multiple containers. Positive tabindexes are only supported in single-container focus-traps.");
  }, h = function(b) {
    var E = b.activeElement;
    if (E)
      return E.shadowRoot && E.shadowRoot.activeElement !== null ? h(E.shadowRoot) : E;
  }, v = function(b) {
    if (b !== !1 && b !== h(document)) {
      if (!b || !b.focus) {
        v(f());
        return;
      }
      b.focus({
        preventScroll: !!i.preventScroll
      }), o.mostRecentlyFocusedNode = b, Nd(b) && b.select();
    }
  }, m = function(b) {
    var E = u("setReturnFocus", {
      params: [b]
    });
    return E || (E === !1 ? !1 : b);
  }, x = function(b) {
    var E = b.target, T = b.event, A = b.isBackward, F = A === void 0 ? !1 : A;
    E = E || rn(T), p();
    var M = null;
    if (o.tabbableGroups.length > 0) {
      var D = d(E, T), q = D >= 0 ? o.containerGroups[D] : void 0;
      if (D < 0)
        F ? M = o.tabbableGroups[o.tabbableGroups.length - 1].lastTabbableNode : M = o.tabbableGroups[0].firstTabbableNode;
      else if (F) {
        var z = o.tabbableGroups.findIndex(function(ue) {
          var ne = ue.firstTabbableNode;
          return E === ne;
        });
        if (z < 0 && (q.container === E || $n(E, i.tabbableOptions) && !xt(E, i.tabbableOptions) && !q.nextTabbableNode(E, !1)) && (z = D), z >= 0) {
          var Z = z === 0 ? o.tabbableGroups.length - 1 : z - 1, W = o.tabbableGroups[Z];
          M = lt(E) >= 0 ? W.lastTabbableNode : W.lastDomTabbableNode;
        } else qt(T) || (M = q.nextTabbableNode(E, !1));
      } else {
        var U = o.tabbableGroups.findIndex(function(ue) {
          var ne = ue.lastTabbableNode;
          return E === ne;
        });
        if (U < 0 && (q.container === E || $n(E, i.tabbableOptions) && !xt(E, i.tabbableOptions) && !q.nextTabbableNode(E)) && (U = D), U >= 0) {
          var Y = U === o.tabbableGroups.length - 1 ? 0 : U + 1, X = o.tabbableGroups[Y];
          M = lt(E) >= 0 ? X.firstTabbableNode : X.firstDomTabbableNode;
        } else qt(T) || (M = q.nextTabbableNode(E));
      }
    } else
      M = u("fallbackFocus");
    return M;
  }, _ = function(b) {
    var E = rn(b);
    if (!(d(E, b) >= 0)) {
      if (Pt(i.clickOutsideDeactivates, b)) {
        l.deactivate({
          // NOTE: by setting `returnFocus: false`, deactivate() will do nothing,
          //  which will result in the outside click setting focus to the node
          //  that was clicked (and if not focusable, to "nothing"); by setting
          //  `returnFocus: true`, we'll attempt to re-focus the node originally-focused
          //  on activation (or the configured `setReturnFocus` node), whether the
          //  outside click was on a focusable node or not
          returnFocus: i.returnFocusOnDeactivate
        });
        return;
      }
      Pt(i.allowOutsideClick, b) || b.preventDefault();
    }
  }, y = function(b) {
    var E = rn(b), T = d(E, b) >= 0;
    if (T || E instanceof Document)
      T && (o.mostRecentlyFocusedNode = E);
    else {
      b.stopImmediatePropagation();
      var A, F = !0;
      if (o.mostRecentlyFocusedNode)
        if (lt(o.mostRecentlyFocusedNode) > 0) {
          var M = d(o.mostRecentlyFocusedNode), D = o.containerGroups[M].tabbableNodes;
          if (D.length > 0) {
            var q = D.findIndex(function(z) {
              return z === o.mostRecentlyFocusedNode;
            });
            q >= 0 && (i.isKeyForward(o.recentNavEvent) ? q + 1 < D.length && (A = D[q + 1], F = !1) : q - 1 >= 0 && (A = D[q - 1], F = !1));
          }
        } else
          o.containerGroups.some(function(z) {
            return z.tabbableNodes.some(function(Z) {
              return lt(Z) > 0;
            });
          }) || (F = !1);
      else
        F = !1;
      F && (A = x({
        // move FROM the MRU node, not event-related node (which will be the node that is
        //  outside the trap causing the focus escape we're trying to fix)
        target: o.mostRecentlyFocusedNode,
        isBackward: i.isKeyBackward(o.recentNavEvent)
      })), v(A || o.mostRecentlyFocusedNode || f());
    }
    o.recentNavEvent = void 0;
  }, I = function(b) {
    var E = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1;
    o.recentNavEvent = b;
    var T = x({
      event: b,
      isBackward: E
    });
    T && (qt(b) && b.preventDefault(), v(T));
  }, N = function(b) {
    (i.isKeyForward(b) || i.isKeyBackward(b)) && I(b, i.isKeyBackward(b));
  }, R = function(b) {
    Sd(b) && Pt(i.escapeDeactivates, b) !== !1 && (b.preventDefault(), l.deactivate());
  }, L = function(b) {
    var E = rn(b);
    d(E, b) >= 0 || Pt(i.clickOutsideDeactivates, b) || Pt(i.allowOutsideClick, b) || (b.preventDefault(), b.stopImmediatePropagation());
  }, O = function() {
    if (o.active)
      return ji.activateTrap(a, l), o.delayInitialFocusTimer = i.delayInitialFocus ? Fi(function() {
        v(f());
      }) : v(f()), r.addEventListener("focusin", y, !0), r.addEventListener("mousedown", _, {
        capture: !0,
        passive: !1
      }), r.addEventListener("touchstart", _, {
        capture: !0,
        passive: !1
      }), r.addEventListener("click", L, {
        capture: !0,
        passive: !1
      }), r.addEventListener("keydown", N, {
        capture: !0,
        passive: !1
      }), r.addEventListener("keydown", R), l;
  }, w = function() {
    if (o.active)
      return r.removeEventListener("focusin", y, !0), r.removeEventListener("mousedown", _, !0), r.removeEventListener("touchstart", _, !0), r.removeEventListener("click", L, !0), r.removeEventListener("keydown", N, !0), r.removeEventListener("keydown", R), l;
  }, j = function(b) {
    var E = b.some(function(T) {
      var A = Array.from(T.removedNodes);
      return A.some(function(F) {
        return F === o.mostRecentlyFocusedNode;
      });
    });
    E && v(f());
  }, k = typeof window < "u" && "MutationObserver" in window ? new MutationObserver(j) : void 0, C = function() {
    k && (k.disconnect(), o.active && !o.paused && o.containers.map(function(b) {
      k.observe(b, {
        subtree: !0,
        childList: !0
      });
    }));
  };
  return l = {
    get active() {
      return o.active;
    },
    get paused() {
      return o.paused;
    },
    activate: function(b) {
      if (o.active)
        return this;
      var E = c(b, "onActivate"), T = c(b, "onPostActivate"), A = c(b, "checkCanFocusTrap");
      A || p(), o.active = !0, o.paused = !1, o.nodeFocusedBeforeActivation = r.activeElement, E == null || E();
      var F = function() {
        A && p(), O(), C(), T == null || T();
      };
      return A ? (A(o.containers.concat()).then(F, F), this) : (F(), this);
    },
    deactivate: function(b) {
      if (!o.active)
        return this;
      var E = Di({
        onDeactivate: i.onDeactivate,
        onPostDeactivate: i.onPostDeactivate,
        checkCanReturnFocus: i.checkCanReturnFocus
      }, b);
      clearTimeout(o.delayInitialFocusTimer), o.delayInitialFocusTimer = void 0, w(), o.active = !1, o.paused = !1, C(), ji.deactivateTrap(a, l);
      var T = c(E, "onDeactivate"), A = c(E, "onPostDeactivate"), F = c(E, "checkCanReturnFocus"), M = c(E, "returnFocus", "returnFocusOnDeactivate");
      T == null || T();
      var D = function() {
        Fi(function() {
          M && v(m(o.nodeFocusedBeforeActivation)), A == null || A();
        });
      };
      return M && F ? (F(m(o.nodeFocusedBeforeActivation)).then(D, D), this) : (D(), this);
    },
    pause: function(b) {
      if (o.paused || !o.active)
        return this;
      var E = c(b, "onPause"), T = c(b, "onPostPause");
      return o.paused = !0, E == null || E(), w(), C(), T == null || T(), this;
    },
    unpause: function(b) {
      if (!o.paused || !o.active)
        return this;
      var E = c(b, "onUnpause"), T = c(b, "onPostUnpause");
      return o.paused = !1, E == null || E(), p(), O(), C(), T == null || T(), this;
    },
    updateContainerElements: function(b) {
      var E = [].concat(b).filter(Boolean);
      return o.containers = E.map(function(T) {
        return typeof T == "string" ? r.querySelector(T) : T;
      }), o.active && p(), C(), this;
    }
  }, l.updateContainerElements(t), l;
};
function Ad(e) {
  const t = cn(e);
  t.current = e, Ct(() => () => {
    t.current();
  }, []);
}
const oi = zc(function(t, n) {
  var { active: r = !0, paused: a = !1, focusTrapOptions: i = {}, preventScrollOnDeactivate: o = !1 } = t, l = P(t, ["active", "paused", "focusTrapOptions", "preventScrollOnDeactivate"]);
  const c = cn(null);
  Uc(n, () => c.current);
  const d = cn(null);
  Ct(() => {
    const f = Pd(c.current, Object.assign(Object.assign({}, i), { returnFocusOnDeactivate: !1 }));
    return d.current = f, () => {
      f.deactivate();
    };
  }, []), Ct(() => {
    const f = d.current;
    r ? f == null || f.activate() : f == null || f.deactivate();
  }, [r]), Ct(() => {
    const f = d.current;
    a ? f == null || f.pause() : f == null || f.unpause();
  }, [a]);
  const u = cn(typeof document < "u" ? document.activeElement : null);
  return Ad(() => {
    i.returnFocusOnDeactivate !== !1 && u.current instanceof HTMLElement && u.current.focus({
      preventScroll: o
    });
  }), Oe.createElement("div", Object.assign({ ref: c }, l));
});
oi.displayName = "FocusTrap";
function Fa(e) {
  return e[0].toUpperCase() + e.substring(1);
}
function ll(e = "pf") {
  const t = (/* @__PURE__ */ new Date()).getTime() + Math.random().toString(36).slice(2);
  return `${e}-${t}`;
}
const _n = (e, t, n = "", r, a) => {
  if (!e)
    return "";
  if (r && !a) {
    if (r in e)
      return t.modifiers[Vn(`${n}${e[r]}`)];
    const i = ["2xl", "xl", "lg", "md", "sm", "default"], o = i.indexOf(r);
    for (let l = o; l < i.length; l++)
      if (i[l] in e)
        return t.modifiers[Vn(`${n}${e[i[l]]}`)];
    return "";
  }
  return Object.entries(e || {}).map(([i, o]) => `${n}${o}${i !== "default" ? `-on-${i}` : ""}${a && i !== "default" ? "-height" : ""}`).map(Vn).map((i) => i.replace(/-?(\dxl)/gi, (o, l) => `_${l}`)).map((i) => t.modifiers[i]).filter(Boolean).join(" ");
}, Md = (e) => e === null ? null : e >= Lt["2xl"] ? "2xl" : e >= Lt.xl ? "xl" : e >= Lt.lg ? "lg" : e >= Lt.md ? "md" : e >= Lt.sm ? "sm" : "default", Dd = (e) => e === null ? null : e >= Rt["2xl"] ? "2xl" : e >= Rt.xl ? "xl" : e >= Rt.lg ? "lg" : e >= Rt.md ? "md" : e >= Rt.sm ? "sm" : "default", jd = (e) => e.toUpperCase().replace("-", "").replace("_", ""), Vn = (e) => e.replace(/([-_][a-z])/gi, jd), nt = !!(typeof window < "u" && window.document && window.document.createElement), Bi = (e, t) => {
  const n = getComputedStyle(t), r = () => {
    let o = "";
    const l = {
      "50%": "ultra-condensed",
      "62.5%": "extra-condensed",
      "75%": "condensed",
      "87.5%": "semi-condensed",
      "100%": "normal",
      "112.5%": "semi-expanded",
      "125%": "expanded",
      "150%": "extra-expanded",
      "200%": "ultra-expanded"
    };
    let c;
    return n.fontStretch in l ? c = l[n.fontStretch] : c = "normal", o = n.fontStyle + " " + n.fontVariant + " " + n.fontWeight + " " + c + " " + n.fontSize + "/" + n.lineHeight + " " + n.fontFamily, o;
  }, i = document.createElement("canvas").getContext("2d");
  return i.font = n.font || r(), i.measureText(e).width;
}, Fd = (e) => {
  const t = getComputedStyle(e);
  let n = e.clientWidth, r = e.clientHeight;
  return r -= parseFloat(t.paddingTop) + parseFloat(t.paddingBottom), n -= parseFloat(t.paddingLeft) + parseFloat(t.paddingRight), { height: r, width: n };
}, Bd = (e, t) => {
  const n = Fd(e).width;
  let r = t;
  if (Bi(t, e) > n) {
    for (; Bi(`...${r}`, e) > n; )
      r = r.substring(1);
    e.value ? e.value = `...${r}` : e.innerText = `...${r}`;
  } else
    e.value ? e.value = t : e.innerText = t;
}, an = (e) => {
  e.forEach((t) => {
    t.current && clearTimeout(t.current);
  });
}, qd = (e, t = "ltr") => {
  if (!e)
    return t;
  const n = getComputedStyle(e).getPropertyValue("direction");
  return ["ltr", "rtl"].includes(n) ? n : t;
};
let Hd = 0;
function $d() {
  return typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : ll();
}
class Ot extends s.Component {
  constructor() {
    super(...arguments), this.uniqueElement = this.props.isRandom ? $d() : Hd++, this.id = `${this.props.prefix}${this.uniqueElement}`;
  }
  render() {
    return this.props.children(this.id);
  }
}
Ot.displayName = "GenerateId";
Ot.defaultProps = {
  prefix: "pf-random-id-",
  isRandom: !1
};
const cl = "*";
let Vd = 0;
const qi = "OUIA-Generated-", Wn = {};
function pt(e, t, n = !0) {
  return {
    "data-ouia-component-type": `PF5/${e}`,
    "data-ouia-safe": n,
    "data-ouia-component-id": t
  };
}
const mt = (e, t, n = !0, r) => ({
  "data-ouia-component-type": `PF5/${e}`,
  "data-ouia-safe": n,
  "data-ouia-component-id": Wd(e, t, r)
}), Wd = (e, t, n) => {
  const r = ii(() => ht(e, n), [e, n]);
  return t ?? r;
};
function ht(e, t) {
  try {
    let n;
    return typeof window < "u" ? n = `${window.location.href}-${e}-${t || ""}` : n = `${e}-${t || ""}`, Wn[n] || (Wn[n] = 0), `${qi}${e}-${t ? `${t}-` : ""}${++Wn[n]}`;
  } catch {
    return `${qi}${e}-${t ? `${t}-` : ""}${++Vd}`;
  }
}
function Wt(e) {
  const t = e.getBoundingClientRect();
  return {
    width: t.width,
    height: t.height,
    top: t.top,
    right: t.right,
    bottom: t.bottom,
    left: t.left,
    x: t.left,
    y: t.top
  };
}
function ze(e) {
  if (e.toString() !== "[object Window]") {
    const t = e.ownerDocument;
    return t ? t.defaultView : window;
  }
  return e;
}
function si(e) {
  const t = ze(e), n = t.pageXOffset, r = t.pageYOffset;
  return {
    scrollLeft: n,
    scrollTop: r
  };
}
function zt(e) {
  const t = ze(e).Element;
  return e instanceof t || e instanceof Element;
}
function We(e) {
  const t = ze(e).HTMLElement;
  return e instanceof t || e instanceof HTMLElement;
}
function zd(e) {
  return {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  };
}
function Ud(e) {
  return e === ze(e) || !We(e) ? si(e) : zd(e);
}
function Be(e) {
  return e ? (e.nodeName || "").toLowerCase() : null;
}
function Je(e) {
  return (zt(e) ? e.ownerDocument : e.document).documentElement;
}
function li(e) {
  return Wt(Je(e)).left + si(e).scrollLeft;
}
function Xe(e) {
  return ze(e).getComputedStyle(e);
}
function ci(e) {
  const { overflow: t, overflowX: n, overflowY: r } = Xe(e);
  return /auto|scroll|overlay|hidden/.test(t + r + n);
}
function Gd(e, t, n = !1) {
  const r = Je(t), a = Wt(e), i = We(t);
  let o = { scrollLeft: 0, scrollTop: 0 }, l = { x: 0, y: 0 };
  return (i || !i && !n) && ((Be(t) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
  ci(r)) && (o = Ud(t)), We(t) ? (l = Wt(t), l.x += t.clientLeft, l.y += t.clientTop) : r && (l.x = li(r))), {
    x: a.left + o.scrollLeft - l.x,
    y: a.top + o.scrollTop - l.y,
    width: a.width,
    height: a.height
  };
}
function di(e) {
  return {
    x: e.offsetLeft,
    y: e.offsetTop,
    width: e.offsetWidth,
    height: e.offsetHeight
  };
}
function Tn(e) {
  return Be(e) === "html" ? e : (
    // $FlowFixMe: this is a quicker (but less type safe) way to save quite some bytes from the bundle
    e.assignedSlot || // step into the shadow DOM of the parent of a slotted node
    e.parentNode || // DOM Element detected
    // $FlowFixMe: need a better way to handle this...
    e.host || // ShadowRoot detected
    // $FlowFixMe: HTMLElement is a Node
    Je(e)
  );
}
function dl(e) {
  return ["html", "body", "#document"].indexOf(Be(e)) >= 0 ? e.ownerDocument.body : We(e) && ci(e) ? e : dl(Tn(e));
}
function Ht(e, t = []) {
  const n = dl(e), r = Be(n) === "body", a = ze(n), i = r ? [a].concat(a.visualViewport || [], ci(n) ? n : []) : n, o = t.concat(i);
  return r ? o : o.concat(Ht(Tn(i)));
}
function Kd(e) {
  return ["table", "td", "th"].indexOf(Be(e)) >= 0;
}
function Hi(e) {
  if (!We(e) || // https://github.com/popperjs/popper-core/issues/837
  Xe(e).position === "fixed")
    return null;
  const t = e.offsetParent;
  if (t) {
    const n = Je(t);
    if (Be(t) === "body" && Xe(t).position === "static" && Xe(n).position !== "static")
      return n;
  }
  return t;
}
function Xd(e) {
  let t = Tn(e);
  for (; We(t) && ["html", "body"].indexOf(Be(t)) < 0; ) {
    const n = Xe(t);
    if (n.transform !== "none" || n.perspective !== "none" || n.willChange && n.willChange !== "auto")
      return t;
    t = t.parentNode;
  }
  return null;
}
function Kt(e) {
  const t = ze(e);
  let n = Hi(e);
  for (; n && Kd(n) && Xe(n).position === "static"; )
    n = Hi(n);
  return n && Be(n) === "body" && Xe(n).position === "static" ? t : n || Xd(e) || t;
}
const ke = "top", je = "bottom", Fe = "right", Re = "left", ui = "auto", Xt = [ke, je, Fe, Re], It = "start", fi = "end", Yd = "clippingParents", ul = "viewport", At = "popper", Jd = "reference", $i = Xt.reduce((e, t) => e.concat([`${t}-${It}`, `${t}-${fi}`]), []), fl = [...Xt, ui].reduce((e, t) => e.concat([t, `${t}-${It}`, `${t}-${fi}`]), []), Zd = "beforeRead", Qd = "read", eu = "afterRead", tu = "beforeMain", nu = "main", ru = "afterMain", au = "beforeWrite", iu = "write", ou = "afterWrite", su = [
  Zd,
  Qd,
  eu,
  tu,
  nu,
  ru,
  au,
  iu,
  ou
];
function lu(e) {
  const t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set(), r = [];
  e.forEach((i) => {
    t.set(i.name, i);
  });
  function a(i) {
    n.add(i.name), [...i.requires || [], ...i.requiresIfExists || []].forEach((l) => {
      if (!n.has(l)) {
        const c = t.get(l);
        c && a(c);
      }
    }), r.push(i);
  }
  return e.forEach((i) => {
    n.has(i.name) || a(i);
  }), r;
}
function cu(e) {
  const t = lu(e);
  return su.reduce((n, r) => n.concat(t.filter((a) => a.phase === r)), []);
}
function du(e) {
  let t;
  return () => (t || (t = new Promise((n) => {
    Promise.resolve().then(() => {
      t = void 0, n(e());
    });
  })), t);
}
function Ve(e) {
  return e.split("-")[0];
}
function uu(e) {
  const t = e.reduce((n, r) => {
    const a = n[r.name];
    return n[r.name] = a ? Object.assign(Object.assign(Object.assign({}, a), r), { options: Object.assign(Object.assign({}, a.options), r.options), data: Object.assign(Object.assign({}, a.data), r.data) }) : r, n;
  }, {});
  return Object.keys(t).map((n) => t[n]);
}
function fu(e) {
  const t = ze(e), n = Je(e), r = t.visualViewport;
  let a = n.clientWidth, i = n.clientHeight, o = 0, l = 0;
  return r && (a = r.width, i = r.height, /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || (o = r.offsetLeft, l = r.offsetTop)), {
    width: a,
    height: i,
    x: o + li(e),
    y: l
  };
}
function pu(e) {
  const t = Je(e), n = si(e), r = e.ownerDocument.body, a = Math.max(t.scrollWidth, t.clientWidth, r ? r.scrollWidth : 0, r ? r.clientWidth : 0), i = Math.max(t.scrollHeight, t.clientHeight, r ? r.scrollHeight : 0, r ? r.clientHeight : 0);
  let o = -n.scrollLeft + li(e);
  const l = -n.scrollTop;
  return Xe(r || t).direction === "rtl" && (o += Math.max(t.clientWidth, r ? r.clientWidth : 0) - a), { width: a, height: i, x: o, y: l };
}
function pl(e, t) {
  const n = !!(t.getRootNode && t.getRootNode().host);
  if (e.contains(t))
    return !0;
  if (n) {
    let r = t;
    do {
      if (r && e.isSameNode(r))
        return !0;
      r = r.parentNode || r.host;
    } while (r);
  }
  return !1;
}
function Ba(e) {
  return Object.assign(Object.assign({}, e), { left: e.x, top: e.y, right: e.x + e.width, bottom: e.y + e.height });
}
function mu(e) {
  const t = Wt(e);
  return t.top = t.top + e.clientTop, t.left = t.left + e.clientLeft, t.bottom = t.top + e.clientHeight, t.right = t.left + e.clientWidth, t.width = e.clientWidth, t.height = e.clientHeight, t.x = t.left, t.y = t.top, t;
}
function Vi(e, t) {
  return t === ul ? Ba(fu(e)) : We(t) ? mu(t) : Ba(pu(Je(e)));
}
function hu(e) {
  const t = Ht(Tn(e)), r = ["absolute", "fixed"].indexOf(Xe(e).position) >= 0 && We(e) ? Kt(e) : e;
  return zt(r) ? t.filter((a) => zt(a) && pl(a, r) && Be(a) !== "body") : [];
}
function bu(e, t, n) {
  const a = [...t === "clippingParents" ? hu(e) : [].concat(t), n], i = a[0], o = a.reduce((l, c) => {
    const d = Vi(e, c);
    return l.top = Math.max(d.top, l.top), l.right = Math.min(d.right, l.right), l.bottom = Math.min(d.bottom, l.bottom), l.left = Math.max(d.left, l.left), l;
  }, Vi(e, i));
  return o.width = o.right - o.left, o.height = o.bottom - o.top, o.x = o.left, o.y = o.top, o;
}
function Ut(e) {
  return e.split("-")[1];
}
function pi(e) {
  return ["top", "bottom"].indexOf(e) >= 0 ? "x" : "y";
}
function ml({ reference: e, element: t, placement: n }) {
  const r = n ? Ve(n) : null, a = n ? Ut(n) : null, i = e.x + e.width / 2 - t.width / 2, o = e.y + e.height / 2 - t.height / 2;
  let l;
  switch (r) {
    case ke:
      l = {
        x: i,
        y: e.y - t.height
      };
      break;
    case je:
      l = {
        x: i,
        y: e.y + e.height
      };
      break;
    case Fe:
      l = {
        x: e.x + e.width,
        y: o
      };
      break;
    case Re:
      l = {
        x: e.x - t.width,
        y: o
      };
      break;
    default:
      l = {
        x: e.x,
        y: e.y
      };
  }
  const c = r ? pi(r) : null;
  if (c != null) {
    const d = c === "y" ? "height" : "width";
    switch (a) {
      case It:
        l[c] = Math.floor(l[c]) - Math.floor(e[d] / 2 - t[d] / 2);
        break;
      case fi:
        l[c] = Math.floor(l[c]) + Math.ceil(e[d] / 2 - t[d] / 2);
        break;
    }
  }
  return l;
}
function hl() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}
function bl(e) {
  return Object.assign(Object.assign({}, hl()), e);
}
function gl(e, t) {
  return t.reduce((n, r) => (n[r] = e, n), {});
}
function Gt(e, t = {}) {
  const { placement: n = e.placement, boundary: r = Yd, rootBoundary: a = ul, elementContext: i = At, altBoundary: o = !1, padding: l = 0 } = t, c = bl(typeof l != "number" ? l : gl(l, Xt)), d = i === At ? Jd : At, u = e.elements.reference, f = e.rects.popper, p = e.elements[o ? d : i], h = bu(zt(p) ? p : p.contextElement || Je(e.elements.popper), r, a), v = Wt(u), m = ml({
    reference: v,
    element: f,
    placement: n
  }), x = Ba(Object.assign(Object.assign({}, f), m)), _ = i === At ? x : v, y = {
    top: h.top - _.top + c.top,
    bottom: _.bottom - h.bottom + c.bottom,
    left: h.left - _.left + c.left,
    right: _.right - h.right + c.right
  }, I = e.modifiersData.offset;
  if (i === At && I) {
    const N = I[n];
    Object.keys(y).forEach((R) => {
      const L = [Fe, je].indexOf(R) >= 0 ? 1 : -1, O = [ke, je].indexOf(R) >= 0 ? "y" : "x";
      y[R] += N[O] * L;
    });
  }
  return y;
}
const Wi = {
  placement: "bottom",
  modifiers: [],
  strategy: "absolute"
};
function zi(...e) {
  return !e.some((t) => !(t && typeof t.getBoundingClientRect == "function"));
}
function vl(e = {}) {
  const { defaultModifiers: t = [], defaultOptions: n = Wi } = e;
  return function(a, i, o = n) {
    let l = {
      placement: "bottom",
      orderedModifiers: [],
      options: Object.assign(Object.assign({}, Wi), n),
      modifiersData: {},
      elements: {
        reference: a,
        popper: i
      },
      attributes: {},
      styles: {}
    }, c = [], d = !1;
    const u = {
      state: l,
      setOptions(h) {
        p(), l.options = Object.assign(Object.assign(Object.assign({}, n), l.options), h), l.scrollParents = {
          reference: zt(a) ? Ht(a) : a.contextElement ? Ht(a.contextElement) : [],
          popper: Ht(i)
        };
        const v = cu(uu([...t, ...l.options.modifiers]));
        return l.orderedModifiers = v.filter((m) => m.enabled), f(), u.update();
      },
      // Sync update – it will always be executed, even if not necessary. This
      // is useful for low frequency updates where sync behavior simplifies the
      // logic.
      // For high frequency updates (e.g. `resize` and `scroll` events), always
      // prefer the async Popper#update method
      forceUpdate() {
        if (d)
          return;
        const { reference: h, popper: v } = l.elements;
        if (zi(h, v)) {
          l.rects = {
            reference: Gd(h, Kt(v), l.options.strategy === "fixed"),
            popper: di(v)
          }, l.reset = !1, l.placement = l.options.placement, l.orderedModifiers.forEach((m) => l.modifiersData[m.name] = Object.assign({}, m.data));
          for (let m = 0; m < l.orderedModifiers.length; m++) {
            if (l.reset === !0) {
              l.reset = !1, m = -1;
              continue;
            }
            const { fn: x, options: _ = {}, name: y } = l.orderedModifiers[m];
            typeof x == "function" && (l = x({ state: l, options: _, name: y, instance: u }) || l);
          }
        }
      },
      // Async and optimistically optimized update – it will not be executed if
      // not necessary (debounced to run at most once-per-tick)
      update: du(() => new Promise((h) => {
        u.forceUpdate(), h(l);
      })),
      destroy() {
        p(), d = !0;
      }
    };
    if (!zi(a, i))
      return u;
    u.setOptions(o).then((h) => {
      !d && o.onFirstUpdate && o.onFirstUpdate(h);
    });
    function f() {
      l.orderedModifiers.forEach(({ name: h, options: v = {}, effect: m }) => {
        if (typeof m == "function") {
          const x = m({ state: l, name: h, instance: u, options: v }), _ = () => {
          };
          c.push(x || _);
        }
      });
    }
    function p() {
      c.forEach((h) => h()), c = [];
    }
    return u;
  };
}
vl();
const on = { passive: !0 };
function gu({ state: e, instance: t, options: n }) {
  const { scroll: r = !0, resize: a = !0 } = n, i = ze(e.elements.popper), o = [...e.scrollParents.reference, ...e.scrollParents.popper];
  return r && o.forEach((l) => {
    l.addEventListener("scroll", t.update, on);
  }), a && i.addEventListener("resize", t.update, on), () => {
    r && o.forEach((l) => {
      l.removeEventListener("scroll", t.update, on);
    }), a && i.removeEventListener("resize", t.update, on);
  };
}
const vu = {
  name: "eventListeners",
  enabled: !0,
  phase: "write",
  fn: () => {
  },
  effect: gu,
  data: {}
};
function yu({ state: e, name: t }) {
  e.modifiersData[t] = ml({
    reference: e.rects.reference,
    element: e.rects.popper,
    placement: e.placement
  });
}
const xu = {
  name: "popperOffsets",
  enabled: !0,
  phase: "read",
  fn: yu,
  data: {}
}, Eu = {
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto"
};
function _u({ x: e, y: t }) {
  const r = window.devicePixelRatio || 1;
  return {
    x: Math.round(e * r) / r || 0,
    y: Math.round(t * r) / r || 0
  };
}
function Ui({ popper: e, popperRect: t, placement: n, offsets: r, position: a, gpuAcceleration: i, adaptive: o }) {
  let { x: l, y: c } = _u(r);
  const d = r.hasOwnProperty("x"), u = r.hasOwnProperty("y");
  let f = Re, p = ke;
  const h = window;
  if (o) {
    let m = Kt(e);
    m === ze(e) && (m = Je(e)), n === ke && (p = je, c -= m.clientHeight - t.height, c *= i ? 1 : -1), n === Re && (f = Fe, l -= m.clientWidth - t.width, l *= i ? 1 : -1);
  }
  const v = Object.assign({ position: a }, o && Eu);
  return i ? Object.assign(Object.assign({}, v), {
    [p]: u ? "0" : "",
    [f]: d ? "0" : "",
    // Layer acceleration can disable subpixel rendering which causes slightly
    // blurry text on low PPI displays, so we want to use 2D transforms
    // instead
    transform: (h.devicePixelRatio || 1) < 2 ? `translate(${l}px, ${c}px)` : `translate3d(${l}px, ${c}px, 0)`
  }) : Object.assign(Object.assign({}, v), { [p]: u ? `${c}px` : "", [f]: d ? `${l}px` : "", transform: "" });
}
function Cu({ state: e, options: t }) {
  const { gpuAcceleration: n = !0, adaptive: r = !0 } = t, a = {
    placement: Ve(e.placement),
    popper: e.elements.popper,
    popperRect: e.rects.popper,
    gpuAcceleration: n
  };
  e.modifiersData.popperOffsets != null && (e.styles.popper = Object.assign(Object.assign({}, e.styles.popper), Ui(Object.assign(Object.assign({}, a), { offsets: e.modifiersData.popperOffsets, position: e.options.strategy, adaptive: r })))), e.modifiersData.arrow != null && (e.styles.arrow = Object.assign(Object.assign({}, e.styles.arrow), Ui(Object.assign(Object.assign({}, a), { offsets: e.modifiersData.arrow, position: "absolute", adaptive: !1 })))), e.attributes.popper = Object.assign(Object.assign({}, e.attributes.popper), { "data-popper-placement": e.placement });
}
const wu = {
  name: "computeStyles",
  enabled: !0,
  phase: "beforeWrite",
  fn: Cu,
  data: {}
};
function Ou({ state: e }) {
  Object.keys(e.elements).forEach((t) => {
    const n = e.styles[t] || {}, r = e.attributes[t] || {}, a = e.elements[t];
    !We(a) || !Be(a) || (Object.assign(a.style, n), Object.keys(r).forEach((i) => {
      const o = r[i];
      o === !1 ? a.removeAttribute(i) : a.setAttribute(i, o === !0 ? "" : o);
    }));
  });
}
function Iu({ state: e }) {
  const t = {
    popper: {
      position: e.options.strategy,
      left: "0",
      top: "0",
      margin: "0"
    },
    arrow: {
      position: "absolute"
    },
    reference: {}
  };
  return Object.assign(e.elements.popper.style, t.popper), e.elements.arrow && Object.assign(e.elements.arrow.style, t.arrow), () => {
    Object.keys(e.elements).forEach((n) => {
      const r = e.elements[n], a = e.attributes[n] || {}, o = Object.keys(e.styles.hasOwnProperty(n) ? e.styles[n] : t[n]).reduce((l, c) => (l[c] = "", l), {});
      !We(r) || !Be(r) || (Object.assign(r.style, o), Object.keys(a).forEach((l) => {
        r.removeAttribute(l);
      }));
    });
  };
}
const Tu = {
  name: "applyStyles",
  enabled: !0,
  phase: "write",
  fn: Ou,
  effect: Iu,
  requires: ["computeStyles"]
};
function Nu(e, t, n) {
  const r = Ve(e), a = [Re, ke].indexOf(r) >= 0 ? -1 : 1;
  let [i, o] = typeof n == "function" ? n(Object.assign(Object.assign({}, t), { placement: e })) : n;
  return i = i || 0, o = (o || 0) * a, [Re, Fe].indexOf(r) >= 0 ? { x: o, y: i } : { x: i, y: o };
}
function Su({ state: e, options: t, name: n }) {
  const { offset: r = [0, 0] } = t, a = fl.reduce((l, c) => (l[c] = Nu(c, e.rects, r), l), {}), { x: i, y: o } = a[e.placement];
  e.modifiersData.popperOffsets != null && (e.modifiersData.popperOffsets.x += i, e.modifiersData.popperOffsets.y += o), e.modifiersData[n] = a;
}
const ku = {
  name: "offset",
  enabled: !0,
  phase: "main",
  requires: ["popperOffsets"],
  fn: Su
}, Ru = { left: "right", right: "left", bottom: "top", top: "bottom" };
function dn(e) {
  return e.replace(/left|right|bottom|top/g, (t) => Ru[t]);
}
const Lu = { start: "end", end: "start" };
function Gi(e) {
  return e.replace(/start|end/g, (t) => Lu[t]);
}
function Pu(e, t = {}) {
  const { placement: n, boundary: r, rootBoundary: a, padding: i, flipVariations: o, allowedAutoPlacements: l = fl } = t, c = Ut(n), d = c ? o ? $i : $i.filter((p) => Ut(p) === c) : Xt;
  let u = d.filter((p) => l.indexOf(p) >= 0);
  u.length === 0 && (u = d);
  const f = u.reduce((p, h) => (p[h] = Gt(e, {
    placement: h,
    boundary: r,
    rootBoundary: a,
    padding: i
  })[Ve(h)], p), {});
  return Object.keys(f).sort((p, h) => f[p] - f[h]);
}
function Au(e) {
  if (Ve(e) === ui)
    return [];
  const t = dn(e);
  return [
    Gi(e),
    t,
    Gi(t)
  ];
}
function Mu({ state: e, options: t, name: n }) {
  if (e.modifiersData[n]._skip)
    return;
  const { mainAxis: r = !0, altAxis: a = !0, fallbackPlacements: i, padding: o, boundary: l, rootBoundary: c, altBoundary: d, flipVariations: u = !0, allowedAutoPlacements: f } = t, p = e.options.placement, v = Ve(p) === p, m = i || (v || !u ? [dn(p)] : Au(p)), x = [p, ...m].reduce((L, O) => L.concat(Ve(O) === ui ? Pu(e, {
    placement: O,
    boundary: l,
    rootBoundary: c,
    padding: o,
    flipVariations: u,
    allowedAutoPlacements: f
  }) : O), []), _ = e.rects.reference, y = e.rects.popper, I = /* @__PURE__ */ new Map();
  let N = !0, R = x[0];
  for (let L = 0; L < x.length; L++) {
    const O = x[L], w = Ve(O), j = Ut(O) === It, k = [ke, je].indexOf(w) >= 0, C = k ? "width" : "height", S = Gt(e, {
      placement: O,
      boundary: l,
      rootBoundary: c,
      altBoundary: d,
      padding: o
    });
    let b = k ? j ? Fe : Re : j ? je : ke;
    _[C] > y[C] && (b = dn(b));
    const E = dn(b), T = [];
    if (r && T.push(S[w] <= 0), a && T.push(S[b] <= 0, S[E] <= 0), T.every((A) => A)) {
      R = O, N = !1;
      break;
    }
    I.set(O, T);
  }
  if (N) {
    const L = u ? 3 : 1;
    for (let O = L; O > 0; O--) {
      const w = x.find((j) => {
        const k = I.get(j);
        if (k)
          return k.slice(0, O).every((C) => C);
      });
      if (w) {
        R = w;
        break;
      }
    }
  }
  e.placement !== R && (e.modifiersData[n]._skip = !0, e.placement = R, e.reset = !0);
}
const Du = {
  name: "flip",
  enabled: !0,
  phase: "main",
  fn: Mu,
  requiresIfExists: ["offset"],
  data: { _skip: !1 }
};
function ju(e) {
  return e === "x" ? "y" : "x";
}
function un(e, t, n) {
  return Math.max(e, Math.min(t, n));
}
function Fu({ state: e, options: t, name: n }) {
  const { mainAxis: r = !0, altAxis: a = !1, boundary: i, rootBoundary: o, altBoundary: l, padding: c, tether: d = !0, tetherOffset: u = 0 } = t, f = Gt(e, {
    boundary: i,
    rootBoundary: o,
    padding: c,
    altBoundary: l
  }), p = Ve(e.placement), h = Ut(e.placement), v = !h, m = pi(p), x = ju(m), _ = e.modifiersData.popperOffsets, y = e.rects.reference, I = e.rects.popper, N = typeof u == "function" ? u(Object.assign(Object.assign({}, e.rects), { placement: e.placement })) : u, R = { x: 0, y: 0 };
  if (_) {
    if (r) {
      const L = m === "y" ? ke : Re, O = m === "y" ? je : Fe, w = m === "y" ? "height" : "width", j = _[m], k = _[m] + f[L], C = _[m] - f[O], S = d ? -I[w] / 2 : 0, b = h === It ? y[w] : I[w], E = h === It ? -I[w] : -y[w], T = e.elements.arrow, A = d && T ? di(T) : { width: 0, height: 0 }, F = e.modifiersData["arrow#persistent"] ? e.modifiersData["arrow#persistent"].padding : hl(), M = F[L], D = F[O], q = un(0, y[w], A[w]), z = v ? y[w] / 2 - S - q - M - N : b - q - M - N, Z = v ? -y[w] / 2 + S + q + D + N : E + q + D + N, W = e.elements.arrow && Kt(e.elements.arrow), U = W ? m === "y" ? W.clientTop || 0 : W.clientLeft || 0 : 0, Y = e.modifiersData.offset ? e.modifiersData.offset[e.placement][m] : 0, X = _[m] + z - Y - U, ue = _[m] + Z - Y, ne = un(d ? Math.min(k, X) : k, j, d ? Math.max(C, ue) : C);
      _[m] = ne, R[m] = ne - j;
    }
    if (a) {
      const L = m === "x" ? ke : Re, O = m === "x" ? je : Fe, w = _[x], j = w + f[L], k = w - f[O], C = un(j, w, k);
      _[x] = C, R[x] = C - w;
    }
    e.modifiersData[n] = R;
  }
}
const Bu = {
  name: "preventOverflow",
  enabled: !0,
  phase: "main",
  fn: Fu,
  requiresIfExists: ["offset"]
};
function qu({ state: e, name: t }) {
  const n = e.elements.arrow, r = e.modifiersData.popperOffsets, a = Ve(e.placement), i = pi(a), l = [Re, Fe].indexOf(a) >= 0 ? "height" : "width";
  if (!n || !r)
    return;
  const c = e.modifiersData[`${t}#persistent`].padding, d = di(n), u = i === "y" ? ke : Re, f = i === "y" ? je : Fe, p = e.rects.reference[l] + e.rects.reference[i] - r[i] - e.rects.popper[l], h = r[i] - e.rects.reference[i], v = Kt(n), m = v ? i === "y" ? v.clientHeight || 0 : v.clientWidth || 0 : 0, x = p / 2 - h / 2, _ = c[u], y = m - d[l] - c[f], I = m / 2 - d[l] / 2 + x, N = un(_, I, y), R = i;
  e.modifiersData[t] = {
    [R]: N,
    centerOffset: N - I
  };
}
function Hu({ state: e, options: t, name: n }) {
  let { element: r = "[data-popper-arrow]", padding: a = 0 } = t;
  r != null && (typeof r == "string" && (r = e.elements.popper.querySelector(r), !r) || pl(e.elements.popper, r) && (e.elements.arrow = r, e.modifiersData[`${n}#persistent`] = {
    padding: bl(typeof a != "number" ? a : gl(a, Xt))
  }));
}
const $u = {
  name: "arrow",
  enabled: !0,
  phase: "main",
  fn: qu,
  effect: Hu,
  requires: ["popperOffsets"],
  requiresIfExists: ["preventOverflow"]
};
function Ki(e, t, n = { x: 0, y: 0 }) {
  return {
    top: e.top - t.height - n.y,
    right: e.right - t.width + n.x,
    bottom: e.bottom - t.height + n.y,
    left: e.left - t.width - n.x
  };
}
function Xi(e) {
  return [ke, Fe, je, Re].some((t) => e[t] >= 0);
}
function Vu({ state: e, name: t }) {
  const n = e.rects.reference, r = e.rects.popper, a = e.modifiersData.preventOverflow, i = Gt(e, {
    elementContext: "reference"
  }), o = Gt(e, {
    altBoundary: !0
  }), l = Ki(i, n), c = Ki(o, r, a), d = Xi(l), u = Xi(c);
  e.modifiersData[t] = {
    referenceClippingOffsets: l,
    popperEscapeOffsets: c,
    isReferenceHidden: d,
    hasPopperEscaped: u
  }, e.attributes.popper = Object.assign(Object.assign({}, e.attributes.popper), { "data-popper-reference-hidden": d, "data-popper-escaped": u });
}
const Wu = {
  name: "hide",
  enabled: !0,
  phase: "main",
  requiresIfExists: ["preventOverflow"],
  fn: Vu
}, zu = [
  vu,
  xu,
  wu,
  Tu,
  ku,
  Du,
  Bu,
  $u,
  Wu
], Uu = vl({ defaultModifiers: zu }), Cn = nt ? s.useLayoutEffect : s.useEffect, Gu = (e, t) => JSON.stringify(e) === JSON.stringify(t), Yi = (e) => e.reduce((t, [n, r]) => (t[n] = r, t), {}), Ku = [], Xu = (e, t, n = {}) => {
  const r = s.useRef(null), a = {
    onFirstUpdate: n.onFirstUpdate,
    placement: n.placement || "bottom",
    strategy: n.strategy || "absolute",
    modifiers: n.modifiers || Ku
  }, [i, o] = s.useState({
    styles: {
      popper: {
        position: a.strategy,
        left: "0",
        top: "0"
      }
    },
    attributes: {}
  }), l = s.useMemo(() => ({
    name: "updateState",
    enabled: !0,
    phase: "write",
    // eslint-disable-next-line no-shadow
    fn: ({ state: u }) => {
      const f = Object.keys(u.elements);
      o({
        styles: Yi(f.map((p) => [p, u.styles[p] || {}])),
        attributes: Yi(f.map((p) => [p, u.attributes[p]]))
      });
    },
    requires: ["computeStyles"]
  }), []), c = s.useMemo(() => {
    const u = {
      onFirstUpdate: a.onFirstUpdate,
      placement: a.placement,
      strategy: a.strategy,
      modifiers: [...a.modifiers, l, { name: "applyStyles", enabled: !1 }]
    };
    return Gu(r.current, u) ? r.current || u : (r.current = u, u);
  }, [
    a.onFirstUpdate,
    a.placement,
    a.strategy,
    a.modifiers,
    l
  ]), d = s.useRef();
  return Cn(() => {
    d && d.current && d.current.setOptions(c);
  }, [c]), Cn(() => {
    if (e == null || t == null)
      return;
    const f = (n.createPopper || Uu)(e, t, c);
    return d.current = f, () => {
      f.destroy(), d.current = null;
    };
  }, [e, t, n.createPopper]), {
    state: d.current ? d.current.state : null,
    styles: i.styles,
    attributes: i.attributes,
    update: d.current ? d.current.update : null,
    forceUpdate: d.current ? d.current.forceUpdate : null
  };
}, Yu = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom",
  "top-start": "bottom-end",
  "top-end": "bottom-start",
  "bottom-start": "top-end",
  "bottom-end": "top-start",
  "left-start": "right-end",
  "left-end": "right-start",
  "right-start": "left-end",
  "right-end": "left-start"
}, Ju = (e) => e.replace(/left|right|bottom|top|top-start|top-end|bottom-start|bottom-end|right-start|right-end|left-start|left-end/g, (t) => Yu[t]), Zu = (e) => `opacity ${e}ms cubic-bezier(.54, 1.5, .38, 1.11)`, Nn = ({ trigger: e, popper: t, direction: n = "down", position: r = "start", placement: a, width: i, minWidth: o = "trigger", maxWidth: l, appendTo: c = "inline", zIndex: d = 9999, isVisible: u = !0, positionModifiers: f, distance: p = 0, onMouseEnter: h, onMouseLeave: v, onFocus: m, onBlur: x, onDocumentClick: _, onTriggerClick: y, onTriggerEnter: I, onPopperClick: N, onPopperMouseEnter: R, onPopperMouseLeave: L, onDocumentKeyDown: O, enableFlip: w = !0, flipBehavior: j = "flip", triggerRef: k, popperRef: C, animationDuration: S = 0, entryDelay: b = 0, exitDelay: E = 0, onHidden: T = () => {
}, onHide: A = () => {
}, onMount: F = () => {
}, onShow: M = () => {
}, onShown: D = () => {
}, preventOverflow: q = !1 }) => {
  var z;
  const [Z, W] = s.useState(null), [U, Y] = s.useState(null), [X, ue] = s.useState(null), [ne, Ie] = s.useState(null), [ge, J] = s.useState(!1), [te, Le] = s.useState(0), [Ee, Pe] = s.useState(u), Te = s.useRef(null), le = s.useRef(null), ve = s.useRef(null), Ue = s.useRef(), se = U || Z, Ze = u || Ee, gt = (z = (k == null ? void 0 : k.current) || Z) === null || z === void 0 ? void 0 : z.parentElement, vt = qd(gt), Ae = s.useMemo(() => {
    const G = { left: "left", right: "right", center: "center" };
    return {
      ltr: Object.assign({ start: "left", end: "right" }, G),
      rtl: Object.assign({ start: "right", end: "left" }, G)
    }[vt][r];
  }, [r, vt]), $ = s.useCallback((G) => _(G, se, X), [Ze, Z, U, X, _]);
  s.useEffect(() => {
    J(!0), F();
  }, []), s.useEffect(() => () => {
    an([Te, ve, le]);
  }, []), s.useEffect(() => {
    k && (k.current ? Y(k.current) : typeof k == "function" && Y(k()));
  }, [k, e]), s.useEffect(() => {
    C && (C.current ? ue(C.current) : typeof C == "function" && ue(C()));
  }, [Ze, C]), s.useEffect(() => {
    const G = new MutationObserver(() => {
      He && He();
    });
    return X && G.observe(X, { attributes: !0, childList: !0, subtree: !0 }), () => {
      G.disconnect();
    };
  }, [X]);
  const ce = (G, ie, at, it = !1) => {
    G && ie && ie.addEventListener(at, G, { capture: it });
  }, de = (G, ie, at, it = !1) => {
    G && ie && ie.removeEventListener(at, G, { capture: it });
  };
  s.useEffect(() => (ce(h, se, "mouseenter"), ce(v, se, "mouseleave"), ce(m, se, "focus"), ce(x, se, "blur"), ce(y, se, "click"), ce(I, se, "keydown"), ce(N, X, "click"), ce(R, X, "mouseenter"), ce(L, X, "mouseleave"), _ && ce($, document, "click", !0), ce(O, document, "keydown", !0), () => {
    de(h, se, "mouseenter"), de(v, se, "mouseleave"), de(m, se, "focus"), de(x, se, "blur"), de(y, se, "click"), de(I, se, "keydown"), de(N, X, "click"), de(R, X, "mouseenter"), de(L, X, "mouseleave"), _ && de($, document, "click", !0), de(O, document, "keydown", !0);
  }), [
    Z,
    X,
    h,
    v,
    m,
    x,
    y,
    I,
    N,
    R,
    L,
    _,
    O,
    U
  ]);
  const Qe = () => {
    if (a)
      return a;
    let G = n === "up" ? "top" : "bottom";
    return Ae !== "center" && (G = `${G}-${Ae === "right" ? "end" : "start"}`), G;
  }, rt = s.useMemo(Qe, [n, Ae, a]), nn = s.useMemo(() => Ju(Qe()), [n, Ae, a]), K = s.useMemo(() => ({
    name: "widthMods",
    enabled: i !== void 0 || o !== void 0 || l !== void 0,
    phase: "beforeWrite",
    requires: ["computeStyles"],
    fn: ({ state: G }) => {
      const ie = G.rects.reference.width;
      i && (G.styles.popper.width = i === "trigger" ? `${ie}px` : i), o && (G.styles.popper.minWidth = o === "trigger" ? `${ie}px` : o), l && (G.styles.popper.maxWidth = l === "trigger" ? `${ie}px` : l);
    },
    effect: ({ state: G }) => {
      const ie = G.elements.reference.offsetWidth;
      return i && (G.elements.popper.style.width = i === "trigger" ? `${ie}px` : i), o && (G.elements.popper.style.minWidth = o === "trigger" ? `${ie}px` : o), l && (G.elements.popper.style.maxWidth = l === "trigger" ? `${ie}px` : l), () => {
      };
    }
  }), [i, o, l]), { styles: Q, attributes: me, update: He, forceUpdate: yt } = Xu(se, X, {
    placement: rt,
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, p]
        }
      },
      {
        name: "preventOverflow",
        enabled: q
      },
      {
        // adds attribute [data-popper-reference-hidden] to the popper element which can be used to hide it using CSS
        name: "hide",
        enabled: !0
      },
      {
        name: "flip",
        enabled: rt.startsWith("auto") || w,
        options: {
          fallbackPlacements: j === "flip" ? [nn] : j
        }
      },
      K
    ]
  });
  s.useEffect(() => {
    var G, ie, at, it, Fn, Bn, qn;
    const Hn = ((it = (at = (ie = (G = t == null ? void 0 : t.props) === null || G === void 0 ? void 0 : G.children) === null || ie === void 0 ? void 0 : ie[1]) === null || at === void 0 ? void 0 : at.props) === null || it === void 0 ? void 0 : it.children) || ((qn = (Bn = (Fn = t == null ? void 0 : t.props) === null || Fn === void 0 ? void 0 : Fn.children) === null || Bn === void 0 ? void 0 : Bn.props) === null || qn === void 0 ? void 0 : qn.children);
    Ie(Hn), Hn && ne && Hn !== ne && yt && yt();
  }, [t]), s.useEffect(() => {
    Ue.current < E && (an([Te, ve]), ve.current = setTimeout(() => {
      Te.current = setTimeout(() => {
        Pe(!1);
      }, S);
    }, E)), Ue.current = E;
  }, [E]);
  const et = () => {
    M(), an([Te, ve]), le.current = setTimeout(() => {
      Pe(!0), Le(1), D();
    }, b);
  }, St = () => {
    A(), an([le]), ve.current = setTimeout(() => {
      Le(0), Te.current = setTimeout(() => {
        Pe(!1), T();
      }, S);
    }, E);
  };
  s.useEffect(() => {
    u ? et() : St();
  }, [u]);
  const kt = () => {
    if (me && me.popper && me.popper["data-popper-placement"]) {
      const G = me.popper["data-popper-placement"];
      return f[G];
    }
    return f.top;
  }, Ri = Object.assign({ className: g(t.props && t.props.className, f && kt()), style: Object.assign(Object.assign(Object.assign({}, t.props && t.props.style || {}), Q.popper), {
    zIndex: d,
    opacity: te,
    transition: Zu(S)
  }) }, me.popper), Li = () => {
    const G = s.cloneElement(t, Ri);
    return C ? G : s.createElement("div", { style: { display: "contents" }, ref: (ie) => ue(ie == null ? void 0 : ie.firstElementChild) }, G);
  }, Wc = () => {
    if (c === "inline")
      return Li();
    {
      const G = typeof c == "function" ? c() : c;
      return tl.createPortal(Li(), G);
    }
  };
  return s.createElement(
    s.Fragment,
    null,
    !k && e && s.isValidElement(e) && s.createElement("div", { style: { display: "contents" }, ref: (G) => W(G == null ? void 0 : G.firstElementChild) }, e),
    k && e && s.isValidElement(e) && e,
    ge && Ze && Wc()
  );
};
Nn.displayName = "Popper";
const yl = (e, t, n = (d) => document.activeElement.contains(d), r = (d) => d, a = ["A", "BUTTON", "INPUT"], i = !1, o = !1, l = !0, c = !0) => {
  const d = document.activeElement, u = e.key;
  let f = null;
  if (!i && ["ArrowUp", "ArrowDown"].includes(u)) {
    e.preventDefault(), e.stopImmediatePropagation();
    let p = -1;
    t.forEach((h, v) => {
      if (n(h)) {
        let m = 0;
        for (; !f && m < t.length && m * -1 < t.length; )
          u === "ArrowUp" ? m-- : m++, p = v + m, p >= t.length && (p = 0), p < 0 && (p = t.length - 1), f = r(t[p]);
      }
    });
  }
  if (!o && ["ArrowLeft", "ArrowRight"].includes(u)) {
    e.preventDefault(), e.stopImmediatePropagation();
    let p = -1;
    t.forEach((h, v) => {
      if (n(h)) {
        const m = t[v].querySelectorAll(a.join(","));
        if (!m.length || c) {
          let x = d;
          for (; x; )
            if (x = u === "ArrowLeft" ? x.previousElementSibling : x.nextElementSibling, x && a.includes(x.tagName)) {
              f = x;
              break;
            }
        } else
          m.forEach((x, _) => {
            e.target === x && (p = _ + (u === "ArrowLeft" ? -1 : 1), p >= m.length && (p = 0), p < 0 && (p = m.length - 1), f = m[p]);
          });
      }
    });
  }
  f && (l && (d.tabIndex = -1, f.tabIndex = 0), f.focus());
}, Qu = (e) => {
  e && e.length > 0 && (e.forEach((t) => {
    t.tabIndex = -1;
  }), e[0].tabIndex = 0);
}, ef = (e, t) => {
  var n;
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp")
    return;
  e.preventDefault();
  const a = Array.from((n = t.current) === null || n === void 0 ? void 0 : n.querySelectorAll("li")).map((o) => o.querySelector('button:not(:disabled),input:not(:disabled),a:not([aria-disabled="true"])')).filter((o) => o !== null);
  let i;
  e.key === "ArrowDown" ? i = a[0] : i = a[a.length - 1], i && i.focus();
};
class mi extends s.Component {
  constructor() {
    super(...arguments), this.keyHandler = (t) => {
      const { isEventFromContainer: n } = this.props;
      if (n ? !n(t) : !this._isEventFromContainer(t))
        return;
      const { isActiveElement: r, getFocusableElement: a, noVerticalArrowHandling: i, noHorizontalArrowHandling: o, noEnterHandling: l, noSpaceHandling: c, updateTabIndex: d, validSiblingTags: u, additionalKeyHandler: f, createNavigableElements: p, onlyTraverseSiblings: h } = this.props;
      f && f(t);
      const v = p();
      if (!v) {
        console.warn("No navigable elements have been passed to the KeyboardHandler. Keyboard navigation provided by this component will be ignored.");
        return;
      }
      const m = t.key;
      l || m === "Enter" && (t.preventDefault(), t.stopImmediatePropagation(), document.activeElement.click()), c || m === " " && (t.preventDefault(), t.stopImmediatePropagation(), document.activeElement.click()), yl(t, v, r, a, u, i, o, d, h);
    }, this._isEventFromContainer = (t) => {
      const { containerRef: n } = this.props;
      return n.current && n.current.contains(t.target);
    };
  }
  componentDidMount() {
    nt && window.addEventListener("keydown", this.keyHandler);
  }
  componentWillUnmount() {
    nt && window.removeEventListener("keydown", this.keyHandler);
  }
  render() {
    return null;
  }
}
mi.displayName = "KeyboardHandler";
mi.defaultProps = {
  containerRef: null,
  createNavigableElements: () => null,
  isActiveElement: (e) => document.activeElement === e,
  getFocusableElement: (e) => e,
  validSiblingTags: ["BUTTON", "A"],
  onlyTraverseSiblings: !0,
  updateTabIndex: !0,
  noHorizontalArrowHandling: !1,
  noVerticalArrowHandling: !1,
  noEnterHandling: !1,
  noSpaceHandling: !1
};
const tf = (e, t, n) => {
  let r;
  if (nt) {
    const { ResizeObserver: a } = window;
    if (e && a) {
      const i = new a((o) => {
        window.requestAnimationFrame(() => {
          Array.isArray(o) && o.length > 0 && t();
        });
      });
      i.observe(e), r = () => i.unobserve(e);
    } else
      window.addEventListener("resize", t), r = () => window.removeEventListener("resize", t);
  }
  return () => {
    r && r();
  };
};
var Ji;
(function(e) {
  e.md = "md", e.lg = "lg", e.xl = "xl", e["2xl"] = "2xl", e["3xl"] = "3xl", e["4xl"] = "4xl";
})(Ji || (Ji = {}));
var qa;
(function(e) {
  e.h1 = "2xl", e.h2 = "xl", e.h3 = "lg", e.h4 = "md", e.h5 = "md", e.h6 = "md";
})(qa || (qa = {}));
const hi = (e) => {
  var { className: t = "", children: n = "", headingLevel: r, size: a = qa[r], ouiaId: i, ouiaSafe: o = !0 } = e, l = P(e, ["className", "children", "headingLevel", "size", "ouiaId", "ouiaSafe"]);
  const c = mt(hi.displayName, i, o);
  return s.createElement(r, Object.assign({}, c, l, { className: g(Pi.title, a && Pi.modifiers[a], t) }), n);
};
hi.displayName = "Title";
const he = {
  button: "pf-v5-c-button",
  buttonCount: "pf-v5-c-button__count",
  buttonIcon: "pf-v5-c-button__icon",
  buttonProgress: "pf-v5-c-button__progress",
  modifiers: {
    active: "pf-m-active",
    block: "pf-m-block",
    small: "pf-m-small",
    primary: "pf-m-primary",
    displayLg: "pf-m-display-lg",
    secondary: "pf-m-secondary",
    tertiary: "pf-m-tertiary",
    link: "pf-m-link",
    unread: "pf-m-unread",
    inline: "pf-m-inline",
    danger: "pf-m-danger",
    warning: "pf-m-warning",
    control: "pf-m-control",
    expanded: "pf-m-expanded",
    plain: "pf-m-plain",
    noPadding: "pf-m-no-padding",
    disabled: "pf-m-disabled",
    ariaDisabled: "pf-m-aria-disabled",
    progress: "pf-m-progress",
    inProgress: "pf-m-in-progress",
    start: "pf-m-start",
    end: "pf-m-end"
  }
}, sn = {
  modifiers: {
    inline: "pf-m-inline",
    sm: "pf-m-sm",
    md: "pf-m-md",
    lg: "pf-m-lg",
    xl: "pf-m-xl"
  },
  spinner: "pf-v5-c-spinner",
  spinnerPath: "pf-v5-c-spinner__path"
}, nf = {
  name: "--pf-v5-c-spinner--diameter"
};
var Ha;
(function(e) {
  e.sm = "sm", e.md = "md", e.lg = "lg", e.xl = "xl";
})(Ha || (Ha = {}));
const bi = (e) => {
  var { className: t = "", size: n = "xl", "aria-valuetext": r = "Loading...", diameter: a, isInline: i = !1, "aria-label": o, "aria-labelledBy": l } = e, c = P(e, ["className", "size", "aria-valuetext", "diameter", "isInline", "aria-label", "aria-labelledBy"]);
  return s.createElement(
    "svg",
    Object.assign({ className: g(sn.spinner, i ? sn.modifiers.inline : sn.modifiers[n], t), role: "progressbar", "aria-valuetext": r, viewBox: "0 0 100 100" }, a && { style: { [nf.name]: a } }, o && { "aria-label": o }, l && { "aria-labelledBy": l }, !o && !l && { "aria-label": "Contents" }, c),
    s.createElement("circle", { className: sn.spinnerPath, cx: "50", cy: "50", r: "45", fill: "none" })
  );
};
bi.displayName = "Spinner";
const zn = {
  badge: "pf-v5-c-badge",
  modifiers: {
    read: "pf-m-read",
    unread: "pf-m-unread"
  }
}, xl = (e) => {
  var { isRead: t = !1, className: n = "", children: r = "", screenReaderText: a } = e, i = P(e, ["isRead", "className", "children", "screenReaderText"]);
  return s.createElement(
    "span",
    Object.assign({}, i, { className: g(zn.badge, t ? zn.modifiers.read : zn.modifiers.unread, n) }),
    r,
    a && s.createElement("span", { className: "pf-v5-screen-reader" }, a)
  );
};
xl.displayName = "Badge";
var Me;
(function(e) {
  e.primary = "primary", e.secondary = "secondary", e.tertiary = "tertiary", e.danger = "danger", e.warning = "warning", e.link = "link", e.plain = "plain", e.control = "control";
})(Me || (Me = {}));
var $a;
(function(e) {
  e.button = "button", e.submit = "submit", e.reset = "reset";
})($a || ($a = {}));
var $t;
(function(e) {
  e.default = "default", e.sm = "sm", e.lg = "lg";
})($t || ($t = {}));
const rf = (e) => {
  var { children: t = null, className: n = "", component: r = "button", isActive: a = !1, isBlock: i = !1, isDisabled: o = !1, isAriaDisabled: l = !1, isLoading: c = null, isDanger: d = !1, spinnerAriaValueText: u, spinnerAriaLabelledBy: f, spinnerAriaLabel: p, size: h = $t.default, inoperableEvents: v = ["onClick", "onKeyPress"], isInline: m = !1, type: x = $a.button, variant: _ = Me.primary, iconPosition: y = "start", "aria-label": I = null, icon: N = null, ouiaId: R, ouiaSafe: L = !0, tabIndex: O = null, innerRef: w, countOptions: j } = e, k = P(e, ["children", "className", "component", "isActive", "isBlock", "isDisabled", "isAriaDisabled", "isLoading", "isDanger", "spinnerAriaValueText", "spinnerAriaLabelledBy", "spinnerAriaLabel", "size", "inoperableEvents", "isInline", "type", "variant", "iconPosition", "aria-label", "icon", "ouiaId", "ouiaSafe", "tabIndex", "innerRef", "countOptions"]);
  const C = mt(oe.displayName, R, L, _), S = r, b = S === "button", E = m && S === "span", T = v.reduce((F, M) => Object.assign(Object.assign({}, F), { [M]: (D) => {
    D.preventDefault();
  } }), {}), A = () => {
    if (o)
      return b ? null : -1;
    if (l)
      return null;
    if (E)
      return 0;
  };
  return s.createElement(
    S,
    Object.assign({}, k, l ? T : null, { "aria-disabled": o || l, "aria-label": I, className: g(he.button, he.modifiers[_], i && he.modifiers.block, o && he.modifiers.disabled, l && he.modifiers.ariaDisabled, a && he.modifiers.active, m && _ === Me.link && he.modifiers.inline, d && (_ === Me.secondary || _ === Me.link) && he.modifiers.danger, c !== null && _ !== Me.plain && he.modifiers.progress, c && he.modifiers.inProgress, h === $t.sm && he.modifiers.small, h === $t.lg && he.modifiers.displayLg, n), disabled: b ? o : null, tabIndex: O !== null ? O : A(), type: b || E ? x : null, role: E ? "button" : null, ref: w }, C),
    c && s.createElement(
      "span",
      { className: g(he.buttonProgress) },
      s.createElement(bi, { size: Ha.md, isInline: m, "aria-valuetext": u, "aria-label": p, "aria-labelledby": f })
    ),
    _ === Me.plain && t === null && N ? N : null,
    _ !== Me.plain && N && (y === "start" || y === "left") && s.createElement("span", { className: g(he.buttonIcon, he.modifiers.start) }, N),
    t,
    _ !== Me.plain && N && (y === "end" || y === "right") && s.createElement("span", { className: g(he.buttonIcon, he.modifiers.end) }, N),
    j && s.createElement(
      "span",
      { className: g(he.buttonCount, j.className) },
      s.createElement(xl, { isRead: j.isRead }, j.count)
    )
  );
}, oe = s.forwardRef((e, t) => s.createElement(rf, Object.assign({ innerRef: t }, e)));
oe.displayName = "Button";
let af = 0;
function ae({ name: e, xOffset: t = 0, yOffset: n = 0, width: r, height: a, svgPath: i }) {
  var o;
  return o = class extends s.Component {
    constructor() {
      super(...arguments), this.id = `icon-title-${af++}`;
    }
    render() {
      const c = this.props, { title: d, className: u } = c, f = P(c, ["title", "className"]), p = u ? `pf-v5-svg ${u}` : "pf-v5-svg", h = !!d, v = [t, n, r, a].join(" ");
      return s.createElement(
        "svg",
        Object.assign({ className: p, viewBox: v, fill: "currentColor", "aria-labelledby": h ? this.id : null, "aria-hidden": h ? null : !0, role: "img", width: "1em", height: "1em" }, f),
        h && s.createElement("title", { id: this.id }, d),
        s.createElement("path", { d: i })
      );
    }
  }, o.displayName = e, o;
}
const of = {
  name: "TimesIcon",
  height: 512,
  width: 352,
  svgPath: "M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z",
  yOffset: 0,
  xOffset: 0
}, El = ae(of), Mt = {
  backdrop: "pf-v5-c-backdrop",
  backdropOpen: "pf-v5-c-backdrop__open"
}, be = {
  modalBox: "pf-v5-c-modal-box",
  modalBoxBody: "pf-v5-c-modal-box__body",
  modalBoxClose: "pf-v5-c-modal-box__close",
  modalBoxDescription: "pf-v5-c-modal-box__description",
  modalBoxFooter: "pf-v5-c-modal-box__footer",
  modalBoxHeader: "pf-v5-c-modal-box__header",
  modalBoxHeaderMain: "pf-v5-c-modal-box__header-main",
  modalBoxTitle: "pf-v5-c-modal-box__title",
  modalBoxTitleIcon: "pf-v5-c-modal-box__title-icon",
  modalBoxTitleText: "pf-v5-c-modal-box__title-text",
  modifiers: {
    sm: "pf-m-sm",
    md: "pf-m-md",
    lg: "pf-m-lg",
    alignTop: "pf-m-align-top",
    danger: "pf-m-danger",
    warning: "pf-m-warning",
    success: "pf-m-success",
    custom: "pf-m-custom",
    info: "pf-m-info",
    help: "pf-m-help",
    icon: "pf-m-icon"
  }
}, _l = {
  bullseye: "pf-v5-l-bullseye"
}, Cl = (e) => {
  var { children: t = null, className: n = "" } = e, r = P(e, ["children", "className"]);
  return s.createElement("div", Object.assign({}, r, { className: g(Mt.backdrop, n) }), t);
};
Cl.displayName = "Backdrop";
const wl = (e) => {
  var { children: t = null, className: n = "" } = e, r = P(e, ["children", "className"]);
  return s.createElement("div", Object.assign({}, r, { className: g(be.modalBoxBody, n) }), t);
};
wl.displayName = "ModalBoxBody";
const gi = (e) => {
  var { className: t, onClose: n = () => {
  }, "aria-label": r = "Close", ouiaId: a } = e, i = P(e, ["className", "onClose", "aria-label", "ouiaId"]);
  return s.createElement(
    "div",
    { className: g(be.modalBoxClose, t) },
    s.createElement(
      oe,
      Object.assign({ variant: "plain", onClick: (o) => n(o), "aria-label": r }, a && { ouiaId: `${a}-${gi.displayName}` }, i),
      s.createElement(El, null)
    )
  );
};
gi.displayName = "ModalBoxCloseButton";
const sf = {
  name: "--pf-v5-c-modal-box--m-align-top--spacer"
}, Ol = (e) => {
  var { children: t, className: n = "", variant: r = "default", position: a, positionOffset: i, "aria-labelledby": o, "aria-label": l = "", "aria-describedby": c, style: d } = e, u = P(e, ["children", "className", "variant", "position", "positionOffset", "aria-labelledby", "aria-label", "aria-describedby", "style"]);
  return i && (d = d || {}, d[sf.name] = i), s.createElement("div", Object.assign({}, u, { role: "dialog", "aria-label": l || null, "aria-labelledby": o || null, "aria-describedby": c, "aria-modal": "true", className: g(be.modalBox, n, a === "top" && be.modifiers.alignTop, r === "large" && be.modifiers.lg, r === "small" && be.modifiers.sm, r === "medium" && be.modifiers.md), style: d }), t);
};
Ol.displayName = "ModalBox";
const Va = (e) => {
  var { children: t = null, className: n = "" } = e, r = P(e, ["children", "className"]);
  return s.createElement("footer", Object.assign({}, r, { className: g(be.modalBoxFooter, n) }), t);
};
Va.displayName = "ModalBoxFooter";
const Il = (e) => {
  var { children: t = null, className: n = "", id: r = "" } = e, a = P(e, ["children", "className", "id"]);
  return s.createElement("div", Object.assign({}, a, { id: r, className: g(be.modalBoxDescription, n) }), t);
};
Il.displayName = "ModalBoxDescription";
const Wa = (e) => {
  var { children: t = null, className: n = "", help: r = null } = e, a = P(e, ["children", "className", "help"]);
  return s.createElement(
    "header",
    Object.assign({ className: g(be.modalBoxHeader, r && be.modifiers.help, n) }, a),
    r && s.createElement(
      s.Fragment,
      null,
      s.createElement("div", { className: g(be.modalBoxHeaderMain) }, t),
      s.createElement("div", { className: `${be.modalBoxHeader}-help` }, r)
    ),
    !r && t
  );
};
Wa.displayName = "ModalBoxHeader";
const ye = {
  modifiers: {
    top: "pf-m-top",
    topLeft: "pf-m-top-left",
    topRight: "pf-m-top-right",
    bottom: "pf-m-bottom",
    bottomLeft: "pf-m-bottom-left",
    bottomRight: "pf-m-bottom-right",
    left: "pf-m-left",
    leftTop: "pf-m-left-top",
    leftBottom: "pf-m-left-bottom",
    right: "pf-m-right",
    rightTop: "pf-m-right-top",
    rightBottom: "pf-m-right-bottom",
    textAlignLeft: "pf-m-text-align-left"
  },
  tooltip: "pf-v5-c-tooltip",
  tooltipArrow: "pf-v5-c-tooltip__arrow",
  tooltipContent: "pf-v5-c-tooltip__content"
}, Tl = (e) => {
  var { className: t, children: n, isLeftAligned: r } = e, a = P(e, ["className", "children", "isLeftAligned"]);
  return s.createElement("div", Object.assign({ className: g(ye.tooltipContent, r && ye.modifiers.textAlignLeft, t) }, a), n);
};
Tl.displayName = "TooltipContent";
const Nl = (e) => {
  var { className: t } = e, n = P(e, ["className"]);
  return s.createElement("div", Object.assign({ className: g(ye.tooltipArrow, t) }, n));
};
Nl.displayName = "TooltipArrow";
const Zi = {
  value: "18.75rem"
};
var za;
(function(e) {
  e.auto = "auto", e.top = "top", e.bottom = "bottom", e.left = "left", e.right = "right", e.topStart = "top-start", e.topEnd = "top-end", e.bottomStart = "bottom-start", e.bottomEnd = "bottom-end", e.leftStart = "left-start", e.leftEnd = "left-end", e.rightStart = "right-start", e.rightEnd = "right-end";
})(za || (za = {}));
let lf = 1;
const qe = (e) => {
  var {
    content: t,
    position: n = "top",
    trigger: r = "mouseenter focus",
    isVisible: a = !1,
    isContentLeftAligned: i = !1,
    enableFlip: o = !0,
    className: l = "",
    entryDelay: c = 300,
    exitDelay: d = 300,
    appendTo: u = () => document.body,
    zIndex: f = 9999,
    minWidth: p,
    maxWidth: h = Zi.value,
    distance: v = 15,
    aria: m = "describedby",
    // For every initial starting position, there are 3 escape positions
    flipBehavior: x = ["top", "right", "bottom", "left", "top", "right", "bottom"],
    id: _ = `pf-tooltip-${lf++}`,
    children: y,
    animationDuration: I = 300,
    triggerRef: N,
    "aria-live": R = N ? "polite" : "off",
    onTooltipHidden: L = () => {
    }
  } = e, O = P(e, ["content", "position", "trigger", "isVisible", "isContentLeftAligned", "enableFlip", "className", "entryDelay", "exitDelay", "appendTo", "zIndex", "minWidth", "maxWidth", "distance", "aria", "flipBehavior", "id", "children", "animationDuration", "triggerRef", "aria-live", "onTooltipHidden"]);
  const w = r.includes("mouseenter"), j = r.includes("focus"), k = r.includes("click"), C = r === "manual", [S, b] = s.useState(!1), E = s.createRef(), T = (U) => {
    C || U.key === bn.Escape && S && M();
  }, A = (U) => {
    U.key === bn.Enter && (S ? M() : F());
  };
  s.useEffect(() => {
    a ? F() : M();
  }, [a]);
  const F = () => {
    b(!0);
  }, M = () => {
    b(!1);
  }, D = {
    top: ye.modifiers.top,
    bottom: ye.modifiers.bottom,
    left: ye.modifiers.left,
    right: ye.modifiers.right,
    "top-start": ye.modifiers.topLeft,
    "top-end": ye.modifiers.topRight,
    "bottom-start": ye.modifiers.bottomLeft,
    "bottom-end": ye.modifiers.bottomRight,
    "left-start": ye.modifiers.leftTop,
    "left-end": ye.modifiers.leftBottom,
    "right-start": ye.modifiers.rightTop,
    "right-end": ye.modifiers.rightBottom
  }, q = h !== Zi.value, z = s.createElement(
    "div",
    Object.assign({ "aria-live": R, className: g(ye.tooltip, l), role: "tooltip", id: _, style: {
      maxWidth: q ? h : null
    }, ref: E }, O),
    s.createElement(Nl, null),
    s.createElement(Tl, { isLeftAligned: i }, t)
  ), Z = (U, Y) => {
    S ? M() : U.target === Y && F();
  }, W = () => m === "describedby" && y && y.props && !y.props["aria-describedby"] ? s.cloneElement(y, { "aria-describedby": _ }) : m === "labelledby" && y.props && !y.props["aria-labelledby"] ? s.cloneElement(y, { "aria-labelledby": _ }) : y;
  return s.createElement(Nn, { trigger: m !== "none" && S ? W() : y, triggerRef: N, popper: z, popperRef: E, minWidth: p !== void 0 ? p : "revert", appendTo: u, isVisible: S, positionModifiers: D, distance: v, placement: n, onMouseEnter: w && F, onMouseLeave: w && M, onPopperMouseEnter: w && F, onPopperMouseLeave: w && M, onFocus: j && F, onBlur: j && M, onDocumentClick: k && Z, onDocumentKeyDown: C ? null : T, onTriggerEnter: C ? null : A, enableFlip: o, zIndex: f, flipBehavior: x, animationDuration: I, entryDelay: c, exitDelay: d, onHidden: L });
};
qe.displayName = "Tooltip";
const cf = {
  name: "CheckCircleIcon",
  height: 512,
  width: 512,
  svgPath: "M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z",
  yOffset: 0,
  xOffset: 0
}, Yt = ae(cf), df = {
  name: "ExclamationCircleIcon",
  height: 512,
  width: 512,
  svgPath: "M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z",
  yOffset: 0,
  xOffset: 0
}, Jt = ae(df), uf = {
  name: "ExclamationTriangleIcon",
  height: 512,
  width: 576,
  svgPath: "M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z",
  yOffset: 0,
  xOffset: 0
}, Zt = ae(uf), ff = {
  name: "InfoCircleIcon",
  height: 512,
  width: 512,
  svgPath: "M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z",
  yOffset: 0,
  xOffset: 0
}, Sl = ae(ff), pf = {
  name: "BellIcon",
  height: 1024,
  width: 896,
  svgPath: "M448,0 C465.333333,0 480.333333,6.33333333 493,19 C505.666667,31.6666667 512,46.6666667 512,64 L512,106 L514.23,106.45 C587.89,121.39 648.48,157.24 696,214 C744,271.333333 768,338.666667 768,416 C768,500 780,568.666667 804,622 C818.666667,652.666667 841.333333,684 872,716 C873.773676,718.829136 875.780658,721.505113 878,724 C890,737.333333 896,752.333333 896,769 C896,785.666667 890,800.333333 878,813 C866,825.666667 850.666667,832 832,832 L63.3,832 C44.9533333,831.84 29.8533333,825.506667 18,813 C6,800.333333 0,785.666667 0,769 C0,752.333333 6,737.333333 18,724 L24,716 L25.06,714.9 C55.1933333,683.28 77.5066667,652.313333 92,622 C116,568.666667 128,500 128,416 C128,338.666667 152,271.333333 200,214 C248,156.666667 309.333333,120.666667 384,106 L384,63.31 C384.166667,46.27 390.5,31.5 403,19 C415.666667,6.33333333 430.666667,0 448,0 Z M576,896 L576,897.08 C575.74,932.6 563.073333,962.573333 538,987 C512.666667,1011.66667 482.666667,1024 448,1024 C413.333333,1024 383.333333,1011.66667 358,987 C332.666667,962.333333 320,932 320,896 L576,896 Z",
  yOffset: 0,
  xOffset: 0
}, kl = ae(pf), fn = (e) => ["success", "danger", "warning", "info", "custom"].includes(e), Rl = (e) => {
  var { className: t = "", id: n, title: r, titleIconVariant: a, titleLabel: i = "" } = e, o = P(e, ["className", "id", "title", "titleIconVariant", "titleLabel"]);
  const [l, c] = s.useState(!1), d = s.useRef(null), u = i || (fn(a) ? `${Fa(a)} alert:` : i), f = {
    success: s.createElement(Yt, null),
    danger: s.createElement(Jt, null),
    warning: s.createElement(Zt, null),
    info: s.createElement(Sl, null),
    custom: s.createElement(kl, null)
  }, p = !fn(a) && a;
  Cn(() => {
    c(d.current && d.current.offsetWidth < d.current.scrollWidth);
  }, []);
  const h = s.createElement(
    "h1",
    Object.assign({ id: n, ref: d, className: g(be.modalBoxTitle, a && be.modifiers.icon, t) }, o),
    a && s.createElement("span", { className: g(be.modalBoxTitleIcon) }, fn(a) ? f[a] : s.createElement(p, null)),
    u && s.createElement("span", { className: "pf-v5-screen-reader" }, u),
    s.createElement("span", { className: g(be.modalBoxTitleText) }, r)
  );
  return l ? s.createElement(qe, { content: r }, h) : h;
};
Rl.displayName = "ModalBoxTitle";
const vi = (e) => {
  var { children: t, className: n = "", isOpen: r = !1, header: a = null, help: i = null, description: o = null, title: l = "", titleIconVariant: c = null, titleLabel: d = "", "aria-label": u = "", "aria-describedby": f, "aria-labelledby": p, bodyAriaLabel: h, bodyAriaRole: v, showClose: m = !0, footer: x = null, actions: _ = [], onClose: y = () => {
  }, variant: I = "default", position: N, positionOffset: R, width: L, maxWidth: O, boxId: w, labelId: j, backdropId: k, descriptorId: C, disableFocusTrap: S = !1, hasNoBodyWrapper: b = !1, ouiaId: E, ouiaSafe: T = !0, elementToFocus: A } = e, F = P(e, ["children", "className", "isOpen", "header", "help", "description", "title", "titleIconVariant", "titleLabel", "aria-label", "aria-describedby", "aria-labelledby", "bodyAriaLabel", "bodyAriaRole", "showClose", "footer", "actions", "onClose", "variant", "position", "positionOffset", "width", "maxWidth", "boxId", "labelId", "backdropId", "descriptorId", "disableFocusTrap", "hasNoBodyWrapper", "ouiaId", "ouiaSafe", "elementToFocus"]);
  if (!r)
    return null;
  const M = a ? s.createElement(Wa, { help: i }, a) : l && s.createElement(
    Wa,
    { help: i },
    s.createElement(Rl, { title: l, titleIconVariant: c, titleLabel: d, id: j }),
    o && s.createElement(Il, { id: C }, o)
  ), D = x ? s.createElement(Va, null, x) : _.length > 0 && s.createElement(Va, null, _), q = h ? "region" : void 0, Z = !o && !f ? C : void 0, W = b ? t : s.createElement(wl, Object.assign({ "aria-label": h, role: v || q }, F, { id: Z }), t), U = () => {
    if (p === null)
      return null;
    const X = [];
    return (u && w) !== "" && X.push(u && w), p && X.push(p), l && X.push(j), X.join(" ");
  }, Y = s.createElement(
    Ol,
    Object.assign({ id: w, className: g(n, fn(c) && be.modifiers[c]), variant: I, position: N, positionOffset: R, "aria-label": u, "aria-labelledby": U(), "aria-describedby": f || (b ? null : C) }, pt(vi.displayName, E, T), { style: Object.assign(Object.assign({}, L && { "--pf-v5-c-modal-box--Width": typeof L != "number" ? L : `${L}px` }), O && {
      "--pf-v5-c-modal-box--MaxWidth": typeof O != "number" ? O : `${O}px`
    }) }),
    m && s.createElement(gi, { onClose: (X) => y(X), ouiaId: E }),
    M,
    W,
    D
  );
  return s.createElement(
    Cl,
    { id: k },
    s.createElement(oi, { active: !S, focusTrapOptions: {
      clickOutsideDeactivates: !0,
      tabbableOptions: { displayCheck: "none" },
      // FocusTrap's initialFocus can accept false as a value to prevent initial focus.
      // We want to prevent this in case false is ever passed in.
      initialFocus: A || void 0
    }, className: g(_l.bullseye) }, Y)
  );
};
vi.displayName = "ModalContent";
var Ua;
(function(e) {
  e.small = "small", e.medium = "medium", e.large = "large", e.default = "default";
})(Ua || (Ua = {}));
class Ye extends s.Component {
  constructor(t) {
    super(t), this.boxId = "", this.labelId = "", this.descriptorId = "", this.backdropId = "", this.handleEscKeyClick = (o) => {
      var l, c;
      const { onEscapePress: d } = this.props;
      o.key === bn.Escape && this.props.isOpen && (d ? d(o) : (c = (l = this.props).onClose) === null || c === void 0 || c.call(l, o));
    }, this.getElement = (o) => typeof o == "function" ? o() : o || document.body, this.toggleSiblingsFromScreenReaders = (o) => {
      const { appendTo: l } = this.props, d = this.getElement(l).children;
      for (const u of Array.from(d))
        u.id !== this.backdropId && (o ? u.setAttribute("aria-hidden", "" + o) : u.removeAttribute("aria-hidden"));
    }, this.isEmpty = (o) => o == null || o === "";
    const n = Ye.currentId++, r = n + 1, a = n + 2, i = n + 3;
    this.boxId = t.id || `pf-modal-part-${n}`, this.labelId = `pf-modal-part-${r}`, this.descriptorId = `pf-modal-part-${a}`, this.backdropId = `pf-modal-part-${i}`, this.state = {
      ouiaStateId: ht(Ye.displayName, t.variant)
    };
  }
  componentDidMount() {
    const { appendTo: t, title: n, "aria-label": r, "aria-labelledby": a, hasNoBodyWrapper: i, header: o } = this.props, l = this.getElement(t);
    l.addEventListener("keydown", this.handleEscKeyClick, !1), this.props.isOpen && (l.classList.add(g(Mt.backdropOpen)), this.toggleSiblingsFromScreenReaders(!0)), !n && this.isEmpty(r) && this.isEmpty(a) && console.error("Modal: Specify at least one of: title, aria-label, aria-labelledby."), this.isEmpty(r) && this.isEmpty(a) && (i || o) && console.error("Modal: When using hasNoBodyWrapper or setting a custom header, ensure you assign an accessible name to the the modal container with aria-label or aria-labelledby.");
  }
  componentDidUpdate(t) {
    const { appendTo: n } = this.props, r = this.getElement(n);
    this.props.isOpen ? (r.classList.add(g(Mt.backdropOpen)), this.toggleSiblingsFromScreenReaders(!0)) : t.isOpen !== this.props.isOpen && (r.classList.remove(g(Mt.backdropOpen)), this.toggleSiblingsFromScreenReaders(!1));
  }
  componentWillUnmount() {
    const { appendTo: t } = this.props, n = this.getElement(t);
    n.removeEventListener("keydown", this.handleEscKeyClick, !1), n.classList.remove(g(Mt.backdropOpen)), this.toggleSiblingsFromScreenReaders(!1);
  }
  render() {
    const t = this.props, {
      appendTo: n,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onEscapePress: r,
      "aria-labelledby": a,
      "aria-label": i,
      "aria-describedby": o,
      bodyAriaLabel: l,
      bodyAriaRole: c,
      title: d,
      titleIconVariant: u,
      titleLabel: f,
      ouiaId: p,
      ouiaSafe: h,
      position: v,
      elementToFocus: m
    } = t, x = P(t, ["appendTo", "onEscapePress", "aria-labelledby", "aria-label", "aria-describedby", "bodyAriaLabel", "bodyAriaRole", "title", "titleIconVariant", "titleLabel", "ouiaId", "ouiaSafe", "position", "elementToFocus"]);
    return !nt || !this.getElement(n) ? null : tl.createPortal(s.createElement(vi, Object.assign({}, x, { boxId: this.boxId, labelId: this.labelId, descriptorId: this.descriptorId, backdropId: this.backdropId, title: d, titleIconVariant: u, titleLabel: f, "aria-label": i, "aria-describedby": o, "aria-labelledby": a, bodyAriaLabel: l, bodyAriaRole: c, ouiaId: p !== void 0 ? p : this.state.ouiaStateId, ouiaSafe: h, position: v, elementToFocus: m })), this.getElement(n));
  }
}
Ye.displayName = "Modal";
Ye.currentId = 0;
Ye.defaultProps = {
  className: "",
  isOpen: !1,
  title: "",
  titleIconVariant: null,
  titleLabel: "",
  "aria-label": "",
  showClose: !0,
  "aria-describedby": "",
  "aria-labelledby": "",
  id: void 0,
  actions: [],
  onClose: () => {
  },
  variant: "default",
  hasNoBodyWrapper: !1,
  appendTo: () => document.body,
  ouiaSafe: !0,
  position: "default"
};
const mf = {
  name: "AngleRightIcon",
  height: 512,
  width: 256,
  svgPath: "M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z",
  yOffset: 0,
  xOffset: 0
}, yi = ae(mf), Ce = {
  alert: "pf-v5-c-alert",
  alertAction: "pf-v5-c-alert__action",
  alertActionGroup: "pf-v5-c-alert__action-group",
  alertDescription: "pf-v5-c-alert__description",
  alertIcon: "pf-v5-c-alert__icon",
  alertTitle: "pf-v5-c-alert__title",
  alertToggle: "pf-v5-c-alert__toggle",
  alertToggleIcon: "pf-v5-c-alert__toggle-icon",
  modifiers: {
    custom: "pf-m-custom",
    success: "pf-m-success",
    danger: "pf-m-danger",
    warning: "pf-m-warning",
    info: "pf-m-info",
    inline: "pf-m-inline",
    plain: "pf-m-plain",
    expandable: "pf-m-expandable",
    expanded: "pf-m-expanded",
    truncate: "pf-m-truncate"
  }
}, hf = {
  success: Yt,
  danger: Jt,
  warning: Zt,
  info: Sl,
  custom: kl
}, bf = (e) => {
  var { variant: t, customIcon: n, className: r = "" } = e, a = P(e, ["variant", "customIcon", "className"]);
  const i = hf[t];
  return i ? s.createElement("div", Object.assign({}, a, { className: g(Ce.alertIcon, r) }), n || s.createElement(i, null)) : null;
}, Ga = s.createContext(null), gf = {
  name: "--pf-v5-c-alert__title--max-lines"
}, Ll = (e) => {
  var { "aria-label": t = "", variantLabel: n, onToggleExpand: r, isExpanded: a = !1 } = e, i = P(e, ["aria-label", "variantLabel", "onToggleExpand", "isExpanded"]);
  const { title: o, variantLabel: l } = s.useContext(Ga);
  return s.createElement(
    oe,
    Object.assign({ variant: Me.plain, onClick: r, "aria-expanded": a, "aria-label": t === "" ? `Toggle ${n || l} alert: ${o}` : t }, i),
    s.createElement(
      "span",
      { className: g(Ce.alertToggleIcon) },
      s.createElement(yi, { "aria-hidden": "true" })
    )
  );
};
Ll.displayName = "AlertToggleExpandButton";
var Ka;
(function(e) {
  e.success = "success", e.danger = "danger", e.warning = "warning", e.info = "info", e.custom = "custom";
})(Ka || (Ka = {}));
const Sn = (e) => {
  var { variant: t = Ka.custom, isInline: n = !1, isPlain: r = !1, isLiveRegion: a = !1, variantLabel: i = `${Fa(t)} alert:`, actionClose: o, actionLinks: l, title: c, component: d = "h4", children: u = "", className: f = "", ouiaId: p, ouiaSafe: h = !0, timeout: v = !1, timeoutAnimation: m = 3e3, onTimeout: x = () => {
  }, truncateTitle: _ = 0, tooltipPosition: y, customIcon: I, isExpandable: N = !1, toggleAriaLabel: R = `${Fa(t)} alert details`, onMouseEnter: L = () => {
  }, onMouseLeave: O = () => {
  }, id: w } = e, j = P(e, ["variant", "isInline", "isPlain", "isLiveRegion", "variantLabel", "actionClose", "actionLinks", "title", "component", "children", "className", "ouiaId", "ouiaSafe", "timeout", "timeoutAnimation", "onTimeout", "truncateTitle", "tooltipPosition", "customIcon", "isExpandable", "toggleAriaLabel", "onMouseEnter", "onMouseLeave", "id"]);
  const k = mt(Sn.displayName, p, h, t), C = s.createElement(
    s.Fragment,
    null,
    s.createElement("span", { className: "pf-v5-screen-reader" }, i),
    c
  ), S = s.useRef(null), b = d, E = s.useRef(), [T, A] = pe(!1);
  s.useEffect(() => {
    if (!S.current || !_)
      return;
    S.current.style.setProperty(gf.name, _.toString());
    const te = S.current && S.current.offsetHeight < S.current.scrollHeight;
    T !== te && A(te);
  }, [S, _, T]);
  const [F, M] = pe(!1), [D, q] = pe(!0), [z, Z] = pe(), [W, U] = pe(), Y = F && D && !z && !W;
  s.useEffect(() => {
    const te = v === !0 ? 8e3 : Number(v);
    if (te > 0) {
      const Le = setTimeout(() => M(!0), te);
      return () => clearTimeout(Le);
    }
  }, [v]), s.useEffect(() => {
    const te = () => {
      E.current && (E.current.contains(document.activeElement) ? (U(!0), q(!1)) : W && U(!1));
    };
    return document.addEventListener("focus", te, !0), () => document.removeEventListener("focus", te, !0);
  }, [W]), s.useEffect(() => {
    if (W === !1 || z === !1) {
      const te = setTimeout(() => q(!0), m);
      return () => clearTimeout(te);
    }
  }, [W, z, m]), s.useEffect(() => {
    Y && x();
  }, [Y, x]);
  const [X, ue] = pe(!1), ne = () => {
    ue(!X);
  }, Ie = (te) => {
    Z(!0), q(!1), L(te);
  }, ge = (te) => {
    Z(!1), O(te);
  };
  if (Y)
    return null;
  const J = s.createElement(b, Object.assign({}, T && { tabIndex: 0 }, { ref: S, className: g(Ce.alertTitle, _ && Ce.modifiers.truncate) }), C);
  return s.createElement(
    "div",
    Object.assign({ ref: E, className: g(Ce.alert, n && Ce.modifiers.inline, r && Ce.modifiers.plain, N && Ce.modifiers.expandable, X && Ce.modifiers.expanded, Ce.modifiers[t], f) }, k, a && {
      "aria-live": "polite",
      "aria-atomic": "false"
    }, { onMouseEnter: Ie, onMouseLeave: ge, id: w }, j),
    N && s.createElement(
      Ga.Provider,
      { value: { title: c, variantLabel: i } },
      s.createElement(
        "div",
        { className: g(Ce.alertToggle) },
        s.createElement(Ll, { isExpanded: X, onToggleExpand: ne, "aria-label": R })
      )
    ),
    s.createElement(bf, { variant: t, customIcon: I }),
    T ? s.createElement(qe, { content: C, position: y }, J) : J,
    o && s.createElement(
      Ga.Provider,
      { value: { title: c, variantLabel: i } },
      s.createElement("div", { className: g(Ce.alertAction) }, o)
    ),
    u && (!N || N && X) && s.createElement("div", { className: g(Ce.alertDescription) }, u),
    l && s.createElement("div", { className: g(Ce.alertActionGroup) }, l)
  );
};
Sn.displayName = "Alert";
const Un = {
  breadcrumbLink: "pf-v5-c-breadcrumb__link"
}, xe = {
  formControl: "pf-v5-c-form-control",
  formControlIcon: "pf-v5-c-form-control__icon",
  formControlToggleIcon: "pf-v5-c-form-control__toggle-icon",
  formControlUtilities: "pf-v5-c-form-control__utilities",
  modifiers: {
    readonly: "pf-m-readonly",
    success: "pf-m-success",
    warning: "pf-m-warning",
    error: "pf-m-error",
    plain: "pf-m-plain",
    expanded: "pf-m-expanded",
    disabled: "pf-m-disabled",
    icon: "pf-m-icon",
    placeholder: "pf-m-placeholder",
    resizeVertical: "pf-m-resize-vertical",
    resizeHorizontal: "pf-m-resize-horizontal",
    resizeBoth: "pf-m-resize-both",
    status: "pf-m-status"
  }
}, vf = {
  success: Yt,
  error: Jt,
  warning: Zt
}, Xa = (e) => {
  var { status: t, customIcon: n, className: r } = e, a = P(e, ["status", "customIcon", "className"]);
  const i = t && vf[t];
  return s.createElement("span", Object.assign({ className: g(xe.formControlIcon, t && xe.modifiers.status, r) }, a), n || s.createElement(i, null));
};
var Ya;
(function(e) {
  e.text = "text", e.date = "date", e.datetimeLocal = "datetime-local", e.email = "email", e.month = "month", e.number = "number", e.password = "password", e.search = "search", e.tel = "tel", e.time = "time", e.url = "url";
})(Ya || (Ya = {}));
var Qi;
(function(e) {
  e.default = "default", e.plain = "plain";
})(Qi || (Qi = {}));
class Qt extends s.Component {
  constructor(t) {
    super(t), this.inputRef = s.createRef(), this.observer = () => {
    }, this.handleChange = (n) => {
      this.props.onChange && this.props.onChange(n, n.currentTarget.value);
    }, this.handleResize = () => {
      const n = this.props.innerRef || this.inputRef;
      n && n.current && Bd(n.current, String(this.props.value));
    }, this.restoreText = () => {
      const n = this.props.innerRef || this.inputRef;
      n.current.value = String(this.props.value), n.current.scrollLeft = n.current.scrollWidth;
    }, this.onFocus = (n) => {
      const { isLeftTruncated: r, isStartTruncated: a, onFocus: i } = this.props;
      (r || a) && this.restoreText(), i && i(n);
    }, this.onBlur = (n) => {
      const { isLeftTruncated: r, isStartTruncated: a, onBlur: i } = this.props;
      (r || a) && this.handleResize(), i && i(n);
    }, this.sanitizeInputValue = (n) => typeof n == "string" ? n.replace(/\n/g, " ") : n, !t.id && !t["aria-label"] && !t["aria-labelledby"] && console.error("Text input:", "Text input requires either an id or aria-label to be specified"), this.state = {
      ouiaStateId: ht(Qt.displayName)
    };
  }
  componentDidMount() {
    if (this.props.isLeftTruncated || this.props.isStartTruncated) {
      const t = this.props.innerRef || this.inputRef;
      this.observer = tf(t.current, this.handleResize), this.handleResize();
    }
  }
  componentWillUnmount() {
    (this.props.isLeftTruncated || this.props.isStartTruncated) && this.observer();
  }
  render() {
    const t = this.props, {
      innerRef: n,
      className: r,
      type: a,
      value: i,
      placeholder: o,
      validated: l,
      /* eslint-disable @typescript-eslint/no-unused-vars */
      onChange: c,
      onFocus: d,
      onBlur: u,
      isLeftTruncated: f,
      isStartTruncated: p,
      isExpanded: h,
      expandedProps: v,
      readOnly: m,
      readOnlyVariant: x,
      isRequired: _,
      isDisabled: y,
      customIcon: I,
      ouiaId: N,
      ouiaSafe: R
    } = t, L = P(t, ["innerRef", "className", "type", "value", "placeholder", "validated", "onChange", "onFocus", "onBlur", "isLeftTruncated", "isStartTruncated", "isExpanded", "expandedProps", "readOnly", "readOnlyVariant", "isRequired", "isDisabled", "customIcon", "ouiaId", "ouiaSafe"]), O = ["success", "error", "warning"].includes(l), w = v ? { "aria-expanded": v == null ? void 0 : v.isExpanded, "aria-controls": v == null ? void 0 : v.ariaControls, role: "combobox" } : {};
    return s.createElement(
      "span",
      { className: g(xe.formControl, x && xe.modifiers.readonly, x === "plain" && xe.modifiers.plain, y && xe.modifiers.disabled, (h || (v == null ? void 0 : v.isExpanded)) && xe.modifiers.expanded, I && xe.modifiers.icon, O && xe.modifiers[l], r) },
      s.createElement("input", Object.assign({}, L, { onFocus: this.onFocus, onBlur: this.onBlur, onChange: this.handleChange, type: a, value: this.sanitizeInputValue(i), "aria-invalid": L["aria-invalid"] ? L["aria-invalid"] : l === hn.error }, w, { required: _, disabled: y, readOnly: !!x || m, ref: n || this.inputRef, placeholder: o }, pt(tt.displayName, N !== void 0 ? N : this.state.ouiaStateId, R))),
      (I || O) && s.createElement(
        "span",
        { className: g(xe.formControlUtilities) },
        I && s.createElement(Xa, { customIcon: I }),
        O && s.createElement(Xa, { status: l })
      )
    );
  }
}
Qt.displayName = "TextInputBase";
Qt.defaultProps = {
  "aria-label": null,
  isRequired: !1,
  validated: "default",
  isDisabled: !1,
  isExpanded: !1,
  type: Ya.text,
  isLeftTruncated: !1,
  isStartTruncated: !1,
  onChange: () => {
  },
  ouiaSafe: !0
};
const tt = s.forwardRef((e, t) => s.createElement(Qt, Object.assign({}, e, { innerRef: t })));
tt.displayName = "TextInput";
const V = {
  divider: "pf-v5-c-divider",
  menu: "pf-v5-c-menu",
  menuContent: "pf-v5-c-menu__content",
  menuItem: "pf-v5-c-menu__item",
  menuItemAction: "pf-v5-c-menu__item-action",
  menuItemActionIcon: "pf-v5-c-menu__item-action-icon",
  menuItemCheck: "pf-v5-c-menu__item-check",
  menuItemDescription: "pf-v5-c-menu__item-description",
  menuItemExternalIcon: "pf-v5-c-menu__item-external-icon",
  menuItemIcon: "pf-v5-c-menu__item-icon",
  menuItemMain: "pf-v5-c-menu__item-main",
  menuItemSelectIcon: "pf-v5-c-menu__item-select-icon",
  menuItemText: "pf-v5-c-menu__item-text",
  menuItemToggleIcon: "pf-v5-c-menu__item-toggle-icon",
  menuList: "pf-v5-c-menu__list",
  menuListItem: "pf-v5-c-menu__list-item",
  menuSearch: "pf-v5-c-menu__search",
  modifiers: {
    flyout: "pf-m-flyout",
    left: "pf-m-left",
    drilldown: "pf-m-drilldown",
    drilledIn: "pf-m-drilled-in",
    currentPath: "pf-m-current-path",
    plain: "pf-m-plain",
    scrollable: "pf-m-scrollable",
    nav: "pf-m-nav",
    focus: "pf-m-focus",
    disabled: "pf-m-disabled",
    ariaDisabled: "pf-m-aria-disabled",
    load: "pf-m-load",
    loading: "pf-m-loading",
    danger: "pf-m-danger",
    selected: "pf-m-selected",
    favorite: "pf-m-favorite",
    favorited: "pf-m-favorited"
  }
}, eo = {
  dropdownToggle: "pf-v5-c-dropdown__toggle"
}, ut = s.createContext({
  menuId: null,
  parentMenu: null,
  onActionClick: () => null,
  onSelect: () => null,
  activeItemId: null,
  selected: null,
  drilledInMenus: [],
  drilldownItemPath: [],
  onDrillIn: null,
  onDrillOut: null,
  onGetMenuHeight: () => null,
  flyoutRef: null,
  setFlyoutRef: () => null,
  disableHover: !1,
  role: "menu"
}), Pl = s.createContext({
  itemId: null,
  isDisabled: !1
});
class kn extends s.Component {
  constructor(t) {
    super(t), this.menuRef = s.createRef(), this.activeMenu = null, this.state = {
      ouiaStateId: ht(wn.displayName),
      transitionMoveTarget: null,
      flyoutRef: null,
      disableHover: !1,
      currentDrilldownMenuId: this.props.id
    }, this.handleDrilldownTransition = (n) => {
      const r = this.menuRef.current;
      if (!(!r || r !== n.target.closest(`.${V.menu}`) && !Array.from(r.getElementsByClassName(V.menu)).includes(n.target.closest(`.${V.menu}`))))
        if (this.state.transitionMoveTarget)
          this.state.transitionMoveTarget.focus(), this.setState({ transitionMoveTarget: null });
        else {
          const a = r.querySelector("#" + this.props.activeMenu) || r || null, i = a.getElementsByTagName("UL");
          if (i.length === 0)
            return;
          const o = Array.from(i[0].children);
          if (!this.state.currentDrilldownMenuId || a.id !== this.state.currentDrilldownMenuId)
            this.setState({ currentDrilldownMenuId: a.id });
          else
            return;
          const l = o.filter((c) => !(c.classList.contains("pf-m-disabled") || c.classList.contains(V.divider)))[0].firstChild;
          l.focus(), l.tabIndex = 0;
        }
    }, this.handleExtraKeys = (n) => {
      const r = this.props.containsDrilldown, a = document.activeElement;
      if (n.target.closest(`.${V.menu}`) !== this.activeMenu && !n.target.classList.contains(Un.breadcrumbLink) && (this.activeMenu = n.target.closest(`.${V.menu}`), this.setState({ disableHover: !0 })), n.target.tagName === "INPUT")
        return;
      const i = this.activeMenu, o = n.key, l = a.classList.contains(Un.breadcrumbLink) || a.classList.contains(eo.dropdownToggle);
      if (o === " " || o === "Enter") {
        if (n.preventDefault(), r && !l) {
          if (a.closest("li").classList.contains("pf-m-current-path") && i.parentElement.tagName === "LI")
            a.tabIndex = -1, i.parentElement.firstChild.tabIndex = 0, this.setState({ transitionMoveTarget: i.parentElement.firstChild });
          else if (a.nextElementSibling && a.nextElementSibling.classList.contains(V.menu)) {
            const d = Array.from(a.nextElementSibling.getElementsByTagName("UL")[0].children).filter((u) => !(u.classList.contains("pf-m-disabled") || u.classList.contains(V.divider)));
            a.tabIndex = -1, d[0].firstChild.tabIndex = 0, this.setState({ transitionMoveTarget: d[0].firstChild });
          }
        }
        document.activeElement.click();
      }
    }, this.createNavigableElements = () => this.props.containsDrilldown ? this.activeMenu ? Array.from(this.activeMenu.getElementsByTagName("UL")[0].children).filter((r) => !(r.classList.contains("pf-m-disabled") || r.classList.contains(V.divider))) : [] : this.menuRef.current ? Array.from(this.menuRef.current.getElementsByTagName("LI")).filter((r) => !(r.classList.contains("pf-m-disabled") || r.classList.contains(V.divider))) : [], t.innerRef && (this.menuRef = t.innerRef);
  }
  allowTabFirstItem() {
    const t = this.menuRef.current;
    if (t) {
      const n = t.querySelector("ul button:not(:disabled), ul a:not(:disabled)");
      n && (n.tabIndex = 0);
    }
  }
  componentDidMount() {
    this.context && this.setState({ disableHover: this.context.disableHover }), nt && window.addEventListener("transitionend", this.props.isRootMenu ? this.handleDrilldownTransition : null), this.allowTabFirstItem();
  }
  componentWillUnmount() {
    nt && window.removeEventListener("transitionend", this.handleDrilldownTransition);
  }
  componentDidUpdate(t) {
    t.children !== this.props.children && this.allowTabFirstItem();
  }
  render() {
    const t = this.props, {
      id: n,
      children: r,
      className: a,
      onSelect: i,
      selected: o = null,
      onActionClick: l,
      ouiaId: c,
      ouiaSafe: d,
      containsFlyout: u,
      isNavFlyout: f,
      containsDrilldown: p,
      isMenuDrilledIn: h,
      isPlain: v,
      isScrollable: m,
      drilldownItemPath: x,
      drilledInMenus: _,
      onDrillIn: y,
      onDrillOut: I,
      onGetMenuHeight: N,
      parentMenu: R = null,
      activeItemId: L = null,
      /* eslint-disable @typescript-eslint/no-unused-vars */
      innerRef: O,
      isRootMenu: w,
      activeMenu: j,
      role: k
    } = t, C = P(t, ["id", "children", "className", "onSelect", "selected", "onActionClick", "ouiaId", "ouiaSafe", "containsFlyout", "isNavFlyout", "containsDrilldown", "isMenuDrilledIn", "isPlain", "isScrollable", "drilldownItemPath", "drilledInMenus", "onDrillIn", "onDrillOut", "onGetMenuHeight", "parentMenu", "activeItemId", "innerRef", "isRootMenu", "activeMenu", "role"]), S = h || _ && _.includes(n) || !1;
    return s.createElement(
      ut.Provider,
      { value: {
        menuId: n,
        parentMenu: R || n,
        onSelect: i,
        onActionClick: l,
        activeItemId: L,
        selected: o,
        drilledInMenus: _,
        drilldownItemPath: x,
        onDrillIn: y,
        onDrillOut: I,
        onGetMenuHeight: N,
        flyoutRef: this.state.flyoutRef,
        setFlyoutRef: (b) => this.setState({ flyoutRef: b }),
        disableHover: this.state.disableHover,
        role: k
      } },
      w && s.createElement(mi, { containerRef: this.menuRef || null, additionalKeyHandler: this.handleExtraKeys, createNavigableElements: this.createNavigableElements, isActiveElement: (b) => document.activeElement.closest("li") === b || // if element is a basic MenuItem
      document.activeElement.parentElement === b || document.activeElement.closest(`.${V.menuSearch}`) === b || // if element is a MenuSearch
      document.activeElement.closest("ol") && document.activeElement.closest("ol").firstChild === b, getFocusableElement: (b) => {
        var E, T;
        return (b == null ? void 0 : b.tagName) === "DIV" && b.querySelector("input") || // for MenuSearchInput
        ((E = b.firstChild) === null || E === void 0 ? void 0 : E.tagName) === "LABEL" && b.querySelector("input") || // for MenuItem checkboxes
        ((T = b.firstChild) === null || T === void 0 ? void 0 : T.tagName) === "DIV" && b.querySelector("a, button, input") || // For aria-disabled element that is rendered inside a div with "display: contents" styling
        b.firstChild;
      }, noHorizontalArrowHandling: document.activeElement && (document.activeElement.classList.contains(Un.breadcrumbLink) || document.activeElement.classList.contains(eo.dropdownToggle) || document.activeElement.tagName === "INPUT"), noEnterHandling: !0, noSpaceHandling: !0 }),
      s.createElement("div", Object.assign({ id: n, className: g(V.menu, v && V.modifiers.plain, m && V.modifiers.scrollable, u && V.modifiers.flyout, f && V.modifiers.nav, p && V.modifiers.drilldown, S && V.modifiers.drilledIn, a), ref: this.menuRef }, pt(wn.displayName, c !== void 0 ? c : this.state.ouiaStateId, d), C), r)
    );
  }
}
kn.displayName = "Menu";
kn.contextType = ut;
kn.defaultProps = {
  ouiaSafe: !0,
  isRootMenu: !0,
  isPlain: !1,
  isScrollable: !1,
  role: "menu"
};
const wn = s.forwardRef((e, t) => s.createElement(kn, Object.assign({}, e, { innerRef: t })));
wn.displayName = "Menu";
const yf = {
  name: "--pf-v5-c-menu__content--Height"
}, xf = {
  name: "--pf-v5-c-menu__content--MaxHeight"
}, Al = s.forwardRef((e, t) => {
  const { getHeight: n, children: r, menuHeight: a, maxMenuHeight: i } = e, o = P(e, ["getHeight", "children", "menuHeight", "maxMenuHeight"]), l = s.createRef(), c = (d, u, f) => {
    if (d) {
      let p = d.clientHeight, h = null, v = d.closest(`.${V.menuList}`);
      for (; v !== null && v.nodeType === 1; )
        v.classList.contains(V.menuList) && (h = v), v = v.parentElement;
      if (h) {
        const m = getComputedStyle(h), x = parseFloat(m.getPropertyValue("padding-top").replace(/px/g, "")) + parseFloat(m.getPropertyValue("padding-bottom").replace(/px/g, "")) + parseFloat(getComputedStyle(h.parentElement).getPropertyValue("border-bottom-width").replace(/px/g, ""));
        p = p + x;
      }
      f && f(u, p), n && n(p.toString());
    }
    return t || l;
  };
  return s.createElement(ut.Consumer, null, ({ menuId: d, onGetMenuHeight: u }) => s.createElement("div", Object.assign({}, o, { className: g(V.menuContent, e.className), ref: (f) => c(f, d, u), style: Object.assign(Object.assign({}, a && { [yf.name]: a }), i && { [xf.name]: i }) }), r));
});
Al.displayName = "MenuContent";
const Ef = {
  name: "--pf-v5-c-menu--m-flyout__menu--top-offset"
}, _f = {
  name: "--pf-v5-c-menu--m-flyout__menu--m-left--right-offset"
}, Cf = {
  name: "--pf-v5-c-menu--m-flyout__menu--left-offset"
}, wf = {
  name: "ExternalLinkAltIcon",
  height: 512,
  width: 512,
  svgPath: "M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z",
  yOffset: 0,
  xOffset: 0
}, Of = ae(wf), If = {
  name: "AngleLeftIcon",
  height: 512,
  width: 256,
  svgPath: "M31.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L127.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L201.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34z",
  yOffset: 0,
  xOffset: 0
}, Tf = ae(If), Nf = {
  name: "CheckIcon",
  height: 512,
  width: 512,
  svgPath: "M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z",
  yOffset: 0,
  xOffset: 0
}, Sf = ae(Nf), Ge = {
  check: "pf-v5-c-check",
  checkBody: "pf-v5-c-check__body",
  checkDescription: "pf-v5-c-check__description",
  checkInput: "pf-v5-c-check__input",
  checkLabel: "pf-v5-c-check__label",
  checkLabelRequired: "pf-v5-c-check__label-required",
  modifiers: {
    standalone: "pf-m-standalone",
    disabled: "pf-m-disabled"
  }
}, Ml = () => {
};
class ft extends s.Component {
  constructor(t) {
    super(t), this.handleChange = (n) => {
      this.props.onChange(n, n.currentTarget.checked);
    }, this.state = {
      ouiaStateId: ht(ft.displayName)
    };
  }
  render() {
    const t = this.props, { "aria-label": n, className: r, inputClassName: a, onChange: i, isLabelWrapped: o, isLabelBeforeButton: l, isValid: c, isDisabled: d, isRequired: u, isChecked: f, label: p, checked: h, defaultChecked: v, description: m, body: x, ouiaId: _, ouiaSafe: y, component: I } = t, N = P(t, ["aria-label", "className", "inputClassName", "onChange", "isLabelWrapped", "isLabelBeforeButton", "isValid", "isDisabled", "isRequired", "isChecked", "label", "checked", "defaultChecked", "description", "body", "ouiaId", "ouiaSafe", "component"]);
    N.id || console.error("Checkbox:", "id is required to make input accessible");
    const R = {};
    ([!0, !1].includes(h) || f === !0) && (R.checked = h || f), i !== Ml && (R.checked = f), [!1, !0].includes(v) && (R.defaultChecked = v);
    const L = s.createElement("input", Object.assign({}, N, { className: g(Ge.checkInput, a), type: "checkbox", onChange: this.handleChange, "aria-invalid": !c, "aria-label": n, disabled: d, required: u, ref: (C) => C && (C.indeterminate = f === null) }, R, pt(ft.displayName, _ !== void 0 ? _ : this.state.ouiaStateId, y))), O = o && !I || I === "label", w = O ? "span" : "label", j = p ? s.createElement(
      w,
      { className: g(Ge.checkLabel, d && Ge.modifiers.disabled), htmlFor: O ? void 0 : N.id },
      p,
      u && s.createElement("span", { className: g(Ge.checkLabelRequired), "aria-hidden": "true" }, cl)
    ) : null, k = I ?? (O ? "label" : "div");
    return R.checked = R.checked === null ? !1 : R.checked, s.createElement(
      k,
      { className: g(Ge.check, !p && Ge.modifiers.standalone, r), htmlFor: O ? N.id : void 0 },
      l ? s.createElement(
        s.Fragment,
        null,
        j,
        L
      ) : s.createElement(
        s.Fragment,
        null,
        L,
        j
      ),
      m && s.createElement("span", { className: g(Ge.checkDescription) }, m),
      x && s.createElement("span", { className: g(Ge.checkBody) }, x)
    );
  }
}
ft.displayName = "Checkbox";
ft.defaultProps = {
  className: "",
  isLabelWrapped: !1,
  isValid: !0,
  isDisabled: !1,
  isRequired: !1,
  isChecked: !1,
  onChange: Ml,
  ouiaSafe: !0
};
const kf = {
  name: "StarIcon",
  height: 512,
  width: 576,
  svgPath: "M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z",
  yOffset: 0,
  xOffset: 0
}, xi = ae(kf), Rf = (e) => {
  var { className: t = "", icon: n, onClick: r, "aria-label": a, isFavorited: i = null, isDisabled: o, actionId: l, innerRef: c } = e, d = P(e, ["className", "icon", "onClick", "aria-label", "isFavorited", "isDisabled", "actionId", "innerRef"]);
  return s.createElement(ut.Consumer, null, ({ onActionClick: u }) => s.createElement(Pl.Consumer, null, ({ itemId: f, isDisabled: p }) => {
    const h = (v) => {
      r && r(v), u && u(v, f, l);
    };
    return s.createElement(
      "button",
      Object.assign({ className: g(V.menuItemAction, i !== null && V.modifiers.favorite, i && V.modifiers.favorited, t), "aria-label": a, onClick: h }, (o === !0 || p === !0) && { disabled: !0 }, { ref: c, tabIndex: -1 }, d),
      s.createElement("span", { className: g(V.menuItemActionIcon) }, n === "favorites" || i !== null ? s.createElement(xi, { "aria-hidden": !0 }) : n)
    );
  }));
}, Dl = s.forwardRef((e, t) => s.createElement(Rf, Object.assign({}, e, { innerRef: t })));
Dl.displayName = "MenuItemAction";
const to = s.createContext({
  direction: "right"
}), Lf = (e) => {
  var { children: t, className: n, itemId: r = null, to: a, hasCheckbox: i = !1, isActive: o = null, isFavorited: l = null, isLoadButton: c = !1, isLoading: d = !1, flyoutMenu: u, direction: f, description: p = null, onClick: h = () => {
  }, component: v = "button", isDisabled: m = !1, isAriaDisabled: x = !1, isExternalLink: _ = !1, isSelected: y = null, isFocused: I, isDanger: N = !1, icon: R, actions: L, onShowFlyout: O, drilldownMenu: w, isOnPath: j, innerRef: k, id: C, "aria-label": S, tooltipProps: b, rel: E, target: T, download: A } = e, F = P(e, ["children", "className", "itemId", "to", "hasCheckbox", "isActive", "isFavorited", "isLoadButton", "isLoading", "flyoutMenu", "direction", "description", "onClick", "component", "isDisabled", "isAriaDisabled", "isExternalLink", "isSelected", "isFocused", "isDanger", "icon", "actions", "onShowFlyout", "drilldownMenu", "isOnPath", "innerRef", "id", "aria-label", "tooltipProps", "rel", "target", "download"]);
  const { menuId: M, parentMenu: D, onSelect: q, onActionClick: z, activeItemId: Z, selected: W, drilldownItemPath: U, onDrillIn: Y, onDrillOut: X, flyoutRef: ue, setFlyoutRef: ne, disableHover: Ie, role: ge } = s.useContext(ut);
  let J = a ? "a" : v;
  i && !a && (J = "label");
  const [te, Le] = s.useState(null), Ee = s.useContext(to), [Pe, Te] = s.useState(Ee.direction), le = s.useRef(), ve = le === ue, Ue = u !== void 0, se = (K) => {
    !ve && K ? ne(le) : ve && !K && ne(null), O && K && O();
  };
  Cn(() => {
    if (Ue && le.current && nt) {
      const K = le.current.lastElementChild;
      if (K && K.classList.contains(V.menu)) {
        const Q = le.current.getClientRects()[0], me = K.getClientRects()[0];
        if (Q && me) {
          const He = Q.x - me.width, yt = window.innerWidth - Q.x - Q.width - me.width;
          let et = Pe;
          yt < 0 && et !== "left" ? (Te("left"), et = "left") : He < 0 && et !== "right" && (Te("right"), et = "right");
          let St = 0;
          He < 0 && yt < 0 && (St = et === "right" ? -yt : -He), et === "left" ? (K.classList.add(V.modifiers.left), K.style.setProperty(_f.name, `-${St}px`)) : K.style.setProperty(Cf.name, `-${St}px`);
          const kt = window.innerHeight - Q.y - me.height;
          window.innerHeight - me.height < 0 && kt < 0 || kt < 0 && K.style.setProperty(Ef.name, `${kt}px`);
        }
      }
    }
  }, [ve, u]), s.useEffect(() => {
    Te(Ee.direction);
  }, [Ee]), s.useEffect(() => {
    if (te)
      if (ve) {
        const K = te.nextElementSibling;
        Array.from(K.getElementsByTagName("UL")[0].children).filter((me) => !(me.classList.contains("pf-m-disabled") || me.classList.contains(V.divider)))[0].firstChild.focus();
      } else
        te.focus();
  }, [ve, te]);
  const Ze = (K) => {
    const Q = K.key, me = K.target, He = K.type;
    (Q === " " || Q === "Enter" || Q === "ArrowRight" || He === "click") && (K.stopPropagation(), K.preventDefault(), ve || (se(!0), Le(me))), (Q === "Escape" || Q === "ArrowLeft") && ve && (K.stopPropagation(), se(!1));
  }, gt = (K, Q) => {
    x || (Q && Q(K, r), h && h(K));
  }, vt = j && j || U && U.includes(r) || !1;
  let Ae;
  f && (f === "down" ? Ae = (K) => Y && Y(K, M, typeof w == "function" ? w().props.id : w.props.id, r) : Ae = (K) => X && X(K, D, r));
  let $ = {};
  J === "a" ? $ = {
    href: a,
    "aria-disabled": m || x ? !0 : null,
    // prevent invalid 'disabled' attribute on <a> tags
    disabled: null,
    target: _ ? "_blank" : T,
    rel: E,
    download: A
  } : J === "button" && ($ = {
    type: "button",
    "aria-disabled": x ? !0 : null
  }), j ? $["aria-expanded"] = !0 : Ue && ($["aria-haspopup"] = "menu", $["aria-expanded"] = ve);
  const ce = () => o !== null ? o ? "page" : null : r !== null && Z !== null ? r === Z : null, de = () => y !== null ? y : W !== null && r !== null ? Array.isArray(W) && W.includes(r) || r === W : !1, Qe = () => {
    Ie || (Ue ? se(!0) : ne(null));
  };
  s.useEffect(() => {
    if (I && le.current) {
      const K = le.current, Q = K.parentElement;
      if (Q) {
        const me = K.offsetTop - Q.offsetTop < Q.scrollTop, He = K.offsetTop - Q.offsetTop + K.clientHeight;
        (me || He) && K.scrollIntoView({ behavior: "auto", block: "nearest" });
      }
    }
  }, [I]);
  const rt = ge === "listbox", nn = s.createElement(
    s.Fragment,
    null,
    s.createElement(Ot, null, (K) => s.createElement(
      J,
      Object.assign({ id: C, tabIndex: -1, className: g(V.menuItem, de() && !i && V.modifiers.selected, n), "aria-current": ce() }, !i && { disabled: m, "aria-label": S }, !i && !u && { role: rt ? "option" : "menuitem" }, !i && !u && rt && { "aria-selected": de() }, { ref: k }, !i && {
        onClick: (Q) => {
          x ? Q.preventDefault() : (gt(Q, q), Ae && Ae(Q), u && Ze(Q));
        }
      }, i && { htmlFor: K }, $),
      s.createElement(
        "span",
        { className: g(V.menuItemMain) },
        f === "up" && s.createElement(
          "span",
          { className: g(V.menuItemToggleIcon) },
          s.createElement(Tf, { "aria-hidden": !0 })
        ),
        R && s.createElement("span", { className: g(V.menuItemIcon) }, R),
        i && s.createElement(
          "span",
          { className: g(V.menuItemCheck) },
          s.createElement(ft, { id: K, component: "span", isChecked: y || !1, onChange: (Q) => gt(Q, q), isDisabled: m, "aria-disabled": x })
        ),
        s.createElement("span", { className: g(V.menuItemText) }, t),
        _ && s.createElement(
          "span",
          { className: g(V.menuItemExternalIcon) },
          s.createElement(Of, { "aria-hidden": !0 })
        ),
        (u || f === "down") && s.createElement(
          "span",
          { className: g(V.menuItemToggleIcon) },
          s.createElement(yi, { "aria-hidden": !0 })
        ),
        de() && s.createElement(
          "span",
          { className: g(V.menuItemSelectIcon) },
          s.createElement(Sf, { "aria-hidden": !0 })
        )
      ),
      p && f !== "up" && s.createElement(
        "span",
        { className: g(V.menuItemDescription) },
        s.createElement("span", null, p)
      )
    )),
    ve && s.createElement(
      ut.Provider,
      { value: { disableHover: Ie } },
      s.createElement(to.Provider, { value: { direction: Pe } }, u)
    ),
    typeof w == "function" ? w() : w,
    s.createElement(
      Pl.Provider,
      { value: { itemId: r, isDisabled: m } },
      L,
      l !== null && s.createElement(Dl, { icon: "favorites", isFavorited: l, "aria-label": l ? "starred" : "not starred", onClick: (K) => z(K, r), tabIndex: -1, actionId: "fav" })
    )
  );
  return s.createElement("li", Object.assign({ className: g(V.menuListItem, m && V.modifiers.disabled, x && V.modifiers.ariaDisabled, vt && V.modifiers.currentPath, c && V.modifiers.load, d && V.modifiers.loading, I && V.modifiers.focus, N && V.modifiers.danger, n), onMouseOver: () => {
    x || Qe();
  } }, u && !x && { onKeyDown: Ze }, { ref: le, role: i ? "menuitem" : "none" }, i && { "aria-label": S }, F), b ? s.createElement(qe, Object.assign({}, b), nn) : nn);
}, jl = s.forwardRef((e, t) => s.createElement(Lf, Object.assign({}, e, { innerRef: t })));
jl.displayName = "MenuItem";
const Fl = (e) => {
  var { children: t = null, className: n, isAriaMultiselectable: r = !1, "aria-label": a } = e, i = P(e, ["children", "className", "isAriaMultiselectable", "aria-label"]);
  const { role: o } = s.useContext(ut);
  return s.createElement("ul", Object.assign({ role: o }, o === "listbox" && { "aria-multiselectable": r }, { className: g(V.menuList, n), "aria-label": a }, i), t);
};
Fl.displayName = "MenuList";
const re = {
  menuToggle: "pf-v5-c-menu-toggle",
  menuToggleButton: "pf-v5-c-menu-toggle__button",
  menuToggleControls: "pf-v5-c-menu-toggle__controls",
  menuToggleCount: "pf-v5-c-menu-toggle__count",
  menuToggleIcon: "pf-v5-c-menu-toggle__icon",
  menuToggleStatusIcon: "pf-v5-c-menu-toggle__status-icon",
  menuToggleText: "pf-v5-c-menu-toggle__text",
  menuToggleToggleIcon: "pf-v5-c-menu-toggle__toggle-icon",
  modifiers: {
    primary: "pf-m-primary",
    secondary: "pf-m-secondary",
    expanded: "pf-m-expanded",
    plain: "pf-m-plain",
    text: "pf-m-text",
    fullHeight: "pf-m-full-height",
    disabled: "pf-m-disabled",
    typeahead: "pf-m-typeahead",
    splitButton: "pf-m-split-button",
    action: "pf-m-action",
    active: "pf-m-active",
    fullWidth: "pf-m-full-width",
    success: "pf-m-success",
    warning: "pf-m-warning",
    danger: "pf-m-danger"
  }
}, Pf = {
  name: "CaretDownIcon",
  height: 512,
  width: 320,
  svgPath: "M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z",
  yOffset: 0,
  xOffset: 0
}, Bl = ae(Pf);
var Vt;
(function(e) {
  e.success = "success", e.danger = "danger", e.warning = "warning";
})(Vt || (Vt = {}));
class ql extends s.Component {
  constructor() {
    super(...arguments), this.displayName = "MenuToggleBase", this.state = {
      ouiaStateId: ht(On.displayName, this.props.variant)
    };
  }
  render() {
    const t = this.props, { children: n, className: r, icon: a, badge: i, isExpanded: o, isDisabled: l, isFullHeight: c, isFullWidth: d, splitButtonOptions: u, variant: f, status: p, statusIcon: h, innerRef: v, onClick: m, "aria-label": x, ouiaId: _, ouiaSafe: y } = t, I = P(t, ["children", "className", "icon", "badge", "isExpanded", "isDisabled", "isFullHeight", "isFullWidth", "splitButtonOptions", "variant", "status", "statusIcon", "innerRef", "onClick", "aria-label", "ouiaId", "ouiaSafe"]), N = f === "plain", R = f === "plainText", L = f === "typeahead", O = pt(On.displayName, _ ?? this.state.ouiaStateId, y);
    let w = h;
    if (!h)
      switch (p) {
        case Vt.success:
          w = s.createElement(Yt, { "aria-hidden": "true" });
          break;
        case Vt.warning:
          w = s.createElement(Zt, { "aria-hidden": "true" });
          break;
        case Vt.danger:
          w = s.createElement(Jt, { "aria-hidden": "true" });
          break;
      }
    const j = s.createElement(
      "span",
      { className: g(re.menuToggleControls) },
      p !== void 0 && s.createElement("span", { className: g(re.menuToggleStatusIcon) }, w),
      s.createElement(
        "span",
        { className: g(re.menuToggleToggleIcon) },
        s.createElement(Bl, { "aria-hidden": !0 })
      )
    ), k = s.createElement(
      s.Fragment,
      null,
      a && s.createElement("span", { className: g(re.menuToggleIcon) }, a),
      L ? n : s.createElement("span", { className: g(re.menuToggleText) }, n),
      s.isValidElement(i) && s.createElement("span", { className: g(re.menuToggleCount) }, i),
      L ? s.createElement("button", Object.assign({ type: "button", className: g(re.menuToggleButton), "aria-expanded": o, onClick: m, "aria-label": x || "Menu toggle", tabIndex: -1 }, O), j) : j
    ), C = g(re.menuToggle, o && re.modifiers.expanded, f === "primary" && re.modifiers.primary, f === "secondary" && re.modifiers.secondary, p && re.modifiers[p], (N || R) && re.modifiers.plain, R && re.modifiers.text, c && re.modifiers.fullHeight, d && re.modifiers.fullWidth, l && re.modifiers.disabled, r), S = Object.assign(Object.assign({ children: N ? n : k }, l && { disabled: !0 }), I);
    return L ? s.createElement("div", Object.assign({ ref: v, className: g(C, re.modifiers.typeahead) }, S)) : u ? s.createElement(
      "div",
      { ref: v, className: g(C, re.modifiers.splitButton, (u == null ? void 0 : u.variant) === "action" && re.modifiers.action) },
      u == null ? void 0 : u.items,
      s.createElement(
        "button",
        Object.assign({ className: g(re.menuToggleButton, n && re.modifiers.text), type: "button", "aria-expanded": o, "aria-label": x, disabled: l, onClick: m }, I, O),
        n && s.createElement("span", { className: g(re.menuToggleText) }, n),
        j
      )
    ) : s.createElement("button", Object.assign({ className: g(C), type: "button", "aria-label": x, "aria-expanded": o, ref: v, disabled: l, onClick: m }, S, O));
  }
}
ql.defaultProps = {
  className: "",
  isExpanded: !1,
  isDisabled: !1,
  isFullWidth: !1,
  isFullHeight: !1,
  ouiaSafe: !0
};
const On = s.forwardRef((e, t) => s.createElement(ql, Object.assign({ innerRef: t }, e)));
On.displayName = "MenuToggle";
const Ne = {
  clipboardCopy: "pf-v5-c-clipboard-copy",
  clipboardCopyActions: "pf-v5-c-clipboard-copy__actions",
  clipboardCopyActionsItem: "pf-v5-c-clipboard-copy__actions-item",
  clipboardCopyExpandableContent: "pf-v5-c-clipboard-copy__expandable-content",
  clipboardCopyGroup: "pf-v5-c-clipboard-copy__group",
  clipboardCopyText: "pf-v5-c-clipboard-copy__text",
  clipboardCopyToggleIcon: "pf-v5-c-clipboard-copy__toggle-icon",
  modifiers: {
    expanded: "pf-m-expanded",
    inline: "pf-m-inline",
    block: "pf-m-block",
    code: "pf-m-code"
  }
}, Af = {
  name: "CopyIcon",
  height: 512,
  width: 448,
  svgPath: "M320 448v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V120c0-13.255 10.745-24 24-24h72v296c0 30.879 25.121 56 56 56h168zm0-344V0H152c-13.255 0-24 10.745-24 24v368c0 13.255 10.745 24 24 24h272c13.255 0 24-10.745 24-24V128H344c-13.2 0-24-10.8-24-24zm120.971-31.029L375.029 7.029A24 24 0 0 0 358.059 0H352v96h96v-6.059a24 24 0 0 0-7.029-16.97z",
  yOffset: 0,
  xOffset: 0
}, Mf = ae(Af), Ja = (e) => {
  var { onClick: t, exitDelay: n = 0, entryDelay: r = 300, maxWidth: a = "100px", position: i = "top", "aria-label": o = "Copyable input", id: l, textId: c, children: d, variant: u = "control", onTooltipHidden: f = () => {
  }, className: p } = e, h = P(e, ["onClick", "exitDelay", "entryDelay", "maxWidth", "position", "aria-label", "id", "textId", "children", "variant", "onTooltipHidden", "className"]);
  const v = s.createRef();
  return s.createElement(
    qe,
    { trigger: "mouseenter focus click", triggerRef: v, exitDelay: n, entryDelay: r, maxWidth: a, position: i, "aria-live": "polite", aria: "none", content: s.createElement("div", null, d), onTooltipHidden: f },
    s.createElement(
      oe,
      Object.assign({ type: "button", variant: u, onClick: t, "aria-label": o, className: p, id: l, "aria-labelledby": `${l} ${c}` }, h, { ref: v }),
      s.createElement(Mf, null)
    )
  );
};
Ja.displayName = "ClipboardCopyButton";
const Hl = (e) => {
  var { onClick: t, id: n, textId: r, contentId: a, isExpanded: i = !1 } = e, o = P(e, ["onClick", "id", "textId", "contentId", "isExpanded"]);
  return s.createElement(
    oe,
    Object.assign({ type: "button", variant: "control", onClick: t, id: n, "aria-labelledby": `${n} ${r}`, "aria-controls": a, "aria-expanded": i }, o),
    s.createElement(
      "div",
      { className: g(Ne.clipboardCopyToggleIcon) },
      s.createElement(yi, { "aria-hidden": "true" })
    )
  );
};
Hl.displayName = "ClipboardCopyToggle";
class Ei extends s.Component {
  constructor(t) {
    super(t);
  }
  render() {
    const t = this.props, { className: n, children: r, onChange: a, isReadOnly: i, isCode: o } = t, l = P(t, ["className", "children", "onChange", "isReadOnly", "isCode"]);
    return s.createElement("div", Object.assign({ suppressContentEditableWarning: !0, className: g(Ne.clipboardCopyExpandableContent, n), onInput: (c) => a(c, c.target.innerText), contentEditable: !i }, l), o ? s.createElement("pre", { dir: "ltr" }, r) : r);
  }
}
Ei.displayName = "ClipboardCopyExpanded";
Ei.defaultProps = {
  onChange: () => {
  },
  className: "",
  isReadOnly: !1,
  isCode: !1
};
const Df = (e, t) => {
  try {
    navigator.clipboard.writeText(t.toString());
  } catch (n) {
    console.warn("Clipboard API not found, this copy function will not work. This is likely because you're using an", `unsupported browser or you're not using HTTPS. 

If you're a developer building an application which needs`, "to support copying to the clipboard without the clipboard API, you'll have to create your own copy", "function and pass it to the ClipboardCopy component as the onCopy prop. For more information see", "https://developer.mozilla.org/en-US/docs/Web/API/Navigator/clipboard"), console.error(n);
  }
};
var no;
(function(e) {
  e.inline = "inline", e.expansion = "expansion", e.inlineCompact = "inline-compact";
})(no || (no = {}));
class en extends s.Component {
  constructor(t) {
    super(t), this.timer = null, this.componentDidUpdate = (r, a) => {
      if (r.children !== this.props.children) {
        const i = this.props.children;
        this.setState({ text: i, textWhenExpanded: i });
      }
    }, this.componentWillUnmount = () => {
      this.timer && window.clearTimeout(this.timer);
    }, this.expandContent = (r) => {
      this.setState((a) => ({
        expanded: !a.expanded
      }));
    }, this.updateText = (r, a) => {
      this.setState({ text: a }), this.props.onChange(r, a);
    }, this.updateTextWhenExpanded = (r, a) => {
      this.setState({ textWhenExpanded: a }), this.props.onChange(r, a);
    }, this.render = () => {
      const r = this.props, {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        isExpanded: a,
        onChange: i,
        // Don't pass to <div>
        /* eslint-enable @typescript-eslint/no-unused-vars */
        isReadOnly: o,
        isCode: l,
        isBlock: c,
        exitDelay: d,
        maxWidth: u,
        entryDelay: f,
        onCopy: p,
        hoverTip: h,
        clickTip: v,
        textAriaLabel: m,
        toggleAriaLabel: x,
        variant: _,
        position: y,
        className: I,
        additionalActions: N,
        ouiaId: R,
        ouiaSafe: L
      } = r, O = P(r, ["isExpanded", "onChange", "isReadOnly", "isCode", "isBlock", "exitDelay", "maxWidth", "entryDelay", "onCopy", "hoverTip", "clickTip", "textAriaLabel", "toggleAriaLabel", "variant", "position", "className", "additionalActions", "ouiaId", "ouiaSafe"]), w = "text-input-", j = "toggle-", k = "content-";
      return s.createElement(
        "div",
        Object.assign({ className: g(Ne.clipboardCopy, _ === "inline-compact" && Ne.modifiers.inline, c && Ne.modifiers.block, this.state.expanded && Ne.modifiers.expanded, I) }, O, pt(en.displayName, R, L)),
        _ === "inline-compact" && s.createElement(Ot, { prefix: "" }, (C) => s.createElement(
          s.Fragment,
          null,
          !l && s.createElement("span", { className: g(Ne.clipboardCopyText), id: `${w}${C}` }, this.state.text),
          l && s.createElement("code", { className: g(Ne.clipboardCopyText, Ne.modifiers.code), id: `${w}${C}` }, this.state.text),
          s.createElement(
            "span",
            { className: g(Ne.clipboardCopyActions) },
            s.createElement(
              "span",
              { className: g(Ne.clipboardCopyActionsItem) },
              s.createElement(Ja, { variant: "plain", exitDelay: d, entryDelay: f, maxWidth: u, position: y, id: `copy-button-${C}`, textId: `text-input-${C}`, "aria-label": h, onClick: (S) => {
                p(S, this.state.text), this.setState({ copied: !0 });
              }, onTooltipHidden: () => this.setState({ copied: !1 }) }, this.state.copied ? v : h)
            ),
            N && N
          )
        )),
        _ !== "inline-compact" && s.createElement(Ot, { prefix: "" }, (C) => s.createElement(
          s.Fragment,
          null,
          s.createElement(
            "div",
            { className: g(Ne.clipboardCopyGroup) },
            _ === "expansion" && s.createElement(Hl, { isExpanded: this.state.expanded, onClick: (S) => {
              this.expandContent(S), this.state.expanded ? this.setState({ text: this.state.textWhenExpanded }) : this.setState({ textWhenExpanded: this.state.text });
            }, id: `${j}${C}`, textId: `${w}${C}`, contentId: `${k}${C}`, "aria-label": x }),
            s.createElement(tt, Object.assign({ readOnlyVariant: o || this.state.expanded ? "default" : void 0, onChange: this.updateText, value: this.state.expanded ? this.state.textWhenExpanded : this.state.text, id: `text-input-${C}`, "aria-label": m }, l && { dir: "ltr" })),
            s.createElement(Ja, { exitDelay: d, entryDelay: f, maxWidth: u, position: y, id: `copy-button-${C}`, textId: `text-input-${C}`, "aria-label": h, onClick: (S) => {
              p(S, this.state.expanded ? this.state.textWhenExpanded : this.state.text), this.setState({ copied: !0 });
            }, onTooltipHidden: () => this.setState({ copied: !1 }) }, this.state.copied ? v : h)
          ),
          this.state.expanded && s.createElement(Ei, { isReadOnly: o, isCode: l, id: `content-${C}`, onChange: this.updateTextWhenExpanded }, this.state.text)
        ))
      );
    };
    const n = Array.isArray(this.props.children) ? this.props.children.join("") : this.props.children;
    this.state = {
      text: n,
      expanded: this.props.isExpanded,
      copied: !1,
      textWhenExpanded: n
    };
  }
}
en.displayName = "ClipboardCopy";
en.defaultProps = {
  hoverTip: "Copy to clipboard",
  clickTip: "Successfully copied to clipboard!",
  isReadOnly: !1,
  isExpanded: !1,
  isCode: !1,
  variant: "inline",
  position: za.top,
  maxWidth: "150px",
  exitDelay: 1500,
  entryDelay: 300,
  onCopy: Df,
  onChange: () => {
  },
  textAriaLabel: "Copyable input",
  toggleAriaLabel: "Show content",
  additionalActions: null,
  ouiaSafe: !0
};
const jf = {
  name: "GripVerticalIcon",
  height: 512,
  width: 320,
  svgPath: "M96 32H32C14.33 32 0 46.33 0 64v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zM288 32h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32z",
  yOffset: 0,
  xOffset: 0
}, Ff = ae(jf), ee = {
  modifiers: {
    noPadding: "pf-m-no-padding",
    widthAuto: "pf-m-width-auto",
    top: "pf-m-top",
    topLeft: "pf-m-top-left",
    topRight: "pf-m-top-right",
    bottom: "pf-m-bottom",
    bottomLeft: "pf-m-bottom-left",
    bottomRight: "pf-m-bottom-right",
    left: "pf-m-left",
    leftTop: "pf-m-left-top",
    leftBottom: "pf-m-left-bottom",
    right: "pf-m-right",
    rightTop: "pf-m-right-top",
    rightBottom: "pf-m-right-bottom",
    danger: "pf-m-danger",
    warning: "pf-m-warning",
    success: "pf-m-success",
    custom: "pf-m-custom",
    info: "pf-m-info"
  },
  popover: "pf-v5-c-popover",
  popoverArrow: "pf-v5-c-popover__arrow",
  popoverBody: "pf-v5-c-popover__body",
  popoverClose: "pf-v5-c-popover__close",
  popoverContent: "pf-v5-c-popover__content",
  popoverFooter: "pf-v5-c-popover__footer",
  popoverHeader: "pf-v5-c-popover__header",
  popoverTitle: "pf-v5-c-popover__title",
  popoverTitleIcon: "pf-v5-c-popover__title-icon",
  popoverTitleText: "pf-v5-c-popover__title-text"
}, Bf = s.createContext({}), $l = (e) => {
  var { className: t = null, children: n } = e, r = P(e, ["className", "children"]);
  return s.createElement("div", Object.assign({ className: g(ee.popoverContent, t) }, r), n);
};
$l.displayName = "PopoverContent";
const Vl = (e) => {
  var { children: t, id: n, className: r } = e, a = P(e, ["children", "id", "className"]);
  return s.createElement("div", Object.assign({ className: g(ee.popoverBody, r), id: n }, a), t);
};
Vl.displayName = "PopoverBody";
const Wl = (e) => {
  var { children: t, className: n } = e, r = P(e, ["children", "className"]);
  return s.createElement("span", Object.assign({ className: g(ee.popoverTitleIcon, n) }, r), t);
};
Wl.displayName = "PopoverHeaderIcon";
const zl = (e) => {
  var { children: t, className: n, headingLevel: r } = e, a = P(e, ["children", "className", "headingLevel"]);
  const i = r;
  return s.createElement(i, Object.assign({ className: g(ee.popoverTitleText, n) }, a), t);
};
zl.displayName = "PopoverHeaderText";
const Ul = (e) => {
  var { children: t, icon: n, className: r, titleHeadingLevel: a = "h6", alertSeverityVariant: i, id: o, alertSeverityScreenReaderText: l } = e, c = P(e, ["children", "icon", "className", "titleHeadingLevel", "alertSeverityVariant", "id", "alertSeverityScreenReaderText"]);
  return s.createElement(
    "header",
    Object.assign({ className: g(ee.popoverHeader, r) }, c),
    s.createElement(
      "div",
      { className: g(ee.popoverTitle), id: o },
      n && s.createElement(Wl, null, n),
      s.createElement(
        zl,
        { headingLevel: a },
        i && l && s.createElement("span", { className: "pf-v5-screen-reader" }, l),
        t
      )
    )
  );
};
Ul.displayName = "PopoverHeader";
const Gl = (e) => {
  var { children: t, className: n = "" } = e, r = P(e, ["children", "className"]);
  return s.createElement("footer", Object.assign({ className: g(ee.popoverFooter, n) }, r), t);
};
Gl.displayName = "PopoverFooter";
const Kl = (e) => {
  var { onClose: t = () => {
  } } = e, n = P(e, ["onClose"]);
  return s.createElement(
    "div",
    { className: g(ee.popoverClose) },
    s.createElement(
      oe,
      Object.assign({ onClick: t, variant: "plain", "aria-label": !0 }, n, { style: { pointerEvents: "auto" } }),
      s.createElement(El, null)
    )
  );
};
Kl.displayName = "PopoverCloseButton";
const Xl = (e) => {
  var { className: t = "" } = e, n = P(e, ["className"]);
  return s.createElement("div", Object.assign({ className: g(ee.popoverArrow, t) }, n));
};
Xl.displayName = "PopoverArrow";
const Gn = {
  name: "--pf-v5-c-popover--MaxWidth",
  value: "none",
  var: "var(--pf-v5-c-popover--MaxWidth)"
}, Kn = {
  name: "--pf-v5-c-popover--MinWidth",
  value: "auto",
  var: "var(--pf-v5-c-popover--MinWidth)"
};
var ro;
(function(e) {
  e.auto = "auto", e.top = "top", e.bottom = "bottom", e.left = "left", e.right = "right", e.topStart = "top-start", e.topEnd = "top-end", e.bottomStart = "bottom-start", e.bottomEnd = "bottom-end", e.leftStart = "left-start", e.leftEnd = "left-end", e.rightStart = "right-start", e.rightEnd = "right-end";
})(ro || (ro = {}));
const qf = {
  custom: ee.modifiers.custom,
  info: ee.modifiers.info,
  success: ee.modifiers.success,
  warning: ee.modifiers.warning,
  danger: ee.modifiers.danger
}, Yl = (e) => {
  var { children: t, position: n = "top", enableFlip: r = !0, className: a = "", isVisible: i = null, shouldClose: o = () => null, shouldOpen: l = () => null, "aria-label": c = "", bodyContent: d, headerContent: u = null, headerComponent: f = "h6", headerIcon: p = null, alertSeverityVariant: h, alertSeverityScreenReaderText: v, footerContent: m = null, appendTo: x = () => document.body, hideOnOutsideClick: _ = !0, onHide: y = () => null, onHidden: I = () => null, onShow: N = () => null, onShown: R = () => null, onMount: L = () => null, zIndex: O = 9999, triggerAction: w = "click", minWidth: j = Kn && Kn.value, maxWidth: k = Gn && Gn.value, closeBtnAriaLabel: C = "Close", showClose: S = !0, distance: b = 25, flipBehavior: E = [
    "top",
    "bottom",
    "left",
    "right",
    "top-start",
    "top-end",
    "bottom-start",
    "bottom-end",
    "left-start",
    "left-end",
    "right-start",
    "right-end"
  ], animationDuration: T = 300, id: A, withFocusTrap: F, triggerRef: M, hasNoPadding: D = !1, hasAutoWidth: q = !1, elementToFocus: z } = e, Z = P(e, ["children", "position", "enableFlip", "className", "isVisible", "shouldClose", "shouldOpen", "aria-label", "bodyContent", "headerContent", "headerComponent", "headerIcon", "alertSeverityVariant", "alertSeverityScreenReaderText", "footerContent", "appendTo", "hideOnOutsideClick", "onHide", "onHidden", "onShow", "onShown", "onMount", "zIndex", "triggerAction", "minWidth", "maxWidth", "closeBtnAriaLabel", "showClose", "distance", "flipBehavior", "animationDuration", "id", "withFocusTrap", "triggerRef", "hasNoPadding", "hasAutoWidth", "elementToFocus"]);
  const W = A || ll(), U = i !== null, [Y, X] = s.useState(!1), [ue, ne] = s.useState(!!F), Ie = s.useRef(null);
  s.useEffect(() => {
    L();
  }, []), s.useEffect(() => {
    U && (i ? ge(void 0, !0) : J());
  }, [i, U]);
  const ge = ($, ce) => {
    $ && N($), X(!0), F !== !1 && ce && ne(!0);
  }, J = ($) => {
    $ && y($), X(!1);
  }, te = {
    top: ee.modifiers.top,
    bottom: ee.modifiers.bottom,
    left: ee.modifiers.left,
    right: ee.modifiers.right,
    "top-start": ee.modifiers.topLeft,
    "top-end": ee.modifiers.topRight,
    "bottom-start": ee.modifiers.bottomLeft,
    "bottom-end": ee.modifiers.bottomRight,
    "left-start": ee.modifiers.leftTop,
    "left-end": ee.modifiers.leftBottom,
    "right-start": ee.modifiers.rightTop,
    "right-end": ee.modifiers.rightBottom
  }, Le = j !== Kn.value, Ee = k !== Gn.value, Pe = ($) => {
    $.key === bn.Escape && Y && (U ? o($, J) : J($));
  }, Te = ($, ce, de) => {
    if (_ && Y) {
      const Qe = de && de.contains($.target), rt = ce && ce.contains($.target);
      if (Qe || rt)
        return;
      U ? o($, J) : J($);
    }
  }, le = ($) => {
    U ? Y ? o($, J) : l($, ge) : Y ? J($) : ge($, !0);
  }, ve = () => {
    ue && ne(!1);
  }, Ue = ($) => {
    U ? l($, ge) : ge($, !1);
  }, se = ($) => {
    U ? o($, J) : J($);
  }, Ze = ($) => {
    U ? l($, ge) : ge($, !1);
  }, gt = ($) => {
    U ? o($, J) : J($);
  }, vt = ($) => {
    $.stopPropagation(), U ? o($, J) : J($);
  }, Ae = s.createElement(
    oi,
    Object.assign({ ref: Ie, active: ue, focusTrapOptions: {
      returnFocusOnDeactivate: F !== !1,
      clickOutsideDeactivates: !0,
      // FocusTrap's initialFocus can accept false as a value to prevent initial focus.
      // We want to prevent this in case false is ever passed in.
      initialFocus: z || void 0,
      checkCanFocusTrap: ($) => new Promise((ce) => {
        const de = setInterval(() => {
          $.every((Qe) => getComputedStyle(Qe).visibility !== "hidden") && (ce(), clearInterval(de));
        }, 10);
      }),
      tabbableOptions: { displayCheck: "none" },
      fallbackFocus: () => {
        let $ = null;
        return document && document.activeElement && ($ = document.activeElement), $;
      }
    }, preventScrollOnDeactivate: !0, className: g(ee.popover, h && qf[h], D && ee.modifiers.noPadding, q && ee.modifiers.widthAuto, a), role: "dialog", "aria-modal": "true", "aria-label": u ? void 0 : c, "aria-labelledby": u ? `popover-${W}-header` : void 0, "aria-describedby": `popover-${W}-body`, onMouseDown: ve, style: {
      minWidth: Le ? j : null,
      maxWidth: Ee ? k : null
    } }, Z),
    s.createElement(Xl, null),
    s.createElement(
      $l,
      null,
      S && w === "click" && s.createElement(Kl, { onClose: vt, "aria-label": C }),
      u && s.createElement(Ul, { id: `popover-${W}-header`, icon: p, alertSeverityVariant: h, alertSeverityScreenReaderText: v || `${h} alert:`, titleHeadingLevel: f }, typeof u == "function" ? u(J) : u),
      s.createElement(Vl, { id: `popover-${W}-body` }, typeof d == "function" ? d(J) : d),
      m && s.createElement(Gl, { id: `popover-${W}-footer` }, typeof m == "function" ? m(J) : m)
    )
  );
  return s.createElement(
    Bf.Provider,
    { value: { headerComponent: f } },
    s.createElement(Nn, { trigger: t, triggerRef: M, popper: Ae, popperRef: Ie, minWidth: j, appendTo: x, isVisible: Y, onMouseEnter: w === "hover" && Ue, onMouseLeave: w === "hover" && se, onPopperMouseEnter: w === "hover" && Ue, onPopperMouseLeave: w === "hover" && se, onFocus: w === "hover" && Ze, onBlur: w === "hover" && gt, positionModifiers: te, distance: b, placement: n, onTriggerClick: w === "click" && le, onDocumentClick: Te, onDocumentKeyDown: Pe, enableFlip: r, zIndex: O, flipBehavior: E, animationDuration: T, onHidden: I, onShown: R, onHide: () => ne(!1) })
  );
};
Yl.displayName = "Popover";
const $e = {
  helperText: "pf-v5-c-helper-text",
  helperTextItem: "pf-v5-c-helper-text__item",
  helperTextItemIcon: "pf-v5-c-helper-text__item-icon",
  helperTextItemText: "pf-v5-c-helper-text__item-text",
  modifiers: {
    indeterminate: "pf-m-indeterminate",
    warning: "pf-m-warning",
    success: "pf-m-success",
    error: "pf-m-error",
    dynamic: "pf-m-dynamic"
  }
}, pn = (e) => {
  var { children: t, className: n, component: r = "div", id: a, isLiveRegion: i = !1, "aria-label": o } = e, l = P(e, ["children", "className", "component", "id", "isLiveRegion", "aria-label"]);
  const c = r;
  return s.createElement(c, Object.assign({ id: a, className: g($e.helperText, n) }, i && { "aria-live": "polite" }, r === "ul" && { role: "list", "aria-label": o }, l), t);
};
pn.displayName = "HelperText";
const Hf = {
  name: "MinusIcon",
  height: 512,
  width: 448,
  svgPath: "M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z",
  yOffset: 0,
  xOffset: 0
}, $f = ae(Hf), Vf = {
  default: "",
  indeterminate: $e.modifiers.indeterminate,
  warning: $e.modifiers.warning,
  success: $e.modifiers.success,
  error: $e.modifiers.error
}, mn = (e) => {
  var { children: t, className: n, component: r = "div", variant: a = "default", icon: i, isDynamic: o = !1, hasIcon: l = o, id: c, screenReaderText: d = `${a} status` } = e, u = P(e, ["children", "className", "component", "variant", "icon", "isDynamic", "hasIcon", "id", "screenReaderText"]);
  const f = r;
  return s.createElement(
    f,
    Object.assign({ className: g($e.helperTextItem, Vf[a], o && $e.modifiers.dynamic, n), id: c }, u),
    i && s.createElement("span", { className: g($e.helperTextItemIcon), "aria-hidden": !0 }, i),
    l && !i && s.createElement(
      "span",
      { className: g($e.helperTextItemIcon), "aria-hidden": !0 },
      (a === "default" || a === "indeterminate") && s.createElement($f, null),
      a === "warning" && s.createElement(Zt, null),
      a === "success" && s.createElement(Yt, null),
      a === "error" && s.createElement(Jt, null)
    ),
    s.createElement(
      "span",
      { className: g($e.helperTextItemText) },
      t,
      o && s.createElement(
        "span",
        { className: "pf-v5-screen-reader" },
        ": ",
        d,
        ";"
      )
    )
  );
};
mn.displayName = "HelperTextItem";
const Xn = {
  divider: "pf-v5-c-divider",
  modifiers: {
    hidden: "pf-m-hidden",
    hiddenOnSm: "pf-m-hidden-on-sm",
    visibleOnSm: "pf-m-visible-on-sm",
    hiddenOnMd: "pf-m-hidden-on-md",
    visibleOnMd: "pf-m-visible-on-md",
    hiddenOnLg: "pf-m-hidden-on-lg",
    visibleOnLg: "pf-m-visible-on-lg",
    hiddenOnXl: "pf-m-hidden-on-xl",
    visibleOnXl: "pf-m-visible-on-xl",
    hiddenOn_2xl: "pf-m-hidden-on-2xl",
    visibleOn_2xl: "pf-m-visible-on-2xl",
    vertical: "pf-m-vertical",
    insetNone: "pf-m-inset-none",
    insetXs: "pf-m-inset-xs",
    insetSm: "pf-m-inset-sm",
    insetMd: "pf-m-inset-md",
    insetLg: "pf-m-inset-lg",
    insetXl: "pf-m-inset-xl",
    inset_2xl: "pf-m-inset-2xl",
    inset_3xl: "pf-m-inset-3xl",
    horizontalOnSm: "pf-m-horizontal-on-sm",
    verticalOnSm: "pf-m-vertical-on-sm",
    insetNoneOnSm: "pf-m-inset-none-on-sm",
    insetXsOnSm: "pf-m-inset-xs-on-sm",
    insetSmOnSm: "pf-m-inset-sm-on-sm",
    insetMdOnSm: "pf-m-inset-md-on-sm",
    insetLgOnSm: "pf-m-inset-lg-on-sm",
    insetXlOnSm: "pf-m-inset-xl-on-sm",
    inset_2xlOnSm: "pf-m-inset-2xl-on-sm",
    inset_3xlOnSm: "pf-m-inset-3xl-on-sm",
    horizontalOnMd: "pf-m-horizontal-on-md",
    verticalOnMd: "pf-m-vertical-on-md",
    insetNoneOnMd: "pf-m-inset-none-on-md",
    insetXsOnMd: "pf-m-inset-xs-on-md",
    insetSmOnMd: "pf-m-inset-sm-on-md",
    insetMdOnMd: "pf-m-inset-md-on-md",
    insetLgOnMd: "pf-m-inset-lg-on-md",
    insetXlOnMd: "pf-m-inset-xl-on-md",
    inset_2xlOnMd: "pf-m-inset-2xl-on-md",
    inset_3xlOnMd: "pf-m-inset-3xl-on-md",
    horizontalOnLg: "pf-m-horizontal-on-lg",
    verticalOnLg: "pf-m-vertical-on-lg",
    insetNoneOnLg: "pf-m-inset-none-on-lg",
    insetXsOnLg: "pf-m-inset-xs-on-lg",
    insetSmOnLg: "pf-m-inset-sm-on-lg",
    insetMdOnLg: "pf-m-inset-md-on-lg",
    insetLgOnLg: "pf-m-inset-lg-on-lg",
    insetXlOnLg: "pf-m-inset-xl-on-lg",
    inset_2xlOnLg: "pf-m-inset-2xl-on-lg",
    inset_3xlOnLg: "pf-m-inset-3xl-on-lg",
    horizontalOnXl: "pf-m-horizontal-on-xl",
    verticalOnXl: "pf-m-vertical-on-xl",
    insetNoneOnXl: "pf-m-inset-none-on-xl",
    insetXsOnXl: "pf-m-inset-xs-on-xl",
    insetSmOnXl: "pf-m-inset-sm-on-xl",
    insetMdOnXl: "pf-m-inset-md-on-xl",
    insetLgOnXl: "pf-m-inset-lg-on-xl",
    insetXlOnXl: "pf-m-inset-xl-on-xl",
    inset_2xlOnXl: "pf-m-inset-2xl-on-xl",
    inset_3xlOnXl: "pf-m-inset-3xl-on-xl",
    horizontalOn_2xl: "pf-m-horizontal-on-2xl",
    verticalOn_2xl: "pf-m-vertical-on-2xl",
    insetNoneOn_2xl: "pf-m-inset-none-on-2xl",
    insetXsOn_2xl: "pf-m-inset-xs-on-2xl",
    insetSmOn_2xl: "pf-m-inset-sm-on-2xl",
    insetMdOn_2xl: "pf-m-inset-md-on-2xl",
    insetLgOn_2xl: "pf-m-inset-lg-on-2xl",
    insetXlOn_2xl: "pf-m-inset-xl-on-2xl",
    inset_2xlOn_2xl: "pf-m-inset-2xl-on-2xl",
    inset_3xlOn_2xl: "pf-m-inset-3xl-on-2xl"
  }
};
var Za;
(function(e) {
  e.hr = "hr", e.li = "li", e.div = "div";
})(Za || (Za = {}));
const Jl = (e) => {
  var { className: t, component: n = Za.hr, inset: r, orientation: a } = e, i = P(e, ["className", "component", "inset", "orientation"]);
  const o = n;
  return s.createElement(o, Object.assign({ className: g(Xn.divider, _n(r, Xn), _n(a, Xn), t) }, n !== "hr" && { role: "separator" }, i));
};
Jl.displayName = "Divider";
const Wf = (e) => {
  var { children: t, className: n, onSelect: r, isOpen: a, toggle: i, shouldFocusToggleOnSelect: o = !1, onOpenChange: l, onToggleKeydown: c, isPlain: d, isScrollable: u, innerRef: f, ouiaId: p, ouiaSafe: h = !0, zIndex: v = 9999, popperProps: m, onOpenChangeKeys: x = ["Escape", "Tab"], menuHeight: _, maxMenuHeight: y, shouldFocusFirstItemOnOpen: I = !1, shouldPreventScrollOnItemFocus: N = !0, focusTimeoutDelay: R = 0 } = e, L = P(e, ["children", "className", "onSelect", "isOpen", "toggle", "shouldFocusToggleOnSelect", "onOpenChange", "onToggleKeydown", "isPlain", "isScrollable", "innerRef", "ouiaId", "ouiaSafe", "zIndex", "popperProps", "onOpenChangeKeys", "menuHeight", "maxMenuHeight", "shouldFocusFirstItemOnOpen", "shouldPreventScrollOnItemFocus", "focusTimeoutDelay"]);
  const O = Oe.useRef(), w = Oe.useRef(), j = mt(_i.displayName, p, h), k = f || O, C = typeof i == "function" || typeof i != "function" && !i.toggleRef ? w : i == null ? void 0 : i.toggleRef;
  Oe.useEffect(() => {
    const E = (A) => {
      var F, M, D, q;
      a && l && (!((F = k.current) === null || F === void 0) && F.contains(A.target) || !((M = C.current) === null || M === void 0) && M.contains(A.target)) && x.includes(A.key) && (l(!1), (D = C.current) === null || D === void 0 || D.focus()), !((q = C.current) === null || q === void 0) && q.contains(A.target) && (c ? c(A) : a && ef(A, k));
    }, T = (A) => {
      var F, M, D;
      a && I && (!((F = C.current) === null || F === void 0) && F.contains(A.target)) && setTimeout(() => {
        var q;
        const z = (q = k == null ? void 0 : k.current) === null || q === void 0 ? void 0 : q.querySelector('li button:not(:disabled),li input:not(:disabled),li a:not([aria-disabled="true"])');
        z && z.focus({ preventScroll: N });
      }, R), a && l && !(!((M = C == null ? void 0 : C.current) === null || M === void 0) && M.contains(A.target)) && a && !(!((D = k.current) === null || D === void 0) && D.contains(A.target)) && l(!1);
    };
    return window.addEventListener("keydown", E), window.addEventListener("click", T), () => {
      window.removeEventListener("keydown", E), window.removeEventListener("click", T);
    };
  }, [
    a,
    k,
    C,
    l,
    x,
    c,
    N,
    I,
    R
  ]);
  const S = y !== void 0 || _ !== void 0 || u, b = Oe.createElement(
    wn,
    Object.assign({ className: g(n), ref: k, onSelect: (E, T) => {
      var A;
      r && r(E, T), o && ((A = C.current) === null || A === void 0 || A.focus());
    }, isPlain: d, isScrollable: S }, L, j),
    Oe.createElement(Al, { menuHeight: _, maxMenuHeight: y }, t)
  );
  return Oe.createElement(Nn, Object.assign({ trigger: typeof i == "function" ? i(C) : i.toggleNode, triggerRef: C, popper: b, popperRef: k, isVisible: a, zIndex: v }, m));
}, _i = Oe.forwardRef((e, t) => Oe.createElement(Wf, Object.assign({ innerRef: t }, e)));
_i.displayName = "Dropdown";
const zf = (e) => {
  var { children: t, className: n, description: r, isDisabled: a, isAriaDisabled: i, value: o, onClick: l, ouiaId: c, ouiaSafe: d, innerRef: u, tooltipProps: f } = e, p = P(e, ["children", "className", "description", "isDisabled", "isAriaDisabled", "value", "onClick", "ouiaId", "ouiaSafe", "innerRef", "tooltipProps"]);
  const h = mt(Ci.displayName, c, d);
  return Oe.createElement(jl, Object.assign({ className: g(n), description: r, isDisabled: a, isAriaDisabled: i, itemId: o, onClick: l, tooltipProps: f, ref: u }, h, p), t);
}, Ci = Oe.forwardRef((e, t) => Oe.createElement(zf, Object.assign({}, e, { innerRef: t })));
Ci.displayName = "DropdownItem";
const Zl = (e) => {
  var { children: t, className: n } = e, r = P(e, ["children", "className"]);
  return Oe.createElement(Fl, Object.assign({ className: g(n) }, r), t);
};
Zl.displayName = "DropdownList";
const Uf = {
  name: "AngleDownIcon",
  height: 512,
  width: 320,
  svgPath: "M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z",
  yOffset: 0,
  xOffset: 0
}, Ql = ae(Uf), _e = {
  form: "pf-v5-c-form",
  formGroup: "pf-v5-c-form__group",
  formGroupControl: "pf-v5-c-form__group-control",
  formGroupLabel: "pf-v5-c-form__group-label",
  formGroupLabelInfo: "pf-v5-c-form__group-label-info",
  formGroupLabelMain: "pf-v5-c-form__group-label-main",
  formLabel: "pf-v5-c-form__label",
  formLabelRequired: "pf-v5-c-form__label-required",
  formLabelText: "pf-v5-c-form__label-text",
  modifiers: {
    horizontal: "pf-m-horizontal",
    noPaddingTop: "pf-m-no-padding-top",
    info: "pf-m-info",
    limitWidth: "pf-m-limit-width",
    inline: "pf-m-inline",
    stack: "pf-m-stack"
  }
}, Gf = {
  name: "--pf-v5-c-form--m-limit-width--MaxWidth"
}, Kf = (e) => {
  var { children: t = null, className: n = "", isHorizontal: r = !1, isWidthLimited: a = !1, maxWidth: i = "", innerRef: o } = e, l = P(e, ["children", "className", "isHorizontal", "isWidthLimited", "maxWidth", "innerRef"]);
  return s.createElement("form", Object.assign({ noValidate: !0 }, i && {
    style: Object.assign({ [Gf.name]: i }, l.style)
  }, l, { className: g(_e.form, r && _e.modifiers.horizontal, (a || i) && _e.modifiers.limitWidth, n), ref: o }), t);
}, ec = s.forwardRef((e, t) => s.createElement(Kf, Object.assign({ innerRef: t }, e)));
ec.displayName = "Form";
const Et = (e) => {
  var { children: t = null, className: n = "", label: r, labelInfo: a, labelIcon: i, isRequired: o = !1, isInline: l = !1, hasNoPaddingTop: c = !1, isStack: d = !1, fieldId: u, role: f } = e, p = P(e, ["children", "className", "label", "labelInfo", "labelIcon", "isRequired", "isInline", "hasNoPaddingTop", "isStack", "fieldId", "role"]);
  const h = f === "group" || f === "radiogroup", v = h ? "span" : "label", m = s.createElement(
    s.Fragment,
    null,
    s.createElement(
      v,
      Object.assign({ className: g(_e.formLabel) }, !h && { htmlFor: u }),
      s.createElement("span", { className: g(_e.formLabelText) }, r),
      o && s.createElement(
        "span",
        { className: g(_e.formLabelRequired), "aria-hidden": "true" },
        " ",
        cl
      )
    ),
    " ",
    s.isValidElement(i) && i
  );
  return s.createElement(Ot, null, (x) => s.createElement(
    "div",
    Object.assign({ className: g(_e.formGroup, n) }, f && { role: f }, h && { "aria-labelledby": `${u || x}-legend` }, p),
    r && s.createElement(
      "div",
      Object.assign({ className: g(_e.formGroupLabel, a && _e.modifiers.info, c && _e.modifiers.noPaddingTop) }, h && { id: `${u || x}-legend` }),
      a && s.createElement(
        s.Fragment,
        null,
        s.createElement("div", { className: g(_e.formGroupLabelMain) }, m),
        s.createElement("div", { className: g(_e.formGroupLabelInfo) }, a)
      ),
      !a && m
    ),
    s.createElement("div", { className: g(_e.formGroupControl, l && _e.modifiers.inline, d && _e.modifiers.stack) }, t)
  ));
};
Et.displayName = "FormGroup";
const De = {
  emptyState: "pf-v5-c-empty-state",
  emptyStateBody: "pf-v5-c-empty-state__body",
  emptyStateContent: "pf-v5-c-empty-state__content",
  emptyStateTitleText: "pf-v5-c-empty-state__title-text",
  modifiers: {
    xs: "pf-m-xs",
    sm: "pf-m-sm",
    lg: "pf-m-lg",
    xl: "pf-m-xl",
    fullHeight: "pf-m-full-height"
  }
};
var Qa;
(function(e) {
  e.xs = "xs", e.sm = "sm", e.lg = "lg", e.xl = "xl", e.full = "full";
})(Qa || (Qa = {}));
const tc = (e) => {
  var { children: t, className: n, variant: r = Qa.full, isFullHeight: a } = e, i = P(e, ["children", "className", "variant", "isFullHeight"]);
  return s.createElement(
    "div",
    Object.assign({ className: g(De.emptyState, r === "xs" && De.modifiers.xs, r === "sm" && De.modifiers.sm, r === "lg" && De.modifiers.lg, r === "xl" && De.modifiers.xl, a && De.modifiers.fullHeight, n) }, i),
    s.createElement("div", { className: g(De.emptyStateContent) }, t)
  );
};
tc.displayName = "EmptyState";
const nc = (e) => {
  var { children: t, className: n, titleClassName: r, titleText: a, headingLevel: i = "h1", icon: o } = e, l = P(e, ["children", "className", "titleClassName", "titleText", "headingLevel", "icon"]);
  return s.createElement(
    "div",
    Object.assign({ className: g(`${De.emptyState}__header`, n) }, l),
    o,
    (a || t) && s.createElement(
      "div",
      { className: g(`${De.emptyState}__title`) },
      a && s.createElement(i, { className: g(De.emptyStateTitleText, r) }, a),
      t
    )
  );
};
nc.displayName = "EmptyStateHeader";
const rc = (e) => {
  var { children: t, className: n } = e, r = P(e, ["children", "className"]);
  return s.createElement("div", Object.assign({ className: g(De.emptyStateBody, n) }, r), t);
};
rc.displayName = "EmptyStateBody";
var ln = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Xf(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
class Tt extends s.Component {
  constructor(t) {
    super(t), this.handleChange = (n) => {
      this.props.onChange(n, n.currentTarget.value);
    }, !t.id && !t["aria-label"] && console.error("FormSelect requires either an id or aria-label to be specified"), this.state = {
      ouiaStateId: ht(Tt.displayName, t.validated)
    };
  }
  render() {
    const t = this.props, { children: n, className: r, value: a, validated: i, isDisabled: o, isRequired: l, ouiaId: c, ouiaSafe: d } = t, u = P(t, ["children", "className", "value", "validated", "isDisabled", "isRequired", "ouiaId", "ouiaSafe"]), f = s.Children.toArray(n).find((v) => v.props.value === a), p = f && f.props.isPlaceholder, h = ["success", "error", "warning"].includes(i);
    return s.createElement(
      "span",
      { className: g(xe.formControl, o && xe.modifiers.disabled, p && xe.modifiers.placeholder, h && xe.modifiers[i], r) },
      s.createElement("select", Object.assign({}, u, { "aria-invalid": i === hn.error }, pt(Tt.displayName, c !== void 0 ? c : this.state.ouiaStateId, d), { onChange: this.handleChange, disabled: o, required: l, value: a }), n),
      s.createElement(
        "span",
        { className: g(xe.formControlUtilities) },
        h && s.createElement(Xa, { status: i }),
        s.createElement(
          "span",
          { className: g(xe.formControlToggleIcon) },
          s.createElement(Bl, null)
        )
      )
    );
  }
}
Tt.displayName = "FormSelect";
Tt.defaultProps = {
  className: "",
  value: "",
  validated: "default",
  isDisabled: !1,
  isRequired: !1,
  onBlur: () => {
  },
  onFocus: () => {
  },
  onChange: () => {
  },
  ouiaSafe: !0
};
const ac = (e) => {
  var {
    className: t = "",
    value: n = "",
    isDisabled: r = !1,
    label: a,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isPlaceholder: i = !1
  } = e, o = P(e, ["className", "value", "isDisabled", "label", "isPlaceholder"]);
  return s.createElement("option", Object.assign({}, o, { className: t, value: n, disabled: r }), a);
};
ac.displayName = "FormSelectOption";
const Yf = {
  isManagedSidebar: !1,
  isSidebarOpen: !1,
  onSidebarToggle: () => null,
  width: null,
  height: null,
  getBreakpoint: Dd,
  getVerticalBreakpoint: Md
}, wi = s.createContext(Yf);
wi.Provider;
wi.Consumer;
const fe = {
  modifiers: {
    light: "pf-m-light",
    menu: "pf-m-menu",
    hidden: "pf-m-hidden",
    hiddenOnSm: "pf-m-hidden-on-sm",
    visibleOnSm: "pf-m-visible-on-sm",
    hiddenOnMd: "pf-m-hidden-on-md",
    visibleOnMd: "pf-m-visible-on-md",
    hiddenOnLg: "pf-m-hidden-on-lg",
    visibleOnLg: "pf-m-visible-on-lg",
    hiddenOnXl: "pf-m-hidden-on-xl",
    visibleOnXl: "pf-m-visible-on-xl",
    hiddenOn_2xl: "pf-m-hidden-on-2xl",
    visibleOn_2xl: "pf-m-visible-on-2xl",
    read: "pf-m-read",
    selected: "pf-m-selected",
    unread: "pf-m-unread",
    attention: "pf-m-attention",
    expanded: "pf-m-expanded",
    collapsed: "pf-m-collapsed",
    pageInsets: "pf-m-page-insets",
    insetNone: "pf-m-inset-none",
    fill: "pf-m-fill",
    noFill: "pf-m-no-fill",
    limitWidth: "pf-m-limit-width",
    alignCenter: "pf-m-align-center",
    overflowScroll: "pf-m-overflow-scroll",
    shadowBottom: "pf-m-shadow-bottom",
    shadowTop: "pf-m-shadow-top",
    stickyTop: "pf-m-sticky-top",
    stickyBottom: "pf-m-sticky-bottom",
    stickyTopOnSmHeight: "pf-m-sticky-top-on-sm-height",
    stickyBottomOnSmHeight: "pf-m-sticky-bottom-on-sm-height",
    stickyTopOnMdHeight: "pf-m-sticky-top-on-md-height",
    stickyBottomOnMdHeight: "pf-m-sticky-bottom-on-md-height",
    stickyTopOnLgHeight: "pf-m-sticky-top-on-lg-height",
    stickyBottomOnLgHeight: "pf-m-sticky-bottom-on-lg-height",
    stickyTopOnXlHeight: "pf-m-sticky-top-on-xl-height",
    stickyBottomOnXlHeight: "pf-m-sticky-bottom-on-xl-height",
    stickyTopOn_2xlHeight: "pf-m-sticky-top-on-2xl-height",
    stickyBottomOn_2xlHeight: "pf-m-sticky-bottom-on-2xl-height",
    light_100: "pf-m-light-100",
    dark_100: "pf-m-dark-100",
    dark_200: "pf-m-dark-200",
    padding: "pf-m-padding",
    noPadding: "pf-m-no-padding",
    paddingOnSm: "pf-m-padding-on-sm",
    noPaddingOnSm: "pf-m-no-padding-on-sm",
    paddingOnMd: "pf-m-padding-on-md",
    noPaddingOnMd: "pf-m-no-padding-on-md",
    paddingOnLg: "pf-m-padding-on-lg",
    noPaddingOnLg: "pf-m-no-padding-on-lg",
    paddingOnXl: "pf-m-padding-on-xl",
    noPaddingOnXl: "pf-m-no-padding-on-xl",
    paddingOn_2xl: "pf-m-padding-on-2xl",
    noPaddingOn_2xl: "pf-m-no-padding-on-2xl",
    light_200: "pf-m-light-200"
  },
  pageMainBody: "pf-v5-c-page__main-body",
  pageMainBreadcrumb: "pf-v5-c-page__main-breadcrumb",
  pageMainNav: "pf-v5-c-page__main-nav",
  pageMainSection: "pf-v5-c-page__main-section",
  pageMainSubnav: "pf-v5-c-page__main-subnav",
  pageMainTabs: "pf-v5-c-page__main-tabs",
  pageMainWizard: "pf-v5-c-page__main-wizard"
};
var _t;
(function(e) {
  e.default = "default", e.light = "light", e.dark = "dark", e.darker = "darker";
})(_t || (_t = {}));
var Ke;
(function(e) {
  e.default = "default", e.nav = "nav", e.subNav = "subnav", e.breadcrumb = "breadcrumb", e.tabs = "tabs", e.wizard = "wizard";
})(Ke || (Ke = {}));
const Jf = {
  [Ke.default]: fe.pageMainSection,
  [Ke.nav]: fe.pageMainNav,
  [Ke.subNav]: fe.pageMainSubnav,
  [Ke.breadcrumb]: fe.pageMainBreadcrumb,
  [Ke.tabs]: fe.pageMainTabs,
  [Ke.wizard]: fe.pageMainWizard
}, Zf = {
  [_t.default]: "",
  [_t.light]: fe.modifiers.light,
  [_t.dark]: fe.modifiers.dark_200,
  [_t.darker]: fe.modifiers.dark_100
}, ic = (e) => {
  var { className: t = "", children: n, variant: r = "default", type: a = "default", padding: i, isFilled: o, isWidthLimited: l = !1, isCenterAligned: c = !1, stickyOnBreakpoint: d, hasShadowTop: u = !1, hasShadowBottom: f = !1, hasOverflowScroll: p = !1, "aria-label": h, component: v = "section" } = e, m = P(e, ["className", "children", "variant", "type", "padding", "isFilled", "isWidthLimited", "isCenterAligned", "stickyOnBreakpoint", "hasShadowTop", "hasShadowBottom", "hasOverflowScroll", "aria-label", "component"]);
  const { height: x, getVerticalBreakpoint: _ } = s.useContext(wi);
  s.useEffect(() => {
    p && !h && console.warn("PageSection: An accessible aria-label is required when hasOverflowScroll is set to true.");
  }, [p, h]);
  const y = v;
  return s.createElement(
    y,
    Object.assign({}, m, { className: g(Jf[a], _n(i, fe), _n(d, fe, "sticky-", _(x), !0), Zf[r], o === !1 && fe.modifiers.noFill, o === !0 && fe.modifiers.fill, l && fe.modifiers.limitWidth, l && c && a !== Ke.subNav && fe.modifiers.alignCenter, u && fe.modifiers.shadowTop, f && fe.modifiers.shadowBottom, p && fe.modifiers.overflowScroll, t) }, p && { tabIndex: 0 }, { "aria-label": h }),
    l && s.createElement("div", { className: g(fe.pageMainBody) }, n),
    !l && n
  );
};
ic.displayName = "PageSection";
const oc = (e) => {
  var { children: t = null, className: n = "", component: r = "div" } = e, a = P(e, ["children", "className", "component"]);
  const i = r;
  return s.createElement(i, Object.assign({ className: g(_l.bullseye, n) }, a), t);
};
oc.displayName = "Bullseye";
const In = {
  modifiers: {
    fill: "pf-m-fill",
    gutter: "pf-m-gutter"
  },
  stack: "pf-v5-l-stack",
  stackItem: "pf-v5-l-stack__item"
}, sc = (e) => {
  var { hasGutter: t = !1, className: n = "", children: r = null, component: a = "div" } = e, i = P(e, ["hasGutter", "className", "children", "component"]);
  const o = a;
  return s.createElement(o, Object.assign({}, i, { className: g(In.stack, t && In.modifiers.gutter, n) }), r);
};
sc.displayName = "Stack";
const Dt = (e) => {
  var { isFilled: t = !1, className: n = "", children: r = null } = e, a = P(e, ["isFilled", "className", "children"]);
  return s.createElement("div", Object.assign({}, a, { className: g(In.stackItem, t && In.modifiers.fill, n) }), r);
};
Dt.displayName = "StackItem";
const Qf = {
  name: "ArrowsAltVIcon",
  height: 512,
  width: 256,
  svgPath: "M214.059 377.941H168V134.059h46.059c21.382 0 32.09-25.851 16.971-40.971L144.971 7.029c-9.373-9.373-24.568-9.373-33.941 0L24.971 93.088c-15.119 15.119-4.411 40.971 16.971 40.971H88v243.882H41.941c-21.382 0-32.09 25.851-16.971 40.971l86.059 86.059c9.373 9.373 24.568 9.373 33.941 0l86.059-86.059c15.12-15.119 4.412-40.971-16.97-40.971z",
  yOffset: 0,
  xOffset: 0
}, ep = ae(Qf), tp = {
  name: "EllipsisHIcon",
  height: 512,
  width: 512,
  svgPath: "M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z",
  yOffset: 0,
  xOffset: 0
}, np = ae(tp), rp = {
  name: "EllipsisVIcon",
  height: 512,
  width: 192,
  svgPath: "M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z",
  yOffset: 0,
  xOffset: 0
}, ap = ae(rp), ip = {
  name: "HelpIcon",
  height: 1024,
  width: 1024,
  svgPath: "M521.3,576 C627.5,576 713.7,502 713.7,413.7 C713.7,325.4 627.6,253.6 521.3,253.6 C366,253.6 334.5,337.7 329.2,407.2 C329.2,414.3 335.2,416 343.5,416 L445,416 C450.5,416 458,415.5 460.8,406.5 C460.8,362.6 582.9,357.1 582.9,413.6 C582.9,441.9 556.2,470.9 521.3,473 C486.4,475.1 447.3,479.8 447.3,521.7 L447.3,553.8 C447.3,570.8 456.1,576 472,576 C487.9,576 521.3,576 521.3,576 M575.3,751.3 L575.3,655.3 C575.313862,651.055109 573.620137,646.982962 570.6,644 C567.638831,640.947672 563.552355,639.247987 559.3,639.29884 L463.3,639.29884 C459.055109,639.286138 454.982962,640.979863 452,644 C448.947672,646.961169 447.247987,651.047645 447.29884,655.3 L447.29884,751.3 C447.286138,755.544891 448.979863,759.617038 452,762.6 C454.961169,765.652328 459.047645,767.352013 463.3,767.30116 L559.3,767.30116 C563.544891,767.313862 567.617038,765.620137 570.6,762.6 C573.659349,759.643612 575.360354,755.553963 575.3,751.3 M512,896 C300.2,896 128,723.9 128,512 C128,300.3 300.2,128 512,128 C723.8,128 896,300.2 896,512 C896,723.8 723.7,896 512,896 M512.1,0 C229.7,0 0,229.8 0,512 C0,794.2 229.8,1024 512.1,1024 C794.4,1024 1024,794.3 1024,512 C1024,229.7 794.4,0 512.1,0",
  yOffset: 0,
  xOffset: 0
}, ao = ae(ip), op = {
  name: "LongArrowAltDownIcon",
  height: 512,
  width: 256,
  svgPath: "M168 345.941V44c0-6.627-5.373-12-12-12h-56c-6.627 0-12 5.373-12 12v301.941H41.941c-21.382 0-32.09 25.851-16.971 40.971l86.059 86.059c9.373 9.373 24.569 9.373 33.941 0l86.059-86.059c15.119-15.119 4.411-40.971-16.971-40.971H168z",
  yOffset: 0,
  xOffset: 0
}, sp = ae(op), lp = {
  name: "LongArrowAltUpIcon",
  height: 512,
  width: 256,
  svgPath: "M88 166.059V468c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12V166.059h46.059c21.382 0 32.09-25.851 16.971-40.971l-86.059-86.059c-9.373-9.373-24.569-9.373-33.941 0l-86.059 86.059c-15.119 15.119-4.411 40.971 16.971 40.971H88z",
  yOffset: 0,
  xOffset: 0
}, cp = ae(lp), dp = {
  name: "PlusCircleIcon",
  height: 512,
  width: 512,
  svgPath: "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z",
  yOffset: 0,
  xOffset: 0
}, up = ae(dp), fp = (e) => {
  var { items: t, isDisabled: n, rowData: r, extraData: a, actionsToggle: i, popperProps: o = {
    position: "end",
    direction: "down"
  }, innerRef: l, firstActionItemRef: c, isOnOpenChangeDisabled: d = !1 } = e, u = P(e, ["items", "isDisabled", "rowData", "extraData", "actionsToggle", "popperProps", "innerRef", "firstActionItemRef", "isOnOpenChangeDisabled"]);
  const [f, p] = s.useState(!1), h = () => {
    p(!f);
  }, v = (m, x) => {
    x && (m.preventDefault(), x(m, a && a.rowIndex, r, a));
  };
  return s.createElement(
    s.Fragment,
    null,
    t.filter((m) => m.isOutsideDropdown).map((m, x) => {
      var { title: _, itemKey: y, onClick: I, isOutsideDropdown: N } = m, R = P(m, ["title", "itemKey", "onClick", "isOutsideDropdown"]);
      return typeof _ == "string" ? s.createElement(oe, Object.assign({ onClick: (L) => v(L, I) }, R, { isDisabled: n, key: y || `outside_dropdown_${x}`, "data-key": y || `outside_dropdown_${x}` }), _) : s.cloneElement(_, Object.assign({ onClick: I, isDisabled: n }, R));
    }),
    s.createElement(
      _i,
      Object.assign({ isOpen: f, onOpenChange: d ? void 0 : (m) => p(m), toggle: (m) => i ? i({ onToggle: h, isOpen: f, isDisabled: n, toggleRef: m }) : s.createElement(
        On,
        { "aria-label": "Kebab toggle", ref: m, onClick: h, isExpanded: f, isDisabled: n, variant: "plain" },
        s.createElement(ap, null)
      ) }, r && r.actionProps, { ref: l }, u, { popperProps: o }),
      s.createElement(Zl, null, t.filter((m) => !m.isOutsideDropdown).map((m, x) => {
        var { title: _, itemKey: y, onClick: I, tooltipProps: N, isSeparator: R, shouldCloseOnClick: L = !0 } = m, O = P(m, ["title", "itemKey", "onClick", "tooltipProps", "isSeparator", "shouldCloseOnClick"]);
        if (R)
          return s.createElement(Jl, { key: y || x, "data-key": y || x });
        const w = s.createElement(Ci, Object.assign({ onClick: (j) => {
          v(j, I), L && h();
        } }, O, { key: y || x, "data-key": y || x, ref: x === 0 ? c : void 0 }), _);
        return N != null && N.content ? s.createElement(qe, Object.assign({ key: y || x }, N), w) : w;
      }))
    )
  );
}, lc = s.forwardRef((e, t) => s.createElement(fp, Object.assign({}, e, { innerRef: t })));
lc.displayName = "ActionsColumn";
const B = {
  modifiers: {
    hidden: "pf-m-hidden",
    hiddenOnSm: "pf-m-hidden-on-sm",
    visibleOnSm: "pf-m-visible-on-sm",
    hiddenOnMd: "pf-m-hidden-on-md",
    visibleOnMd: "pf-m-visible-on-md",
    hiddenOnLg: "pf-m-hidden-on-lg",
    visibleOnLg: "pf-m-visible-on-lg",
    hiddenOnXl: "pf-m-hidden-on-xl",
    visibleOnXl: "pf-m-visible-on-xl",
    hiddenOn_2xl: "pf-m-hidden-on-2xl",
    visibleOn_2xl: "pf-m-visible-on-2xl",
    fixed: "pf-m-fixed",
    stickyHeader: "pf-m-sticky-header",
    nestedColumnHeader: "pf-m-nested-column-header",
    borderRow: "pf-m-border-row",
    striped: "pf-m-striped",
    expandable: "pf-m-expandable",
    stripedEven: "pf-m-striped-even",
    ghostRow: "pf-m-ghost-row",
    center: "pf-m-center",
    help: "pf-m-help",
    favorite: "pf-m-favorite",
    borderRight: "pf-m-border-right",
    borderLeft: "pf-m-border-left",
    expanded: "pf-m-expanded",
    truncate: "pf-m-truncate",
    wrap: "pf-m-wrap",
    nowrap: "pf-m-nowrap",
    fitContent: "pf-m-fit-content",
    breakWord: "pf-m-break-word",
    noBorderRows: "pf-m-no-border-rows",
    clickable: "pf-m-clickable",
    selected: "pf-m-selected",
    firstCellOffsetReset: "pf-m-first-cell-offset-reset",
    dragOver: "pf-m-drag-over",
    standalone: "pf-m-standalone",
    favorited: "pf-m-favorited",
    noPadding: "pf-m-no-padding",
    compact: "pf-m-compact",
    width_10: "pf-m-width-10",
    width_15: "pf-m-width-15",
    width_20: "pf-m-width-20",
    width_25: "pf-m-width-25",
    width_30: "pf-m-width-30",
    width_35: "pf-m-width-35",
    width_40: "pf-m-width-40",
    width_45: "pf-m-width-45",
    width_50: "pf-m-width-50",
    width_60: "pf-m-width-60",
    width_70: "pf-m-width-70",
    width_80: "pf-m-width-80",
    width_90: "pf-m-width-90",
    width_100: "pf-m-width-100"
  },
  table: "pf-v5-c-table",
  tableAction: "pf-v5-c-table__action",
  tableButton: "pf-v5-c-table__button",
  tableButtonContent: "pf-v5-c-table__button-content",
  tableCheck: "pf-v5-c-table__check",
  tableColumnHelp: "pf-v5-c-table__column-help",
  tableColumnHelpAction: "pf-v5-c-table__column-help-action",
  tableCompoundExpansionToggle: "pf-v5-c-table__compound-expansion-toggle",
  tableControlRow: "pf-v5-c-table__control-row",
  tableDraggable: "pf-v5-c-table__draggable",
  tableExpandableRow: "pf-v5-c-table__expandable-row",
  tableFavorite: "pf-v5-c-table__favorite",
  tableSort: "pf-v5-c-table__sort",
  tableSortIndicator: "pf-v5-c-table__sort-indicator",
  tableSubhead: "pf-v5-c-table__subhead",
  tableTbody: "pf-v5-c-table__tbody",
  tableTd: "pf-v5-c-table__td",
  tableText: "pf-v5-c-table__text",
  tableTh: "pf-v5-c-table__th",
  tableThead: "pf-v5-c-table__thead",
  tableToggle: "pf-v5-c-table__toggle",
  tableToggleIcon: "pf-v5-c-table__toggle-icon",
  tableTr: "pf-v5-c-table__tr"
}, cc = (e) => {
  var { className: t = "", children: n = null, isOpen: r, onToggle: a } = e, i = P(e, ["className", "children", "isOpen", "onToggle"]);
  return s.createElement(
    s.Fragment,
    null,
    r !== void 0 && s.createElement(
      oe,
      Object.assign({ className: g(t, r && B.modifiers.expanded) }, i, { variant: "plain", "aria-label": i["aria-label"] || "Details", onClick: a, "aria-expanded": r }),
      s.createElement(
        "div",
        { className: g(B.tableToggleIcon) },
        s.createElement(Ql, null)
      )
    ),
    n
  );
};
cc.displayName = "CollapseColumn";
const dc = (e) => {
  var { className: t, onClick: n, "aria-label": r, id: a } = e, i = P(e, ["className", "onClick", "aria-label", "id"]);
  return s.createElement(
    oe,
    Object.assign({ id: a, variant: "plain", className: t, type: "button", "aria-label": r || "Draggable row draggable button", onClick: n }, i),
    s.createElement(Ff, { "aria-hidden": !0 })
  );
};
dc.displayName = "DraggableCell";
const pp = {
  modifiers: {
    inlineEditable: "pf-m-inline-editable"
  }
};
var io;
(function(e) {
  e.div = "div", e.nav = "nav";
})(io || (io = {}));
var oo;
(function(e) {
  e.wrap = "wrap", e.nowrap = "nowrap", e.truncate = "truncate", e.breakWord = "breakWord", e.fitContent = "fitContent";
})(oo || (oo = {}));
const Rn = (e) => {
  var { children: t = null, className: n = "", variant: r = "span", wrapModifier: a = null, tooltip: i = "", tooltipProps: o = {}, onMouseEnter: l = () => {
  }, focused: c = !1, tooltipHasDefaultBehavior: d = !1 } = e, u = P(e, ["children", "className", "variant", "wrapModifier", "tooltip", "tooltipProps", "onMouseEnter", "focused", "tooltipHasDefaultBehavior"]);
  const f = r, p = s.createRef(), [h, v] = s.useState(i), m = (y) => {
    y.target.offsetWidth < y.target.scrollWidth ? v(i || y.target.innerText) : v(""), l(y);
  }, x = (y) => {
    y.offsetWidth < y.scrollWidth ? v(i || y.innerText) : v("");
  }, _ = s.createElement(f, Object.assign({ ref: p, onMouseEnter: d ? void 0 : m, className: g(n, a && B.modifiers[a], B.tableText) }, u), t);
  return s.useEffect(() => {
    d || (c ? x(p.current) : v(""));
  }, [c, d]), h !== "" ? s.createElement(qe, Object.assign({ triggerRef: p, content: h }, !d && { isVisible: !0 }, o), _) : _;
};
Rn.displayName = "TableText";
const ei = ({ children: e, info: t, className: n, variant: r = "tooltip", popoverProps: a, tooltipProps: i, ariaLabel: o }) => s.createElement(
  "div",
  { className: g(B.tableColumnHelp, n) },
  typeof e == "string" ? s.createElement(Rn, null, e) : e,
  s.createElement("span", { className: g(B.tableColumnHelpAction) }, r === "tooltip" ? s.createElement(
    qe,
    Object.assign({ content: t }, i),
    s.createElement(
      oe,
      { variant: "plain", "aria-label": o || typeof t == "string" && t || "More info" },
      s.createElement(ao, null)
    )
  ) : s.createElement(
    Yl,
    Object.assign({ bodyContent: t }, a),
    s.createElement(
      oe,
      { variant: "plain", "aria-label": o || typeof t == "string" && t || "More info" },
      s.createElement(ao, null)
    )
  ))
);
ei.displayName = "HeaderCellInfoWrapper";
const mp = {
  modifiers: {
    grid: "pf-m-grid",
    compact: "pf-m-compact",
    expanded: "pf-m-expanded",
    selected: "pf-m-selected",
    noPadding: "pf-m-no-padding",
    hoverable: "pf-m-hoverable",
    nowrap: "pf-m-nowrap",
    fitContent: "pf-m-fit-content",
    truncate: "pf-m-truncate",
    gridMd: "pf-m-grid-md",
    gridLg: "pf-m-grid-lg",
    gridXl: "pf-m-grid-xl",
    grid_2xl: "pf-m-grid-2xl"
  }
}, we = {
  modifiers: {
    treeView: "pf-m-tree-view",
    noInset: "pf-m-no-inset",
    treeViewGrid: "pf-m-tree-view-grid",
    treeViewDetailsExpanded: "pf-m-tree-view-details-expanded",
    treeViewGridMd: "pf-m-tree-view-grid-md",
    treeViewGridLg: "pf-m-tree-view-grid-lg",
    treeViewGridXl: "pf-m-tree-view-grid-xl",
    treeViewGrid_2xl: "pf-m-tree-view-grid-2xl"
  },
  tableCheck: "pf-v5-c-table__check",
  tableToggle: "pf-v5-c-table__toggle",
  tableToggleIcon: "pf-v5-c-table__toggle-icon",
  tableTreeViewDetailsToggle: "pf-v5-c-table__tree-view-details-toggle",
  tableTreeViewIcon: "pf-v5-c-table__tree-view-icon",
  tableTreeViewMain: "pf-v5-c-table__tree-view-main",
  tableTreeViewText: "pf-v5-c-table__tree-view-text",
  tableTreeViewTitleCell: "pf-v5-c-table__tree-view-title-cell"
};
var ti;
(function(e) {
  e.radio = "radio", e.checkbox = "checkbox";
})(ti || (ti = {}));
const uc = (e) => {
  var {
    children: t = null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    className: n,
    onSelect: r = null,
    selectVariant: a,
    tooltip: i,
    tooltipProps: o
  } = e, l = P(e, ["children", "className", "onSelect", "selectVariant", "tooltip", "tooltipProps"]);
  const c = s.createRef(), d = s.createElement(
    s.Fragment,
    null,
    s.createElement(
      "label",
      null,
      s.createElement("input", Object.assign({}, l, { ref: c, type: a, onChange: r }))
    ),
    t
  );
  return i ? s.createElement(qe, Object.assign({ triggerRef: c, content: i }, o), d) : d;
};
uc.displayName = "SelectColumn";
const fc = (e, { rowIndex: t, columnIndex: n, rowData: r, column: a, property: i, tooltip: o }) => {
  const { extraParams: { onSelect: l, selectVariant: c, allRowsSelected: d, isHeaderSelectDisabled: u } } = a, f = {
    rowIndex: t,
    columnIndex: n,
    column: a,
    property: i
  };
  if (r && r.hasOwnProperty("parent") && !r.showSelect && !r.fullWidth)
    return {
      component: "td",
      isVisible: !0
    };
  const p = t !== void 0 ? t : -1;
  function h(x) {
    const _ = t === void 0 ? x.currentTarget.checked : r && !r.selected;
    l && l(x, _, p, r, f);
  }
  const v = Object.assign(Object.assign(Object.assign({}, p !== -1 ? {
    checked: r && !!r.selected,
    "aria-label": `Select row ${t}`
  } : {
    checked: d,
    "aria-label": "Select all rows"
  }), r && (r.disableCheckbox || r.disableSelection) && {
    disabled: !0,
    className: Ge.checkInput
  }), !r && u && { disabled: !0 });
  let m = "check-all";
  return p !== -1 && c === ti.checkbox ? m = `checkrow${t}` : p !== -1 && (m = "radioGroup"), {
    className: g(B.tableCheck),
    component: p !== -1 ? "td" : "th",
    isVisible: !r || !r.fullWidth,
    children: s.createElement(uc, Object.assign({}, v, { selectVariant: c, onSelect: h, name: m, tooltip: o }), e)
  };
};
var ct;
(function(e) {
  e.asc = "asc", e.desc = "desc";
})(ct || (ct = {}));
const pc = (e) => {
  var { children: t = null, className: n = "", isSortedBy: r = !1, onSort: a = null, sortDirection: i = "", type: o = "button", tooltip: l, tooltipProps: c, tooltipHasDefaultBehavior: d } = e, u = P(e, ["children", "className", "isSortedBy", "onSort", "sortDirection", "type", "tooltip", "tooltipProps", "tooltipHasDefaultBehavior"]);
  let f;
  const [p, h] = s.useState(!1);
  return r ? f = i === ct.asc ? cp : sp : f = ep, s.createElement(
    "button",
    Object.assign({}, u, { type: o, className: g(n, B.tableButton), onClick: (v) => a && a(v), onFocus: () => h(!0), onBlur: () => h(!1) }),
    s.createElement(
      "div",
      { className: g(n, B.tableButtonContent) },
      s.createElement(Rn, { tooltip: l, tooltipProps: c, tooltipHasDefaultBehavior: d, focused: p }, t),
      s.createElement(
        "span",
        { className: g(B.tableSortIndicator) },
        s.createElement(f, null)
      )
    )
  );
};
pc.displayName = "SortColumn";
const hp = (e) => () => mc(s.createElement(xi, { "aria-hidden": !0 }), {
  columnIndex: e.columnIndex,
  className: B.modifiers.favorite,
  ariaLabel: "Sort favorites",
  column: {
    extraParams: {
      sortBy: e.sortBy,
      onSort: e == null ? void 0 : e.onSort
    }
  },
  tooltip: e.tooltip,
  tooltipProps: e.tooltipProps,
  tooltipHasDefaultBehavior: !0
}), mc = (e, { columnIndex: t, column: n, property: r, className: a, ariaLabel: i, tooltip: o, tooltipProps: l, tooltipHasDefaultBehavior: c }) => {
  const { extraParams: { sortBy: d, onSort: u } } = n, f = {
    columnIndex: t,
    column: n,
    property: r
  }, p = d && t === d.index;
  function h(v) {
    let m;
    p ? m = d.direction === ct.asc ? ct.desc : ct.asc : m = d.defaultDirection ? d.defaultDirection : ct.asc, u && u(v, t, m, f);
  }
  return Object.assign(Object.assign({ className: g(B.tableSort, p && B.modifiers.selected, a) }, p && { "aria-sort": `${d.direction}ending` }), { children: s.createElement(pc, { isSortedBy: p, sortDirection: p ? d.direction : "", onSort: h, "aria-label": i, tooltip: o, tooltipProps: l, tooltipHasDefaultBehavior: c }, e) });
}, so = (e, t, n, r) => t, bp = (e, t, n) => (r, { rowData: a, column: i, rowIndex: o, columnIndex: l, column: { extraParams: { actionsToggle: c, actionsPopperProps: d } }, property: u }) => {
  const f = {
    rowIndex: o,
    columnIndex: l,
    column: i,
    property: u
  }, p = so(t, e), h = so(n, a && a.disableActions), v = p && p.length > 0 ? {
    children: s.createElement(lc, { items: p, isDisabled: h, rowData: a, extraData: f, actionsToggle: c, popperProps: d }, r)
  } : {};
  return Object.assign({ className: g(B.tableAction), style: { paddingRight: 0 }, isVisible: !0 }, v);
}, gp = (e) => e.toUpperCase().replace("-", "").replace("_", ""), lo = (e) => e.replace(/([-_][a-z])/gi, gp);
function vp(e) {
  return e[0].toUpperCase() + e.substring(1);
}
const hc = (e) => () => ({
  className: g(B.modifiers[typeof e == "number" ? `width_${e}` : `width${vp(e)}`])
}), bc = (e, { rowIndex: t, columnIndex: n, rowData: r, column: a, property: i }) => {
  const { extraParams: { onCollapse: o, rowLabeledBy: l = "simple-node", expandId: c = "expand-toggle", allRowsExpanded: d, collapseAllAriaLabel: u } } = a, f = {
    rowIndex: t,
    columnIndex: n,
    column: a,
    property: i
  }, p = t !== void 0 ? t : -1, h = Object.assign({}, p !== -1 ? {
    isOpen: r == null ? void 0 : r.isOpen,
    "aria-labelledby": `${l}${p} ${c}${p}`
  } : {
    isOpen: d,
    "aria-label": u || "Expand all rows"
  });
  function v(m) {
    const x = r ? !r.isOpen : !d;
    o && o(m, t, x, r, f);
  }
  return {
    className: ((r == null ? void 0 : r.isOpen) !== void 0 || p === -1) && g(B.tableToggle),
    isVisible: !(r != null && r.fullWidth),
    children: s.createElement(cc, Object.assign({ "aria-labelledby": `${l}${p} ${c}${p}`, onToggle: v, id: c + p }, h), e)
  };
}, yp = (e, { rowIndex: t, columnIndex: n, rowData: r, column: a, property: i }) => {
  if (!e)
    return null;
  const { title: o, props: l } = e, { extraParams: { onExpand: c, expandId: d = "expand-toggle" } } = a, u = {
    rowIndex: t,
    columnIndex: n,
    column: a,
    property: i
  };
  function f(p) {
    c && c(p, t, n, l.isOpen, r, u);
  }
  return {
    className: g(B.tableCompoundExpansionToggle, l.isOpen && B.modifiers.expanded),
    children: l.isOpen !== void 0 && s.createElement(
      "button",
      { type: "button", className: g(B.tableButton), onClick: f, "aria-expanded": l.isOpen, "aria-controls": l.ariaControls, id: `${d}-${t}-${n}` },
      s.createElement(Rn, null, o)
    )
  };
}, xp = [
  "hidden",
  "hiddenOnSm",
  "hiddenOnMd",
  "hiddenOnLg",
  "hiddenOnXl",
  "hiddenOn_2xl",
  "visibleOnSm",
  "visibleOnMd",
  "visibleOnLg",
  "visibleOnXl",
  "visibleOn_2xl"
], gc = xp.filter((e) => B.modifiers[e]).reduce((e, t) => {
  const n = t.replace("_2xl", "2Xl");
  return e[n] = B.modifiers[t], e;
}, {}), vc = (...e) => () => ({
  className: g(...e)
}), Ep = ({ tooltip: e, tooltipProps: t, popover: n, popoverProps: r, className: a, ariaLabel: i }) => (l) => ({
  className: B.modifiers.help,
  children: e ? s.createElement(ei, { variant: "tooltip", info: e, tooltipProps: t, ariaLabel: i, className: a }, l) : s.createElement(ei, { variant: "popover", info: n, popoverProps: r, ariaLabel: i, className: a }, l)
}), yc = (e) => {
  var { className: t = "", onFavorite: n, isFavorited: r, rowIndex: a } = e, i = P(e, ["className", "onFavorite", "isFavorited", "rowIndex"]);
  const o = a === void 0 ? {} : {
    id: `favorites-button-${a}`,
    "aria-labelledby": `favorites-button-${a}`
  };
  return s.createElement(
    oe,
    Object.assign({ variant: "plain", className: t, type: "button", "aria-label": r ? "Starred" : "Not starred", onClick: n }, o, i),
    s.createElement(xi, { "aria-hidden": !0 })
  );
};
yc.displayName = "FavoritesCell";
const _p = (e, { rowIndex: t, columnIndex: n, rowData: r, column: a, property: i }) => {
  const { extraParams: { onFavorite: o } } = a, l = {
    rowIndex: t,
    columnIndex: n,
    column: a,
    property: i
  };
  if (r && r.hasOwnProperty("parent") && !r.fullWidth)
    return {
      component: "td",
      isVisible: !0
    };
  function c(u) {
    o && o(u, r && !r.favorited, t, r, l);
  }
  const d = r.favoritesProps || {};
  return {
    className: g(B.tableFavorite, r && r.favorited && B.modifiers.favorited),
    isVisible: !r || !r.fullWidth,
    children: s.createElement(yc, Object.assign({ rowIndex: t, onFavorite: c, isFavorited: r && r.favorited }, d))
  };
}, Cp = (e, t, n) => (r, { rowIndex: a, rowData: i }) => {
  const { isExpanded: o, isDetailsExpanded: l, "aria-level": c, "aria-setsize": d, toggleAriaLabel: u, checkAriaLabel: f, showDetailsAriaLabel: p, isChecked: h, checkboxId: v, icon: m } = i.props, x = r.title || r, _ = s.createElement(
    "div",
    { className: g(we.tableTreeViewText), key: "tree-view-text" },
    m && s.createElement("span", { className: g(we.tableTreeViewIcon), key: "tree-view-text-icon" }, m),
    s.createElement("span", { className: B.tableText, key: "table-text" }, x)
  ), y = (I, N) => {
    t(N, I, a, x, i);
  };
  return {
    component: "th",
    className: we.tableTreeViewTitleCell,
    children: c !== void 0 ? s.createElement(
      "div",
      { className: g(we.tableTreeViewMain) },
      d > 0 && s.createElement(
        "span",
        { className: g(we.tableToggle), key: "table-toggle" },
        s.createElement(
          oe,
          { variant: "plain", onClick: (I) => e && e(I, a, x, i), className: g(o && B.modifiers.expanded), "aria-expanded": o, "aria-label": u || `${o ? "Collapse" : "Expand"} row ${a}` },
          s.createElement(
            "div",
            { className: g(we.tableToggleIcon) },
            s.createElement(Ql, { "aria-hidden": "true" })
          )
        )
      ),
      !!t && s.createElement(
        "span",
        { className: g(we.tableCheck), key: "table-check" },
        s.createElement(
          "label",
          { htmlFor: v || `checkbox_${a}` },
          s.createElement(ft, { id: v || `checkbox_${a}`, "aria-label": f || `Row ${a} checkbox`, isChecked: h, onChange: (I, N) => y(N, I) })
        )
      ),
      _,
      !!n && s.createElement(
        "span",
        { className: g(we.tableTreeViewDetailsToggle), key: "view-details-toggle" },
        s.createElement(
          oe,
          { variant: "plain", "aria-expanded": l, "aria-label": p || "Show row details", onClick: (I) => n && n(I, a, x, i) },
          s.createElement(
            "span",
            { className: `${B.table}__details-toggle-icon` },
            s.createElement(np, { "aria-hidden": !0 })
          )
        )
      )
    ) : _
  };
};
var ni;
(function(e) {
  e.none = "", e.grid = "grid", e.gridMd = "grid-md", e.gridLg = "grid-lg", e.gridXl = "grid-xl", e.grid2xl = "grid-2xl";
})(ni || (ni = {}));
var co;
(function(e) {
  e.compact = "compact";
})(co || (co = {}));
const xc = s.createContext({
  registerSelectableRow: () => {
  }
}), wp = (e) => {
  var t, n, {
    children: r,
    className: a,
    variant: i,
    borders: o = !0,
    isStickyHeader: l = !1,
    gridBreakPoint: c = ni.gridMd,
    "aria-label": d,
    role: u = "grid",
    innerRef: f,
    ouiaId: p,
    ouiaSafe: h = !0,
    isTreeTable: v = !1,
    isNested: m = !1,
    isStriped: x = !1,
    isExpandable: _ = !1,
    hasNoInset: y = !1,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nestedHeaderColumnSpans: I,
    selectableRowCaptionText: N
  } = e, R = P(e, ["children", "className", "variant", "borders", "isStickyHeader", "gridBreakPoint", "aria-label", "role", "innerRef", "ouiaId", "ouiaSafe", "isTreeTable", "isNested", "isStriped", "isExpandable", "hasNoInset", "nestedHeaderColumnSpans", "selectableRowCaptionText"]);
  const L = s.useRef(null), O = f || L, [w, j] = s.useState(!1), [k, C] = s.useState();
  s.useEffect(() => {
    if (document.addEventListener("keydown", A), O && O.current && O.current.classList.contains("pf-m-tree-view")) {
      const M = O.current.querySelector("tbody");
      M && Qu(Array.from(M.querySelectorAll("button, a, input")));
    }
    return function() {
      document.removeEventListener("keydown", A);
    };
  }, [O, O.current]), s.useEffect(() => {
    C(N ? s.createElement(
      "caption",
      null,
      N,
      s.createElement("div", { className: "pf-v5-screen-reader" }, "This table has selectable rows. It can be navigated by row using tab, and each row can be selected using space or enter.")
    ) : s.createElement("caption", { className: "pf-v5-screen-reader" }, "This table has selectable rows. It can be navigated by row using tab, and each row can be selected using space or enter."));
  }, [N]);
  const S = mt("Table", p, h), b = (t = mp.modifiers) === null || t === void 0 ? void 0 : t[lo(c || "").replace(/-?2xl/, "_2xl")], E = `treeView${c.charAt(0).toUpperCase() + c.slice(1)}`, T = (n = we.modifiers) === null || n === void 0 ? void 0 : n[lo(E || "").replace(/-?2xl/, "_2xl")], A = (M) => {
    if (m || !(O && O.current && O.current.classList.contains(we.modifiers.treeView)) || // implements roving tab-index to tree tables only
    O && O.current !== M.target.closest(`.${B.table}:not(.pf-m-nested)`))
      return;
    const D = document.activeElement, q = M.key, z = Array.from(O.current.querySelectorAll("tbody tr")).filter((W) => !W.classList.contains("pf-m-disabled") && !W.hidden);
    (q === "Space" || q === "Enter") && (D.click(), M.preventDefault()), yl(M, z, (W) => W === D.closest("tr"), (W) => W.querySelectorAll("button:not(:disabled), input:not(:disabled), a:not(:disabled)")[0], ["button", "input", "a"], void 0, !1, !0, !1);
  }, F = () => {
    !w && j(!0);
  };
  return s.createElement(
    xc.Provider,
    { value: { registerSelectableRow: F } },
    s.createElement(
      "table",
      Object.assign({ "aria-label": d, role: u, className: g(a, B.table, v ? T : b, B.modifiers[i], !o && B.modifiers.noBorderRows, l && B.modifiers.stickyHeader, v && we.modifiers.treeView, x && B.modifiers.striped, _ && B.modifiers.expandable, y && we.modifiers.noInset, m && "pf-m-nested"), ref: O }, v && { role: "treegrid" }, S, R),
      w && k,
      r
    )
  );
}, Ec = s.forwardRef((e, t) => s.createElement(wp, Object.assign({}, e, { innerRef: t })));
Ec.displayName = "Table";
const Op = (e) => {
  var { children: t, className: n, isExpanded: r, isEditable: a, isHidden: i = !1, isClickable: o = !1, isRowSelected: l = !1, isStriped: c = !1, isBorderRow: d = !1, isControlRow: u = !1, innerRef: f, ouiaId: p, ouiaSafe: h = !0, resetOffset: v = !1, onRowClick: m, isSelectable: x, "aria-label": _ } = e, y = P(e, ["children", "className", "isExpanded", "isEditable", "isHidden", "isClickable", "isRowSelected", "isStriped", "isBorderRow", "isControlRow", "innerRef", "ouiaId", "ouiaSafe", "resetOffset", "onRowClick", "isSelectable", "aria-label"]);
  const I = mt("TableRow", p, h), [N, R] = s.useState("");
  let L = null;
  m && (L = (k) => {
    (k.key === "Enter" || k.key === " ") && (m(k), k.preventDefault());
  });
  const O = i || r !== void 0 && !r, { registerSelectableRow: w } = s.useContext(xc);
  s.useEffect(() => {
    x && !O ? (R(`${l ? "Row selected" : ""}`), w()) : R(void 0);
  }, [l, x, w, O]);
  const j = _ || N;
  return s.createElement(
    s.Fragment,
    null,
    s.createElement("tr", Object.assign({ className: g(B.tableTr, n, r !== void 0 && B.tableExpandableRow, r && B.modifiers.expanded, a && pp.modifiers.inlineEditable, o && B.modifiers.clickable, l && B.modifiers.selected, c && B.modifiers.striped, d && B.modifiers.borderRow, u && B.tableControlRow, v && B.modifiers.firstCellOffsetReset), hidden: O }, o && { tabIndex: 0 }, { "aria-label": j, ref: f }, m && { onClick: m, onKeyDown: L }, I, y), t)
  );
}, ri = s.forwardRef((e, t) => s.createElement(Op, Object.assign({}, e, { innerRef: t })));
ri.displayName = "Tr";
const Ip = (e) => {
  var { children: t, className: n, noWrap: r = !1, innerRef: a, hasNestedHeader: i } = e, o = P(e, ["children", "className", "noWrap", "innerRef", "hasNestedHeader"]);
  return s.createElement("thead", Object.assign({ className: g(B.tableThead, n, r && B.modifiers.nowrap, i && B.modifiers.nestedColumnHeader), ref: a }, o), t);
}, _c = s.forwardRef((e, t) => s.createElement(Ip, Object.assign({}, e, { innerRef: t })));
_c.displayName = "Thead";
const Tp = (e) => {
  var { children: t, className: n, isExpanded: r, innerRef: a, isEvenStriped: i = !1, isOddStriped: o = !1 } = e, l = P(e, ["children", "className", "isExpanded", "innerRef", "isEvenStriped", "isOddStriped"]);
  return s.createElement("tbody", Object.assign({ role: "rowgroup", className: g(B.tableTbody, n, r && B.modifiers.expanded, o && B.modifiers.striped, i && B.modifiers.stripedEven), ref: a }, l), t);
}, Cc = s.forwardRef((e, t) => s.createElement(Tp, Object.assign({}, e, { innerRef: t })));
Cc.displayName = "Tbody";
const wt = {
  modifiers: {
    borderRight: "pf-m-border-right",
    borderLeft: "pf-m-border-left"
  },
  tableStickyCell: "pf-v5-c-table__sticky-cell"
};
var Yn, uo;
function Np() {
  if (uo) return Yn;
  uo = 1;
  function e() {
    this.__data__ = [], this.size = 0;
  }
  return Yn = e, Yn;
}
var Jn, fo;
function Ln() {
  if (fo) return Jn;
  fo = 1;
  function e(t, n) {
    return t === n || t !== t && n !== n;
  }
  return Jn = e, Jn;
}
var Zn, po;
function Pn() {
  if (po) return Zn;
  po = 1;
  var e = Ln();
  function t(n, r) {
    for (var a = n.length; a--; )
      if (e(n[a][0], r))
        return a;
    return -1;
  }
  return Zn = t, Zn;
}
var Qn, mo;
function Sp() {
  if (mo) return Qn;
  mo = 1;
  var e = Pn(), t = Array.prototype, n = t.splice;
  function r(a) {
    var i = this.__data__, o = e(i, a);
    if (o < 0)
      return !1;
    var l = i.length - 1;
    return o == l ? i.pop() : n.call(i, o, 1), --this.size, !0;
  }
  return Qn = r, Qn;
}
var er, ho;
function kp() {
  if (ho) return er;
  ho = 1;
  var e = Pn();
  function t(n) {
    var r = this.__data__, a = e(r, n);
    return a < 0 ? void 0 : r[a][1];
  }
  return er = t, er;
}
var tr, bo;
function Rp() {
  if (bo) return tr;
  bo = 1;
  var e = Pn();
  function t(n) {
    return e(this.__data__, n) > -1;
  }
  return tr = t, tr;
}
var nr, go;
function Lp() {
  if (go) return nr;
  go = 1;
  var e = Pn();
  function t(n, r) {
    var a = this.__data__, i = e(a, n);
    return i < 0 ? (++this.size, a.push([n, r])) : a[i][1] = r, this;
  }
  return nr = t, nr;
}
var rr, vo;
function An() {
  if (vo) return rr;
  vo = 1;
  var e = Np(), t = Sp(), n = kp(), r = Rp(), a = Lp();
  function i(o) {
    var l = -1, c = o == null ? 0 : o.length;
    for (this.clear(); ++l < c; ) {
      var d = o[l];
      this.set(d[0], d[1]);
    }
  }
  return i.prototype.clear = e, i.prototype.delete = t, i.prototype.get = n, i.prototype.has = r, i.prototype.set = a, rr = i, rr;
}
var ar, yo;
function Pp() {
  if (yo) return ar;
  yo = 1;
  var e = An();
  function t() {
    this.__data__ = new e(), this.size = 0;
  }
  return ar = t, ar;
}
var ir, xo;
function Ap() {
  if (xo) return ir;
  xo = 1;
  function e(t) {
    var n = this.__data__, r = n.delete(t);
    return this.size = n.size, r;
  }
  return ir = e, ir;
}
var or, Eo;
function Mp() {
  if (Eo) return or;
  Eo = 1;
  function e(t) {
    return this.__data__.get(t);
  }
  return or = e, or;
}
var sr, _o;
function Dp() {
  if (_o) return sr;
  _o = 1;
  function e(t) {
    return this.__data__.has(t);
  }
  return sr = e, sr;
}
var lr, Co;
function wc() {
  if (Co) return lr;
  Co = 1;
  var e = typeof ln == "object" && ln && ln.Object === Object && ln;
  return lr = e, lr;
}
var cr, wo;
function Nt() {
  if (wo) return cr;
  wo = 1;
  var e = wc(), t = typeof self == "object" && self && self.Object === Object && self, n = e || t || Function("return this")();
  return cr = n, cr;
}
var dr, Oo;
function Oc() {
  if (Oo) return dr;
  Oo = 1;
  var e = Nt(), t = e.Symbol;
  return dr = t, dr;
}
var ur, Io;
function jp() {
  if (Io) return ur;
  Io = 1;
  var e = Oc(), t = Object.prototype, n = t.hasOwnProperty, r = t.toString, a = e ? e.toStringTag : void 0;
  function i(o) {
    var l = n.call(o, a), c = o[a];
    try {
      o[a] = void 0;
      var d = !0;
    } catch {
    }
    var u = r.call(o);
    return d && (l ? o[a] = c : delete o[a]), u;
  }
  return ur = i, ur;
}
var fr, To;
function Fp() {
  if (To) return fr;
  To = 1;
  var e = Object.prototype, t = e.toString;
  function n(r) {
    return t.call(r);
  }
  return fr = n, fr;
}
var pr, No;
function Mn() {
  if (No) return pr;
  No = 1;
  var e = Oc(), t = jp(), n = Fp(), r = "[object Null]", a = "[object Undefined]", i = e ? e.toStringTag : void 0;
  function o(l) {
    return l == null ? l === void 0 ? a : r : i && i in Object(l) ? t(l) : n(l);
  }
  return pr = o, pr;
}
var mr, So;
function bt() {
  if (So) return mr;
  So = 1;
  function e(t) {
    var n = typeof t;
    return t != null && (n == "object" || n == "function");
  }
  return mr = e, mr;
}
var hr, ko;
function Oi() {
  if (ko) return hr;
  ko = 1;
  var e = Mn(), t = bt(), n = "[object AsyncFunction]", r = "[object Function]", a = "[object GeneratorFunction]", i = "[object Proxy]";
  function o(l) {
    if (!t(l))
      return !1;
    var c = e(l);
    return c == r || c == a || c == n || c == i;
  }
  return hr = o, hr;
}
var br, Ro;
function Bp() {
  if (Ro) return br;
  Ro = 1;
  var e = Nt(), t = e["__core-js_shared__"];
  return br = t, br;
}
var gr, Lo;
function qp() {
  if (Lo) return gr;
  Lo = 1;
  var e = Bp(), t = (function() {
    var r = /[^.]+$/.exec(e && e.keys && e.keys.IE_PROTO || "");
    return r ? "Symbol(src)_1." + r : "";
  })();
  function n(r) {
    return !!t && t in r;
  }
  return gr = n, gr;
}
var vr, Po;
function Hp() {
  if (Po) return vr;
  Po = 1;
  var e = Function.prototype, t = e.toString;
  function n(r) {
    if (r != null) {
      try {
        return t.call(r);
      } catch {
      }
      try {
        return r + "";
      } catch {
      }
    }
    return "";
  }
  return vr = n, vr;
}
var yr, Ao;
function $p() {
  if (Ao) return yr;
  Ao = 1;
  var e = Oi(), t = qp(), n = bt(), r = Hp(), a = /[\\^$.*+?()[\]{}|]/g, i = /^\[object .+?Constructor\]$/, o = Function.prototype, l = Object.prototype, c = o.toString, d = l.hasOwnProperty, u = RegExp(
    "^" + c.call(d).replace(a, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  );
  function f(p) {
    if (!n(p) || t(p))
      return !1;
    var h = e(p) ? u : i;
    return h.test(r(p));
  }
  return yr = f, yr;
}
var xr, Mo;
function Vp() {
  if (Mo) return xr;
  Mo = 1;
  function e(t, n) {
    return t == null ? void 0 : t[n];
  }
  return xr = e, xr;
}
var Er, Do;
function Ii() {
  if (Do) return Er;
  Do = 1;
  var e = $p(), t = Vp();
  function n(r, a) {
    var i = t(r, a);
    return e(i) ? i : void 0;
  }
  return Er = n, Er;
}
var _r, jo;
function Ic() {
  if (jo) return _r;
  jo = 1;
  var e = Ii(), t = Nt(), n = e(t, "Map");
  return _r = n, _r;
}
var Cr, Fo;
function Dn() {
  if (Fo) return Cr;
  Fo = 1;
  var e = Ii(), t = e(Object, "create");
  return Cr = t, Cr;
}
var wr, Bo;
function Wp() {
  if (Bo) return wr;
  Bo = 1;
  var e = Dn();
  function t() {
    this.__data__ = e ? e(null) : {}, this.size = 0;
  }
  return wr = t, wr;
}
var Or, qo;
function zp() {
  if (qo) return Or;
  qo = 1;
  function e(t) {
    var n = this.has(t) && delete this.__data__[t];
    return this.size -= n ? 1 : 0, n;
  }
  return Or = e, Or;
}
var Ir, Ho;
function Up() {
  if (Ho) return Ir;
  Ho = 1;
  var e = Dn(), t = "__lodash_hash_undefined__", n = Object.prototype, r = n.hasOwnProperty;
  function a(i) {
    var o = this.__data__;
    if (e) {
      var l = o[i];
      return l === t ? void 0 : l;
    }
    return r.call(o, i) ? o[i] : void 0;
  }
  return Ir = a, Ir;
}
var Tr, $o;
function Gp() {
  if ($o) return Tr;
  $o = 1;
  var e = Dn(), t = Object.prototype, n = t.hasOwnProperty;
  function r(a) {
    var i = this.__data__;
    return e ? i[a] !== void 0 : n.call(i, a);
  }
  return Tr = r, Tr;
}
var Nr, Vo;
function Kp() {
  if (Vo) return Nr;
  Vo = 1;
  var e = Dn(), t = "__lodash_hash_undefined__";
  function n(r, a) {
    var i = this.__data__;
    return this.size += this.has(r) ? 0 : 1, i[r] = e && a === void 0 ? t : a, this;
  }
  return Nr = n, Nr;
}
var Sr, Wo;
function Xp() {
  if (Wo) return Sr;
  Wo = 1;
  var e = Wp(), t = zp(), n = Up(), r = Gp(), a = Kp();
  function i(o) {
    var l = -1, c = o == null ? 0 : o.length;
    for (this.clear(); ++l < c; ) {
      var d = o[l];
      this.set(d[0], d[1]);
    }
  }
  return i.prototype.clear = e, i.prototype.delete = t, i.prototype.get = n, i.prototype.has = r, i.prototype.set = a, Sr = i, Sr;
}
var kr, zo;
function Yp() {
  if (zo) return kr;
  zo = 1;
  var e = Xp(), t = An(), n = Ic();
  function r() {
    this.size = 0, this.__data__ = {
      hash: new e(),
      map: new (n || t)(),
      string: new e()
    };
  }
  return kr = r, kr;
}
var Rr, Uo;
function Jp() {
  if (Uo) return Rr;
  Uo = 1;
  function e(t) {
    var n = typeof t;
    return n == "string" || n == "number" || n == "symbol" || n == "boolean" ? t !== "__proto__" : t === null;
  }
  return Rr = e, Rr;
}
var Lr, Go;
function jn() {
  if (Go) return Lr;
  Go = 1;
  var e = Jp();
  function t(n, r) {
    var a = n.__data__;
    return e(r) ? a[typeof r == "string" ? "string" : "hash"] : a.map;
  }
  return Lr = t, Lr;
}
var Pr, Ko;
function Zp() {
  if (Ko) return Pr;
  Ko = 1;
  var e = jn();
  function t(n) {
    var r = e(this, n).delete(n);
    return this.size -= r ? 1 : 0, r;
  }
  return Pr = t, Pr;
}
var Ar, Xo;
function Qp() {
  if (Xo) return Ar;
  Xo = 1;
  var e = jn();
  function t(n) {
    return e(this, n).get(n);
  }
  return Ar = t, Ar;
}
var Mr, Yo;
function em() {
  if (Yo) return Mr;
  Yo = 1;
  var e = jn();
  function t(n) {
    return e(this, n).has(n);
  }
  return Mr = t, Mr;
}
var Dr, Jo;
function tm() {
  if (Jo) return Dr;
  Jo = 1;
  var e = jn();
  function t(n, r) {
    var a = e(this, n), i = a.size;
    return a.set(n, r), this.size += a.size == i ? 0 : 1, this;
  }
  return Dr = t, Dr;
}
var jr, Zo;
function nm() {
  if (Zo) return jr;
  Zo = 1;
  var e = Yp(), t = Zp(), n = Qp(), r = em(), a = tm();
  function i(o) {
    var l = -1, c = o == null ? 0 : o.length;
    for (this.clear(); ++l < c; ) {
      var d = o[l];
      this.set(d[0], d[1]);
    }
  }
  return i.prototype.clear = e, i.prototype.delete = t, i.prototype.get = n, i.prototype.has = r, i.prototype.set = a, jr = i, jr;
}
var Fr, Qo;
function rm() {
  if (Qo) return Fr;
  Qo = 1;
  var e = An(), t = Ic(), n = nm(), r = 200;
  function a(i, o) {
    var l = this.__data__;
    if (l instanceof e) {
      var c = l.__data__;
      if (!t || c.length < r - 1)
        return c.push([i, o]), this.size = ++l.size, this;
      l = this.__data__ = new n(c);
    }
    return l.set(i, o), this.size = l.size, this;
  }
  return Fr = a, Fr;
}
var Br, es;
function am() {
  if (es) return Br;
  es = 1;
  var e = An(), t = Pp(), n = Ap(), r = Mp(), a = Dp(), i = rm();
  function o(l) {
    var c = this.__data__ = new e(l);
    this.size = c.size;
  }
  return o.prototype.clear = t, o.prototype.delete = n, o.prototype.get = r, o.prototype.has = a, o.prototype.set = i, Br = o, Br;
}
var qr, ts;
function Tc() {
  if (ts) return qr;
  ts = 1;
  var e = Ii(), t = (function() {
    try {
      var n = e(Object, "defineProperty");
      return n({}, "", {}), n;
    } catch {
    }
  })();
  return qr = t, qr;
}
var Hr, ns;
function Ti() {
  if (ns) return Hr;
  ns = 1;
  var e = Tc();
  function t(n, r, a) {
    r == "__proto__" && e ? e(n, r, {
      configurable: !0,
      enumerable: !0,
      value: a,
      writable: !0
    }) : n[r] = a;
  }
  return Hr = t, Hr;
}
var $r, rs;
function Nc() {
  if (rs) return $r;
  rs = 1;
  var e = Ti(), t = Ln();
  function n(r, a, i) {
    (i !== void 0 && !t(r[a], i) || i === void 0 && !(a in r)) && e(r, a, i);
  }
  return $r = n, $r;
}
var Vr, as;
function im() {
  if (as) return Vr;
  as = 1;
  function e(t) {
    return function(n, r, a) {
      for (var i = -1, o = Object(n), l = a(n), c = l.length; c--; ) {
        var d = l[t ? c : ++i];
        if (r(o[d], d, o) === !1)
          break;
      }
      return n;
    };
  }
  return Vr = e, Vr;
}
var Wr, is;
function om() {
  if (is) return Wr;
  is = 1;
  var e = im(), t = e();
  return Wr = t, Wr;
}
var jt = { exports: {} };
jt.exports;
var os;
function sm() {
  return os || (os = 1, (function(e, t) {
    var n = Nt(), r = t && !t.nodeType && t, a = r && !0 && e && !e.nodeType && e, i = a && a.exports === r, o = i ? n.Buffer : void 0, l = o ? o.allocUnsafe : void 0;
    function c(d, u) {
      if (u)
        return d.slice();
      var f = d.length, p = l ? l(f) : new d.constructor(f);
      return d.copy(p), p;
    }
    e.exports = c;
  })(jt, jt.exports)), jt.exports;
}
var zr, ss;
function lm() {
  if (ss) return zr;
  ss = 1;
  var e = Nt(), t = e.Uint8Array;
  return zr = t, zr;
}
var Ur, ls;
function cm() {
  if (ls) return Ur;
  ls = 1;
  var e = lm();
  function t(n) {
    var r = new n.constructor(n.byteLength);
    return new e(r).set(new e(n)), r;
  }
  return Ur = t, Ur;
}
var Gr, cs;
function dm() {
  if (cs) return Gr;
  cs = 1;
  var e = cm();
  function t(n, r) {
    var a = r ? e(n.buffer) : n.buffer;
    return new n.constructor(a, n.byteOffset, n.length);
  }
  return Gr = t, Gr;
}
var Kr, ds;
function um() {
  if (ds) return Kr;
  ds = 1;
  function e(t, n) {
    var r = -1, a = t.length;
    for (n || (n = Array(a)); ++r < a; )
      n[r] = t[r];
    return n;
  }
  return Kr = e, Kr;
}
var Xr, us;
function fm() {
  if (us) return Xr;
  us = 1;
  var e = bt(), t = Object.create, n = /* @__PURE__ */ (function() {
    function r() {
    }
    return function(a) {
      if (!e(a))
        return {};
      if (t)
        return t(a);
      r.prototype = a;
      var i = new r();
      return r.prototype = void 0, i;
    };
  })();
  return Xr = n, Xr;
}
var Yr, fs;
function pm() {
  if (fs) return Yr;
  fs = 1;
  function e(t, n) {
    return function(r) {
      return t(n(r));
    };
  }
  return Yr = e, Yr;
}
var Jr, ps;
function Sc() {
  if (ps) return Jr;
  ps = 1;
  var e = pm(), t = e(Object.getPrototypeOf, Object);
  return Jr = t, Jr;
}
var Zr, ms;
function kc() {
  if (ms) return Zr;
  ms = 1;
  var e = Object.prototype;
  function t(n) {
    var r = n && n.constructor, a = typeof r == "function" && r.prototype || e;
    return n === a;
  }
  return Zr = t, Zr;
}
var Qr, hs;
function mm() {
  if (hs) return Qr;
  hs = 1;
  var e = fm(), t = Sc(), n = kc();
  function r(a) {
    return typeof a.constructor == "function" && !n(a) ? e(t(a)) : {};
  }
  return Qr = r, Qr;
}
var ea, bs;
function tn() {
  if (bs) return ea;
  bs = 1;
  function e(t) {
    return t != null && typeof t == "object";
  }
  return ea = e, ea;
}
var ta, gs;
function hm() {
  if (gs) return ta;
  gs = 1;
  var e = Mn(), t = tn(), n = "[object Arguments]";
  function r(a) {
    return t(a) && e(a) == n;
  }
  return ta = r, ta;
}
var na, vs;
function Rc() {
  if (vs) return na;
  vs = 1;
  var e = hm(), t = tn(), n = Object.prototype, r = n.hasOwnProperty, a = n.propertyIsEnumerable, i = e(/* @__PURE__ */ (function() {
    return arguments;
  })()) ? e : function(o) {
    return t(o) && r.call(o, "callee") && !a.call(o, "callee");
  };
  return na = i, na;
}
var ra, ys;
function Lc() {
  if (ys) return ra;
  ys = 1;
  var e = Array.isArray;
  return ra = e, ra;
}
var aa, xs;
function Pc() {
  if (xs) return aa;
  xs = 1;
  var e = 9007199254740991;
  function t(n) {
    return typeof n == "number" && n > -1 && n % 1 == 0 && n <= e;
  }
  return aa = t, aa;
}
var ia, Es;
function Ni() {
  if (Es) return ia;
  Es = 1;
  var e = Oi(), t = Pc();
  function n(r) {
    return r != null && t(r.length) && !e(r);
  }
  return ia = n, ia;
}
var oa, _s;
function bm() {
  if (_s) return oa;
  _s = 1;
  var e = Ni(), t = tn();
  function n(r) {
    return t(r) && e(r);
  }
  return oa = n, oa;
}
var Ft = { exports: {} }, sa, Cs;
function gm() {
  if (Cs) return sa;
  Cs = 1;
  function e() {
    return !1;
  }
  return sa = e, sa;
}
Ft.exports;
var ws;
function Ac() {
  return ws || (ws = 1, (function(e, t) {
    var n = Nt(), r = gm(), a = t && !t.nodeType && t, i = a && !0 && e && !e.nodeType && e, o = i && i.exports === a, l = o ? n.Buffer : void 0, c = l ? l.isBuffer : void 0, d = c || r;
    e.exports = d;
  })(Ft, Ft.exports)), Ft.exports;
}
var la, Os;
function vm() {
  if (Os) return la;
  Os = 1;
  var e = Mn(), t = Sc(), n = tn(), r = "[object Object]", a = Function.prototype, i = Object.prototype, o = a.toString, l = i.hasOwnProperty, c = o.call(Object);
  function d(u) {
    if (!n(u) || e(u) != r)
      return !1;
    var f = t(u);
    if (f === null)
      return !0;
    var p = l.call(f, "constructor") && f.constructor;
    return typeof p == "function" && p instanceof p && o.call(p) == c;
  }
  return la = d, la;
}
var ca, Is;
function ym() {
  if (Is) return ca;
  Is = 1;
  var e = Mn(), t = Pc(), n = tn(), r = "[object Arguments]", a = "[object Array]", i = "[object Boolean]", o = "[object Date]", l = "[object Error]", c = "[object Function]", d = "[object Map]", u = "[object Number]", f = "[object Object]", p = "[object RegExp]", h = "[object Set]", v = "[object String]", m = "[object WeakMap]", x = "[object ArrayBuffer]", _ = "[object DataView]", y = "[object Float32Array]", I = "[object Float64Array]", N = "[object Int8Array]", R = "[object Int16Array]", L = "[object Int32Array]", O = "[object Uint8Array]", w = "[object Uint8ClampedArray]", j = "[object Uint16Array]", k = "[object Uint32Array]", C = {};
  C[y] = C[I] = C[N] = C[R] = C[L] = C[O] = C[w] = C[j] = C[k] = !0, C[r] = C[a] = C[x] = C[i] = C[_] = C[o] = C[l] = C[c] = C[d] = C[u] = C[f] = C[p] = C[h] = C[v] = C[m] = !1;
  function S(b) {
    return n(b) && t(b.length) && !!C[e(b)];
  }
  return ca = S, ca;
}
var da, Ts;
function xm() {
  if (Ts) return da;
  Ts = 1;
  function e(t) {
    return function(n) {
      return t(n);
    };
  }
  return da = e, da;
}
var Bt = { exports: {} };
Bt.exports;
var Ns;
function Em() {
  return Ns || (Ns = 1, (function(e, t) {
    var n = wc(), r = t && !t.nodeType && t, a = r && !0 && e && !e.nodeType && e, i = a && a.exports === r, o = i && n.process, l = (function() {
      try {
        var c = a && a.require && a.require("util").types;
        return c || o && o.binding && o.binding("util");
      } catch {
      }
    })();
    e.exports = l;
  })(Bt, Bt.exports)), Bt.exports;
}
var ua, Ss;
function Mc() {
  if (Ss) return ua;
  Ss = 1;
  var e = ym(), t = xm(), n = Em(), r = n && n.isTypedArray, a = r ? t(r) : e;
  return ua = a, ua;
}
var fa, ks;
function Dc() {
  if (ks) return fa;
  ks = 1;
  function e(t, n) {
    if (!(n === "constructor" && typeof t[n] == "function") && n != "__proto__")
      return t[n];
  }
  return fa = e, fa;
}
var pa, Rs;
function _m() {
  if (Rs) return pa;
  Rs = 1;
  var e = Ti(), t = Ln(), n = Object.prototype, r = n.hasOwnProperty;
  function a(i, o, l) {
    var c = i[o];
    (!(r.call(i, o) && t(c, l)) || l === void 0 && !(o in i)) && e(i, o, l);
  }
  return pa = a, pa;
}
var ma, Ls;
function Cm() {
  if (Ls) return ma;
  Ls = 1;
  var e = _m(), t = Ti();
  function n(r, a, i, o) {
    var l = !i;
    i || (i = {});
    for (var c = -1, d = a.length; ++c < d; ) {
      var u = a[c], f = o ? o(i[u], r[u], u, i, r) : void 0;
      f === void 0 && (f = r[u]), l ? t(i, u, f) : e(i, u, f);
    }
    return i;
  }
  return ma = n, ma;
}
var ha, Ps;
function wm() {
  if (Ps) return ha;
  Ps = 1;
  function e(t, n) {
    for (var r = -1, a = Array(t); ++r < t; )
      a[r] = n(r);
    return a;
  }
  return ha = e, ha;
}
var ba, As;
function jc() {
  if (As) return ba;
  As = 1;
  var e = 9007199254740991, t = /^(?:0|[1-9]\d*)$/;
  function n(r, a) {
    var i = typeof r;
    return a = a ?? e, !!a && (i == "number" || i != "symbol" && t.test(r)) && r > -1 && r % 1 == 0 && r < a;
  }
  return ba = n, ba;
}
var ga, Ms;
function Om() {
  if (Ms) return ga;
  Ms = 1;
  var e = wm(), t = Rc(), n = Lc(), r = Ac(), a = jc(), i = Mc(), o = Object.prototype, l = o.hasOwnProperty;
  function c(d, u) {
    var f = n(d), p = !f && t(d), h = !f && !p && r(d), v = !f && !p && !h && i(d), m = f || p || h || v, x = m ? e(d.length, String) : [], _ = x.length;
    for (var y in d)
      (u || l.call(d, y)) && !(m && // Safari 9 has enumerable `arguments.length` in strict mode.
      (y == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      h && (y == "offset" || y == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      v && (y == "buffer" || y == "byteLength" || y == "byteOffset") || // Skip index properties.
      a(y, _))) && x.push(y);
    return x;
  }
  return ga = c, ga;
}
var va, Ds;
function Im() {
  if (Ds) return va;
  Ds = 1;
  function e(t) {
    var n = [];
    if (t != null)
      for (var r in Object(t))
        n.push(r);
    return n;
  }
  return va = e, va;
}
var ya, js;
function Tm() {
  if (js) return ya;
  js = 1;
  var e = bt(), t = kc(), n = Im(), r = Object.prototype, a = r.hasOwnProperty;
  function i(o) {
    if (!e(o))
      return n(o);
    var l = t(o), c = [];
    for (var d in o)
      d == "constructor" && (l || !a.call(o, d)) || c.push(d);
    return c;
  }
  return ya = i, ya;
}
var xa, Fs;
function Fc() {
  if (Fs) return xa;
  Fs = 1;
  var e = Om(), t = Tm(), n = Ni();
  function r(a) {
    return n(a) ? e(a, !0) : t(a);
  }
  return xa = r, xa;
}
var Ea, Bs;
function Nm() {
  if (Bs) return Ea;
  Bs = 1;
  var e = Cm(), t = Fc();
  function n(r) {
    return e(r, t(r));
  }
  return Ea = n, Ea;
}
var _a, qs;
function Sm() {
  if (qs) return _a;
  qs = 1;
  var e = Nc(), t = sm(), n = dm(), r = um(), a = mm(), i = Rc(), o = Lc(), l = bm(), c = Ac(), d = Oi(), u = bt(), f = vm(), p = Mc(), h = Dc(), v = Nm();
  function m(x, _, y, I, N, R, L) {
    var O = h(x, y), w = h(_, y), j = L.get(w);
    if (j) {
      e(x, y, j);
      return;
    }
    var k = R ? R(O, w, y + "", x, _, L) : void 0, C = k === void 0;
    if (C) {
      var S = o(w), b = !S && c(w), E = !S && !b && p(w);
      k = w, S || b || E ? o(O) ? k = O : l(O) ? k = r(O) : b ? (C = !1, k = t(w, !0)) : E ? (C = !1, k = n(w, !0)) : k = [] : f(w) || i(w) ? (k = O, i(O) ? k = v(O) : (!u(O) || d(O)) && (k = a(w))) : C = !1;
    }
    C && (L.set(w, k), N(k, w, I, R, L), L.delete(w)), e(x, y, k);
  }
  return _a = m, _a;
}
var Ca, Hs;
function km() {
  if (Hs) return Ca;
  Hs = 1;
  var e = am(), t = Nc(), n = om(), r = Sm(), a = bt(), i = Fc(), o = Dc();
  function l(c, d, u, f, p) {
    c !== d && n(d, function(h, v) {
      if (p || (p = new e()), a(h))
        r(c, d, v, u, l, f, p);
      else {
        var m = f ? f(o(c, v), h, v + "", c, d, p) : void 0;
        m === void 0 && (m = h), t(c, v, m);
      }
    }, i);
  }
  return Ca = l, Ca;
}
var wa, $s;
function Bc() {
  if ($s) return wa;
  $s = 1;
  function e(t) {
    return t;
  }
  return wa = e, wa;
}
var Oa, Vs;
function Rm() {
  if (Vs) return Oa;
  Vs = 1;
  function e(t, n, r) {
    switch (r.length) {
      case 0:
        return t.call(n);
      case 1:
        return t.call(n, r[0]);
      case 2:
        return t.call(n, r[0], r[1]);
      case 3:
        return t.call(n, r[0], r[1], r[2]);
    }
    return t.apply(n, r);
  }
  return Oa = e, Oa;
}
var Ia, Ws;
function Lm() {
  if (Ws) return Ia;
  Ws = 1;
  var e = Rm(), t = Math.max;
  function n(r, a, i) {
    return a = t(a === void 0 ? r.length - 1 : a, 0), function() {
      for (var o = arguments, l = -1, c = t(o.length - a, 0), d = Array(c); ++l < c; )
        d[l] = o[a + l];
      l = -1;
      for (var u = Array(a + 1); ++l < a; )
        u[l] = o[l];
      return u[a] = i(d), e(r, this, u);
    };
  }
  return Ia = n, Ia;
}
var Ta, zs;
function Pm() {
  if (zs) return Ta;
  zs = 1;
  function e(t) {
    return function() {
      return t;
    };
  }
  return Ta = e, Ta;
}
var Na, Us;
function Am() {
  if (Us) return Na;
  Us = 1;
  var e = Pm(), t = Tc(), n = Bc(), r = t ? function(a, i) {
    return t(a, "toString", {
      configurable: !0,
      enumerable: !1,
      value: e(i),
      writable: !0
    });
  } : n;
  return Na = r, Na;
}
var Sa, Gs;
function Mm() {
  if (Gs) return Sa;
  Gs = 1;
  var e = 800, t = 16, n = Date.now;
  function r(a) {
    var i = 0, o = 0;
    return function() {
      var l = n(), c = t - (l - o);
      if (o = l, c > 0) {
        if (++i >= e)
          return arguments[0];
      } else
        i = 0;
      return a.apply(void 0, arguments);
    };
  }
  return Sa = r, Sa;
}
var ka, Ks;
function Dm() {
  if (Ks) return ka;
  Ks = 1;
  var e = Am(), t = Mm(), n = t(e);
  return ka = n, ka;
}
var Ra, Xs;
function jm() {
  if (Xs) return Ra;
  Xs = 1;
  var e = Bc(), t = Lm(), n = Dm();
  function r(a, i) {
    return n(t(a, i, e), a + "");
  }
  return Ra = r, Ra;
}
var La, Ys;
function Fm() {
  if (Ys) return La;
  Ys = 1;
  var e = Ln(), t = Ni(), n = jc(), r = bt();
  function a(i, o, l) {
    if (!r(l))
      return !1;
    var c = typeof o;
    return (c == "number" ? t(l) && n(o, l.length) : c == "string" && o in l) ? e(l[o], i) : !1;
  }
  return La = a, La;
}
var Pa, Js;
function Bm() {
  if (Js) return Pa;
  Js = 1;
  var e = jm(), t = Fm();
  function n(r) {
    return e(function(a, i) {
      var o = -1, l = i.length, c = l > 1 ? i[l - 1] : void 0, d = l > 2 ? i[2] : void 0;
      for (c = r.length > 3 && typeof c == "function" ? (l--, c) : void 0, d && t(i[0], i[1], d) && (c = l < 3 ? void 0 : c, l = 1), a = Object(a); ++o < l; ) {
        var u = i[o];
        u && r(a, u, o, c);
      }
      return a;
    });
  }
  return Pa = n, Pa;
}
var Aa, Zs;
function qm() {
  if (Zs) return Aa;
  Zs = 1;
  var e = km(), t = Bm(), n = t(function(r, a, i, o) {
    e(r, a, i, o);
  });
  return Aa = n, Aa;
}
var Hm = qm();
const Ma = /* @__PURE__ */ Xf(Hm);
function qc(...e) {
  const t = e[0], n = e.slice(1);
  return n.length ? Ma(Ma({}, t), ...n, (r, a, i) => {
    if (i === "children")
      return r && a ? s.cloneElement(r, {
        children: a
      }) : Object.assign(Object.assign({}, a), r);
    if (i === "className")
      return g(r, a);
  }) : Ma({}, t);
}
const Hc = {
  name: "--pf-v5-c-table__sticky-cell--MinWidth"
}, $c = {
  name: "--pf-v5-c-table__sticky-cell--Left"
}, Vc = {
  name: "--pf-v5-c-table__sticky-cell--Right"
}, $m = (e) => {
  var { children: t, className: n, component: r = "th", dataLabel: a, scope: i = "col", textCenter: o = !1, sort: l = null, modifier: c, select: d = null, expand: u = null, tooltip: f = "", tooltipProps: p, onMouseEnter: h = () => {
  }, width: v, visibility: m, innerRef: x, info: _, isStickyColumn: y = !1, hasRightBorder: I = !1, hasLeftBorder: N = !1, stickyMinWidth: R = "120px", stickyLeftOffset: L, stickyRightOffset: O, isSubheader: w = !1, screenReaderText: j, "aria-label": k } = e, C = P(e, ["children", "className", "component", "dataLabel", "scope", "textCenter", "sort", "modifier", "select", "expand", "tooltip", "tooltipProps", "onMouseEnter", "width", "visibility", "innerRef", "info", "isStickyColumn", "hasRightBorder", "hasLeftBorder", "stickyMinWidth", "stickyLeftOffset", "stickyRightOffset", "isSubheader", "screenReaderText", "aria-label"]);
  !t && !j && !k && console.warn("Th: Table headers must have an accessible name. If the Th is intended to be visually empty, pass in screenReaderText. If the Th contains only non-text, interactive content such as a checkbox or expand toggle, pass in an aria-label.");
  const [S, b] = s.useState(!1), [E, T] = s.useState(!1), A = x || s.createRef(), F = (Ee) => {
    Ee.target.offsetWidth < Ee.target.scrollWidth ? !S && b(!0) : S && b(!1), h(Ee);
  };
  let M = null;
  l && (l.isFavorites ? M = hp({
    onSort: l == null ? void 0 : l.onSort,
    columnIndex: l.columnIndex,
    sortBy: l.sortBy,
    tooltip: f,
    tooltipProps: p
  })() : M = mc(t, {
    columnIndex: l.columnIndex,
    column: {
      extraParams: {
        sortBy: l.sortBy,
        onSort: l == null ? void 0 : l.onSort
      }
    },
    tooltip: f,
    tooltipProps: p
  }));
  const D = d ? fc(t, {
    rowData: {
      selected: d.isSelected,
      disableSelection: d == null ? void 0 : d.isDisabled,
      props: d == null ? void 0 : d.props
    },
    column: {
      extraParams: {
        onSelect: d == null ? void 0 : d.onSelect,
        selectVariant: "checkbox",
        allRowsSelected: d.isSelected,
        isHeaderSelectDisabled: !!d.isHeaderSelectDisabled
      }
    },
    tooltip: f
  }) : null, q = u ? bc(t, {
    column: {
      extraParams: {
        onCollapse: u == null ? void 0 : u.onToggle,
        allRowsExpanded: !u.areAllExpanded,
        collapseAllAriaLabel: ""
      }
    }
  }) : null, z = v ? hc(v)() : null, Z = m ? vc(...m.map((Ee) => gc[Ee]))() : null;
  let W = (M == null ? void 0 : M.children) || (D == null ? void 0 : D.children) || (q == null ? void 0 : q.children) || t, U = null;
  _ && (U = Ep(_)(W), W = U.children);
  const Y = qc(M, D, q, z, Z, U), {
    // ignore the merged children since we transform them ourselves so we can wrap it with info
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    children: X = null,
    // selectable adds this but we don't want it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isVisible: ue = null,
    className: ne = "",
    component: Ie = r
  } = Y, ge = P(Y, ["children", "isVisible", "className", "component"]);
  s.useEffect(() => {
    T(A.current.offsetWidth < A.current.scrollWidth);
  }, [A]);
  const J = s.createElement(Ie, Object.assign({ tabIndex: l || d || !E ? -1 : 0, onFocus: f !== null ? F : h, onBlur: () => b(!1), "data-label": a, onMouseEnter: f !== null ? F : h, scope: r === "th" ? i : null, ref: A, "aria-label": k, className: g(B.tableTh, n, o && B.modifiers.center, w && B.tableSubhead, y && wt.tableStickyCell, I && wt.modifiers.borderRight, N && wt.modifiers.borderLeft, c && B.modifiers[c], ne) }, ge, C, y && {
    style: Object.assign({ [Hc.name]: R || void 0, [$c.name]: L || 0, [Vc.name]: O || 0 }, C.style)
  }), W || j && s.createElement("span", { className: "pf-v5-screen-reader" }, j));
  return f !== null && (f === "" ? typeof W == "string" : !0) && !(M || D) && S ? s.createElement(
    s.Fragment,
    null,
    J,
    s.createElement(qe, Object.assign({ triggerRef: A, content: f || f === "" && t, isVisible: !0 }, p))
  ) : J;
}, ot = s.forwardRef((e, t) => s.createElement($m, Object.assign({}, e, { innerRef: t })));
ot.displayName = "Th";
const Vm = (e, { rowData: t }) => {
  const { id: n } = t;
  return {
    className: "",
    children: s.createElement(dc, { id: n })
  };
}, Wm = (e) => {
  var { children: t, className: n, isActionCell: r = !1, component: a = "td", dataLabel: i, textCenter: o = !1, modifier: l, select: c = null, actions: d = null, expand: u = null, treeRow: f = null, compoundExpand: p = null, noPadding: h, width: v, visibility: m, innerRef: x, favorites: _ = null, draggableRow: y = null, tooltip: I = "", onMouseEnter: N = () => {
  }, isStickyColumn: R = !1, hasRightBorder: L = !1, hasLeftBorder: O = !1, stickyMinWidth: w = "120px", stickyLeftOffset: j, stickyRightOffset: k } = e, C = P(e, ["children", "className", "isActionCell", "component", "dataLabel", "textCenter", "modifier", "select", "actions", "expand", "treeRow", "compoundExpand", "noPadding", "width", "visibility", "innerRef", "favorites", "draggableRow", "tooltip", "onMouseEnter", "isStickyColumn", "hasRightBorder", "hasLeftBorder", "stickyMinWidth", "stickyLeftOffset", "stickyRightOffset"]);
  const [S, b] = s.useState(!1), [E, T] = s.useState(!1), A = x || s.createRef(), F = (le) => {
    le.target.offsetWidth < le.target.scrollWidth ? !S && b(!0) : S && b(!1), N(le);
  }, M = c ? fc(t, {
    rowIndex: c.rowIndex,
    rowData: {
      selected: c.isSelected,
      disableSelection: c == null ? void 0 : c.isDisabled,
      props: c == null ? void 0 : c.props
    },
    column: {
      extraParams: {
        onSelect: c == null ? void 0 : c.onSelect,
        selectVariant: c.variant || "checkbox"
      }
    }
  }) : null, D = _ ? _p(null, {
    rowIndex: _ == null ? void 0 : _.rowIndex,
    rowData: {
      favorited: _.isFavorited,
      favoritesProps: _ == null ? void 0 : _.props
    },
    column: {
      extraParams: {
        onFavorite: _ == null ? void 0 : _.onFavorite
      }
    }
  }) : null, q = y !== null ? Vm(null, {
    rowData: {
      id: y.id
    }
  }) : null, z = d ? bp(d.items, null, null) : null, Z = z ? z(null, {
    rowIndex: d == null ? void 0 : d.rowIndex,
    rowData: {
      disableActions: d == null ? void 0 : d.isDisabled
    },
    column: {
      extraParams: {
        dropdownPosition: d == null ? void 0 : d.dropdownPosition,
        dropdownDirection: d == null ? void 0 : d.dropdownDirection,
        menuAppendTo: d == null ? void 0 : d.menuAppendTo,
        actionsToggle: d == null ? void 0 : d.actionsToggle
      }
    }
  }) : null, W = u !== null ? bc(null, {
    rowIndex: u.rowIndex,
    columnIndex: u == null ? void 0 : u.columnIndex,
    rowData: {
      isOpen: u.isExpanded
    },
    column: {
      extraParams: {
        onCollapse: u == null ? void 0 : u.onToggle,
        expandId: u == null ? void 0 : u.expandId
      }
    }
  }) : null, U = p !== null ? yp({
    title: t,
    props: {
      isOpen: p.isExpanded
    }
  }, {
    rowIndex: p == null ? void 0 : p.rowIndex,
    columnIndex: p == null ? void 0 : p.columnIndex,
    column: {
      extraParams: {
        onExpand: p == null ? void 0 : p.onToggle,
        expandId: p == null ? void 0 : p.expandId
      }
    }
  }) : null, Y = v ? hc(v)() : null, X = m ? vc(...m.map((le) => gc[le]))() : null, ue = f !== null ? Cp(f.onCollapse, f.onCheckChange, f.onToggleRowDetails)({
    title: t
  }, {
    rowIndex: f.rowIndex,
    rowData: {
      props: f.props
    }
  }) : null, ne = qc(M, Z, W, U, Y, X, D, ue, q), {
    // selectable adds this but we don't want it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isVisible: Ie = null,
    children: ge = null,
    className: J = "",
    component: te = a
  } = ne, Le = P(ne, ["isVisible", "children", "className", "component"]), Ee = n && n.includes(we.tableTreeViewTitleCell) || J && J.includes(we.tableTreeViewTitleCell);
  s.useEffect(() => {
    T(A.current.offsetWidth < A.current.scrollWidth);
  }, [A]);
  const Pe = s.createElement(te, Object.assign({ tabIndex: (c || !E) && l !== "truncate" ? -1 : 0 }, !Ee && { "data-label": i }, { onFocus: I !== null ? F : N, onBlur: () => b(!1), onMouseEnter: I !== null ? F : N, className: g(B.tableTd, n, r && B.tableAction, o && B.modifiers.center, h && B.modifiers.noPadding, R && wt.tableStickyCell, L && wt.modifiers.borderRight, O && wt.modifiers.borderLeft, B.modifiers[l], q && B.tableDraggable, J), ref: A }, Le, C, R && {
    style: Object.assign({ [Hc.name]: w || void 0, [$c.name]: j || 0, [Vc.name]: k || 0 }, C.style)
  }), ge || t);
  return I !== null && (I === "" ? typeof t == "string" : !0) && S ? s.createElement(
    s.Fragment,
    null,
    Pe,
    s.createElement(qe, { triggerRef: A, content: I || I === "" && t, isVisible: !0 })
  ) : Pe;
}, st = s.forwardRef((e, t) => s.createElement(Wm, Object.assign({}, e, { innerRef: t })));
st.displayName = "Td";
const Qs = (e) => {
  if (!e)
    return "-";
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? e : t.toLocaleString();
}, zm = ({ apiKeys: e, onRevoke: t }) => e.length === 0 ? /* @__PURE__ */ Se(tc, { children: [
  /* @__PURE__ */ H(nc, { titleText: "No API keys yet", headingLevel: "h2" }),
  /* @__PURE__ */ H(rc, { children: "Create an API key to access your applications." })
] }) : /* @__PURE__ */ Se(Ec, { "aria-label": "API keys", children: [
  /* @__PURE__ */ H(_c, { children: /* @__PURE__ */ Se(ri, { children: [
    /* @__PURE__ */ H(ot, { children: "Name" }),
    /* @__PURE__ */ H(ot, { children: "Client" }),
    /* @__PURE__ */ H(ot, { children: "Expires" }),
    /* @__PURE__ */ H(ot, { children: "Last used" }),
    /* @__PURE__ */ H(ot, { children: "Usage count" }),
    /* @__PURE__ */ H(ot, { screenReaderText: "Actions" })
  ] }) }),
  /* @__PURE__ */ H(Cc, { children: e.map((n) => /* @__PURE__ */ Se(ri, { children: [
    /* @__PURE__ */ H(st, { dataLabel: "Name", children: n.name }),
    /* @__PURE__ */ H(st, { dataLabel: "Client", children: n.clientId }),
    /* @__PURE__ */ H(st, { dataLabel: "Expires", children: Qs(n.expiresAt ?? null) }),
    /* @__PURE__ */ H(st, { dataLabel: "Last used", children: Qs(n.lastUsedAt ?? null) }),
    /* @__PURE__ */ H(st, { dataLabel: "Usage count", children: n.usageCount ?? "-" }),
    /* @__PURE__ */ H(st, { dataLabel: "Actions", isActionCell: !0, children: /* @__PURE__ */ H(
      oe,
      {
        variant: "link",
        isInline: !0,
        onClick: () => t(n),
        children: "Revoke"
      }
    ) })
  ] }, n.id)) })
] }), el = (e) => e.split(",").map((t) => t.trim()).filter(Boolean), Um = ({
  isOpen: e,
  isSubmitting: t,
  clients: n,
  onClose: r,
  onCreate: a
}) => {
  const [i, o] = pe(""), [l, c] = pe(""), [d, u] = pe(""), [f, p] = pe(""), [h, v] = pe("");
  Ct(() => {
    e && (o(""), c((n == null ? void 0 : n[0]) ?? ""), u(""), p(""), v(""));
  }, [e, n]);
  const m = ((n == null ? void 0 : n.length) ?? 0) > 0, x = ii(() => i.trim().length > 0 && l.trim().length > 0, [i, l]);
  return /* @__PURE__ */ H(
    Ye,
    {
      title: "Create API key",
      isOpen: e,
      onClose: r,
      actions: [
        /* @__PURE__ */ H(
          oe,
          {
            variant: "primary",
            isDisabled: !x || t,
            isLoading: t,
            onClick: () => {
              var I, N;
              const y = {
                name: i.trim(),
                clientId: l.trim(),
                roles: el(d),
                scopes: el(f),
                expiresAt: h ? new Date(h).toISOString() : void 0
              };
              ((I = y.roles) == null ? void 0 : I.length) === 0 && delete y.roles, ((N = y.scopes) == null ? void 0 : N.length) === 0 && delete y.scopes, (!y.expiresAt || Number.isNaN(Date.parse(y.expiresAt))) && delete y.expiresAt, a(y);
            },
            children: "Create"
          },
          "create"
        ),
        /* @__PURE__ */ H(oe, { variant: "link", onClick: r, children: "Cancel" }, "cancel")
      ],
      children: /* @__PURE__ */ Se(ec, { isWidthLimited: !0, children: [
        /* @__PURE__ */ H(Et, { label: "Name", isRequired: !0, fieldId: "api-key-name", children: /* @__PURE__ */ H(
          tt,
          {
            id: "api-key-name",
            value: i,
            onChange: (y, I) => o(I),
            isRequired: !0
          }
        ) }),
        /* @__PURE__ */ H(Et, { label: "Client", isRequired: !0, fieldId: "api-key-client", children: m ? /* @__PURE__ */ H(
          Tt,
          {
            id: "api-key-client",
            value: l,
            onChange: (y, I) => c(I),
            isRequired: !0,
            children: n == null ? void 0 : n.map((y) => /* @__PURE__ */ H(
              ac,
              {
                value: y,
                label: y
              },
              y
            ))
          }
        ) : /* @__PURE__ */ H(
          tt,
          {
            id: "api-key-client",
            value: l,
            onChange: (y, I) => c(I),
            isRequired: !0
          }
        ) }),
        /* @__PURE__ */ Se(Et, { label: "Roles", fieldId: "api-key-roles", children: [
          /* @__PURE__ */ H(
            tt,
            {
              id: "api-key-roles",
              value: d,
              onChange: (y, I) => u(I),
              placeholder: "role-a, role-b"
            }
          ),
          /* @__PURE__ */ H(pn, { children: /* @__PURE__ */ H(mn, { children: "Optional, comma-separated list of roles." }) })
        ] }),
        /* @__PURE__ */ Se(Et, { label: "Scopes", fieldId: "api-key-scopes", children: [
          /* @__PURE__ */ H(
            tt,
            {
              id: "api-key-scopes",
              value: f,
              onChange: (y, I) => p(I),
              placeholder: "read, write"
            }
          ),
          /* @__PURE__ */ H(pn, { children: /* @__PURE__ */ H(mn, { children: "Optional, comma-separated list of scopes." }) })
        ] }),
        /* @__PURE__ */ Se(Et, { label: "Expires at", fieldId: "api-key-expires", children: [
          /* @__PURE__ */ H(
            tt,
            {
              id: "api-key-expires",
              type: "datetime-local",
              value: h,
              onChange: (y, I) => v(I)
            }
          ),
          /* @__PURE__ */ H(pn, { children: /* @__PURE__ */ H(mn, { children: "Leave empty for no expiry." }) })
        ] })
      ] })
    }
  );
}, Gm = ({
  apiKey: e,
  isOpen: t,
  onClose: n
}) => /* @__PURE__ */ Se(
  Ye,
  {
    title: "API key created",
    variant: Ua.medium,
    isOpen: t,
    onClose: n,
    actions: [
      /* @__PURE__ */ H(oe, { variant: "primary", onClick: n, children: "Done" }, "close")
    ],
    children: [
      /* @__PURE__ */ H(Sn, { isInline: !0, variant: "warning", title: "Copy this key now", children: "For security reasons you will not be able to see it again." }),
      /* @__PURE__ */ H(en, { isReadOnly: !0, isCode: !0, variant: "expansion", children: e ?? "" })
    ]
  }
), Km = ({
  apiKey: e,
  isOpen: t,
  isSubmitting: n,
  onClose: r,
  onConfirm: a
}) => /* @__PURE__ */ Se(
  Ye,
  {
    title: "Revoke API key",
    isOpen: t,
    onClose: r,
    actions: [
      /* @__PURE__ */ H(
        oe,
        {
          variant: "danger",
          isDisabled: !e || n,
          isLoading: n,
          onClick: () => e && a(e),
          children: "Revoke"
        },
        "confirm"
      ),
      /* @__PURE__ */ H(oe, { variant: "link", onClick: r, children: "Cancel" }, "cancel")
    ],
    children: [
      "Are you sure you want to revoke ",
      /* @__PURE__ */ H("strong", { children: e == null ? void 0 : e.name }),
      "? This action cannot be undone."
    ]
  }
), Xm = () => {
  const t = window.location.pathname.match(/\/realms\/([^/]+)/);
  if (t != null && t[1])
    return t[1];
  const n = Ym();
  return (n == null ? void 0 : n.realm) ?? "";
}, Ym = () => {
  try {
    const e = document.getElementById("environment");
    return e ? JSON.parse(e.textContent ?? "{}") : null;
  } catch {
    return null;
  }
}, Si = () => {
  const e = Xm();
  return `${window.location.origin}/realms/${e}/api-keys`;
}, ki = (e, t) => e().then((n) => {
  const r = {
    Accept: "application/json",
    ...(t == null ? void 0 : t.headers) ?? {}
  };
  return n && (r.Authorization = `Bearer ${n}`), {
    credentials: "include",
    ...t,
    headers: r
  };
}), Jm = async (e) => {
  const t = await fetch(Si(), await ki(e));
  if (!t.ok)
    throw new Error(`Failed to load API keys (${t.status})`);
  const n = await t.json();
  return { keys: Array.isArray(n) ? n : n.keys ?? [] };
}, Zm = async (e, t) => {
  const n = await fetch(
    Si(),
    await ki(e, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t)
    })
  );
  if (!n.ok) {
    const r = await n.text();
    throw new Error(r || `Failed to create API key (${n.status})`);
  }
  return await n.json();
}, Qm = async (e, t) => {
  const n = await fetch(
    `${Si()}/${t}`,
    await ki(e, { method: "DELETE" })
  );
  if (!n.ok && n.status !== 204) {
    const r = await n.text();
    throw new Error(r || `Failed to revoke API key (${n.status})`);
  }
}, eh = () => {
  const e = window.kcContext;
  return Array.isArray(e == null ? void 0 : e.clients) ? e.clients.map((t) => typeof t == "string" ? t : t.clientId).filter((t) => !!t) : Array.isArray(e == null ? void 0 : e.clientIds) ? e.clientIds : [];
}, th = ({ getToken: e }) => {
  const [t, n] = pe([]), [r, a] = pe(!0), [i, o] = pe(null), [l, c] = pe(!1), [d, u] = pe(null), [f, p] = pe(!1), [h, v] = pe(null), [m, x] = pe(!1), _ = ii(() => eh(), []), y = Gc(async () => {
    a(!0), o(null);
    try {
      const R = await Jm(e);
      n(R.keys);
    } catch (R) {
      o(R instanceof Error ? R.message : "Failed to load API keys");
    } finally {
      a(!1);
    }
  }, [e]);
  return Ct(() => {
    y();
  }, [y]), /* @__PURE__ */ Se(ic, { padding: { default: "padding" }, children: [
    /* @__PURE__ */ Se(sc, { hasGutter: !0, children: [
      /* @__PURE__ */ H(Dt, { children: /* @__PURE__ */ H(hi, { headingLevel: "h1", children: "API Keys" }) }),
      /* @__PURE__ */ H(Dt, { children: /* @__PURE__ */ H(
        oe,
        {
          variant: "primary",
          icon: /* @__PURE__ */ H(up, {}),
          onClick: () => c(!0),
          children: "Create API key"
        }
      ) }),
      i && /* @__PURE__ */ H(Dt, { children: /* @__PURE__ */ H(Sn, { variant: "danger", title: "Something went wrong", children: i }) }),
      /* @__PURE__ */ H(Dt, { children: r ? /* @__PURE__ */ H(oc, { children: /* @__PURE__ */ H(bi, { size: "xl" }) }) : /* @__PURE__ */ H(zm, { apiKeys: t, onRevoke: v }) })
    ] }),
    /* @__PURE__ */ H(
      Um,
      {
        isOpen: l,
        isSubmitting: f,
        clients: _,
        onClose: () => c(!1),
        onCreate: async (R) => {
          p(!0), o(null);
          try {
            const L = await Zm(e, R);
            u(L.key), c(!1), await y();
          } catch (L) {
            o(L instanceof Error ? L.message : "Failed to create API key");
          } finally {
            p(!1);
          }
        }
      }
    ),
    /* @__PURE__ */ H(
      Gm,
      {
        isOpen: !!d,
        apiKey: d,
        onClose: () => u(null)
      }
    ),
    /* @__PURE__ */ H(
      Km,
      {
        isOpen: !!h,
        apiKey: h,
        isSubmitting: m,
        onClose: () => v(null),
        onConfirm: async (R) => {
          x(!0), o(null);
          try {
            await Qm(e, R.id), v(null), await y();
          } catch (L) {
            o(L instanceof Error ? L.message : "Failed to revoke API key");
          } finally {
            x(!1);
          }
        }
      }
    )
  ] });
};
function ai(e) {
  var n;
  if (!e) return;
  const t = (n = e.memoizedProps) == null ? void 0 : n.value;
  return t && typeof t == "object" && "keycloak" in t && t.keycloak ? t.keycloak : ai(e.child) ?? ai(e.sibling);
}
function nh() {
  try {
    const e = document.getElementById("app");
    if (!e) return;
    const t = Object.keys(e).find(
      (r) => r.startsWith("__reactFiber") || r.startsWith("__reactInternalInstance")
    );
    if (!t) return;
    const n = e[t];
    return ai(n);
  } catch {
    return;
  }
}
async function rh() {
  var t;
  const e = nh();
  if (!e)
    return console.warn("[api-keys] Could not find Keycloak instance in React fiber tree"), "";
  if (e.updateToken)
    try {
      await e.updateToken(5);
    } catch {
      (t = e.login) == null || t.call(e);
    }
  return e.token ?? "";
}
const sh = () => /* @__PURE__ */ H(th, { getToken: rh });
export {
  sh as default
};
//# sourceMappingURL=api-keys.js.map
