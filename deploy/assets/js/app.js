(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("initialize.js", function(exports, require, module) {
'use strict';

document.addEventListener('DOMContentLoaded', function () {

  console.log('Initialized app');
});

var $ = require('jquery');
console.log('Tasty Brunch, just trying to use jQuery!', $('body'));
});

require.register("js/jquery.iframetracker.js", function(exports, require, module) {
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * jQuery iframe click tracking plugin
 *
 * @author Vincent Paré (www.finalclap.com)
 * @copyright © 2013-2015 Vincent Paré
 * @license http://opensource.org/licenses/Apache-2.0
 * @version 1.1.0
 */
(function ($) {
	// Tracking handler manager
	$.fn.iframeTracker = function (handler) {
		var target = this.get();
		if (handler === null || handler === false) {
			$.iframeTracker.untrack(target);
		} else if ((typeof handler === "undefined" ? "undefined" : _typeof(handler)) == "object") {
			$.iframeTracker.track(target, handler);
		} else {
			throw new Error("Wrong handler type (must be an object, or null|false to untrack)");
		}
	};

	// Iframe tracker common object
	$.iframeTracker = {
		// State
		focusRetriever: null, // Element used for restoring focus on window (element)
		focusRetrieved: false, // Says if the focus was retrived on the current page (bool)
		handlersList: [], // Store a list of every trakers (created by calling $(selector).iframeTracker...)
		isIE8AndOlder: false, // true for Internet Explorer 8 and older

		// Init (called once on document ready)
		init: function init() {
			// Determine browser version (IE8-) ($.browser.msie is deprecated since jQuery 1.9)
			try {
				if ($.browser.msie == true && $.browser.version < 9) {
					this.isIE8AndOlder = true;
				}
			} catch (ex) {
				try {
					var matches = navigator.userAgent.match(/(msie) ([\w.]+)/i);
					if (matches[2] < 9) {
						this.isIE8AndOlder = true;
					}
				} catch (ex2) {}
			}

			// Listening window blur
			$(window).focus();
			$(window).blur(function (e) {
				$.iframeTracker.windowLoseFocus(e);
			});

			// Focus retriever (get the focus back to the page, on mouse move)
			$('body').append('<div style="position:fixed; top:0; left:0; overflow:hidden;"><input style="position:absolute; left:-300px;" type="text" value="" id="focus_retriever" readonly="true" /></div>');
			this.focusRetriever = $('#focus_retriever');
			this.focusRetrieved = false;
			$(document).mousemove(function (e) {
				if (document.activeElement && document.activeElement.tagName == 'IFRAME') {
					$.iframeTracker.focusRetriever.focus();
					$.iframeTracker.focusRetrieved = true;
				}
			});

			// Special processing to make it work with my old friend IE8 (and older) ;)
			if (this.isIE8AndOlder) {
				// Blur doesn't works correctly on IE8-, so we need to trigger it manually
				this.focusRetriever.blur(function (e) {
					e.stopPropagation();
					e.preventDefault();
					$.iframeTracker.windowLoseFocus(e);
				});

				// Keep focus on window (fix bug IE8-, focusable elements)
				$('body').click(function (e) {
					$(window).focus();
				});
				$('form').click(function (e) {
					e.stopPropagation();
				});

				// Same thing for "post-DOMready" created forms (issue #6)
				try {
					$('body').on('click', 'form', function (e) {
						e.stopPropagation();
					});
				} catch (ex) {
					console.log("[iframeTracker] Please update jQuery to 1.7 or newer. (exception: " + ex.message + ")");
				}
			}
		},

		// Add tracker to target using handler (bind boundary listener + register handler)
		// target: Array of target elements (native DOM elements)
		// handler: User handler object
		track: function track(target, handler) {
			// Adding target elements references into handler
			handler.target = target;

			// Storing the new handler into handler list
			$.iframeTracker.handlersList.push(handler);

			// Binding boundary listener
			$(target).bind('mouseover', { handler: handler }, $.iframeTracker.mouseoverListener).bind('mouseout', { handler: handler }, $.iframeTracker.mouseoutListener);
		},

		// Remove tracking on target elements
		// target: Array of target elements (native DOM elements)
		untrack: function untrack(target) {
			if (typeof Array.prototype.filter != "function") {
				console.log("Your browser doesn't support Array filter, untrack disabled");
				return;
			}

			// Unbinding boundary listener
			$(target).each(function (index) {
				$(this).unbind('mouseover', $.iframeTracker.mouseoverListener).unbind('mouseout', $.iframeTracker.mouseoutListener);
			});

			// Handler garbage collector
			var nullFilter = function nullFilter(value) {
				return value === null ? false : true;
			};
			for (var i in this.handlersList) {
				// Prune target
				for (var j in this.handlersList[i].target) {
					if ($.inArray(this.handlersList[i].target[j], target) !== -1) {
						this.handlersList[i].target[j] = null;
					}
				}
				this.handlersList[i].target = this.handlersList[i].target.filter(nullFilter);

				// Delete handler if unused
				if (this.handlersList[i].target.length == 0) {
					this.handlersList[i] = null;
				}
			}
			this.handlersList = this.handlersList.filter(nullFilter);
		},

		// Target mouseover event listener
		mouseoverListener: function mouseoverListener(e) {
			e.data.handler.over = true;
			try {
				e.data.handler.overCallback(this);
			} catch (ex) {}
		},

		// Target mouseout event listener
		mouseoutListener: function mouseoutListener(e) {
			e.data.handler.over = false;
			$.iframeTracker.focusRetriever.focus();
			try {
				e.data.handler.outCallback(this);
			} catch (ex) {}
		},

		// Calls blurCallback for every handler with over=true on window blur
		windowLoseFocus: function windowLoseFocus(event) {
			for (var i in this.handlersList) {
				if (this.handlersList[i].over == true) {
					try {
						this.handlersList[i].blurCallback();
					} catch (ex) {}
				}
			}
		}
	};

	// Init the iframeTracker on document ready
	$(document).ready(function () {
		$.iframeTracker.init();
	});
})(jQuery);
});

require.register("js/libs/bootstrap.min.js", function(exports, require, module) {
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * bootstrap.js v3.0.0 by @fat and @mdo
 * Copyright 2013 Twitter Inc.
 * http://www.apache.org/licenses/LICENSE-2.0
 */
if (!jQuery) throw new Error("Bootstrap requires jQuery");+function (a) {
  "use strict";
  function b() {
    var a = document.createElement("bootstrap"),
        b = { WebkitTransition: "webkitTransitionEnd", MozTransition: "transitionend", OTransition: "oTransitionEnd otransitionend", transition: "transitionend" };for (var c in b) {
      if (void 0 !== a.style[c]) return { end: b[c] };
    }
  }a.fn.emulateTransitionEnd = function (b) {
    var c = !1,
        d = this;a(this).one(a.support.transition.end, function () {
      c = !0;
    });var e = function e() {
      c || a(d).trigger(a.support.transition.end);
    };return setTimeout(e, b), this;
  }, a(function () {
    a.support.transition = b();
  });
}(window.jQuery), +function (a) {
  "use strict";
  var b = '[data-dismiss="alert"]',
      c = function c(_c) {
    a(_c).on("click", b, this.close);
  };c.prototype.close = function (b) {
    function c() {
      f.trigger("closed.bs.alert").remove();
    }var d = a(this),
        e = d.attr("data-target");e || (e = d.attr("href"), e = e && e.replace(/.*(?=#[^\s]*$)/, ""));var f = a(e);b && b.preventDefault(), f.length || (f = d.hasClass("alert") ? d : d.parent()), f.trigger(b = a.Event("close.bs.alert")), b.isDefaultPrevented() || (f.removeClass("in"), a.support.transition && f.hasClass("fade") ? f.one(a.support.transition.end, c).emulateTransitionEnd(150) : c());
  };var d = a.fn.alert;a.fn.alert = function (b) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.alert");e || d.data("bs.alert", e = new c(this)), "string" == typeof b && e[b].call(d);
    });
  }, a.fn.alert.Constructor = c, a.fn.alert.noConflict = function () {
    return a.fn.alert = d, this;
  }, a(document).on("click.bs.alert.data-api", b, c.prototype.close);
}(window.jQuery), +function (a) {
  "use strict";
  var b = function b(c, d) {
    this.$element = a(c), this.options = a.extend({}, b.DEFAULTS, d);
  };b.DEFAULTS = { loadingText: "loading..." }, b.prototype.setState = function (a) {
    var b = "disabled",
        c = this.$element,
        d = c.is("input") ? "val" : "html",
        e = c.data();a += "Text", e.resetText || c.data("resetText", c[d]()), c[d](e[a] || this.options[a]), setTimeout(function () {
      "loadingText" == a ? c.addClass(b).attr(b, b) : c.removeClass(b).removeAttr(b);
    }, 0);
  }, b.prototype.toggle = function () {
    var a = this.$element.closest('[data-toggle="buttons"]');if (a.length) {
      var b = this.$element.find("input").prop("checked", !this.$element.hasClass("active")).trigger("change");"radio" === b.prop("type") && a.find(".active").removeClass("active");
    }this.$element.toggleClass("active");
  };var c = a.fn.button;a.fn.button = function (c) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.button"),
          f = "object" == (typeof c === "undefined" ? "undefined" : _typeof(c)) && c;e || d.data("bs.button", e = new b(this, f)), "toggle" == c ? e.toggle() : c && e.setState(c);
    });
  }, a.fn.button.Constructor = b, a.fn.button.noConflict = function () {
    return a.fn.button = c, this;
  }, a(document).on("click.bs.button.data-api", "[data-toggle^=button]", function (b) {
    var c = a(b.target);c.hasClass("btn") || (c = c.closest(".btn")), c.button("toggle"), b.preventDefault();
  });
}(window.jQuery), +function (a) {
  "use strict";
  var b = function b(_b, c) {
    this.$element = a(_b), this.$indicators = this.$element.find(".carousel-indicators"), this.options = c, this.paused = this.sliding = this.interval = this.$active = this.$items = null, "hover" == this.options.pause && this.$element.on("mouseenter", a.proxy(this.pause, this)).on("mouseleave", a.proxy(this.cycle, this));
  };b.DEFAULTS = { interval: 5e3, pause: "hover", wrap: !0 }, b.prototype.cycle = function (b) {
    return b || (this.paused = !1), this.interval && clearInterval(this.interval), this.options.interval && !this.paused && (this.interval = setInterval(a.proxy(this.next, this), this.options.interval)), this;
  }, b.prototype.getActiveIndex = function () {
    return this.$active = this.$element.find(".item.active"), this.$items = this.$active.parent().children(), this.$items.index(this.$active);
  }, b.prototype.to = function (b) {
    var c = this,
        d = this.getActiveIndex();return b > this.$items.length - 1 || 0 > b ? void 0 : this.sliding ? this.$element.one("slid", function () {
      c.to(b);
    }) : d == b ? this.pause().cycle() : this.slide(b > d ? "next" : "prev", a(this.$items[b]));
  }, b.prototype.pause = function (b) {
    return b || (this.paused = !0), this.$element.find(".next, .prev").length && a.support.transition.end && (this.$element.trigger(a.support.transition.end), this.cycle(!0)), this.interval = clearInterval(this.interval), this;
  }, b.prototype.next = function () {
    return this.sliding ? void 0 : this.slide("next");
  }, b.prototype.prev = function () {
    return this.sliding ? void 0 : this.slide("prev");
  }, b.prototype.slide = function (b, c) {
    var d = this.$element.find(".item.active"),
        e = c || d[b](),
        f = this.interval,
        g = "next" == b ? "left" : "right",
        h = "next" == b ? "first" : "last",
        i = this;if (!e.length) {
      if (!this.options.wrap) return;e = this.$element.find(".item")[h]();
    }this.sliding = !0, f && this.pause();var j = a.Event("slide.bs.carousel", { relatedTarget: e[0], direction: g });if (!e.hasClass("active")) {
      if (this.$indicators.length && (this.$indicators.find(".active").removeClass("active"), this.$element.one("slid", function () {
        var b = a(i.$indicators.children()[i.getActiveIndex()]);b && b.addClass("active");
      })), a.support.transition && this.$element.hasClass("slide")) {
        if (this.$element.trigger(j), j.isDefaultPrevented()) return;e.addClass(b), e[0].offsetWidth, d.addClass(g), e.addClass(g), d.one(a.support.transition.end, function () {
          e.removeClass([b, g].join(" ")).addClass("active"), d.removeClass(["active", g].join(" ")), i.sliding = !1, setTimeout(function () {
            i.$element.trigger("slid");
          }, 0);
        }).emulateTransitionEnd(600);
      } else {
        if (this.$element.trigger(j), j.isDefaultPrevented()) return;d.removeClass("active"), e.addClass("active"), this.sliding = !1, this.$element.trigger("slid");
      }return f && this.cycle(), this;
    }
  };var c = a.fn.carousel;a.fn.carousel = function (c) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.carousel"),
          f = a.extend({}, b.DEFAULTS, d.data(), "object" == (typeof c === "undefined" ? "undefined" : _typeof(c)) && c),
          g = "string" == typeof c ? c : f.slide;e || d.data("bs.carousel", e = new b(this, f)), "number" == typeof c ? e.to(c) : g ? e[g]() : f.interval && e.pause().cycle();
    });
  }, a.fn.carousel.Constructor = b, a.fn.carousel.noConflict = function () {
    return a.fn.carousel = c, this;
  }, a(document).on("click.bs.carousel.data-api", "[data-slide], [data-slide-to]", function (b) {
    var c,
        d = a(this),
        e = a(d.attr("data-target") || (c = d.attr("href")) && c.replace(/.*(?=#[^\s]+$)/, "")),
        f = a.extend({}, e.data(), d.data()),
        g = d.attr("data-slide-to");g && (f.interval = !1), e.carousel(f), (g = d.attr("data-slide-to")) && e.data("bs.carousel").to(g), b.preventDefault();
  }), a(window).on("load", function () {
    a('[data-ride="carousel"]').each(function () {
      var b = a(this);b.carousel(b.data());
    });
  });
}(window.jQuery), +function (a) {
  "use strict";
  var b = function b(c, d) {
    this.$element = a(c), this.options = a.extend({}, b.DEFAULTS, d), this.transitioning = null, this.options.parent && (this.$parent = a(this.options.parent)), this.options.toggle && this.toggle();
  };b.DEFAULTS = { toggle: !0 }, b.prototype.dimension = function () {
    var a = this.$element.hasClass("width");return a ? "width" : "height";
  }, b.prototype.show = function () {
    if (!this.transitioning && !this.$element.hasClass("in")) {
      var b = a.Event("show.bs.collapse");if (this.$element.trigger(b), !b.isDefaultPrevented()) {
        var c = this.$parent && this.$parent.find("> .panel > .in");if (c && c.length) {
          var d = c.data("bs.collapse");if (d && d.transitioning) return;c.collapse("hide"), d || c.data("bs.collapse", null);
        }var e = this.dimension();this.$element.removeClass("collapse").addClass("collapsing")[e](0), this.transitioning = 1;var f = function f() {
          this.$element.removeClass("collapsing").addClass("in")[e]("auto"), this.transitioning = 0, this.$element.trigger("shown.bs.collapse");
        };if (!a.support.transition) return f.call(this);var g = a.camelCase(["scroll", e].join("-"));this.$element.one(a.support.transition.end, a.proxy(f, this)).emulateTransitionEnd(350)[e](this.$element[0][g]);
      }
    }
  }, b.prototype.hide = function () {
    if (!this.transitioning && this.$element.hasClass("in")) {
      var b = a.Event("hide.bs.collapse");if (this.$element.trigger(b), !b.isDefaultPrevented()) {
        var c = this.dimension();this.$element[c](this.$element[c]())[0].offsetHeight, this.$element.addClass("collapsing").removeClass("collapse").removeClass("in"), this.transitioning = 1;var d = function d() {
          this.transitioning = 0, this.$element.trigger("hidden.bs.collapse").removeClass("collapsing").addClass("collapse");
        };return a.support.transition ? (this.$element[c](0).one(a.support.transition.end, a.proxy(d, this)).emulateTransitionEnd(350), void 0) : d.call(this);
      }
    }
  }, b.prototype.toggle = function () {
    this[this.$element.hasClass("in") ? "hide" : "show"]();
  };var c = a.fn.collapse;a.fn.collapse = function (c) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.collapse"),
          f = a.extend({}, b.DEFAULTS, d.data(), "object" == (typeof c === "undefined" ? "undefined" : _typeof(c)) && c);e || d.data("bs.collapse", e = new b(this, f)), "string" == typeof c && e[c]();
    });
  }, a.fn.collapse.Constructor = b, a.fn.collapse.noConflict = function () {
    return a.fn.collapse = c, this;
  }, a(document).on("click.bs.collapse.data-api", "[data-toggle=collapse]", function (b) {
    var c,
        d = a(this),
        e = d.attr("data-target") || b.preventDefault() || (c = d.attr("href")) && c.replace(/.*(?=#[^\s]+$)/, ""),
        f = a(e),
        g = f.data("bs.collapse"),
        h = g ? "toggle" : d.data(),
        i = d.attr("data-parent"),
        j = i && a(i);g && g.transitioning || (j && j.find('[data-toggle=collapse][data-parent="' + i + '"]').not(d).addClass("collapsed"), d[f.hasClass("in") ? "addClass" : "removeClass"]("collapsed")), f.collapse(h);
  });
}(window.jQuery), +function (a) {
  "use strict";
  function b() {
    a(d).remove(), a(e).each(function (b) {
      var d = c(a(this));d.hasClass("open") && (d.trigger(b = a.Event("hide.bs.dropdown")), b.isDefaultPrevented() || d.removeClass("open").trigger("hidden.bs.dropdown"));
    });
  }function c(b) {
    var c = b.attr("data-target");c || (c = b.attr("href"), c = c && /#/.test(c) && c.replace(/.*(?=#[^\s]*$)/, ""));var d = c && a(c);return d && d.length ? d : b.parent();
  }var d = ".dropdown-backdrop",
      e = "[data-toggle=dropdown]",
      f = function f(b) {
    a(b).on("click.bs.dropdown", this.toggle);
  };f.prototype.toggle = function (d) {
    var e = a(this);if (!e.is(".disabled, :disabled")) {
      var f = c(e),
          g = f.hasClass("open");if (b(), !g) {
        if ("ontouchstart" in document.documentElement && !f.closest(".navbar-nav").length && a('<div class="dropdown-backdrop"/>').insertAfter(a(this)).on("click", b), f.trigger(d = a.Event("show.bs.dropdown")), d.isDefaultPrevented()) return;f.toggleClass("open").trigger("shown.bs.dropdown"), e.focus();
      }return !1;
    }
  }, f.prototype.keydown = function (b) {
    if (/(38|40|27)/.test(b.keyCode)) {
      var d = a(this);if (b.preventDefault(), b.stopPropagation(), !d.is(".disabled, :disabled")) {
        var f = c(d),
            g = f.hasClass("open");if (!g || g && 27 == b.keyCode) return 27 == b.which && f.find(e).focus(), d.click();var h = a("[role=menu] li:not(.divider):visible a", f);if (h.length) {
          var i = h.index(h.filter(":focus"));38 == b.keyCode && i > 0 && i--, 40 == b.keyCode && i < h.length - 1 && i++, ~i || (i = 0), h.eq(i).focus();
        }
      }
    }
  };var g = a.fn.dropdown;a.fn.dropdown = function (b) {
    return this.each(function () {
      var c = a(this),
          d = c.data("dropdown");d || c.data("dropdown", d = new f(this)), "string" == typeof b && d[b].call(c);
    });
  }, a.fn.dropdown.Constructor = f, a.fn.dropdown.noConflict = function () {
    return a.fn.dropdown = g, this;
  }, a(document).on("click.bs.dropdown.data-api", b).on("click.bs.dropdown.data-api", ".dropdown form", function (a) {
    a.stopPropagation();
  }).on("click.bs.dropdown.data-api", e, f.prototype.toggle).on("keydown.bs.dropdown.data-api", e + ", [role=menu]", f.prototype.keydown);
}(window.jQuery), +function (a) {
  "use strict";
  var b = function b(_b2, c) {
    this.options = c, this.$element = a(_b2), this.$backdrop = this.isShown = null, this.options.remote && this.$element.load(this.options.remote);
  };b.DEFAULTS = { backdrop: !0, keyboard: !0, show: !0 }, b.prototype.toggle = function (a) {
    return this[this.isShown ? "hide" : "show"](a);
  }, b.prototype.show = function (b) {
    var c = this,
        d = a.Event("show.bs.modal", { relatedTarget: b });this.$element.trigger(d), this.isShown || d.isDefaultPrevented() || (this.isShown = !0, this.escape(), this.$element.on("click.dismiss.modal", '[data-dismiss="modal"]', a.proxy(this.hide, this)), this.backdrop(function () {
      var d = a.support.transition && c.$element.hasClass("fade");c.$element.parent().length || c.$element.appendTo(document.body), c.$element.show(), d && c.$element[0].offsetWidth, c.$element.addClass("in").attr("aria-hidden", !1), c.enforceFocus();var e = a.Event("shown.bs.modal", { relatedTarget: b });d ? c.$element.find(".modal-dialog").one(a.support.transition.end, function () {
        c.$element.focus().trigger(e);
      }).emulateTransitionEnd(300) : c.$element.focus().trigger(e);
    }));
  }, b.prototype.hide = function (b) {
    b && b.preventDefault(), b = a.Event("hide.bs.modal"), this.$element.trigger(b), this.isShown && !b.isDefaultPrevented() && (this.isShown = !1, this.escape(), a(document).off("focusin.bs.modal"), this.$element.removeClass("in").attr("aria-hidden", !0).off("click.dismiss.modal"), a.support.transition && this.$element.hasClass("fade") ? this.$element.one(a.support.transition.end, a.proxy(this.hideModal, this)).emulateTransitionEnd(300) : this.hideModal());
  }, b.prototype.enforceFocus = function () {
    a(document).off("focusin.bs.modal").on("focusin.bs.modal", a.proxy(function (a) {
      this.$element[0] === a.target || this.$element.has(a.target).length || this.$element.focus();
    }, this));
  }, b.prototype.escape = function () {
    this.isShown && this.options.keyboard ? this.$element.on("keyup.dismiss.bs.modal", a.proxy(function (a) {
      27 == a.which && this.hide();
    }, this)) : this.isShown || this.$element.off("keyup.dismiss.bs.modal");
  }, b.prototype.hideModal = function () {
    var a = this;this.$element.hide(), this.backdrop(function () {
      a.removeBackdrop(), a.$element.trigger("hidden.bs.modal");
    });
  }, b.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove(), this.$backdrop = null;
  }, b.prototype.backdrop = function (b) {
    var c = this.$element.hasClass("fade") ? "fade" : "";if (this.isShown && this.options.backdrop) {
      var d = a.support.transition && c;if (this.$backdrop = a('<div class="modal-backdrop ' + c + '" />').appendTo(document.body), this.$element.on("click.dismiss.modal", a.proxy(function (a) {
        a.target === a.currentTarget && ("static" == this.options.backdrop ? this.$element[0].focus.call(this.$element[0]) : this.hide.call(this));
      }, this)), d && this.$backdrop[0].offsetWidth, this.$backdrop.addClass("in"), !b) return;d ? this.$backdrop.one(a.support.transition.end, b).emulateTransitionEnd(150) : b();
    } else !this.isShown && this.$backdrop ? (this.$backdrop.removeClass("in"), a.support.transition && this.$element.hasClass("fade") ? this.$backdrop.one(a.support.transition.end, b).emulateTransitionEnd(150) : b()) : b && b();
  };var c = a.fn.modal;a.fn.modal = function (c, d) {
    return this.each(function () {
      var e = a(this),
          f = e.data("bs.modal"),
          g = a.extend({}, b.DEFAULTS, e.data(), "object" == (typeof c === "undefined" ? "undefined" : _typeof(c)) && c);f || e.data("bs.modal", f = new b(this, g)), "string" == typeof c ? f[c](d) : g.show && f.show(d);
    });
  }, a.fn.modal.Constructor = b, a.fn.modal.noConflict = function () {
    return a.fn.modal = c, this;
  }, a(document).on("click.bs.modal.data-api", '[data-toggle="modal"]', function (b) {
    var c = a(this),
        d = c.attr("href"),
        e = a(c.attr("data-target") || d && d.replace(/.*(?=#[^\s]+$)/, "")),
        f = e.data("modal") ? "toggle" : a.extend({ remote: !/#/.test(d) && d }, e.data(), c.data());b.preventDefault(), e.modal(f, this).one("hide", function () {
      c.is(":visible") && c.focus();
    });
  }), a(document).on("show.bs.modal", ".modal", function () {
    a(document.body).addClass("modal-open");
  }).on("hidden.bs.modal", ".modal", function () {
    a(document.body).removeClass("modal-open");
  });
}(window.jQuery), +function (a) {
  "use strict";
  var b = function b(a, _b3) {
    this.type = this.options = this.enabled = this.timeout = this.hoverState = this.$element = null, this.init("tooltip", a, _b3);
  };b.DEFAULTS = { animation: !0, placement: "top", selector: !1, template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>', trigger: "hover focus", title: "", delay: 0, html: !1, container: !1 }, b.prototype.init = function (b, c, d) {
    this.enabled = !0, this.type = b, this.$element = a(c), this.options = this.getOptions(d);for (var e = this.options.trigger.split(" "), f = e.length; f--;) {
      var g = e[f];if ("click" == g) this.$element.on("click." + this.type, this.options.selector, a.proxy(this.toggle, this));else if ("manual" != g) {
        var h = "hover" == g ? "mouseenter" : "focus",
            i = "hover" == g ? "mouseleave" : "blur";this.$element.on(h + "." + this.type, this.options.selector, a.proxy(this.enter, this)), this.$element.on(i + "." + this.type, this.options.selector, a.proxy(this.leave, this));
      }
    }this.options.selector ? this._options = a.extend({}, this.options, { trigger: "manual", selector: "" }) : this.fixTitle();
  }, b.prototype.getDefaults = function () {
    return b.DEFAULTS;
  }, b.prototype.getOptions = function (b) {
    return b = a.extend({}, this.getDefaults(), this.$element.data(), b), b.delay && "number" == typeof b.delay && (b.delay = { show: b.delay, hide: b.delay }), b;
  }, b.prototype.getDelegateOptions = function () {
    var b = {},
        c = this.getDefaults();return this._options && a.each(this._options, function (a, d) {
      c[a] != d && (b[a] = d);
    }), b;
  }, b.prototype.enter = function (b) {
    var c = b instanceof this.constructor ? b : a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs." + this.type);return clearTimeout(c.timeout), c.hoverState = "in", c.options.delay && c.options.delay.show ? (c.timeout = setTimeout(function () {
      "in" == c.hoverState && c.show();
    }, c.options.delay.show), void 0) : c.show();
  }, b.prototype.leave = function (b) {
    var c = b instanceof this.constructor ? b : a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs." + this.type);return clearTimeout(c.timeout), c.hoverState = "out", c.options.delay && c.options.delay.hide ? (c.timeout = setTimeout(function () {
      "out" == c.hoverState && c.hide();
    }, c.options.delay.hide), void 0) : c.hide();
  }, b.prototype.show = function () {
    var b = a.Event("show.bs." + this.type);if (this.hasContent() && this.enabled) {
      if (this.$element.trigger(b), b.isDefaultPrevented()) return;var c = this.tip();this.setContent(), this.options.animation && c.addClass("fade");var d = "function" == typeof this.options.placement ? this.options.placement.call(this, c[0], this.$element[0]) : this.options.placement,
          e = /\s?auto?\s?/i,
          f = e.test(d);f && (d = d.replace(e, "") || "top"), c.detach().css({ top: 0, left: 0, display: "block" }).addClass(d), this.options.container ? c.appendTo(this.options.container) : c.insertAfter(this.$element);var g = this.getPosition(),
          h = c[0].offsetWidth,
          i = c[0].offsetHeight;if (f) {
        var j = this.$element.parent(),
            k = d,
            l = document.documentElement.scrollTop || document.body.scrollTop,
            m = "body" == this.options.container ? window.innerWidth : j.outerWidth(),
            n = "body" == this.options.container ? window.innerHeight : j.outerHeight(),
            o = "body" == this.options.container ? 0 : j.offset().left;d = "bottom" == d && g.top + g.height + i - l > n ? "top" : "top" == d && g.top - l - i < 0 ? "bottom" : "right" == d && g.right + h > m ? "left" : "left" == d && g.left - h < o ? "right" : d, c.removeClass(k).addClass(d);
      }var p = this.getCalculatedOffset(d, g, h, i);this.applyPlacement(p, d), this.$element.trigger("shown.bs." + this.type);
    }
  }, b.prototype.applyPlacement = function (a, b) {
    var c,
        d = this.tip(),
        e = d[0].offsetWidth,
        f = d[0].offsetHeight,
        g = parseInt(d.css("margin-top"), 10),
        h = parseInt(d.css("margin-left"), 10);isNaN(g) && (g = 0), isNaN(h) && (h = 0), a.top = a.top + g, a.left = a.left + h, d.offset(a).addClass("in");var i = d[0].offsetWidth,
        j = d[0].offsetHeight;if ("top" == b && j != f && (c = !0, a.top = a.top + f - j), /bottom|top/.test(b)) {
      var k = 0;a.left < 0 && (k = -2 * a.left, a.left = 0, d.offset(a), i = d[0].offsetWidth, j = d[0].offsetHeight), this.replaceArrow(k - e + i, i, "left");
    } else this.replaceArrow(j - f, j, "top");c && d.offset(a);
  }, b.prototype.replaceArrow = function (a, b, c) {
    this.arrow().css(c, a ? 50 * (1 - a / b) + "%" : "");
  }, b.prototype.setContent = function () {
    var a = this.tip(),
        b = this.getTitle();a.find(".tooltip-inner")[this.options.html ? "html" : "text"](b), a.removeClass("fade in top bottom left right");
  }, b.prototype.hide = function () {
    function b() {
      "in" != c.hoverState && d.detach();
    }var c = this,
        d = this.tip(),
        e = a.Event("hide.bs." + this.type);return this.$element.trigger(e), e.isDefaultPrevented() ? void 0 : (d.removeClass("in"), a.support.transition && this.$tip.hasClass("fade") ? d.one(a.support.transition.end, b).emulateTransitionEnd(150) : b(), this.$element.trigger("hidden.bs." + this.type), this);
  }, b.prototype.fixTitle = function () {
    var a = this.$element;(a.attr("title") || "string" != typeof a.attr("data-original-title")) && a.attr("data-original-title", a.attr("title") || "").attr("title", "");
  }, b.prototype.hasContent = function () {
    return this.getTitle();
  }, b.prototype.getPosition = function () {
    var b = this.$element[0];return a.extend({}, "function" == typeof b.getBoundingClientRect ? b.getBoundingClientRect() : { width: b.offsetWidth, height: b.offsetHeight }, this.$element.offset());
  }, b.prototype.getCalculatedOffset = function (a, b, c, d) {
    return "bottom" == a ? { top: b.top + b.height, left: b.left + b.width / 2 - c / 2 } : "top" == a ? { top: b.top - d, left: b.left + b.width / 2 - c / 2 } : "left" == a ? { top: b.top + b.height / 2 - d / 2, left: b.left - c } : { top: b.top + b.height / 2 - d / 2, left: b.left + b.width };
  }, b.prototype.getTitle = function () {
    var a,
        b = this.$element,
        c = this.options;return a = b.attr("data-original-title") || ("function" == typeof c.title ? c.title.call(b[0]) : c.title);
  }, b.prototype.tip = function () {
    return this.$tip = this.$tip || a(this.options.template);
  }, b.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow");
  }, b.prototype.validate = function () {
    this.$element[0].parentNode || (this.hide(), this.$element = null, this.options = null);
  }, b.prototype.enable = function () {
    this.enabled = !0;
  }, b.prototype.disable = function () {
    this.enabled = !1;
  }, b.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled;
  }, b.prototype.toggle = function (b) {
    var c = b ? a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs." + this.type) : this;c.tip().hasClass("in") ? c.leave(c) : c.enter(c);
  }, b.prototype.destroy = function () {
    this.hide().$element.off("." + this.type).removeData("bs." + this.type);
  };var c = a.fn.tooltip;a.fn.tooltip = function (c) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.tooltip"),
          f = "object" == (typeof c === "undefined" ? "undefined" : _typeof(c)) && c;e || d.data("bs.tooltip", e = new b(this, f)), "string" == typeof c && e[c]();
    });
  }, a.fn.tooltip.Constructor = b, a.fn.tooltip.noConflict = function () {
    return a.fn.tooltip = c, this;
  };
}(window.jQuery), +function (a) {
  "use strict";
  var b = function b(a, _b4) {
    this.init("popover", a, _b4);
  };if (!a.fn.tooltip) throw new Error("Popover requires tooltip.js");b.DEFAULTS = a.extend({}, a.fn.tooltip.Constructor.DEFAULTS, { placement: "right", trigger: "click", content: "", template: '<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>' }), b.prototype = a.extend({}, a.fn.tooltip.Constructor.prototype), b.prototype.constructor = b, b.prototype.getDefaults = function () {
    return b.DEFAULTS;
  }, b.prototype.setContent = function () {
    var a = this.tip(),
        b = this.getTitle(),
        c = this.getContent();a.find(".popover-title")[this.options.html ? "html" : "text"](b), a.find(".popover-content")[this.options.html ? "html" : "text"](c), a.removeClass("fade top bottom left right in"), a.find(".popover-title").html() || a.find(".popover-title").hide();
  }, b.prototype.hasContent = function () {
    return this.getTitle() || this.getContent();
  }, b.prototype.getContent = function () {
    var a = this.$element,
        b = this.options;return a.attr("data-content") || ("function" == typeof b.content ? b.content.call(a[0]) : b.content);
  }, b.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find(".arrow");
  }, b.prototype.tip = function () {
    return this.$tip || (this.$tip = a(this.options.template)), this.$tip;
  };var c = a.fn.popover;a.fn.popover = function (c) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.popover"),
          f = "object" == (typeof c === "undefined" ? "undefined" : _typeof(c)) && c;e || d.data("bs.popover", e = new b(this, f)), "string" == typeof c && e[c]();
    });
  }, a.fn.popover.Constructor = b, a.fn.popover.noConflict = function () {
    return a.fn.popover = c, this;
  };
}(window.jQuery), +function (a) {
  "use strict";
  function b(c, d) {
    var e,
        f = a.proxy(this.process, this);this.$element = a(c).is("body") ? a(window) : a(c), this.$body = a("body"), this.$scrollElement = this.$element.on("scroll.bs.scroll-spy.data-api", f), this.options = a.extend({}, b.DEFAULTS, d), this.selector = (this.options.target || (e = a(c).attr("href")) && e.replace(/.*(?=#[^\s]+$)/, "") || "") + " .nav li > a", this.offsets = a([]), this.targets = a([]), this.activeTarget = null, this.refresh(), this.process();
  }b.DEFAULTS = { offset: 10 }, b.prototype.refresh = function () {
    var b = this.$element[0] == window ? "offset" : "position";this.offsets = a([]), this.targets = a([]);var c = this;this.$body.find(this.selector).map(function () {
      var d = a(this),
          e = d.data("target") || d.attr("href"),
          f = /^#\w/.test(e) && a(e);return f && f.length && [[f[b]().top + (!a.isWindow(c.$scrollElement.get(0)) && c.$scrollElement.scrollTop()), e]] || null;
    }).sort(function (a, b) {
      return a[0] - b[0];
    }).each(function () {
      c.offsets.push(this[0]), c.targets.push(this[1]);
    });
  }, b.prototype.process = function () {
    var a,
        b = this.$scrollElement.scrollTop() + this.options.offset,
        c = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight,
        d = c - this.$scrollElement.height(),
        e = this.offsets,
        f = this.targets,
        g = this.activeTarget;if (b >= d) return g != (a = f.last()[0]) && this.activate(a);for (a = e.length; a--;) {
      g != f[a] && b >= e[a] && (!e[a + 1] || b <= e[a + 1]) && this.activate(f[a]);
    }
  }, b.prototype.activate = function (b) {
    this.activeTarget = b, a(this.selector).parents(".active").removeClass("active");var c = this.selector + '[data-target="' + b + '"],' + this.selector + '[href="' + b + '"]',
        d = a(c).parents("li").addClass("active");d.parent(".dropdown-menu").length && (d = d.closest("li.dropdown").addClass("active")), d.trigger("activate");
  };var c = a.fn.scrollspy;a.fn.scrollspy = function (c) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.scrollspy"),
          f = "object" == (typeof c === "undefined" ? "undefined" : _typeof(c)) && c;e || d.data("bs.scrollspy", e = new b(this, f)), "string" == typeof c && e[c]();
    });
  }, a.fn.scrollspy.Constructor = b, a.fn.scrollspy.noConflict = function () {
    return a.fn.scrollspy = c, this;
  }, a(window).on("load", function () {
    a('[data-spy="scroll"]').each(function () {
      var b = a(this);b.scrollspy(b.data());
    });
  });
}(window.jQuery), +function (a) {
  "use strict";
  var b = function b(_b5) {
    this.element = a(_b5);
  };b.prototype.show = function () {
    var b = this.element,
        c = b.closest("ul:not(.dropdown-menu)"),
        d = b.attr("data-target");if (d || (d = b.attr("href"), d = d && d.replace(/.*(?=#[^\s]*$)/, "")), !b.parent("li").hasClass("active")) {
      var e = c.find(".active:last a")[0],
          f = a.Event("show.bs.tab", { relatedTarget: e });if (b.trigger(f), !f.isDefaultPrevented()) {
        var g = a(d);this.activate(b.parent("li"), c), this.activate(g, g.parent(), function () {
          b.trigger({ type: "shown.bs.tab", relatedTarget: e });
        });
      }
    }
  }, b.prototype.activate = function (b, c, d) {
    function e() {
      f.removeClass("active").find("> .dropdown-menu > .active").removeClass("active"), b.addClass("active"), g ? (b[0].offsetWidth, b.addClass("in")) : b.removeClass("fade"), b.parent(".dropdown-menu") && b.closest("li.dropdown").addClass("active"), d && d();
    }var f = c.find("> .active"),
        g = d && a.support.transition && f.hasClass("fade");g ? f.one(a.support.transition.end, e).emulateTransitionEnd(150) : e(), f.removeClass("in");
  };var c = a.fn.tab;a.fn.tab = function (c) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.tab");e || d.data("bs.tab", e = new b(this)), "string" == typeof c && e[c]();
    });
  }, a.fn.tab.Constructor = b, a.fn.tab.noConflict = function () {
    return a.fn.tab = c, this;
  }, a(document).on("click.bs.tab.data-api", '[data-toggle="tab"], [data-toggle="pill"]', function (b) {
    b.preventDefault(), a(this).tab("show");
  });
}(window.jQuery), +function (a) {
  "use strict";
  var b = function b(c, d) {
    this.options = a.extend({}, b.DEFAULTS, d), this.$window = a(window).on("scroll.bs.affix.data-api", a.proxy(this.checkPosition, this)).on("click.bs.affix.data-api", a.proxy(this.checkPositionWithEventLoop, this)), this.$element = a(c), this.affixed = this.unpin = null, this.checkPosition();
  };b.RESET = "affix affix-top affix-bottom", b.DEFAULTS = { offset: 0 }, b.prototype.checkPositionWithEventLoop = function () {
    setTimeout(a.proxy(this.checkPosition, this), 1);
  }, b.prototype.checkPosition = function () {
    if (this.$element.is(":visible")) {
      var c = a(document).height(),
          d = this.$window.scrollTop(),
          e = this.$element.offset(),
          f = this.options.offset,
          g = f.top,
          h = f.bottom;"object" != (typeof f === "undefined" ? "undefined" : _typeof(f)) && (h = g = f), "function" == typeof g && (g = f.top()), "function" == typeof h && (h = f.bottom());var i = null != this.unpin && d + this.unpin <= e.top ? !1 : null != h && e.top + this.$element.height() >= c - h ? "bottom" : null != g && g >= d ? "top" : !1;this.affixed !== i && (this.unpin && this.$element.css("top", ""), this.affixed = i, this.unpin = "bottom" == i ? e.top - d : null, this.$element.removeClass(b.RESET).addClass("affix" + (i ? "-" + i : "")), "bottom" == i && this.$element.offset({ top: document.body.offsetHeight - h - this.$element.height() }));
    }
  };var c = a.fn.affix;a.fn.affix = function (c) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.affix"),
          f = "object" == (typeof c === "undefined" ? "undefined" : _typeof(c)) && c;e || d.data("bs.affix", e = new b(this, f)), "string" == typeof c && e[c]();
    });
  }, a.fn.affix.Constructor = b, a.fn.affix.noConflict = function () {
    return a.fn.affix = c, this;
  }, a(window).on("load", function () {
    a('[data-spy="affix"]').each(function () {
      var b = a(this),
          c = b.data();c.offset = c.offset || {}, c.offsetBottom && (c.offset.bottom = c.offsetBottom), c.offsetTop && (c.offset.top = c.offsetTop), b.affix(c);
    });
  });
}(window.jQuery);
});

