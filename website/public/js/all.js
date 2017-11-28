/*!
 * imagesLoaded PACKAGED v4.1.3
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

!function (e, t) {
  "function" == typeof define && define.amd ? define("ev-emitter/ev-emitter", t) : "object" == typeof module && module.exports ? module.exports = t() : e.EvEmitter = t();
}("undefined" != typeof window ? window : this, function () {
  function e() {}var t = e.prototype;return t.on = function (e, t) {
    if (e && t) {
      var i = this._events = this._events || {},
          n = i[e] = i[e] || [];return -1 == n.indexOf(t) && n.push(t), this;
    }
  }, t.once = function (e, t) {
    if (e && t) {
      this.on(e, t);var i = this._onceEvents = this._onceEvents || {},
          n = i[e] = i[e] || {};return n[t] = !0, this;
    }
  }, t.off = function (e, t) {
    var i = this._events && this._events[e];if (i && i.length) {
      var n = i.indexOf(t);return -1 != n && i.splice(n, 1), this;
    }
  }, t.emitEvent = function (e, t) {
    var i = this._events && this._events[e];if (i && i.length) {
      var n = 0,
          o = i[n];t = t || [];for (var r = this._onceEvents && this._onceEvents[e]; o;) {
        var s = r && r[o];s && (this.off(e, o), delete r[o]), o.apply(this, t), n += s ? 0 : 1, o = i[n];
      }return this;
    }
  }, t.allOff = t.removeAllListeners = function () {
    delete this._events, delete this._onceEvents;
  }, e;
}), function (e, t) {
  "use strict";
  "function" == typeof define && define.amd ? define(["ev-emitter/ev-emitter"], function (i) {
    return t(e, i);
  }) : "object" == typeof module && module.exports ? module.exports = t(e, require("ev-emitter")) : e.imagesLoaded = t(e, e.EvEmitter);
}("undefined" != typeof window ? window : this, function (e, t) {
  function i(e, t) {
    for (var i in t) e[i] = t[i];return e;
  }function n(e) {
    var t = [];if (Array.isArray(e)) t = e;else if ("number" == typeof e.length) for (var i = 0; i < e.length; i++) t.push(e[i]);else t.push(e);return t;
  }function o(e, t, r) {
    return this instanceof o ? ("string" == typeof e && (e = document.querySelectorAll(e)), this.elements = n(e), this.options = i({}, this.options), "function" == typeof t ? r = t : i(this.options, t), r && this.on("always", r), this.getImages(), h && (this.jqDeferred = new h.Deferred()), void setTimeout(function () {
      this.check();
    }.bind(this))) : new o(e, t, r);
  }function r(e) {
    this.img = e;
  }function s(e, t) {
    this.url = e, this.element = t, this.img = new Image();
  }var h = e.jQuery,
      a = e.console;o.prototype = Object.create(t.prototype), o.prototype.options = {}, o.prototype.getImages = function () {
    this.images = [], this.elements.forEach(this.addElementImages, this);
  }, o.prototype.addElementImages = function (e) {
    "IMG" == e.nodeName && this.addImage(e), this.options.background === !0 && this.addElementBackgroundImages(e);var t = e.nodeType;if (t && d[t]) {
      for (var i = e.querySelectorAll("img"), n = 0; n < i.length; n++) {
        var o = i[n];this.addImage(o);
      }if ("string" == typeof this.options.background) {
        var r = e.querySelectorAll(this.options.background);for (n = 0; n < r.length; n++) {
          var s = r[n];this.addElementBackgroundImages(s);
        }
      }
    }
  };var d = { 1: !0, 9: !0, 11: !0 };return o.prototype.addElementBackgroundImages = function (e) {
    var t = getComputedStyle(e);if (t) for (var i = /url\((['"])?(.*?)\1\)/gi, n = i.exec(t.backgroundImage); null !== n;) {
      var o = n && n[2];o && this.addBackground(o, e), n = i.exec(t.backgroundImage);
    }
  }, o.prototype.addImage = function (e) {
    var t = new r(e);this.images.push(t);
  }, o.prototype.addBackground = function (e, t) {
    var i = new s(e, t);this.images.push(i);
  }, o.prototype.check = function () {
    function e(e, i, n) {
      setTimeout(function () {
        t.progress(e, i, n);
      });
    }var t = this;return this.progressedCount = 0, this.hasAnyBroken = !1, this.images.length ? void this.images.forEach(function (t) {
      t.once("progress", e), t.check();
    }) : void this.complete();
  }, o.prototype.progress = function (e, t, i) {
    this.progressedCount++, this.hasAnyBroken = this.hasAnyBroken || !e.isLoaded, this.emitEvent("progress", [this, e, t]), this.jqDeferred && this.jqDeferred.notify && this.jqDeferred.notify(this, e), this.progressedCount == this.images.length && this.complete(), this.options.debug && a && a.log("progress: " + i, e, t);
  }, o.prototype.complete = function () {
    var e = this.hasAnyBroken ? "fail" : "done";if (this.isComplete = !0, this.emitEvent(e, [this]), this.emitEvent("always", [this]), this.jqDeferred) {
      var t = this.hasAnyBroken ? "reject" : "resolve";this.jqDeferred[t](this);
    }
  }, r.prototype = Object.create(t.prototype), r.prototype.check = function () {
    var e = this.getIsImageComplete();return e ? void this.confirm(0 !== this.img.naturalWidth, "naturalWidth") : (this.proxyImage = new Image(), this.proxyImage.addEventListener("load", this), this.proxyImage.addEventListener("error", this), this.img.addEventListener("load", this), this.img.addEventListener("error", this), void (this.proxyImage.src = this.img.src));
  }, r.prototype.getIsImageComplete = function () {
    return this.img.complete && void 0 !== this.img.naturalWidth;
  }, r.prototype.confirm = function (e, t) {
    this.isLoaded = e, this.emitEvent("progress", [this, this.img, t]);
  }, r.prototype.handleEvent = function (e) {
    var t = "on" + e.type;this[t] && this[t](e);
  }, r.prototype.onload = function () {
    this.confirm(!0, "onload"), this.unbindEvents();
  }, r.prototype.onerror = function () {
    this.confirm(!1, "onerror"), this.unbindEvents();
  }, r.prototype.unbindEvents = function () {
    this.proxyImage.removeEventListener("load", this), this.proxyImage.removeEventListener("error", this), this.img.removeEventListener("load", this), this.img.removeEventListener("error", this);
  }, s.prototype = Object.create(r.prototype), s.prototype.check = function () {
    this.img.addEventListener("load", this), this.img.addEventListener("error", this), this.img.src = this.url;var e = this.getIsImageComplete();e && (this.confirm(0 !== this.img.naturalWidth, "naturalWidth"), this.unbindEvents());
  }, s.prototype.unbindEvents = function () {
    this.img.removeEventListener("load", this), this.img.removeEventListener("error", this);
  }, s.prototype.confirm = function (e, t) {
    this.isLoaded = e, this.emitEvent("progress", [this, this.element, t]);
  }, o.makeJQueryPlugin = function (t) {
    t = t || e.jQuery, t && (h = t, h.fn.imagesLoaded = function (e, t) {
      var i = new o(this, e, t);return i.jqDeferred.promise(h(this));
    });
  }, o.makeJQueryPlugin(), o;
});
/*!
 * Isotope PACKAGED v3.0.4
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * http://isotope.metafizzy.co
 * Copyright 2017 Metafizzy
 */

