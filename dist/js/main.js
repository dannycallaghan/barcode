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
            window.location.href = '/';
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

},{"../utils":5,"inspector":1}],3:[function(require,module,exports){
'use strict';

var _drinksApi = require('./drinks-api');

var _drinksApi2 = _interopRequireDefault(_drinksApi);

var _news = require('./news');

var _news2 = _interopRequireDefault(_news);

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
    _utils2.default.activateFullDetailButtons();
  }

  /**
   * If we're on a detail page, pass it to the API and let it determine what to show
   */
  if (document.getElementById('category-cocktail')) {
    _drinksApi2.default.getCocktail();
    _utils2.default.activateFullDetailButtons();
  }

  /**
   * If we're on the News index page, get the all news
   */
  if (document.getElementById('category-cocktail-news')) {
    _news2.default.getAllNews();
    _utils2.default.activateFullDetailButtons();
  }

  /**
   * If we're on an article page page, pass it to the News and let it determine which one to show
   */
  if (document.getElementById('category-cocktail-article')) {
    _news2.default.getNews();
  }
});

},{"./drinks-api":2,"./news":4,"./utils":5}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var News = function () {
    function News() {
        _classCallCheck(this, News);
    }

    _createClass(News, null, [{
        key: 'getAllNews',
        value: function getAllNews() {
            var _this = this;

            var succcess = function succcess(results) {
                _utils2.default.TemplateEngine.createHTML('' + _this.NEWS_TEMPLATE, { data: results }, 'cocktail-news');
            };
            fetch('' + this.NEWS_URL).then(function (response) {
                return response.json();
            }).then(function (results) {
                succcess(results);
            }).catch(function (e) {
                // TODO
            });
        }
    }, {
        key: 'getNews',
        value: function getNews() {
            var _this2 = this;

            var query = window.location.search;
            if (query && query.indexOf('id=')) {
                var splitQuery = query.split('id=')[1];
                if (splitQuery && splitQuery.length && parseInt(splitQuery, 10)) {
                    var id = parseInt(splitQuery, 10);
                    var succcess = function succcess(results) {
                        var article = results.filter(function (article) {
                            return article.id === id;
                        });
                        _utils2.default.TemplateEngine.createHTML('' + _this2.NEWS_TEMPLATE, { data: article }, 'cocktail-news');
                    };
                    fetch('' + this.NEWS_URL).then(function (response) {
                        return response.json();
                    }).then(function (results) {
                        succcess(results);
                    }).catch(function (e) {
                        // TODO
                    });
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
        key: 'NEWS_TEMPLATE',
        get: function get() {
            return 'cocktail_news';
        }
    }, {
        key: 'NEWS_URL',
        get: function get() {
            return '/data/news.json';
        }
    }]);

    return News;
}();

exports.default = News;

},{"../utils":5}],5:[function(require,module,exports){
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
            var event = new Event('templateLoaded');
            window.dispatchEvent(event);
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

/**
 * Set the stylesheet property for video height for mobile devices
 * 
 * @return void
 */
Utils.getHeightForVideo = function () {
    var viewHeight = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--viewHeight', viewHeight + 'px');
};

/**
 * Add a click event to the buttons on the cocktail list pages
 * 
 * @return void
 */
Utils.activateFullDetailButtons = function () {
    var addClickEvents = function addClickEvents() {
        var btns = document.querySelectorAll('button.full-details-button');
        console.warn(btns.length);
        if (!btns.length) {
            return;
        }
        [].slice.call(btns).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                window.location.href = e.target.dataset.link;
                e.preventDefault();
            }, false);
        });
    };
    var removePending = function removePending() {
        document.body.classList.remove('pending');
    };
    window.addEventListener('templateLoaded', function (e) {
        removePending();
        addClickEvents();
    }, false);
};