require.register("js/libs/jquery.maxlength-min.js", function(exports, require, module) {
"use strict";

/**
 * jQuery Maxlength plugin
 * @version		$Id: jquery.maxlength.js 18 2009-05-16 15:37:08Z emil@anon-design.se $
 * @package		jQuery maxlength 1.0.5
 * @copyright	Copyright (C) 2009 Emil Stjerneman / http://www.anon-design.se
 * @license		GNU/GPL, see LICENSE.txt
 */
(function (A) {
  A.fn.maxlength = function (B) {
    var C = jQuery.extend({ events: [], maxCharacters: 10, status: true, statusClass: "status", statusText: "character left", notificationClass: "notification", showAlert: false, alertText: "You have typed too many characters.", slider: false }, B);A.merge(C.events, ["keyup"]);return this.each(function () {
      var G = A(this);var J = A(this).val().length;function D() {
        var K = C.maxCharacters - J;if (K < 0) {
          K = 0;
        }G.next("div").html(K + " " + C.statusText);
      }function E() {
        var K = true;if (J >= C.maxCharacters) {
          K = false;G.addClass(C.notificationClass);G.val(G.val().substr(0, C.maxCharacters));I();
        } else {
          if (G.hasClass(C.notificationClass)) {
            G.removeClass(C.notificationClass);
          }
        }if (C.status) {
          D();
        }
      }function I() {
        if (C.showAlert) {
          alert(C.alertText);
        }
      }function F() {
        var K = false;if (G.is("textarea")) {
          K = true;
        } else {
          if (G.filter("input[type=text]")) {
            K = true;
          } else {
            if (G.filter("input[type=password]")) {
              K = true;
            }
          }
        }return K;
      }if (!F()) {
        return false;
      }A.each(C.events, function (K, L) {
        G.bind(L, function (M) {
          J = G.val().length;E();
        });
      });if (C.status) {
        G.after(A("<div/>").addClass(C.statusClass).html("-"));D();
      }if (!C.status) {
        var H = G.next("div." + C.statusClass);if (H) {
          H.remove();
        }
      }if (C.slider) {
        G.next().hide();G.focus(function () {
          G.next().slideDown("fast");
        });G.blur(function () {
          G.next().slideUp("fast");
        });
      }
    });
  };
})(jQuery);
});