!function (t, e) {
  "function" == typeof define && define.amd ? define("jquery-bridget/jquery-bridget", ["jquery"], function (i) {
    return e(t, i);
  }) : "object" == typeof module && module.exports ? module.exports = e(t, require("jquery")) : t.jQueryBridget = e(t, t.jQuery);
}(window, function (t, e) {
  "use strict";
  function i(i, s, a) {
    function u(t, e, o) {
      var n,
          s = "$()." + i + '("' + e + '")';return t.each(function (t, u) {
        var h = a.data(u, i);if (!h) return void r(i + " not initialized. Cannot call methods, i.e. " + s);var d = h[e];if (!d || "_" == e.charAt(0)) return void r(s + " is not a valid method");var l = d.apply(h, o);n = void 0 === n ? l : n;
      }), void 0 !== n ? n : t;
    }function h(t, e) {
      t.each(function (t, o) {
        var n = a.data(o, i);n ? (n.option(e), n._init()) : (n = new s(o, e), a.data(o, i, n));
      });
    }a = a || e || t.jQuery, a && (s.prototype.option || (s.prototype.option = function (t) {
      a.isPlainObject(t) && (this.options = a.extend(!0, this.options, t));
    }), a.fn[i] = function (t) {
      if ("string" == typeof t) {
        var e = n.call(arguments, 1);return u(this, t, e);
      }return h(this, t), this;
    }, o(a));
  }function o(t) {
    !t || t && t.bridget || (t.bridget = i);
  }var n = Array.prototype.slice,
      s = t.console,
      r = "undefined" == typeof s ? function () {} : function (t) {
    s.error(t);
  };return o(e || t.jQuery), i;
}), function (t, e) {
  "function" == typeof define && define.amd ? define("ev-emitter/ev-emitter", e) : "object" == typeof module && module.exports ? module.exports = e() : t.EvEmitter = e();
}("undefined" != typeof window ? window : this, function () {
  function t() {}var e = t.prototype;return e.on = function (t, e) {
    if (t && e) {
      var i = this._events = this._events || {},
          o = i[t] = i[t] || [];return o.indexOf(e) == -1 && o.push(e), this;
    }
  }, e.once = function (t, e) {
    if (t && e) {
      this.on(t, e);var i = this._onceEvents = this._onceEvents || {},
          o = i[t] = i[t] || {};return o[e] = !0, this;
    }
  }, e.off = function (t, e) {
    var i = this._events && this._events[t];if (i && i.length) {
      var o = i.indexOf(e);return o != -1 && i.splice(o, 1), this;
    }
  }, e.emitEvent = function (t, e) {
    var i = this._events && this._events[t];if (i && i.length) {
      var o = 0,
          n = i[o];e = e || [];for (var s = this._onceEvents && this._onceEvents[t]; n;) {
        var r = s && s[n];r && (this.off(t, n), delete s[n]), n.apply(this, e), o += r ? 0 : 1, n = i[o];
      }return this;
    }
  }, t;
}), function (t, e) {
  "use strict";
  "function" == typeof define && define.amd ? define("get-size/get-size", [], function () {
    return e();
  }) : "object" == typeof module && module.exports ? module.exports = e() : t.getSize = e();
}(window, function () {
  "use strict";
  function t(t) {
    var e = parseFloat(t),
        i = t.indexOf("%") == -1 && !isNaN(e);return i && e;
  }function e() {}function i() {
    for (var t = { width: 0, height: 0, innerWidth: 0, innerHeight: 0, outerWidth: 0, outerHeight: 0 }, e = 0; e < h; e++) {
      var i = u[e];t[i] = 0;
    }return t;
  }function o(t) {
    var e = getComputedStyle(t);return e || a("Style returned " + e + ". Are you running this code in a hidden iframe on Firefox? See http://bit.ly/getsizebug1"), e;
  }function n() {
    if (!d) {
      d = !0;var e = document.createElement("div");e.style.width = "200px", e.style.padding = "1px 2px 3px 4px", e.style.borderStyle = "solid", e.style.borderWidth = "1px 2px 3px 4px", e.style.boxSizing = "border-box";var i = document.body || document.documentElement;i.appendChild(e);var n = o(e);s.isBoxSizeOuter = r = 200 == t(n.width), i.removeChild(e);
    }
  }function s(e) {
    if (n(), "string" == typeof e && (e = document.querySelector(e)), e && "object" == typeof e && e.nodeType) {
      var s = o(e);if ("none" == s.display) return i();var a = {};a.width = e.offsetWidth, a.height = e.offsetHeight;for (var d = a.isBorderBox = "border-box" == s.boxSizing, l = 0; l < h; l++) {
        var f = u[l],
            c = s[f],
            m = parseFloat(c);a[f] = isNaN(m) ? 0 : m;
      }var p = a.paddingLeft + a.paddingRight,
          y = a.paddingTop + a.paddingBottom,
          g = a.marginLeft + a.marginRight,
          v = a.marginTop + a.marginBottom,
          _ = a.borderLeftWidth + a.borderRightWidth,
          I = a.borderTopWidth + a.borderBottomWidth,
          z = d && r,
          x = t(s.width);x !== !1 && (a.width = x + (z ? 0 : p + _));var S = t(s.height);return S !== !1 && (a.height = S + (z ? 0 : y + I)), a.innerWidth = a.width - (p + _), a.innerHeight = a.height - (y + I), a.outerWidth = a.width + g, a.outerHeight = a.height + v, a;
    }
  }var r,
      a = "undefined" == typeof console ? e : function (t) {
    console.error(t);
  },
      u = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "marginLeft", "marginRight", "marginTop", "marginBottom", "borderLeftWidth", "borderRightWidth", "borderTopWidth", "borderBottomWidth"],
      h = u.length,
      d = !1;return s;
}), function (t, e) {
  "use strict";
  "function" == typeof define && define.amd ? define("desandro-matches-selector/matches-selector", e) : "object" == typeof module && module.exports ? module.exports = e() : t.matchesSelector = e();
}(window, function () {
  "use strict";
  var t = function () {
    var t = window.Element.prototype;if (t.matches) return "matches";if (t.matchesSelector) return "matchesSelector";for (var e = ["webkit", "moz", "ms", "o"], i = 0; i < e.length; i++) {
      var o = e[i],
          n = o + "MatchesSelector";if (t[n]) return n;
    }
  }();return function (e, i) {
    return e[t](i);
  };
}), function (t, e) {
  "function" == typeof define && define.amd ? define("fizzy-ui-utils/utils", ["desandro-matches-selector/matches-selector"], function (i) {
    return e(t, i);
  }) : "object" == typeof module && module.exports ? module.exports = e(t, require("desandro-matches-selector")) : t.fizzyUIUtils = e(t, t.matchesSelector);
}(window, function (t, e) {
  var i = {};i.extend = function (t, e) {
    for (var i in e) t[i] = e[i];return t;
  }, i.modulo = function (t, e) {
    return (t % e + e) % e;
  }, i.makeArray = function (t) {
    var e = [];if (Array.isArray(t)) e = t;else if (t && "object" == typeof t && "number" == typeof t.length) for (var i = 0; i < t.length; i++) e.push(t[i]);else e.push(t);return e;
  }, i.removeFrom = function (t, e) {
    var i = t.indexOf(e);i != -1 && t.splice(i, 1);
  }, i.getParent = function (t, i) {
    for (; t.parentNode && t != document.body;) if (t = t.parentNode, e(t, i)) return t;
  }, i.getQueryElement = function (t) {
    return "string" == typeof t ? document.querySelector(t) : t;
  }, i.handleEvent = function (t) {
    var e = "on" + t.type;this[e] && this[e](t);
  }, i.filterFindElements = function (t, o) {
    t = i.makeArray(t);var n = [];return t.forEach(function (t) {
      if (t instanceof HTMLElement) {
        if (!o) return void n.push(t);e(t, o) && n.push(t);for (var i = t.querySelectorAll(o), s = 0; s < i.length; s++) n.push(i[s]);
      }
    }), n;
  }, i.debounceMethod = function (t, e, i) {
    var o = t.prototype[e],
        n = e + "Timeout";t.prototype[e] = function () {
      var t = this[n];t && clearTimeout(t);var e = arguments,
          s = this;this[n] = setTimeout(function () {
        o.apply(s, e), delete s[n];
      }, i || 100);
    };
  }, i.docReady = function (t) {
    var e = document.readyState;"complete" == e || "interactive" == e ? setTimeout(t) : document.addEventListener("DOMContentLoaded", t);
  }, i.toDashed = function (t) {
    return t.replace(/(.)([A-Z])/g, function (t, e, i) {
      return e + "-" + i;
    }).toLowerCase();
  };var o = t.console;return i.htmlInit = function (e, n) {
    i.docReady(function () {
      var s = i.toDashed(n),
          r = "data-" + s,
          a = document.querySelectorAll("[" + r + "]"),
          u = document.querySelectorAll(".js-" + s),
          h = i.makeArray(a).concat(i.makeArray(u)),
          d = r + "-options",
          l = t.jQuery;h.forEach(function (t) {
        var i,
            s = t.getAttribute(r) || t.getAttribute(d);try {
          i = s && JSON.parse(s);
        } catch (a) {
          return void (o && o.error("Error parsing " + r + " on " + t.className + ": " + a));
        }var u = new e(t, i);l && l.data(t, n, u);
      });
    });
  }, i;
}), function (t, e) {
  "function" == typeof define && define.amd ? define("outlayer/item", ["ev-emitter/ev-emitter", "get-size/get-size"], e) : "object" == typeof module && module.exports ? module.exports = e(require("ev-emitter"), require("get-size")) : (t.Outlayer = {}, t.Outlayer.Item = e(t.EvEmitter, t.getSize));
}(window, function (t, e) {
  "use strict";
  function i(t) {
    for (var e in t) return !1;return e = null, !0;
  }function o(t, e) {
    t && (this.element = t, this.layout = e, this.position = { x: 0, y: 0 }, this._create());
  }function n(t) {
    return t.replace(/([A-Z])/g, function (t) {
      return "-" + t.toLowerCase();
    });
  }var s = document.documentElement.style,
      r = "string" == typeof s.transition ? "transition" : "WebkitTransition",
      a = "string" == typeof s.transform ? "transform" : "WebkitTransform",
      u = { WebkitTransition: "webkitTransitionEnd", transition: "transitionend" }[r],
      h = { transform: a, transition: r, transitionDuration: r + "Duration", transitionProperty: r + "Property", transitionDelay: r + "Delay" },
      d = o.prototype = Object.create(t.prototype);d.constructor = o, d._create = function () {
    this._transn = { ingProperties: {}, clean: {}, onEnd: {} }, this.css({ position: "absolute" });
  }, d.handleEvent = function (t) {
    var e = "on" + t.type;this[e] && this[e](t);
  }, d.getSize = function () {
    this.size = e(this.element);
  }, d.css = function (t) {
    var e = this.element.style;for (var i in t) {
      var o = h[i] || i;e[o] = t[i];
    }
  }, d.getPosition = function () {
    var t = getComputedStyle(this.element),
        e = this.layout._getOption("originLeft"),
        i = this.layout._getOption("originTop"),
        o = t[e ? "left" : "right"],
        n = t[i ? "top" : "bottom"],
        s = this.layout.size,
        r = o.indexOf("%") != -1 ? parseFloat(o) / 100 * s.width : parseInt(o, 10),
        a = n.indexOf("%") != -1 ? parseFloat(n) / 100 * s.height : parseInt(n, 10);r = isNaN(r) ? 0 : r, a = isNaN(a) ? 0 : a, r -= e ? s.paddingLeft : s.paddingRight, a -= i ? s.paddingTop : s.paddingBottom, this.position.x = r, this.position.y = a;
  }, d.layoutPosition = function () {
    var t = this.layout.size,
        e = {},
        i = this.layout._getOption("originLeft"),
        o = this.layout._getOption("originTop"),
        n = i ? "paddingLeft" : "paddingRight",
        s = i ? "left" : "right",
        r = i ? "right" : "left",
        a = this.position.x + t[n];e[s] = this.getXValue(a), e[r] = "";var u = o ? "paddingTop" : "paddingBottom",
        h = o ? "top" : "bottom",
        d = o ? "bottom" : "top",
        l = this.position.y + t[u];e[h] = this.getYValue(l), e[d] = "", this.css(e), this.emitEvent("layout", [this]);
  }, d.getXValue = function (t) {
    var e = this.layout._getOption("horizontal");return this.layout.options.percentPosition && !e ? t / this.layout.size.width * 100 + "%" : t + "px";
  }, d.getYValue = function (t) {
    var e = this.layout._getOption("horizontal");return this.layout.options.percentPosition && e ? t / this.layout.size.height * 100 + "%" : t + "px";
  }, d._transitionTo = function (t, e) {
    this.getPosition();var i = this.position.x,
        o = this.position.y,
        n = parseInt(t, 10),
        s = parseInt(e, 10),
        r = n === this.position.x && s === this.position.y;if (this.setPosition(t, e), r && !this.isTransitioning) return void this.layoutPosition();var a = t - i,
        u = e - o,
        h = {};h.transform = this.getTranslate(a, u), this.transition({ to: h, onTransitionEnd: { transform: this.layoutPosition }, isCleaning: !0 });
  }, d.getTranslate = function (t, e) {
    var i = this.layout._getOption("originLeft"),
        o = this.layout._getOption("originTop");return t = i ? t : -t, e = o ? e : -e, "translate3d(" + t + "px, " + e + "px, 0)";
  }, d.goTo = function (t, e) {
    this.setPosition(t, e), this.layoutPosition();
  }, d.moveTo = d._transitionTo, d.setPosition = function (t, e) {
    this.position.x = parseInt(t, 10), this.position.y = parseInt(e, 10);
  }, d._nonTransition = function (t) {
    this.css(t.to), t.isCleaning && this._removeStyles(t.to);for (var e in t.onTransitionEnd) t.onTransitionEnd[e].call(this);
  }, d.transition = function (t) {
    if (!parseFloat(this.layout.options.transitionDuration)) return void this._nonTransition(t);var e = this._transn;for (var i in t.onTransitionEnd) e.onEnd[i] = t.onTransitionEnd[i];for (i in t.to) e.ingProperties[i] = !0, t.isCleaning && (e.clean[i] = !0);if (t.from) {
      this.css(t.from);var o = this.element.offsetHeight;o = null;
    }this.enableTransition(t.to), this.css(t.to), this.isTransitioning = !0;
  };var l = "opacity," + n(a);d.enableTransition = function () {
    if (!this.isTransitioning) {
      var t = this.layout.options.transitionDuration;t = "number" == typeof t ? t + "ms" : t, this.css({ transitionProperty: l, transitionDuration: t, transitionDelay: this.staggerDelay || 0 }), this.element.addEventListener(u, this, !1);
    }
  }, d.onwebkitTransitionEnd = function (t) {
    this.ontransitionend(t);
  }, d.onotransitionend = function (t) {
    this.ontransitionend(t);
  };var f = { "-webkit-transform": "transform" };d.ontransitionend = function (t) {
    if (t.target === this.element) {
      var e = this._transn,
          o = f[t.propertyName] || t.propertyName;if (delete e.ingProperties[o], i(e.ingProperties) && this.disableTransition(), o in e.clean && (this.element.style[t.propertyName] = "", delete e.clean[o]), o in e.onEnd) {
        var n = e.onEnd[o];n.call(this), delete e.onEnd[o];
      }this.emitEvent("transitionEnd", [this]);
    }
  }, d.disableTransition = function () {
    this.removeTransitionStyles(), this.element.removeEventListener(u, this, !1), this.isTransitioning = !1;
  }, d._removeStyles = function (t) {
    var e = {};for (var i in t) e[i] = "";this.css(e);
  };var c = { transitionProperty: "", transitionDuration: "", transitionDelay: "" };return d.removeTransitionStyles = function () {
    this.css(c);
  }, d.stagger = function (t) {
    t = isNaN(t) ? 0 : t, this.staggerDelay = t + "ms";
  }, d.removeElem = function () {
    this.element.parentNode.removeChild(this.element), this.css({ display: "" }), this.emitEvent("remove", [this]);
  }, d.remove = function () {
    return r && parseFloat(this.layout.options.transitionDuration) ? (this.once("transitionEnd", function () {
      this.removeElem();
    }), void this.hide()) : void this.removeElem();
  }, d.reveal = function () {
    delete this.isHidden, this.css({ display: "" });var t = this.layout.options,
        e = {},
        i = this.getHideRevealTransitionEndProperty("visibleStyle");e[i] = this.onRevealTransitionEnd, this.transition({ from: t.hiddenStyle, to: t.visibleStyle, isCleaning: !0, onTransitionEnd: e });
  }, d.onRevealTransitionEnd = function () {
    this.isHidden || this.emitEvent("reveal");
  }, d.getHideRevealTransitionEndProperty = function (t) {
    var e = this.layout.options[t];if (e.opacity) return "opacity";for (var i in e) return i;
  }, d.hide = function () {
    this.isHidden = !0, this.css({ display: "" });var t = this.layout.options,
        e = {},
        i = this.getHideRevealTransitionEndProperty("hiddenStyle");e[i] = this.onHideTransitionEnd, this.transition({ from: t.visibleStyle, to: t.hiddenStyle, isCleaning: !0, onTransitionEnd: e });
  }, d.onHideTransitionEnd = function () {
    this.isHidden && (this.css({ display: "none" }), this.emitEvent("hide"));
  }, d.destroy = function () {
    this.css({ position: "", left: "", right: "", top: "", bottom: "", transition: "", transform: "" });
  }, o;
}), function (t, e) {
  "use strict";
  "function" == typeof define && define.amd ? define("outlayer/outlayer", ["ev-emitter/ev-emitter", "get-size/get-size", "fizzy-ui-utils/utils", "./item"], function (i, o, n, s) {
    return e(t, i, o, n, s);
  }) : "object" == typeof module && module.exports ? module.exports = e(t, require("ev-emitter"), require("get-size"), require("fizzy-ui-utils"), require("./item")) : t.Outlayer = e(t, t.EvEmitter, t.getSize, t.fizzyUIUtils, t.Outlayer.Item);
}(window, function (t, e, i, o, n) {
  "use strict";
  function s(t, e) {
    var i = o.getQueryElement(t);if (!i) return void (u && u.error("Bad element for " + this.constructor.namespace + ": " + (i || t)));this.element = i, h && (this.$element = h(this.element)), this.options = o.extend({}, this.constructor.defaults), this.option(e);var n = ++l;this.element.outlayerGUID = n, f[n] = this, this._create();var s = this._getOption("initLayout");s && this.layout();
  }function r(t) {
    function e() {
      t.apply(this, arguments);
    }return e.prototype = Object.create(t.prototype), e.prototype.constructor = e, e;
  }function a(t) {
    if ("number" == typeof t) return t;var e = t.match(/(^\d*\.?\d*)(\w*)/),
        i = e && e[1],
        o = e && e[2];if (!i.length) return 0;i = parseFloat(i);var n = m[o] || 1;return i * n;
  }var u = t.console,
      h = t.jQuery,
      d = function () {},
      l = 0,
      f = {};s.namespace = "outlayer", s.Item = n, s.defaults = { containerStyle: { position: "relative" }, initLayout: !0, originLeft: !0, originTop: !0, resize: !0, resizeContainer: !0, transitionDuration: "0.4s", hiddenStyle: { opacity: 0, transform: "scale(0.001)" }, visibleStyle: { opacity: 1, transform: "scale(1)" } };var c = s.prototype;o.extend(c, e.prototype), c.option = function (t) {
    o.extend(this.options, t);
  }, c._getOption = function (t) {
    var e = this.constructor.compatOptions[t];return e && void 0 !== this.options[e] ? this.options[e] : this.options[t];
  }, s.compatOptions = { initLayout: "isInitLayout", horizontal: "isHorizontal", layoutInstant: "isLayoutInstant", originLeft: "isOriginLeft", originTop: "isOriginTop", resize: "isResizeBound", resizeContainer: "isResizingContainer" }, c._create = function () {
    this.reloadItems(), this.stamps = [], this.stamp(this.options.stamp), o.extend(this.element.style, this.options.containerStyle);var t = this._getOption("resize");t && this.bindResize();
  }, c.reloadItems = function () {
    this.items = this._itemize(this.element.children);
  }, c._itemize = function (t) {
    for (var e = this._filterFindItemElements(t), i = this.constructor.Item, o = [], n = 0; n < e.length; n++) {
      var s = e[n],
          r = new i(s, this);o.push(r);
    }return o;
  }, c._filterFindItemElements = function (t) {
    return o.filterFindElements(t, this.options.itemSelector);
  }, c.getItemElements = function () {
    return this.items.map(function (t) {
      return t.element;
    });
  }, c.layout = function () {
    this._resetLayout(), this._manageStamps();var t = this._getOption("layoutInstant"),
        e = void 0 !== t ? t : !this._isLayoutInited;this.layoutItems(this.items, e), this._isLayoutInited = !0;
  }, c._init = c.layout, c._resetLayout = function () {
    this.getSize();
  }, c.getSize = function () {
    this.size = i(this.element);
  }, c._getMeasurement = function (t, e) {
    var o,
        n = this.options[t];n ? ("string" == typeof n ? o = this.element.querySelector(n) : n instanceof HTMLElement && (o = n), this[t] = o ? i(o)[e] : n) : this[t] = 0;
  }, c.layoutItems = function (t, e) {
    t = this._getItemsForLayout(t), this._layoutItems(t, e), this._postLayout();
  }, c._getItemsForLayout = function (t) {
    return t.filter(function (t) {
      return !t.isIgnored;
    });
  }, c._layoutItems = function (t, e) {
    if (this._emitCompleteOnItems("layout", t), t && t.length) {
      var i = [];t.forEach(function (t) {
        var o = this._getItemLayoutPosition(t);o.item = t, o.isInstant = e || t.isLayoutInstant, i.push(o);
      }, this), this._processLayoutQueue(i);
    }
  }, c._getItemLayoutPosition = function () {
    return { x: 0, y: 0 };
  }, c._processLayoutQueue = function (t) {
    this.updateStagger(), t.forEach(function (t, e) {
      this._positionItem(t.item, t.x, t.y, t.isInstant, e);
    }, this);
  }, c.updateStagger = function () {
    var t = this.options.stagger;return null === t || void 0 === t ? void (this.stagger = 0) : (this.stagger = a(t), this.stagger);
  }, c._positionItem = function (t, e, i, o, n) {
    o ? t.goTo(e, i) : (t.stagger(n * this.stagger), t.moveTo(e, i));
  }, c._postLayout = function () {
    this.resizeContainer();
  }, c.resizeContainer = function () {
    var t = this._getOption("resizeContainer");if (t) {
      var e = this._getContainerSize();e && (this._setContainerMeasure(e.width, !0), this._setContainerMeasure(e.height, !1));
    }
  }, c._getContainerSize = d, c._setContainerMeasure = function (t, e) {
    if (void 0 !== t) {
      var i = this.size;i.isBorderBox && (t += e ? i.paddingLeft + i.paddingRight + i.borderLeftWidth + i.borderRightWidth : i.paddingBottom + i.paddingTop + i.borderTopWidth + i.borderBottomWidth), t = Math.max(t, 0), this.element.style[e ? "width" : "height"] = t + "px";
    }
  }, c._emitCompleteOnItems = function (t, e) {
    function i() {
      n.dispatchEvent(t + "Complete", null, [e]);
    }function o() {
      r++, r == s && i();
    }var n = this,
        s = e.length;if (!e || !s) return void i();var r = 0;e.forEach(function (e) {
      e.once(t, o);
    });
  }, c.dispatchEvent = function (t, e, i) {
    var o = e ? [e].concat(i) : i;if (this.emitEvent(t, o), h) if (this.$element = this.$element || h(this.element), e) {
      var n = h.Event(e);n.type = t, this.$element.trigger(n, i);
    } else this.$element.trigger(t, i);
  }, c.ignore = function (t) {
    var e = this.getItem(t);e && (e.isIgnored = !0);
  }, c.unignore = function (t) {
    var e = this.getItem(t);e && delete e.isIgnored;
  }, c.stamp = function (t) {
    t = this._find(t), t && (this.stamps = this.stamps.concat(t), t.forEach(this.ignore, this));
  }, c.unstamp = function (t) {
    t = this._find(t), t && t.forEach(function (t) {
      o.removeFrom(this.stamps, t), this.unignore(t);
    }, this);
  }, c._find = function (t) {
    if (t) return "string" == typeof t && (t = this.element.querySelectorAll(t)), t = o.makeArray(t);
  }, c._manageStamps = function () {
    this.stamps && this.stamps.length && (this._getBoundingRect(), this.stamps.forEach(this._manageStamp, this));
  }, c._getBoundingRect = function () {
    var t = this.element.getBoundingClientRect(),
        e = this.size;this._boundingRect = { left: t.left + e.paddingLeft + e.borderLeftWidth, top: t.top + e.paddingTop + e.borderTopWidth, right: t.right - (e.paddingRight + e.borderRightWidth), bottom: t.bottom - (e.paddingBottom + e.borderBottomWidth) };
  }, c._manageStamp = d, c._getElementOffset = function (t) {
    var e = t.getBoundingClientRect(),
        o = this._boundingRect,
        n = i(t),
        s = { left: e.left - o.left - n.marginLeft, top: e.top - o.top - n.marginTop, right: o.right - e.right - n.marginRight, bottom: o.bottom - e.bottom - n.marginBottom };return s;
  }, c.handleEvent = o.handleEvent, c.bindResize = function () {
    t.addEventListener("resize", this), this.isResizeBound = !0;
  }, c.unbindResize = function () {
    t.removeEventListener("resize", this), this.isResizeBound = !1;
  }, c.onresize = function () {
    this.resize();
  }, o.debounceMethod(s, "onresize", 100), c.resize = function () {
    this.isResizeBound && this.needsResizeLayout() && this.layout();
  }, c.needsResizeLayout = function () {
    var t = i(this.element),
        e = this.size && t;return e && t.innerWidth !== this.size.innerWidth;
  }, c.addItems = function (t) {
    var e = this._itemize(t);return e.length && (this.items = this.items.concat(e)), e;
  }, c.appended = function (t) {
    var e = this.addItems(t);e.length && (this.layoutItems(e, !0), this.reveal(e));
  }, c.prepended = function (t) {
    var e = this._itemize(t);if (e.length) {
      var i = this.items.slice(0);this.items = e.concat(i), this._resetLayout(), this._manageStamps(), this.layoutItems(e, !0), this.reveal(e), this.layoutItems(i);
    }
  }, c.reveal = function (t) {
    if (this._emitCompleteOnItems("reveal", t), t && t.length) {
      var e = this.updateStagger();t.forEach(function (t, i) {
        t.stagger(i * e), t.reveal();
      });
    }
  }, c.hide = function (t) {
    if (this._emitCompleteOnItems("hide", t), t && t.length) {
      var e = this.updateStagger();t.forEach(function (t, i) {
        t.stagger(i * e), t.hide();
      });
    }
  }, c.revealItemElements = function (t) {
    var e = this.getItems(t);this.reveal(e);
  }, c.hideItemElements = function (t) {
    var e = this.getItems(t);this.hide(e);
  }, c.getItem = function (t) {
    for (var e = 0; e < this.items.length; e++) {
      var i = this.items[e];if (i.element == t) return i;
    }
  }, c.getItems = function (t) {
    t = o.makeArray(t);var e = [];return t.forEach(function (t) {
      var i = this.getItem(t);i && e.push(i);
    }, this), e;
  }, c.remove = function (t) {
    var e = this.getItems(t);this._emitCompleteOnItems("remove", e), e && e.length && e.forEach(function (t) {
      t.remove(), o.removeFrom(this.items, t);
    }, this);
  }, c.destroy = function () {
    var t = this.element.style;t.height = "", t.position = "", t.width = "", this.items.forEach(function (t) {
      t.destroy();
    }), this.unbindResize();var e = this.element.outlayerGUID;delete f[e], delete this.element.outlayerGUID, h && h.removeData(this.element, this.constructor.namespace);
  }, s.data = function (t) {
    t = o.getQueryElement(t);var e = t && t.outlayerGUID;return e && f[e];
  }, s.create = function (t, e) {
    var i = r(s);return i.defaults = o.extend({}, s.defaults), o.extend(i.defaults, e), i.compatOptions = o.extend({}, s.compatOptions), i.namespace = t, i.data = s.data, i.Item = r(n), o.htmlInit(i, t), h && h.bridget && h.bridget(t, i), i;
  };var m = { ms: 1, s: 1e3 };return s.Item = n, s;
}), function (t, e) {
  "function" == typeof define && define.amd ? define("isotope/js/item", ["outlayer/outlayer"], e) : "object" == typeof module && module.exports ? module.exports = e(require("outlayer")) : (t.Isotope = t.Isotope || {}, t.Isotope.Item = e(t.Outlayer));
}(window, function (t) {
  "use strict";
  function e() {
    t.Item.apply(this, arguments);
  }var i = e.prototype = Object.create(t.Item.prototype),
      o = i._create;i._create = function () {
    this.id = this.layout.itemGUID++, o.call(this), this.sortData = {};
  }, i.updateSortData = function () {
    if (!this.isIgnored) {
      this.sortData.id = this.id, this.sortData["original-order"] = this.id, this.sortData.random = Math.random();var t = this.layout.options.getSortData,
          e = this.layout._sorters;for (var i in t) {
        var o = e[i];this.sortData[i] = o(this.element, this);
      }
    }
  };var n = i.destroy;return i.destroy = function () {
    n.apply(this, arguments), this.css({ display: "" });
  }, e;
}), function (t, e) {
  "function" == typeof define && define.amd ? define("isotope/js/layout-mode", ["get-size/get-size", "outlayer/outlayer"], e) : "object" == typeof module && module.exports ? module.exports = e(require("get-size"), require("outlayer")) : (t.Isotope = t.Isotope || {}, t.Isotope.LayoutMode = e(t.getSize, t.Outlayer));
}(window, function (t, e) {
  "use strict";
  function i(t) {
    this.isotope = t, t && (this.options = t.options[this.namespace], this.element = t.element, this.items = t.filteredItems, this.size = t.size);
  }var o = i.prototype,
      n = ["_resetLayout", "_getItemLayoutPosition", "_manageStamp", "_getContainerSize", "_getElementOffset", "needsResizeLayout", "_getOption"];return n.forEach(function (t) {
    o[t] = function () {
      return e.prototype[t].apply(this.isotope, arguments);
    };
  }), o.needsVerticalResizeLayout = function () {
    var e = t(this.isotope.element),
        i = this.isotope.size && e;return i && e.innerHeight != this.isotope.size.innerHeight;
  }, o._getMeasurement = function () {
    this.isotope._getMeasurement.apply(this, arguments);
  }, o.getColumnWidth = function () {
    this.getSegmentSize("column", "Width");
  }, o.getRowHeight = function () {
    this.getSegmentSize("row", "Height");
  }, o.getSegmentSize = function (t, e) {
    var i = t + e,
        o = "outer" + e;if (this._getMeasurement(i, o), !this[i]) {
      var n = this.getFirstItemSize();this[i] = n && n[o] || this.isotope.size["inner" + e];
    }
  }, o.getFirstItemSize = function () {
    var e = this.isotope.filteredItems[0];return e && e.element && t(e.element);
  }, o.layout = function () {
    this.isotope.layout.apply(this.isotope, arguments);
  }, o.getSize = function () {
    this.isotope.getSize(), this.size = this.isotope.size;
  }, i.modes = {}, i.create = function (t, e) {
    function n() {
      i.apply(this, arguments);
    }return n.prototype = Object.create(o), n.prototype.constructor = n, e && (n.options = e), n.prototype.namespace = t, i.modes[t] = n, n;
  }, i;
}), function (t, e) {
  "function" == typeof define && define.amd ? define("masonry/masonry", ["outlayer/outlayer", "get-size/get-size"], e) : "object" == typeof module && module.exports ? module.exports = e(require("outlayer"), require("get-size")) : t.Masonry = e(t.Outlayer, t.getSize);
}(window, function (t, e) {
  var i = t.create("masonry");i.compatOptions.fitWidth = "isFitWidth";var o = i.prototype;return o._resetLayout = function () {
    this.getSize(), this._getMeasurement("columnWidth", "outerWidth"), this._getMeasurement("gutter", "outerWidth"), this.measureColumns(), this.colYs = [];for (var t = 0; t < this.cols; t++) this.colYs.push(0);this.maxY = 0, this.horizontalColIndex = 0;
  }, o.measureColumns = function () {
    if (this.getContainerWidth(), !this.columnWidth) {
      var t = this.items[0],
          i = t && t.element;this.columnWidth = i && e(i).outerWidth || this.containerWidth;
    }var o = this.columnWidth += this.gutter,
        n = this.containerWidth + this.gutter,
        s = n / o,
        r = o - n % o,
        a = r && r < 1 ? "round" : "floor";s = Math[a](s), this.cols = Math.max(s, 1);
  }, o.getContainerWidth = function () {
    var t = this._getOption("fitWidth"),
        i = t ? this.element.parentNode : this.element,
        o = e(i);this.containerWidth = o && o.innerWidth;
  }, o._getItemLayoutPosition = function (t) {
    t.getSize();var e = t.size.outerWidth % this.columnWidth,
        i = e && e < 1 ? "round" : "ceil",
        o = Math[i](t.size.outerWidth / this.columnWidth);o = Math.min(o, this.cols);for (var n = this.options.horizontalOrder ? "_getHorizontalColPosition" : "_getTopColPosition", s = this[n](o, t), r = { x: this.columnWidth * s.col, y: s.y }, a = s.y + t.size.outerHeight, u = o + s.col, h = s.col; h < u; h++) this.colYs[h] = a;return r;
  }, o._getTopColPosition = function (t) {
    var e = this._getTopColGroup(t),
        i = Math.min.apply(Math, e);return { col: e.indexOf(i), y: i };
  }, o._getTopColGroup = function (t) {
    if (t < 2) return this.colYs;for (var e = [], i = this.cols + 1 - t, o = 0; o < i; o++) e[o] = this._getColGroupY(o, t);return e;
  }, o._getColGroupY = function (t, e) {
    if (e < 2) return this.colYs[t];var i = this.colYs.slice(t, t + e);return Math.max.apply(Math, i);
  }, o._getHorizontalColPosition = function (t, e) {
    var i = this.horizontalColIndex % this.cols,
        o = t > 1 && i + t > this.cols;i = o ? 0 : i;var n = e.size.outerWidth && e.size.outerHeight;return this.horizontalColIndex = n ? i + t : this.horizontalColIndex, { col: i, y: this._getColGroupY(i, t) };
  }, o._manageStamp = function (t) {
    var i = e(t),
        o = this._getElementOffset(t),
        n = this._getOption("originLeft"),
        s = n ? o.left : o.right,
        r = s + i.outerWidth,
        a = Math.floor(s / this.columnWidth);a = Math.max(0, a);var u = Math.floor(r / this.columnWidth);u -= r % this.columnWidth ? 0 : 1, u = Math.min(this.cols - 1, u);for (var h = this._getOption("originTop"), d = (h ? o.top : o.bottom) + i.outerHeight, l = a; l <= u; l++) this.colYs[l] = Math.max(d, this.colYs[l]);
  }, o._getContainerSize = function () {
    this.maxY = Math.max.apply(Math, this.colYs);var t = { height: this.maxY };return this._getOption("fitWidth") && (t.width = this._getContainerFitWidth()), t;
  }, o._getContainerFitWidth = function () {
    for (var t = 0, e = this.cols; --e && 0 === this.colYs[e];) t++;return (this.cols - t) * this.columnWidth - this.gutter;
  }, o.needsResizeLayout = function () {
    var t = this.containerWidth;return this.getContainerWidth(), t != this.containerWidth;
  }, i;
}), function (t, e) {
  "function" == typeof define && define.amd ? define("isotope/js/layout-modes/masonry", ["../layout-mode", "masonry/masonry"], e) : "object" == typeof module && module.exports ? module.exports = e(require("../layout-mode"), require("masonry-layout")) : e(t.Isotope.LayoutMode, t.Masonry);
}(window, function (t, e) {
  "use strict";
  var i = t.create("masonry"),
      o = i.prototype,
      n = { _getElementOffset: !0, layout: !0, _getMeasurement: !0 };for (var s in e.prototype) n[s] || (o[s] = e.prototype[s]);var r = o.measureColumns;o.measureColumns = function () {
    this.items = this.isotope.filteredItems, r.call(this);
  };var a = o._getOption;return o._getOption = function (t) {
    return "fitWidth" == t ? void 0 !== this.options.isFitWidth ? this.options.isFitWidth : this.options.fitWidth : a.apply(this.isotope, arguments);
  }, i;
}), function (t, e) {
  "function" == typeof define && define.amd ? define("isotope/js/layout-modes/fit-rows", ["../layout-mode"], e) : "object" == typeof exports ? module.exports = e(require("../layout-mode")) : e(t.Isotope.LayoutMode);
}(window, function (t) {
  "use strict";
  var e = t.create("fitRows"),
      i = e.prototype;return i._resetLayout = function () {
    this.x = 0, this.y = 0, this.maxY = 0, this._getMeasurement("gutter", "outerWidth");
  }, i._getItemLayoutPosition = function (t) {
    t.getSize();var e = t.size.outerWidth + this.gutter,
        i = this.isotope.size.innerWidth + this.gutter;0 !== this.x && e + this.x > i && (this.x = 0, this.y = this.maxY);var o = { x: this.x, y: this.y };return this.maxY = Math.max(this.maxY, this.y + t.size.outerHeight), this.x += e, o;
  }, i._getContainerSize = function () {
    return { height: this.maxY };
  }, e;
}), function (t, e) {
  "function" == typeof define && define.amd ? define("isotope/js/layout-modes/vertical", ["../layout-mode"], e) : "object" == typeof module && module.exports ? module.exports = e(require("../layout-mode")) : e(t.Isotope.LayoutMode);
}(window, function (t) {
  "use strict";
  var e = t.create("vertical", { horizontalAlignment: 0 }),
      i = e.prototype;return i._resetLayout = function () {
    this.y = 0;
  }, i._getItemLayoutPosition = function (t) {
    t.getSize();var e = (this.isotope.size.innerWidth - t.size.outerWidth) * this.options.horizontalAlignment,
        i = this.y;return this.y += t.size.outerHeight, { x: e, y: i };
  }, i._getContainerSize = function () {
    return { height: this.y };
  }, e;
}), function (t, e) {
  "function" == typeof define && define.amd ? define(["outlayer/outlayer", "get-size/get-size", "desandro-matches-selector/matches-selector", "fizzy-ui-utils/utils", "isotope/js/item", "isotope/js/layout-mode", "isotope/js/layout-modes/masonry", "isotope/js/layout-modes/fit-rows", "isotope/js/layout-modes/vertical"], function (i, o, n, s, r, a) {
    return e(t, i, o, n, s, r, a);
  }) : "object" == typeof module && module.exports ? module.exports = e(t, require("outlayer"), require("get-size"), require("desandro-matches-selector"), require("fizzy-ui-utils"), require("isotope/js/item"), require("isotope/js/layout-mode"), require("isotope/js/layout-modes/masonry"), require("isotope/js/layout-modes/fit-rows"), require("isotope/js/layout-modes/vertical")) : t.Isotope = e(t, t.Outlayer, t.getSize, t.matchesSelector, t.fizzyUIUtils, t.Isotope.Item, t.Isotope.LayoutMode);
}(window, function (t, e, i, o, n, s, r) {
  function a(t, e) {
    return function (i, o) {
      for (var n = 0; n < t.length; n++) {
        var s = t[n],
            r = i.sortData[s],
            a = o.sortData[s];if (r > a || r < a) {
          var u = void 0 !== e[s] ? e[s] : e,
              h = u ? 1 : -1;return (r > a ? 1 : -1) * h;
        }
      }return 0;
    };
  }var u = t.jQuery,
      h = String.prototype.trim ? function (t) {
    return t.trim();
  } : function (t) {
    return t.replace(/^\s+|\s+$/g, "");
  },
      d = e.create("isotope", { layoutMode: "masonry", isJQueryFiltering: !0, sortAscending: !0 });d.Item = s, d.LayoutMode = r;var l = d.prototype;l._create = function () {
    this.itemGUID = 0, this._sorters = {}, this._getSorters(), e.prototype._create.call(this), this.modes = {}, this.filteredItems = this.items, this.sortHistory = ["original-order"];for (var t in r.modes) this._initLayoutMode(t);
  }, l.reloadItems = function () {
    this.itemGUID = 0, e.prototype.reloadItems.call(this);
  }, l._itemize = function () {
    for (var t = e.prototype._itemize.apply(this, arguments), i = 0; i < t.length; i++) {
      var o = t[i];o.id = this.itemGUID++;
    }return this._updateItemsSortData(t), t;
  }, l._initLayoutMode = function (t) {
    var e = r.modes[t],
        i = this.options[t] || {};this.options[t] = e.options ? n.extend(e.options, i) : i, this.modes[t] = new e(this);
  }, l.layout = function () {
    return !this._isLayoutInited && this._getOption("initLayout") ? void this.arrange() : void this._layout();
  }, l._layout = function () {
    var t = this._getIsInstant();this._resetLayout(), this._manageStamps(), this.layoutItems(this.filteredItems, t), this._isLayoutInited = !0;
  }, l.arrange = function (t) {
    this.option(t), this._getIsInstant();var e = this._filter(this.items);this.filteredItems = e.matches, this._bindArrangeComplete(), this._isInstant ? this._noTransition(this._hideReveal, [e]) : this._hideReveal(e), this._sort(), this._layout();
  }, l._init = l.arrange, l._hideReveal = function (t) {
    this.reveal(t.needReveal), this.hide(t.needHide);
  }, l._getIsInstant = function () {
    var t = this._getOption("layoutInstant"),
        e = void 0 !== t ? t : !this._isLayoutInited;return this._isInstant = e, e;
  }, l._bindArrangeComplete = function () {
    function t() {
      e && i && o && n.dispatchEvent("arrangeComplete", null, [n.filteredItems]);
    }var e,
        i,
        o,
        n = this;this.once("layoutComplete", function () {
      e = !0, t();
    }), this.once("hideComplete", function () {
      i = !0, t();
    }), this.once("revealComplete", function () {
      o = !0, t();
    });
  }, l._filter = function (t) {
    var e = this.options.filter;e = e || "*";for (var i = [], o = [], n = [], s = this._getFilterTest(e), r = 0; r < t.length; r++) {
      var a = t[r];if (!a.isIgnored) {
        var u = s(a);u && i.push(a), u && a.isHidden ? o.push(a) : u || a.isHidden || n.push(a);
      }
    }return { matches: i, needReveal: o, needHide: n };
  }, l._getFilterTest = function (t) {
    return u && this.options.isJQueryFiltering ? function (e) {
      return u(e.element).is(t);
    } : "function" == typeof t ? function (e) {
      return t(e.element);
    } : function (e) {
      return o(e.element, t);
    };
  }, l.updateSortData = function (t) {
    var e;t ? (t = n.makeArray(t), e = this.getItems(t)) : e = this.items, this._getSorters(), this._updateItemsSortData(e);
  }, l._getSorters = function () {
    var t = this.options.getSortData;for (var e in t) {
      var i = t[e];this._sorters[e] = f(i);
    }
  }, l._updateItemsSortData = function (t) {
    for (var e = t && t.length, i = 0; e && i < e; i++) {
      var o = t[i];o.updateSortData();
    }
  };var f = function () {
    function t(t) {
      if ("string" != typeof t) return t;var i = h(t).split(" "),
          o = i[0],
          n = o.match(/^\[(.+)\]$/),
          s = n && n[1],
          r = e(s, o),
          a = d.sortDataParsers[i[1]];return t = a ? function (t) {
        return t && a(r(t));
      } : function (t) {
        return t && r(t);
      };
    }function e(t, e) {
      return t ? function (e) {
        return e.getAttribute(t);
      } : function (t) {
        var i = t.querySelector(e);return i && i.textContent;
      };
    }return t;
  }();d.sortDataParsers = { parseInt: function (t) {
      return parseInt(t, 10);
    }, parseFloat: function (t) {
      return parseFloat(t);
    } }, l._sort = function () {
    if (this.options.sortBy) {
      var t = n.makeArray(this.options.sortBy);this._getIsSameSortBy(t) || (this.sortHistory = t.concat(this.sortHistory));var e = a(this.sortHistory, this.options.sortAscending);this.filteredItems.sort(e);
    }
  }, l._getIsSameSortBy = function (t) {
    for (var e = 0; e < t.length; e++) if (t[e] != this.sortHistory[e]) return !1;return !0;
  }, l._mode = function () {
    var t = this.options.layoutMode,
        e = this.modes[t];if (!e) throw new Error("No layout mode: " + t);return e.options = this.options[t], e;
  }, l._resetLayout = function () {
    e.prototype._resetLayout.call(this), this._mode()._resetLayout();
  }, l._getItemLayoutPosition = function (t) {
    return this._mode()._getItemLayoutPosition(t);
  }, l._manageStamp = function (t) {
    this._mode()._manageStamp(t);
  }, l._getContainerSize = function () {
    return this._mode()._getContainerSize();
  }, l.needsResizeLayout = function () {
    return this._mode().needsResizeLayout();
  }, l.appended = function (t) {
    var e = this.addItems(t);if (e.length) {
      var i = this._filterRevealAdded(e);this.filteredItems = this.filteredItems.concat(i);
    }
  }, l.prepended = function (t) {
    var e = this._itemize(t);if (e.length) {
      this._resetLayout(), this._manageStamps();var i = this._filterRevealAdded(e);this.layoutItems(this.filteredItems), this.filteredItems = i.concat(this.filteredItems), this.items = e.concat(this.items);
    }
  }, l._filterRevealAdded = function (t) {
    var e = this._filter(t);return this.hide(e.needHide), this.reveal(e.matches), this.layoutItems(e.matches, !0), e.matches;
  }, l.insert = function (t) {
    var e = this.addItems(t);if (e.length) {
      var i,
          o,
          n = e.length;for (i = 0; i < n; i++) o = e[i], this.element.appendChild(o.element);var s = this._filter(e).matches;for (i = 0; i < n; i++) e[i].isLayoutInstant = !0;for (this.arrange(), i = 0; i < n; i++) delete e[i].isLayoutInstant;this.reveal(s);
    }
  };var c = l.remove;return l.remove = function (t) {
    t = n.makeArray(t);var e = this.getItems(t);c.call(this, t);for (var i = e && e.length, o = 0; i && o < i; o++) {
      var s = e[o];n.removeFrom(this.filteredItems, s);
    }
  }, l.shuffle = function () {
    for (var t = 0; t < this.items.length; t++) {
      var e = this.items[t];e.sortData.random = Math.random();
    }this.options.sortBy = "random", this._sort(), this._layout();
  }, l._noTransition = function (t, e) {
    var i = this.options.transitionDuration;this.options.transitionDuration = 0;var o = t.apply(this, e);return this.options.transitionDuration = i, o;
  }, l.getFilteredItemElements = function () {
    return this.filteredItems.map(function (t) {
      return t.element;
    });
  }, d;
});
/*!
 * fitColumns layout mode for Isotope
 * v1.1.3
 * http://isotope.metafizzy.co/layout-modes/fitcolumns.html
 */

