/**
 * sifter.js
 * Copyright (c) 2013 Brian Reavis & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@thirdroute.com>
 */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('sifter', factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.Sifter = factory();
	}
})(this, function () {

	/**
  * Textually searches arrays and hashes of objects
  * by property (or multiple properties). Designed
  * specifically for autocomplete.
  *
  * @constructor
  * @param {array|object} items
  * @param {object} items
  */
	var Sifter = function (items, settings) {
		this.items = items;
		this.settings = settings || { diacritics: true };
	};

	/**
  * Splits a search string into an array of individual
  * regexps to be used to match results.
  *
  * @param {string} query
  * @returns {array}
  */
	Sifter.prototype.tokenize = function (query) {
		query = trim(String(query || '').toLowerCase());
		if (!query || !query.length) return [];

		var i, n, regex, letter;
		var tokens = [];
		var words = query.split(/ +/);

		for (i = 0, n = words.length; i < n; i++) {
			regex = escape_regex(words[i]);
			if (this.settings.diacritics) {
				for (letter in DIACRITICS) {
					if (DIACRITICS.hasOwnProperty(letter)) {
						regex = regex.replace(new RegExp(letter, 'g'), DIACRITICS[letter]);
					}
				}
			}
			tokens.push({
				string: words[i],
				regex: new RegExp(regex, 'i')
			});
		}

		return tokens;
	};

	/**
  * Iterates over arrays and hashes.
  *
  * ```
  * this.iterator(this.items, function(item, id) {
  *    // invoked for each item
  * });
  * ```
  *
  * @param {array|object} object
  */
	Sifter.prototype.iterator = function (object, callback) {
		var iterator;
		if (is_array(object)) {
			iterator = Array.prototype.forEach || function (callback) {
				for (var i = 0, n = this.length; i < n; i++) {
					callback(this[i], i, this);
				}
			};
		} else {
			iterator = function (callback) {
				for (var key in this) {
					if (this.hasOwnProperty(key)) {
						callback(this[key], key, this);
					}
				}
			};
		}

		iterator.apply(object, [callback]);
	};

	/**
  * Returns a function to be used to score individual results.
  *
  * Good matches will have a higher score than poor matches.
  * If an item is not a match, 0 will be returned by the function.
  *
  * @param {object|string} search
  * @param {object} options (optional)
  * @returns {function}
  */
	Sifter.prototype.getScoreFunction = function (search, options) {
		var self, fields, tokens, token_count, nesting;

		self = this;
		search = self.prepareSearch(search, options);
		tokens = search.tokens;
		fields = search.options.fields;
		token_count = tokens.length;
		nesting = search.options.nesting;

		/**
   * Calculates how close of a match the
   * given value is against a search token.
   *
   * @param {mixed} value
   * @param {object} token
   * @return {number}
   */
		var scoreValue = function (value, token) {
			var score, pos;

			if (!value) return 0;
			value = String(value || '');
			pos = value.search(token.regex);
			if (pos === -1) return 0;
			score = token.string.length / value.length;
			if (pos === 0) score += 0.5;
			return score;
		};

		/**
   * Calculates the score of an object
   * against the search query.
   *
   * @param {object} token
   * @param {object} data
   * @return {number}
   */
		var scoreObject = function () {
			var field_count = fields.length;
			if (!field_count) {
				return function () {
					return 0;
				};
			}
			if (field_count === 1) {
				return function (token, data) {
					return scoreValue(getattr(data, fields[0], nesting), token);
				};
			}
			return function (token, data) {
				for (var i = 0, sum = 0; i < field_count; i++) {
					sum += scoreValue(getattr(data, fields[i], nesting), token);
				}
				return sum / field_count;
			};
		}();

		if (!token_count) {
			return function () {
				return 0;
			};
		}
		if (token_count === 1) {
			return function (data) {
				return scoreObject(tokens[0], data);
			};
		}

		if (search.options.conjunction === 'and') {
			return function (data) {
				var score;
				for (var i = 0, sum = 0; i < token_count; i++) {
					score = scoreObject(tokens[i], data);
					if (score <= 0) return 0;
					sum += score;
				}
				return sum / token_count;
			};
		} else {
			return function (data) {
				for (var i = 0, sum = 0; i < token_count; i++) {
					sum += scoreObject(tokens[i], data);
				}
				return sum / token_count;
			};
		}
	};

	/**
  * Returns a function that can be used to compare two
  * results, for sorting purposes. If no sorting should
  * be performed, `null` will be returned.
  *
  * @param {string|object} search
  * @param {object} options
  * @return function(a,b)
  */
	Sifter.prototype.getSortFunction = function (search, options) {
		var i, n, self, field, fields, fields_count, multiplier, multipliers, get_field, implicit_score, sort;

		self = this;
		search = self.prepareSearch(search, options);
		sort = !search.query && options.sort_empty || options.sort;

		/**
   * Fetches the specified sort field value
   * from a search result item.
   *
   * @param  {string} name
   * @param  {object} result
   * @return {mixed}
   */
		get_field = function (name, result) {
			if (name === '$score') return result.score;
			return getattr(self.items[result.id], name, options.nesting);
		};

		// parse options
		fields = [];
		if (sort) {
			for (i = 0, n = sort.length; i < n; i++) {
				if (search.query || sort[i].field !== '$score') {
					fields.push(sort[i]);
				}
			}
		}

		// the "$score" field is implied to be the primary
		// sort field, unless it's manually specified
		if (search.query) {
			implicit_score = true;
			for (i = 0, n = fields.length; i < n; i++) {
				if (fields[i].field === '$score') {
					implicit_score = false;
					break;
				}
			}
			if (implicit_score) {
				fields.unshift({ field: '$score', direction: 'desc' });
			}
		} else {
			for (i = 0, n = fields.length; i < n; i++) {
				if (fields[i].field === '$score') {
					fields.splice(i, 1);
					break;
				}
			}
		}

		multipliers = [];
		for (i = 0, n = fields.length; i < n; i++) {
			multipliers.push(fields[i].direction === 'desc' ? -1 : 1);
		}

		// build function
		fields_count = fields.length;
		if (!fields_count) {
			return null;
		} else if (fields_count === 1) {
			field = fields[0].field;
			multiplier = multipliers[0];
			return function (a, b) {
				return multiplier * cmp(get_field(field, a), get_field(field, b));
			};
		} else {
			return function (a, b) {
				var i, result, a_value, b_value, field;
				for (i = 0; i < fields_count; i++) {
					field = fields[i].field;
					result = multipliers[i] * cmp(get_field(field, a), get_field(field, b));
					if (result) return result;
				}
				return 0;
			};
		}
	};

	/**
  * Parses a search query and returns an object
  * with tokens and fields ready to be populated
  * with results.
  *
  * @param {string} query
  * @param {object} options
  * @returns {object}
  */
	Sifter.prototype.prepareSearch = function (query, options) {
		if (typeof query === 'object') return query;

		options = extend({}, options);

		var option_fields = options.fields;
		var option_sort = options.sort;
		var option_sort_empty = options.sort_empty;

		if (option_fields && !is_array(option_fields)) options.fields = [option_fields];
		if (option_sort && !is_array(option_sort)) options.sort = [option_sort];
		if (option_sort_empty && !is_array(option_sort_empty)) options.sort_empty = [option_sort_empty];

		return {
			options: options,
			query: String(query || '').toLowerCase(),
			tokens: this.tokenize(query),
			total: 0,
			items: []
		};
	};

	/**
  * Searches through all items and returns a sorted array of matches.
  *
  * The `options` parameter can contain:
  *
  *   - fields {string|array}
  *   - sort {array}
  *   - score {function}
  *   - filter {bool}
  *   - limit {integer}
  *
  * Returns an object containing:
  *
  *   - options {object}
  *   - query {string}
  *   - tokens {array}
  *   - total {int}
  *   - items {array}
  *
  * @param {string} query
  * @param {object} options
  * @returns {object}
  */
	Sifter.prototype.search = function (query, options) {
		var self = this,
		    value,
		    score,
		    search,
		    calculateScore;
		var fn_sort;
		var fn_score;

		search = this.prepareSearch(query, options);
		options = search.options;
		query = search.query;

		// generate result scoring function
		fn_score = options.score || self.getScoreFunction(search);

		// perform search and sort
		if (query.length) {
			self.iterator(self.items, function (item, id) {
				score = fn_score(item);
				if (options.filter === false || score > 0) {
					search.items.push({ 'score': score, 'id': id });
				}
			});
		} else {
			self.iterator(self.items, function (item, id) {
				search.items.push({ 'score': 1, 'id': id });
			});
		}

		fn_sort = self.getSortFunction(search, options);
		if (fn_sort) search.items.sort(fn_sort);

		// apply limits
		search.total = search.items.length;
		if (typeof options.limit === 'number') {
			search.items = search.items.slice(0, options.limit);
		}

		return search;
	};

	// utilities
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	var cmp = function (a, b) {
		if (typeof a === 'number' && typeof b === 'number') {
			return a > b ? 1 : a < b ? -1 : 0;
		}
		a = asciifold(String(a || ''));
		b = asciifold(String(b || ''));
		if (a > b) return 1;
		if (b > a) return -1;
		return 0;
	};

	var extend = function (a, b) {
		var i, n, k, object;
		for (i = 1, n = arguments.length; i < n; i++) {
			object = arguments[i];
			if (!object) continue;
			for (k in object) {
				if (object.hasOwnProperty(k)) {
					a[k] = object[k];
				}
			}
		}
		return a;
	};

	/**
  * A property getter resolving dot-notation
  * @param  {Object}  obj     The root object to fetch property on
  * @param  {String}  name    The optionally dotted property name to fetch
  * @param  {Boolean} nesting Handle nesting or not
  * @return {Object}          The resolved property value
  */
	var getattr = function (obj, name, nesting) {
		if (!obj || !name) return;
		if (!nesting) return obj[name];
		var names = name.split(".");
		while (names.length && (obj = obj[names.shift()]));
		return obj;
	};

	var trim = function (str) {
		return (str + '').replace(/^\s+|\s+$|/g, '');
	};

	var escape_regex = function (str) {
		return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
	};

	var is_array = Array.isArray || typeof $ !== 'undefined' && $.isArray || function (object) {
		return Object.prototype.toString.call(object) === '[object Array]';
	};

	var DIACRITICS = {
		'a': '[aḀḁĂăÂâǍǎȺⱥȦȧẠạÄäÀàÁáĀāÃãÅåąĄÃąĄ]',
		'b': '[b␢βΒB฿𐌁ᛒ]',
		'c': '[cĆćĈĉČčĊċC̄c̄ÇçḈḉȻȼƇƈɕᴄＣｃ]',
		'd': '[dĎďḊḋḐḑḌḍḒḓḎḏĐđD̦d̦ƉɖƊɗƋƌᵭᶁᶑȡᴅＤｄð]',
		'e': '[eÉéÈèÊêḘḙĚěĔĕẼẽḚḛẺẻĖėËëĒēȨȩĘęᶒɆɇȄȅẾếỀềỄễỂểḜḝḖḗḔḕȆȇẸẹỆệⱸᴇＥｅɘǝƏƐε]',
		'f': '[fƑƒḞḟ]',
		'g': '[gɢ₲ǤǥĜĝĞğĢģƓɠĠġ]',
		'h': '[hĤĥĦħḨḩẖẖḤḥḢḣɦʰǶƕ]',
		'i': '[iÍíÌìĬĭÎîǏǐÏïḮḯĨĩĮįĪīỈỉȈȉȊȋỊịḬḭƗɨɨ̆ᵻᶖİiIıɪＩｉ]',
		'j': '[jȷĴĵɈɉʝɟʲ]',
		'k': '[kƘƙꝀꝁḰḱǨǩḲḳḴḵκϰ₭]',
		'l': '[lŁłĽľĻļĹĺḶḷḸḹḼḽḺḻĿŀȽƚⱠⱡⱢɫɬᶅɭȴʟＬｌ]',
		'n': '[nŃńǸǹŇňÑñṄṅŅņṆṇṊṋṈṉN̈n̈ƝɲȠƞᵰᶇɳȵɴＮｎŊŋ]',
		'o': '[oØøÖöÓóÒòÔôǑǒŐőŎŏȮȯỌọƟɵƠơỎỏŌōÕõǪǫȌȍՕօ]',
		'p': '[pṔṕṖṗⱣᵽƤƥᵱ]',
		'q': '[qꝖꝗʠɊɋꝘꝙq̃]',
		'r': '[rŔŕɌɍŘřŖŗṘṙȐȑȒȓṚṛⱤɽ]',
		's': '[sŚśṠṡṢṣꞨꞩŜŝŠšŞşȘșS̈s̈]',
		't': '[tŤťṪṫŢţṬṭƮʈȚțṰṱṮṯƬƭ]',
		'u': '[uŬŭɄʉỤụÜüÚúÙùÛûǓǔŰűŬŭƯưỦủŪūŨũŲųȔȕ∪]',
		'v': '[vṼṽṾṿƲʋꝞꝟⱱʋ]',
		'w': '[wẂẃẀẁŴŵẄẅẆẇẈẉ]',
		'x': '[xẌẍẊẋχ]',
		'y': '[yÝýỲỳŶŷŸÿỸỹẎẏỴỵɎɏƳƴ]',
		'z': '[zŹźẐẑŽžŻżẒẓẔẕƵƶ]'
	};

	var asciifold = function () {
		var i, n, k, chunk;
		var foreignletters = '';
		var lookup = {};
		for (k in DIACRITICS) {
			if (DIACRITICS.hasOwnProperty(k)) {
				chunk = DIACRITICS[k].substring(2, DIACRITICS[k].length - 1);
				foreignletters += chunk;
				for (i = 0, n = chunk.length; i < n; i++) {
					lookup[chunk.charAt(i)] = k;
				}
			}
		}
		var regexp = new RegExp('[' + foreignletters + ']', 'g');
		return function (str) {
			return str.replace(regexp, function (foreignletter) {
				return lookup[foreignletter];
			}).toLowerCase();
		};
	}();

	// export
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	return Sifter;
});

/**
 * microplugin.js
 * Copyright (c) 2013 Brian Reavis & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@thirdroute.com>
 */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('microplugin', factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.MicroPlugin = factory();
	}
})(this, function () {
	var MicroPlugin = {};

	MicroPlugin.mixin = function (Interface) {
		Interface.plugins = {};

		/**
   * Initializes the listed plugins (with options).
   * Acceptable formats:
   *
   * List (without options):
   *   ['a', 'b', 'c']
   *
   * List (with options):
   *   [{'name': 'a', options: {}}, {'name': 'b', options: {}}]
   *
   * Hash (with options):
   *   {'a': { ... }, 'b': { ... }, 'c': { ... }}
   *
   * @param {mixed} plugins
   */
		Interface.prototype.initializePlugins = function (plugins) {
			var i, n, key;
			var self = this;
			var queue = [];

			self.plugins = {
				names: [],
				settings: {},
				requested: {},
				loaded: {}
			};

			if (utils.isArray(plugins)) {
				for (i = 0, n = plugins.length; i < n; i++) {
					if (typeof plugins[i] === 'string') {
						queue.push(plugins[i]);
					} else {
						self.plugins.settings[plugins[i].name] = plugins[i].options;
						queue.push(plugins[i].name);
					}
				}
			} else if (plugins) {
				for (key in plugins) {
					if (plugins.hasOwnProperty(key)) {
						self.plugins.settings[key] = plugins[key];
						queue.push(key);
					}
				}
			}

			while (queue.length) {
				self.require(queue.shift());
			}
		};

		Interface.prototype.loadPlugin = function (name) {
			var self = this;
			var plugins = self.plugins;
			var plugin = Interface.plugins[name];

			if (!Interface.plugins.hasOwnProperty(name)) {
				throw new Error('Unable to find "' + name + '" plugin');
			}

			plugins.requested[name] = true;
			plugins.loaded[name] = plugin.fn.apply(self, [self.plugins.settings[name] || {}]);
			plugins.names.push(name);
		};

		/**
   * Initializes a plugin.
   *
   * @param {string} name
   */
		Interface.prototype.require = function (name) {
			var self = this;
			var plugins = self.plugins;

			if (!self.plugins.loaded.hasOwnProperty(name)) {
				if (plugins.requested[name]) {
					throw new Error('Plugin has circular dependency ("' + name + '")');
				}
				self.loadPlugin(name);
			}

			return plugins.loaded[name];
		};

		/**
   * Registers a plugin.
   *
   * @param {string} name
   * @param {function} fn
   */
		Interface.define = function (name, fn) {
			Interface.plugins[name] = {
				'name': name,
				'fn': fn
			};
		};
	};

	var utils = {
		isArray: Array.isArray || function (vArg) {
			return Object.prototype.toString.call(vArg) === '[object Array]';
		}
	};

	return MicroPlugin;
});

/**
 * selectize.js (v0.12.4)
 * Copyright (c) 2013–2015 Brian Reavis & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@thirdroute.com>
 */