require.register("js/libs/jquery.slicknav.min.js", function(exports, require, module) {
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
    SlickNav Responsive Mobile Menu v1.0.1
    (c) 2014 Josh Cope
    licensed under MIT
*/
;(function (e, t, n) {
    function o(t, n) {
        this.element = t;this.settings = e.extend({}, r, n);this._defaults = r;this._name = i;this.init();
    }var r = { label: "MENU", duplicate: true, duration: 200, easingOpen: "swing", easingClose: "swing", closedSymbol: "&#9658;", openedSymbol: "&#9660;", prependTo: "body", parentTag: "a", closeOnClick: false, allowParentLinks: false, nestedParentLinks: true, showChildren: false, init: function init() {}, open: function open() {}, close: function close() {} },
        i = "slicknav",
        s = "slicknav";o.prototype.init = function () {
        var n = this,
            r = e(this.element),
            i = this.settings,
            o,
            u;if (i.duplicate) {
            n.mobileNav = r.clone();n.mobileNav.removeAttr("id");n.mobileNav.find("*").each(function (t, n) {
                e(n).removeAttr("id");
            });
        } else {
            n.mobileNav = r;
        }o = s + "_icon";if (i.label === "") {
            o += " " + s + "_no-text";
        }if (i.parentTag == "a") {
            i.parentTag = 'a href="#"';
        }n.mobileNav.attr("class", s + "_nav");u = e('<div class="' + s + '_menu"></div>');n.btn = e(["<" + i.parentTag + ' aria-haspopup="true" tabindex="0" class="' + s + "_btn " + s + '_collapsed">', '<span class="' + s + '_menutxt">' + i.label + "</span>", '<span class="' + o + '">', '<span class="' + s + '_icon-bar"></span>', '<span class="' + s + '_icon-bar"></span>', '<span class="' + s + '_icon-bar"></span>', "</span>", "</" + i.parentTag + ">"].join(""));e(u).append(n.btn);e(i.prependTo).prepend(u);u.append(n.mobileNav);var a = n.mobileNav.find("li");e(a).each(function () {
            var t = e(this),
                r = {};r.children = t.children("ul").attr("role", "menu");t.data("menu", r);if (r.children.length > 0) {
                var o = t.contents(),
                    u = false;nodes = [];e(o).each(function () {
                    if (!e(this).is("ul")) {
                        nodes.push(this);
                    } else {
                        return false;
                    }if (e(this).is("a")) {
                        u = true;
                    }
                });var a = e("<" + i.parentTag + ' role="menuitem" aria-haspopup="true" tabindex="-1" class="' + s + '_item"/>');if (!i.allowParentLinks || i.nestedParentLinks || !u) {
                    var f = e(nodes).wrapAll(a).parent();f.addClass(s + "_row");
                } else e(nodes).wrapAll('<span class="' + s + "_parent-link " + s + '_row"/>').parent();t.addClass(s + "_collapsed");t.addClass(s + "_parent");var l = e('<span class="' + s + '_arrow">' + i.closedSymbol + "</span>");if (i.allowParentLinks && !i.nestedParentLinks && u) l = l.wrap(a).parent();e(nodes).last().after(l);
            } else if (t.children().length === 0) {
                t.addClass(s + "_txtnode");
            }t.children("a").attr("role", "menuitem").click(function (t) {
                if (i.closeOnClick && !e(t.target).parent().closest("li").hasClass(s + "_parent")) {
                    e(n.btn).click();
                }
            });if (i.closeOnClick && i.allowParentLinks) {
                t.children("a").children("a").click(function (t) {
                    e(n.btn).click();
                });t.find("." + s + "_parent-link a:not(." + s + "_item)").click(function (t) {
                    e(n.btn).click();
                });
            }
        });e(a).each(function () {
            var t = e(this).data("menu");if (!i.showChildren) {
                n._visibilityToggle(t.children, null, false, null, true);
            }
        });n._visibilityToggle(n.mobileNav, null, false, "init", true);n.mobileNav.attr("role", "menu");e(t).mousedown(function () {
            n._outlines(false);
        });e(t).keyup(function () {
            n._outlines(true);
        });e(n.btn).click(function (e) {
            e.preventDefault();n._menuToggle();
        });n.mobileNav.on("click", "." + s + "_item", function (t) {
            t.preventDefault();n._itemClick(e(this));
        });e(n.btn).keydown(function (e) {
            var t = e || event;if (t.keyCode == 13) {
                e.preventDefault();n._menuToggle();
            }
        });n.mobileNav.on("keydown", "." + s + "_item", function (t) {
            var r = t || event;if (r.keyCode == 13) {
                t.preventDefault();n._itemClick(e(t.target));
            }
        });if (i.allowParentLinks && i.nestedParentLinks) {
            e("." + s + "_item a").click(function (e) {
                e.stopImmediatePropagation();
            });
        }
    };o.prototype._menuToggle = function (e) {
        var t = this;var n = t.btn;var r = t.mobileNav;if (n.hasClass(s + "_collapsed")) {
            n.removeClass(s + "_collapsed");n.addClass(s + "_open");
        } else {
            n.removeClass(s + "_open");n.addClass(s + "_collapsed");
        }n.addClass(s + "_animating");t._visibilityToggle(r, n.parent(), true, n);
    };o.prototype._itemClick = function (e) {
        var t = this;var n = t.settings;var r = e.data("menu");if (!r) {
            r = {};r.arrow = e.children("." + s + "_arrow");r.ul = e.next("ul");r.parent = e.parent();if (r.parent.hasClass(s + "_parent-link")) {
                r.parent = e.parent().parent();r.ul = e.parent().next("ul");
            }e.data("menu", r);
        }if (r.parent.hasClass(s + "_collapsed")) {
            r.arrow.html(n.openedSymbol);r.parent.removeClass(s + "_collapsed");r.parent.addClass(s + "_open");r.parent.addClass(s + "_animating");t._visibilityToggle(r.ul, r.parent, true, e);
        } else {
            r.arrow.html(n.closedSymbol);r.parent.addClass(s + "_collapsed");r.parent.removeClass(s + "_open");r.parent.addClass(s + "_animating");t._visibilityToggle(r.ul, r.parent, true, e);
        }
    };o.prototype._visibilityToggle = function (t, n, r, i, o) {
        var u = this;var a = u.settings;var f = u._getActionItems(t);var l = 0;if (r) {
            l = a.duration;
        }if (t.hasClass(s + "_hidden")) {
            t.removeClass(s + "_hidden");t.slideDown(l, a.easingOpen, function () {
                e(i).removeClass(s + "_animating");e(n).removeClass(s + "_animating");if (!o) {
                    a.open(i);
                }
            });t.attr("aria-hidden", "false");f.attr("tabindex", "0");u._setVisAttr(t, false);
        } else {
            t.addClass(s + "_hidden");t.slideUp(l, this.settings.easingClose, function () {
                t.attr("aria-hidden", "true");f.attr("tabindex", "-1");u._setVisAttr(t, true);t.hide();e(i).removeClass(s + "_animating");e(n).removeClass(s + "_animating");if (!o) {
                    a.close(i);
                } else if (i == "init") {
                    a.init();
                }
            });
        }
    };o.prototype._setVisAttr = function (t, n) {
        var r = this;var i = t.children("li").children("ul").not("." + s + "_hidden");if (!n) {
            i.each(function () {
                var t = e(this);t.attr("aria-hidden", "false");var i = r._getActionItems(t);i.attr("tabindex", "0");r._setVisAttr(t, n);
            });
        } else {
            i.each(function () {
                var t = e(this);t.attr("aria-hidden", "true");var i = r._getActionItems(t);i.attr("tabindex", "-1");r._setVisAttr(t, n);
            });
        }
    };o.prototype._getActionItems = function (e) {
        var t = e.data("menu");if (!t) {
            t = {};var n = e.children("li");var r = n.find("a");t.links = r.add(n.find("." + s + "_item"));e.data("menu", t);
        }return t.links;
    };o.prototype._outlines = function (t) {
        if (!t) {
            e("." + s + "_item, ." + s + "_btn").css("outline", "none");
        } else {
            e("." + s + "_item, ." + s + "_btn").css("outline", "");
        }
    };o.prototype.toggle = function () {
        var e = this;e._menuToggle();
    };o.prototype.open = function () {
        var e = this;if (e.btn.hasClass(s + "_collapsed")) {
            e._menuToggle();
        }
    };o.prototype.close = function () {
        var e = this;if (e.btn.hasClass(s + "_open")) {
            e._menuToggle();
        }
    };e.fn[i] = function (t) {
        var n = arguments;if (t === undefined || (typeof t === "undefined" ? "undefined" : _typeof(t)) === "object") {
            return this.each(function () {
                if (!e.data(this, "plugin_" + i)) {
                    e.data(this, "plugin_" + i, new o(this, t));
                }
            });
        } else if (typeof t === "string" && t[0] !== "_" && t !== "init") {
            var r;this.each(function () {
                var s = e.data(this, "plugin_" + i);if (s instanceof o && typeof s[t] === "function") {
                    r = s[t].apply(s, Array.prototype.slice.call(n, 1));
                }
            });return r !== undefined ? r : this;
        }
    };
})(jQuery, document, window);
});