/*jshint browser: true, devel: false, strict: true, undef: true, unused: true */

(function (window, factory) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['isotope/js/layout-mode'], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory(require('isotope-layout/js/layout-mode'));
  } else {
    // browser global
    factory(window.Isotope.LayoutMode);
  }
})(window, function factory(LayoutMode) {
  'use strict';

  var FitColumns = LayoutMode.create('fitColumns');
  var proto = FitColumns.prototype;

  proto._resetLayout = function () {
    this.x = 0;
    this.y = 0;
    this.maxX = 0;
  };

  proto._getItemLayoutPosition = function (item) {
    item.getSize();

    // if this element cannot fit in the current row
    if (this.y !== 0 && item.size.outerHeight + this.y > this.isotope.size.innerHeight) {
      this.y = 0;
      this.x = this.maxX;
    }

    var position = {
      x: this.x,
      y: this.y
    };

    this.maxX = Math.max(this.maxX, this.x + item.size.outerWidth);
    this.y += item.size.outerHeight;

    return position;
  };

  proto._getContainerSize = function () {
    return { width: this.maxX };
  };

  proto.needsResizeLayout = function () {
    return this.needsVerticalResizeLayout();
  };

  return FitColumns;
});
/************************************
          MINIMALECT 0.8b
  A minimalistic select replacement
        http://git.io/Xedg9w
************************************/
!function (e, t, s) {
      function i(t, s) {
            this.element = e(t), this.options = e.extend({}, a, s), this._defaults = a, this._name = l, this.label = e('[for="' + this.element.attr("id") + '"]').attr("for", "minict_" + this.element.attr("id")), this._init();
      }var l = "minimalect",
          a = { theme: "", reset: !1, transition: "fade", transition_time: 150, remove_empty_option: !0, searchable: !0, ajax: null, debug: !1, live: !0, placeholder: "Select a choice", empty: "No results match your keyword.", error_message: "There was a problem with the request.", class_container: "minict_wrapper", class_group: "minict_group", class_empty: "minict_empty", class_active: "active", class_disabled: "disabled", class_selected: "selected", class_hidden: "hidden", class_highlighted: "highlighted", class_first: "minict_first", class_last: "minict_last", class_reset: "minict_reset", beforeinit: function () {}, afterinit: function () {}, onchange: function () {}, onopen: function () {}, onclose: function () {}, onfilter: function () {} };i.prototype = { _init: function () {
                  this.options.beforeinit();var i = this.options,
                      l = this;if (this.wrapper = e('<div class="' + i.class_container + '"></div>'), this.element.hide().after(this.wrapper), i.theme && this.wrapper.addClass(i.theme), this.element.prop("disabled") && this.wrapper.addClass(i.class_disabled), this.input = e("<span " + (i.searchable ? 'contenteditable="true"' : "") + ' data-placeholder="' + (this.element.find("option[selected]").text() || this.element.attr("placeholder") || null != i.placeholder ? i.placeholder : this.element.find("option:first").text()) + '" ' + (this.element.is("[tabindex]") ? "tabindex=" + this.element.attr("tabindex") : "") + ">" + (this.element.find("option[selected]").html() || "") + "</span>").appendTo(this.wrapper), i.reset && (this.reset = e('<a href="#" class="' + i.class_reset + '">&#215;</a>').appendTo(this.wrapper)), this.ul = e("<ul>" + this._parseSelect() + '<li class="' + i.class_empty + '">' + i.empty + "</li></ul>").appendTo(this.wrapper), this.items = this.wrapper.find("li"), this.element.find("option[selected]").length && (this._showResetLink(), this.items.filter('[data-value="' + this.element.find("option[selected]").val() + '"]').addClass(i.class_selected)), e(s).on("click", function () {
                        l._hideChoices(l.wrapper);
                  }), e("*").not(this.wrapper).not(this.wrapper.find("*")).on("focus", function () {
                        l._hideChoices(l.wrapper);
                  }), this.wrapper.on("click", function (e) {
                        e.stopPropagation(), l.element.prop("multiple") || l.element.prop("disabled") || l._toggleChoices();
                  }), this.label.on("click", function (e) {
                        e.stopPropagation(), l.input.trigger("focus");
                  }), this.wrapper.on("click", "li:not(." + i.class_group + ", ." + i.class_empty + ", ." + i.class_disabled + ")", function () {
                        l._selectChoice(e(this));
                  }), this.wrapper.on("click", "li." + i.class_group + ", li." + i.class_empty + ", li." + i.class_disabled, function (e) {
                        e.stopPropagation(), l.input.focus();
                  }), this.element.on("focus", function () {
                        l.element.blur(), l._showChoices();
                  }).on("blur", l._hideChoices).on("update", l.update), i.reset && this.wrapper.on("click", "a." + i.class_reset, function (e) {
                        return e.stopPropagation(), l._resetChoice(), !1;
                  }), this.input.on("focus click", function (e) {
                        e.stopPropagation(), l.element.prop("disabled") ? l.input.blur() : l._showChoices();
                  }).on("keydown", function (e) {
                        switch (e.keyCode) {case 38:
                                    e.preventDefault(), l._navigateChoices("up");break;case 40:
                                    e.preventDefault(), l._navigateChoices("down");break;case 13:case 9:
                                    l.items.filter("." + i.class_highlighted).length ? l._selectChoice(l.items.filter("." + i.class_highlighted)) : l.input.text() && l._selectChoice(l.items.not("." + i.class_group + ", ." + i.class_empty).filter(":visible").first()), 13 === e.keyCode && (e.preventDefault(), l._hideChoices(l.wrapper));break;case 27:
                                    e.preventDefault(), l._hideChoices(l.wrapper);}
                  }).on("keyup", function (t) {
                        -1 === e.inArray(t.keyCode, [38, 40, 13, 9, 27]) && l._filterChoices();
                  }), t.MutationObserver && (this.observer = new MutationObserver(function (e) {
                        e.length > 0 && (l.ul.html(l._parseSelect() + '<li class="' + i.class_empty + '">' + i.empty + "</li>"), l.items = l.wrapper.find('li'), l.options.debug && console.log("Minimalect detected a DOM change for ", l.element));
                  }), this.observer.observe(l.element[0], { childList: !0 })), i.live) {
                        var a = this.element.val();setInterval(function () {
                              a != l.element.val() && null != l.element.val() && "" != l.element.val() ? (a = l.element.val(), "array" == typeof a ? a.each(function (e, t) {
                                    l._selectChoice(l.wrapper.find("li[data-value='" + t + "']"));
                              }) : l._selectChoice(l.wrapper.find("li[data-value='" + a + "']"))) : (null == l.element.val() || "" == l.element.val()) && (a = l.element.val(), l.items.removeClass(l.options.class_selected), l.input.text("").attr("data-placeholder", l.options.placeholder)), l.element.prop("disabled") ? l.wrapper.addClass(i.class_disabled) : l.wrapper.removeClass(i.class_disabled);
                        }, 100);
                  }i.afterinit();
            }, _navigateChoices: function (e) {
                  var t = (this.wrapper, this.options),
                      s = this.items,
                      i = "." + t.class_hidden + ", ." + t.class_empty + ", ." + t.class_group;if (!s.filter("." + t.class_highlighted).length) return "up" === e ? s.not(i).last().addClass(t.class_highlighted) : "down" === e && s.not(i).first().addClass(t.class_highlighted), !1;if (cur = s.filter("." + t.class_highlighted), cur.removeClass(t.class_highlighted), "up" === e) {
                        if (s.not(i).first()[0] != cur[0]) {
                              cur.prevAll("li").not(i).first().addClass(t.class_highlighted);var l = s.filter("." + t.class_highlighted).offset().top - this.ul.offset().top + this.ul.scrollTop();this.ul.scrollTop() > l && this.ul.scrollTop(l);
                        } else s.not(i).last().addClass(t.class_highlighted), this.ul.scrollTop(this.ul.height());
                  } else if ("down" === e) if (s.not(i).last()[0] != cur[0]) {
                        cur.nextAll("li").not(i).first().addClass(t.class_highlighted);var a = this.ul.height(),
                            n = s.filter("." + t.class_highlighted).offset().top - this.ul.offset().top + s.filter("." + t.class_highlighted).outerHeight();n > a && this.ul.scrollTop(this.ul.scrollTop() + n - a);
                  } else s.not(i).first().addClass(t.class_highlighted), this.ul.scrollTop(0);
            }, _parseSelect: function () {
                  var t = "";return this.element.find("optgroup").length ? this.element.find("optgroup").each(function () {
                        t += '<li class="' + this.options.class_group + '">' + e(this).attr("label") + "</li>", t += this._parseElements(e(this).html());
                  }) : t = this._parseElements(this.element.html()), t;
            }, _parseElements: function (t) {
                  var s = this,
                      i = "";return e(e.trim(t)).filter("option").each(function () {
                        var t = e(this);"" === t.attr("value") && s.options.remove_empty_option || (i += '<li data-value="' + t.val().replace(/"/g, "&quot;") + '" class="' + (t.attr("class") || "") + (t.prop("disabled") ? " " + s.options.class_disabled : "") + '">' + t.text() + "</li>");
                  }), i;
            }, _toggleChoices: function () {
                  this.wrapper.hasClass(this.options.class_active) ? this._hideChoices(this.wrapper) : this._showChoices();
            }, _showChoices: function (t) {
                  var s = this,
                      i = this.wrapper,
                      l = this.options;if (i.hasClass(l.class_active)) "function" == typeof t && t.call();else {
                        switch (this._updateFirstLast(!1), e("." + l.class_container).each(function () {
                              e(this)[0] !== i[0] && s._hideChoices(e(this));
                        }), "function" == typeof t && t.call(), i.addClass(l.class_active), l.transition) {case "fade":
                                    this.ul.fadeIn(l.transition_time);break;default:
                                    this.ul.show();}this.input.text("").focus(), this._hideResetLink(), this.options.onopen();
                  }
            }, _resetDropdown: function (e) {
                  var t = this.options;this.items.removeClass(t.class_hidden), this.wrapper.find("." + t.class_empty).hide(), this.items.filter("." + t.class_highlighted).removeClass(t.class_highlighted), "function" == typeof e && e.call();
            }, _hideChoices: function (e, t) {
                  var s = this.options,
                      i = s.transition_time,
                      l = this;if (e.hasClass(s.class_active)) {
                        switch (e.removeClass(s.class_active), s.transition) {case "fade":
                                    e.children("ul").fadeOut(s.transition_time);break;default:
                                    e.children("ul").hide(), i = 0;}setTimeout(function () {
                              l._resetDropdown(t), l.input.blur(), l.input.attr("data-placeholder") != s.placeholder ? l.input.text(l.input.attr("data-placeholder")) : l.items.filter("." + s.class_selected).length || l.input.text("");
                        }, i), l._showResetLink(), s.onclose();
                  } else "function" == typeof t && t.call();
            }, _filterChoices: function () {
                  var t = this.wrapper,
                      s = this.options,
                      i = this;if (s.ajax) e.post(s.ajax, { q: this.input.text() }).success(function (l) {
                        if (s.debug && console.log("Minimalect received ", l, " for query '" + i.input.text() + "' in ", i.element), l.length) {
                              var a = "";e.each(l, function (e, t) {
                                    a += '<option value="' + t.value + '">' + t.name + "</option>";
                              }), i.element.html(a), i.ul.html(i._parseSelect() + '<li class="' + s.class_empty + '">' + s.empty + "</li>"), t.find("." + s.class_empty).hide(), i.items = t.find("li"), i.options.onfilter(!0);
                        } else i.ul.html('<li class="' + s.class_empty + '">' + s.empty + "</li>"), t.find("." + s.class_empty).show(), s.debug && console.log("Minimalect didn't find any results for '" + i.input.text() + "' from ", i.element), i.options.onfilter(!1);
                  }).error(function (e) {
                        t.find("." + s.class_empty).text(s.error_message), t.find("li").not("." + s.class_empty).addClass(s.class_hidden), t.find("." + s.class_empty).show(), s.debug && console.error("Minimalect's AJAX query failed for ", i.element, " - came back with ", e);
                  });else {
                        var l = this.input.text().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");this.items.filter("." + s.class_highlighted).removeClass(s.class_highlighted), this.items.not(s.class_group).each(function () {
                              e(this).text().search(new RegExp(l, "i")) < 0 || e(this).hasClass(s.class_disabled) ? e(this).addClass(s.class_hidden) : e(this).removeClass(s.class_hidden);
                        }), this.items.filter("." + s.class_group).removeClass(s.class_hidden).each(function () {
                              nextlis = e(this).nextAll("li").not("." + s.class_hidden + ", ." + s.class_empty), (nextlis.first().hasClass(s.class_group) || !nextlis.length) && e(this).addClass(s.class_hidden);
                        }), t.find("." + s.class_empty).hide(), this.items.not("." + s.class_hidden + ", ." + s.class_empty).length ? this.options.onfilter(!0) : (t.find("." + s.class_empty).show(), s.debug && console.log("Minimalect didn't find any results for '" + this.input.text() + "' from ", this.element), this.options.onfilter(!1)), this._updateFirstLast(!0);
                  }
            }, _selectChoice: function (t) {
                  var s = this.element,
                      i = this.options,
                      l = [],
                      a = [];return t.hasClass(this.options.class_disabled) ? !1 : (this.element.prop("multiple") || this.items.removeClass(i.class_selected), t.addClass(i.class_selected), this.items.filter("." + i.class_selected).each(function () {
                        l.push(e(this).data("value")), a.push(e(this).text());
                  }), this.input.text(a.join(", ")).attr("data-placeholder", a.join(", ")), (s.val() != t.data("value") || s.val() != l) && (s.val(l), s.trigger("change")), this._showResetLink(), void this.options.onchange(t.data("value"), t.text()));
            }, _resetChoice: function () {
                  this.element.val("").trigger("change"), this._hideResetLink();
            }, _showResetLink: function () {
                  (this.input.text().length > 0 || this.ul.find("li." + this.options.class_selected).length > 0) && this.options.reset && this.reset.show();
            }, _hideResetLink: function () {
                  this.options.reset && this.reset.hide();
            }, _updateFirstLast: function (e) {
                  var t = this.wrapper,
                      s = this.options;t.find("." + s.class_first + ", ." + s.class_last).removeClass(s.class_first + " " + s.class_last), e ? (this.items.filter(":visible").first().addClass(s.class_first), this.items.filter(":visible").last().addClass(s.class_last)) : (this.items.first().addClass(s.class_first), this.items.not("." + s.class_empty).last().addClass(s.class_last));
            }, destroy: function () {
                  this.wrapper.remove(), this.element.off("change focus blur").show(), t.MutationObserver && this.observer.disconnect(), this.options.debug && console.log("Minimalect destroyed for ", this.element);
            }, update: function () {
                  this.ul.html(this._parseSelect() + '<li class="' + this.options.class_empty + '">' + this.options.empty + "</li>");
            } }, e.fn[l] = function (t, s) {
            return this.each(function () {
                  e.isFunction(i.prototype[t]) && "_" != t.charAt(0) ? 1 == arguments.length ? e.data(this, "plugin_" + l)[t]() : e.data(this, "plugin_" + l)[t](s) : e.data(this, "plugin_" + l) || e.data(this, "plugin_" + l, new i(this, t));
            });
      };
}(jQuery, window, document);
/*!
 * JavaScript Cookie v2.1.3
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
	var registeredInModuleLoader = false;
	if (typeof define === 'function' && define.amd) {
		define(factory);
		registeredInModuleLoader = true;
	}
	if (typeof exports === 'object') {
		module.exports = factory();
		registeredInModuleLoader = true;
	}
	if (!registeredInModuleLoader) {
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
})(function () {
	function extend() {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[i];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function init(converter) {
		function api(key, value, attributes) {
			var result;
			if (typeof document === 'undefined') {
				return;
			}

			// Write

			if (arguments.length > 1) {
				attributes = extend({
					path: '/'
				}, api.defaults, attributes);

				if (typeof attributes.expires === 'number') {
					var expires = new Date();
					expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
					attributes.expires = expires;
				}

				// We're using "expires" because "max-age" is not supported by IE
				attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

				try {
					result = JSON.stringify(value);
					if (/^[\{\[]/.test(result)) {
						value = result;
					}
				} catch (e) {}

				if (!converter.write) {
					value = encodeURIComponent(String(value)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
				} else {
					value = converter.write(value, key);
				}

				key = encodeURIComponent(String(key));
				key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
				key = key.replace(/[\(\)]/g, escape);

				var stringifiedAttributes = '';

				for (var attributeName in attributes) {
					if (!attributes[attributeName]) {
						continue;
					}
					stringifiedAttributes += '; ' + attributeName;
					if (attributes[attributeName] === true) {
						continue;
					}
					stringifiedAttributes += '=' + attributes[attributeName];
				}
				return document.cookie = key + '=' + value + stringifiedAttributes;
			}

			// Read

			if (!key) {
				result = {};
			}

			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling "get()"
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var rdecode = /(%[0-9A-Z]{2})+/g;
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var cookie = parts.slice(1).join('=');

				if (cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					var name = parts[0].replace(rdecode, decodeURIComponent);
					cookie = converter.read ? converter.read(cookie, name) : converter(cookie, name) || cookie.replace(rdecode, decodeURIComponent);

					if (this.json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					if (key === name) {
						result = cookie;
						break;
					}

					if (!key) {
						result[name] = cookie;
					}
				} catch (e) {}
			}

			return result;
		}

		api.set = api;
		api.get = function (key) {
			return api.call(api, key);
		};
		api.getJSON = function () {
			return api.apply({
				json: true
			}, [].slice.call(arguments));
		};
		api.defaults = {};

		api.remove = function (key, attributes) {
			api(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
});
(function () {
  var t,
      e,
      n,
      r,
      a,
      o,
      i,
      l,
      u,
      s,
      c,
      h,
      p,
      g,
      v,
      f,
      d,
      m,
      y,
      C,
      T,
      w,
      $,
      D,
      S = [].slice,
      k = [].indexOf || function (t) {
    for (var e = 0, n = this.length; n > e; e++) if (e in this && this[e] === t) return e;return -1;
  };t = window.jQuery || window.Zepto || window.$, t.payment = {}, t.payment.fn = {}, t.fn.payment = function () {
    var e, n;return n = arguments[0], e = 2 <= arguments.length ? S.call(arguments, 1) : [], t.payment.fn[n].apply(this, e);
  }, a = /(\d{1,4})/g, t.payment.cards = r = [{ type: "maestro", patterns: [5018, 502, 503, 506, 56, 58, 639, 6220, 67], format: a, length: [12, 13, 14, 15, 16, 17, 18, 19], cvcLength: [3], luhn: !0 }, { type: "forbrugsforeningen", patterns: [600], format: a, length: [16], cvcLength: [3], luhn: !0 }, { type: "dankort", patterns: [5019], format: a, length: [16], cvcLength: [3], luhn: !0 }, { type: "visa", patterns: [4], format: a, length: [13, 16], cvcLength: [3], luhn: !0 }, { type: "mastercard", patterns: [51, 52, 53, 54, 55, 22, 23, 24, 25, 26, 27], format: a, length: [16], cvcLength: [3], luhn: !0 }, { type: "amex", patterns: [34, 37], format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/, length: [15], cvcLength: [3, 4], luhn: !0 }, { type: "dinersclub", patterns: [30, 36, 38, 39], format: /(\d{1,4})(\d{1,6})?(\d{1,4})?/, length: [14], cvcLength: [3], luhn: !0 }, { type: "discover", patterns: [60, 64, 65, 622], format: a, length: [16], cvcLength: [3], luhn: !0 }, { type: "unionpay", patterns: [62, 88], format: a, length: [16, 17, 18, 19], cvcLength: [3], luhn: !1 }, { type: "jcb", patterns: [35], format: a, length: [16], cvcLength: [3], luhn: !0 }], e = function (t) {
    var e, n, a, o, i, l, u, s;for (t = (t + "").replace(/\D/g, ""), o = 0, l = r.length; l > o; o++) for (e = r[o], s = e.patterns, i = 0, u = s.length; u > i; i++) if (a = s[i], n = a + "", t.substr(0, n.length) === n) return e;
  }, n = function (t) {
    var e, n, a;for (n = 0, a = r.length; a > n; n++) if (e = r[n], e.type === t) return e;
  }, p = function (t) {
    var e, n, r, a, o, i;for (r = !0, a = 0, n = (t + "").split("").reverse(), o = 0, i = n.length; i > o; o++) e = n[o], e = parseInt(e, 10), (r = !r) && (e *= 2), e > 9 && (e -= 9), a += e;return a % 10 === 0;
  }, h = function (t) {
    var e;return null != t.prop("selectionStart") && t.prop("selectionStart") !== t.prop("selectionEnd") ? !0 : null != ("undefined" != typeof document && null !== document && null != (e = document.selection) ? e.createRange : void 0) && document.selection.createRange().text ? !0 : !1;
  }, $ = function (t, e) {
    var n, r, a, o, i, l;try {
      r = e.prop("selectionStart");
    } catch (u) {
      o = u, r = null;
    }return i = e.val(), e.val(t), null !== r && e.is(":focus") ? (r === i.length && (r = t.length), i !== t && (l = i.slice(r - 1, +r + 1 || 9e9), n = t.slice(r - 1, +r + 1 || 9e9), a = t[r], /\d/.test(a) && l === "" + a + " " && n === " " + a && (r += 1)), e.prop("selectionStart", r), e.prop("selectionEnd", r)) : void 0;
  }, m = function (t) {
    var e, n, r, a, o, i, l, u;for (null == t && (t = ""), r = "０１２３４５６７８９", a = "0123456789", i = "", e = t.split(""), l = 0, u = e.length; u > l; l++) n = e[l], o = r.indexOf(n), o > -1 && (n = a[o]), i += n;return i;
  }, d = function (e) {
    var n;return n = t(e.currentTarget), setTimeout(function () {
      var t;return t = n.val(), t = m(t), t = t.replace(/\D/g, ""), $(t, n);
    });
  }, v = function (e) {
    var n;return n = t(e.currentTarget), setTimeout(function () {
      var e;return e = n.val(), e = m(e), e = t.payment.formatCardNumber(e), $(e, n);
    });
  }, l = function (n) {
    var r, a, o, i, l, u, s;return o = String.fromCharCode(n.which), !/^\d+$/.test(o) || (r = t(n.currentTarget), s = r.val(), a = e(s + o), i = (s.replace(/\D/g, "") + o).length, u = 16, a && (u = a.length[a.length.length - 1]), i >= u || null != r.prop("selectionStart") && r.prop("selectionStart") !== s.length) ? void 0 : (l = a && "amex" === a.type ? /^(\d{4}|\d{4}\s\d{6})$/ : /(?:^|\s)(\d{4})$/, l.test(s) ? (n.preventDefault(), setTimeout(function () {
      return r.val(s + " " + o);
    })) : l.test(s + o) ? (n.preventDefault(), setTimeout(function () {
      return r.val(s + o + " ");
    })) : void 0);
  }, o = function (e) {
    var n, r;return n = t(e.currentTarget), r = n.val(), 8 !== e.which || null != n.prop("selectionStart") && n.prop("selectionStart") !== r.length ? void 0 : /\d\s$/.test(r) ? (e.preventDefault(), setTimeout(function () {
      return n.val(r.replace(/\d\s$/, ""));
    })) : /\s\d?$/.test(r) ? (e.preventDefault(), setTimeout(function () {
      return n.val(r.replace(/\d$/, ""));
    })) : void 0;
  }, f = function (e) {
    var n;return n = t(e.currentTarget), setTimeout(function () {
      var e;return e = n.val(), e = m(e), e = t.payment.formatExpiry(e), $(e, n);
    });
  }, u = function (e) {
    var n, r, a;return r = String.fromCharCode(e.which), /^\d+$/.test(r) ? (n = t(e.currentTarget), a = n.val() + r, /^\d$/.test(a) && "0" !== a && "1" !== a ? (e.preventDefault(), setTimeout(function () {
      return n.val("0" + a + " / ");
    })) : /^\d\d$/.test(a) ? (e.preventDefault(), setTimeout(function () {
      var t, e;return t = parseInt(a[0], 10), e = parseInt(a[1], 10), e > 2 && 0 !== t ? n.val("0" + t + " / " + e) : n.val("" + a + " / ");
    })) : void 0) : void 0;
  }, s = function (e) {
    var n, r, a;return r = String.fromCharCode(e.which), /^\d+$/.test(r) ? (n = t(e.currentTarget), a = n.val(), /^\d\d$/.test(a) ? n.val("" + a + " / ") : void 0) : void 0;
  }, c = function (e) {
    var n, r, a;return a = String.fromCharCode(e.which), "/" === a || " " === a ? (n = t(e.currentTarget), r = n.val(), /^\d$/.test(r) && "0" !== r ? n.val("0" + r + " / ") : void 0) : void 0;
  }, i = function (e) {
    var n, r;return n = t(e.currentTarget), r = n.val(), 8 !== e.which || null != n.prop("selectionStart") && n.prop("selectionStart") !== r.length ? void 0 : /\d\s\/\s$/.test(r) ? (e.preventDefault(), setTimeout(function () {
      return n.val(r.replace(/\d\s\/\s$/, ""));
    })) : void 0;
  }, g = function (e) {
    var n;return n = t(e.currentTarget), setTimeout(function () {
      var t;return t = n.val(), t = m(t), t = t.replace(/\D/g, "").slice(0, 4), $(t, n);
    });
  }, w = function (t) {
    var e;return t.metaKey || t.ctrlKey ? !0 : 32 === t.which ? !1 : 0 === t.which ? !0 : t.which < 33 ? !0 : (e = String.fromCharCode(t.which), !!/[\d\s]/.test(e));
  }, C = function (n) {
    var r, a, o, i;return r = t(n.currentTarget), o = String.fromCharCode(n.which), /^\d+$/.test(o) && !h(r) ? (i = (r.val() + o).replace(/\D/g, ""), a = e(i), a ? i.length <= a.length[a.length.length - 1] : i.length <= 16) : void 0;
  }, T = function (e) {
    var n, r, a;return n = t(e.currentTarget), r = String.fromCharCode(e.which), /^\d+$/.test(r) && !h(n) ? (a = n.val() + r, a = a.replace(/\D/g, ""), a.length > 6 ? !1 : void 0) : void 0;
  }, y = function (e) {
    var n, r, a;return n = t(e.currentTarget), r = String.fromCharCode(e.which), /^\d+$/.test(r) && !h(n) ? (a = n.val() + r, a.length <= 4) : void 0;
  }, D = function (e) {
    var n, a, o, i, l;return n = t(e.currentTarget), l = n.val(), i = t.payment.cardType(l) || "unknown", n.hasClass(i) ? void 0 : (a = function () {
      var t, e, n;for (n = [], t = 0, e = r.length; e > t; t++) o = r[t], n.push(o.type);return n;
    }(), n.removeClass("unknown"), n.removeClass(a.join(" ")), n.addClass(i), n.toggleClass("identified", "unknown" !== i), n.trigger("payment.cardType", i));
  }, t.payment.fn.formatCardCVC = function () {
    return this.on("keypress", w), this.on("keypress", y), this.on("paste", g), this.on("change", g), this.on("input", g), this;
  }, t.payment.fn.formatCardExpiry = function () {
    return this.on("keypress", w), this.on("keypress", T), this.on("keypress", u), this.on("keypress", c), this.on("keypress", s), this.on("keydown", i), this.on("change", f), this.on("input", f), this;
  }, t.payment.fn.formatCardNumber = function () {
    return this.on("keypress", w), this.on("keypress", C), this.on("keypress", l), this.on("keydown", o), this.on("keyup", D), this.on("paste", v), this.on("change", v), this.on("input", v), this.on("input", D), this;
  }, t.payment.fn.restrictNumeric = function () {
    return this.on("keypress", w), this.on("paste", d), this.on("change", d), this.on("input", d), this;
  }, t.payment.fn.cardExpiryVal = function () {
    return t.payment.cardExpiryVal(t(this).val());
  }, t.payment.cardExpiryVal = function (t) {
    var e, n, r, a;return a = t.split(/[\s\/]+/, 2), e = a[0], r = a[1], 2 === (null != r ? r.length : void 0) && /^\d+$/.test(r) && (n = new Date().getFullYear(), n = n.toString().slice(0, 2), r = n + r), e = parseInt(e, 10), r = parseInt(r, 10), { month: e, year: r };
  }, t.payment.validateCardNumber = function (t) {
    var n, r;return t = (t + "").replace(/\s+|-/g, ""), /^\d+$/.test(t) ? (n = e(t), n ? (r = t.length, k.call(n.length, r) >= 0 && (n.luhn === !1 || p(t))) : !1) : !1;
  }, t.payment.validateCardExpiry = function (e, n) {
    var r, a, o;return "object" == typeof e && "month" in e && (o = e, e = o.month, n = o.year), e && n ? (e = t.trim(e), n = t.trim(n), /^\d+$/.test(e) && /^\d+$/.test(n) && e >= 1 && 12 >= e ? (2 === n.length && (n = 70 > n ? "20" + n : "19" + n), 4 !== n.length ? !1 : (a = new Date(n, e), r = new Date(), a.setMonth(a.getMonth() - 1), a.setMonth(a.getMonth() + 1, 1), a > r)) : !1) : !1;
  }, t.payment.validateCardCVC = function (e, r) {
    var a, o;return e = t.trim(e), /^\d+$/.test(e) ? (a = n(r), null != a ? (o = e.length, k.call(a.cvcLength, o) >= 0) : e.length >= 3 && e.length <= 4) : !1;
  }, t.payment.cardType = function (t) {
    var n;return t ? (null != (n = e(t)) ? n.type : void 0) || null : null;
  }, t.payment.formatCardNumber = function (n) {
    var r, a, o, i;return n = n.replace(/\D/g, ""), (r = e(n)) ? (o = r.length[r.length.length - 1], n = n.slice(0, o), r.format.global ? null != (i = n.match(r.format)) ? i.join(" ") : void 0 : (a = r.format.exec(n), null != a ? (a.shift(), a = t.grep(a, function (t) {
      return t;
    }), a.join(" ")) : void 0)) : n;
  }, t.payment.formatExpiry = function (t) {
    var e, n, r, a;return (n = t.match(/^\D*(\d{1,2})(\D+)?(\d{1,4})?/)) ? (e = n[1] || "", r = n[2] || "", a = n[3] || "", a.length > 0 ? r = " / " : " /" === r ? (e = e.substring(0, 1), r = "") : 2 === e.length || r.length > 0 ? r = " / " : 1 === e.length && "0" !== e && "1" !== e && (e = "0" + e, r = " / "), e + r + a) : "";
  };
}).call(this);
$(document).ready(function () {
    "use strict";

    var grid = $('#gallerygrid .grid').imagesLoaded(function () {
        grid.isotope({
            // options
            itemSelector: '.item',
            masonry: {
                columnWidth: 275
            }
        });
    });

    /*var grid = $('#gallerygrid .grid').isotope({
        // options
        itemSelector: '.item',
        layoutMode: 'masonry'
    });*/

    $("#homepage #heroimage select").minimalect({
        placeholder: "Select a category to begin",
        searchable: false,
        onchange: function (value, text) {
            window.location.href = "/vendors/" + value;
        }
    });

    $("#mobilemenubtn").click(function () {
        if ($("nav#mainmenu").hasClass('mobile')) {
            $("nav#mainmenu").removeClass('mobile');
        } else {
            $("nav#mainmenu").addClass('mobile');
        }
    });

    $("#loginSubmit").click(function () {
        var email = $("#vendorloginform").find("input[name=email]").val();
        var password = $("#vendorloginform").find("input[name=password]").val();

        var valid = true;

        if (email === "") {
            valid = false;
        }

        if (password === "") {
            valid = false;
        }

        if (valid) {
            $("#vendorloginform .pageloading").show();
            $.ajax({
                url: "/api/v1/vendors/login",
                method: "POST",
                data: {
                    email: email,
                    password: password
                },
                success: function (response) {
                    Cookies.set('btvendortoken', response.token, { expires: 7 });
                    window.location.href = "/vendor/account";
                },
                error: function () {
                    alert("There was a problem logging in.");
                }
            });
        }
        return false;
    });
});