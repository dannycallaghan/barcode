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

  _utils2.default.backToTop();

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

exports.default = Utils;

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwic3JjL2pzL2RyaW5rcy1hcGkvaW5kZXguanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy91dGlscy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7Ozs7Ozs7O0FDQUE7Ozs7QUFDQTs7Ozs7O0lBRU0sUzs7Ozs7OztnQ0FrQmMsUSxFQUFVLEUsRUFBSTtBQUMxQixnQkFBSSxvREFBSjtBQUNBLGdCQUFJLFNBQVMsS0FBSyxTQUFMLEdBQWlCLE9BQWpCLEdBQTJCLE1BQXhDO0FBQ0EsZ0JBQUksVUFBSjtBQUNBLGdCQUFJLGFBQUo7QUFDQSxnQkFBSSxLQUFLLFNBQVQsRUFBb0I7QUFDaEI7QUFDSDtBQUNELG9CQUFPLFFBQVA7QUFDSSxxQkFBSyxRQUFMO0FBQ0k7QUFDSjtBQUNBLHFCQUFLLE9BQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBO0FBaEJKO0FBa0JBLHdCQUFVLEdBQVYsR0FBZ0IsSUFBaEIsR0FBdUIsTUFBdkIsR0FBZ0MsS0FBaEM7QUFDSDs7OzJDQUUwQixJLEVBQU0sRSxFQUFJO0FBQUE7O0FBQ2pDLGdCQUFNLFdBQVcsU0FBWCxRQUFXLENBQUMsT0FBRCxFQUFhO0FBQzFCLGdDQUFNLGNBQU4sQ0FBcUIsVUFBckIsTUFBbUMsTUFBSyxnQkFBeEMsRUFBNEQsRUFBRSxNQUFNLE9BQVIsRUFBNUQsRUFBK0UsZUFBL0U7QUFDSCxhQUZEO0FBR0EsdUJBQVMsS0FBSyxPQUFMLENBQWEsSUFBYixFQUFtQixFQUFuQixDQUFULEVBQ0QsSUFEQyxDQUNJO0FBQUEsdUJBQVksU0FBUyxJQUFULEVBQVo7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S0FGTCxDQUVXLElBRlgsRUFFaUIsSUFGakIsQ0FFc0IsSUFGdEIsRUFHSyxPQUhMLENBR2Esa0JBSGIsRUFHaUMsTUFIakMsRUFJSyxPQUpMLENBSWEsYUFKYixFQUk0QixRQUo1QixFQUtLLEtBTEwsQ0FLVyxJQUxYLEVBTUssSUFOTCxDQU1VLEtBTlYsRUFPSyxLQVBMLENBT1csSUFQWCxFQVFLLElBUkwsQ0FRVSxVQVJWLEVBU0ssS0FUTCxDQVNXLElBVFgsRUFVSyxJQVZMLENBVVUsS0FWVixDQUpvQixHQWdCZCx3QkFoQk4sQ0FKUjs7QUFzQkEsbUJBQU8sT0FBTyxHQUFJLElBQUosQ0FBUCxHQUFvQixFQUEzQjtBQUVIO0FBN0RMO0FBQUE7OztBQUVJOzs7OztBQUZKLDRCQU93QjtBQUNoQixtQkFBTyxFQUFQO0FBQ0g7QUFUTDs7QUFBQTtBQUFBOztBQWlFQTs7Ozs7QUFLQSxNQUFNLFNBQU4sR0FBa0IsWUFBWTtBQUMxQixRQUFNLEtBQUssU0FBUyxjQUFULENBQXdCLGFBQXhCLENBQVg7QUFDQSxRQUFJLEVBQUosRUFBUTtBQUNKLFdBQUcsZ0JBQUgsQ0FBb0IsT0FBcEIsRUFBNkIsVUFBQyxDQUFELEVBQU87QUFDaEMsbUJBQU8sUUFBUCxDQUFnQixDQUFoQixFQUFtQixDQUFuQjtBQUNBLGNBQUUsY0FBRjtBQUNILFNBSEQsRUFHRyxLQUhIO0FBSUg7QUFDSixDQVJEOztrQkFXZSxLIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiIiwiaW1wb3J0IFV0aWxzIGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IHVybCB9IGZyb20gJ2luc3BlY3Rvcic7XG5cbmNsYXNzIERyaW5rc0FQSSB7XG5cbiAgICBzdGF0aWMgZ2V0IFRFU1RfTU9ERSAoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IERFVEFJTFNfVEVNUExBVEUgKCkge1xuICAgICAgICByZXR1cm4gYGNvY2t0YWlsX2RldGFpbHNgO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgTElTVF9URU1QTEFURSAoKSB7XG4gICAgICAgIHJldHVybiBgY29ja3RhaWxzX2xpc3RgO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgUE9QVUxBUl9JRFMgKCkge1xuICAgICAgICByZXR1cm4gWzExMDAwLCAxMTAwMSwgMTEwMDIsIDExMDA3LCAxNzIwN107XG4gICAgfVxuXG4gICAgc3RhdGljIEFQSV9VUkwgKGNhdGVnb3J5LCBpZCkge1xuICAgICAgICBsZXQgYXBpID0gYGh0dHBzOi8vd3d3LnRoZWNvY2t0YWlsZGIuY29tL2FwaS9qc29uL3YxLzEvYDtcbiAgICAgICAgbGV0IHN1ZmZpeCA9IHRoaXMuVEVTVF9NT0RFID8gJy5qc29uJyA6ICcucGhwJzsgXG4gICAgICAgIGxldCBxdWVyeSA9IGBgO1xuICAgICAgICBsZXQgZGVzdDtcbiAgICAgICAgaWYgKHRoaXMuVEVTVF9NT0RFKSB7XG4gICAgICAgICAgICBhcGkgPSBgL2xvY2FsX2RhdGFgO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaChjYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSAncmFuZG9tJzpcbiAgICAgICAgICAgICAgICBkZXN0ID0gYHJhbmRvbWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2J5LWlkJzpcbiAgICAgICAgICAgICAgICBkZXN0ID0gYGxvb2t1cGA7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSBgP2k9JHtpZH1gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdmaWx0ZXInOlxuICAgICAgICAgICAgICAgIGRlc3QgPSBgZmlsdGVyYDtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IGA/aT0ke2lkfWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3Zpcmdpbic6XG4gICAgICAgICAgICAgICAgZGVzdCA9IGBmaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHF1ZXJ5ID0gYD9hPSR7aWR9YDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7YXBpfSR7ZGVzdH0ke3N1ZmZpeH0ke3F1ZXJ5fWA7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENvY2t0YWlsRGV0YWlscyAodHlwZSwgaWQpIHtcbiAgICAgICAgY29uc3Qgc3VjY2Nlc3MgPSAocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUuY3JlYXRlSFRNTChgJHt0aGlzLkRFVEFJTFNfVEVNUExBVEV9YCwgeyBkYXRhOiByZXN1bHRzIH0sICdjb2NrdGFpbC1kYXRhJyk7XG4gICAgICAgIH07XG4gICAgICAgIGZldGNoKGAke3RoaXMuQVBJX1VSTCh0eXBlLCBpZCl9YClcblx0XHQgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuXHRcdCAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcdFxuXHRcdCAgICB9KVxuXHRcdCAgICAuY2F0Y2goZSA9PiB7XG5cdFx0XHQgICAgLy8gVE9ET1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENvY2t0YWlscyAoKSB7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaDtcbiAgICAgICAgaWYgKHF1ZXJ5ICYmIHF1ZXJ5LmluZGV4T2YoJ2xpc3Q9JykpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0UXVlcnkgPSBxdWVyeS5zcGxpdCgnbGlzdD0nKVsxXTtcbiAgICAgICAgICAgIGlmIChzcGxpdFF1ZXJ5ICYmIHNwbGl0UXVlcnkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGlzdFR5cGUgPSBzcGxpdFF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2Nlc3MgPSAocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4ocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLlRlbXBsYXRlRW5naW5lLmNyZWF0ZUhUTUwoYCR7dGhpcy5MSVNUX1RFTVBMQVRFfWAsIHsgZGF0YTogcmVzdWx0cyB9LCAnY29ja3RhaWwtZGF0YScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc3dpdGNoIChsaXN0VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdwb3B1bGFyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybHMgPSB0aGlzLlBPUFVMQVJfSURTLm1hcChpZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZldGNoKGAke3RoaXMuQVBJX1VSTCgnYnktaWQnLCBpZCl9YCkudGhlbih2YWx1ZSA9PiB2YWx1ZS5qc29uKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLmFsbCh1cmxzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndmlyZ2luJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZldGNoKGAke3RoaXMuQVBJX1VSTCgndmlyZ2luJywgJ25vbl9hbGNvaG9saWMnKX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHZhbHVlID0+IHZhbHVlLmpzb24oKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Nlc3MocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBmZXRjaChgJHt0aGlzLkFQSV9VUkwoJ2ZpbHRlcicsIGxpc3RUeXBlKX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHZhbHVlID0+IHZhbHVlLmpzb24oKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Nlc3MocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy93aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvJztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRDb2NrdGFpbCAoKSB7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaDtcbiAgICAgICAgaWYgKHF1ZXJ5ICYmIHF1ZXJ5LmluZGV4T2YoJ2lkPScpKSB7XG4gICAgICAgICAgICBjb25zdCBzcGxpdFF1ZXJ5ID0gcXVlcnkuc3BsaXQoJ2lkPScpWzFdO1xuICAgICAgICAgICAgaWYgKHNwbGl0UXVlcnkgJiYgc3BsaXRRdWVyeS5sZW5ndGggJiYgKHBhcnNlSW50KHNwbGl0UXVlcnkpIHx8IHNwbGl0UXVlcnkgPT09ICdyYW5kb20nKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gc3BsaXRRdWVyeTtcbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09ICdyYW5kb20nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29ja3RhaWxEZXRhaWxzKCdyYW5kb20nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmdldENvY2t0YWlsRGV0YWlscygnYnktaWQnLCBpZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8nO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IERyaW5rc0FQSTsiLCJpbXBvcnQgRHJpbmtzQVBJIGZyb20gJy4vZHJpbmtzLWFwaSc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogSW5pdGlhbGlzZSBvdXIgbWFpbiBhcHAgY29kZSB3aGVuIHRoZSBET00gaXMgcmVhZHlcbiAqL1xuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGV2ZW50ID0+IHtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2UgdGhlIGRyYXdlciBmdW5jdGlvbmFsaXR5IGZvciBzbWFsbGVyIHNjcmVlbiBzaXplc1xuICAgICAqL1xuICAgIGNvbnN0IERyYXdlciA9IG5ldyBVdGlscy5EcmF3ZXIoKTtcbiAgICBEcmF3ZXIuaW5pdCgpO1xuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgc2hyaW5raW5nIGhlYWRlclxuICAgICAqL1xuICAgIGNvbnN0IFNocmlua0hlYWRlciA9IG5ldyBVdGlscy5TaHJpbmtIZWFkZXIoKTtcbiAgICBTaHJpbmtIZWFkZXIuaW5pdCgpO1xuXG4gICAgVXRpbHMuYmFja1RvVG9wKCk7XG5cbiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhdGVnb3J5LWxpc3QnKSkge1xuICAgICAgICBEcmlua3NBUEkuZ2V0Q29ja3RhaWxzKCk7XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXRlZ29yeS1jb2NrdGFpbCcpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignT0snKTtcbiAgICAgICAgRHJpbmtzQVBJLmdldENvY2t0YWlsKCk7XG4gICAgfVxuXG59KTsiLCIvKipcbiAqIFVUSUxTIENMQVNTXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyB1c2VkIGFueXdoZXJlIHdpdGhpbiB0aGUgc2l0ZVxuICovXG5jbGFzcyBVdGlscyB7fVxuXG4vKipcbiAqIFNIUklOS0hFQURFUiBDTEFTU1xuICogQWRkcyBhIGNsYXNzIHRvIHRoZSBib2R5IHdoZW4gYSB1c2VyIHNjcm9sbHMsIHRvIHNocmluayB0aGUgaGVhZGVyIGFuZCBzaG93IG1vcmUgY29udGVudFxuICovXG5VdGlscy5TaHJpbmtIZWFkZXIgPSBjbGFzcyB7XG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUG9zID0gNjQ7IC8vIFNjcm9sbCBwb3NpdGlvbiwgaW4gcGl4ZWxzLCB3aGVuIHRvIHRyaWdnZXIgdGhlIHNocmlua2luZyBoZWFkZXJcbiAgICAgICAgdGhpcy5zaHJpbmtDbGFzcyA9ICdib2R5LS1zY3JvbGxlZCc7IC8vIENsYXNzIHRvIGFkZCB0byB0aGUgYm9keVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2UgdGhlIGhlYWRlciBzY3JpcHRcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBpbml0ICgpIHtcbiAgICAgICAgLy8gTGlzdGVuIGZvciB0aGUgc2Nyb2xsIGV2ZW50ICovXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBlID0+IHtcbiAgICAgICAgICAgIC8vIEV2ZW50IGhlYXJkLiBDYWxsIHRoZSBzY3JvbGxQYWdlIGZ1bmN0aW9uICovXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFBhZ2UoKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybignc2Nyb2xsZWQnKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgIC8vIE5vdyBjYWxsIHRoZSBmdW5jdGlvbiBhbnl3YXksIHNvIHdlIGtub3cgd2hlcmUgd2UgYXJlIGFmdGVyIHJlZnJlc2gsIGV0Y1xuICAgICAgICB0aGlzLnNjcm9sbFBhZ2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIHRoZSBzY3JvbGxlZCBjbGFzc1xuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIHNjcm9sbFBhZ2UgKCkge1xuICAgICAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgLy8gR3JhYiB0aGUgbGF0ZXN0IHNjcm9sbCBwb3NpdGlvbiAqL1xuICAgICAgICBjb25zdCBzeSA9IHRoaXMuc2Nyb2xsZWRQb3MoKTtcbiAgICAgICAgLy8gQ2hlY2sgaWYgd2UndmUgc2Nyb2xsZWQgZmFyIGVub3VnaFxuICAgICAgICBpZiAoc3kgPiB0aGlzLnNjcm9sbFBvcykge1xuICAgICAgICAgICAgLy8gQWRkIHRoZSBzY3JvbGxlZCBjbGFzc1xuICAgICAgICAgICAgYm9keS5jbGFzc0xpc3QuYWRkKHRoaXMuc2hyaW5rQ2xhc3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQWRkIHRoZSBzY3JvbGxlZCBjbGFzc1xuICAgICAgICAgICAgYm9keS5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuc2hyaW5rQ2xhc3MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIHBhZ2VcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIFdpbmRvdyB5IHBvc2l0aW9uXG4gICAgICovXG4gICAgc2Nyb2xsZWRQb3MgKCkge1xuICAgICAgICByZXR1cm4gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7XG4gICAgfVxufTtcblxuLyoqXG4gKiBEUkFXRVIgQ0xBU1NcbiAqIEFkZHMgYSBuYXZpZ2F0aW9uIGRyYXdlciBmb3Igc21hbGxlciBzY3JlZW5zXG4gKi9cblV0aWxzLkRyYXdlciA9IGNsYXNzIHtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5tZW51QnV0dG9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50b2dnbGUtZHJhd2VyJyk7IC8vIEdyYWIgYWxsIGVsZW1lbnRzIHdpdGggYSB0b2dnbGUtZHJhd2VyIGNsYXNzXG4gICAgICAgIHRoaXMuZHJhd2VyRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kcmF3ZXInKTsgLy8gVGhlIGRyYXdlciBpdHNlbGZcbiAgICAgICAgdGhpcy5jbG9hayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjbG9haycpOyAvLyBUaGUgc2hhZGVkIG92ZXJsYXkgd2hlbiB0aGUgZHJhd2VyIGlzIG9wZW5cbiAgICAgICAgdGhpcy5kcmF3ZXJDbGFzcyA9ICdib2R5LS1kcmF3ZXItdmlzaWJsZSc7IC8vIENsYXNzIHRvIGFkZCB0byB0aGUgYm9keSB0byBzbGlkZSB0aGUgZHJhd2VyIGluIGFuZCBvdXRcbiAgICAgICAgdGhpcy5ib2R5ID0gZG9jdW1lbnQuYm9keTsgLy8gR3JhYiBhIGhhbmRsZSBvbiB0aCBib2R5XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgZHJhd2VyIHNjcmlwdFxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIGluaXQgKCkge1xuICAgICAgICAvLyBBZGQgYSBjbGljayBldmVudCB0byBldmVyeSBlbGVtZW50IHdpdGggdGhlIHRvZ2dsZSBjbGFzc1xuICAgICAgICAvLyBUaGlzIGlzIGEgbm9kZSBsaXN0LCBzbyB0dXJuIGl0IGludG8gYW4gYXJyYXkgZmlyc3RcbiAgICAgICAgW10uc2xpY2UuY2FsbCh0aGlzLm1lbnVCdXR0b25zKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgICAgICAgICAgICAvLyBDYWxsIHRoZSB0b2dnbGUgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZURyYXdlcigpXG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgYSBjbGljayBldmVudCBvbiB0aGUgY2xvYWssIHRvIGNsb3NlIHRoZSBkcmF3ZXJcbiAgICAgICAgdGhpcy5jbG9hay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGUgPT4ge1xuICAgICAgICAgICAgLy8gQ2FsbCB0aGUgdG9nZ2xlIGZ1bmN0aW9uXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZURyYXdlcigpXG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgb3IgcmVtb3ZlIHRoZSB0b2dnbGUgY2xhc3MgdG8gc2hvdyB0aGUgZHJhd2VyXG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgdG9nZ2xlRHJhd2VyICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdjbGlja2VkJyk7XG4gICAgICAgIC8vIFRvZ2dsZSB0aGUgY2xhc3NcbiAgICAgICAgdGhpcy5ib2R5LmNsYXNzTGlzdC50b2dnbGUodGhpcy5kcmF3ZXJDbGFzcyk7XG4gICAgICAgIC8vIENhbGwgdGhlIGFyaWEgY2hhbmdlIGZ1bmN0aW9uXG4gICAgICAgIHRoaXMudG9nZ2xlQXJpYUF0dHIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGVzIHRoZSBBUklBIGF0dHJpYnV0ZSBvZiB0aGUgZHJhd2VyLlxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIHRvZ2dsZUFyaWFBdHRyICgpIHtcbiAgICAgICAgaWYgKHRoaXMuYm9keS5jbGFzc0xpc3QuY29udGFpbnModGhpcy5kcmF3ZXJDbGFzcykpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcblxuLyoqXG4gKiBURU1QTEFURUVOR0lORSBDTEFTU1xuICogQ3VzdG9tIGxpZ2h0d2VpZ2h0IHRlbXBsYXRpbmcgZW5naW5lLlxuICogSGVhdmlseSB0YWtlbiBmcm9tOlxuICogSm9obiBSZXNpZyDigJMgaHR0cDovL2Vqb2huLm9yZy8g4oCTIE1JVCBMaWNlbnNlZFxuICovXG5VdGlscy5UZW1wbGF0ZUVuZ2luZSA9IGNsYXNzIHtcblxuICAgIC8qKlxuICAgICogU3RvcmVzIHRoZSB0ZW1wbGF0ZSBkYXRhLCBzbyB3ZSBkb24ndCBrZWVwIHF1ZXJ5aW5nIHRoZSBET01cbiAgICAqIFxuICAgICogQHJldHVybiBFbXB0eSBvYmplY3RcbiAgICAqL1xuICAgIHN0YXRpYyBnZXQgQ0FDSEUgKCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBUYWtlcyB0aGUgdGVtcGxhdGUsIG1vZGVsIGFuZCBkZXN0aW5hdGlvbiB0byBwYXNzIG9uIHRvIHRoZSB0ZW1wbGF0aW5nIGZ1bmN0aW9uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgdGVtcGxhdGUgLSBJRCBvZiBzY3JpcHQgdGVtcGxhdGVcbiAgICAqIEBwYXJhbSB7b2JqZWN0fSAgIG1vZGVsIC0gRGF0YSBtb2RlbCB0byBwYXNzIHRvIHRlbXBsYXRlIFxuICAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgZGVzdGluYXRpb24gLSBJRCBvZiB3aGVyZSB0aGUgZmluaXNoZWQgdGVtcGxhdGUgaXMgZ29pbmcgdG8gZ29cbiAgICAqIFxuICAgICpAcmV0dXJuIHZvaWRcbiAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVIVE1MICh0ZW1wbGF0ZSwgbW9kZWwsIGRlc3RpbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZXN0aW5hdGlvbik7XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IHRoaXMudGVtcGxhdGVUb0hUTUwodGVtcGxhdGUsIG1vZGVsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICogQ29tYmluZXMgZHluYW1pYyBkYXRhIHdpdGggb3VyIHRlbXBsYXRlcyBhbmQgcmV0dXJucyB0aGUgcmVzdWx0XG4gICAgKiBKb2huIFJlc2lnIOKAkyBodHRwOi8vZWpvaG4ub3JnLyDigJMgTUlUIExpY2Vuc2VkXG4gICAgKiBcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSAgIHN0ciAtIElEIG9mIHNjcmlwdCB0ZW1wbGF0ZVxuICAgICogQHBhcmFtIHtvYmplY3R9ICAgZGF0YSAtIERhdGEgbW9kZWwgdG8gcGFzcyB0byB0ZW1wbGF0ZVxuICAgICogXG4gICAgKiBAcmV0dXJuIFRoZSBmaW5pc2hlZCB0ZW1wbGF0ZVxuICAgICovXG4gICAgc3RhdGljIHRlbXBsYXRlVG9IVE1MIChzdHIsIGRhdGEpIHtcbiAgICAgICAgY29uc3QgZm4gPSAhL1xcVy8udGVzdChzdHIpID9cbiAgICAgICAgICAgIHRoaXMuQ0FDSEVbc3RyXSA9IHRoaXMuQ0FDSEVbc3RyXSB8fFxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZVRvSFRNTChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdHIpLmlubmVySFRNTCkgOlxuXG4gICAgICAgICAgICAgICAgbmV3IEZ1bmN0aW9uKFwib2JqXCIsIFwidmFyIHA9W10scHJpbnQ9ZnVuY3Rpb24oKXtwLnB1c2guYXBwbHkocCxhcmd1bWVudHMpO307XCIgK1xuXG4gICAgICAgICAgICAgICAgXCJ3aXRoKG9iail7cC5wdXNoKCdcIiArXG5cbiAgICAgICAgICAgICAgICBzdHJcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1tcXHJcXHRcXG5dL2csIFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCI8JVwiKS5qb2luKFwiXFx0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oKF58JT4pW15cXHRdKiknL2csIFwiJDFcXHJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcdD0oLio/KSU+L2csIFwiJywkMSwnXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIlxcdFwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcIicpO1wiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCIlPlwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcInAucHVzaCgnXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIlxcclwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcIlxcXFwnXCIpXG5cbiAgICAgICAgICAgICAgICAgICAgKyBcIicpO31yZXR1cm4gcC5qb2luKCcnKTtcIik7XG5cbiAgICAgICAgcmV0dXJuIGRhdGEgPyBmbiggZGF0YSApIDogZm47XG5cbiAgICB9XG5cbn07XG5cbi8qKlxuICogQmFjayBUbyBUb3AgZnVuY3Rpb25hbGl0eVxuICogXG4gKiBAcmV0dXJuIHZvaWRcbiAqL1xuVXRpbHMuYmFja1RvVG9wID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JhY2stdG8tdG9wJyk7XG4gICAgaWYgKGVsKSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBVdGlsczsiXX0=