;require.register("js/libs/modernizr.custom.min.js", function(exports, require, module) {
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-fontface-backgroundsize-borderimage-flexbox-hsla-multiplebgs-opacity-rgba-textshadow-cssanimations-csscolumns-generatedcontent-cssgradients-cssreflections-csstransforms-csstransforms3d-csstransitions-applicationcache-hashchange-history-audio-video-input-inputtypes-localstorage-websockets-geolocation-svg-svgclippaths-touch-webgl-shiv-mq-cssclasses-addtest-prefixed-teststyles-testprop-testallprops-hasevent-prefixes-domprefixes-css_mediaqueries-css_regions-css_supports-load
 */
;window.Modernizr = function (a, b, c) {
  function D(a) {
    j.cssText = a;
  }function E(a, b) {
    return D(n.join(a + ";") + (b || ""));
  }function F(a, b) {
    return (typeof a === "undefined" ? "undefined" : _typeof(a)) === b;
  }function G(a, b) {
    return !!~("" + a).indexOf(b);
  }function H(a, b) {
    for (var d in a) {
      var e = a[d];if (!G(e, "-") && j[e] !== c) return b == "pfx" ? e : !0;
    }return !1;
  }function I(a, b, d) {
    for (var e in a) {
      var f = b[a[e]];if (f !== c) return d === !1 ? a[e] : F(f, "function") ? f.bind(d || b) : f;
    }return !1;
  }function J(a, b, c) {
    var d = a.charAt(0).toUpperCase() + a.slice(1),
        e = (a + " " + p.join(d + " ") + d).split(" ");return F(b, "string") || F(b, "undefined") ? H(e, b) : (e = (a + " " + q.join(d + " ") + d).split(" "), I(e, b, c));
  }function K() {
    e.input = function (c) {
      for (var d = 0, e = c.length; d < e; d++) {
        u[c[d]] = c[d] in k;
      }return u.list && (u.list = !!b.createElement("datalist") && !!a.HTMLDataListElement), u;
    }("autocomplete autofocus list placeholder max min multiple pattern required step".split(" ")), e.inputtypes = function (a) {
      for (var d = 0, e, f, h, i = a.length; d < i; d++) {
        k.setAttribute("type", f = a[d]), e = k.type !== "text", e && (k.value = l, k.style.cssText = "position:absolute;visibility:hidden;", /^range$/.test(f) && k.style.WebkitAppearance !== c ? (g.appendChild(k), h = b.defaultView, e = h.getComputedStyle && h.getComputedStyle(k, null).WebkitAppearance !== "textfield" && k.offsetHeight !== 0, g.removeChild(k)) : /^(search|tel)$/.test(f) || (/^(url|email)$/.test(f) ? e = k.checkValidity && k.checkValidity() === !1 : e = k.value != l)), t[a[d]] = !!e;
      }return t;
    }("search tel url email datetime date month week time datetime-local number range color".split(" "));
  }var d = "2.6.2",
      e = {},
      f = !0,
      g = b.documentElement,
      h = "modernizr",
      i = b.createElement(h),
      j = i.style,
      k = b.createElement("input"),
      l = ":)",
      m = {}.toString,
      n = " -webkit- -moz- -o- -ms- ".split(" "),
      o = "Webkit Moz O ms",
      p = o.split(" "),
      q = o.toLowerCase().split(" "),
      r = { svg: "http://www.w3.org/2000/svg" },
      s = {},
      t = {},
      u = {},
      v = [],
      w = v.slice,
      x,
      y = function y(a, c, d, e) {
    var f,
        i,
        j,
        k,
        l = b.createElement("div"),
        m = b.body,
        n = m || b.createElement("body");if (parseInt(d, 10)) while (d--) {
      j = b.createElement("div"), j.id = e ? e[d] : h + (d + 1), l.appendChild(j);
    }return f = ["&#173;", '<style id="s', h, '">', a, "</style>"].join(""), l.id = h, (m ? l : n).innerHTML += f, n.appendChild(l), m || (n.style.background = "", n.style.overflow = "hidden", k = g.style.overflow, g.style.overflow = "hidden", g.appendChild(n)), i = c(l, a), m ? l.parentNode.removeChild(l) : (n.parentNode.removeChild(n), g.style.overflow = k), !!i;
  },
      z = function z(b) {
    var c = a.matchMedia || a.msMatchMedia;if (c) return c(b).matches;var d;return y("@media " + b + " { #" + h + " { position: absolute; } }", function (b) {
      d = (a.getComputedStyle ? getComputedStyle(b, null) : b.currentStyle)["position"] == "absolute";
    }), d;
  },
      A = function () {
    function d(d, e) {
      e = e || b.createElement(a[d] || "div"), d = "on" + d;var f = d in e;return f || (e.setAttribute || (e = b.createElement("div")), e.setAttribute && e.removeAttribute && (e.setAttribute(d, ""), f = F(e[d], "function"), F(e[d], "undefined") || (e[d] = c), e.removeAttribute(d))), e = null, f;
    }var a = { select: "input", change: "input", submit: "form", reset: "form", error: "img", load: "img", abort: "img" };return d;
  }(),
      B = {}.hasOwnProperty,
      C;!F(B, "undefined") && !F(B.call, "undefined") ? C = function C(a, b) {
    return B.call(a, b);
  } : C = function C(a, b) {
    return b in a && F(a.constructor.prototype[b], "undefined");
  }, Function.prototype.bind || (Function.prototype.bind = function (b) {
    var c = this;if (typeof c != "function") throw new TypeError();var d = w.call(arguments, 1),
        e = function e() {
      if (this instanceof e) {
        var a = function a() {};a.prototype = c.prototype;var f = new a(),
            g = c.apply(f, d.concat(w.call(arguments)));return Object(g) === g ? g : f;
      }return c.apply(b, d.concat(w.call(arguments)));
    };return e;
  }), s.flexbox = function () {
    return J("flexWrap");
  }, s.webgl = function () {
    return !!a.WebGLRenderingContext;
  }, s.touch = function () {
    var c;return "ontouchstart" in a || a.DocumentTouch && b instanceof DocumentTouch ? c = !0 : y(["@media (", n.join("touch-enabled),("), h, ")", "{#modernizr{top:9px;position:absolute}}"].join(""), function (a) {
      c = a.offsetTop === 9;
    }), c;
  }, s.geolocation = function () {
    return "geolocation" in navigator;
  }, s.hashchange = function () {
    return A("hashchange", a) && (b.documentMode === c || b.documentMode > 7);
  }, s.history = function () {
    return !!a.history && !!history.pushState;
  }, s.websockets = function () {
    return "WebSocket" in a || "MozWebSocket" in a;
  }, s.rgba = function () {
    return D("background-color:rgba(150,255,150,.5)"), G(j.backgroundColor, "rgba");
  }, s.hsla = function () {
    return D("background-color:hsla(120,40%,100%,.5)"), G(j.backgroundColor, "rgba") || G(j.backgroundColor, "hsla");
  }, s.multiplebgs = function () {
    return D("background:url(https://),url(https://),red url(https://)"), /(url\s*\(.*?){3}/.test(j.background);
  }, s.backgroundsize = function () {
    return J("backgroundSize");
  }, s.borderimage = function () {
    return J("borderImage");
  }, s.textshadow = function () {
    return b.createElement("div").style.textShadow === "";
  }, s.opacity = function () {
    return E("opacity:.55"), /^0.55$/.test(j.opacity);
  }, s.cssanimations = function () {
    return J("animationName");
  }, s.csscolumns = function () {
    return J("columnCount");
  }, s.cssgradients = function () {
    var a = "background-image:",
        b = "gradient(linear,left top,right bottom,from(#9f9),to(white));",
        c = "linear-gradient(left top,#9f9, white);";return D((a + "-webkit- ".split(" ").join(b + a) + n.join(c + a)).slice(0, -a.length)), G(j.backgroundImage, "gradient");
  }, s.cssreflections = function () {
    return J("boxReflect");
  }, s.csstransforms = function () {
    return !!J("transform");
  }, s.csstransforms3d = function () {
    var a = !!J("perspective");return a && "webkitPerspective" in g.style && y("@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}", function (b, c) {
      a = b.offsetLeft === 9 && b.offsetHeight === 3;
    }), a;
  }, s.csstransitions = function () {
    return J("transition");
  }, s.fontface = function () {
    var a;return y('@font-face {font-family:"font";src:url("https://")}', function (c, d) {
      var e = b.getElementById("smodernizr"),
          f = e.sheet || e.styleSheet,
          g = f ? f.cssRules && f.cssRules[0] ? f.cssRules[0].cssText : f.cssText || "" : "";a = /src/i.test(g) && g.indexOf(d.split(" ")[0]) === 0;
    }), a;
  }, s.generatedcontent = function () {
    var a;return y(["#", h, "{font:0/0 a}#", h, ':after{content:"', l, '";visibility:hidden;font:3px/1 a}'].join(""), function (b) {
      a = b.offsetHeight >= 3;
    }), a;
  }, s.video = function () {
    var a = b.createElement("video"),
        c = !1;try {
      if (c = !!a.canPlayType) c = new Boolean(c), c.ogg = a.canPlayType('video/ogg; codecs="theora"').replace(/^no$/, ""), c.h264 = a.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/, ""), c.webm = a.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/, "");
    } catch (d) {}return c;
  }, s.audio = function () {
    var a = b.createElement("audio"),
        c = !1;try {
      if (c = !!a.canPlayType) c = new Boolean(c), c.ogg = a.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""), c.mp3 = a.canPlayType("audio/mpeg;").replace(/^no$/, ""), c.wav = a.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ""), c.m4a = (a.canPlayType("audio/x-m4a;") || a.canPlayType("audio/aac;")).replace(/^no$/, "");
    } catch (d) {}return c;
  }, s.localstorage = function () {
    try {
      return localStorage.setItem(h, h), localStorage.removeItem(h), !0;
    } catch (a) {
      return !1;
    }
  }, s.applicationcache = function () {
    return !!a.applicationCache;
  }, s.svg = function () {
    return !!b.createElementNS && !!b.createElementNS(r.svg, "svg").createSVGRect;
  }, s.svgclippaths = function () {
    return !!b.createElementNS && /SVGClipPath/.test(m.call(b.createElementNS(r.svg, "clipPath")));
  };for (var L in s) {
    C(s, L) && (x = L.toLowerCase(), e[x] = s[L](), v.push((e[x] ? "" : "no-") + x));
  }return e.input || K(), e.addTest = function (a, b) {
    if ((typeof a === "undefined" ? "undefined" : _typeof(a)) == "object") for (var d in a) {
      C(a, d) && e.addTest(d, a[d]);
    } else {
      a = a.toLowerCase();if (e[a] !== c) return e;b = typeof b == "function" ? b() : b, typeof f != "undefined" && f && (g.className += " " + (b ? "" : "no-") + a), e[a] = b;
    }return e;
  }, D(""), i = k = null, function (a, b) {
    function k(a, b) {
      var c = a.createElement("p"),
          d = a.getElementsByTagName("head")[0] || a.documentElement;return c.innerHTML = "x<style>" + b + "</style>", d.insertBefore(c.lastChild, d.firstChild);
    }function l() {
      var a = r.elements;return typeof a == "string" ? a.split(" ") : a;
    }function m(a) {
      var b = i[a[g]];return b || (b = {}, h++, a[g] = h, i[h] = b), b;
    }function n(a, c, f) {
      c || (c = b);if (j) return c.createElement(a);f || (f = m(c));var g;return f.cache[a] ? g = f.cache[a].cloneNode() : e.test(a) ? g = (f.cache[a] = f.createElem(a)).cloneNode() : g = f.createElem(a), g.canHaveChildren && !d.test(a) ? f.frag.appendChild(g) : g;
    }function o(a, c) {
      a || (a = b);if (j) return a.createDocumentFragment();c = c || m(a);var d = c.frag.cloneNode(),
          e = 0,
          f = l(),
          g = f.length;for (; e < g; e++) {
        d.createElement(f[e]);
      }return d;
    }function p(a, b) {
      b.cache || (b.cache = {}, b.createElem = a.createElement, b.createFrag = a.createDocumentFragment, b.frag = b.createFrag()), a.createElement = function (c) {
        return r.shivMethods ? n(c, a, b) : b.createElem(c);
      }, a.createDocumentFragment = Function("h,f", "return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&(" + l().join().replace(/\w+/g, function (a) {
        return b.createElem(a), b.frag.createElement(a), 'c("' + a + '")';
      }) + ");return n}")(r, b.frag);
    }function q(a) {
      a || (a = b);var c = m(a);return r.shivCSS && !f && !c.hasCSS && (c.hasCSS = !!k(a, "article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}mark{background:#FF0;color:#000}")), j || p(a, c), a;
    }var c = a.html5 || {},
        d = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,
        e = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,
        f,
        g = "_html5shiv",
        h = 0,
        i = {},
        j;(function () {
      try {
        var a = b.createElement("a");a.innerHTML = "<xyz></xyz>", f = "hidden" in a, j = a.childNodes.length == 1 || function () {
          b.createElement("a");var a = b.createDocumentFragment();return typeof a.cloneNode == "undefined" || typeof a.createDocumentFragment == "undefined" || typeof a.createElement == "undefined";
        }();
      } catch (c) {
        f = !0, j = !0;
      }
    })();var r = { elements: c.elements || "abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video", shivCSS: c.shivCSS !== !1, supportsUnknownElements: j, shivMethods: c.shivMethods !== !1, type: "default", shivDocument: q, createElement: n, createDocumentFragment: o };a.html5 = r, q(b);
  }(this, b), e._version = d, e._prefixes = n, e._domPrefixes = q, e._cssomPrefixes = p, e.mq = z, e.hasEvent = A, e.testProp = function (a) {
    return H([a]);
  }, e.testAllProps = J, e.testStyles = y, e.prefixed = function (a, b, c) {
    return b ? J(a, b, c) : J(a, "pfx");
  }, g.className = g.className.replace(/(^|\s)no-js(\s|$)/, "$1$2") + (f ? " js " + v.join(" ") : ""), e;
}(undefined, undefined.document), function (a, b, c) {
  function d(a) {
    return "[object Function]" == o.call(a);
  }function e(a) {
    return "string" == typeof a;
  }function f() {}function g(a) {
    return !a || "loaded" == a || "complete" == a || "uninitialized" == a;
  }function h() {
    var a = p.shift();q = 1, a ? a.t ? m(function () {
      ("c" == a.t ? _B.injectCss : _B.injectJs)(a.s, 0, a.a, a.x, a.e, 1);
    }, 0) : (a(), h()) : q = 0;
  }function i(a, c, d, e, f, i, j) {
    function k(b) {
      if (!o && g(l.readyState) && (u.r = o = 1, !q && h(), l.onload = l.onreadystatechange = null, b)) {
        "img" != a && m(function () {
          t.removeChild(l);
        }, 50);for (var d in y[c]) {
          y[c].hasOwnProperty(d) && y[c][d].onload();
        }
      }
    }var j = j || _B.errorTimeout,
        l = b.createElement(a),
        o = 0,
        r = 0,
        u = { t: d, s: c, e: f, a: i, x: j };1 === y[c] && (r = 1, y[c] = []), "object" == a ? l.data = c : (l.src = c, l.type = a), l.width = l.height = "0", l.onerror = l.onload = l.onreadystatechange = function () {
      k.call(this, r);
    }, p.splice(e, 0, u), "img" != a && (r || 2 === y[c] ? (t.insertBefore(l, s ? null : n), m(k, j)) : y[c].push(l));
  }function j(a, b, c, d, f) {
    return q = 0, b = b || "j", e(a) ? i("c" == b ? v : u, a, b, this.i++, c, d, f) : (p.splice(this.i++, 0, a), 1 == p.length && h()), this;
  }function k() {
    var a = _B;return a.loader = { load: j, i: 0 }, a;
  }var l = b.documentElement,
      m = a.setTimeout,
      n = b.getElementsByTagName("script")[0],
      o = {}.toString,
      p = [],
      q = 0,
      r = "MozAppearance" in l.style,
      s = r && !!b.createRange().compareNode,
      t = s ? l : n.parentNode,
      l = a.opera && "[object Opera]" == o.call(a.opera),
      l = !!b.attachEvent && !l,
      u = r ? "object" : l ? "script" : "img",
      v = l ? "script" : u,
      w = Array.isArray || function (a) {
    return "[object Array]" == o.call(a);
  },
      x = [],
      y = {},
      z = { timeout: function timeout(a, b) {
      return b.length && (a.timeout = b[0]), a;
    } },
      _A,
      _B;_B = function B(a) {
    function b(a) {
      var a = a.split("!"),
          b = x.length,
          c = a.pop(),
          d = a.length,
          c = { url: c, origUrl: c, prefixes: a },
          e,
          f,
          g;for (f = 0; f < d; f++) {
        g = a[f].split("="), (e = z[g.shift()]) && (c = e(c, g));
      }for (f = 0; f < b; f++) {
        c = x[f](c);
      }return c;
    }function g(a, e, f, g, h) {
      var i = b(a),
          j = i.autoCallback;i.url.split(".").pop().split("?").shift(), i.bypass || (e && (e = d(e) ? e : e[a] || e[g] || e[a.split("/").pop().split("?")[0]]), i.instead ? i.instead(a, e, f, g, h) : (y[i.url] ? i.noexec = !0 : y[i.url] = 1, f.load(i.url, i.forceCSS || !i.forceJS && "css" == i.url.split(".").pop().split("?").shift() ? "c" : c, i.noexec, i.attrs, i.timeout), (d(e) || d(j)) && f.load(function () {
        k(), e && e(i.origUrl, h, g), j && j(i.origUrl, h, g), y[i.url] = 2;
      })));
    }function h(a, b) {
      function c(a, c) {
        if (a) {
          if (e(a)) c || (j = function j() {
            var a = [].slice.call(arguments);k.apply(this, a), l();
          }), g(a, j, b, 0, h);else if (Object(a) === a) for (n in m = function () {
            var b = 0,
                c;for (c in a) {
              a.hasOwnProperty(c) && b++;
            }return b;
          }(), a) {
            a.hasOwnProperty(n) && (!c && ! --m && (d(j) ? j = function j() {
              var a = [].slice.call(arguments);k.apply(this, a), l();
            } : j[n] = function (a) {
              return function () {
                var b = [].slice.call(arguments);a && a.apply(this, b), l();
              };
            }(k[n])), g(a[n], j, b, n, h));
          }
        } else !c && l();
      }var h = !!a.test,
          i = a.load || a.both,
          j = a.callback || f,
          k = j,
          l = a.complete || f,
          m,
          n;c(h ? a.yep : a.nope, !!i), i && c(i);
    }var i,
        j,
        l = this.yepnope.loader;if (e(a)) g(a, 0, l, 0);else if (w(a)) for (i = 0; i < a.length; i++) {
      j = a[i], e(j) ? g(j, 0, l, 0) : w(j) ? _B(j) : Object(j) === j && h(j, l);
    } else Object(a) === a && h(a, l);
  }, _B.addPrefix = function (a, b) {
    z[a] = b;
  }, _B.addFilter = function (a) {
    x.push(a);
  }, _B.errorTimeout = 1e4, null == b.readyState && b.addEventListener && (b.readyState = "loading", b.addEventListener("DOMContentLoaded", _A = function A() {
    b.removeEventListener("DOMContentLoaded", _A, 0), b.readyState = "complete";
  }, 0)), a.yepnope = k(), a.yepnope.executeStack = h, a.yepnope.injectJs = function (a, c, d, e, i, j) {
    var k = b.createElement("script"),
        l,
        o,
        e = e || _B.errorTimeout;k.src = a;for (o in d) {
      k.setAttribute(o, d[o]);
    }c = j ? h : c || f, k.onreadystatechange = k.onload = function () {
      !l && g(k.readyState) && (l = 1, c(), k.onload = k.onreadystatechange = null);
    }, m(function () {
      l || (l = 1, c(1));
    }, e), i ? k.onload() : n.parentNode.insertBefore(k, n);
  }, a.yepnope.injectCss = function (a, c, d, e, g, i) {
    var e = b.createElement("link"),
        j,
        c = i ? h : c || f;e.href = a, e.rel = "stylesheet", e.type = "text/css";for (j in d) {
      e.setAttribute(j, d[j]);
    }g || (n.parentNode.insertBefore(e, n), m(c, 0));
  };
}(undefined, document), Modernizr.load = function () {
  yepnope.apply(window, [].slice.call(arguments, 0));
}, Modernizr.addTest("mediaqueries", Modernizr.mq("only all")), Modernizr.addTest("regions", function () {
  var a = Modernizr.prefixed("flowFrom"),
      b = Modernizr.prefixed("flowInto");if (!a || !b) return !1;var c = document.createElement("div"),
      d = document.createElement("div"),
      e = document.createElement("div"),
      f = "modernizr_flow_for_regions_check";d.innerText = "M", c.style.cssText = "top: 150px; left: 150px; padding: 0px;", e.style.cssText = "width: 50px; height: 50px; padding: 42px;", e.style[a] = f, c.appendChild(d), c.appendChild(e), document.documentElement.appendChild(c);var g,
      h,
      i = d.getBoundingClientRect();return d.style[b] = f, g = d.getBoundingClientRect(), h = g.left - i.left, document.documentElement.removeChild(c), d = e = c = undefined, h == 42;
}), Modernizr.addTest("supports", "CSSSupportsRule" in window);
});

