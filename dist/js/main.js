/*!
 * magsmag
 * MagsMag
 * 
 * @author Danny Callaghan
 * @version 0.0.1
 * Copyright 2019. MIT licensed.
 */
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

var _inspector = require('inspector');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DrinksAPI = function () {
    function DrinksAPI() {
        _classCallCheck(this, DrinksAPI);
    }

    _createClass(DrinksAPI, null, [{
        key: 'API_URL',
        value: function API_URL(category, id) {
            var api = 'https://www.thecocktaildb.com/api/json/v1/1/';
            var suffix = this.TEST_MODE ? '.json' : '.php';
            var query = '';
            var dest = void 0;
            if (this.TEST_MODE) {
                api = '/local_data';
            }
            switch (category) {
                case 'random':
                    dest = 'random';
                    break;
                case 'by-id':
                    dest = 'lookup';
                    query = '?i=' + id;
                    break;
                case 'filter':
                    dest = 'filter';
                    query = '?i=' + id;
                    break;
                case 'virgin':
                    dest = 'filter';
                    query = '?a=' + id;
                    break;
                default:
            }
            return '' + api + dest + suffix + query;
        }
    }, {
        key: 'getCocktailDetails',
        value: function getCocktailDetails(type, id) {
            var _this = this;

            var succcess = function succcess(results) {
                _utils2.default.TemplateEngine.createHTML('' + _this.DETAILS_TEMPLATE, { data: results }, 'cocktail-data');
            };
            fetch('' + this.API_URL(type, id)).then(function (response) {
                return response.json();
            }).then(function (results) {
                succcess(results);
            }).catch(function (e) {
                // TODO
            });
        }
    }, {
        key: 'getCocktails',
        value: function getCocktails() {
            var _this2 = this;

            var query = window.location.search;
            if (query && query.indexOf('list=')) {
                var splitQuery = query.split('list=')[1];
                if (splitQuery && splitQuery.length) {
                    var listType = splitQuery.toLowerCase();
                    var succcess = function succcess(results) {
                        console.warn(results);
                        _utils2.default.TemplateEngine.createHTML('' + _this2.LIST_TEMPLATE, { data: results }, 'cocktail-data');
                    };
                    switch (listType) {
                        case 'popular':
                            var urls = this.POPULAR_IDS.map(function (id) {
                                return fetch('' + _this2.API_URL('by-id', id)).then(function (value) {
                                    return value.json();
                                });
                            });
                            Promise.all(urls).then(function (results) {
                                succcess(results);
                            }).catch(function (e) {
                                // TODO
                            });
                            break;
                        case 'virgin':
                            fetch('' + this.API_URL('virgin', 'non_alcoholic')).then(function (value) {
                                return value.json();
                            }).then(function (results) {
                                succcess(results);
                            }).catch(function (e) {
                                // TODO
                            });
                            break;
                        default:
                            fetch('' + this.API_URL('filter', listType)).then(function (value) {
                                return value.json();
                            }).then(function (results) {
                                succcess(results);
                            }).catch(function (e) {
                                // TODO
                            });

                    }
                    return;
                }
            }
            //window.location.href = '/';
            return;
        }
    }, {
        key: 'getCocktail',
        value: function getCocktail() {
            console.warn('still called');
            var query = window.location.search;
            if (query && query.indexOf('id=')) {
                var splitQuery = query.split('id=')[1];
                if (splitQuery && splitQuery.length && (parseInt(splitQuery) || splitQuery === 'random')) {
                    var id = splitQuery;
                    if (id === 'random') {
                        this.getCocktailDetails('random');
                        return;
                    }
                    this.getCocktailDetails('by-id', id);
                    return;
                }
            }
            window.location.href = '/';
            return;
        }
    }, {
        key: 'TEST_MODE',
        get: function get() {
            return false;
        }
    }, {
        key: 'DETAILS_TEMPLATE',
        get: function get() {
            return 'cocktail_details';
        }
    }, {
        key: 'LIST_TEMPLATE',
        get: function get() {
            return 'cocktails_list';
        }
    }, {
        key: 'POPULAR_IDS',
        get: function get() {
            return [11000, 11001, 11002, 11007, 17207];
        }
    }]);

    return DrinksAPI;
}();