exports.default = Utils;

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwic3JjL2pzL2RyaW5rcy1hcGkvaW5kZXguanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy9uZXdzL2luZGV4LmpzIiwic3JjL2pzL3V0aWxzL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7Ozs7Ozs7Ozs7QUNBQTs7OztBQUNBOzs7Ozs7SUFFTSxTOzs7Ozs7O2dDQWtCYyxRLEVBQVUsRSxFQUFJO0FBQzFCLGdCQUFJLG9EQUFKO0FBQ0EsZ0JBQUksU0FBUyxLQUFLLFNBQUwsR0FBaUIsT0FBakIsR0FBMkIsTUFBeEM7QUFDQSxnQkFBSSxVQUFKO0FBQ0EsZ0JBQUksYUFBSjtBQUNBLGdCQUFJLEtBQUssU0FBVCxFQUFvQjtBQUNoQjtBQUNIO0FBQ0Qsb0JBQU8sUUFBUDtBQUNJLHFCQUFLLFFBQUw7QUFDSTtBQUNKO0FBQ0EscUJBQUssT0FBTDtBQUNJO0FBQ0Esb0NBQWMsRUFBZDtBQUNKO0FBQ0EscUJBQUssUUFBTDtBQUNJO0FBQ0Esb0NBQWMsRUFBZDtBQUNKO0FBQ0EscUJBQUssUUFBTDtBQUNJO0FBQ0Esb0NBQWMsRUFBZDtBQUNKO0FBQ0E7QUFoQko7QUFrQkEsd0JBQVUsR0FBVixHQUFnQixJQUFoQixHQUF1QixNQUF2QixHQUFnQyxLQUFoQztBQUNIOzs7MkNBRTBCLEksRUFBTSxFLEVBQUk7QUFBQTs7QUFDakMsZ0JBQU0sV0FBVyxTQUFYLFFBQVcsQ0FBQyxPQUFELEVBQWE7QUFDMUIsZ0NBQU0sY0FBTixDQUFxQixVQUFyQixNQUFtQyxNQUFLLGdCQUF4QyxFQUE0RCxFQUFFLE1BQU0sT0FBUixFQUE1RCxFQUErRSxlQUEvRTtBQUNILGFBRkQ7QUFHQSx1QkFBUyxLQUFLLE9BQUwsQ0FBYSxJQUFiLEVBQW1CLEVBQW5CLENBQVQsRUFDRCxJQURDLENBQ0k7QUFB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S0FBSyxNQUFsQjtBQUNBLFlBQUksQ0FBQyxLQUFLLE1BQVYsRUFBa0I7QUFDZDtBQUNIO0FBQ0QsV0FBRyxLQUFILENBQVMsSUFBVCxDQUFjLElBQWQsRUFBb0IsT0FBcEIsQ0FBNEIsZUFBTztBQUMvQixnQkFBSSxnQkFBSixDQUFxQixPQUFyQixFQUE4QixhQUFLO0FBQy9CLHVCQUFPLFFBQVAsQ0FBZ0IsSUFBaEIsR0FBdUIsRUFBRSxNQUFGLENBQVMsT0FBVCxDQUFpQixJQUF4QztBQUNBLGtCQUFFLGNBQUY7QUFDSCxhQUhELEVBR0csS0FISDtBQUlILFNBTEQ7QUFNSCxLQVpEO0FBYUEsUUFBTSxnQkFBZ0IsU0FBaEIsYUFBZ0IsR0FBTTtBQUN4QixpQkFBUyxJQUFULENBQWMsU0FBZCxDQUF3QixNQUF4QixDQUErQixTQUEvQjtBQUNILEtBRkQ7QUFHQSxXQUFPLGdCQUFQLENBQXdCLGdCQUF4QixFQUEwQyxhQUFLO0FBQzNDO0FBQ0E7QUFDSCxLQUhELEVBR0csS0FISDtBQUlILENBckJEOztrQkF3QmUsSyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIiIsImltcG9ydCBVdGlscyBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyB1cmwgfSBmcm9tICdpbnNwZWN0b3InO1xuXG5jbGFzcyBEcmlua3NBUEkge1xuXG4gICAgc3RhdGljIGdldCBURVNUX01PREUgKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBERVRBSUxTX1RFTVBMQVRFICgpIHtcbiAgICAgICAgcmV0dXJuIGBjb2NrdGFpbF9kZXRhaWxzYDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IExJU1RfVEVNUExBVEUgKCkge1xuICAgICAgICByZXR1cm4gYGNvY2t0YWlsc19saXN0YDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IFBPUFVMQVJfSURTICgpIHtcbiAgICAgICAgcmV0dXJuIFsxMTAwMCwgMTEwMDEsIDExMDAyLCAxMTAwNywgMTcyMDddO1xuICAgIH1cblxuICAgIHN0YXRpYyBBUElfVVJMIChjYXRlZ29yeSwgaWQpIHtcbiAgICAgICAgbGV0IGFwaSA9IGBodHRwczovL3d3dy50aGVjb2NrdGFpbGRiLmNvbS9hcGkvanNvbi92MS8xL2A7XG4gICAgICAgIGxldCBzdWZmaXggPSB0aGlzLlRFU1RfTU9ERSA/ICcuanNvbicgOiAnLnBocCc7IFxuICAgICAgICBsZXQgcXVlcnkgPSBgYDtcbiAgICAgICAgbGV0IGRlc3Q7XG4gICAgICAgIGlmICh0aGlzLlRFU1RfTU9ERSkge1xuICAgICAgICAgICAgYXBpID0gYC9sb2NhbF9kYXRhYDtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2goY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIGNhc2UgJ3JhbmRvbSc6XG4gICAgICAgICAgICAgICAgZGVzdCA9IGByYW5kb21gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdieS1pZCc6XG4gICAgICAgICAgICAgICAgZGVzdCA9IGBsb29rdXBgO1xuICAgICAgICAgICAgICAgIHF1ZXJ5ID0gYD9pPSR7aWR9YDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZmlsdGVyJzpcbiAgICAgICAgICAgICAgICBkZXN0ID0gYGZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSBgP2k9JHtpZH1gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd2aXJnaW4nOlxuICAgICAgICAgICAgICAgIGRlc3QgPSBgZmlsdGVyYDtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IGA/YT0ke2lkfWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGAke2FwaX0ke2Rlc3R9JHtzdWZmaXh9JHtxdWVyeX1gO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRDb2NrdGFpbERldGFpbHMgKHR5cGUsIGlkKSB7XG4gICAgICAgIGNvbnN0IHN1Y2NjZXNzID0gKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgIFV0aWxzLlRlbXBsYXRlRW5naW5lLmNyZWF0ZUhUTUwoYCR7dGhpcy5ERVRBSUxTX1RFTVBMQVRFfWAsIHsgZGF0YTogcmVzdWx0cyB9LCAnY29ja3RhaWwtZGF0YScpO1xuICAgICAgICB9O1xuICAgICAgICBmZXRjaChgJHt0aGlzLkFQSV9VUkwodHlwZSwgaWQpfWApXG5cdFx0ICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcblx0XHQgICAgLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICAgICAgc3VjY2Nlc3MocmVzdWx0cyk7XHRcblx0XHQgICAgfSlcblx0XHQgICAgLmNhdGNoKGUgPT4ge1xuXHRcdFx0ICAgIC8vIFRPRE9cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRDb2NrdGFpbHMgKCkge1xuICAgICAgICBjb25zdCBxdWVyeSA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgICAgIGlmIChxdWVyeSAmJiBxdWVyeS5pbmRleE9mKCdsaXN0PScpKSB7XG4gICAgICAgICAgICBjb25zdCBzcGxpdFF1ZXJ5ID0gcXVlcnkuc3BsaXQoJ2xpc3Q9JylbMV07XG4gICAgICAgICAgICBpZiAoc3BsaXRRdWVyeSAmJiBzcGxpdFF1ZXJ5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3RUeXBlID0gc3BsaXRRdWVyeS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NjZXNzID0gKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBVdGlscy5UZW1wbGF0ZUVuZ2luZS5jcmVhdGVIVE1MKGAke3RoaXMuTElTVF9URU1QTEFURX1gLCB7IGRhdGE6IHJlc3VsdHMgfSwgJ2NvY2t0YWlsLWRhdGEnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHN3aXRjaCAobGlzdFR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncG9wdWxhcic6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cmxzID0gdGhpcy5QT1BVTEFSX0lEUy5tYXAoaWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmZXRjaChgJHt0aGlzLkFQSV9VUkwoJ2J5LWlkJywgaWQpfWApLnRoZW4odmFsdWUgPT4gdmFsdWUuanNvbigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwodXJscylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Nlc3MocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Zpcmdpbic6XG4gICAgICAgICAgICAgICAgICAgICAgICBmZXRjaChgJHt0aGlzLkFQSV9VUkwoJ3ZpcmdpbicsICdub25fYWxjb2hvbGljJyl9YClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbih2YWx1ZSA9PiB2YWx1ZS5qc29uKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgZmV0Y2goYCR7dGhpcy5BUElfVVJMKCdmaWx0ZXInLCBsaXN0VHlwZSl9YClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbih2YWx1ZSA9PiB2YWx1ZS5qc29uKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8nO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENvY2t0YWlsICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdzdGlsbCBjYWxsZWQnKTtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgICAgICBpZiAocXVlcnkgJiYgcXVlcnkuaW5kZXhPZignaWQ9JykpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0UXVlcnkgPSBxdWVyeS5zcGxpdCgnaWQ9JylbMV07XG4gICAgICAgICAgICBpZiAoc3BsaXRRdWVyeSAmJiBzcGxpdFF1ZXJ5Lmxlbmd0aCAmJiAocGFyc2VJbnQoc3BsaXRRdWVyeSkgfHwgc3BsaXRRdWVyeSA9PT0gJ3JhbmRvbScpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBzcGxpdFF1ZXJ5O1xuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gJ3JhbmRvbScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRDb2NrdGFpbERldGFpbHMoJ3JhbmRvbScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29ja3RhaWxEZXRhaWxzKCdieS1pZCcsIGlkKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnLyc7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgRHJpbmtzQVBJOyIsImltcG9ydCBEcmlua3NBUEkgZnJvbSAnLi9kcmlua3MtYXBpJztcbmltcG9ydCBOZXdzIGZyb20gJy4vbmV3cyc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogSW5pdGlhbGlzZSBvdXIgbWFpbiBhcHAgY29kZSB3aGVuIHRoZSBET00gaXMgcmVhZHlcbiAqL1xuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGV2ZW50ID0+IHtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2UgdGhlIGRyYXdlciBmdW5jdGlvbmFsaXR5IGZvciBzbWFsbGVyIHNjcmVlbiBzaXplc1xuICAgICAqL1xuICAgIGNvbnN0IERyYXdlciA9IG5ldyBVdGlscy5EcmF3ZXIoKTtcbiAgICBEcmF3ZXIuaW5pdCgpO1xuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgc2hyaW5raW5nIGhlYWRlclxuICAgICAqL1xuICAgIGNvbnN0IFNocmlua0hlYWRlciA9IG5ldyBVdGlscy5TaHJpbmtIZWFkZXIoKTtcbiAgICBTaHJpbmtIZWFkZXIuaW5pdCgpO1xuXG4gICAgLyoqXG4gICAgICogQWRkIHRoZSBiYWNrIHRvIHRvcCBmdW5jdGlvbmFsaXR5XG4gICAgICovXG4gICAgVXRpbHMuYmFja1RvVG9wKCk7XG5cbiAgICAvKipcbiAgICAgKiBTdGFydCB0aGUgc3BsYXNoIHNjcmVlblxuICAgICAqL1xuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3BsYXNoLXNjcmVlbicpKSB7XG4gICAgICAgIFV0aWxzLnN0YXJ0U3BsYXNoKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSWYgd2UncmUgb24gYSBsaXN0IHBhZ2UsIHBhc3MgaXQgdG8gdGhlIEFQSSBhbmQgbGV0IGl0IGRldGVybWluZSB3aGF0IHRvIHNob3dcbiAgICAgKi9cbiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhdGVnb3J5LWxpc3QnKSkge1xuICAgICAgICBEcmlua3NBUEkuZ2V0Q29ja3RhaWxzKCk7XG4gICAgICAgIFV0aWxzLmFjdGl2YXRlRnVsbERldGFpbEJ1dHRvbnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB3ZSdyZSBvbiBhIGRldGFpbCBwYWdlLCBwYXNzIGl0IHRvIHRoZSBBUEkgYW5kIGxldCBpdCBkZXRlcm1pbmUgd2hhdCB0byBzaG93XG4gICAgICovXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXRlZ29yeS1jb2NrdGFpbCcpKSB7XG4gICAgICAgIERyaW5rc0FQSS5nZXRDb2NrdGFpbCgpO1xuICAgICAgICBVdGlscy5hY3RpdmF0ZUZ1bGxEZXRhaWxCdXR0b25zKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSWYgd2UncmUgb24gdGhlIE5ld3MgaW5kZXggcGFnZSwgZ2V0IHRoZSBhbGwgbmV3c1xuICAgICAqL1xuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2F0ZWdvcnktY29ja3RhaWwtbmV3cycpKSB7XG4gICAgICAgIE5ld3MuZ2V0QWxsTmV3cygpO1xuICAgICAgICBVdGlscy5hY3RpdmF0ZUZ1bGxEZXRhaWxCdXR0b25zKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSWYgd2UncmUgb24gYW4gYXJ0aWNsZSBwYWdlIHBhZ2UsIHBhc3MgaXQgdG8gdGhlIE5ld3MgYW5kIGxldCBpdCBkZXRlcm1pbmUgd2hpY2ggb25lIHRvIHNob3dcbiAgICAgKi9cbiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhdGVnb3J5LWNvY2t0YWlsLWFydGljbGUnKSkge1xuICAgICAgICBOZXdzLmdldE5ld3MoKTtcbiAgICB9XG5cbn0pOyIsImltcG9ydCBVdGlscyBmcm9tICcuLi91dGlscyc7XG5cbmNsYXNzIE5ld3Mge1xuXG4gICAgc3RhdGljIGdldCBURVNUX01PREUgKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBORVdTX1RFTVBMQVRFICgpIHtcbiAgICAgICAgcmV0dXJuIGBjb2NrdGFpbF9uZXdzYDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IE5FV1NfVVJMICgpIHtcbiAgICAgICAgcmV0dXJuIGAvZGF0YS9uZXdzLmpzb25gO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRBbGxOZXdzICgpIHtcbiAgICAgICAgY29uc3Qgc3VjY2Nlc3MgPSAocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUuY3JlYXRlSFRNTChgJHt0aGlzLk5FV1NfVEVNUExBVEV9YCwgeyBkYXRhOiByZXN1bHRzIH0sICdjb2NrdGFpbC1uZXdzJyk7XG4gICAgICAgIH07XG4gICAgICAgIGZldGNoKGAke3RoaXMuTkVXU19VUkx9YClcblx0XHQgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuXHRcdCAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcdFxuXHRcdCAgICB9KVxuXHRcdCAgICAuY2F0Y2goZSA9PiB7XG5cdFx0XHQgICAgLy8gVE9ET1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldE5ld3MgKCkge1xuICAgICAgICBjb25zdCBxdWVyeSA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgICAgIGlmIChxdWVyeSAmJiBxdWVyeS5pbmRleE9mKCdpZD0nKSkge1xuICAgICAgICAgICAgY29uc3Qgc3BsaXRRdWVyeSA9IHF1ZXJ5LnNwbGl0KCdpZD0nKVsxXTtcbiAgICAgICAgICAgIGlmIChzcGxpdFF1ZXJ5ICYmIHNwbGl0UXVlcnkubGVuZ3RoICYmIHBhcnNlSW50KHNwbGl0UXVlcnksIDEwKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gcGFyc2VJbnQoc3BsaXRRdWVyeSwgMTApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NjZXNzID0gKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJ0aWNsZSA9IHJlc3VsdHMuZmlsdGVyKGFydGljbGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFydGljbGUuaWQgPT09IGlkO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUuY3JlYXRlSFRNTChgJHt0aGlzLk5FV1NfVEVNUExBVEV9YCwgeyBkYXRhOiBhcnRpY2xlIH0sICdjb2NrdGFpbC1uZXdzJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBmZXRjaChgJHt0aGlzLk5FV1NfVVJMfWApXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcdFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvJztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBOZXdzOyIsIi8qKlxuICogVVRJTFMgQ0xBU1NcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIHVzZWQgYW55d2hlcmUgd2l0aGluIHRoZSBzaXRlXG4gKi9cbmNsYXNzIFV0aWxzIHt9XG5cbi8qKlxuICogU0hSSU5LSEVBREVSIENMQVNTXG4gKiBBZGRzIGEgY2xhc3MgdG8gdGhlIGJvZHkgd2hlbiBhIHVzZXIgc2Nyb2xscywgdG8gc2hyaW5rIHRoZSBoZWFkZXIgYW5kIHNob3cgbW9yZSBjb250ZW50XG4gKi9cblV0aWxzLlNocmlua0hlYWRlciA9IGNsYXNzIHtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQb3MgPSA2NDsgLy8gU2Nyb2xsIHBvc2l0aW9uLCBpbiBwaXhlbHMsIHdoZW4gdG8gdHJpZ2dlciB0aGUgc2hyaW5raW5nIGhlYWRlclxuICAgICAgICB0aGlzLnNocmlua0NsYXNzID0gJ2JvZHktLXNjcm9sbGVkJzsgLy8gQ2xhc3MgdG8gYWRkIHRvIHRoZSBib2R5XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgaGVhZGVyIHNjcmlwdFxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIGluaXQgKCkge1xuICAgICAgICAvLyBMaXN0ZW4gZm9yIHRoZSBzY3JvbGwgZXZlbnQgKi9cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGUgPT4ge1xuICAgICAgICAgICAgLy8gRXZlbnQgaGVhcmQuIENhbGwgdGhlIHNjcm9sbFBhZ2UgZnVuY3Rpb24gKi9cbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsUGFnZSgpO1xuICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgLy8gTm93IGNhbGwgdGhlIGZ1bmN0aW9uIGFueXdheSwgc28gd2Uga25vdyB3aGVyZSB3ZSBhcmUgYWZ0ZXIgcmVmcmVzaCwgZXRjXG4gICAgICAgIHRoaXMuc2Nyb2xsUGFnZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgdGhlIHNjcm9sbGVkIGNsYXNzXG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgc2Nyb2xsUGFnZSAoKSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICAvLyBHcmFiIHRoZSBsYXRlc3Qgc2Nyb2xsIHBvc2l0aW9uICovXG4gICAgICAgIGNvbnN0IHN5ID0gdGhpcy5zY3JvbGxlZFBvcygpO1xuICAgICAgICAvLyBDaGVjayBpZiB3ZSd2ZSBzY3JvbGxlZCBmYXIgZW5vdWdoXG4gICAgICAgIGlmIChzeSA+IHRoaXMuc2Nyb2xsUG9zKSB7XG4gICAgICAgICAgICAvLyBBZGQgdGhlIHNjcm9sbGVkIGNsYXNzXG4gICAgICAgICAgICBib2R5LmNsYXNzTGlzdC5hZGQodGhpcy5zaHJpbmtDbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBZGQgdGhlIHNjcm9sbGVkIGNsYXNzXG4gICAgICAgICAgICBib2R5LmNsYXNzTGlzdC5yZW1vdmUodGhpcy5zaHJpbmtDbGFzcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgcGFnZVxuICAgICAqIFxuICAgICAqIEByZXR1cm4gV2luZG93IHkgcG9zaXRpb25cbiAgICAgKi9cbiAgICBzY3JvbGxlZFBvcyAoKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcbiAgICB9XG59O1xuXG4vKipcbiAqIERSQVdFUiBDTEFTU1xuICogQWRkcyBhIG5hdmlnYXRpb24gZHJhd2VyIGZvciBzbWFsbGVyIHNjcmVlbnNcbiAqL1xuVXRpbHMuRHJhd2VyID0gY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLm1lbnVCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRvZ2dsZS1kcmF3ZXInKTsgLy8gR3JhYiBhbGwgZWxlbWVudHMgd2l0aCBhIHRvZ2dsZS1kcmF3ZXIgY2xhc3NcbiAgICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRyYXdlcicpOyAvLyBUaGUgZHJhd2VyIGl0c2VsZlxuICAgICAgICB0aGlzLmNsb2FrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nsb2FrJyk7IC8vIFRoZSBzaGFkZWQgb3ZlcmxheSB3aGVuIHRoZSBkcmF3ZXIgaXMgb3BlblxuICAgICAgICB0aGlzLmRyYXdlckNsYXNzID0gJ2JvZHktLWRyYXdlci12aXNpYmxlJzsgLy8gQ2xhc3MgdG8gYWRkIHRvIHRoZSBib2R5IHRvIHNsaWRlIHRoZSBkcmF3ZXIgaW4gYW5kIG91dFxuICAgICAgICB0aGlzLmJvZHkgPSBkb2N1bWVudC5ib2R5OyAvLyBHcmFiIGEgaGFuZGxlIG9uIHRoIGJvZHlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBkcmF3ZXIgc2NyaXB0XG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgaW5pdCAoKSB7XG4gICAgICAgIC8vIEFkZCBhIGNsaWNrIGV2ZW50IHRvIGV2ZXJ5IGVsZW1lbnQgd2l0aCB0aGUgdG9nZ2xlIGNsYXNzXG4gICAgICAgIC8vIFRoaXMgaXMgYSBub2RlIGxpc3QsIHNvIHR1cm4gaXQgaW50byBhbiBhcnJheSBmaXJzdFxuICAgICAgICBbXS5zbGljZS5jYWxsKHRoaXMubWVudUJ1dHRvbnMpLmZvckVhY2goYnRuID0+IHtcbiAgICAgICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGUgPT4ge1xuICAgICAgICAgICAgICAgIC8vIENhbGwgdGhlIHRvZ2dsZSBmdW5jdGlvblxuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlRHJhd2VyKClcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciBhIGNsaWNrIGV2ZW50IG9uIHRoZSBjbG9haywgdG8gY2xvc2UgdGhlIGRyYXdlclxuICAgICAgICB0aGlzLmNsb2FrLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgICAgICAgICAvLyBDYWxsIHRoZSB0b2dnbGUgZnVuY3Rpb25cbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRHJhd2VyKClcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBvciByZW1vdmUgdGhlIHRvZ2dsZSBjbGFzcyB0byBzaG93IHRoZSBkcmF3ZXJcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICB0b2dnbGVEcmF3ZXIgKCkge1xuICAgICAgICAvLyBUb2dnbGUgdGhlIGNsYXNzXG4gICAgICAgIHRoaXMuYm9keS5jbGFzc0xpc3QudG9nZ2xlKHRoaXMuZHJhd2VyQ2xhc3MpO1xuICAgICAgICAvLyBDYWxsIHRoZSBhcmlhIGNoYW5nZSBmdW5jdGlvblxuICAgICAgICB0aGlzLnRvZ2dsZUFyaWFBdHRyKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlcyB0aGUgQVJJQSBhdHRyaWJ1dGUgb2YgdGhlIGRyYXdlci5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICB0b2dnbGVBcmlhQXR0ciAoKSB7XG4gICAgICAgIGlmICh0aGlzLmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKHRoaXMuZHJhd2VyQ2xhc3MpKSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG5cbi8qKlxuICogVEVNUExBVEVFTkdJTkUgQ0xBU1NcbiAqIEN1c3RvbSBsaWdodHdlaWdodCB0ZW1wbGF0aW5nIGVuZ2luZS5cbiAqIEhlYXZpbHkgdGFrZW4gZnJvbTpcbiAqIEpvaG4gUmVzaWcg4oCTIGh0dHA6Ly9lam9obi5vcmcvIOKAkyBNSVQgTGljZW5zZWRcbiAqL1xuVXRpbHMuVGVtcGxhdGVFbmdpbmUgPSBjbGFzcyB7XG5cbiAgICAvKipcbiAgICAqIFN0b3JlcyB0aGUgdGVtcGxhdGUgZGF0YSwgc28gd2UgZG9uJ3Qga2VlcCBxdWVyeWluZyB0aGUgRE9NXG4gICAgKiBcbiAgICAqIEByZXR1cm4gRW1wdHkgb2JqZWN0XG4gICAgKi9cbiAgICBzdGF0aWMgZ2V0IENBQ0hFICgpIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICogVGFrZXMgdGhlIHRlbXBsYXRlLCBtb2RlbCBhbmQgZGVzdGluYXRpb24gdG8gcGFzcyBvbiB0byB0aGUgdGVtcGxhdGluZyBmdW5jdGlvblxuICAgICpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgIHRlbXBsYXRlIC0gSUQgb2Ygc2NyaXB0IHRlbXBsYXRlXG4gICAgKiBAcGFyYW0ge29iamVjdH0gICBtb2RlbCAtIERhdGEgbW9kZWwgdG8gcGFzcyB0byB0ZW1wbGF0ZSBcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgIGRlc3RpbmF0aW9uIC0gSUQgb2Ygd2hlcmUgdGhlIGZpbmlzaGVkIHRlbXBsYXRlIGlzIGdvaW5nIHRvIGdvXG4gICAgKiBcbiAgICAqQHJldHVybiB2b2lkXG4gICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlSFRNTCAodGVtcGxhdGUsIG1vZGVsLCBkZXN0aW5hdGlvbikge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVzdGluYXRpb24pO1xuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLnRlbXBsYXRlVG9IVE1MKHRlbXBsYXRlLCBtb2RlbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgRXZlbnQoJ3RlbXBsYXRlTG9hZGVkJyk7XG4gICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIENvbWJpbmVzIGR5bmFtaWMgZGF0YSB3aXRoIG91ciB0ZW1wbGF0ZXMgYW5kIHJldHVybnMgdGhlIHJlc3VsdFxuICAgICogSm9obiBSZXNpZyDigJMgaHR0cDovL2Vqb2huLm9yZy8g4oCTIE1JVCBMaWNlbnNlZFxuICAgICogXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gICBzdHIgLSBJRCBvZiBzY3JpcHQgdGVtcGxhdGVcbiAgICAqIEBwYXJhbSB7b2JqZWN0fSAgIGRhdGEgLSBEYXRhIG1vZGVsIHRvIHBhc3MgdG8gdGVtcGxhdGVcbiAgICAqIFxuICAgICogQHJldHVybiBUaGUgZmluaXNoZWQgdGVtcGxhdGVcbiAgICAqL1xuICAgIHN0YXRpYyB0ZW1wbGF0ZVRvSFRNTCAoc3RyLCBkYXRhKSB7XG4gICAgICAgIGNvbnN0IGZuID0gIS9cXFcvLnRlc3Qoc3RyKSA/XG4gICAgICAgICAgICB0aGlzLkNBQ0hFW3N0cl0gPSB0aGlzLkNBQ0hFW3N0cl0gfHxcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVUb0hUTUwoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc3RyKS5pbm5lckhUTUwpIDpcblxuICAgICAgICAgICAgICAgIG5ldyBGdW5jdGlvbihcIm9ialwiLCBcInZhciBwPVtdLHByaW50PWZ1bmN0aW9uKCl7cC5wdXNoLmFwcGx5KHAsYXJndW1lbnRzKTt9O1wiICtcblxuICAgICAgICAgICAgICAgIFwid2l0aChvYmope3AucHVzaCgnXCIgK1xuXG4gICAgICAgICAgICAgICAgc3RyXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFxyXFx0XFxuXS9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KFwiPCVcIikuam9pbihcIlxcdFwiKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKChefCU+KVteXFx0XSopJy9nLCBcIiQxXFxyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHQ9KC4qPyklPi9nLCBcIicsJDEsJ1wiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCJcXHRcIilcbiAgICAgICAgICAgICAgICAgICAgLmpvaW4oXCInKTtcIilcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KFwiJT5cIilcbiAgICAgICAgICAgICAgICAgICAgLmpvaW4oXCJwLnB1c2goJ1wiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCJcXHJcIilcbiAgICAgICAgICAgICAgICAgICAgLmpvaW4oXCJcXFxcJ1wiKVxuXG4gICAgICAgICAgICAgICAgICAgICsgXCInKTt9cmV0dXJuIHAuam9pbignJyk7XCIpO1xuXG4gICAgICAgIHJldHVybiBkYXRhID8gZm4oIGRhdGEgKSA6IGZuO1xuICAgIH1cblxufTtcblxuLyoqXG4gKiBCYWNrIFRvIFRvcCBmdW5jdGlvbmFsaXR5XG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5iYWNrVG9Ub3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFjay10by10b3AnKTtcbiAgICBpZiAoZWwpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfVxufVxuXG4vKipcbiAqIFN0YXJ0cyB0aGUgc3BsYXNoIHNjcmVlbiBieSByZW1vdmluZyB0aGUgcGVuZGluZyBjbGFzcyBmcm9tIHRoZSBib2R5XG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5zdGFydFNwbGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBmaXJzdFRpbWVyID0gNTAwO1xuICAgIGNvbnN0IHNlY29uZFRpbWVyID0gMzAwMDtcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnc3BsYXNoLTEnKTtcbiAgICB9LCBmaXJzdFRpbWVyKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnc3BsYXNoLTInKTtcbiAgICB9LCBzZWNvbmRUaW1lcik7XG59XG5cbi8qKlxuICogU2V0IHRoZSBzdHlsZXNoZWV0IHByb3BlcnR5IGZvciB2aWRlbyBoZWlnaHQgZm9yIG1vYmlsZSBkZXZpY2VzXG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5nZXRIZWlnaHRGb3JWaWRlbyA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCB2aWV3SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmlld0hlaWdodCcsIGAke3ZpZXdIZWlnaHR9cHhgKTtcbn07XG5cbi8qKlxuICogQWRkIGEgY2xpY2sgZXZlbnQgdG8gdGhlIGJ1dHRvbnMgb24gdGhlIGNvY2t0YWlsIGxpc3QgcGFnZXNcbiAqIFxuICogQHJldHVybiB2b2lkXG4gKi9cblV0aWxzLmFjdGl2YXRlRnVsbERldGFpbEJ1dHRvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgYWRkQ2xpY2tFdmVudHMgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ0bnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdidXR0b24uZnVsbC1kZXRhaWxzLWJ1dHRvbicpO1xuICAgICAgICBjb25zb2xlLndhcm4oYnRucy5sZW5ndGgpO1xuICAgICAgICBpZiAoIWJ0bnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgW10uc2xpY2UuY2FsbChidG5zKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGUudGFyZ2V0LmRhdGFzZXQubGluaztcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3QgcmVtb3ZlUGVuZGluZyA9ICgpID0+IHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdwZW5kaW5nJyk7XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndGVtcGxhdGVMb2FkZWQnLCBlID0+IHtcbiAgICAgICAgcmVtb3ZlUGVuZGluZygpO1xuICAgICAgICBhZGRDbGlja0V2ZW50cygpO1xuICAgIH0sIGZhbHNlKTtcbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgVXRpbHM7Il19
