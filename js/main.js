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

  if (document.getElementById('category-list')) {
    _drinksApi2.default.getCocktails();
  }

  if (document.getElementById('category-cocktail')) {
    console.warn('OK');
    _drinksApi2.default.getCocktail();
  }
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
     */


    _createClass(_class, [{
        key: 'init',
        value: function init() {
            var _this = this;

            console.warn('init');
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
        */
        value: function createHTML(template, model, destination) {
            var element = document.getElementById(destination);
            if (element) {
                element.innerHTML = this.templateToHTML(template, model);
            }
        }

        /**
        * Combines dynamic data with our templates and returns the result
        * John Resig – http://ejohn.org/ – MIT Licensed
        */

    }, {
        key: 'templateToHTML',
        value: function templateToHTML(str, data) {
            var fn = !/\W/.test(str) ? this.CACHE[str] = this.CACHE[str] || this.templateToHTML(document.getElementById(str).innerHTML) : new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" + "with(obj){p.push('" + str.replace(/[\r\t\n]/g, " ").split("<%").join("\t").replace(/((^|%>)[^\t]*)'/g, "$1\r").replace(/\t=(.*?)%>/g, "',$1,'").split("\t").join("');").split("%>").join("p.push('").split("\r").join("\\'") + "');}return p.join('');");

            return data ? fn(data) : fn;
        }
    }, {
        key: 'CACHE',


        /**
        * Stores the template data, so we don't keep querying the DOM
        */
        get: function get() {
            return {};
        }
    }]);

    return _class3;
}();

/**
 * FIREBASE CLASS
 * Looks after the Firebase communication
 */
Utils.Firebase = function () {
    function _class4() {
        _classCallCheck(this, _class4);
    }

    _createClass(_class4, null, [{
        key: 'init',


        /**
        * Initialises the app
        */
        value: function init() {

            if (firebase.apps.length) {
                return;
            }

            var FirebaseConfig = {
                apiKey: 'AIzaSyD85xYzvb9MuFL0Qhl8rRo816ynrmyltAM',
                authDomain: 'magsmag-d7978.firebaseapp.com',
                projectId: 'magsmag-d7978'
            };

            firebase.initializeApp(FirebaseConfig);
            firebase.firestore().enablePersistence().catch(function (err) {});
        }
    }]);

    return _class4;
}();