exports.default = DrinksAPI;

},{"../utils":4,"inspector":1}],3:[function(require,module,exports){
'use strict';

var _drinksApi = require('./drinks-api');

var _drinksApi2 = _interopRequireDefault(_drinksApi);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Initialise our main app code when the DOM is ready
 */
document.addEventListener('DOMContentLoaded', function (event) {

  /**
   * Initialise the drawer functionality for smaller screen sizes
   */
  var Drawer = new _utils2.default.Drawer();
  Drawer.init();

  /**
   * Initialise the shrinking header
   */
  var ShrinkHeader = new _utils2.default.ShrinkHeader();
  ShrinkHeader.init();

  /**
   * Add the back to top functionality
   */
  _utils2.default.backToTop();

  /**
   * Start the splash screen
   */
  if (document.getElementById('splash-screen')) {
    _utils2.default.startSplash();
  }

  /**
   * If we're on a list page, pass it to the API and let it determine what to show
   */
  if (document.getElementById('category-list')) {
    _drinksApi2.default.getCocktails();
  }

  /**
   * If we're on a detail page, pass it to the API and let it determine what to show
   */
  if (document.getElementById('category-cocktail')) {
    _drinksApi2.default.getCocktail();
  }

  // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
  var vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', vh + 'px');
  console.warn(vh);
});

},{"./drinks-api":2,"./utils":4}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * UTILS CLASS
 * Utility functions used anywhere within the site
 */
var Utils = function Utils() {
    _classCallCheck(this, Utils);
};

/**
 * SHRINKHEADER CLASS
 * Adds a class to the body when a user scrolls, to shrink the header and show more content
 */


Utils.ShrinkHeader = function () {
    function _class() {
        _classCallCheck(this, _class);

        this.scrollPos = 64; // Scroll position, in pixels, when to trigger the shrinking header
        this.shrinkClass = 'body--scrolled'; // Class to add to the body
    }

    /**
     * Initialise the header script
     * 
     * @return void
     */


    _createClass(_class, [{
        key: 'init',
        value: function init() {
            var _this = this;

            // Listen for the scroll event */
            window.addEventListener('scroll', function (e) {
                // Event heard. Call the scrollPage function */
                _this.scrollPage();
                console.warn('scrolled');
            }, false);

            // Now call the function anyway, so we know where we are after refresh, etc
            this.scrollPage();
        }

        /**
         * Adds the scrolled class
         * 
         * @return void
         */

    }, {
        key: 'scrollPage',
        value: function scrollPage() {
            var body = document.body;
            // Grab the latest scroll position */
            var sy = this.scrolledPos();
            // Check if we've scrolled far enough
            if (sy > this.scrollPos) {
                // Add the scrolled class
                body.classList.add(this.shrinkClass);
            } else {
                // Add the scrolled class
                body.classList.remove(this.shrinkClass);
            }
        }

        /**
         * Returns the current scroll position of the page
         * 
         * @return Window y position
         */

    }, {
        key: 'scrolledPos',
        value: function scrolledPos() {
            return window.pageYOffset || document.documentElement.scrollTop;
        }
    }]);

    return _class;
}();

/**
 * DRAWER CLASS
 * Adds a navigation drawer for smaller screens
 */
Utils.Drawer = function () {
    function _class2() {
        _classCallCheck(this, _class2);

        this.menuButtons = document.querySelectorAll('.toggle-drawer'); // Grab all elements with a toggle-drawer class
        this.drawerElement = document.querySelector('.drawer'); // The drawer itself
        this.cloak = document.getElementById('cloak'); // The shaded overlay when the drawer is open
        this.drawerClass = 'body--drawer-visible'; // Class to add to the body to slide the drawer in and out
        this.body = document.body; // Grab a handle on th body
    }

    /**
     * Initialise the drawer script
     * 
     * @return void
     */


    _createClass(_class2, [{
        key: 'init',
        value: function init() {
            var _this2 = this;

            // Add a click event to every element with the toggle class
            // This is a node list, so turn it into an array first
            [].slice.call(this.menuButtons).forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    // Call the toggle function
                    _this2.toggleDrawer();
                }, false);
            });

            // Listen for a click event on the cloak, to close the drawer
            this.cloak.addEventListener('click', function (e) {
                // Call the toggle function
                _this2.toggleDrawer();
            }, false);
        }

        /**
         * Add or remove the toggle class to show the drawer
         * 
         * @return void
         */

    }, {
        key: 'toggleDrawer',
        value: function toggleDrawer() {
            console.warn('clicked');
            // Toggle the class
            this.body.classList.toggle(this.drawerClass);
            // Call the aria change function
            this.toggleAriaAttr();
        }

        /**
         * Toggles the ARIA attribute of the drawer.
         * 
         * @return void
         */

    }, {
        key: 'toggleAriaAttr',
        value: function toggleAriaAttr() {
            if (this.body.classList.contains(this.drawerClass)) {
                this.drawerElement.setAttribute('aria-hidden', false);
            } else {
                this.drawerElement.setAttribute('aria-hidden', true);
            }
        }
    }]);

    return _class2;
}();

/**
 * TEMPLATEENGINE CLASS
 * Custom lightweight templating engine.
 * Heavily taken from:
 * John Resig – http://ejohn.org/ – MIT Licensed
 */