require.register("js/libs/stickySidebar.js", function(exports, require, module) {
'use strict';

(function ($) {

    $.fn.stickySidebar = function (options) {

        var config = $.extend({
            headerSelector: 'header',
            navSelector: 'nav',
            contentSelector: '#content',
            footerSelector: 'footer',
            sidebarTopMargin: 20,
            footerThreshold: 40
        }, options);

        var fixSidebr = function fixSidebr() {

            var sidebarSelector = $(this);
            var viewportHeight = $(window).height();
            var viewportWidth = $(window).width();
            var documentHeight = $(document).height();
            var headerHeight = $(config.headerSelector).outerHeight();
            var navHeight = $(config.navSelector).outerHeight();
            var sidebarHeight = sidebarSelector.outerHeight();
            var contentHeight = $(config.contentSelector).outerHeight();
            var footerHeight = $(config.footerSelector).outerHeight();
            var scroll_top = $(window).scrollTop();
            var fixPosition = contentHeight - sidebarHeight;
            var breakingPoint1 = headerHeight + navHeight;
            var breakingPoint2 = documentHeight - (sidebarHeight + footerHeight + config.footerThreshold);

            // calculate
            if (contentHeight > sidebarHeight && viewportHeight > sidebarHeight) {

                if (scroll_top < breakingPoint1) {

                    sidebarSelector.removeClass('sticky');
                } else if (scroll_top >= breakingPoint1 && scroll_top < breakingPoint2) {

                    sidebarSelector.addClass('sticky').css('top', config.sidebarTopMargin);
                } else {

                    var negative = breakingPoint2 - scroll_top;
                    sidebarSelector.addClass('sticky').css('top', negative);
                }
            }
        };

        return this.each(function () {
            $(window).on('scroll', $.proxy(fixSidebr, this));
            $(window).on('resize', $.proxy(fixSidebr, this));
            $.proxy(fixSidebr, this)();
        });
    };
})(jQuery);
});