exports.default = Utils;

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwic3JjL2pzL2RyaW5rcy1hcGkvaW5kZXguanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy91dGlscy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7Ozs7Ozs7O0FDQUE7Ozs7QUFDQTs7Ozs7O0lBRU0sUzs7Ozs7OztnQ0FrQmMsUSxFQUFVLEUsRUFBSTtBQUMxQixnQkFBSSxvREFBSjtBQUNBLGdCQUFJLFNBQVMsS0FBSyxTQUFMLEdBQWlCLE9BQWpCLEdBQTJCLE1BQXhDO0FBQ0EsZ0JBQUksVUFBSjtBQUNBLGdCQUFJLGFBQUo7QUFDQSxnQkFBSSxLQUFLLFNBQVQsRUFBb0I7QUFDaEI7QUFDSDtBQUNELG9CQUFPLFFBQVA7QUFDSSxxQkFBSyxRQUFMO0FBQ0k7QUFDSjtBQUNBLHFCQUFLLE9BQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBO0FBaEJKO0FBa0JBLHdCQUFVLEdBQVYsR0FBZ0IsSUFBaEIsR0FBdUIsTUFBdkIsR0FBZ0MsS0FBaEM7QUFDSDs7OzJDQUUwQixJLEVBQU0sRSxFQUFJO0FBQUE7O0FBQ2pDLGdCQUFNLFdBQVcsU0FBWCxRQUFXLENBQUMsT0FBRCxFQUFhO0FBQzFCLGdDQUFNLGNBQU4sQ0FBcUIsVUFBckIsTUFBbUMsTUFBSyxnQkFBeEMsRUFBNEQsRUFBRSxNQUFNLE9BQVIsRUFBNUQsRUFBK0UsZUFBL0U7QUFDSCxhQUZEO0FBR0EsdUJBQVMsS0FBSyxPQUFMLENBQWEsSUFBYixFQUFtQixFQUFuQixDQUFULEVBQ0QsSUFEQyxDQUNJO0FBQUEsdUJBQVksU0FBUyxJQUFULEVBQVo7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SUFGakIsQ0FFc0IsSUFGdEIsRUFHSyxPQUhMLENBR2Esa0JBSGIsRUFHaUMsTUFIakMsRUFJSyxPQUpMLENBSWEsYUFKYixFQUk0QixRQUo1QixFQUtLLEtBTEwsQ0FLVyxJQUxYLEVBTUssSUFOTCxDQU1VLEtBTlYsRUFPSyxLQVBMLENBT1csSUFQWCxFQVFLLElBUkwsQ0FRVSxVQVJWLEVBU0ssS0FUTCxDQVNXLElBVFgsRUFVSyxJQVZMLENBVVUsS0FWVixDQUpvQixHQWdCZCx3QkFoQk4sQ0FKUjs7QUFzQkEsbUJBQU8sT0FBTyxHQUFJLElBQUosQ0FBUCxHQUFvQixFQUEzQjtBQUVIO0FBaERMO0FBQUE7OztBQUVJOzs7QUFGSiw0QkFLd0I7QUFDaEIsbUJBQU8sRUFBUDtBQUNIO0FBUEw7O0FBQUE7QUFBQTs7QUFvREE7Ozs7QUFJQSxNQUFNLFFBQU47QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTs7O0FBRUk7OztBQUZKLCtCQUttQjs7QUFFWCxnQkFBSSxTQUFTLElBQVQsQ0FBYyxNQUFsQixFQUEwQjtBQUN0QjtBQUNIOztBQUVELGdCQUFNLGlCQUFpQjtBQUNuQix3QkFBUSx5Q0FEVztBQUVuQiw0QkFBWSwrQkFGTztBQUduQiwyQkFBVztBQUhRLGFBQXZCOztBQU1BLHFCQUFTLGFBQVQsQ0FBdUIsY0FBdkI7QUFDQSxxQkFBUyxTQUFULEdBQXFCLGlCQUFyQixHQUNLLEtBREwsQ0FDVyxVQUFTLEdBQVQsRUFBYyxDQUFFLENBRDNCO0FBRUg7QUFwQkw7O0FBQUE7QUFBQTs7a0JBeUJlLEsiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIiLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgdXJsIH0gZnJvbSAnaW5zcGVjdG9yJztcblxuY2xhc3MgRHJpbmtzQVBJIHtcblxuICAgIHN0YXRpYyBnZXQgVEVTVF9NT0RFICgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgREVUQUlMU19URU1QTEFURSAoKSB7XG4gICAgICAgIHJldHVybiBgY29ja3RhaWxfZGV0YWlsc2A7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBMSVNUX1RFTVBMQVRFICgpIHtcbiAgICAgICAgcmV0dXJuIGBjb2NrdGFpbHNfbGlzdGA7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBQT1BVTEFSX0lEUyAoKSB7XG4gICAgICAgIHJldHVybiBbMTEwMDAsIDExMDAxLCAxMTAwMiwgMTEwMDcsIDE3MjA3XTtcbiAgICB9XG5cbiAgICBzdGF0aWMgQVBJX1VSTCAoY2F0ZWdvcnksIGlkKSB7XG4gICAgICAgIGxldCBhcGkgPSBgaHR0cHM6Ly93d3cudGhlY29ja3RhaWxkYi5jb20vYXBpL2pzb24vdjEvMS9gO1xuICAgICAgICBsZXQgc3VmZml4ID0gdGhpcy5URVNUX01PREUgPyAnLmpzb24nIDogJy5waHAnOyBcbiAgICAgICAgbGV0IHF1ZXJ5ID0gYGA7XG4gICAgICAgIGxldCBkZXN0O1xuICAgICAgICBpZiAodGhpcy5URVNUX01PREUpIHtcbiAgICAgICAgICAgIGFwaSA9IGAvbG9jYWxfZGF0YWA7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlICdyYW5kb20nOlxuICAgICAgICAgICAgICAgIGRlc3QgPSBgcmFuZG9tYDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYnktaWQnOlxuICAgICAgICAgICAgICAgIGRlc3QgPSBgbG9va3VwYDtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IGA/aT0ke2lkfWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2ZpbHRlcic6XG4gICAgICAgICAgICAgICAgZGVzdCA9IGBmaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHF1ZXJ5ID0gYD9pPSR7aWR9YDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndmlyZ2luJzpcbiAgICAgICAgICAgICAgICBkZXN0ID0gYGZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSBgP2E9JHtpZH1gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHthcGl9JHtkZXN0fSR7c3VmZml4fSR7cXVlcnl9YDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0Q29ja3RhaWxEZXRhaWxzICh0eXBlLCBpZCkge1xuICAgICAgICBjb25zdCBzdWNjY2VzcyA9IChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICBVdGlscy5UZW1wbGF0ZUVuZ2luZS5jcmVhdGVIVE1MKGAke3RoaXMuREVUQUlMU19URU1QTEFURX1gLCB7IGRhdGE6IHJlc3VsdHMgfSwgJ2NvY2t0YWlsLWRhdGEnKTtcbiAgICAgICAgfTtcbiAgICAgICAgZmV0Y2goYCR7dGhpcy5BUElfVVJMKHR5cGUsIGlkKX1gKVxuXHRcdCAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG5cdFx0ICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1x0XG5cdFx0ICAgIH0pXG5cdFx0ICAgIC5jYXRjaChlID0+IHtcblx0XHRcdCAgICAvLyBUT0RPXG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0Q29ja3RhaWxzICgpIHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgICAgICBpZiAocXVlcnkgJiYgcXVlcnkuaW5kZXhPZignbGlzdD0nKSkge1xuICAgICAgICAgICAgY29uc3Qgc3BsaXRRdWVyeSA9IHF1ZXJ5LnNwbGl0KCdsaXN0PScpWzFdO1xuICAgICAgICAgICAgaWYgKHNwbGl0UXVlcnkgJiYgc3BsaXRRdWVyeS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsaXN0VHlwZSA9IHNwbGl0UXVlcnkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjY2VzcyA9IChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUuY3JlYXRlSFRNTChgJHt0aGlzLkxJU1RfVEVNUExBVEV9YCwgeyBkYXRhOiByZXN1bHRzIH0sICdjb2NrdGFpbC1kYXRhJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGxpc3RUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3BvcHVsYXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdXJscyA9IHRoaXMuUE9QVUxBUl9JRFMubWFwKGlkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmV0Y2goYCR7dGhpcy5BUElfVVJMKCdieS1pZCcsIGlkKX1gKS50aGVuKHZhbHVlID0+IHZhbHVlLmpzb24oKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuYWxsKHVybHMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd2aXJnaW4nOlxuICAgICAgICAgICAgICAgICAgICAgICAgZmV0Y2goYCR7dGhpcy5BUElfVVJMKCd2aXJnaW4nLCAnbm9uX2FsY29ob2xpYycpfWApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4odmFsdWUgPT4gdmFsdWUuanNvbigpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZldGNoKGAke3RoaXMuQVBJX1VSTCgnZmlsdGVyJywgbGlzdFR5cGUpfWApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4odmFsdWUgPT4gdmFsdWUuanNvbigpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL3dpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8nO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENvY2t0YWlsICgpIHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgICAgICBpZiAocXVlcnkgJiYgcXVlcnkuaW5kZXhPZignaWQ9JykpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0UXVlcnkgPSBxdWVyeS5zcGxpdCgnaWQ9JylbMV07XG4gICAgICAgICAgICBpZiAoc3BsaXRRdWVyeSAmJiBzcGxpdFF1ZXJ5Lmxlbmd0aCAmJiAocGFyc2VJbnQoc3BsaXRRdWVyeSkgfHwgc3BsaXRRdWVyeSA9PT0gJ3JhbmRvbScpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBzcGxpdFF1ZXJ5O1xuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gJ3JhbmRvbScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRDb2NrdGFpbERldGFpbHMoJ3JhbmRvbScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29ja3RhaWxEZXRhaWxzKCdieS1pZCcsIGlkKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnLyc7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgRHJpbmtzQVBJOyIsImltcG9ydCBEcmlua3NBUEkgZnJvbSAnLi9kcmlua3MtYXBpJztcbmltcG9ydCBVdGlscyBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBJbml0aWFsaXNlIG91ciBtYWluIGFwcCBjb2RlIHdoZW4gdGhlIERPTSBpcyByZWFkeVxuICovXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZXZlbnQgPT4ge1xuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgZHJhd2VyIGZ1bmN0aW9uYWxpdHkgZm9yIHNtYWxsZXIgc2NyZWVuIHNpemVzXG4gICAgICovXG4gICAgY29uc3QgRHJhd2VyID0gbmV3IFV0aWxzLkRyYXdlcigpO1xuICAgIERyYXdlci5pbml0KCk7XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBzaHJpbmtpbmcgaGVhZGVyXG4gICAgICovXG4gICAgY29uc3QgU2hyaW5rSGVhZGVyID0gbmV3IFV0aWxzLlNocmlua0hlYWRlcigpO1xuICAgIFNocmlua0hlYWRlci5pbml0KCk7XG5cbiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhdGVnb3J5LWxpc3QnKSkge1xuICAgICAgICBEcmlua3NBUEkuZ2V0Q29ja3RhaWxzKCk7XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXRlZ29yeS1jb2NrdGFpbCcpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignT0snKTtcbiAgICAgICAgRHJpbmtzQVBJLmdldENvY2t0YWlsKCk7XG4gICAgfVxuXG59KTsiLCIvKipcbiAqIFVUSUxTIENMQVNTXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyB1c2VkIGFueXdoZXJlIHdpdGhpbiB0aGUgc2l0ZVxuICovXG5jbGFzcyBVdGlscyB7fVxuXG4vKipcbiAqIFNIUklOS0hFQURFUiBDTEFTU1xuICogQWRkcyBhIGNsYXNzIHRvIHRoZSBib2R5IHdoZW4gYSB1c2VyIHNjcm9sbHMsIHRvIHNocmluayB0aGUgaGVhZGVyIGFuZCBzaG93IG1vcmUgY29udGVudFxuICovXG5VdGlscy5TaHJpbmtIZWFkZXIgPSBjbGFzcyB7XG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUG9zID0gNjQ7IC8vIFNjcm9sbCBwb3NpdGlvbiwgaW4gcGl4ZWxzLCB3aGVuIHRvIHRyaWdnZXIgdGhlIHNocmlua2luZyBoZWFkZXJcbiAgICAgICAgdGhpcy5zaHJpbmtDbGFzcyA9ICdib2R5LS1zY3JvbGxlZCc7IC8vIENsYXNzIHRvIGFkZCB0byB0aGUgYm9keVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2UgdGhlIGhlYWRlciBzY3JpcHRcbiAgICAgKi9cbiAgICBpbml0ICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdpbml0Jyk7XG4gICAgICAgIC8vIExpc3RlbiBmb3IgdGhlIHNjcm9sbCBldmVudCAqL1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgZSA9PiB7XG4gICAgICAgICAgICAvLyBFdmVudCBoZWFyZC4gQ2FsbCB0aGUgc2Nyb2xsUGFnZSBmdW5jdGlvbiAqL1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxQYWdlKCk7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3Njcm9sbGVkJyk7XG4gICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAvLyBOb3cgY2FsbCB0aGUgZnVuY3Rpb24gYW55d2F5LCBzbyB3ZSBrbm93IHdoZXJlIHdlIGFyZSBhZnRlciByZWZyZXNoLCBldGNcbiAgICAgICAgdGhpcy5zY3JvbGxQYWdlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyB0aGUgc2Nyb2xsZWQgY2xhc3NcbiAgICAgKi9cbiAgICBzY3JvbGxQYWdlICgpIHtcbiAgICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIC8vIEdyYWIgdGhlIGxhdGVzdCBzY3JvbGwgcG9zaXRpb24gKi9cbiAgICAgICAgY29uc3Qgc3kgPSB0aGlzLnNjcm9sbGVkUG9zKCk7XG4gICAgICAgIC8vIENoZWNrIGlmIHdlJ3ZlIHNjcm9sbGVkIGZhciBlbm91Z2hcbiAgICAgICAgaWYgKHN5ID4gdGhpcy5zY3JvbGxQb3MpIHtcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgc2Nyb2xsZWQgY2xhc3NcbiAgICAgICAgICAgIGJvZHkuY2xhc3NMaXN0LmFkZCh0aGlzLnNocmlua0NsYXNzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgc2Nyb2xsZWQgY2xhc3NcbiAgICAgICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLnNocmlua0NsYXNzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBwYWdlXG4gICAgICovXG4gICAgc2Nyb2xsZWRQb3MgKCkge1xuICAgICAgICByZXR1cm4gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7XG4gICAgfVxufTtcblxuLyoqXG4gKiBEUkFXRVIgQ0xBU1NcbiAqIEFkZHMgYSBuYXZpZ2F0aW9uIGRyYXdlciBmb3Igc21hbGxlciBzY3JlZW5zXG4gKi9cblV0aWxzLkRyYXdlciA9IGNsYXNzIHtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5tZW51QnV0dG9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50b2dnbGUtZHJhd2VyJyk7IC8vIEdyYWIgYWxsIGVsZW1lbnRzIHdpdGggYSB0b2dnbGUtZHJhd2VyIGNsYXNzXG4gICAgICAgIHRoaXMuZHJhd2VyRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kcmF3ZXInKTsgLy8gVGhlIGRyYXdlciBpdHNlbGZcbiAgICAgICAgdGhpcy5jbG9hayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjbG9haycpOyAvLyBUaGUgc2hhZGVkIG92ZXJsYXkgd2hlbiB0aGUgZHJhd2VyIGlzIG9wZW5cbiAgICAgICAgdGhpcy5kcmF3ZXJDbGFzcyA9ICdib2R5LS1kcmF3ZXItdmlzaWJsZSc7IC8vIENsYXNzIHRvIGFkZCB0byB0aGUgYm9keSB0byBzbGlkZSB0aGUgZHJhd2VyIGluIGFuZCBvdXRcbiAgICAgICAgdGhpcy5ib2R5ID0gZG9jdW1lbnQuYm9keTsgLy8gR3JhYiBhIGhhbmRsZSBvbiB0aCBib2R5XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgZHJhd2VyIHNjcmlwdFxuICAgICAqL1xuICAgIGluaXQgKCkge1xuICAgICAgICAvLyBBZGQgYSBjbGljayBldmVudCB0byBldmVyeSBlbGVtZW50IHdpdGggdGhlIHRvZ2dsZSBjbGFzc1xuICAgICAgICAvLyBUaGlzIGlzIGEgbm9kZSBsaXN0LCBzbyB0dXJuIGl0IGludG8gYW4gYXJyYXkgZmlyc3RcbiAgICAgICAgW10uc2xpY2UuY2FsbCh0aGlzLm1lbnVCdXR0b25zKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgICAgICAgICAgICAvLyBDYWxsIHRoZSB0b2dnbGUgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZURyYXdlcigpXG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgYSBjbGljayBldmVudCBvbiB0aGUgY2xvYWssIHRvIGNsb3NlIHRoZSBkcmF3ZXJcbiAgICAgICAgdGhpcy5jbG9hay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGUgPT4ge1xuICAgICAgICAgICAgLy8gQ2FsbCB0aGUgdG9nZ2xlIGZ1bmN0aW9uXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZURyYXdlcigpXG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgb3IgcmVtb3ZlIHRoZSB0b2dnbGUgY2xhc3MgdG8gc2hvdyB0aGUgZHJhd2VyXG4gICAgICovXG4gICAgdG9nZ2xlRHJhd2VyICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdjbGlja2VkJyk7XG4gICAgICAgIC8vIFRvZ2dsZSB0aGUgY2xhc3NcbiAgICAgICAgdGhpcy5ib2R5LmNsYXNzTGlzdC50b2dnbGUodGhpcy5kcmF3ZXJDbGFzcyk7XG4gICAgICAgIC8vIENhbGwgdGhlIGFyaWEgY2hhbmdlIGZ1bmN0aW9uXG4gICAgICAgIHRoaXMudG9nZ2xlQXJpYUF0dHIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGVzIHRoZSBBUklBIGF0dHJpYnV0ZSBvZiB0aGUgZHJhd2VyLlxuICAgICAqL1xuICAgIHRvZ2dsZUFyaWFBdHRyICgpIHtcbiAgICAgICAgaWYgKHRoaXMuYm9keS5jbGFzc0xpc3QuY29udGFpbnModGhpcy5kcmF3ZXJDbGFzcykpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcblxuLyoqXG4gKiBURU1QTEFURUVOR0lORSBDTEFTU1xuICogQ3VzdG9tIGxpZ2h0d2VpZ2h0IHRlbXBsYXRpbmcgZW5naW5lLlxuICogSGVhdmlseSB0YWtlbiBmcm9tOlxuICogSm9obiBSZXNpZyDigJMgaHR0cDovL2Vqb2huLm9yZy8g4oCTIE1JVCBMaWNlbnNlZFxuICovXG5VdGlscy5UZW1wbGF0ZUVuZ2luZSA9IGNsYXNzIHtcblxuICAgIC8qKlxuICAgICogU3RvcmVzIHRoZSB0ZW1wbGF0ZSBkYXRhLCBzbyB3ZSBkb24ndCBrZWVwIHF1ZXJ5aW5nIHRoZSBET01cbiAgICAqL1xuICAgIHN0YXRpYyBnZXQgQ0FDSEUgKCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBUYWtlcyB0aGUgdGVtcGxhdGUsIG1vZGVsIGFuZCBkZXN0aW5hdGlvbiB0byBwYXNzIG9uIHRvIHRoZSB0ZW1wbGF0aW5nIGZ1bmN0aW9uXG4gICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlSFRNTCAodGVtcGxhdGUsIG1vZGVsLCBkZXN0aW5hdGlvbikge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVzdGluYXRpb24pO1xuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLnRlbXBsYXRlVG9IVE1MKHRlbXBsYXRlLCBtb2RlbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIENvbWJpbmVzIGR5bmFtaWMgZGF0YSB3aXRoIG91ciB0ZW1wbGF0ZXMgYW5kIHJldHVybnMgdGhlIHJlc3VsdFxuICAgICogSm9obiBSZXNpZyDigJMgaHR0cDovL2Vqb2huLm9yZy8g4oCTIE1JVCBMaWNlbnNlZFxuICAgICovXG4gICAgc3RhdGljIHRlbXBsYXRlVG9IVE1MIChzdHIsIGRhdGEpIHtcbiAgICAgICAgY29uc3QgZm4gPSAhL1xcVy8udGVzdChzdHIpID9cbiAgICAgICAgICAgIHRoaXMuQ0FDSEVbc3RyXSA9IHRoaXMuQ0FDSEVbc3RyXSB8fFxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZVRvSFRNTChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdHIpLmlubmVySFRNTCkgOlxuXG4gICAgICAgICAgICAgICAgbmV3IEZ1bmN0aW9uKFwib2JqXCIsIFwidmFyIHA9W10scHJpbnQ9ZnVuY3Rpb24oKXtwLnB1c2guYXBwbHkocCxhcmd1bWVudHMpO307XCIgK1xuXG4gICAgICAgICAgICAgICAgXCJ3aXRoKG9iail7cC5wdXNoKCdcIiArXG5cbiAgICAgICAgICAgICAgICBzdHJcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1tcXHJcXHRcXG5dL2csIFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCI8JVwiKS5qb2luKFwiXFx0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oKF58JT4pW15cXHRdKiknL2csIFwiJDFcXHJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcdD0oLio/KSU+L2csIFwiJywkMSwnXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIlxcdFwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcIicpO1wiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCIlPlwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcInAucHVzaCgnXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIlxcclwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcIlxcXFwnXCIpXG5cbiAgICAgICAgICAgICAgICAgICAgKyBcIicpO31yZXR1cm4gcC5qb2luKCcnKTtcIik7XG5cbiAgICAgICAgcmV0dXJuIGRhdGEgPyBmbiggZGF0YSApIDogZm47XG5cbiAgICB9XG5cbn07XG5cbi8qKlxuICogRklSRUJBU0UgQ0xBU1NcbiAqIExvb2tzIGFmdGVyIHRoZSBGaXJlYmFzZSBjb21tdW5pY2F0aW9uXG4gKi9cblV0aWxzLkZpcmViYXNlID0gY2xhc3Mge1xuXG4gICAgLyoqXG4gICAgKiBJbml0aWFsaXNlcyB0aGUgYXBwXG4gICAgKi9cbiAgICBzdGF0aWMgaW5pdCAoKSB7XG5cbiAgICAgICAgaWYgKGZpcmViYXNlLmFwcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBGaXJlYmFzZUNvbmZpZyA9IHtcbiAgICAgICAgICAgIGFwaUtleTogJ0FJemFTeUQ4NXhZenZiOU11RkwwUWhsOHJSbzgxNnlucm15bHRBTScsXG4gICAgICAgICAgICBhdXRoRG9tYWluOiAnbWFnc21hZy1kNzk3OC5maXJlYmFzZWFwcC5jb20nLFxuICAgICAgICAgICAgcHJvamVjdElkOiAnbWFnc21hZy1kNzk3OCdcbiAgICAgICAgfTtcblxuICAgICAgICBmaXJlYmFzZS5pbml0aWFsaXplQXBwKEZpcmViYXNlQ29uZmlnKTtcbiAgICAgICAgZmlyZWJhc2UuZmlyZXN0b3JlKCkuZW5hYmxlUGVyc2lzdGVuY2UoKVxuICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge30pO1xuICAgIH1cblxufTtcblxuXG5leHBvcnQgZGVmYXVsdCBVdGlsczsiXX0=