/*jshint curly:false */
/*jshint browser:true */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('selectize', ['jquery', 'sifter', 'microplugin'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('jquery'), require('sifter'), require('microplugin'));
	} else {
		root.Selectize = factory(root.jQuery, root.Sifter, root.MicroPlugin);
	}
})(this, function ($, Sifter, MicroPlugin) {
	'use strict';

	var highlight = function ($element, pattern) {
		if (typeof pattern === 'string' && !pattern.length) return;
		var regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;

		var highlight = function (node) {
			var skip = 0;
			if (node.nodeType === 3) {
				var pos = node.data.search(regex);
				if (pos >= 0 && node.data.length > 0) {
					var match = node.data.match(regex);
					var spannode = document.createElement('span');
					spannode.className = 'highlight';
					var middlebit = node.splitText(pos);
					var endbit = middlebit.splitText(match[0].length);
					var middleclone = middlebit.cloneNode(true);
					spannode.appendChild(middleclone);
					middlebit.parentNode.replaceChild(spannode, middlebit);
					skip = 1;
				}
			} else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
				for (var i = 0; i < node.childNodes.length; ++i) {
					i += highlight(node.childNodes[i]);
				}
			}
			return skip;
		};

		return $element.each(function () {
			highlight(this);
		});
	};

	/**
  * removeHighlight fn copied from highlight v5 and
  * edited to remove with() and pass js strict mode
  */
	$.fn.removeHighlight = function () {
		return this.find("span.highlight").each(function () {
			this.parentNode.firstChild.nodeName;
			var parent = this.parentNode;
			parent.replaceChild(this.firstChild, this);
			parent.normalize();
		}).end();
	};

	var MicroEvent = function () {};
	MicroEvent.prototype = {
		on: function (event, fct) {
			this._events = this._events || {};
			this._events[event] = this._events[event] || [];
			this._events[event].push(fct);
		},
		off: function (event, fct) {
			var n = arguments.length;
			if (n === 0) return delete this._events;
			if (n === 1) return delete this._events[event];

			this._events = this._events || {};
			if (event in this._events === false) return;
			this._events[event].splice(this._events[event].indexOf(fct), 1);
		},
		trigger: function (event /* , args... */) {
			this._events = this._events || {};
			if (event in this._events === false) return;
			for (var i = 0; i < this._events[event].length; i++) {
				this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		}
	};

	/**
  * Mixin will delegate all MicroEvent.js function in the destination object.
  *
  * - MicroEvent.mixin(Foobar) will make Foobar able to use MicroEvent
  *
  * @param {object} the object which will support MicroEvent
  */
	MicroEvent.mixin = function (destObject) {
		var props = ['on', 'off', 'trigger'];
		for (var i = 0; i < props.length; i++) {
			destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
		}
	};

	var IS_MAC = /Mac/.test(navigator.userAgent);

	var KEY_A = 65;
	var KEY_COMMA = 188;
	var KEY_RETURN = 13;
	var KEY_ESC = 27;
	var KEY_LEFT = 37;
	var KEY_UP = 38;
	var KEY_P = 80;
	var KEY_RIGHT = 39;
	var KEY_DOWN = 40;
	var KEY_N = 78;
	var KEY_BACKSPACE = 8;
	var KEY_DELETE = 46;
	var KEY_SHIFT = 16;
	var KEY_CMD = IS_MAC ? 91 : 17;
	var KEY_CTRL = IS_MAC ? 18 : 17;
	var KEY_TAB = 9;

	var TAG_SELECT = 1;
	var TAG_INPUT = 2;

	// for now, android support in general is too spotty to support validity
	var SUPPORTS_VALIDITY_API = !/android/i.test(window.navigator.userAgent) && !!document.createElement('input').validity;

	var isset = function (object) {
		return typeof object !== 'undefined';
	};

	/**
  * Converts a scalar to its best string representation
  * for hash keys and HTML attribute values.
  *
  * Transformations:
  *   'str'     -> 'str'
  *   null      -> ''
  *   undefined -> ''
  *   true      -> '1'
  *   false     -> '0'
  *   0         -> '0'
  *   1         -> '1'
  *
  * @param {string} value
  * @returns {string|null}
  */
	var hash_key = function (value) {
		if (typeof value === 'undefined' || value === null) return null;
		if (typeof value === 'boolean') return value ? '1' : '0';
		return value + '';
	};

	/**
  * Escapes a string for use within HTML.
  *
  * @param {string} str
  * @returns {string}
  */
	var escape_html = function (str) {
		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	};

	/**
  * Escapes "$" characters in replacement strings.
  *
  * @param {string} str
  * @returns {string}
  */
	var escape_replace = function (str) {
		return (str + '').replace(/\$/g, '$$$$');
	};

	var hook = {};

	/**
  * Wraps `method` on `self` so that `fn`
  * is invoked before the original method.
  *
  * @param {object} self
  * @param {string} method
  * @param {function} fn
  */
	hook.before = function (self, method, fn) {
		var original = self[method];
		self[method] = function () {
			fn.apply(self, arguments);
			return original.apply(self, arguments);
		};
	};

	/**
  * Wraps `method` on `self` so that `fn`
  * is invoked after the original method.
  *
  * @param {object} self
  * @param {string} method
  * @param {function} fn
  */
	hook.after = function (self, method, fn) {
		var original = self[method];
		self[method] = function () {
			var result = original.apply(self, arguments);
			fn.apply(self, arguments);
			return result;
		};
	};

	/**
  * Wraps `fn` so that it can only be invoked once.
  *
  * @param {function} fn
  * @returns {function}
  */
	var once = function (fn) {
		var called = false;
		return function () {
			if (called) return;
			called = true;
			fn.apply(this, arguments);
		};
	};

	/**
  * Wraps `fn` so that it can only be called once
  * every `delay` milliseconds (invoked on the falling edge).
  *
  * @param {function} fn
  * @param {int} delay
  * @returns {function}
  */
	var debounce = function (fn, delay) {
		var timeout;
		return function () {
			var self = this;
			var args = arguments;
			window.clearTimeout(timeout);
			timeout = window.setTimeout(function () {
				fn.apply(self, args);
			}, delay);
		};
	};

	/**
  * Debounce all fired events types listed in `types`
  * while executing the provided `fn`.
  *
  * @param {object} self
  * @param {array} types
  * @param {function} fn
  */
	var debounce_events = function (self, types, fn) {
		var type;
		var trigger = self.trigger;
		var event_args = {};

		// override trigger method
		self.trigger = function () {
			var type = arguments[0];
			if (types.indexOf(type) !== -1) {
				event_args[type] = arguments;
			} else {
				return trigger.apply(self, arguments);
			}
		};

		// invoke provided function
		fn.apply(self, []);
		self.trigger = trigger;

		// trigger queued events
		for (type in event_args) {
			if (event_args.hasOwnProperty(type)) {
				trigger.apply(self, event_args[type]);
			}
		}
	};

	/**
  * A workaround for http://bugs.jquery.com/ticket/6696
  *
  * @param {object} $parent - Parent element to listen on.
  * @param {string} event - Event name.
  * @param {string} selector - Descendant selector to filter by.
  * @param {function} fn - Event handler.
  */
	var watchChildEvent = function ($parent, event, selector, fn) {
		$parent.on(event, selector, function (e) {
			var child = e.target;
			while (child && child.parentNode !== $parent[0]) {
				child = child.parentNode;
			}
			e.currentTarget = child;
			return fn.apply(this, [e]);
		});
	};

	/**
  * Determines the current selection within a text input control.
  * Returns an object containing:
  *   - start
  *   - length
  *
  * @param {object} input
  * @returns {object}
  */
	var getSelection = function (input) {
		var result = {};
		if ('selectionStart' in input) {
			result.start = input.selectionStart;
			result.length = input.selectionEnd - result.start;
		} else if (document.selection) {
			input.focus();
			var sel = document.selection.createRange();
			var selLen = document.selection.createRange().text.length;
			sel.moveStart('character', -input.value.length);
			result.start = sel.text.length - selLen;
			result.length = selLen;
		}
		return result;
	};

	/**
  * Copies CSS properties from one element to another.
  *
  * @param {object} $from
  * @param {object} $to
  * @param {array} properties
  */
	var transferStyles = function ($from, $to, properties) {
		var i,
		    n,
		    styles = {};
		if (properties) {
			for (i = 0, n = properties.length; i < n; i++) {
				styles[properties[i]] = $from.css(properties[i]);
			}
		} else {
			styles = $from.css();
		}
		$to.css(styles);
	};

	/**
  * Measures the width of a string within a
  * parent element (in pixels).
  *
  * @param {string} str
  * @param {object} $parent
  * @returns {int}
  */
	var measureString = function (str, $parent) {
		if (!str) {
			return 0;
		}

		var $test = $('<test>').css({
			position: 'absolute',
			top: -99999,
			left: -99999,
			width: 'auto',
			padding: 0,
			whiteSpace: 'pre'
		}).text(str).appendTo('body');

		transferStyles($parent, $test, ['letterSpacing', 'fontSize', 'fontFamily', 'fontWeight', 'textTransform']);

		var width = $test.width();
		$test.remove();

		return width;
	};

	/**
  * Sets up an input to grow horizontally as the user
  * types. If the value is changed manually, you can
  * trigger the "update" handler to resize:
  *
  * $input.trigger('update');
  *
  * @param {object} $input
  */
	var autoGrow = function ($input) {
		var currentWidth = null;

		var update = function (e, options) {
			var value, keyCode, printable, placeholder, width;
			var shift, character, selection;
			e = e || window.event || {};
			options = options || {};

			if (e.metaKey || e.altKey) return;
			if (!options.force && $input.data('grow') === false) return;

			value = $input.val();
			if (e.type && e.type.toLowerCase() === 'keydown') {
				keyCode = e.keyCode;
				printable = keyCode >= 97 && keyCode <= 122 || // a-z
				keyCode >= 65 && keyCode <= 90 || // A-Z
				keyCode >= 48 && keyCode <= 57 || // 0-9
				keyCode === 32 // space
				;

				if (keyCode === KEY_DELETE || keyCode === KEY_BACKSPACE) {
					selection = getSelection($input[0]);
					if (selection.length) {
						value = value.substring(0, selection.start) + value.substring(selection.start + selection.length);
					} else if (keyCode === KEY_BACKSPACE && selection.start) {
						value = value.substring(0, selection.start - 1) + value.substring(selection.start + 1);
					} else if (keyCode === KEY_DELETE && typeof selection.start !== 'undefined') {
						value = value.substring(0, selection.start) + value.substring(selection.start + 1);
					}
				} else if (printable) {
					shift = e.shiftKey;
					character = String.fromCharCode(e.keyCode);
					if (shift) character = character.toUpperCase();else character = character.toLowerCase();
					value += character;
				}
			}

			placeholder = $input.attr('placeholder');
			if (!value && placeholder) {
				value = placeholder;
			}

			width = measureString(value, $input) + 4;
			if (width !== currentWidth) {
				currentWidth = width;
				$input.width(width);
				$input.triggerHandler('resize');
			}
		};

		$input.on('keydown keyup update blur', update);
		update();
	};

	var domToString = function (d) {
		var tmp = document.createElement('div');

		tmp.appendChild(d.cloneNode(true));

		return tmp.innerHTML;
	};

	var logError = function (message, options) {
		if (!options) options = {};
		var component = "Selectize";

		console.error(component + ": " + message);

		if (options.explanation) {
			// console.group is undefined in <IE11
			if (console.group) console.group();
			console.error(options.explanation);
			if (console.group) console.groupEnd();
		}
	};

	var Selectize = function ($input, settings) {
		var key,
		    i,
		    n,
		    dir,
		    input,
		    self = this;
		input = $input[0];
		input.selectize = self;

		// detect rtl environment
		var computedStyle = window.getComputedStyle && window.getComputedStyle(input, null);
		dir = computedStyle ? computedStyle.getPropertyValue('direction') : input.currentStyle && input.currentStyle.direction;
		dir = dir || $input.parents('[dir]:first').attr('dir') || '';

		// setup default state
		$.extend(self, {
			order: 0,
			settings: settings,
			$input: $input,
			tabIndex: $input.attr('tabindex') || '',
			tagType: input.tagName.toLowerCase() === 'select' ? TAG_SELECT : TAG_INPUT,
			rtl: /rtl/i.test(dir),

			eventNS: '.selectize' + ++Selectize.count,
			highlightedValue: null,
			isOpen: false,
			isDisabled: false,
			isRequired: $input.is('[required]'),
			isInvalid: false,
			isLocked: false,
			isFocused: false,
			isInputHidden: false,
			isSetup: false,
			isShiftDown: false,
			isCmdDown: false,
			isCtrlDown: false,
			ignoreFocus: false,
			ignoreBlur: false,
			ignoreHover: false,
			hasOptions: false,
			currentResults: null,
			lastValue: '',
			caretPos: 0,
			loading: 0,
			loadedSearches: {},

			$activeOption: null,
			$activeItems: [],

			optgroups: {},
			options: {},
			userOptions: {},
			items: [],
			renderCache: {},
			onSearchChange: settings.loadThrottle === null ? self.onSearchChange : debounce(self.onSearchChange, settings.loadThrottle)
		});

		// search system
		self.sifter = new Sifter(this.options, { diacritics: settings.diacritics });

		// build options table
		if (self.settings.options) {
			for (i = 0, n = self.settings.options.length; i < n; i++) {
				self.registerOption(self.settings.options[i]);
			}
			delete self.settings.options;
		}

		// build optgroup table
		if (self.settings.optgroups) {
			for (i = 0, n = self.settings.optgroups.length; i < n; i++) {
				self.registerOptionGroup(self.settings.optgroups[i]);
			}
			delete self.settings.optgroups;
		}

		// option-dependent defaults
		self.settings.mode = self.settings.mode || (self.settings.maxItems === 1 ? 'single' : 'multi');
		if (typeof self.settings.hideSelected !== 'boolean') {
			self.settings.hideSelected = self.settings.mode === 'multi';
		}

		self.initializePlugins(self.settings.plugins);
		self.setupCallbacks();
		self.setupTemplates();
		self.setup();
	};

	// mixins
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	MicroEvent.mixin(Selectize);

	if (typeof MicroPlugin !== "undefined") {
		MicroPlugin.mixin(Selectize);
	} else {
		logError("Dependency MicroPlugin is missing", { explanation: "Make sure you either: (1) are using the \"standalone\" " + "version of Selectize, or (2) require MicroPlugin before you " + "load Selectize." });
	}

	// methods
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	$.extend(Selectize.prototype, {

		/**
   * Creates all elements and sets up event bindings.
   */
		setup: function () {
			var self = this;
			var settings = self.settings;
			var eventNS = self.eventNS;
			var $window = $(window);
			var $document = $(document);
			var $input = self.$input;

			var $wrapper;
			var $control;
			var $control_input;
			var $dropdown;
			var $dropdown_content;
			var $dropdown_parent;
			var inputMode;
			var timeout_blur;
			var timeout_focus;
			var classes;
			var classes_plugins;
			var inputId;

			inputMode = self.settings.mode;
			classes = $input.attr('class') || '';

			$wrapper = $('<div>').addClass(settings.wrapperClass).addClass(classes).addClass(inputMode);
			$control = $('<div>').addClass(settings.inputClass).addClass('items').appendTo($wrapper);
			$control_input = $('<input type="text" autocomplete="off" />').appendTo($control).attr('tabindex', $input.is(':disabled') ? '-1' : self.tabIndex);
			$dropdown_parent = $(settings.dropdownParent || $wrapper);
			$dropdown = $('<div>').addClass(settings.dropdownClass).addClass(inputMode).hide().appendTo($dropdown_parent);
			$dropdown_content = $('<div>').addClass(settings.dropdownContentClass).appendTo($dropdown);

			if (inputId = $input.attr('id')) {
				$control_input.attr('id', inputId + '-selectized');
				$("label[for='" + inputId + "']").attr('for', inputId + '-selectized');
			}

			if (self.settings.copyClassesToDropdown) {
				$dropdown.addClass(classes);
			}

			$wrapper.css({
				width: $input[0].style.width
			});

			if (self.plugins.names.length) {
				classes_plugins = 'plugin-' + self.plugins.names.join(' plugin-');
				$wrapper.addClass(classes_plugins);
				$dropdown.addClass(classes_plugins);
			}

			if ((settings.maxItems === null || settings.maxItems > 1) && self.tagType === TAG_SELECT) {
				$input.attr('multiple', 'multiple');
			}

			if (self.settings.placeholder) {
				$control_input.attr('placeholder', settings.placeholder);
			}

			// if splitOn was not passed in, construct it from the delimiter to allow pasting universally
			if (!self.settings.splitOn && self.settings.delimiter) {
				var delimiterEscaped = self.settings.delimiter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
				self.settings.splitOn = new RegExp('\\s*' + delimiterEscaped + '+\\s*');
			}

			if ($input.attr('autocorrect')) {
				$control_input.attr('autocorrect', $input.attr('autocorrect'));
			}

			if ($input.attr('autocapitalize')) {
				$control_input.attr('autocapitalize', $input.attr('autocapitalize'));
			}

			self.$wrapper = $wrapper;
			self.$control = $control;
			self.$control_input = $control_input;
			self.$dropdown = $dropdown;
			self.$dropdown_content = $dropdown_content;

			$dropdown.on('mouseenter', '[data-selectable]', function () {
				return self.onOptionHover.apply(self, arguments);
			});
			$dropdown.on('mousedown click', '[data-selectable]', function () {
				return self.onOptionSelect.apply(self, arguments);
			});
			watchChildEvent($control, 'mousedown', '*:not(input)', function () {
				return self.onItemSelect.apply(self, arguments);
			});
			autoGrow($control_input);

			$control.on({
				mousedown: function () {
					return self.onMouseDown.apply(self, arguments);
				},
				click: function () {
					return self.onClick.apply(self, arguments);
				}
			});

			$control_input.on({
				mousedown: function (e) {
					e.stopPropagation();
				},
				keydown: function () {
					return self.onKeyDown.apply(self, arguments);
				},
				keyup: function () {
					return self.onKeyUp.apply(self, arguments);
				},
				keypress: function () {
					return self.onKeyPress.apply(self, arguments);
				},
				resize: function () {
					self.positionDropdown.apply(self, []);
				},
				blur: function () {
					return self.onBlur.apply(self, arguments);
				},
				focus: function () {
					self.ignoreBlur = false;return self.onFocus.apply(self, arguments);
				},
				paste: function () {
					return self.onPaste.apply(self, arguments);
				}
			});

			$document.on('keydown' + eventNS, function (e) {
				self.isCmdDown = e[IS_MAC ? 'metaKey' : 'ctrlKey'];
				self.isCtrlDown = e[IS_MAC ? 'altKey' : 'ctrlKey'];
				self.isShiftDown = e.shiftKey;
			});

			$document.on('keyup' + eventNS, function (e) {
				if (e.keyCode === KEY_CTRL) self.isCtrlDown = false;
				if (e.keyCode === KEY_SHIFT) self.isShiftDown = false;
				if (e.keyCode === KEY_CMD) self.isCmdDown = false;
			});

			$document.on('mousedown' + eventNS, function (e) {
				if (self.isFocused) {
					// prevent events on the dropdown scrollbar from causing the control to blur
					if (e.target === self.$dropdown[0] || e.target.parentNode === self.$dropdown[0]) {
						return false;
					}
					// blur on click outside
					if (!self.$control.has(e.target).length && e.target !== self.$control[0]) {
						self.blur(e.target);
					}
				}
			});

			$window.on(['scroll' + eventNS, 'resize' + eventNS].join(' '), function () {
				if (self.isOpen) {
					self.positionDropdown.apply(self, arguments);
				}
			});
			$window.on('mousemove' + eventNS, function () {
				self.ignoreHover = false;
			});

			// store original children and tab index so that they can be
			// restored when the destroy() method is called.
			this.revertSettings = {
				$children: $input.children().detach(),
				tabindex: $input.attr('tabindex')
			};

			$input.attr('tabindex', -1).hide().after(self.$wrapper);

			if ($.isArray(settings.items)) {
				self.setValue(settings.items);
				delete settings.items;
			}

			// feature detect for the validation API
			if (SUPPORTS_VALIDITY_API) {
				$input.on('invalid' + eventNS, function (e) {
					e.preventDefault();
					self.isInvalid = true;
					self.refreshState();
				});
			}

			self.updateOriginalInput();
			self.refreshItems();
			self.refreshState();
			self.updatePlaceholder();
			self.isSetup = true;

			if ($input.is(':disabled')) {
				self.disable();
			}

			self.on('change', this.onChange);

			$input.data('selectize', self);
			$input.addClass('selectized');
			self.trigger('initialize');

			// preload options
			if (settings.preload === true) {
				self.onSearchChange('');
			}
		},

		/**
   * Sets up default rendering functions.
   */
		setupTemplates: function () {
			var self = this;
			var field_label = self.settings.labelField;
			var field_optgroup = self.settings.optgroupLabelField;

			var templates = {
				'optgroup': function (data) {
					return '<div class="optgroup">' + data.html + '</div>';
				},
				'optgroup_header': function (data, escape) {
					return '<div class="optgroup-header">' + escape(data[field_optgroup]) + '</div>';
				},
				'option': function (data, escape) {
					return '<div class="option">' + escape(data[field_label]) + '</div>';
				},
				'item': function (data, escape) {
					return '<div class="item">' + escape(data[field_label]) + '</div>';
				},
				'option_create': function (data, escape) {
					return '<div class="create">Add <strong>' + escape(data.input) + '</strong>&hellip;</div>';
				}
			};

			self.settings.render = $.extend({}, templates, self.settings.render);
		},

		/**
   * Maps fired events to callbacks provided
   * in the settings used when creating the control.
   */
		setupCallbacks: function () {
			var key,
			    fn,
			    callbacks = {
				'initialize': 'onInitialize',
				'change': 'onChange',
				'item_add': 'onItemAdd',
				'item_remove': 'onItemRemove',
				'clear': 'onClear',
				'option_add': 'onOptionAdd',
				'option_remove': 'onOptionRemove',
				'option_clear': 'onOptionClear',
				'optgroup_add': 'onOptionGroupAdd',
				'optgroup_remove': 'onOptionGroupRemove',
				'optgroup_clear': 'onOptionGroupClear',
				'dropdown_open': 'onDropdownOpen',
				'dropdown_close': 'onDropdownClose',
				'type': 'onType',
				'load': 'onLoad',
				'focus': 'onFocus',
				'blur': 'onBlur'
			};

			for (key in callbacks) {
				if (callbacks.hasOwnProperty(key)) {
					fn = this.settings[callbacks[key]];
					if (fn) this.on(key, fn);
				}
			}
		},

		/**
   * Triggered when the main control element
   * has a click event.
   *
   * @param {object} e
   * @return {boolean}
   */
		onClick: function (e) {
			var self = this;

			// necessary for mobile webkit devices (manual focus triggering
			// is ignored unless invoked within a click event)
			if (!self.isFocused) {
				self.focus();
				e.preventDefault();
			}
		},

		/**
   * Triggered when the main control element
   * has a mouse down event.
   *
   * @param {object} e
   * @return {boolean}
   */
		onMouseDown: function (e) {
			var self = this;
			var defaultPrevented = e.isDefaultPrevented();
			var $target = $(e.target);

			if (self.isFocused) {
				// retain focus by preventing native handling. if the
				// event target is the input it should not be modified.
				// otherwise, text selection within the input won't work.
				if (e.target !== self.$control_input[0]) {
					if (self.settings.mode === 'single') {
						// toggle dropdown
						self.isOpen ? self.close() : self.open();
					} else if (!defaultPrevented) {
						self.setActiveItem(null);
					}
					return false;
				}
			} else {
				// give control focus
				if (!defaultPrevented) {
					window.setTimeout(function () {
						self.focus();
					}, 0);
				}
			}
		},

		/**
   * Triggered when the value of the control has been changed.
   * This should propagate the event to the original DOM
   * input / select element.
   */
		onChange: function () {
			this.$input.trigger('change');
		},

		/**
   * Triggered on <input> paste.
   *
   * @param {object} e
   * @returns {boolean}
   */
		onPaste: function (e) {
			var self = this;

			if (self.isFull() || self.isInputHidden || self.isLocked) {
				e.preventDefault();
				return;
			}

			// If a regex or string is included, this will split the pasted
			// input and create Items for each separate value
			if (self.settings.splitOn) {

				// Wait for pasted text to be recognized in value
				setTimeout(function () {
					var pastedText = self.$control_input.val();
					if (!pastedText.match(self.settings.splitOn)) {
						return;
					}

					var splitInput = $.trim(pastedText).split(self.settings.splitOn);
					for (var i = 0, n = splitInput.length; i < n; i++) {
						self.createItem(splitInput[i]);
					}
				}, 0);
			}
		},

		/**
   * Triggered on <input> keypress.
   *
   * @param {object} e
   * @returns {boolean}
   */
		onKeyPress: function (e) {
			if (this.isLocked) return e && e.preventDefault();
			var character = String.fromCharCode(e.keyCode || e.which);
			if (this.settings.create && this.settings.mode === 'multi' && character === this.settings.delimiter) {
				this.createItem();
				e.preventDefault();
				return false;
			}
		},

		/**
   * Triggered on <input> keydown.
   *
   * @param {object} e
   * @returns {boolean}
   */
		onKeyDown: function (e) {
			var isInput = e.target === this.$control_input[0];
			var self = this;

			if (self.isLocked) {
				if (e.keyCode !== KEY_TAB) {
					e.preventDefault();
				}
				return;
			}

			switch (e.keyCode) {
				case KEY_A:
					if (self.isCmdDown) {
						self.selectAll();
						return;
					}
					break;
				case KEY_ESC:
					if (self.isOpen) {
						e.preventDefault();
						e.stopPropagation();
						self.close();
					}
					return;
				case KEY_N:
					if (!e.ctrlKey || e.altKey) break;
				case KEY_DOWN:
					if (!self.isOpen && self.hasOptions) {
						self.open();
					} else if (self.$activeOption) {
						self.ignoreHover = true;
						var $next = self.getAdjacentOption(self.$activeOption, 1);
						if ($next.length) self.setActiveOption($next, true, true);
					}
					e.preventDefault();
					return;
				case KEY_P:
					if (!e.ctrlKey || e.altKey) break;
				case KEY_UP:
					if (self.$activeOption) {
						self.ignoreHover = true;
						var $prev = self.getAdjacentOption(self.$activeOption, -1);
						if ($prev.length) self.setActiveOption($prev, true, true);
					}
					e.preventDefault();
					return;
				case KEY_RETURN:
					if (self.isOpen && self.$activeOption) {
						self.onOptionSelect({ currentTarget: self.$activeOption });
						e.preventDefault();
					}
					return;
				case KEY_LEFT:
					self.advanceSelection(-1, e);
					return;
				case KEY_RIGHT:
					self.advanceSelection(1, e);
					return;
				case KEY_TAB:
					if (self.settings.selectOnTab && self.isOpen && self.$activeOption) {
						self.onOptionSelect({ currentTarget: self.$activeOption });

						// Default behaviour is to jump to the next field, we only want this
						// if the current field doesn't accept any more entries
						if (!self.isFull()) {
							e.preventDefault();
						}
					}
					if (self.settings.create && self.createItem()) {
						e.preventDefault();
					}
					return;
				case KEY_BACKSPACE:
				case KEY_DELETE:
					self.deleteSelection(e);
					return;
			}

			if ((self.isFull() || self.isInputHidden) && !(IS_MAC ? e.metaKey : e.ctrlKey)) {
				e.preventDefault();
				return;
			}
		},

		/**
   * Triggered on <input> keyup.
   *
   * @param {object} e
   * @returns {boolean}
   */
		onKeyUp: function (e) {
			var self = this;

			if (self.isLocked) return e && e.preventDefault();
			var value = self.$control_input.val() || '';
			if (self.lastValue !== value) {
				self.lastValue = value;
				self.onSearchChange(value);
				self.refreshOptions();
				self.trigger('type', value);
			}
		},

		/**
   * Invokes the user-provide option provider / loader.
   *
   * Note: this function is debounced in the Selectize
   * constructor (by `settings.loadThrottle` milliseconds)
   *
   * @param {string} value
   */
		onSearchChange: function (value) {
			var self = this;
			var fn = self.settings.load;
			if (!fn) return;
			if (self.loadedSearches.hasOwnProperty(value)) return;
			self.loadedSearches[value] = true;
			self.load(function (callback) {
				fn.apply(self, [value, callback]);
			});
		},

		/**
   * Triggered on <input> focus.
   *
   * @param {object} e (optional)
   * @returns {boolean}
   */
		onFocus: function (e) {
			var self = this;
			var wasFocused = self.isFocused;

			if (self.isDisabled) {
				self.blur();
				e && e.preventDefault();
				return false;
			}

			if (self.ignoreFocus) return;
			self.isFocused = true;
			if (self.settings.preload === 'focus') self.onSearchChange('');

			if (!wasFocused) self.trigger('focus');

			if (!self.$activeItems.length) {
				self.showInput();
				self.setActiveItem(null);
				self.refreshOptions(!!self.settings.openOnFocus);
			}

			self.refreshState();
		},

		/**
   * Triggered on <input> blur.
   *
   * @param {object} e
   * @param {Element} dest
   */
		onBlur: function (e, dest) {
			var self = this;
			if (!self.isFocused) return;
			self.isFocused = false;

			if (self.ignoreFocus) {
				return;
			} else if (!self.ignoreBlur && document.activeElement === self.$dropdown_content[0]) {
				// necessary to prevent IE closing the dropdown when the scrollbar is clicked
				self.ignoreBlur = true;
				self.onFocus(e);
				return;
			}

			var deactivate = function () {
				self.close();
				self.setTextboxValue('');
				self.setActiveItem(null);
				self.setActiveOption(null);
				self.setCaret(self.items.length);
				self.refreshState();

				// IE11 bug: element still marked as active
				dest && dest.focus && dest.focus();

				self.ignoreFocus = false;
				self.trigger('blur');
			};

			self.ignoreFocus = true;
			if (self.settings.create && self.settings.createOnBlur) {
				self.createItem(null, false, deactivate);
			} else {
				deactivate();
			}
		},

		/**
   * Triggered when the user rolls over
   * an option in the autocomplete dropdown menu.
   *
   * @param {object} e
   * @returns {boolean}
   */
		onOptionHover: function (e) {
			if (this.ignoreHover) return;
			this.setActiveOption(e.currentTarget, false);
		},

		/**
   * Triggered when the user clicks on an option
   * in the autocomplete dropdown menu.
   *
   * @param {object} e
   * @returns {boolean}
   */
		onOptionSelect: function (e) {
			var value,
			    $target,
			    $option,
			    self = this;

			if (e.preventDefault) {
				e.preventDefault();
				e.stopPropagation();
			}

			$target = $(e.currentTarget);
			if ($target.hasClass('create')) {
				self.createItem(null, function () {
					if (self.settings.closeAfterSelect) {
						self.close();
					}
				});
			} else {
				value = $target.attr('data-value');
				if (typeof value !== 'undefined') {
					self.lastQuery = null;
					self.setTextboxValue('');
					self.addItem(value);
					if (self.settings.closeAfterSelect) {
						self.close();
					} else if (!self.settings.hideSelected && e.type && /mouse/.test(e.type)) {
						self.setActiveOption(self.getOption(value));
					}
				}
			}
		},

		/**
   * Triggered when the user clicks on an item
   * that has been selected.
   *
   * @param {object} e
   * @returns {boolean}
   */
		onItemSelect: function (e) {
			var self = this;

			if (self.isLocked) return;
			if (self.settings.mode === 'multi') {
				e.preventDefault();
				self.setActiveItem(e.currentTarget, e);
			}
		},

		/**
   * Invokes the provided method that provides
   * results to a callback---which are then added
   * as options to the control.
   *
   * @param {function} fn
   */
		load: function (fn) {
			var self = this;
			var $wrapper = self.$wrapper.addClass(self.settings.loadingClass);

			self.loading++;
			fn.apply(self, [function (results) {
				self.loading = Math.max(self.loading - 1, 0);
				if (results && results.length) {
					self.addOption(results);
					self.refreshOptions(self.isFocused && !self.isInputHidden);
				}
				if (!self.loading) {
					$wrapper.removeClass(self.settings.loadingClass);
				}
				self.trigger('load', results);
			}]);
		},

		/**
   * Sets the input field of the control to the specified value.
   *
   * @param {string} value
   */
		setTextboxValue: function (value) {
			var $input = this.$control_input;
			var changed = $input.val() !== value;
			if (changed) {
				$input.val(value).triggerHandler('update');
				this.lastValue = value;
			}
		},

		/**
   * Returns the value of the control. If multiple items
   * can be selected (e.g. <select multiple>), this returns
   * an array. If only one item can be selected, this
   * returns a string.
   *
   * @returns {mixed}
   */
		getValue: function () {
			if (this.tagType === TAG_SELECT && this.$input.attr('multiple')) {
				return this.items;
			} else {
				return this.items.join(this.settings.delimiter);
			}
		},

		/**
   * Resets the selected items to the given value.
   *
   * @param {mixed} value
   */
		setValue: function (value, silent) {
			var events = silent ? [] : ['change'];

			debounce_events(this, events, function () {
				this.clear(silent);
				this.addItems(value, silent);
			});
		},

		/**
   * Sets the selected item.
   *
   * @param {object} $item
   * @param {object} e (optional)
   */
		setActiveItem: function ($item, e) {
			var self = this;
			var eventName;
			var i, idx, begin, end, item, swap;
			var $last;

			if (self.settings.mode === 'single') return;
			$item = $($item);

			// clear the active selection
			if (!$item.length) {
				$(self.$activeItems).removeClass('active');
				self.$activeItems = [];
				if (self.isFocused) {
					self.showInput();
				}
				return;
			}

			// modify selection
			eventName = e && e.type.toLowerCase();

			if (eventName === 'mousedown' && self.isShiftDown && self.$activeItems.length) {
				$last = self.$control.children('.active:last');
				begin = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$last[0]]);
				end = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$item[0]]);
				if (begin > end) {
					swap = begin;
					begin = end;
					end = swap;
				}
				for (i = begin; i <= end; i++) {
					item = self.$control[0].childNodes[i];
					if (self.$activeItems.indexOf(item) === -1) {
						$(item).addClass('active');
						self.$activeItems.push(item);
					}
				}
				e.preventDefault();
			} else if (eventName === 'mousedown' && self.isCtrlDown || eventName === 'keydown' && this.isShiftDown) {
				if ($item.hasClass('active')) {
					idx = self.$activeItems.indexOf($item[0]);
					self.$activeItems.splice(idx, 1);
					$item.removeClass('active');
				} else {
					self.$activeItems.push($item.addClass('active')[0]);
				}
			} else {
				$(self.$activeItems).removeClass('active');
				self.$activeItems = [$item.addClass('active')[0]];
			}

			// ensure control has focus
			self.hideInput();
			if (!this.isFocused) {
				self.focus();
			}
		},

		/**
   * Sets the selected item in the dropdown menu
   * of available options.
   *
   * @param {object} $object
   * @param {boolean} scroll
   * @param {boolean} animate
   */
		setActiveOption: function ($option, scroll, animate) {
			var height_menu, height_item, y;
			var scroll_top, scroll_bottom;
			var self = this;

			if (self.$activeOption) self.$activeOption.removeClass('active');
			self.$activeOption = null;

			$option = $($option);
			if (!$option.length) return;

			self.$activeOption = $option.addClass('active');

			if (scroll || !isset(scroll)) {

				height_menu = self.$dropdown_content.height();
				height_item = self.$activeOption.outerHeight(true);
				scroll = self.$dropdown_content.scrollTop() || 0;
				y = self.$activeOption.offset().top - self.$dropdown_content.offset().top + scroll;
				scroll_top = y;
				scroll_bottom = y - height_menu + height_item;

				if (y + height_item > height_menu + scroll) {
					self.$dropdown_content.stop().animate({ scrollTop: scroll_bottom }, animate ? self.settings.scrollDuration : 0);
				} else if (y < scroll) {
					self.$dropdown_content.stop().animate({ scrollTop: scroll_top }, animate ? self.settings.scrollDuration : 0);
				}
			}
		},

		/**
   * Selects all items (CTRL + A).
   */
		selectAll: function () {
			var self = this;
			if (self.settings.mode === 'single') return;

			self.$activeItems = Array.prototype.slice.apply(self.$control.children(':not(input)').addClass('active'));
			if (self.$activeItems.length) {
				self.hideInput();
				self.close();
			}
			self.focus();
		},

		/**
   * Hides the input element out of view, while
   * retaining its focus.
   */
		hideInput: function () {
			var self = this;

			self.setTextboxValue('');
			self.$control_input.css({ opacity: 0, position: 'absolute', left: self.rtl ? 10000 : -10000 });
			self.isInputHidden = true;
		},

		/**
   * Restores input visibility.
   */
		showInput: function () {
			this.$control_input.css({ opacity: 1, position: 'relative', left: 0 });
			this.isInputHidden = false;
		},

		/**
   * Gives the control focus.
   */
		focus: function () {
			var self = this;
			if (self.isDisabled) return;

			self.ignoreFocus = true;
			self.$control_input[0].focus();
			window.setTimeout(function () {
				self.ignoreFocus = false;
				self.onFocus();
			}, 0);
		},

		/**
   * Forces the control out of focus.
   *
   * @param {Element} dest
   */
		blur: function (dest) {
			this.$control_input[0].blur();
			this.onBlur(null, dest);
		},

		/**
   * Returns a function that scores an object
   * to show how good of a match it is to the
   * provided query.
   *
   * @param {string} query
   * @param {object} options
   * @return {function}
   */
		getScoreFunction: function (query) {
			return this.sifter.getScoreFunction(query, this.getSearchOptions());
		},

		/**
   * Returns search options for sifter (the system
   * for scoring and sorting results).
   *
   * @see https://github.com/brianreavis/sifter.js
   * @return {object}
   */
		getSearchOptions: function () {
			var settings = this.settings;
			var sort = settings.sortField;
			if (typeof sort === 'string') {
				sort = [{ field: sort }];
			}

			return {
				fields: settings.searchField,
				conjunction: settings.searchConjunction,
				sort: sort
			};
		},

		/**
   * Searches through available options and returns
   * a sorted array of matches.
   *
   * Returns an object containing:
   *
   *   - query {string}
   *   - tokens {array}
   *   - total {int}
   *   - items {array}
   *
   * @param {string} query
   * @returns {object}
   */
		search: function (query) {
			var i, value, score, result, calculateScore;
			var self = this;
			var settings = self.settings;
			var options = this.getSearchOptions();

			// validate user-provided result scoring function
			if (settings.score) {
				calculateScore = self.settings.score.apply(this, [query]);
				if (typeof calculateScore !== 'function') {
					throw new Error('Selectize "score" setting must be a function that returns a function');
				}
			}

			// perform search
			if (query !== self.lastQuery) {
				self.lastQuery = query;
				result = self.sifter.search(query, $.extend(options, { score: calculateScore }));
				self.currentResults = result;
			} else {
				result = $.extend(true, {}, self.currentResults);
			}

			// filter out selected items
			if (settings.hideSelected) {
				for (i = result.items.length - 1; i >= 0; i--) {
					if (self.items.indexOf(hash_key(result.items[i].id)) !== -1) {
						result.items.splice(i, 1);
					}
				}
			}

			return result;
		},

		/**
   * Refreshes the list of available options shown
   * in the autocomplete dropdown menu.
   *
   * @param {boolean} triggerDropdown
   */
		refreshOptions: function (triggerDropdown) {
			var i, j, k, n, groups, groups_order, option, option_html, optgroup, optgroups, html, html_children, has_create_option;
			var $active, $active_before, $create;

			if (typeof triggerDropdown === 'undefined') {
				triggerDropdown = true;
			}

			var self = this;
			var query = $.trim(self.$control_input.val());
			var results = self.search(query);
			var $dropdown_content = self.$dropdown_content;
			var active_before = self.$activeOption && hash_key(self.$activeOption.attr('data-value'));

			// build markup
			n = results.items.length;
			if (typeof self.settings.maxOptions === 'number') {
				n = Math.min(n, self.settings.maxOptions);
			}

			// render and group available options individually
			groups = {};
			groups_order = [];

			for (i = 0; i < n; i++) {
				option = self.options[results.items[i].id];
				option_html = self.render('option', option);
				optgroup = option[self.settings.optgroupField] || '';
				optgroups = $.isArray(optgroup) ? optgroup : [optgroup];

				for (j = 0, k = optgroups && optgroups.length; j < k; j++) {
					optgroup = optgroups[j];
					if (!self.optgroups.hasOwnProperty(optgroup)) {
						optgroup = '';
					}
					if (!groups.hasOwnProperty(optgroup)) {
						groups[optgroup] = document.createDocumentFragment();
						groups_order.push(optgroup);
					}
					groups[optgroup].appendChild(option_html);
				}
			}

			// sort optgroups
			if (this.settings.lockOptgroupOrder) {
				groups_order.sort(function (a, b) {
					var a_order = self.optgroups[a].$order || 0;
					var b_order = self.optgroups[b].$order || 0;
					return a_order - b_order;
				});
			}

			// render optgroup headers & join groups
			html = document.createDocumentFragment();
			for (i = 0, n = groups_order.length; i < n; i++) {
				optgroup = groups_order[i];
				if (self.optgroups.hasOwnProperty(optgroup) && groups[optgroup].childNodes.length) {
					// render the optgroup header and options within it,
					// then pass it to the wrapper template
					html_children = document.createDocumentFragment();
					html_children.appendChild(self.render('optgroup_header', self.optgroups[optgroup]));
					html_children.appendChild(groups[optgroup]);

					html.appendChild(self.render('optgroup', $.extend({}, self.optgroups[optgroup], {
						html: domToString(html_children),
						dom: html_children
					})));
				} else {
					html.appendChild(groups[optgroup]);
				}
			}

			$dropdown_content.html(html);

			// highlight matching terms inline
			if (self.settings.highlight && results.query.length && results.tokens.length) {
				$dropdown_content.removeHighlight();
				for (i = 0, n = results.tokens.length; i < n; i++) {
					highlight($dropdown_content, results.tokens[i].regex);
				}
			}

			// add "selected" class to selected options
			if (!self.settings.hideSelected) {
				for (i = 0, n = self.items.length; i < n; i++) {
					self.getOption(self.items[i]).addClass('selected');
				}
			}

			// add create option
			has_create_option = self.canCreate(query);
			if (has_create_option) {
				$dropdown_content.prepend(self.render('option_create', { input: query }));
				$create = $($dropdown_content[0].childNodes[0]);
			}

			// activate
			self.hasOptions = results.items.length > 0 || has_create_option;
			if (self.hasOptions) {
				if (results.items.length > 0) {
					$active_before = active_before && self.getOption(active_before);
					if ($active_before && $active_before.length) {
						$active = $active_before;
					} else if (self.settings.mode === 'single' && self.items.length) {
						$active = self.getOption(self.items[0]);
					}
					if (!$active || !$active.length) {
						if ($create && !self.settings.addPrecedence) {
							$active = self.getAdjacentOption($create, 1);
						} else {
							$active = $dropdown_content.find('[data-selectable]:first');
						}
					}
				} else {
					$active = $create;
				}
				self.setActiveOption($active);
				if (triggerDropdown && !self.isOpen) {
					self.open();
				}
			} else {
				self.setActiveOption(null);
				if (triggerDropdown && self.isOpen) {
					self.close();
				}
			}
		},

		/**
   * Adds an available option. If it already exists,
   * nothing will happen. Note: this does not refresh
   * the options list dropdown (use `refreshOptions`
   * for that).
   *
   * Usage:
   *
   *   this.addOption(data)
   *
   * @param {object|array} data
   */
		addOption: function (data) {
			var i,
			    n,
			    value,
			    self = this;

			if ($.isArray(data)) {
				for (i = 0, n = data.length; i < n; i++) {
					self.addOption(data[i]);
				}
				return;
			}

			if (value = self.registerOption(data)) {
				self.userOptions[value] = true;
				self.lastQuery = null;
				self.trigger('option_add', value, data);
			}
		},

		/**
   * Registers an option to the pool of options.
   *
   * @param {object} data
   * @return {boolean|string}
   */
		registerOption: function (data) {
			var key = hash_key(data[this.settings.valueField]);
			if (typeof key === 'undefined' || key === null || this.options.hasOwnProperty(key)) return false;
			data.$order = data.$order || ++this.order;
			this.options[key] = data;
			return key;
		},

		/**
   * Registers an option group to the pool of option groups.
   *
   * @param {object} data
   * @return {boolean|string}
   */
		registerOptionGroup: function (data) {
			var key = hash_key(data[this.settings.optgroupValueField]);
			if (!key) return false;

			data.$order = data.$order || ++this.order;
			this.optgroups[key] = data;
			return key;
		},

		/**
   * Registers a new optgroup for options
   * to be bucketed into.
   *
   * @param {string} id
   * @param {object} data
   */
		addOptionGroup: function (id, data) {
			data[this.settings.optgroupValueField] = id;
			if (id = this.registerOptionGroup(data)) {
				this.trigger('optgroup_add', id, data);
			}
		},

		/**
   * Removes an existing option group.
   *
   * @param {string} id
   */
		removeOptionGroup: function (id) {
			if (this.optgroups.hasOwnProperty(id)) {
				delete this.optgroups[id];
				this.renderCache = {};
				this.trigger('optgroup_remove', id);
			}
		},

		/**
   * Clears all existing option groups.
   */
		clearOptionGroups: function () {
			this.optgroups = {};
			this.renderCache = {};
			this.trigger('optgroup_clear');
		},

		/**
   * Updates an option available for selection. If
   * it is visible in the selected items or options
   * dropdown, it will be re-rendered automatically.
   *
   * @param {string} value
   * @param {object} data
   */
		updateOption: function (value, data) {
			var self = this;
			var $item, $item_new;
			var value_new, index_item, cache_items, cache_options, order_old;

			value = hash_key(value);
			value_new = hash_key(data[self.settings.valueField]);

			// sanity checks
			if (value === null) return;
			if (!self.options.hasOwnProperty(value)) return;
			if (typeof value_new !== 'string') throw new Error('Value must be set in option data');

			order_old = self.options[value].$order;

			// update references
			if (value_new !== value) {
				delete self.options[value];
				index_item = self.items.indexOf(value);
				if (index_item !== -1) {
					self.items.splice(index_item, 1, value_new);
				}
			}
			data.$order = data.$order || order_old;
			self.options[value_new] = data;

			// invalidate render cache
			cache_items = self.renderCache['item'];
			cache_options = self.renderCache['option'];

			if (cache_items) {
				delete cache_items[value];
				delete cache_items[value_new];
			}
			if (cache_options) {
				delete cache_options[value];
				delete cache_options[value_new];
			}

			// update the item if it's selected
			if (self.items.indexOf(value_new) !== -1) {
				$item = self.getItem(value);
				$item_new = $(self.render('item', data));
				if ($item.hasClass('active')) $item_new.addClass('active');
				$item.replaceWith($item_new);
			}

			// invalidate last query because we might have updated the sortField
			self.lastQuery = null;

			// update dropdown contents
			if (self.isOpen) {
				self.refreshOptions(false);
			}
		},

		/**
   * Removes a single option.
   *
   * @param {string} value
   * @param {boolean} silent
   */
		removeOption: function (value, silent) {
			var self = this;
			value = hash_key(value);

			var cache_items = self.renderCache['item'];
			var cache_options = self.renderCache['option'];
			if (cache_items) delete cache_items[value];
			if (cache_options) delete cache_options[value];

			delete self.userOptions[value];
			delete self.options[value];
			self.lastQuery = null;
			self.trigger('option_remove', value);
			self.removeItem(value, silent);
		},

		/**
   * Clears all options.
   */
		clearOptions: function () {
			var self = this;

			self.loadedSearches = {};
			self.userOptions = {};
			self.renderCache = {};
			self.options = self.sifter.items = {};
			self.lastQuery = null;
			self.trigger('option_clear');
			self.clear();
		},

		/**
   * Returns the jQuery element of the option
   * matching the given value.
   *
   * @param {string} value
   * @returns {object}
   */
		getOption: function (value) {
			return this.getElementWithValue(value, this.$dropdown_content.find('[data-selectable]'));
		},

		/**
   * Returns the jQuery element of the next or
   * previous selectable option.
   *
   * @param {object} $option
   * @param {int} direction  can be 1 for next or -1 for previous
   * @return {object}
   */
		getAdjacentOption: function ($option, direction) {
			var $options = this.$dropdown.find('[data-selectable]');
			var index = $options.index($option) + direction;

			return index >= 0 && index < $options.length ? $options.eq(index) : $();
		},

		/**
   * Finds the first element with a "data-value" attribute
   * that matches the given value.
   *
   * @param {mixed} value
   * @param {object} $els
   * @return {object}
   */
		getElementWithValue: function (value, $els) {
			value = hash_key(value);

			if (typeof value !== 'undefined' && value !== null) {
				for (var i = 0, n = $els.length; i < n; i++) {
					if ($els[i].getAttribute('data-value') === value) {
						return $($els[i]);
					}
				}
			}

			return $();
		},

		/**
   * Returns the jQuery element of the item
   * matching the given value.
   *
   * @param {string} value
   * @returns {object}
   */
		getItem: function (value) {
			return this.getElementWithValue(value, this.$control.children());
		},

		/**
   * "Selects" multiple items at once. Adds them to the list
   * at the current caret position.
   *
   * @param {string} value
   * @param {boolean} silent
   */
		addItems: function (values, silent) {
			var items = $.isArray(values) ? values : [values];
			for (var i = 0, n = items.length; i < n; i++) {
				this.isPending = i < n - 1;
				this.addItem(items[i], silent);
			}
		},

		/**
   * "Selects" an item. Adds it to the list
   * at the current caret position.
   *
   * @param {string} value
   * @param {boolean} silent
   */
		addItem: function (value, silent) {
			var events = silent ? [] : ['change'];

			debounce_events(this, events, function () {
				var $item, $option, $options;
				var self = this;
				var inputMode = self.settings.mode;
				var i, active, value_next, wasFull;
				value = hash_key(value);

				if (self.items.indexOf(value) !== -1) {
					if (inputMode === 'single') self.close();
					return;
				}

				if (!self.options.hasOwnProperty(value)) return;
				if (inputMode === 'single') self.clear(silent);
				if (inputMode === 'multi' && self.isFull()) return;

				$item = $(self.render('item', self.options[value]));
				wasFull = self.isFull();
				self.items.splice(self.caretPos, 0, value);
				self.insertAtCaret($item);
				if (!self.isPending || !wasFull && self.isFull()) {
					self.refreshState();
				}

				if (self.isSetup) {
					$options = self.$dropdown_content.find('[data-selectable]');

					// update menu / remove the option (if this is not one item being added as part of series)
					if (!self.isPending) {
						$option = self.getOption(value);
						value_next = self.getAdjacentOption($option, 1).attr('data-value');
						self.refreshOptions(self.isFocused && inputMode !== 'single');
						if (value_next) {
							self.setActiveOption(self.getOption(value_next));
						}
					}

					// hide the menu if the maximum number of items have been selected or no options are left
					if (!$options.length || self.isFull()) {
						self.close();
					} else {
						self.positionDropdown();
					}

					self.updatePlaceholder();
					self.trigger('item_add', value, $item);
					self.updateOriginalInput({ silent: silent });
				}
			});
		},

		/**
   * Removes the selected item matching
   * the provided value.
   *
   * @param {string} value
   */
		removeItem: function (value, silent) {
			var self = this;
			var $item, i, idx;

			$item = value instanceof $ ? value : self.getItem(value);
			value = hash_key($item.attr('data-value'));
			i = self.items.indexOf(value);

			if (i !== -1) {
				$item.remove();
				if ($item.hasClass('active')) {
					idx = self.$activeItems.indexOf($item[0]);
					self.$activeItems.splice(idx, 1);
				}

				self.items.splice(i, 1);
				self.lastQuery = null;
				if (!self.settings.persist && self.userOptions.hasOwnProperty(value)) {
					self.removeOption(value, silent);
				}

				if (i < self.caretPos) {
					self.setCaret(self.caretPos - 1);
				}

				self.refreshState();
				self.updatePlaceholder();
				self.updateOriginalInput({ silent: silent });
				self.positionDropdown();
				self.trigger('item_remove', value, $item);
			}
		},

		/**
   * Invokes the `create` method provided in the
   * selectize options that should provide the data
   * for the new item, given the user input.
   *
   * Once this completes, it will be added
   * to the item list.
   *
   * @param {string} value
   * @param {boolean} [triggerDropdown]
   * @param {function} [callback]
   * @return {boolean}
   */
		createItem: function (input, triggerDropdown) {
			var self = this;
			var caret = self.caretPos;
			input = input || $.trim(self.$control_input.val() || '');

			var callback = arguments[arguments.length - 1];
			if (typeof callback !== 'function') callback = function () {};

			if (typeof triggerDropdown !== 'boolean') {
				triggerDropdown = true;
			}

			if (!self.canCreate(input)) {
				callback();
				return false;
			}

			self.lock();

			var setup = typeof self.settings.create === 'function' ? this.settings.create : function (input) {
				var data = {};
				data[self.settings.labelField] = input;
				data[self.settings.valueField] = input;
				return data;
			};

			var create = once(function (data) {
				self.unlock();

				if (!data || typeof data !== 'object') return callback();
				var value = hash_key(data[self.settings.valueField]);
				if (typeof value !== 'string') return callback();

				self.setTextboxValue('');
				self.addOption(data);
				self.setCaret(caret);
				self.addItem(value);
				self.refreshOptions(triggerDropdown && self.settings.mode !== 'single');
				callback(data);
			});

			var output = setup.apply(this, [input, create]);
			if (typeof output !== 'undefined') {
				create(output);
			}

			return true;
		},

		/**
   * Re-renders the selected item lists.
   */
		refreshItems: function () {
			this.lastQuery = null;

			if (this.isSetup) {
				this.addItem(this.items);
			}

			this.refreshState();
			this.updateOriginalInput();
		},

		/**
   * Updates all state-dependent attributes
   * and CSS classes.
   */
		refreshState: function () {
			this.refreshValidityState();
			this.refreshClasses();
		},

		/**
   * Update the `required` attribute of both input and control input.
   *
   * The `required` property needs to be activated on the control input
   * for the error to be displayed at the right place. `required` also
   * needs to be temporarily deactivated on the input since the input is
   * hidden and can't show errors.
   */
		refreshValidityState: function () {
			if (!this.isRequired) return false;

			var invalid = !this.items.length;

			this.isInvalid = invalid;
			this.$control_input.prop('required', invalid);
			this.$input.prop('required', !invalid);
		},

		/**
   * Updates all state-dependent CSS classes.
   */
		refreshClasses: function () {
			var self = this;
			var isFull = self.isFull();
			var isLocked = self.isLocked;

			self.$wrapper.toggleClass('rtl', self.rtl);

			self.$control.toggleClass('focus', self.isFocused).toggleClass('disabled', self.isDisabled).toggleClass('required', self.isRequired).toggleClass('invalid', self.isInvalid).toggleClass('locked', isLocked).toggleClass('full', isFull).toggleClass('not-full', !isFull).toggleClass('input-active', self.isFocused && !self.isInputHidden).toggleClass('dropdown-active', self.isOpen).toggleClass('has-options', !$.isEmptyObject(self.options)).toggleClass('has-items', self.items.length > 0);

			self.$control_input.data('grow', !isFull && !isLocked);
		},

		/**
   * Determines whether or not more items can be added
   * to the control without exceeding the user-defined maximum.
   *
   * @returns {boolean}
   */
		isFull: function () {
			return this.settings.maxItems !== null && this.items.length >= this.settings.maxItems;
		},

		/**
   * Refreshes the original <select> or <input>
   * element to reflect the current state.
   */
		updateOriginalInput: function (opts) {
			var i,
			    n,
			    options,
			    label,
			    self = this;
			opts = opts || {};

			if (self.tagType === TAG_SELECT) {
				options = [];
				for (i = 0, n = self.items.length; i < n; i++) {
					label = self.options[self.items[i]][self.settings.labelField] || '';
					options.push('<option value="' + escape_html(self.items[i]) + '" selected="selected">' + escape_html(label) + '</option>');
				}
				if (!options.length && !this.$input.attr('multiple')) {
					options.push('<option value="" selected="selected"></option>');
				}
				self.$input.html(options.join(''));
			} else {
				self.$input.val(self.getValue());
				self.$input.attr('value', self.$input.val());
			}

			if (self.isSetup) {
				if (!opts.silent) {
					self.trigger('change', self.$input.val());
				}
			}
		},

		/**
   * Shows/hide the input placeholder depending
   * on if there items in the list already.
   */
		updatePlaceholder: function () {
			if (!this.settings.placeholder) return;
			var $input = this.$control_input;

			if (this.items.length) {
				$input.removeAttr('placeholder');
			} else {
				$input.attr('placeholder', this.settings.placeholder);
			}
			$input.triggerHandler('update', { force: true });
		},

		/**
   * Shows the autocomplete dropdown containing
   * the available options.
   */
		open: function () {
			var self = this;

			if (self.isLocked || self.isOpen || self.settings.mode === 'multi' && self.isFull()) return;
			self.focus();
			self.isOpen = true;
			self.refreshState();
			self.$dropdown.css({ visibility: 'hidden', display: 'block' });
			self.positionDropdown();
			self.$dropdown.css({ visibility: 'visible' });
			self.trigger('dropdown_open', self.$dropdown);
		},

		/**
   * Closes the autocomplete dropdown menu.
   */
		close: function () {
			var self = this;
			var trigger = self.isOpen;

			if (self.settings.mode === 'single' && self.items.length) {
				self.hideInput();
				self.$control_input.blur(); // close keyboard on iOS
			}

			self.isOpen = false;
			self.$dropdown.hide();
			self.setActiveOption(null);
			self.refreshState();

			if (trigger) self.trigger('dropdown_close', self.$dropdown);
		},

		/**
   * Calculates and applies the appropriate
   * position of the dropdown.
   */
		positionDropdown: function () {
			var $control = this.$control;
			var offset = this.settings.dropdownParent === 'body' ? $control.offset() : $control.position();
			offset.top += $control.outerHeight(true);

			this.$dropdown.css({
				width: $control.outerWidth(),
				top: offset.top,
				left: offset.left
			});
		},

		/**
   * Resets / clears all selected items
   * from the control.
   *
   * @param {boolean} silent
   */
		clear: function (silent) {
			var self = this;

			if (!self.items.length) return;
			self.$control.children(':not(input)').remove();
			self.items = [];
			self.lastQuery = null;
			self.setCaret(0);
			self.setActiveItem(null);
			self.updatePlaceholder();
			self.updateOriginalInput({ silent: silent });
			self.refreshState();
			self.showInput();
			self.trigger('clear');
		},

		/**
   * A helper method for inserting an element
   * at the current caret position.
   *
   * @param {object} $el
   */
		insertAtCaret: function ($el) {
			var caret = Math.min(this.caretPos, this.items.length);
			if (caret === 0) {
				this.$control.prepend($el);
			} else {
				$(this.$control[0].childNodes[caret]).before($el);
			}
			this.setCaret(caret + 1);
		},

		/**
   * Removes the current selected item(s).
   *
   * @param {object} e (optional)
   * @returns {boolean}
   */
		deleteSelection: function (e) {
			var i, n, direction, selection, values, caret, option_select, $option_select, $tail;
			var self = this;

			direction = e && e.keyCode === KEY_BACKSPACE ? -1 : 1;
			selection = getSelection(self.$control_input[0]);

			if (self.$activeOption && !self.settings.hideSelected) {
				option_select = self.getAdjacentOption(self.$activeOption, -1).attr('data-value');
			}

			// determine items that will be removed
			values = [];

			if (self.$activeItems.length) {
				$tail = self.$control.children('.active:' + (direction > 0 ? 'last' : 'first'));
				caret = self.$control.children(':not(input)').index($tail);
				if (direction > 0) {
					caret++;
				}

				for (i = 0, n = self.$activeItems.length; i < n; i++) {
					values.push($(self.$activeItems[i]).attr('data-value'));
				}
				if (e) {
					e.preventDefault();
					e.stopPropagation();
				}
			} else if ((self.isFocused || self.settings.mode === 'single') && self.items.length) {
				if (direction < 0 && selection.start === 0 && selection.length === 0) {
					values.push(self.items[self.caretPos - 1]);
				} else if (direction > 0 && selection.start === self.$control_input.val().length) {
					values.push(self.items[self.caretPos]);
				}
			}

			// allow the callback to abort
			if (!values.length || typeof self.settings.onDelete === 'function' && self.settings.onDelete.apply(self, [values]) === false) {
				return false;
			}

			// perform removal
			if (typeof caret !== 'undefined') {
				self.setCaret(caret);
			}
			while (values.length) {
				self.removeItem(values.pop());
			}

			self.showInput();
			self.positionDropdown();
			self.refreshOptions(true);

			// select previous option
			if (option_select) {
				$option_select = self.getOption(option_select);
				if ($option_select.length) {
					self.setActiveOption($option_select);
				}
			}

			return true;
		},

		/**
   * Selects the previous / next item (depending
   * on the `direction` argument).
   *
   * > 0 - right
   * < 0 - left
   *
   * @param {int} direction
   * @param {object} e (optional)
   */
		advanceSelection: function (direction, e) {
			var tail, selection, idx, valueLength, cursorAtEdge, $tail;
			var self = this;

			if (direction === 0) return;
			if (self.rtl) direction *= -1;

			tail = direction > 0 ? 'last' : 'first';
			selection = getSelection(self.$control_input[0]);

			if (self.isFocused && !self.isInputHidden) {
				valueLength = self.$control_input.val().length;
				cursorAtEdge = direction < 0 ? selection.start === 0 && selection.length === 0 : selection.start === valueLength;

				if (cursorAtEdge && !valueLength) {
					self.advanceCaret(direction, e);
				}
			} else {
				$tail = self.$control.children('.active:' + tail);
				if ($tail.length) {
					idx = self.$control.children(':not(input)').index($tail);
					self.setActiveItem(null);
					self.setCaret(direction > 0 ? idx + 1 : idx);
				}
			}
		},

		/**
   * Moves the caret left / right.
   *
   * @param {int} direction
   * @param {object} e (optional)
   */
		advanceCaret: function (direction, e) {
			var self = this,
			    fn,
			    $adj;

			if (direction === 0) return;

			fn = direction > 0 ? 'next' : 'prev';
			if (self.isShiftDown) {
				$adj = self.$control_input[fn]();
				if ($adj.length) {
					self.hideInput();
					self.setActiveItem($adj);
					e && e.preventDefault();
				}
			} else {
				self.setCaret(self.caretPos + direction);
			}
		},

		/**
   * Moves the caret to the specified index.
   *
   * @param {int} i
   */
		setCaret: function (i) {
			var self = this;

			if (self.settings.mode === 'single') {
				i = self.items.length;
			} else {
				i = Math.max(0, Math.min(self.items.length, i));
			}

			if (!self.isPending) {
				// the input must be moved by leaving it in place and moving the
				// siblings, due to the fact that focus cannot be restored once lost
				// on mobile webkit devices
				var j, n, fn, $children, $child;
				$children = self.$control.children(':not(input)');
				for (j = 0, n = $children.length; j < n; j++) {
					$child = $($children[j]).detach();
					if (j < i) {
						self.$control_input.before($child);
					} else {
						self.$control.append($child);
					}
				}
			}

			self.caretPos = i;
		},

		/**
   * Disables user input on the control. Used while
   * items are being asynchronously created.
   */
		lock: function () {
			this.close();
			this.isLocked = true;
			this.refreshState();
		},

		/**
   * Re-enables user input on the control.
   */
		unlock: function () {
			this.isLocked = false;
			this.refreshState();
		},

		/**
   * Disables user input on the control completely.
   * While disabled, it cannot receive focus.
   */
		disable: function () {
			var self = this;
			self.$input.prop('disabled', true);
			self.$control_input.prop('disabled', true).prop('tabindex', -1);
			self.isDisabled = true;
			self.lock();
		},

		/**
   * Enables the control so that it can respond
   * to focus and user input.
   */
		enable: function () {
			var self = this;
			self.$input.prop('disabled', false);
			self.$control_input.prop('disabled', false).prop('tabindex', self.tabIndex);
			self.isDisabled = false;
			self.unlock();
		},

		/**
   * Completely destroys the control and
   * unbinds all event listeners so that it can
   * be garbage collected.
   */
		destroy: function () {
			var self = this;
			var eventNS = self.eventNS;
			var revertSettings = self.revertSettings;

			self.trigger('destroy');
			self.off();
			self.$wrapper.remove();
			self.$dropdown.remove();

			self.$input.html('').append(revertSettings.$children).removeAttr('tabindex').removeClass('selectized').attr({ tabindex: revertSettings.tabindex }).show();

			self.$control_input.removeData('grow');
			self.$input.removeData('selectize');

			$(window).off(eventNS);
			$(document).off(eventNS);
			$(document.body).off(eventNS);

			delete self.$input[0].selectize;
		},

		/**
   * A helper method for rendering "item" and
   * "option" templates, given the data.
   *
   * @param {string} templateName
   * @param {object} data
   * @returns {string}
   */
		render: function (templateName, data) {
			var value, id, label;
			var html = '';
			var cache = false;
			var self = this;
			var regex_tag = /^[\t \r\n]*<([a-z][a-z0-9\-_]*(?:\:[a-z][a-z0-9\-_]*)?)/i;

			if (templateName === 'option' || templateName === 'item') {
				value = hash_key(data[self.settings.valueField]);
				cache = !!value;
			}

			// pull markup from cache if it exists
			if (cache) {
				if (!isset(self.renderCache[templateName])) {
					self.renderCache[templateName] = {};
				}
				if (self.renderCache[templateName].hasOwnProperty(value)) {
					return self.renderCache[templateName][value];
				}
			}

			// render markup
			html = $(self.settings.render[templateName].apply(this, [data, escape_html]));

			// add mandatory attributes
			if (templateName === 'option' || templateName === 'option_create') {
				html.attr('data-selectable', '');
			} else if (templateName === 'optgroup') {
				id = data[self.settings.optgroupValueField] || '';
				html.attr('data-group', id);
			}
			if (templateName === 'option' || templateName === 'item') {
				html.attr('data-value', value || '');
			}

			// update cache
			if (cache) {
				self.renderCache[templateName][value] = html[0];
			}

			return html[0];
		},

		/**
   * Clears the render cache for a template. If
   * no template is given, clears all render
   * caches.
   *
   * @param {string} templateName
   */
		clearCache: function (templateName) {
			var self = this;
			if (typeof templateName === 'undefined') {
				self.renderCache = {};
			} else {
				delete self.renderCache[templateName];
			}
		},

		/**
   * Determines whether or not to display the
   * create item prompt, given a user input.
   *
   * @param {string} input
   * @return {boolean}
   */
		canCreate: function (input) {
			var self = this;
			if (!self.settings.create) return false;
			var filter = self.settings.createFilter;
			return input.length && (typeof filter !== 'function' || filter.apply(self, [input])) && (typeof filter !== 'string' || new RegExp(filter).test(input)) && (!(filter instanceof RegExp) || filter.test(input));
		}

	});

	Selectize.count = 0;
	Selectize.defaults = {
		options: [],
		optgroups: [],

		plugins: [],
		delimiter: ',',
		splitOn: null, // regexp or string for splitting up values from a paste command
		persist: true,
		diacritics: true,
		create: false,
		createOnBlur: false,
		createFilter: null,
		highlight: true,
		openOnFocus: true,
		maxOptions: 1000,
		maxItems: null,
		hideSelected: null,
		addPrecedence: false,
		selectOnTab: false,
		preload: false,
		allowEmptyOption: false,
		closeAfterSelect: false,

		scrollDuration: 60,
		loadThrottle: 300,
		loadingClass: 'loading',

		dataAttr: 'data-data',
		optgroupField: 'optgroup',
		valueField: 'value',
		labelField: 'text',
		optgroupLabelField: 'label',
		optgroupValueField: 'value',
		lockOptgroupOrder: false,

		sortField: '$order',
		searchField: ['text'],
		searchConjunction: 'and',

		mode: null,
		wrapperClass: 'selectize-control',
		inputClass: 'selectize-input',
		dropdownClass: 'selectize-dropdown',
		dropdownContentClass: 'selectize-dropdown-content',

		dropdownParent: null,

		copyClassesToDropdown: true,

		/*
  load                 : null, // function(query, callback) { ... }
  score                : null, // function(search) { ... }
  onInitialize         : null, // function() { ... }
  onChange             : null, // function(value) { ... }
  onItemAdd            : null, // function(value, $item) { ... }
  onItemRemove         : null, // function(value) { ... }
  onClear              : null, // function() { ... }
  onOptionAdd          : null, // function(value, data) { ... }
  onOptionRemove       : null, // function(value) { ... }
  onOptionClear        : null, // function() { ... }
  onOptionGroupAdd     : null, // function(id, data) { ... }
  onOptionGroupRemove  : null, // function(id) { ... }
  onOptionGroupClear   : null, // function() { ... }
  onDropdownOpen       : null, // function($dropdown) { ... }
  onDropdownClose      : null, // function($dropdown) { ... }
  onType               : null, // function(str) { ... }
  onDelete             : null, // function(values) { ... }
  */

		render: {
			/*
   item: null,
   optgroup: null,
   optgroup_header: null,
   option: null,
   option_create: null
   */
		}
	};

	$.fn.selectize = function (settings_user) {
		var defaults = $.fn.selectize.defaults;
		var settings = $.extend({}, defaults, settings_user);
		var attr_data = settings.dataAttr;
		var field_label = settings.labelField;
		var field_value = settings.valueField;
		var field_optgroup = settings.optgroupField;
		var field_optgroup_label = settings.optgroupLabelField;
		var field_optgroup_value = settings.optgroupValueField;

		/**
   * Initializes selectize from a <input type="text"> element.
   *
   * @param {object} $input
   * @param {object} settings_element
   */
		var init_textbox = function ($input, settings_element) {
			var i, n, values, option;

			var data_raw = $input.attr(attr_data);

			if (!data_raw) {
				var value = $.trim($input.val() || '');
				if (!settings.allowEmptyOption && !value.length) return;
				values = value.split(settings.delimiter);
				for (i = 0, n = values.length; i < n; i++) {
					option = {};
					option[field_label] = values[i];
					option[field_value] = values[i];
					settings_element.options.push(option);
				}
				settings_element.items = values;
			} else {
				settings_element.options = JSON.parse(data_raw);
				for (i = 0, n = settings_element.options.length; i < n; i++) {
					settings_element.items.push(settings_element.options[i][field_value]);
				}
			}
		};

		/**
   * Initializes selectize from a <select> element.
   *
   * @param {object} $input
   * @param {object} settings_element
   */
		var init_select = function ($input, settings_element) {
			var i,
			    n,
			    tagName,
			    $children,
			    order = 0;
			var options = settings_element.options;
			var optionsMap = {};

			var readData = function ($el) {
				var data = attr_data && $el.attr(attr_data);
				if (typeof data === 'string' && data.length) {
					return JSON.parse(data);
				}
				return null;
			};

			var addOption = function ($option, group) {
				$option = $($option);

				var value = hash_key($option.val());
				if (!value && !settings.allowEmptyOption) return;

				// if the option already exists, it's probably been
				// duplicated in another optgroup. in this case, push
				// the current group to the "optgroup" property on the
				// existing option so that it's rendered in both places.
				if (optionsMap.hasOwnProperty(value)) {
					if (group) {
						var arr = optionsMap[value][field_optgroup];
						if (!arr) {
							optionsMap[value][field_optgroup] = group;
						} else if (!$.isArray(arr)) {
							optionsMap[value][field_optgroup] = [arr, group];
						} else {
							arr.push(group);
						}
					}
					return;
				}

				var option = readData($option) || {};
				option[field_label] = option[field_label] || $option.text();
				option[field_value] = option[field_value] || value;
				option[field_optgroup] = option[field_optgroup] || group;

				optionsMap[value] = option;
				options.push(option);

				if ($option.is(':selected')) {
					settings_element.items.push(value);
				}
			};

			var addGroup = function ($optgroup) {
				var i, n, id, optgroup, $options;

				$optgroup = $($optgroup);
				id = $optgroup.attr('label');

				if (id) {
					optgroup = readData($optgroup) || {};
					optgroup[field_optgroup_label] = id;
					optgroup[field_optgroup_value] = id;
					settings_element.optgroups.push(optgroup);
				}

				$options = $('option', $optgroup);
				for (i = 0, n = $options.length; i < n; i++) {
					addOption($options[i], id);
				}
			};

			settings_element.maxItems = $input.attr('multiple') ? null : 1;

			$children = $input.children();
			for (i = 0, n = $children.length; i < n; i++) {
				tagName = $children[i].tagName.toLowerCase();
				if (tagName === 'optgroup') {
					addGroup($children[i]);
				} else if (tagName === 'option') {
					addOption($children[i]);
				}
			}
		};

		return this.each(function () {
			if (this.selectize) return;

			var instance;
			var $input = $(this);
			var tag_name = this.tagName.toLowerCase();
			var placeholder = $input.attr('placeholder') || $input.attr('data-placeholder');
			if (!placeholder && !settings.allowEmptyOption) {
				placeholder = $input.children('option[value=""]').text();
			}

			var settings_element = {
				'placeholder': placeholder,
				'options': [],
				'optgroups': [],
				'items': []
			};

			if (tag_name === 'select') {
				init_select($input, settings_element);
			} else {
				init_textbox($input, settings_element);
			}

			instance = new Selectize($input, $.extend(true, {}, defaults, settings_element, settings_user));
		});
	};

	$.fn.selectize.defaults = Selectize.defaults;
	$.fn.selectize.support = {
		validity: SUPPORTS_VALIDITY_API
	};

	Selectize.define('drag_drop', function (options) {
		if (!$.fn.sortable) throw new Error('The "drag_drop" plugin requires jQuery UI "sortable".');
		if (this.settings.mode !== 'multi') return;
		var self = this;

		self.lock = function () {
			var original = self.lock;
			return function () {
				var sortable = self.$control.data('sortable');
				if (sortable) sortable.disable();
				return original.apply(self, arguments);
			};
		}();

		self.unlock = function () {
			var original = self.unlock;
			return function () {
				var sortable = self.$control.data('sortable');
				if (sortable) sortable.enable();
				return original.apply(self, arguments);
			};
		}();

		self.setup = function () {
			var original = self.setup;
			return function () {
				original.apply(this, arguments);

				var $control = self.$control.sortable({
					items: '[data-value]',
					forcePlaceholderSize: true,
					disabled: self.isLocked,
					start: function (e, ui) {
						ui.placeholder.css('width', ui.helper.css('width'));
						$control.css({ overflow: 'visible' });
					},
					stop: function () {
						$control.css({ overflow: 'hidden' });
						var active = self.$activeItems ? self.$activeItems.slice() : null;
						var values = [];
						$control.children('[data-value]').each(function () {
							values.push($(this).attr('data-value'));
						});
						self.setValue(values);
						self.setActiveItem(active);
					}
				});
			};
		}();
	});

	Selectize.define('dropdown_header', function (options) {
		var self = this;

		options = $.extend({
			title: 'Untitled',
			headerClass: 'selectize-dropdown-header',
			titleRowClass: 'selectize-dropdown-header-title',
			labelClass: 'selectize-dropdown-header-label',
			closeClass: 'selectize-dropdown-header-close',

			html: function (data) {
				return '<div class="' + data.headerClass + '">' + '<div class="' + data.titleRowClass + '">' + '<span class="' + data.labelClass + '">' + data.title + '</span>' + '<a href="javascript:void(0)" class="' + data.closeClass + '">&times;</a>' + '</div>' + '</div>';
			}
		}, options);

		self.setup = function () {
			var original = self.setup;
			return function () {
				original.apply(self, arguments);
				self.$dropdown_header = $(options.html(options));
				self.$dropdown.prepend(self.$dropdown_header);
			};
		}();
	});

	Selectize.define('optgroup_columns', function (options) {
		var self = this;

		options = $.extend({
			equalizeWidth: true,
			equalizeHeight: true
		}, options);

		this.getAdjacentOption = function ($option, direction) {
			var $options = $option.closest('[data-group]').find('[data-selectable]');
			var index = $options.index($option) + direction;

			return index >= 0 && index < $options.length ? $options.eq(index) : $();
		};

		this.onKeyDown = function () {
			var original = self.onKeyDown;
			return function (e) {
				var index, $option, $options, $optgroup;

				if (this.isOpen && (e.keyCode === KEY_LEFT || e.keyCode === KEY_RIGHT)) {
					self.ignoreHover = true;
					$optgroup = this.$activeOption.closest('[data-group]');
					index = $optgroup.find('[data-selectable]').index(this.$activeOption);

					if (e.keyCode === KEY_LEFT) {
						$optgroup = $optgroup.prev('[data-group]');
					} else {
						$optgroup = $optgroup.next('[data-group]');
					}

					$options = $optgroup.find('[data-selectable]');
					$option = $options.eq(Math.min($options.length - 1, index));
					if ($option.length) {
						this.setActiveOption($option);
					}
					return;
				}

				return original.apply(this, arguments);
			};
		}();

		var getScrollbarWidth = function () {
			var div;
			var width = getScrollbarWidth.width;
			var doc = document;

			if (typeof width === 'undefined') {
				div = doc.createElement('div');
				div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
				div = div.firstChild;
				doc.body.appendChild(div);
				width = getScrollbarWidth.width = div.offsetWidth - div.clientWidth;
				doc.body.removeChild(div);
			}
			return width;
		};

		var equalizeSizes = function () {
			var i, n, height_max, width, width_last, width_parent, $optgroups;

			$optgroups = $('[data-group]', self.$dropdown_content);
			n = $optgroups.length;
			if (!n || !self.$dropdown_content.width()) return;

			if (options.equalizeHeight) {
				height_max = 0;
				for (i = 0; i < n; i++) {
					height_max = Math.max(height_max, $optgroups.eq(i).height());
				}
				$optgroups.css({ height: height_max });
			}

			if (options.equalizeWidth) {
				width_parent = self.$dropdown_content.innerWidth() - getScrollbarWidth();
				width = Math.round(width_parent / n);
				$optgroups.css({ width: width });
				if (n > 1) {
					width_last = width_parent - width * (n - 1);
					$optgroups.eq(n - 1).css({ width: width_last });
				}
			}
		};

		if (options.equalizeHeight || options.equalizeWidth) {
			hook.after(this, 'positionDropdown', equalizeSizes);
			hook.after(this, 'refreshOptions', equalizeSizes);
		}
	});

	Selectize.define('remove_button', function (options) {
		options = $.extend({
			label: '&times;',
			title: 'Remove',
			className: 'remove',
			append: true
		}, options);

		var singleClose = function (thisRef, options) {

			options.className = 'remove-single';

			var self = thisRef;
			var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';

			/**
    * Appends an element as a child (with raw HTML).
    *
    * @param {string} html_container
    * @param {string} html_element
    * @return {string}
    */
			var append = function (html_container, html_element) {
				return html_container + html_element;
			};

			thisRef.setup = function () {
				var original = self.setup;
				return function () {
					// override the item rendering method to add the button to each
					if (options.append) {
						var id = $(self.$input.context).attr('id');
						var selectizer = $('#' + id);

						var render_item = self.settings.render.item;
						self.settings.render.item = function (data) {
							return append(render_item.apply(thisRef, arguments), html);
						};
					}

					original.apply(thisRef, arguments);

					// add event listener
					thisRef.$control.on('click', '.' + options.className, function (e) {
						e.preventDefault();
						if (self.isLocked) return;

						self.clear();
					});
				};
			}();
		};

		var multiClose = function (thisRef, options) {

			var self = thisRef;
			var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';

			/**
    * Appends an element as a child (with raw HTML).
    *
    * @param {string} html_container
    * @param {string} html_element
    * @return {string}
    */
			var append = function (html_container, html_element) {
				var pos = html_container.search(/(<\/[^>]+>\s*)$/);
				return html_container.substring(0, pos) + html_element + html_container.substring(pos);
			};

			thisRef.setup = function () {
				var original = self.setup;
				return function () {
					// override the item rendering method to add the button to each
					if (options.append) {
						var render_item = self.settings.render.item;
						self.settings.render.item = function (data) {
							return append(render_item.apply(thisRef, arguments), html);
						};
					}

					original.apply(thisRef, arguments);

					// add event listener
					thisRef.$control.on('click', '.' + options.className, function (e) {
						e.preventDefault();
						if (self.isLocked) return;

						var $item = $(e.currentTarget).parent();
						self.setActiveItem($item);
						if (self.deleteSelection()) {
							self.setCaret(self.items.length);
						}
					});
				};
			}();
		};

		if (this.settings.mode === 'single') {
			singleClose(this, options);
			return;
		} else {
			multiClose(this, options);
		}
	});

	Selectize.define('restore_on_backspace', function (options) {
		var self = this;

		options.text = options.text || function (option) {
			return option[this.settings.labelField];
		};

		this.onKeyDown = function () {
			var original = self.onKeyDown;
			return function (e) {
				var index, option;
				if (e.keyCode === KEY_BACKSPACE && this.$control_input.val() === '' && !this.$activeItems.length) {
					index = this.caretPos - 1;
					if (index >= 0 && index < this.items.length) {
						option = this.options[this.items[index]];
						if (this.deleteSelection(e)) {
							this.setTextboxValue(options.text.apply(this, [option]));
							this.refreshOptions(true);
						}
						e.preventDefault();
						return;
					}
				}
				return original.apply(this, arguments);
			};
		}();
	});

	return Selectize;
});
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
/*!
* Parsley.js
* Version 2.8.0 - built Wed, Sep 13th 2017, 11:04 pm
* http://parsleyjs.org
* Guillaume Potier - <guillaume@wisembly.com>
* Marc-Andre Lafortune - <petroselinum@marc-andre.ca>
* MIT Licensed
*/
function _toConsumableArray(e) {
   if (Array.isArray(e)) {
      for (var t = 0, i = Array(e.length); t < e.length; t++) i[t] = e[t];return i;
   }return Array.from(e);
}var _slice = Array.prototype.slice,
    _slicedToArray = function () {
   function e(e, t) {
      var i = [],
          n = !0,
          r = !1,
          s = void 0;try {
         for (var a, o = e[Symbol.iterator](); !(n = (a = o.next()).done) && (i.push(a.value), !t || i.length !== t); n = !0);
      } catch (l) {
         r = !0, s = l;
      } finally {
         try {
            !n && o["return"] && o["return"]();
         } finally {
            if (r) throw s;
         }
      }return i;
   }return function (t, i) {
      if (Array.isArray(t)) return t;if (Symbol.iterator in Object(t)) return e(t, i);throw new TypeError("Invalid attempt to destructure non-iterable instance");
   };
}(),
    _extends = Object.assign || function (e) {
   for (var t = 1; t < arguments.length; t++) {
      var i = arguments[t];for (var n in i) Object.prototype.hasOwnProperty.call(i, n) && (e[n] = i[n]);
   }return e;
};!function (e, t) {
   "object" == typeof exports && "undefined" != typeof module ? module.exports = t(require("jquery")) : "function" == typeof define && define.amd ? define(["jquery"], t) : e.parsley = t(e.jQuery);
}(this, function (e) {
   "use strict";
   function t(e, t) {
      return e.parsleyAdaptedCallback || (e.parsleyAdaptedCallback = function () {
         var i = Array.prototype.slice.call(arguments, 0);i.unshift(this), e.apply(t || M, i);
      }), e.parsleyAdaptedCallback;
   }function i(e) {
      return 0 === e.lastIndexOf(D, 0) ? e.substr(D.length) : e;
   } /**
     * inputevent - Alleviate browser bugs for input events
     * https://github.com/marcandre/inputevent
     * @version v0.0.3 - (built Thu, Apr 14th 2016, 5:58 pm)
     * @author Marc-Andre Lafortune <github@marc-andre.ca>
     * @license MIT
     */
   function n() {
      var t = this,
          i = window || global;_extends(this, { isNativeEvent: function (e) {
            return e.originalEvent && e.originalEvent.isTrusted !== !1;
         }, fakeInputEvent: function (i) {
            t.isNativeEvent(i) && e(i.target).trigger("input");
         }, misbehaves: function (i) {
            t.isNativeEvent(i) && (t.behavesOk(i), e(document).on("change.inputevent", i.data.selector, t.fakeInputEvent), t.fakeInputEvent(i));
         }, behavesOk: function (i) {
            t.isNativeEvent(i) && e(document).off("input.inputevent", i.data.selector, t.behavesOk).off("change.inputevent", i.data.selector, t.misbehaves);
         }, install: function () {
            if (!i.inputEventPatched) {
               i.inputEventPatched = "0.0.3";for (var n = ["select", 'input[type="checkbox"]', 'input[type="radio"]', 'input[type="file"]'], r = 0; r < n.length; r++) {
                  var s = n[r];e(document).on("input.inputevent", s, { selector: s }, t.behavesOk).on("change.inputevent", s, { selector: s }, t.misbehaves);
               }
            }
         }, uninstall: function () {
            delete i.inputEventPatched, e(document).off(".inputevent");
         } });
   }var r = 1,
       s = {},
       a = { attr: function (e, t, i) {
         var n,
             r,
             s,
             a = new RegExp("^" + t, "i");if ("undefined" == typeof i) i = {};else for (n in i) i.hasOwnProperty(n) && delete i[n];if (!e) return i;for (s = e.attributes, n = s.length; n--;) r = s[n], r && r.specified && a.test(r.name) && (i[this.camelize(r.name.slice(t.length))] = this.deserializeValue(r.value));return i;
      }, checkAttr: function (e, t, i) {
         return e.hasAttribute(t + i);
      }, setAttr: function (e, t, i, n) {
         e.setAttribute(this.dasherize(t + i), String(n));
      }, getType: function (e) {
         return e.getAttribute("type") || "text";
      }, generateID: function () {
         return "" + r++;
      }, deserializeValue: function (e) {
         var t;try {
            return e ? "true" == e || "false" != e && ("null" == e ? null : isNaN(t = Number(e)) ? /^[\[\{]/.test(e) ? JSON.parse(e) : e : t) : e;
         } catch (i) {
            return e;
         }
      }, camelize: function (e) {
         return e.replace(/-+(.)?/g, function (e, t) {
            return t ? t.toUpperCase() : "";
         });
      }, dasherize: function (e) {
         return e.replace(/::/g, "/").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/_/g, "-").toLowerCase();
      }, warn: function () {
         var e;window.console && "function" == typeof window.console.warn && (e = window.console).warn.apply(e, arguments);
      }, warnOnce: function (e) {
         s[e] || (s[e] = !0, this.warn.apply(this, arguments));
      }, _resetWarnings: function () {
         s = {};
      }, trimString: function (e) {
         return e.replace(/^\s+|\s+$/g, "");
      }, parse: { date: function S(e) {
            var t = e.match(/^(\d{4,})-(\d\d)-(\d\d)$/);if (!t) return null;var i = t.map(function (e) {
               return parseInt(e, 10);
            }),
                n = _slicedToArray(i, 4),
                r = (n[0], n[1]),
                s = n[2],
                a = n[3],
                S = new Date(r, s - 1, a);return S.getFullYear() !== r || S.getMonth() + 1 !== s || S.getDate() !== a ? null : S;
         }, string: function (e) {
            return e;
         }, integer: function (e) {
            return isNaN(e) ? null : parseInt(e, 10);
         }, number: function (e) {
            if (isNaN(e)) throw null;return parseFloat(e);
         }, "boolean": function (e) {
            return !/^\s*false\s*$/i.test(e);
         }, object: function (e) {
            return a.deserializeValue(e);
         }, regexp: function (e) {
            var t = "";return (/^\/.*\/(?:[gimy]*)$/.test(e) ? (t = e.replace(/.*\/([gimy]*)$/, "$1"), e = e.replace(new RegExp("^/(.*?)/" + t + "$"), "$1")) : e = "^" + e + "$", new RegExp(e, t)
            );
         } }, parseRequirement: function (e, t) {
         var i = this.parse[e || "string"];if (!i) throw 'Unknown requirement specification: "' + e + '"';var n = i(t);if (null === n) throw "Requirement is not a " + e + ': "' + t + '"';return n;
      }, namespaceEvents: function (t, i) {
         return t = this.trimString(t || "").split(/\s+/), t[0] ? e.map(t, function (e) {
            return e + "." + i;
         }).join(" ") : "";
      }, difference: function (t, i) {
         var n = [];return e.each(t, function (e, t) {
            i.indexOf(t) == -1 && n.push(t);
         }), n;
      }, all: function (t) {
         return e.when.apply(e, _toConsumableArray(t).concat([42, 42]));
      }, objectCreate: Object.create || function () {
         var e = function () {};return function (t) {
            if (arguments.length > 1) throw Error("Second argument not supported");if ("object" != typeof t) throw TypeError("Argument must be an object");e.prototype = t;var i = new e();return e.prototype = null, i;
         };
      }(), _SubmitSelector: 'input[type="submit"], button:submit' },
       o = { namespace: "data-parsley-", inputs: "input, textarea, select", excluded: "input[type=button], input[type=submit], input[type=reset], input[type=hidden]", priorityEnabled: !0, multiple: null, group: null, uiEnabled: !0, validationThreshold: 3, focus: "first", trigger: !1, triggerAfterFailure: "input", errorClass: "parsley-error", successClass: "parsley-success", classHandler: function (e) {}, errorsContainer: function (e) {}, errorsWrapper: '<ul class="parsley-errors-list"></ul>', errorTemplate: "<li></li>" },
       l = function () {
      this.__id__ = a.generateID();
   };l.prototype = { asyncSupport: !0, _pipeAccordingToValidationResult: function () {
         var t = this,
             i = function () {
            var i = e.Deferred();return !0 !== t.validationResult && i.reject(), i.resolve().promise();
         };return [i, i];
      }, actualizeOptions: function () {
         return a.attr(this.element, this.options.namespace, this.domOptions), this.parent && this.parent.actualizeOptions && this.parent.actualizeOptions(), this;
      }, _resetOptions: function (e) {
         this.domOptions = a.objectCreate(this.parent.options), this.options = a.objectCreate(this.domOptions);for (var t in e) e.hasOwnProperty(t) && (this.options[t] = e[t]);this.actualizeOptions();
      }, _listeners: null, on: function (e, t) {
         this._listeners = this._listeners || {};var i = this._listeners[e] = this._listeners[e] || [];return i.push(t), this;
      }, subscribe: function (t, i) {
         e.listenTo(this, t.toLowerCase(), i);
      }, off: function (e, t) {
         var i = this._listeners && this._listeners[e];if (i) if (t) for (var n = i.length; n--;) i[n] === t && i.splice(n, 1);else delete this._listeners[e];return this;
      }, unsubscribe: function (t, i) {
         e.unsubscribeTo(this, t.toLowerCase());
      }, trigger: function (e, t, i) {
         t = t || this;var n,
             r = this._listeners && this._listeners[e];if (r) for (var s = r.length; s--;) if (n = r[s].call(t, t, i), n === !1) return n;return !this.parent || this.parent.trigger(e, t, i);
      }, asyncIsValid: function (e, t) {
         return a.warnOnce("asyncIsValid is deprecated; please use whenValid instead"), this.whenValid({ group: e, force: t });
      }, _findRelated: function () {
         return this.options.multiple ? e(this.parent.element.querySelectorAll("[" + this.options.namespace + 'multiple="' + this.options.multiple + '"]')) : this.$element;
      } };var u = function (e, t) {
      var i = e.match(/^\s*\[(.*)\]\s*$/);if (!i) throw 'Requirement is not an array: "' + e + '"';var n = i[1].split(",").map(a.trimString);if (n.length !== t) throw "Requirement has " + n.length + " values when " + t + " are needed";return n;
   },
       d = function (e, t, i) {
      var n = null,
          r = {};for (var s in e) if (s) {
         var o = i(s);"string" == typeof o && (o = a.parseRequirement(e[s], o)), r[s] = o;
      } else n = a.parseRequirement(e[s], t);return [n, r];
   },
       h = function (t) {
      e.extend(!0, this, t);
   };h.prototype = { validate: function (e, t) {
         if (this.fn) return arguments.length > 3 && (t = [].slice.call(arguments, 1, -1)), this.fn(e, t);if (Array.isArray(e)) {
            if (!this.validateMultiple) throw "Validator `" + this.name + "` does not handle multiple values";return this.validateMultiple.apply(this, arguments);
         }var i = arguments[arguments.length - 1];if (this.validateDate && i._isDateInput()) return arguments[0] = a.parse.date(arguments[0]), null !== arguments[0] && this.validateDate.apply(this, arguments);if (this.validateNumber) return !isNaN(e) && (arguments[0] = parseFloat(arguments[0]), this.validateNumber.apply(this, arguments));if (this.validateString) return this.validateString.apply(this, arguments);throw "Validator `" + this.name + "` only handles multiple values";
      }, parseRequirements: function (t, i) {
         if ("string" != typeof t) return Array.isArray(t) ? t : [t];var n = this.requirementType;if (Array.isArray(n)) {
            for (var r = u(t, n.length), s = 0; s < r.length; s++) r[s] = a.parseRequirement(n[s], r[s]);return r;
         }return e.isPlainObject(n) ? d(n, t, i) : [a.parseRequirement(n, t)];
      }, requirementType: "string", priority: 2 };var p = function (e, t) {
      this.__class__ = "ValidatorRegistry", this.locale = "en", this.init(e || {}, t || {});
   },
       c = { email: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i, number: /^-?(\d*\.)?\d+(e[-+]?\d+)?$/i, integer: /^-?\d+$/, digits: /^\d+$/, alphanum: /^\w+$/i, date: { test: function (e) {
            return null !== a.parse.date(e);
         } }, url: new RegExp("^(?:(?:https?|ftp)://)?(?:\\S+(?::\\S*)?@)?(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))(?::\\d{2,5})?(?:/\\S*)?$", "i") };c.range = c.number;var f = function (e) {
      var t = ("" + e).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);return t ? Math.max(0, (t[1] ? t[1].length : 0) - (t[2] ? +t[2] : 0)) : 0;
   },
       m = function (e, t) {
      return t.map(a.parse[e]);
   },
       g = function (e, t) {
      return function (i) {
         for (var n = arguments.length, r = Array(n > 1 ? n - 1 : 0), s = 1; s < n; s++) r[s - 1] = arguments[s];return r.pop(), t.apply(void 0, [i].concat(_toConsumableArray(m(e, r))));
      };
   },
       v = function (e) {
      return { validateDate: g("date", e), validateNumber: g("number", e), requirementType: e.length <= 2 ? "string" : ["string", "string"], priority: 30 };
   };p.prototype = { init: function (e, t) {
         this.catalog = t, this.validators = _extends({}, this.validators);for (var i in e) this.addValidator(i, e[i].fn, e[i].priority);window.Parsley.trigger("parsley:validator:init");
      }, setLocale: function (e) {
         if ("undefined" == typeof this.catalog[e]) throw new Error(e + " is not available in the catalog");return this.locale = e, this;
      }, addCatalog: function (e, t, i) {
         return "object" == typeof t && (this.catalog[e] = t), !0 === i ? this.setLocale(e) : this;
      }, addMessage: function (e, t, i) {
         return "undefined" == typeof this.catalog[e] && (this.catalog[e] = {}), this.catalog[e][t] = i, this;
      }, addMessages: function (e, t) {
         for (var i in t) this.addMessage(e, i, t[i]);return this;
      }, addValidator: function (e, t, i) {
         if (this.validators[e]) a.warn('Validator "' + e + '" is already defined.');else if (o.hasOwnProperty(e)) return void a.warn('"' + e + '" is a restricted keyword and is not a valid validator name.');return this._setValidator.apply(this, arguments);
      }, hasValidator: function (e) {
         return !!this.validators[e];
      }, updateValidator: function (e, t, i) {
         return this.validators[e] ? this._setValidator.apply(this, arguments) : (a.warn('Validator "' + e + '" is not already defined.'), this.addValidator.apply(this, arguments));
      }, removeValidator: function (e) {
         return this.validators[e] || a.warn('Validator "' + e + '" is not defined.'), delete this.validators[e], this;
      }, _setValidator: function (e, t, i) {
         "object" != typeof t && (t = { fn: t, priority: i }), t.validate || (t = new h(t)), this.validators[e] = t;for (var n in t.messages || {}) this.addMessage(n, e, t.messages[n]);return this;
      }, getErrorMessage: function (e) {
         var t;if ("type" === e.name) {
            var i = this.catalog[this.locale][e.name] || {};t = i[e.requirements];
         } else t = this.formatMessage(this.catalog[this.locale][e.name], e.requirements);return t || this.catalog[this.locale].defaultMessage || this.catalog.en.defaultMessage;
      }, formatMessage: function (e, t) {
         if ("object" == typeof t) {
            for (var i in t) e = this.formatMessage(e, t[i]);return e;
         }return "string" == typeof e ? e.replace(/%s/i, t) : "";
      }, validators: { notblank: { validateString: function (e) {
               return (/\S/.test(e)
               );
            }, priority: 2 }, required: { validateMultiple: function (e) {
               return e.length > 0;
            }, validateString: function (e) {
               return (/\S/.test(e)
               );
            }, priority: 512 }, type: { validateString: function (e, t) {
               var i = arguments.length <= 2 || void 0 === arguments[2] ? {} : arguments[2],
                   n = i.step,
                   r = void 0 === n ? "any" : n,
                   s = i.base,
                   a = void 0 === s ? 0 : s,
                   o = c[t];if (!o) throw new Error("validator type `" + t + "` is not supported");if (!o.test(e)) return !1;if ("number" === t && !/^any$/i.test(r || "")) {
                  var l = Number(e),
                      u = Math.max(f(r), f(a));if (f(l) > u) return !1;var d = function (e) {
                     return Math.round(e * Math.pow(10, u));
                  };if ((d(l) - d(a)) % d(r) != 0) return !1;
               }return !0;
            }, requirementType: { "": "string", step: "string", base: "number" }, priority: 256 }, pattern: { validateString: function (e, t) {
               return t.test(e);
            }, requirementType: "regexp", priority: 64 }, minlength: { validateString: function (e, t) {
               return e.length >= t;
            }, requirementType: "integer", priority: 30 }, maxlength: { validateString: function (e, t) {
               return e.length <= t;
            }, requirementType: "integer", priority: 30 }, length: { validateString: function (e, t, i) {
               return e.length >= t && e.length <= i;
            }, requirementType: ["integer", "integer"], priority: 30 }, mincheck: { validateMultiple: function (e, t) {
               return e.length >= t;
            }, requirementType: "integer", priority: 30 }, maxcheck: { validateMultiple: function (e, t) {
               return e.length <= t;
            }, requirementType: "integer", priority: 30 }, check: { validateMultiple: function (e, t, i) {
               return e.length >= t && e.length <= i;
            }, requirementType: ["integer", "integer"], priority: 30 }, min: v(function (e, t) {
            return e >= t;
         }), max: v(function (e, t) {
            return e <= t;
         }), range: v(function (e, t, i) {
            return e >= t && e <= i;
         }), equalto: { validateString: function (t, i) {
               var n = e(i);return n.length ? t === n.val() : t === i;
            }, priority: 256 } } };var y = {},
       _ = function k(e, t, i) {
      for (var n = [], r = [], s = 0; s < e.length; s++) {
         for (var a = !1, o = 0; o < t.length; o++) if (e[s].assert.name === t[o].assert.name) {
            a = !0;break;
         }a ? r.push(e[s]) : n.push(e[s]);
      }return { kept: r, added: n, removed: i ? [] : k(t, e, !0).added };
   };y.Form = { _actualizeTriggers: function () {
         var e = this;this.$element.on("submit.Parsley", function (t) {
            e.onSubmitValidate(t);
         }), this.$element.on("click.Parsley", a._SubmitSelector, function (t) {
            e.onSubmitButton(t);
         }), !1 !== this.options.uiEnabled && this.element.setAttribute("novalidate", "");
      }, focus: function () {
         if (this._focusedField = null, !0 === this.validationResult || "none" === this.options.focus) return null;for (var e = 0; e < this.fields.length; e++) {
            var t = this.fields[e];if (!0 !== t.validationResult && t.validationResult.length > 0 && "undefined" == typeof t.options.noFocus && (this._focusedField = t.$element, "first" === this.options.focus)) break;
         }return null === this._focusedField ? null : this._focusedField.focus();
      }, _destroyUI: function () {
         this.$element.off(".Parsley");
      } }, y.Field = { _reflowUI: function () {
         if (this._buildUI(), this._ui) {
            var e = _(this.validationResult, this._ui.lastValidationResult);this._ui.lastValidationResult = this.validationResult, this._manageStatusClass(), this._manageErrorsMessages(e), this._actualizeTriggers(), !e.kept.length && !e.added.length || this._failedOnce || (this._failedOnce = !0, this._actualizeTriggers());
         }
      }, getErrorsMessages: function () {
         if (!0 === this.validationResult) return [];for (var e = [], t = 0; t < this.validationResult.length; t++) e.push(this.validationResult[t].errorMessage || this._getErrorMessage(this.validationResult[t].assert));return e;
      }, addError: function (e) {
         var t = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1],
             i = t.message,
             n = t.assert,
             r = t.updateClass,
             s = void 0 === r || r;this._buildUI(), this._addError(e, { message: i, assert: n }), s && this._errorClass();
      }, updateError: function (e) {
         var t = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1],
             i = t.message,
             n = t.assert,
             r = t.updateClass,
             s = void 0 === r || r;this._buildUI(), this._updateError(e, { message: i, assert: n }), s && this._errorClass();
      }, removeError: function (e) {
         var t = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1],
             i = t.updateClass,
             n = void 0 === i || i;this._buildUI(), this._removeError(e), n && this._manageStatusClass();
      }, _manageStatusClass: function () {
         this.hasConstraints() && this.needsValidation() && !0 === this.validationResult ? this._successClass() : this.validationResult.length > 0 ? this._errorClass() : this._resetClass();
      }, _manageErrorsMessages: function (t) {
         if ("undefined" == typeof this.options.errorsMessagesDisabled) {
            if ("undefined" != typeof this.options.errorMessage) return t.added.length || t.kept.length ? (this._insertErrorWrapper(), 0 === this._ui.$errorsWrapper.find(".parsley-custom-error-message").length && this._ui.$errorsWrapper.append(e(this.options.errorTemplate).addClass("parsley-custom-error-message")), this._ui.$errorsWrapper.addClass("filled").find(".parsley-custom-error-message").html(this.options.errorMessage)) : this._ui.$errorsWrapper.removeClass("filled").find(".parsley-custom-error-message").remove();for (var i = 0; i < t.removed.length; i++) this._removeError(t.removed[i].assert.name);for (i = 0; i < t.added.length; i++) this._addError(t.added[i].assert.name, { message: t.added[i].errorMessage, assert: t.added[i].assert });for (i = 0; i < t.kept.length; i++) this._updateError(t.kept[i].assert.name, { message: t.kept[i].errorMessage, assert: t.kept[i].assert });
         }
      }, _addError: function (t, i) {
         var n = i.message,
             r = i.assert;this._insertErrorWrapper(), this._ui.$errorsWrapper.addClass("filled").append(e(this.options.errorTemplate).addClass("parsley-" + t).html(n || this._getErrorMessage(r)));
      }, _updateError: function (e, t) {
         var i = t.message,
             n = t.assert;this._ui.$errorsWrapper.addClass("filled").find(".parsley-" + e).html(i || this._getErrorMessage(n));
      }, _removeError: function (e) {
         this._ui.$errorsWrapper.removeClass("filled").find(".parsley-" + e).remove();
      }, _getErrorMessage: function (e) {
         var t = e.name + "Message";return "undefined" != typeof this.options[t] ? window.Parsley.formatMessage(this.options[t], e.requirements) : window.Parsley.getErrorMessage(e);
      }, _buildUI: function () {
         if (!this._ui && !1 !== this.options.uiEnabled) {
            var t = {};this.element.setAttribute(this.options.namespace + "id", this.__id__), t.$errorClassHandler = this._manageClassHandler(), t.errorsWrapperId = "parsley-id-" + (this.options.multiple ? "multiple-" + this.options.multiple : this.__id__), t.$errorsWrapper = e(this.options.errorsWrapper).attr("id", t.errorsWrapperId), t.lastValidationResult = [], t.validationInformationVisible = !1, this._ui = t;
         }
      }, _manageClassHandler: function () {
         if ("string" == typeof this.options.classHandler && e(this.options.classHandler).length) return e(this.options.classHandler);var t = this.options.classHandler;if ("string" == typeof this.options.classHandler && "function" == typeof window[this.options.classHandler] && (t = window[this.options.classHandler]), "function" == typeof t) {
            var i = t.call(this, this);if ("undefined" != typeof i && i.length) return i;
         } else {
            if ("object" == typeof t && t instanceof jQuery && t.length) return t;t && a.warn("The class handler `" + t + "` does not exist in DOM nor as a global JS function");
         }return this._inputHolder();
      }, _inputHolder: function () {
         return this.options.multiple && "SELECT" !== this.element.nodeName ? this.$element.parent() : this.$element;
      }, _insertErrorWrapper: function () {
         var t = this.options.errorsContainer;if (0 !== this._ui.$errorsWrapper.parent().length) return this._ui.$errorsWrapper.parent();if ("string" == typeof t) {
            if (e(t).length) return e(t).append(this._ui.$errorsWrapper);"function" == typeof window[t] ? t = window[t] : a.warn("The errors container `" + t + "` does not exist in DOM nor as a global JS function");
         }return "function" == typeof t && (t = t.call(this, this)), "object" == typeof t && t.length ? t.append(this._ui.$errorsWrapper) : this._inputHolder().after(this._ui.$errorsWrapper);
      }, _actualizeTriggers: function () {
         var e,
             t = this,
             i = this._findRelated();i.off(".Parsley"), this._failedOnce ? i.on(a.namespaceEvents(this.options.triggerAfterFailure, "Parsley"), function () {
            t._validateIfNeeded();
         }) : (e = a.namespaceEvents(this.options.trigger, "Parsley")) && i.on(e, function (e) {
            t._validateIfNeeded(e);
         });
      }, _validateIfNeeded: function (e) {
         var t = this;e && /key|input/.test(e.type) && (!this._ui || !this._ui.validationInformationVisible) && this.getValue().length <= this.options.validationThreshold || (this.options.debounce ? (window.clearTimeout(this._debounced), this._debounced = window.setTimeout(function () {
            return t.validate();
         }, this.options.debounce)) : this.validate());
      }, _resetUI: function () {
         this._failedOnce = !1, this._actualizeTriggers(), "undefined" != typeof this._ui && (this._ui.$errorsWrapper.removeClass("filled").children().remove(), this._resetClass(), this._ui.lastValidationResult = [], this._ui.validationInformationVisible = !1);
      }, _destroyUI: function () {
         this._resetUI(), "undefined" != typeof this._ui && this._ui.$errorsWrapper.remove(), delete this._ui;
      }, _successClass: function () {
         this._ui.validationInformationVisible = !0, this._ui.$errorClassHandler.removeClass(this.options.errorClass).addClass(this.options.successClass);
      }, _errorClass: function () {
         this._ui.validationInformationVisible = !0, this._ui.$errorClassHandler.removeClass(this.options.successClass).addClass(this.options.errorClass);
      }, _resetClass: function () {
         this._ui.$errorClassHandler.removeClass(this.options.successClass).removeClass(this.options.errorClass);
      } };var w = function (t, i, n) {
      this.__class__ = "Form", this.element = t, this.$element = e(t), this.domOptions = i, this.options = n, this.parent = window.Parsley, this.fields = [], this.validationResult = null;
   },
       b = { pending: null, resolved: !0, rejected: !1 };w.prototype = { onSubmitValidate: function (e) {
         var t = this;if (!0 !== e.parsley) {
            var i = this._submitSource || this.$element.find(a._SubmitSelector)[0];if (this._submitSource = null, this.$element.find(".parsley-synthetic-submit-button").prop("disabled", !0), !i || null === i.getAttribute("formnovalidate")) {
               window.Parsley._remoteCache = {};var n = this.whenValidate({ event: e });"resolved" === n.state() && !1 !== this._trigger("submit") || (e.stopImmediatePropagation(), e.preventDefault(), "pending" === n.state() && n.done(function () {
                  t._submit(i);
               }));
            }
         }
      }, onSubmitButton: function (e) {
         this._submitSource = e.currentTarget;
      }, _submit: function (t) {
         if (!1 !== this._trigger("submit")) {
            if (t) {
               var i = this.$element.find(".parsley-synthetic-submit-button").prop("disabled", !1);0 === i.length && (i = e('<input class="parsley-synthetic-submit-button" type="hidden">').appendTo(this.$element)), i.attr({ name: t.getAttribute("name"), value: t.getAttribute("value") });
            }this.$element.trigger(_extends(e.Event("submit"), { parsley: !0 }));
         }
      }, validate: function (t) {
         if (arguments.length >= 1 && !e.isPlainObject(t)) {
            a.warnOnce("Calling validate on a parsley form without passing arguments as an object is deprecated.");var i = _slice.call(arguments),
                n = i[0],
                r = i[1],
                s = i[2];t = { group: n, force: r, event: s };
         }return b[this.whenValidate(t).state()];
      }, whenValidate: function () {
         var t,
             i = this,
             n = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0],
             r = n.group,
             s = n.force,
             o = n.event;this.submitEvent = o, o && (this.submitEvent = _extends({}, o, { preventDefault: function () {
               a.warnOnce("Using `this.submitEvent.preventDefault()` is deprecated; instead, call `this.validationResult = false`"), i.validationResult = !1;
            } })), this.validationResult = !0, this._trigger("validate"), this._refreshFields();var l = this._withoutReactualizingFormOptions(function () {
            return e.map(i.fields, function (e) {
               return e.whenValidate({ force: s, group: r });
            });
         });return (t = a.all(l).done(function () {
            i._trigger("success");
         }).fail(function () {
            i.validationResult = !1, i.focus(), i._trigger("error");
         }).always(function () {
            i._trigger("validated");
         })).pipe.apply(t, _toConsumableArray(this._pipeAccordingToValidationResult()));
      }, isValid: function (t) {
         if (arguments.length >= 1 && !e.isPlainObject(t)) {
            a.warnOnce("Calling isValid on a parsley form without passing arguments as an object is deprecated.");var i = _slice.call(arguments),
                n = i[0],
                r = i[1];t = { group: n, force: r };
         }return b[this.whenValid(t).state()];
      }, whenValid: function () {
         var t = this,
             i = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0],
             n = i.group,
             r = i.force;this._refreshFields();var s = this._withoutReactualizingFormOptions(function () {
            return e.map(t.fields, function (e) {
               return e.whenValid({ group: n, force: r });
            });
         });return a.all(s);
      }, refresh: function () {
         return this._refreshFields(), this;
      }, reset: function () {
         for (var e = 0; e < this.fields.length; e++) this.fields[e].reset();this._trigger("reset");
      }, destroy: function () {
         this._destroyUI();for (var e = 0; e < this.fields.length; e++) this.fields[e].destroy();this.$element.removeData("Parsley"), this._trigger("destroy");
      }, _refreshFields: function () {
         return this.actualizeOptions()._bindFields();
      }, _bindFields: function () {
         var t = this,
             i = this.fields;return this.fields = [], this.fieldsMappedById = {}, this._withoutReactualizingFormOptions(function () {
            t.$element.find(t.options.inputs).not(t.options.excluded).each(function (e, i) {
               var n = new window.Parsley.Factory(i, {}, t);if (("Field" === n.__class__ || "FieldMultiple" === n.__class__) && !0 !== n.options.excluded) {
                  var r = n.__class__ + "-" + n.__id__;"undefined" == typeof t.fieldsMappedById[r] && (t.fieldsMappedById[r] = n, t.fields.push(n));
               }
            }), e.each(a.difference(i, t.fields), function (e, t) {
               t.reset();
            });
         }), this;
      }, _withoutReactualizingFormOptions: function (e) {
         var t = this.actualizeOptions;this.actualizeOptions = function () {
            return this;
         };var i = e();return this.actualizeOptions = t, i;
      }, _trigger: function (e) {
         return this.trigger("form:" + e);
      } };var F = function (e, t, i, n, r) {
      var s = window.Parsley._validatorRegistry.validators[t],
          a = new h(s);n = n || e.options[t + "Priority"] || a.priority, r = !0 === r, _extends(this, { validator: a, name: t, requirements: i, priority: n, isDomConstraint: r }), this._parseRequirements(e.options);
   },
       C = function (e) {
      var t = e[0].toUpperCase();return t + e.slice(1);
   };F.prototype = { validate: function (e, t) {
         var i;return (i = this.validator).validate.apply(i, [e].concat(_toConsumableArray(this.requirementList), [t]));
      }, _parseRequirements: function (e) {
         var t = this;this.requirementList = this.validator.parseRequirements(this.requirements, function (i) {
            return e[t.name + C(i)];
         });
      } };var E = function (t, i, n, r) {
      this.__class__ = "Field", this.element = t, this.$element = e(t), "undefined" != typeof r && (this.parent = r), this.options = n, this.domOptions = i, this.constraints = [], this.constraintsByName = {}, this.validationResult = !0, this._bindConstraints();
   },
       A = { pending: null, resolved: !0, rejected: !1 };E.prototype = { validate: function (t) {
         arguments.length >= 1 && !e.isPlainObject(t) && (a.warnOnce("Calling validate on a parsley field without passing arguments as an object is deprecated."), t = { options: t });var i = this.whenValidate(t);if (!i) return !0;switch (i.state()) {case "pending":
               return null;case "resolved":
               return !0;case "rejected":
               return this.validationResult;}
      }, whenValidate: function () {
         var e,
             t = this,
             i = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0],
             n = i.force,
             r = i.group;if (this.refresh(), !r || this._isInGroup(r)) return this.value = this.getValue(), this._trigger("validate"), (e = this.whenValid({ force: n, value: this.value, _refreshed: !0 }).always(function () {
            t._reflowUI();
         }).done(function () {
            t._trigger("success");
         }).fail(function () {
            t._trigger("error");
         }).always(function () {
            t._trigger("validated");
         })).pipe.apply(e, _toConsumableArray(this._pipeAccordingToValidationResult()));
      }, hasConstraints: function () {
         return 0 !== this.constraints.length;
      }, needsValidation: function (e) {
         return "undefined" == typeof e && (e = this.getValue()), !(!e.length && !this._isRequired() && "undefined" == typeof this.options.validateIfEmpty);
      }, _isInGroup: function (t) {
         return Array.isArray(this.options.group) ? -1 !== e.inArray(t, this.options.group) : this.options.group === t;
      }, isValid: function (t) {
         if (arguments.length >= 1 && !e.isPlainObject(t)) {
            a.warnOnce("Calling isValid on a parsley field without passing arguments as an object is deprecated.");var i = _slice.call(arguments),
                n = i[0],
                r = i[1];t = { force: n, value: r };
         }var s = this.whenValid(t);return !s || A[s.state()];
      }, whenValid: function () {
         var t = this,
             i = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0],
             n = i.force,
             r = void 0 !== n && n,
             s = i.value,
             o = i.group,
             l = i._refreshed;if (l || this.refresh(), !o || this._isInGroup(o)) {
            if (this.validationResult = !0, !this.hasConstraints()) return e.when();if ("undefined" != typeof s && null !== s || (s = this.getValue()), !this.needsValidation(s) && !0 !== r) return e.when();var u = this._getGroupedConstraints(),
                d = [];return e.each(u, function (i, n) {
               var r = a.all(e.map(n, function (e) {
                  return t._validateConstraint(s, e);
               }));if (d.push(r), "rejected" === r.state()) return !1;
            }), a.all(d);
         }
      }, _validateConstraint: function (t, i) {
         var n = this,
             r = i.validate(t, this);return !1 === r && (r = e.Deferred().reject()), a.all([r]).fail(function (e) {
            n.validationResult instanceof Array || (n.validationResult = []), n.validationResult.push({ assert: i, errorMessage: "string" == typeof e && e });
         });
      }, getValue: function () {
         var e;return e = "function" == typeof this.options.value ? this.options.value(this) : "undefined" != typeof this.options.value ? this.options.value : this.$element.val(), "undefined" == typeof e || null === e ? "" : this._handleWhitespace(e);
      }, reset: function () {
         return this._resetUI(), this._trigger("reset");
      }, destroy: function () {
         this._destroyUI(), this.$element.removeData("Parsley"), this.$element.removeData("FieldMultiple"), this._trigger("destroy");
      }, refresh: function () {
         return this._refreshConstraints(), this;
      }, _refreshConstraints: function () {
         return this.actualizeOptions()._bindConstraints();
      }, refreshConstraints: function () {
         return a.warnOnce("Parsley's refreshConstraints is deprecated. Please use refresh"), this.refresh();
      }, addConstraint: function (e, t, i, n) {
         if (window.Parsley._validatorRegistry.validators[e]) {
            var r = new F(this, e, t, i, n);"undefined" !== this.constraintsByName[r.name] && this.removeConstraint(r.name), this.constraints.push(r), this.constraintsByName[r.name] = r;
         }return this;
      }, removeConstraint: function (e) {
         for (var t = 0; t < this.constraints.length; t++) if (e === this.constraints[t].name) {
            this.constraints.splice(t, 1);break;
         }return delete this.constraintsByName[e], this;
      }, updateConstraint: function (e, t, i) {
         return this.removeConstraint(e).addConstraint(e, t, i);
      }, _bindConstraints: function () {
         for (var e = [], t = {}, i = 0; i < this.constraints.length; i++) !1 === this.constraints[i].isDomConstraint && (e.push(this.constraints[i]), t[this.constraints[i].name] = this.constraints[i]);this.constraints = e, this.constraintsByName = t;for (var n in this.options) this.addConstraint(n, this.options[n], void 0, !0);return this._bindHtml5Constraints();
      }, _bindHtml5Constraints: function () {
         null !== this.element.getAttribute("required") && this.addConstraint("required", !0, void 0, !0), null !== this.element.getAttribute("pattern") && this.addConstraint("pattern", this.element.getAttribute("pattern"), void 0, !0);var e = this.element.getAttribute("min"),
             t = this.element.getAttribute("max");null !== e && null !== t ? this.addConstraint("range", [e, t], void 0, !0) : null !== e ? this.addConstraint("min", e, void 0, !0) : null !== t && this.addConstraint("max", t, void 0, !0), null !== this.element.getAttribute("minlength") && null !== this.element.getAttribute("maxlength") ? this.addConstraint("length", [this.element.getAttribute("minlength"), this.element.getAttribute("maxlength")], void 0, !0) : null !== this.element.getAttribute("minlength") ? this.addConstraint("minlength", this.element.getAttribute("minlength"), void 0, !0) : null !== this.element.getAttribute("maxlength") && this.addConstraint("maxlength", this.element.getAttribute("maxlength"), void 0, !0);var i = a.getType(this.element);return "number" === i ? this.addConstraint("type", ["number", { step: this.element.getAttribute("step") || "1", base: e || this.element.getAttribute("value") }], void 0, !0) : /^(email|url|range|date)$/i.test(i) ? this.addConstraint("type", i, void 0, !0) : this;
      }, _isRequired: function () {
         return "undefined" != typeof this.constraintsByName.required && !1 !== this.constraintsByName.required.requirements;
      }, _trigger: function (e) {
         return this.trigger("field:" + e);
      }, _handleWhitespace: function (e) {
         return !0 === this.options.trimValue && a.warnOnce('data-parsley-trim-value="true" is deprecated, please use data-parsley-whitespace="trim"'), "squish" === this.options.whitespace && (e = e.replace(/\s{2,}/g, " ")), "trim" !== this.options.whitespace && "squish" !== this.options.whitespace && !0 !== this.options.trimValue || (e = a.trimString(e)), e;
      }, _isDateInput: function () {
         var e = this.constraintsByName.type;return e && "date" === e.requirements;
      }, _getGroupedConstraints: function () {
         if (!1 === this.options.priorityEnabled) return [this.constraints];for (var e = [], t = {}, i = 0; i < this.constraints.length; i++) {
            var n = this.constraints[i].priority;t[n] || e.push(t[n] = []), t[n].push(this.constraints[i]);
         }return e.sort(function (e, t) {
            return t[0].priority - e[0].priority;
         }), e;
      } };var x = E,
       $ = function () {
      this.__class__ = "FieldMultiple";
   };$.prototype = { addElement: function (e) {
         return this.$elements.push(e), this;
      }, _refreshConstraints: function () {
         var t;if (this.constraints = [], "SELECT" === this.element.nodeName) return this.actualizeOptions()._bindConstraints(), this;for (var i = 0; i < this.$elements.length; i++) if (e("html").has(this.$elements[i]).length) {
            t = this.$elements[i].data("FieldMultiple")._refreshConstraints().constraints;for (var n = 0; n < t.length; n++) this.addConstraint(t[n].name, t[n].requirements, t[n].priority, t[n].isDomConstraint);
         } else this.$elements.splice(i, 1);return this;
      }, getValue: function () {
         if ("function" == typeof this.options.value) return this.options.value(this);if ("undefined" != typeof this.options.value) return this.options.value;if ("INPUT" === this.element.nodeName) {
            var t = a.getType(this.element);if ("radio" === t) return this._findRelated().filter(":checked").val() || "";if ("checkbox" === t) {
               var i = [];return this._findRelated().filter(":checked").each(function () {
                  i.push(e(this).val());
               }), i;
            }
         }return "SELECT" === this.element.nodeName && null === this.$element.val() ? [] : this.$element.val();
      }, _init: function () {
         return this.$elements = [this.$element], this;
      } };var P = function (t, i, n) {
      this.element = t, this.$element = e(t);var r = this.$element.data("Parsley");if (r) return "undefined" != typeof n && r.parent === window.Parsley && (r.parent = n, r._resetOptions(r.options)), "object" == typeof i && _extends(r.options, i), r;if (!this.$element.length) throw new Error("You must bind Parsley on an existing element.");if ("undefined" != typeof n && "Form" !== n.__class__) throw new Error("Parent instance must be a Form instance");return this.parent = n || window.Parsley, this.init(i);
   };P.prototype = { init: function (e) {
         return this.__class__ = "Parsley", this.__version__ = "2.8.0", this.__id__ = a.generateID(), this._resetOptions(e), "FORM" === this.element.nodeName || a.checkAttr(this.element, this.options.namespace, "validate") && !this.$element.is(this.options.inputs) ? this.bind("parsleyForm") : this.isMultiple() ? this.handleMultiple() : this.bind("parsleyField");
      }, isMultiple: function () {
         var e = a.getType(this.element);return "radio" === e || "checkbox" === e || "SELECT" === this.element.nodeName && null !== this.element.getAttribute("multiple");
      }, handleMultiple: function () {
         var t,
             i,
             n = this;if (this.options.multiple = this.options.multiple || (t = this.element.getAttribute("name")) || this.element.getAttribute("id"), "SELECT" === this.element.nodeName && null !== this.element.getAttribute("multiple")) return this.options.multiple = this.options.multiple || this.__id__, this.bind("parsleyFieldMultiple");if (!this.options.multiple) return a.warn("To be bound by Parsley, a radio, a checkbox and a multiple select input must have either a name or a multiple option.", this.$element), this;this.options.multiple = this.options.multiple.replace(/(:|\.|\[|\]|\{|\}|\$)/g, ""), t && e('input[name="' + t + '"]').each(function (e, t) {
            var i = a.getType(t);"radio" !== i && "checkbox" !== i || t.setAttribute(n.options.namespace + "multiple", n.options.multiple);
         });for (var r = this._findRelated(), s = 0; s < r.length; s++) if (i = e(r.get(s)).data("Parsley"), "undefined" != typeof i) {
            this.$element.data("FieldMultiple") || i.addElement(this.$element);break;
         }return this.bind("parsleyField", !0), i || this.bind("parsleyFieldMultiple");
      }, bind: function (t, i) {
         var n;switch (t) {case "parsleyForm":
               n = e.extend(new w(this.element, this.domOptions, this.options), new l(), window.ParsleyExtend)._bindFields();break;case "parsleyField":
               n = e.extend(new x(this.element, this.domOptions, this.options, this.parent), new l(), window.ParsleyExtend);break;case "parsleyFieldMultiple":
               n = e.extend(new x(this.element, this.domOptions, this.options, this.parent), new $(), new l(), window.ParsleyExtend)._init();break;default:
               throw new Error(t + "is not a supported Parsley type");}return this.options.multiple && a.setAttr(this.element, this.options.namespace, "multiple", this.options.multiple), "undefined" != typeof i ? (this.$element.data("FieldMultiple", n), n) : (this.$element.data("Parsley", n), n._actualizeTriggers(), n._trigger("init"), n);
      } };var V = e.fn.jquery.split(".");if (parseInt(V[0]) <= 1 && parseInt(V[1]) < 8) throw "The loaded version of jQuery is too old. Please upgrade to 1.8.x or better.";V.forEach || a.warn("Parsley requires ES5 to run properly. Please include https://github.com/es-shims/es5-shim");var T = _extends(new l(), { element: document, $element: e(document), actualizeOptions: null, _resetOptions: null, Factory: P, version: "2.8.0" });_extends(x.prototype, y.Field, l.prototype), _extends(w.prototype, y.Form, l.prototype), _extends(P.prototype, l.prototype), e.fn.parsley = e.fn.psly = function (t) {
      if (this.length > 1) {
         var i = [];return this.each(function () {
            i.push(e(this).parsley(t));
         }), i;
      }if (0 != this.length) return new P(this[0], t);
   }, "undefined" == typeof window.ParsleyExtend && (window.ParsleyExtend = {}), T.options = _extends(a.objectCreate(o), window.ParsleyConfig), window.ParsleyConfig = T.options, window.Parsley = window.psly = T, T.Utils = a, window.ParsleyUtils = {}, e.each(a, function (e, t) {
      "function" == typeof t && (window.ParsleyUtils[e] = function () {
         return a.warnOnce("Accessing `window.ParsleyUtils` is deprecated. Use `window.Parsley.Utils` instead."), a[e].apply(a, arguments);
      });
   });var O = window.Parsley._validatorRegistry = new p(window.ParsleyConfig.validators, window.ParsleyConfig.i18n);window.ParsleyValidator = {}, e.each("setLocale addCatalog addMessage addMessages getErrorMessage formatMessage addValidator updateValidator removeValidator hasValidator".split(" "), function (e, t) {
      window.Parsley[t] = function () {
         return O[t].apply(O, arguments);
      }, window.ParsleyValidator[t] = function () {
         var e;return a.warnOnce("Accessing the method '" + t + "' through Validator is deprecated. Simply call 'window.Parsley." + t + "(...)'"), (e = window.Parsley)[t].apply(e, arguments);
      };
   }), window.Parsley.UI = y, window.ParsleyUI = { removeError: function (e, t, i) {
         var n = !0 !== i;return a.warnOnce("Accessing UI is deprecated. Call 'removeError' on the instance directly. Please comment in issue 1073 as to your need to call this method."), e.removeError(t, { updateClass: n });
      }, getErrorsMessages: function (e) {
         return a.warnOnce("Accessing UI is deprecated. Call 'getErrorsMessages' on the instance directly."), e.getErrorsMessages();
      } }, e.each("addError updateError".split(" "), function (e, t) {
      window.ParsleyUI[t] = function (e, i, n, r, s) {
         var o = !0 !== s;return a.warnOnce("Accessing UI is deprecated. Call '" + t + "' on the instance directly. Please comment in issue 1073 as to your need to call this method."), e[t](i, { message: n, assert: r, updateClass: o });
      };
   }), !1 !== window.ParsleyConfig.autoBind && e(function () {
      e("[data-parsley-validate]").length && e("[data-parsley-validate]").parsley();
   });var M = e({}),
       R = function () {
      a.warnOnce("Parsley's pubsub module is deprecated; use the 'on' and 'off' methods on parsley instances or window.Parsley");
   },
       D = "parsley:";e.listen = function (e, n) {
      var r;if (R(), "object" == typeof arguments[1] && "function" == typeof arguments[2] && (r = arguments[1], n = arguments[2]), "function" != typeof n) throw new Error("Wrong parameters");window.Parsley.on(i(e), t(n, r));
   }, e.listenTo = function (e, n, r) {
      if (R(), !(e instanceof x || e instanceof w)) throw new Error("Must give Parsley instance");if ("string" != typeof n || "function" != typeof r) throw new Error("Wrong parameters");e.on(i(n), t(r));
   }, e.unsubscribe = function (e, t) {
      if (R(), "string" != typeof e || "function" != typeof t) throw new Error("Wrong arguments");window.Parsley.off(i(e), t.parsleyAdaptedCallback);
   }, e.unsubscribeTo = function (e, t) {
      if (R(), !(e instanceof x || e instanceof w)) throw new Error("Must give Parsley instance");e.off(i(t));
   }, e.unsubscribeAll = function (t) {
      R(), window.Parsley.off(i(t)), e("form,input,textarea,select").each(function () {
         var n = e(this).data("Parsley");n && n.off(i(t));
      });
   }, e.emit = function (e, t) {
      var n;R();var r = t instanceof x || t instanceof w,
          s = Array.prototype.slice.call(arguments, r ? 2 : 1);s.unshift(i(e)), r || (t = window.Parsley), (n = t).trigger.apply(n, _toConsumableArray(s));
   };e.extend(!0, T, { asyncValidators: { "default": { fn: function (e) {
               return e.status >= 200 && e.status < 300;
            }, url: !1 }, reverse: { fn: function (e) {
               return e.status < 200 || e.status >= 300;
            }, url: !1 } }, addAsyncValidator: function (e, t, i, n) {
         return T.asyncValidators[e] = { fn: t, url: i || !1, options: n || {} }, this;
      } }), T.addValidator("remote", { requirementType: { "": "string", validator: "string", reverse: "boolean", options: "object" }, validateString: function (t, i, n, r) {
         var s,
             a,
             o = {},
             l = n.validator || (!0 === n.reverse ? "reverse" : "default");if ("undefined" == typeof T.asyncValidators[l]) throw new Error("Calling an undefined async validator: `" + l + "`");i = T.asyncValidators[l].url || i, i.indexOf("{value}") > -1 ? i = i.replace("{value}", encodeURIComponent(t)) : o[r.element.getAttribute("name") || r.element.getAttribute("id")] = t;var u = e.extend(!0, n.options || {}, T.asyncValidators[l].options);s = e.extend(!0, {}, { url: i, data: o, type: "GET" }, u), r.trigger("field:ajaxoptions", r, s), a = e.param(s), "undefined" == typeof T._remoteCache && (T._remoteCache = {});var d = T._remoteCache[a] = T._remoteCache[a] || e.ajax(s),
             h = function () {
            var t = T.asyncValidators[l].fn.call(r, d, i, n);return t || (t = e.Deferred().reject()), e.when(t);
         };return d.then(h, h);
      }, priority: -1 }), T.on("form:submit", function () {
      T._remoteCache = {};
   }), l.prototype.addAsyncValidator = function () {
      return a.warnOnce("Accessing the method `addAsyncValidator` through an instance is deprecated. Simply call `Parsley.addAsyncValidator(...)`"), T.addAsyncValidator.apply(T, arguments);
   }, T.addMessages("en", { defaultMessage: "This value seems to be invalid.", type: { email: "This value should be a valid email.", url: "This value should be a valid url.", number: "This value should be a valid number.", integer: "This value should be a valid integer.", digits: "This value should be digits.", alphanum: "This value should be alphanumeric." }, notblank: "This value should not be blank.", required: "This value is required.", pattern: "This value seems to be invalid.", min: "This value should be greater than or equal to %s.", max: "This value should be lower than or equal to %s.", range: "This value should be between %s and %s.", minlength: "This value is too short. It should have %s characters or more.", maxlength: "This value is too long. It should have %s characters or fewer.", length: "This value length is invalid. It should be between %s and %s characters long.", mincheck: "You must select at least %s choices.", maxcheck: "You must select %s choices or fewer.", check: "You must select between %s and %s choices.", equalto: "This value should be the same." }), T.setLocale("en");var I = new n();I.install();var q = T;return q;
});
//# sourceMappingURL=parsley.min.js.map
/*!
  SerializeJSON jQuery plugin.
  https://github.com/marioizquierdo/jquery.serializeJSON
  version 2.7.2 (Dec, 2015)

  Copyright (c) 2012, 2015 Mario Izquierdo
  Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
  and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
*/
!function (e) {
  if ("function" == typeof define && define.amd) define(["jquery"], e);else if ("object" == typeof exports) {
    var n = require("jquery");module.exports = e(n);
  } else e(window.jQuery || window.Zepto || window.$);
}(function (e) {
  "use strict";
  e.fn.serializeJSON = function (n) {
    var r, t, a, i, s, u, o, l, p, c, d;return r = e.serializeJSON, t = this, a = r.setupOpts(n), i = t.serializeArray(), r.readCheckboxUncheckedValues(i, a, t), s = {}, e.each(i, function (e, n) {
      u = n.name, o = n.value, l = r.extractTypeAndNameWithNoType(u), p = l.nameWithNoType, c = l.type, c || (c = r.tryToFindTypeFromDataAttr(u, t)), r.validateType(u, c, a), "skip" !== c && (d = r.splitInputNameIntoKeysArray(p), o = r.parseValue(o, u, c, a), r.deepSet(s, d, o, a));
    }), s;
  }, e.serializeJSON = { defaultOptions: { checkboxUncheckedValue: void 0, parseNumbers: !1, parseBooleans: !1, parseNulls: !1, parseAll: !1, parseWithFunction: null, customTypes: {}, defaultTypes: { string: function (e) {
          return String(e);
        }, number: function (e) {
          return Number(e);
        }, "boolean": function (e) {
          var n = ["false", "null", "undefined", "", "0"];return -1 === n.indexOf(e);
        }, "null": function (e) {
          var n = ["false", "null", "undefined", "", "0"];return -1 === n.indexOf(e) ? e : null;
        }, array: function (e) {
          return JSON.parse(e);
        }, object: function (e) {
          return JSON.parse(e);
        }, auto: function (n) {
          return e.serializeJSON.parseValue(n, null, null, { parseNumbers: !0, parseBooleans: !0, parseNulls: !0 });
        }, skip: null }, useIntKeysAsArrayIndex: !1 }, setupOpts: function (n) {
      var r, t, a, i, s, u;u = e.serializeJSON, null == n && (n = {}), a = u.defaultOptions || {}, t = ["checkboxUncheckedValue", "parseNumbers", "parseBooleans", "parseNulls", "parseAll", "parseWithFunction", "customTypes", "defaultTypes", "useIntKeysAsArrayIndex"];for (r in n) if (-1 === t.indexOf(r)) throw new Error("serializeJSON ERROR: invalid option '" + r + "'. Please use one of " + t.join(", "));return i = function (e) {
        return n[e] !== !1 && "" !== n[e] && (n[e] || a[e]);
      }, s = i("parseAll"), { checkboxUncheckedValue: i("checkboxUncheckedValue"), parseNumbers: s || i("parseNumbers"), parseBooleans: s || i("parseBooleans"), parseNulls: s || i("parseNulls"), parseWithFunction: i("parseWithFunction"), typeFunctions: e.extend({}, i("defaultTypes"), i("customTypes")), useIntKeysAsArrayIndex: i("useIntKeysAsArrayIndex") };
    }, parseValue: function (n, r, t, a) {
      var i, s;return i = e.serializeJSON, s = n, a.typeFunctions && t && a.typeFunctions[t] ? s = a.typeFunctions[t](n) : a.parseNumbers && i.isNumeric(n) ? s = Number(n) : !a.parseBooleans || "true" !== n && "false" !== n ? a.parseNulls && "null" == n && (s = null) : s = "true" === n, a.parseWithFunction && !t && (s = a.parseWithFunction(s, r)), s;
    }, isObject: function (e) {
      return e === Object(e);
    }, isUndefined: function (e) {
      return void 0 === e;
    }, isValidArrayIndex: function (e) {
      return (/^[0-9]+$/.test(String(e))
      );
    }, isNumeric: function (e) {
      return e - parseFloat(e) >= 0;
    }, optionKeys: function (e) {
      if (Object.keys) return Object.keys(e);var n,
          r = [];for (n in e) r.push(n);return r;
    }, readCheckboxUncheckedValues: function (n, r, t) {
      var a, i, s, u, o;null == r && (r = {}), o = e.serializeJSON, a = "input[type=checkbox][name]:not(:checked):not([disabled])", i = t.find(a).add(t.filter(a)), i.each(function (t, a) {
        s = e(a), u = s.attr("data-unchecked-value"), u ? n.push({ name: a.name, value: u }) : o.isUndefined(r.checkboxUncheckedValue) || n.push({ name: a.name, value: r.checkboxUncheckedValue });
      });
    }, extractTypeAndNameWithNoType: function (e) {
      var n;return (n = e.match(/(.*):([^:]+)$/)) ? { nameWithNoType: n[1], type: n[2] } : { nameWithNoType: e, type: null };
    }, tryToFindTypeFromDataAttr: function (e, n) {
      var r, t, a, i;return r = e.replace(/(:|\.|\[|\]|\s)/g, "\\$1"), t = '[name="' + r + '"]', a = n.find(t).add(n.filter(t)), i = a.attr("data-value-type"), i || null;
    }, validateType: function (n, r, t) {
      var a, i;if (i = e.serializeJSON, a = i.optionKeys(t ? t.typeFunctions : i.defaultOptions.defaultTypes), r && -1 === a.indexOf(r)) throw new Error("serializeJSON ERROR: Invalid type " + r + " found in input name '" + n + "', please use one of " + a.join(", "));return !0;
    }, splitInputNameIntoKeysArray: function (n) {
      var r, t;return t = e.serializeJSON, r = n.split("["), r = e.map(r, function (e) {
        return e.replace(/\]/g, "");
      }), "" === r[0] && r.shift(), r;
    }, deepSet: function (n, r, t, a) {
      var i, s, u, o, l, p;if (null == a && (a = {}), p = e.serializeJSON, p.isUndefined(n)) throw new Error("ArgumentError: param 'o' expected to be an object or array, found undefined");if (!r || 0 === r.length) throw new Error("ArgumentError: param 'keys' expected to be an array with least one element");i = r[0], 1 === r.length ? "" === i ? n.push(t) : n[i] = t : (s = r[1], "" === i && (o = n.length - 1, l = n[o], i = p.isObject(l) && (p.isUndefined(l[s]) || r.length > 2) ? o : o + 1), "" === s ? (p.isUndefined(n[i]) || !e.isArray(n[i])) && (n[i] = []) : a.useIntKeysAsArrayIndex && p.isValidArrayIndex(s) ? (p.isUndefined(n[i]) || !e.isArray(n[i])) && (n[i] = []) : (p.isUndefined(n[i]) || !p.isObject(n[i])) && (n[i] = {}), u = r.slice(1), p.deepSet(n[i], u, t, a));
    } };
});
var grid = null;