Utils.TemplateEngine = function () {
    function _class3() {
        _classCallCheck(this, _class3);
    }

    _createClass(_class3, null, [{
        key: 'createHTML',


        /**
        * Takes the template, model and destination to pass on to the templating function
        *
        * @param {string}      template - ID of script template
        * @param {object}   model - Data model to pass to template 
        * @param {string}      destination - ID of where the finished template is going to go
        * 
        *@return void
        */
        value: function createHTML(template, model, destination) {
            var element = document.getElementById(destination);
            console.warn(destination, element);
            if (element) {
                element.innerHTML = this.templateToHTML(template, model);
            }
        }

        /**
        * Combines dynamic data with our templates and returns the result
        * John Resig – http://ejohn.org/ – MIT Licensed
        * 
        * @param {string}   str - ID of script template
        * @param {object}   data - Data model to pass to template
        * 
        * @return The finished template
        */

    }, {
        key: 'templateToHTML',
        value: function templateToHTML(str, data) {
            console.warn('still here');
            var fn = !/\W/.test(str) ? this.CACHE[str] = this.CACHE[str] || this.templateToHTML(document.getElementById(str).innerHTML) : new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" + "with(obj){p.push('" + str.replace(/[\r\t\n]/g, " ").split("<%").join("\t").replace(/((^|%>)[^\t]*)'/g, "$1\r").replace(/\t=(.*?)%>/g, "',$1,'").split("\t").join("');").split("%>").join("p.push('").split("\r").join("\\'") + "');}return p.join('');");

            return data ? fn(data) : fn;
        }
    }, {
        key: 'CACHE',


        /**
        * Stores the template data, so we don't keep querying the DOM
        * 
        * @return Empty object
        */
        get: function get() {
            return {};
        }
    }]);

    return _class3;
}();

/**
 * Back To Top functionality
 * 
 * @return void
 */
Utils.backToTop = function () {
    var el = document.getElementById('back-to-top');
    if (el) {
        el.addEventListener('click', function (e) {
            window.scrollTo(0, 0);
            e.preventDefault();
        }, false);
    }
};

/**
 * Starts the splash screen by removing the pending class from the body
 * 
 * @return void
 */
Utils.startSplash = function () {
    var firstTimer = 500;
    var secondTimer = 3000;
    var body = document.body;
    window.setTimeout(function () {
        body.classList.remove('splash-1');
    }, firstTimer);
    window.setTimeout(function () {
        body.classList.remove('splash-2');
    }, secondTimer);
};