require.register("js/scripts.js", function(exports, require, module) {
'use strict';

/*
 * Get Viewport Dimensions
 * returns object with viewport dimensions to match css in width and height properties
 * ( source: http://andylangton.co.uk/blog/development/get-viewport-size-width-and-height-javascript )
 */
function updateViewportDimensions() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth,
        y = w.innerHeight || e.clientHeight || g.clientHeight;
    return { width: x, height: y };
}
// setting the viewport width
var viewport = updateViewportDimensions();
/*
 * Throttle Resize-triggered Events
 * Wrap your actions in this function to throttle the frequency of firing them off, for better performance, esp. on mobile.
 * ( source: http://stackoverflow.com/questions/2854407/javascript-jquery-window-resize-how-to-fire-after-the-resize-is-completed )
 */
var waitForFinalEvent = function () {
    var timers = {};
    return function (callback, ms, uniqueId) {
        if (!uniqueId) {
            uniqueId = "Don't call this twice without a uniqueId";
        }
        if (timers[uniqueId]) {
            clearTimeout(timers[uniqueId]);
        }
        timers[uniqueId] = setTimeout(callback, ms);
    };
}();
// how long to wait before deciding the resize has stopped, in ms. Around 50-100 should work ok.
var timeToWaitForLast = 100;
function loadGravatars() {
    viewport = updateViewportDimensions();
    if (viewport.width >= 768) {
        jQuery('.comment img[data-gravatar]').each(function () {
            jQuery(this).attr('src', jQuery(this).attr('data-gravatar'));
        });
    }
}
jQuery(document).ready(function ($) {
    loadGravatars();
    if (!sessionStorage['firstTime']) {
        sessionStorage['firstTime'] = 'yes';
        setTimeout(function () {
            $('.subscribe-popup').modal('show');
        }, 3000);
    }
    $('.char-limit').maxlength({
        maxCharacters: 250,
        status: true,
        statusClass: 'status',
        statusText: 'character left',
        notificationClass: 'notification',
        showAlert: false
    });
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.scrollToTop').fadeIn();
        } else {
            $('.scrollToTop').fadeOut();
        }
    });

    /*MS Add scripts for ebook page*/

    $(window).scroll(function () {
        if ($(this).scrollTop() > 200) {
            $('.interview-next-previous').fadeIn();
        } else {
            $('.interview-next-previous').fadeOut();
        }
    });

    /*MS close scripts for ebook page*/

    $('.scrollToTop').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 800);
        return false;
    });
    $('.carousel-inner li:first').addClass('active');
    $('.carousel').carousel({
        interval: 6000
    });
    $('#content').delay(700).animate({ 'opacity': '1' }, 900);
    if (jQuery(window).width() > 768) {
        $('.dropdown').find('a.dropdown-toggle').removeAttr('data-toggle');
    }
    if (jQuery(window).width() < 769) {
        $('.dropdown').on('show.bs.dropdown', function () {
            $(this).siblings('.open').removeClass('open').find('a.dropdown-toggle').attr('data-toggle', 'dropdown');
            $(this).find('a.dropdown-toggle').removeAttr('data-toggle');
        });
    }
    if ($('.sticky').length) {
        // make sure '#sticky' element exists
        var el = $('.sticky');
        var stickyTop = $('.sticky').offset().top; // returns number
        var stickyHeight = $('.sticky').height();
        $(window).scroll(function () {
            // scroll event
            var limit = $('.footer').offset().top - stickyHeight + 60;
            var windowTop = $(window).scrollTop() + 225; // returns number
            if (stickyTop < windowTop) {
                el.css({ position: 'fixed', top: 100 });
            } else {
                el.css('position', 'static');
            }
            if (limit < windowTop) {
                var diff = limit - windowTop;
                el.css({ top: diff });
            }
        });
    }
});
/* end of as page load scripts */
});

;require.register("logger.js", function(exports, require, module) {
'use strict';

console.log('Hello, world');
});

require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map