$(document).ready(function () {
    "use strict";

    if ($("#vendorprofile").length != 0) {
        $("#vendorprofile #profile_details #profile_tabs > div").hide();
        $("#vendorprofile #profile_details #profile_tabs > div#tab_about").show();

        $("#vendorprofile #profile_details #profile_tabs > ul > li > a, #profile_details #profile_tabs > a").click(function () {
            var tab = $(this).data("tab");
            console.log("Clicked on a tab");
            $("#profile_details #profile_tabs > div").hide();
            $("#profile_details #profile_tabs > div#" + tab).show();
        });

        $("#vendorprofile #profile_header_info .profile_contact_info a.vendorlink").click(function () {
            console.log("Show contact form modal");
            var btpmstoken = Cookies.get('btpmstoken');
            if (btpmstoken === undefined) {
                btpmstoken = "";
            }
            $.ajax({
                url: '/api/v1/modals/vendormessageform/' + $("#vendorprofile input[name=vid]").val(),
                method: 'POST',
                data: JSON.stringify({ btpmstoken: btpmstoken }),
                contentType: "application/json",
                success: function (data) {

                    showModalDialog(data.ui, "Contact Vendor");
                    var registrationform = $("#modaldialog .vendorcontact.form").parsley();
                    $("#modaldialog .vendorcontact.form select[name=eventtype]").change(function () {
                        if ($(this).val() == "Other") {
                            $("#modaldialog .vendorcontact.form input[name=othereventtype]").parents(".columns").show();
                        } else {
                            $("#modaldialog .vendorcontact.form input[name=othereventtype]").parents(".columns").hide();
                        }
                    });
                    $("#modaldialog .vendorcontact.form #btn_cancel").click(function () {
                        removeModalDialog();
                        return false;
                    });
                    $("#modaldialog .vendorcontact.form").submit(function () {
                        var form = $("#modaldialog .vendorcontact.form").serializeJSON();
                        $.ajax({
                            url: '/api/v1/vendors/sendvendormessage/' + $("#vendorprofile input[name=vid]").val(),
                            method: 'POST',
                            contentType: "application/json",
                            data: JSON.stringify(form),
                            success: function (result) {
                                console.log(result);
                                if (result.status == "OK") {
                                    removeModalDialog();
                                    alert("Your message has been sent to this vendor.");
                                } else {
                                    removeModalDialog();
                                    alert("Error: " + result.message);
                                }
                            },
                            error: function (err) {
                                console.error(err);
                            }
                        });
                        return false;
                    });
                }
            });
        });
    }

    initGalleryGrid();

    if ($("#gallerysearch").length != 0) {
        $("#gallerykeywords").selectize({
            delimited: ',',
            persist: false,
            create: function (input) {
                return {
                    value: input,
                    text: input
                };
            }
        });

        $("#gallerykeywords").on('change', function (e) {
            getFilteredMedia();
        });

        $("#gallerycats, #gallerytheme").selectize({
            sortField: 'value'
        });

        $("#gallerycolor").selectize({
            options: colorsjson,
            valueField: "id",
            labelField: 'name',
            render: {
                option: function (item, escape) {
                    return '<div><span style="vertical-align:middle;margin-right:10px;display:inline-block;width: 25px;height:25px;background-color:' + escape(item.color) + ';"></span><span class="title">' + escape(item.name) + '</span></div>';
                }
            }
        });
    }

    $("#gallerycats, #gallerycolor, #gallerytheme").on('change', function (e) {
        getFilteredMedia();
    });

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

function getFilteredMedia(category, keywords) {
    var category = $("#gallerycats").val();
    var keywords = $("#gallerykeywords").val();
    var theme = $("#gallerytheme").val();;
    var color = $("#gallerycolor").val();;;

    $('#gallerygrid .grid').css({ opacity: 0 });
    $.ajax({
        url: "/api/v1/media/public/filter",
        method: "POST",
        data: {
            category: category,
            keyword: keywords,
            theme: theme,
            color: color
        },
        success: function (response) {

            var fullhtml = "";
            response.media.forEach(function (media, index) {
                var html = '<div class="item" data-id="' + media.id + '"><div class="item-content">';
                html += '<div class="image"><img src="/storage' + media.thumbnailpath + '" /></div>';
                html += '<div class="tags">';
                var mediakeywords = media.keyword.split(",");
                mediakeywords.forEach(function (keyword) {
                    html += '<span><a>' + keyword + '</a></span>';
                });
                html += '</div>';
                html += "</div></div>";

                fullhtml += html;
            });
            $("#gallerygrid .grid").empty();
            grid.isotope('destroy');

            $("#gallerygrid .grid").append(fullhtml);
            initGalleryGrid();
        }
    });
}

function initGalleryGrid() {
    $("#gallerygrid .item").on("click", function () {
        var mediaid = $(this).data('id');
        console.log(mediaid);
        $("#imagedisplay").fadeIn(300, function () {
            $.get("/api/v1/media/public/" + mediaid, function (res) {
                console.log(res);
                $("#imagedisplay .imagecontainer .image img").attr('src', "/storage" + res.media.urlpath);
                $("#imagedisplay .imagecontainer .tags").empty();

                var keywords = res.media.keyword.split(",");
                keywords.forEach(function (val, index) {
                    console.log(val);
                    $("#imagedisplay .imagecontainer .tags").append("<span><a>" + val + "</a></span>");
                });
                $("#imagedisplay .imagecontainer").fadeIn(400);
            });
        });
    });

    $("#imagedisplay_close").on("click", function () {
        $("#imagedisplay").fadeOut(300, function () {
            $("#imagedisplay .imagecontainer").hide();
        });
    });

    $('#gallerygrid .grid').css({ opacity: 0 });

    grid = $('#gallerygrid .grid').imagesLoaded(function () {
        grid.isotope({
            // options
            itemSelector: '.item',
            masonry: {
                columnWidth: 275
            }
        });

        $('#gallerygrid .grid').css({ opacity: 1 });
    });
}

function showModalDialog(html, title) {
    var modalhtml = "<div id='modaldialogcontainer' class='dialog'><div id='modaldialog' class='dialog'><header><h1>" + title + "</h1></header>" + html + "</div></div>";
    $("#wrapper").append(modalhtml);
    $("body").addClass("noscroll");
    $("#modaldialogcontainer #modaldialog > nav a").click(function () {
        var tab = $(this).data("tab");
        $("#modaldialogcontainer #modaldialog > nav li").removeClass('active');
        $(this).parent().addClass('active');
        $("#modaldialogcontainer #modaldialog div.dialogcontent").hide();
        $("#modaldialogcontainer #modaldialog div.dialogcontent").removeClass('active');
        $("#modaldialogcontainer #modaldialog div.dialogcontent[data-tab='" + tab + "']").show();
        $("#modaldialogcontainer #modaldialog div.dialogcontent[data-tab='" + tab + "']").addClass('active');
    });
}

function removeModalDialog() {
    $("body").removeClass("noscroll");
    $("#modaldialogcontainer").remove();
}