exports.default = Utils;

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwic3JjL2pzL2RyaW5rcy1hcGkvaW5kZXguanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy91dGlscy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7Ozs7Ozs7O0FDQUE7Ozs7QUFDQTs7Ozs7O0lBRU0sUzs7Ozs7OztnQ0FrQmMsUSxFQUFVLEUsRUFBSTtBQUMxQixnQkFBSSxvREFBSjtBQUNBLGdCQUFJLFNBQVMsS0FBSyxTQUFMLEdBQWlCLE9BQWpCLEdBQTJCLE1BQXhDO0FBQ0EsZ0JBQUksVUFBSjtBQUNBLGdCQUFJLGFBQUo7QUFDQSxnQkFBSSxLQUFLLFNBQVQsRUFBb0I7QUFDaEI7QUFDSDtBQUNELG9CQUFPLFFBQVA7QUFDSSxxQkFBSyxRQUFMO0FBQ0k7QUFDSjtBQUNBLHFCQUFLLE9BQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBO0FBaEJKO0FBa0JBLHdCQUFVLEdBQVYsR0FBZ0IsSUFBaEIsR0FBdUIsTUFBdkIsR0FBZ0MsS0FBaEM7QUFDSDs7OzJDQUUwQixJLEVBQU0sRSxFQUFJO0FBQUE7O0FBQ2pDLGdCQUFNLFdBQVcsU0FBWCxRQUFXLENBQUMsT0FBRCxFQUFhO0FBQzFCLGdDQUFNLGNBQU4sQ0FBcUIsVUFBckIsTUFBbUMsTUFBSyxnQkFBeEMsRUFBNEQsRUFBRSxNQUFNLE9BQVIsRUFBNUQsRUFBK0UsZUFBL0U7QUFDSCxhQUZEO0FBR0EsdUJBQVMsS0FBSyxPQUFMLENBQWEsSUFBYixFQUFtQixFQUFuQixDQUFULEVBQ0QsSUFEQyxDQUNJO0FBQUEsdUJBQVksU0FBUyxJQUFULEVBQVo7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Q0FSRDs7QUFVQTs7Ozs7QUFLQSxNQUFNLFdBQU4sR0FBb0IsWUFBWTtBQUM1QixRQUFNLGFBQWEsR0FBbkI7QUFDQSxRQUFNLGNBQWMsSUFBcEI7QUFDQSxRQUFNLE9BQU8sU0FBUyxJQUF0QjtBQUNBLFdBQU8sVUFBUCxDQUFrQixZQUFNO0FBQ3BCLGFBQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsVUFBdEI7QUFDSCxLQUZELEVBRUcsVUFGSDtBQUdBLFdBQU8sVUFBUCxDQUFrQixZQUFNO0FBQ3BCLGFBQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsVUFBdEI7QUFDSCxLQUZELEVBRUcsV0FGSDtBQUdILENBVkQ7O2tCQWFlLEsiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIiLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgdXJsIH0gZnJvbSAnaW5zcGVjdG9yJztcblxuY2xhc3MgRHJpbmtzQVBJIHtcblxuICAgIHN0YXRpYyBnZXQgVEVTVF9NT0RFICgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgREVUQUlMU19URU1QTEFURSAoKSB7XG4gICAgICAgIHJldHVybiBgY29ja3RhaWxfZGV0YWlsc2A7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBMSVNUX1RFTVBMQVRFICgpIHtcbiAgICAgICAgcmV0dXJuIGBjb2NrdGFpbHNfbGlzdGA7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBQT1BVTEFSX0lEUyAoKSB7XG4gICAgICAgIHJldHVybiBbMTEwMDAsIDExMDAxLCAxMTAwMiwgMTEwMDcsIDE3MjA3XTtcbiAgICB9XG5cbiAgICBzdGF0aWMgQVBJX1VSTCAoY2F0ZWdvcnksIGlkKSB7XG4gICAgICAgIGxldCBhcGkgPSBgaHR0cHM6Ly93d3cudGhlY29ja3RhaWxkYi5jb20vYXBpL2pzb24vdjEvMS9gO1xuICAgICAgICBsZXQgc3VmZml4ID0gdGhpcy5URVNUX01PREUgPyAnLmpzb24nIDogJy5waHAnOyBcbiAgICAgICAgbGV0IHF1ZXJ5ID0gYGA7XG4gICAgICAgIGxldCBkZXN0O1xuICAgICAgICBpZiAodGhpcy5URVNUX01PREUpIHtcbiAgICAgICAgICAgIGFwaSA9IGAvbG9jYWxfZGF0YWA7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlICdyYW5kb20nOlxuICAgICAgICAgICAgICAgIGRlc3QgPSBgcmFuZG9tYDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYnktaWQnOlxuICAgICAgICAgICAgICAgIGRlc3QgPSBgbG9va3VwYDtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IGA/aT0ke2lkfWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2ZpbHRlcic6XG4gICAgICAgICAgICAgICAgZGVzdCA9IGBmaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHF1ZXJ5ID0gYD9pPSR7aWR9YDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndmlyZ2luJzpcbiAgICAgICAgICAgICAgICBkZXN0ID0gYGZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSBgP2E9JHtpZH1gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHthcGl9JHtkZXN0fSR7c3VmZml4fSR7cXVlcnl9YDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0Q29ja3RhaWxEZXRhaWxzICh0eXBlLCBpZCkge1xuICAgICAgICBjb25zdCBzdWNjY2VzcyA9IChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICBVdGlscy5UZW1wbGF0ZUVuZ2luZS5jcmVhdGVIVE1MKGAke3RoaXMuREVUQUlMU19URU1QTEFURX1gLCB7IGRhdGE6IHJlc3VsdHMgfSwgJ2NvY2t0YWlsLWRhdGEnKTtcbiAgICAgICAgfTtcbiAgICAgICAgZmV0Y2goYCR7dGhpcy5BUElfVVJMKHR5cGUsIGlkKX1gKVxuXHRcdCAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG5cdFx0ICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1x0XG5cdFx0ICAgIH0pXG5cdFx0ICAgIC5jYXRjaChlID0+IHtcblx0XHRcdCAgICAvLyBUT0RPXG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0Q29ja3RhaWxzICgpIHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgICAgICBpZiAocXVlcnkgJiYgcXVlcnkuaW5kZXhPZignbGlzdD0nKSkge1xuICAgICAgICAgICAgY29uc3Qgc3BsaXRRdWVyeSA9IHF1ZXJ5LnNwbGl0KCdsaXN0PScpWzFdO1xuICAgICAgICAgICAgaWYgKHNwbGl0UXVlcnkgJiYgc3BsaXRRdWVyeS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsaXN0VHlwZSA9IHNwbGl0UXVlcnkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjY2VzcyA9IChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUuY3JlYXRlSFRNTChgJHt0aGlzLkxJU1RfVEVNUExBVEV9YCwgeyBkYXRhOiByZXN1bHRzIH0sICdjb2NrdGFpbC1kYXRhJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGxpc3RUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3BvcHVsYXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdXJscyA9IHRoaXMuUE9QVUxBUl9JRFMubWFwKGlkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmV0Y2goYCR7dGhpcy5BUElfVVJMKCdieS1pZCcsIGlkKX1gKS50aGVuKHZhbHVlID0+IHZhbHVlLmpzb24oKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuYWxsKHVybHMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd2aXJnaW4nOlxuICAgICAgICAgICAgICAgICAgICAgICAgZmV0Y2goYCR7dGhpcy5BUElfVVJMKCd2aXJnaW4nLCAnbm9uX2FsY29ob2xpYycpfWApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4odmFsdWUgPT4gdmFsdWUuanNvbigpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZldGNoKGAke3RoaXMuQVBJX1VSTCgnZmlsdGVyJywgbGlzdFR5cGUpfWApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4odmFsdWUgPT4gdmFsdWUuanNvbigpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL3dpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8nO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENvY2t0YWlsICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdzdGlsbCBjYWxsZWQnKTtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgICAgICBpZiAocXVlcnkgJiYgcXVlcnkuaW5kZXhPZignaWQ9JykpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0UXVlcnkgPSBxdWVyeS5zcGxpdCgnaWQ9JylbMV07XG4gICAgICAgICAgICBpZiAoc3BsaXRRdWVyeSAmJiBzcGxpdFF1ZXJ5Lmxlbmd0aCAmJiAocGFyc2VJbnQoc3BsaXRRdWVyeSkgfHwgc3BsaXRRdWVyeSA9PT0gJ3JhbmRvbScpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBzcGxpdFF1ZXJ5O1xuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gJ3JhbmRvbScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRDb2NrdGFpbERldGFpbHMoJ3JhbmRvbScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29ja3RhaWxEZXRhaWxzKCdieS1pZCcsIGlkKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnLyc7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgRHJpbmtzQVBJOyIsImltcG9ydCBEcmlua3NBUEkgZnJvbSAnLi9kcmlua3MtYXBpJztcbmltcG9ydCBVdGlscyBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBJbml0aWFsaXNlIG91ciBtYWluIGFwcCBjb2RlIHdoZW4gdGhlIERPTSBpcyByZWFkeVxuICovXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZXZlbnQgPT4ge1xuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgZHJhd2VyIGZ1bmN0aW9uYWxpdHkgZm9yIHNtYWxsZXIgc2NyZWVuIHNpemVzXG4gICAgICovXG4gICAgY29uc3QgRHJhd2VyID0gbmV3IFV0aWxzLkRyYXdlcigpO1xuICAgIERyYXdlci5pbml0KCk7XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBzaHJpbmtpbmcgaGVhZGVyXG4gICAgICovXG4gICAgY29uc3QgU2hyaW5rSGVhZGVyID0gbmV3IFV0aWxzLlNocmlua0hlYWRlcigpO1xuICAgIFNocmlua0hlYWRlci5pbml0KCk7XG5cbiAgICAvKipcbiAgICAgKiBBZGQgdGhlIGJhY2sgdG8gdG9wIGZ1bmN0aW9uYWxpdHlcbiAgICAgKi9cbiAgICBVdGlscy5iYWNrVG9Ub3AoKTtcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IHRoZSBzcGxhc2ggc2NyZWVuXG4gICAgICovXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzcGxhc2gtc2NyZWVuJykpIHtcbiAgICAgICAgVXRpbHMuc3RhcnRTcGxhc2goKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB3ZSdyZSBvbiBhIGxpc3QgcGFnZSwgcGFzcyBpdCB0byB0aGUgQVBJIGFuZCBsZXQgaXQgZGV0ZXJtaW5lIHdoYXQgdG8gc2hvd1xuICAgICAqL1xuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2F0ZWdvcnktbGlzdCcpKSB7XG4gICAgICAgIERyaW5rc0FQSS5nZXRDb2NrdGFpbHMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB3ZSdyZSBvbiBhIGRldGFpbCBwYWdlLCBwYXNzIGl0IHRvIHRoZSBBUEkgYW5kIGxldCBpdCBkZXRlcm1pbmUgd2hhdCB0byBzaG93XG4gICAgICovXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXRlZ29yeS1jb2NrdGFpbCcpKSB7XG4gICAgICAgIERyaW5rc0FQSS5nZXRDb2NrdGFpbCgpO1xuICAgIH1cblxuXG5cbiAgICAvLyBGaXJzdCB3ZSBnZXQgdGhlIHZpZXdwb3J0IGhlaWdodCBhbmQgd2UgbXVsdGlwbGUgaXQgYnkgMSUgdG8gZ2V0IGEgdmFsdWUgZm9yIGEgdmggdW5pdFxubGV0IHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbi8vIFRoZW4gd2Ugc2V0IHRoZSB2YWx1ZSBpbiB0aGUgLS12aCBjdXN0b20gcHJvcGVydHkgdG8gdGhlIHJvb3Qgb2YgdGhlIGRvY3VtZW50XG5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCBgJHt2aH1weGApO1xuY29uc29sZS53YXJuKHZoKTtcblxuXG5cbn0pOyIsIi8qKlxuICogVVRJTFMgQ0xBU1NcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIHVzZWQgYW55d2hlcmUgd2l0aGluIHRoZSBzaXRlXG4gKi9cbmNsYXNzIFV0aWxzIHt9XG5cbi8qKlxuICogU0hSSU5LSEVBREVSIENMQVNTXG4gKiBBZGRzIGEgY2xhc3MgdG8gdGhlIGJvZHkgd2hlbiBhIHVzZXIgc2Nyb2xscywgdG8gc2hyaW5rIHRoZSBoZWFkZXIgYW5kIHNob3cgbW9yZSBjb250ZW50XG4gKi9cblV0aWxzLlNocmlua0hlYWRlciA9IGNsYXNzIHtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQb3MgPSA2NDsgLy8gU2Nyb2xsIHBvc2l0aW9uLCBpbiBwaXhlbHMsIHdoZW4gdG8gdHJpZ2dlciB0aGUgc2hyaW5raW5nIGhlYWRlclxuICAgICAgICB0aGlzLnNocmlua0NsYXNzID0gJ2JvZHktLXNjcm9sbGVkJzsgLy8gQ2xhc3MgdG8gYWRkIHRvIHRoZSBib2R5XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgaGVhZGVyIHNjcmlwdFxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIGluaXQgKCkge1xuICAgICAgICAvLyBMaXN0ZW4gZm9yIHRoZSBzY3JvbGwgZXZlbnQgKi9cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGUgPT4ge1xuICAgICAgICAgICAgLy8gRXZlbnQgaGVhcmQuIENhbGwgdGhlIHNjcm9sbFBhZ2UgZnVuY3Rpb24gKi9cbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsUGFnZSgpO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdzY3JvbGxlZCcpO1xuICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgLy8gTm93IGNhbGwgdGhlIGZ1bmN0aW9uIGFueXdheSwgc28gd2Uga25vdyB3aGVyZSB3ZSBhcmUgYWZ0ZXIgcmVmcmVzaCwgZXRjXG4gICAgICAgIHRoaXMuc2Nyb2xsUGFnZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgdGhlIHNjcm9sbGVkIGNsYXNzXG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgc2Nyb2xsUGFnZSAoKSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICAvLyBHcmFiIHRoZSBsYXRlc3Qgc2Nyb2xsIHBvc2l0aW9uICovXG4gICAgICAgIGNvbnN0IHN5ID0gdGhpcy5zY3JvbGxlZFBvcygpO1xuICAgICAgICAvLyBDaGVjayBpZiB3ZSd2ZSBzY3JvbGxlZCBmYXIgZW5vdWdoXG4gICAgICAgIGlmIChzeSA+IHRoaXMuc2Nyb2xsUG9zKSB7XG4gICAgICAgICAgICAvLyBBZGQgdGhlIHNjcm9sbGVkIGNsYXNzXG4gICAgICAgICAgICBib2R5LmNsYXNzTGlzdC5hZGQodGhpcy5zaHJpbmtDbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBZGQgdGhlIHNjcm9sbGVkIGNsYXNzXG4gICAgICAgICAgICBib2R5LmNsYXNzTGlzdC5yZW1vdmUodGhpcy5zaHJpbmtDbGFzcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgcGFnZVxuICAgICAqIFxuICAgICAqIEByZXR1cm4gV2luZG93IHkgcG9zaXRpb25cbiAgICAgKi9cbiAgICBzY3JvbGxlZFBvcyAoKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcbiAgICB9XG59O1xuXG4vKipcbiAqIERSQVdFUiBDTEFTU1xuICogQWRkcyBhIG5hdmlnYXRpb24gZHJhd2VyIGZvciBzbWFsbGVyIHNjcmVlbnNcbiAqL1xuVXRpbHMuRHJhd2VyID0gY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLm1lbnVCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRvZ2dsZS1kcmF3ZXInKTsgLy8gR3JhYiBhbGwgZWxlbWVudHMgd2l0aCBhIHRvZ2dsZS1kcmF3ZXIgY2xhc3NcbiAgICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRyYXdlcicpOyAvLyBUaGUgZHJhd2VyIGl0c2VsZlxuICAgICAgICB0aGlzLmNsb2FrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nsb2FrJyk7IC8vIFRoZSBzaGFkZWQgb3ZlcmxheSB3aGVuIHRoZSBkcmF3ZXIgaXMgb3BlblxuICAgICAgICB0aGlzLmRyYXdlckNsYXNzID0gJ2JvZHktLWRyYXdlci12aXNpYmxlJzsgLy8gQ2xhc3MgdG8gYWRkIHRvIHRoZSBib2R5IHRvIHNsaWRlIHRoZSBkcmF3ZXIgaW4gYW5kIG91dFxuICAgICAgICB0aGlzLmJvZHkgPSBkb2N1bWVudC5ib2R5OyAvLyBHcmFiIGEgaGFuZGxlIG9uIHRoIGJvZHlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBkcmF3ZXIgc2NyaXB0XG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgaW5pdCAoKSB7XG4gICAgICAgIC8vIEFkZCBhIGNsaWNrIGV2ZW50IHRvIGV2ZXJ5IGVsZW1lbnQgd2l0aCB0aGUgdG9nZ2xlIGNsYXNzXG4gICAgICAgIC8vIFRoaXMgaXMgYSBub2RlIGxpc3QsIHNvIHR1cm4gaXQgaW50byBhbiBhcnJheSBmaXJzdFxuICAgICAgICBbXS5zbGljZS5jYWxsKHRoaXMubWVudUJ1dHRvbnMpLmZvckVhY2goYnRuID0+IHtcbiAgICAgICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGUgPT4ge1xuICAgICAgICAgICAgICAgIC8vIENhbGwgdGhlIHRvZ2dsZSBmdW5jdGlvblxuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlRHJhd2VyKClcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciBhIGNsaWNrIGV2ZW50IG9uIHRoZSBjbG9haywgdG8gY2xvc2UgdGhlIGRyYXdlclxuICAgICAgICB0aGlzLmNsb2FrLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgICAgICAgICAvLyBDYWxsIHRoZSB0b2dnbGUgZnVuY3Rpb25cbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRHJhd2VyKClcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBvciByZW1vdmUgdGhlIHRvZ2dsZSBjbGFzcyB0byBzaG93IHRoZSBkcmF3ZXJcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICB0b2dnbGVEcmF3ZXIgKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ2NsaWNrZWQnKTtcbiAgICAgICAgLy8gVG9nZ2xlIHRoZSBjbGFzc1xuICAgICAgICB0aGlzLmJvZHkuY2xhc3NMaXN0LnRvZ2dsZSh0aGlzLmRyYXdlckNsYXNzKTtcbiAgICAgICAgLy8gQ2FsbCB0aGUgYXJpYSBjaGFuZ2UgZnVuY3Rpb25cbiAgICAgICAgdGhpcy50b2dnbGVBcmlhQXR0cigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZXMgdGhlIEFSSUEgYXR0cmlidXRlIG9mIHRoZSBkcmF3ZXIuXG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgdG9nZ2xlQXJpYUF0dHIgKCkge1xuICAgICAgICBpZiAodGhpcy5ib2R5LmNsYXNzTGlzdC5jb250YWlucyh0aGlzLmRyYXdlckNsYXNzKSkge1xuICAgICAgICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuXG4vKipcbiAqIFRFTVBMQVRFRU5HSU5FIENMQVNTXG4gKiBDdXN0b20gbGlnaHR3ZWlnaHQgdGVtcGxhdGluZyBlbmdpbmUuXG4gKiBIZWF2aWx5IHRha2VuIGZyb206XG4gKiBKb2huIFJlc2lnIOKAkyBodHRwOi8vZWpvaG4ub3JnLyDigJMgTUlUIExpY2Vuc2VkXG4gKi9cblV0aWxzLlRlbXBsYXRlRW5naW5lID0gY2xhc3Mge1xuXG4gICAgLyoqXG4gICAgKiBTdG9yZXMgdGhlIHRlbXBsYXRlIGRhdGEsIHNvIHdlIGRvbid0IGtlZXAgcXVlcnlpbmcgdGhlIERPTVxuICAgICogXG4gICAgKiBAcmV0dXJuIEVtcHR5IG9iamVjdFxuICAgICovXG4gICAgc3RhdGljIGdldCBDQUNIRSAoKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFRha2VzIHRoZSB0ZW1wbGF0ZSwgbW9kZWwgYW5kIGRlc3RpbmF0aW9uIHRvIHBhc3Mgb24gdG8gdGhlIHRlbXBsYXRpbmcgZnVuY3Rpb25cbiAgICAqXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICB0ZW1wbGF0ZSAtIElEIG9mIHNjcmlwdCB0ZW1wbGF0ZVxuICAgICogQHBhcmFtIHtvYmplY3R9ICAgbW9kZWwgLSBEYXRhIG1vZGVsIHRvIHBhc3MgdG8gdGVtcGxhdGUgXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICBkZXN0aW5hdGlvbiAtIElEIG9mIHdoZXJlIHRoZSBmaW5pc2hlZCB0ZW1wbGF0ZSBpcyBnb2luZyB0byBnb1xuICAgICogXG4gICAgKkByZXR1cm4gdm9pZFxuICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUhUTUwgKHRlbXBsYXRlLCBtb2RlbCwgZGVzdGluYXRpb24pIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgY29uc29sZS53YXJuKGRlc3RpbmF0aW9uLCBlbGVtZW50KVxuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLnRlbXBsYXRlVG9IVE1MKHRlbXBsYXRlLCBtb2RlbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIENvbWJpbmVzIGR5bmFtaWMgZGF0YSB3aXRoIG91ciB0ZW1wbGF0ZXMgYW5kIHJldHVybnMgdGhlIHJlc3VsdFxuICAgICogSm9obiBSZXNpZyDigJMgaHR0cDovL2Vqb2huLm9yZy8g4oCTIE1JVCBMaWNlbnNlZFxuICAgICogXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gICBzdHIgLSBJRCBvZiBzY3JpcHQgdGVtcGxhdGVcbiAgICAqIEBwYXJhbSB7b2JqZWN0fSAgIGRhdGEgLSBEYXRhIG1vZGVsIHRvIHBhc3MgdG8gdGVtcGxhdGVcbiAgICAqIFxuICAgICogQHJldHVybiBUaGUgZmluaXNoZWQgdGVtcGxhdGVcbiAgICAqL1xuICAgIHN0YXRpYyB0ZW1wbGF0ZVRvSFRNTCAoc3RyLCBkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUud2Fybignc3RpbGwgaGVyZScpO1xuICAgICAgICBjb25zdCBmbiA9ICEvXFxXLy50ZXN0KHN0cikgP1xuICAgICAgICAgICAgdGhpcy5DQUNIRVtzdHJdID0gdGhpcy5DQUNIRVtzdHJdIHx8XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlVG9IVE1MKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHN0cikuaW5uZXJIVE1MKSA6XG5cbiAgICAgICAgICAgICAgICBuZXcgRnVuY3Rpb24oXCJvYmpcIiwgXCJ2YXIgcD1bXSxwcmludD1mdW5jdGlvbigpe3AucHVzaC5hcHBseShwLGFyZ3VtZW50cyk7fTtcIiArXG5cbiAgICAgICAgICAgICAgICBcIndpdGgob2JqKXtwLnB1c2goJ1wiICtcblxuICAgICAgICAgICAgICAgIHN0clxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvW1xcclxcdFxcbl0vZywgXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIjwlXCIpLmpvaW4oXCJcXHRcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLygoXnwlPilbXlxcdF0qKScvZywgXCIkMVxcclwiKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFx0PSguKj8pJT4vZywgXCInLCQxLCdcIilcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KFwiXFx0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5qb2luKFwiJyk7XCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIiU+XCIpXG4gICAgICAgICAgICAgICAgICAgIC5qb2luKFwicC5wdXNoKCdcIilcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KFwiXFxyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5qb2luKFwiXFxcXCdcIilcblxuICAgICAgICAgICAgICAgICAgICArIFwiJyk7fXJldHVybiBwLmpvaW4oJycpO1wiKTtcblxuICAgICAgICByZXR1cm4gZGF0YSA/IGZuKCBkYXRhICkgOiBmbjtcblxuICAgIH1cblxufTtcblxuLyoqXG4gKiBCYWNrIFRvIFRvcCBmdW5jdGlvbmFsaXR5XG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5iYWNrVG9Ub3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFjay10by10b3AnKTtcbiAgICBpZiAoZWwpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfVxufVxuXG4vKipcbiAqIFN0YXJ0cyB0aGUgc3BsYXNoIHNjcmVlbiBieSByZW1vdmluZyB0aGUgcGVuZGluZyBjbGFzcyBmcm9tIHRoZSBib2R5XG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5zdGFydFNwbGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBmaXJzdFRpbWVyID0gNTAwO1xuICAgIGNvbnN0IHNlY29uZFRpbWVyID0gMzAwMDtcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnc3BsYXNoLTEnKTtcbiAgICB9LCBmaXJzdFRpbWVyKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnc3BsYXNoLTInKTtcbiAgICB9LCBzZWNvbmRUaW1lcik7XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgVXRpbHM7Il19
