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