/*!
 * barcode
 * Bar Code
 * 
 * @author Danny Callaghan
 * @version 1.0.0
 * Copyright 2019. MIT licensed.
 */
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
      'FileReader' in self &&
      'Blob' in self &&
      (function() {
        try {
          new Blob();
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = self.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],3:[function(require,module,exports){
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

/**
 * DRINKSAPI CLASS
 * Deals with talking to The Cocktail DB
 * 
 * /js/drinks-api/index.js
 */
var DrinksAPI = function () {
    function DrinksAPI() {
        _classCallCheck(this, DrinksAPI);
    }

    _createClass(DrinksAPI, null, [{
        key: 'API_URL',


        /**
         * Works out which API URL we should be using
         * 
         * @param {string} category - What section we're on
         * @param {number} id - If we're asking for a particular recipe, this is the ID
         * 
         * @return {string} The url
         */
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

        /**
         * Get a cocktail recipe from an ID.
         * 
         * @param {string} type - What section we're on
         * @param {number} id - If we're asking for a particular recipe, this is the ID
         * 
         * @return void
         */

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
                _utils2.default.TemplateEngine.noData('cocktail-data');
            });
        }

        /**
         * Get a list of cocktails
         * 
         * @return void
         */

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
                                _utils2.default.TemplateEngine.noData('cocktail-data');
                            });
                            break;
                        case 'virgin':
                            fetch('' + this.API_URL('virgin', 'non_alcoholic')).then(function (value) {
                                return value.json();
                            }).then(function (results) {
                                succcess(results);
                            }).catch(function (e) {
                                _utils2.default.TemplateEngine.noData('cocktail-data');
                            });
                            break;
                        default:
                            fetch('' + this.API_URL('filter', listType)).then(function (value) {
                                return value.json();
                            }).then(function (results) {
                                succcess(results);
                            }).catch(function (e) {
                                _utils2.default.TemplateEngine.noData('cocktail-data');
                            });

                    }
                    return;
                }
            }
            window.location.href = '/';
            return;
        }

        /**
         * Determines what type of recipe to show. Random, or by ID. Gets the ID from the url.
         * 
         * @return void
         */

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


        /**
         * Set test mode (get local data if we're testing, remote data if not)
         */
        get: function get() {
            return false;
        }

        /**
         * Reference to the template used for recipes
         * 
         * @return {string} ID of the template
         */

    }, {
        key: 'DETAILS_TEMPLATE',
        get: function get() {
            return 'cocktail_details';
        }

        /**
         * Reference to the template used for the lists
         * 
         * @return {string} ID of the template
         */

    }, {
        key: 'LIST_TEMPLATE',
        get: function get() {
            return 'cocktails_list';
        }

        /**
         * IDs for the Popular section, each one is a cocktail
         * 
         * @return {string} ID of the template
         */

    }, {
        key: 'POPULAR_IDS',
        get: function get() {
            return [11000, 11001, 11002, 11007, 17207];
        }
    }]);

    return DrinksAPI;
}();

exports.default = DrinksAPI;

},{"../utils":6,"inspector":1}],4:[function(require,module,exports){
'use strict';

require('whatwg-fetch');

var _drinksApi = require('./drinks-api');

var _drinksApi2 = _interopRequireDefault(_drinksApi);

var _news = require('./news');

var _news2 = _interopRequireDefault(_news);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Kicks everything off
 * 
 * /js/main.js
 */

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

},{"./drinks-api":3,"./news":5,"./utils":6,"whatwg-fetch":2}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * NEWS CLASS
 * Deals with the News and News Articles pages
 * 
 * /js/news/index.js
 */
var News = function () {
    function News() {
        _classCallCheck(this, News);
    }

    _createClass(News, null, [{
        key: 'getAllNews',


        /**
         * Gets the local json and sends all of the data to the template
         * 
         * @return void
         */
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
                _utils2.default.TemplateEngine.noData('cocktail-news');
            });
        }

        /**
         * Gets the local json and sends the article that matches the ID in the address bar
         * 
         * @return void
         */

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
                        if (!article.length) {
                            window.location.href = '/';
                            return;
                        }
                        _utils2.default.TemplateEngine.createHTML('' + _this2.NEWS_TEMPLATE, { data: article }, 'cocktail-news');
                    };
                    fetch('' + this.NEWS_URL).then(function (response) {
                        return response.json();
                    }).then(function (results) {
                        succcess(results);
                    }).catch(function (e) {
                        _utils2.default.TemplateEngine.noData('cocktail-news');
                    });
                    return;
                }
            }
            window.location.href = '/';
            return;
        }
    }, {
        key: 'NEWS_TEMPLATE',


        /**
         * Reference to the template used for recipes
         * 
         * @return {string} ID of the template
         */
        get: function get() {
            return 'cocktail_news';
        }

        /**
         * Url of the local data
         * 
         * @return {string} Url of the local json file
         */

    }, {
        key: 'NEWS_URL',
        get: function get() {
            return '/data/news.json';
        }
    }]);

    return News;
}();

exports.default = News;

},{"../utils":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * UTILS CLASS
 * Utility functions used anywhere within the site
 * 
 * NOTE:
 * As credited below, and in the report.html, the function below (templateToHTML)
 * was written by John Resig and featured in a blog post in 2008. More details
 * can be found in the report.html file.
 * 
 * /js/utils/index.js
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

            // We don't want this to work on the homepage
            if (document.querySelectorAll('.video-wrapper').length) {
                return;
            }

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

        /**
        * Show an error message if we can't get any info 
        * 
        * @param {string}   str - ID of destination template
        */

    }, {
        key: 'noData',
        value: function noData(str) {
            document.body.classList.remove('pending');
            document.getElementById(str).innerHTML = '<p class="no-data"><i class="material-icons">error_outline</i> Uh oh! We\'re unable to display that infomation. Please check your connection and try again.</p>';
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

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3doYXR3Zy1mZXRjaC9kaXN0L2ZldGNoLnVtZC5qcyIsInNyYy9qcy9kcmlua3MtYXBpL2luZGV4LmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvbmV3cy9pbmRleC5qcyIsInNyYy9qcy91dGlscy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDbmhCQTs7OztBQUNBOzs7Ozs7QUFFQTs7Ozs7O0lBTU0sUzs7Ozs7Ozs7O0FBb0NGOzs7Ozs7OztnQ0FRZ0IsUSxFQUFVLEUsRUFBSTtBQUMxQixnQkFBSSxvREFBSjtBQUNBLGdCQUFJLFNBQVMsS0FBSyxTQUFMLEdBQWlCLE9BQWpCLEdBQTJCLE1BQXhDO0FBQ0EsZ0JBQUksVUFBSjtBQUNBLGdCQUFJLGFBQUo7QUFDQSxnQkFBSSxLQUFLLFNBQVQsRUFBb0I7QUFDaEI7QUFDSDtBQUNELG9CQUFPLFFBQVA7QUFDSSxxQkFBSyxRQUFMO0FBQ0k7QUFDSjtBQUNBLHFCQUFLLE9BQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBO0FBaEJKO0FBa0JBLHdCQUFVLEdBQVYsR0FBZ0IsSUFBaEIsR0FBdUIsTUFBdkIsR0FBZ0MsS0FBaEM7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7MkNBUTJCLEksRUFBTSxFLEVBQUk7QUFBQTs7QUFDakMsZ0JBQU0sV0FBVyxTQUFYLFFBQVcsQ0FBQyxPQUFELEVBQWE7QUFDMUIsZ0NBQU0sY0FBTixDQUFxQixVQUFyQixNQUFtQyxNQUFLLGdCQUF4QyxFQUE0RCxFQUFFLE1BQU0sT0FBUixFQUE1RCxFQUErRSxlQUEvRTtBQUNILGFBRkQ7QUFHQSx1QkFBUyxLQUFLLE9BQUwsQ0FBYSxJQUFiLEVBQW1CLEVBQW5CLENBQVQsRUFDRCxJQURDLENBQ0k7QUFBQSx1QkFBWSxTQUFTLElBQVQsRUFBWjtBQUFBLGFBREosRUFFRCxJQUZDLENBRUksbUJBQVc7QUFDUCx5QkFBUyxPQUFUO0FBQ1QsYUFKQyxFQUtELEtBTEMsQ0FLSyxhQUFLO0FBQ0YsZ0NBQU0sY0FBTixDQUFxQixNQUFyQixDQUE0QixlQUE1QjtBQUNILGFBUEw7QUFRSDs7QUFFRDs7Ozs7Ozs7dUNBS3VCO0FBQUE7O0FBQ25CLGdCQUFNLFFBQVEsT0FBTyxRQUFQLENBQWdCLE1BQTlCO0FBQ0EsZ0JBQUksU0FBUyxNQUFNLE9BQU4sQ0FBYyxPQUFkLENBQWIsRUFBcUM7QUFDakMsb0JBQU0sYUFBYSxNQUFNLEtBQU4sQ0FBWSxPQUFaLEVBQXFCLENBQXJCLENBQW5CO0FBQ0Esb0JBQUksY0FBYyxXQUFXLE1BQTdCLEVBQXFDO0FBQ2pDLHdCQUFNLFdBQVcsV0FBVyxXQUFYLEVBQWpCO0FBQ0Esd0JBQU0sV0FBVyxTQUFYLFFBQVcsQ0FBQyxPQUFELEVBQWE7QUFDMUIsd0NBQU0sY0FBTixDQUFxQixVQUFyQixNQUFtQyxPQUFLLGFBQXhDLEVBQXlELEVBQUUsTUFBTSxPQUFSLEVBQXpELEVBQTRFLGVBQTVFO0FBQ0gscUJBRkQ7QUFHQSw0QkFBUSxRQUFSO0FBQ0ksNkJBQUssU0FBTDtBQUNJLGdDQUFNLE9BQU8sS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLGNBQU07QUFDcEMsdUNBQU8sV0FBUyxPQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQXNCLEVBQXRCLENBQVQsRUFBc0MsSUFBdEMsQ0FBMkM7QUFBQSwyQ0FBUyxNQUFNLElBQU4sRUFBVDtBQUFBLGlDQUEzQyxDQUFQO0FBQ0gsNkJBRlksQ0FBYjtBQUdBLG9DQUFRLEdBQVIsQ0FBWSxJQUFaLEVBQ0ssSUFETCxDQUNVLG1CQUFXO0FBQ2IseUNBQVMsT0FBVDtBQUNILDZCQUhMLEVBSUssS0FKTCxDQUlXLGFBQUs7QUFDUixnREFBTSxjQUFOLENBQXFCLE1BQXJCLENBQTRCLGVBQTVCO0FBQ0gsNkJBTkw7QUFPSjtBQUNBLDZCQUFLLFFBQUw7QUFDSSx1Q0FBUyxLQUFLLE9BQUwsQ0FBYSxRQUFiLEVBQXVCLGVBQXZCLENBQVQsRUFDSyxJQURMLENBQ1U7QUFBQSx1Q0FBUyxNQUFNLElBQU4sRUFBVDtBQUFBLDZCQURWLEVBRUssSUFGTCxDQUVVLG1CQUFXO0FBQ2IseUNBQVMsT0FBVDtBQUNILDZCQUpMLEVBS0ssS0FMTCxDQUtXLGFBQUs7QUFDUixnREFBTSxjQUFOLENBQXFCLE1BQXJCLENBQTRCLGVBQTVCO0FBQ0gsNkJBUEw7QUFRSjtBQUNBO0FBQ0ksdUNBQVMsS0FBSyxPQUFMLENBQWEsUUFBYixFQUF1QixRQUF2QixDQUFULEVBQ0ssSUFETCxDQUNVO0FBQUEsdUNBQVMsTUFBTSxJQUFOLEVBQVQ7QUFBQSw2QkFEVixFQUVLLElBRkwsQ0FFVSxtQkFBVztBQUNiLHlDQUFTLE9BQVQ7QUFDSCw2QkFKTCxFQUtLLEtBTEwsQ0FLVyxhQUFLO0FBQ1IsZ0RBQU0sY0FBTixDQUFxQixNQUFyQixDQUE0QixlQUE1QjtBQUNILDZCQVBMOztBQXhCUjtBQWtDQTtBQUNIO0FBQ0o7QUFDRCxtQkFBTyxRQUFQLENBQWdCLElBQWhCLEdBQXVCLEdBQXZCO0FBQ0E7QUFDSDs7QUFFRDs7Ozs7Ozs7c0NBS3NCO0FBQ2xCLGdCQUFNLFFBQVEsT0FBTyxRQUFQLENBQWdCLE1BQTlCO0FBQ0EsZ0JBQUksU0FBUyxNQUFNLE9BQU4sQ0FBYyxLQUFkLENBQWIsRUFBbUM7QUFDL0Isb0JBQU0sYUFBYSxNQUFNLEtBQU4sQ0FBWSxLQUFaLEVBQW1CLENBQW5CLENBQW5CO0FBQ0Esb0JBQUksY0FBYyxXQUFXLE1BQXpCLEtBQW9DLFNBQVMsVUFBVCxLQUF3QixlQUFlLFFBQTNFLENBQUosRUFBMEY7QUFDdEYsd0JBQU0sS0FBSyxVQUFYO0FBQ0Esd0JBQUksT0FBTyxRQUFYLEVBQXFCO0FBQ2pCLDZCQUFLLGtCQUFMLENBQXdCLFFBQXhCO0FBQ0E7QUFDSDtBQUNELHlCQUFLLGtCQUFMLENBQXdCLE9BQXhCLEVBQWlDLEVBQWpDO0FBQ0E7QUFDSDtBQUNKO0FBQ0QsbUJBQU8sUUFBUCxDQUFnQixJQUFoQixHQUF1QixHQUF2QjtBQUNBO0FBQ0g7Ozs7O0FBektEOzs7NEJBR3dCO0FBQ3BCLG1CQUFPLEtBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7NEJBSytCO0FBQzNCO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzRCQUs0QjtBQUN4QjtBQUNIOztBQUVEOzs7Ozs7Ozs0QkFLMEI7QUFDdEIsbUJBQU8sQ0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLEtBQWYsRUFBc0IsS0FBdEIsRUFBNkIsS0FBN0IsQ0FBUDtBQUNIOzs7Ozs7a0JBOElVLFM7Ozs7O0FDekxmOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUE7Ozs7OztBQU1BOzs7QUFHQSxTQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxpQkFBUzs7QUFFbkQ7OztBQUdBLE1BQU0sU0FBUyxJQUFJLGdCQUFNLE1BQVYsRUFBZjtBQUNBLFNBQU8sSUFBUDs7QUFFQTs7O0FBR0EsTUFBTSxlQUFlLElBQUksZ0JBQU0sWUFBVixFQUFyQjtBQUNBLGVBQWEsSUFBYjs7QUFFQTs7O0FBR0Esa0JBQU0sU0FBTjs7QUFFQTs7O0FBR0EsTUFBSSxTQUFTLGNBQVQsQ0FBd0IsZUFBeEIsQ0FBSixFQUE4QztBQUMxQyxvQkFBTSxXQUFOO0FBQ0g7O0FBRUQ7OztBQUdBLE1BQUksU0FBUyxjQUFULENBQXdCLGVBQXhCLENBQUosRUFBOEM7QUFDMUMsd0JBQVUsWUFBVjtBQUNBLG9CQUFNLHlCQUFOO0FBQ0g7O0FBRUQ7OztBQUdBLE1BQUksU0FBUyxjQUFULENBQXdCLG1CQUF4QixDQUFKLEVBQWtEO0FBQzlDLHdCQUFVLFdBQVY7QUFDQSxvQkFBTSx5QkFBTjtBQUNIOztBQUVEOzs7QUFHQSxNQUFJLFNBQVMsY0FBVCxDQUF3Qix3QkFBeEIsQ0FBSixFQUF1RDtBQUNuRCxtQkFBSyxVQUFMO0FBQ0Esb0JBQU0seUJBQU47QUFDSDs7QUFFRDs7O0FBR0EsTUFBSSxTQUFTLGNBQVQsQ0FBd0IsMkJBQXhCLENBQUosRUFBMEQ7QUFDdEQsbUJBQUssT0FBTDtBQUNIO0FBRUosQ0F6REQ7Ozs7Ozs7Ozs7O0FDZEE7Ozs7Ozs7O0FBRUE7Ozs7OztJQU1NLEk7Ozs7Ozs7OztBQW9CRjs7Ozs7cUNBS3FCO0FBQUE7O0FBQ2pCLGdCQUFNLFdBQVcsU0FBWCxRQUFXLENBQUMsT0FBRCxFQUFhO0FBQzFCLGdDQUFNLGNBQU4sQ0FBcUIsVUFBckIsTUFBbUMsTUFBSyxhQUF4QyxFQUF5RCxFQUFFLE1BQU0sT0FBUixFQUF6RCxFQUE0RSxlQUE1RTtBQUNILGFBRkQ7QUFHQSx1QkFBUyxLQUFLLFFBQWQsRUFDRCxJQURDLENBQ0k7QUFBQSx1QkFBWSxTQUFTLElBQVQsRUFBWjtBQUFBLGFBREosRUFFRCxJQUZDLENBRUksbUJBQVc7QUFDUCx5QkFBUyxPQUFUO0FBQ1QsYUFKQyxFQUtELEtBTEMsQ0FLSyxhQUFLO0FBQ1gsZ0NBQU0sY0FBTixDQUFxQixNQUFyQixDQUE0QixlQUE1QjtBQUNNLGFBUEw7QUFRSDs7QUFFRDs7Ozs7Ozs7a0NBS2tCO0FBQUE7O0FBQ2QsZ0JBQU0sUUFBUSxPQUFPLFFBQVAsQ0FBZ0IsTUFBOUI7QUFDQSxnQkFBSSxTQUFTLE1BQU0sT0FBTixDQUFjLEtBQWQsQ0FBYixFQUFtQztBQUMvQixvQkFBTSxhQUFhLE1BQU0sS0FBTixDQUFZLEtBQVosRUFBbUIsQ0FBbkIsQ0FBbkI7QUFDQSxvQkFBSSxjQUFjLFdBQVcsTUFBekIsSUFBbUMsU0FBUyxVQUFULEVBQXFCLEVBQXJCLENBQXZDLEVBQWlFO0FBQzdELHdCQUFNLEtBQUssU0FBUyxVQUFULEVBQXFCLEVBQXJCLENBQVg7QUFDQSx3QkFBTSxXQUFXLFNBQVgsUUFBVyxDQUFDLE9BQUQsRUFBYTtBQUMxQiw0QkFBTSxVQUFVLFFBQVEsTUFBUixDQUFlLG1CQUFXO0FBQ3RDLG1DQUFPLFFBQVEsRUFBUixLQUFlLEVBQXRCO0FBQ0gseUJBRmUsQ0FBaEI7QUFHQSw0QkFBSSxDQUFDLFFBQVEsTUFBYixFQUFxQjtBQUNqQixtQ0FBTyxRQUFQLENBQWdCLElBQWhCLEdBQXVCLEdBQXZCO0FBQ0E7QUFDSDtBQUNELHdDQUFNLGNBQU4sQ0FBcUIsVUFBckIsTUFBbUMsT0FBSyxhQUF4QyxFQUF5RCxFQUFFLE1BQU0sT0FBUixFQUF6RCxFQUE0RSxlQUE1RTtBQUNILHFCQVREO0FBVUEsK0JBQVMsS0FBSyxRQUFkLEVBQ0ssSUFETCxDQUNVO0FBQUEsK0JBQVksU0FBUyxJQUFULEVBQVo7QUFBQSxxQkFEVixFQUVLLElBRkwsQ0FFVSxtQkFBVztBQUNiLGlDQUFTLE9BQVQ7QUFDSCxxQkFKTCxFQUtLLEtBTEwsQ0FLVyxhQUFLO0FBQ1Isd0NBQU0sY0FBTixDQUFxQixNQUFyQixDQUE0QixlQUE1QjtBQUNILHFCQVBMO0FBUUE7QUFDSDtBQUNKO0FBQ0QsbUJBQU8sUUFBUCxDQUFnQixJQUFoQixHQUF1QixHQUF2QjtBQUNBO0FBQ0g7Ozs7O0FBdkVEOzs7Ozs0QkFLNEI7QUFDeEI7QUFDSDs7QUFFRDs7Ozs7Ozs7NEJBS3VCO0FBQ25CO0FBQ0g7Ozs7OztrQkEyRFUsSTs7Ozs7Ozs7Ozs7OztBQ3JGZjs7Ozs7Ozs7Ozs7SUFXTSxLOzs7O0FBRU47Ozs7OztBQUlBLE1BQU0sWUFBTjtBQUVJLHNCQUFlO0FBQUE7O0FBQ1gsYUFBSyxTQUFMLEdBQWlCLEVBQWpCLENBRFcsQ0FDVTtBQUNyQixhQUFLLFdBQUwsR0FBbUIsZ0JBQW5CLENBRlcsQ0FFMEI7QUFDeEM7O0FBRUQ7Ozs7Ozs7QUFQSjtBQUFBO0FBQUEsK0JBWVk7QUFBQTs7QUFDSjtBQUNBLGdCQUFJLFNBQVMsZ0JBQVQsQ0FBMEIsZ0JBQTFCLEVBQTRDLE1BQWhELEVBQXdEO0FBQ3BEO0FBQ0g7O0FBRUQ7QUFDQSxtQkFBTyxnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxhQUFLO0FBQ25DO0FBQ0Esc0JBQUssVUFBTDtBQUNILGFBSEQsRUFHRyxLQUhIOztBQUtBO0FBQ0EsaUJBQUssVUFBTDtBQUNIOztBQUVEOzs7Ozs7QUE1Qko7QUFBQTtBQUFBLHFDQWlDa0I7QUFDVixnQkFBTSxPQUFPLFNBQVMsSUFBdEI7QUFDQTtBQUNBLGdCQUFNLEtBQUssS0FBSyxXQUFMLEVBQVg7QUFDQTtBQUNBLGdCQUFJLEtBQUssS0FBSyxTQUFkLEVBQXlCO0FBQ3JCO0FBQ0EscUJBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsS0FBSyxXQUF4QjtBQUNILGFBSEQsTUFHTztBQUNIO0FBQ0EscUJBQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsS0FBSyxXQUEzQjtBQUNIO0FBQ0o7O0FBRUQ7Ozs7OztBQS9DSjtBQUFBO0FBQUEsc0NBb0RtQjtBQUNYLG1CQUFPLE9BQU8sV0FBUCxJQUFzQixTQUFTLGVBQVQsQ0FBeUIsU0FBdEQ7QUFDSDtBQXRETDs7QUFBQTtBQUFBOztBQXlEQTs7OztBQUlBLE1BQU0sTUFBTjtBQUVJLHVCQUFlO0FBQUE7O0FBQ1gsYUFBSyxXQUFMLEdBQW1CLFNBQVMsZ0JBQVQsQ0FBMEIsZ0JBQTFCLENBQW5CLENBRFcsQ0FDcUQ7QUFDaEUsYUFBSyxhQUFMLEdBQXFCLFNBQVMsYUFBVCxDQUF1QixTQUF2QixDQUFyQixDQUZXLENBRTZDO0FBQ3hELGFBQUssS0FBTCxHQUFhLFNBQVMsY0FBVCxDQUF3QixPQUF4QixDQUFiLENBSFcsQ0FHb0M7QUFDL0MsYUFBSyxXQUFMLEdBQW1CLHNCQUFuQixDQUpXLENBSWdDO0FBQzNDLGFBQUssSUFBTCxHQUFZLFNBQVMsSUFBckIsQ0FMVyxDQUtnQjtBQUM5Qjs7QUFFRDs7Ozs7OztBQVZKO0FBQUE7QUFBQSwrQkFlWTtBQUFBOztBQUNKO0FBQ0E7QUFDQSxlQUFHLEtBQUgsQ0FBUyxJQUFULENBQWMsS0FBSyxXQUFuQixFQUFnQyxPQUFoQyxDQUF3QyxlQUFPO0FBQzNDLG9CQUFJLGdCQUFKLENBQXFCLE9BQXJCLEVBQThCLGFBQUs7QUFDL0I7QUFDQSwyQkFBSyxZQUFMO0FBQ0gsaUJBSEQsRUFHRyxLQUhIO0FBSUgsYUFMRDs7QUFPQTtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxnQkFBWCxDQUE0QixPQUE1QixFQUFxQyxhQUFLO0FBQ3RDO0FBQ0EsdUJBQUssWUFBTDtBQUNILGFBSEQsRUFHRyxLQUhIO0FBSUg7O0FBRUQ7Ozs7OztBQWhDSjtBQUFBO0FBQUEsdUNBcUNvQjtBQUNaO0FBQ0EsaUJBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsTUFBcEIsQ0FBMkIsS0FBSyxXQUFoQztBQUNBO0FBQ0EsaUJBQUssY0FBTDtBQUNIOztBQUVEOzs7Ozs7QUE1Q0o7QUFBQTtBQUFBLHlDQWlEc0I7QUFDZCxnQkFBSSxLQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLFFBQXBCLENBQTZCLEtBQUssV0FBbEMsQ0FBSixFQUFvRDtBQUNoRCxxQkFBSyxhQUFMLENBQW1CLFlBQW5CLENBQWdDLGFBQWhDLEVBQStDLEtBQS9DO0FBQ0gsYUFGRCxNQUVPO0FBQ0gscUJBQUssYUFBTCxDQUFtQixZQUFuQixDQUFnQyxhQUFoQyxFQUErQyxJQUEvQztBQUNIO0FBQ0o7QUF2REw7O0FBQUE7QUFBQTs7QUEyREE7Ozs7OztBQU1BLE1BQU0sY0FBTjtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBOzs7QUFXSTs7Ozs7Ozs7O0FBWEosbUNBb0J1QixRQXBCdkIsRUFvQmlDLEtBcEJqQyxFQW9Cd0MsV0FwQnhDLEVBb0JxRDtBQUM3QyxnQkFBTSxVQUFVLFNBQVMsY0FBVCxDQUF3QixXQUF4QixDQUFoQjtBQUNBLGdCQUFJLE9BQUosRUFBYTtBQUNULHdCQUFRLFNBQVIsR0FBb0IsS0FBSyxjQUFMLENBQW9CLFFBQXBCLEVBQThCLEtBQTlCLENBQXBCO0FBQ0g7QUFDRCxnQkFBTSxRQUFRLElBQUksS0FBSixDQUFVLGdCQUFWLENBQWQ7QUFDQSxtQkFBTyxhQUFQLENBQXFCLEtBQXJCO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7QUE3Qko7QUFBQTtBQUFBLHVDQXNDMkIsR0F0QzNCLEVBc0NnQyxJQXRDaEMsRUFzQ3NDO0FBQzlCLGdCQUFNLEtBQUssQ0FBQyxLQUFLLElBQUwsQ0FBVSxHQUFWLENBQUQsR0FDUCxLQUFLLEtBQUwsQ0FBVyxHQUFYLElBQWtCLEtBQUssS0FBTCxDQUFXLEdBQVgsS0FDbEIsS0FBSyxjQUFMLENBQW9CLFNBQVMsY0FBVCxDQUF3QixHQUF4QixFQUE2QixTQUFqRCxDQUZPLEdBSUgsSUFBSSxRQUFKLENBQWEsS0FBYixFQUFvQiwyREFFcEIsb0JBRm9CLEdBSXBCLElBQ0ssT0FETCxDQUNhLFdBRGIsRUFDMEIsR0FEMUIsRUFFSyxLQUZMLENBRVcsSUFGWCxFQUVpQixJQUZqQixDQUVzQixJQUZ0QixFQUdLLE9BSEwsQ0FHYSxrQkFIYixFQUdpQyxNQUhqQyxFQUlLLE9BSkwsQ0FJYSxhQUpiLEVBSTRCLFFBSjVCLEVBS0ssS0FMTCxDQUtXLElBTFgsRUFNSyxJQU5MLENBTVUsS0FOVixFQU9LLEtBUEwsQ0FPVyxJQVBYLEVBUUssSUFSTCxDQVFVLFVBUlYsRUFTSyxLQVRMLENBU1csSUFUWCxFQVVLLElBVkwsQ0FVVSxLQVZWLENBSm9CLEdBZ0JkLHdCQWhCTixDQUpSOztBQXNCQSxtQkFBTyxPQUFPLEdBQUksSUFBSixDQUFQLEdBQW9CLEVBQTNCO0FBQ0g7O0FBRUQ7Ozs7OztBQWhFSjtBQUFBO0FBQUEsK0JBcUVtQixHQXJFbkIsRUFxRXdCO0FBQ2hCLHFCQUFTLElBQVQsQ0FBYyxTQUFkLENBQXdCLE1BQXhCLENBQStCLFNBQS9CO0FBQ0EscUJBQVMsY0FBVCxDQUF3QixHQUF4QixFQUE2QixTQUE3QjtBQUNIO0FBeEVMO0FBQUE7OztBQUVJOzs7OztBQUZKLDRCQU93QjtBQUNoQixtQkFBTyxFQUFQO0FBQ0g7QUFUTDs7QUFBQTtBQUFBOztBQTRFQTs7Ozs7QUFLQSxNQUFNLFNBQU4sR0FBa0IsWUFBWTtBQUMxQixRQUFNLEtBQUssU0FBUyxjQUFULENBQXdCLGFBQXhCLENBQVg7QUFDQSxRQUFJLEVBQUosRUFBUTtBQUNKLFdBQUcsZ0JBQUgsQ0FBb0IsT0FBcEIsRUFBNkIsVUFBQyxDQUFELEVBQU87QUFDaEMsbUJBQU8sUUFBUCxDQUFnQixDQUFoQixFQUFtQixDQUFuQjtBQUNBLGNBQUUsY0FBRjtBQUNILFNBSEQsRUFHRyxLQUhIO0FBSUg7QUFDSixDQVJEOztBQVVBOzs7OztBQUtBLE1BQU0sV0FBTixHQUFvQixZQUFZO0FBQzVCLFFBQU0sYUFBYSxHQUFuQjtBQUNBLFFBQU0sY0FBYyxJQUFwQjtBQUNBLFFBQU0sT0FBTyxTQUFTLElBQXRCO0FBQ0EsV0FBTyxVQUFQLENBQWtCLFlBQU07QUFDcEIsYUFBSyxTQUFMLENBQWUsTUFBZixDQUFzQixVQUF0QjtBQUNILEtBRkQsRUFFRyxVQUZIO0FBR0EsV0FBTyxVQUFQLENBQWtCLFlBQU07QUFDcEIsYUFBSyxTQUFMLENBQWUsTUFBZixDQUFzQixVQUF0QjtBQUNILEtBRkQsRUFFRyxXQUZIO0FBR0gsQ0FWRDs7QUFZQTs7Ozs7QUFLQSxNQUFNLGlCQUFOLEdBQTBCLFlBQVk7QUFDbEMsUUFBTSxhQUFhLE9BQU8sV0FBUCxHQUFxQixJQUF4QztBQUNBLGFBQVMsZUFBVCxDQUF5QixLQUF6QixDQUErQixXQUEvQixDQUEyQyxjQUEzQyxFQUE4RCxVQUE5RDtBQUNILENBSEQ7O0FBS0E7Ozs7O0FBS0EsTUFBTSx5QkFBTixHQUFrQyxZQUFZO0FBQzFDLFFBQU0saUJBQWlCLFNBQWpCLGNBQWlCLEdBQU07QUFDekIsWUFBTSxPQUFPLFNBQVMsZ0JBQVQsQ0FBMEIsNEJBQTFCLENBQWI7QUFDQSxZQUFJLENBQUMsS0FBSyxNQUFWLEVBQWtCO0FBQ2Q7QUFDSDtBQUNELFdBQUcsS0FBSCxDQUFTLElBQVQsQ0FBYyxJQUFkLEVBQW9CLE9BQXBCLENBQTRCLGVBQU87QUFDL0IsZ0JBQUksZ0JBQUosQ0FBcUIsT0FBckIsRUFBOEIsYUFBSztBQUMvQix1QkFBTyxRQUFQLENBQWdCLElBQWhCLEdBQXVCLEVBQUUsTUFBRixDQUFTLE9BQVQsQ0FBaUIsSUFBeEM7QUFDQSxrQkFBRSxjQUFGO0FBQ0gsYUFIRCxFQUdHLEtBSEg7QUFJSCxTQUxEO0FBTUgsS0FYRDtBQVlBLFFBQU0sZ0JBQWdCLFNBQWhCLGFBQWdCLEdBQU07QUFDeEIsaUJBQVMsSUFBVCxDQUFjLFNBQWQsQ0FBd0IsTUFBeEIsQ0FBK0IsU0FBL0I7QUFDSCxLQUZEO0FBR0EsV0FBTyxnQkFBUCxDQUF3QixnQkFBeEIsRUFBMEMsYUFBSztBQUMzQztBQUNBO0FBQ0gsS0FIRCxFQUdHLEtBSEg7QUFJSCxDQXBCRDs7a0JBdUJlLEsiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIiLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG4gIChmYWN0b3J5KChnbG9iYWwuV0hBVFdHRmV0Y2ggPSB7fSkpKTtcbn0odGhpcywgKGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuICB2YXIgc3VwcG9ydCA9IHtcbiAgICBzZWFyY2hQYXJhbXM6ICdVUkxTZWFyY2hQYXJhbXMnIGluIHNlbGYsXG4gICAgaXRlcmFibGU6ICdTeW1ib2wnIGluIHNlbGYgJiYgJ2l0ZXJhdG9yJyBpbiBTeW1ib2wsXG4gICAgYmxvYjpcbiAgICAgICdGaWxlUmVhZGVyJyBpbiBzZWxmICYmXG4gICAgICAnQmxvYicgaW4gc2VsZiAmJlxuICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG5ldyBCbG9iKCk7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9KSgpLFxuICAgIGZvcm1EYXRhOiAnRm9ybURhdGEnIGluIHNlbGYsXG4gICAgYXJyYXlCdWZmZXI6ICdBcnJheUJ1ZmZlcicgaW4gc2VsZlxuICB9O1xuXG4gIGZ1bmN0aW9uIGlzRGF0YVZpZXcob2JqKSB7XG4gICAgcmV0dXJuIG9iaiAmJiBEYXRhVmlldy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihvYmopXG4gIH1cblxuICBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlcikge1xuICAgIHZhciB2aWV3Q2xhc3NlcyA9IFtcbiAgICAgICdbb2JqZWN0IEludDhBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDhBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJyxcbiAgICAgICdbb2JqZWN0IEludDE2QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQxNkFycmF5XScsXG4gICAgICAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgICAnW29iamVjdCBVaW50MzJBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgRmxvYXQzMkFycmF5XScsXG4gICAgICAnW29iamVjdCBGbG9hdDY0QXJyYXldJ1xuICAgIF07XG5cbiAgICB2YXIgaXNBcnJheUJ1ZmZlclZpZXcgPVxuICAgICAgQXJyYXlCdWZmZXIuaXNWaWV3IHx8XG4gICAgICBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiAmJiB2aWV3Q2xhc3Nlcy5pbmRleE9mKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopKSA+IC0xXG4gICAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKTtcbiAgICB9XG4gICAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXl9gfH5dL2kudGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWUnKVxuICAgIH1cbiAgICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgLy8gQnVpbGQgYSBkZXN0cnVjdGl2ZSBpdGVyYXRvciBmb3IgdGhlIHZhbHVlIGxpc3RcbiAgZnVuY3Rpb24gaXRlcmF0b3JGb3IoaXRlbXMpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSB7XG4gICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gaXRlbXMuc2hpZnQoKTtcbiAgICAgICAgcmV0dXJuIHtkb25lOiB2YWx1ZSA9PT0gdW5kZWZpbmVkLCB2YWx1ZTogdmFsdWV9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgICBpdGVyYXRvcltTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvclxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlcmF0b3JcbiAgfVxuXG4gIGZ1bmN0aW9uIEhlYWRlcnMoaGVhZGVycykge1xuICAgIHRoaXMubWFwID0ge307XG5cbiAgICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCB2YWx1ZSk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaGVhZGVycykpIHtcbiAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQoaGVhZGVyWzBdLCBoZWFkZXJbMV0pO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfSBlbHNlIGlmIChoZWFkZXJzKSB7XG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMubWFwW25hbWVdO1xuICAgIHRoaXMubWFwW25hbWVdID0gb2xkVmFsdWUgPyBvbGRWYWx1ZSArICcsICcgKyB2YWx1ZSA6IHZhbHVlO1xuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlWydkZWxldGUnXSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV07XG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgIHJldHVybiB0aGlzLmhhcyhuYW1lKSA/IHRoaXMubWFwW25hbWVdIDogbnVsbFxuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAuaGFzT3duUHJvcGVydHkobm9ybWFsaXplTmFtZShuYW1lKSlcbiAgfTtcblxuICBIZWFkZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5tYXApIHtcbiAgICAgIGlmICh0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHRoaXMubWFwW25hbWVdLCBuYW1lLCB0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgaXRlbXMucHVzaChuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW107XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpdGVtcy5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKTtcbiAgICB9KTtcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH07XG5cbiAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gSGVhZGVycy5wcm90b3R5cGUuZW50cmllcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpKVxuICAgIH1cbiAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG4gICAgICB9O1xuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzQXJyYXlCdWZmZXIoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcik7XG4gICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGJsb2IpO1xuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgdmFyIHByb21pc2UgPSBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKTtcbiAgICByZWFkZXIucmVhZEFzVGV4dChibG9iKTtcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEFycmF5QnVmZmVyQXNUZXh0KGJ1Zikge1xuICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmKTtcbiAgICB2YXIgY2hhcnMgPSBuZXcgQXJyYXkodmlldy5sZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGFyc1tpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUodmlld1tpXSk7XG4gICAgfVxuICAgIHJldHVybiBjaGFycy5qb2luKCcnKVxuICB9XG5cbiAgZnVuY3Rpb24gYnVmZmVyQ2xvbmUoYnVmKSB7XG4gICAgaWYgKGJ1Zi5zbGljZSkge1xuICAgICAgcmV0dXJuIGJ1Zi5zbGljZSgwKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1Zi5ieXRlTGVuZ3RoKTtcbiAgICAgIHZpZXcuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZikpO1xuICAgICAgcmV0dXJuIHZpZXcuYnVmZmVyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gQm9keSgpIHtcbiAgICB0aGlzLmJvZHlVc2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgIHRoaXMuX2JvZHlJbml0ID0gYm9keTtcbiAgICAgIGlmICghYm9keSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9ICcnO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5O1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmJsb2IgJiYgQmxvYi5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHk7XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuZm9ybURhdGEgJiYgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUZvcm1EYXRhID0gYm9keTtcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keS50b1N0cmluZygpO1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIHN1cHBvcnQuYmxvYiAmJiBpc0RhdGFWaWV3KGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkuYnVmZmVyKTtcbiAgICAgICAgLy8gSUUgMTAtMTEgY2FuJ3QgaGFuZGxlIGEgRGF0YVZpZXcgYm9keS5cbiAgICAgICAgdGhpcy5fYm9keUluaXQgPSBuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSk7XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgKEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpIHx8IGlzQXJyYXlCdWZmZXJWaWV3KGJvZHkpKSkge1xuICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChib2R5KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ3RleHQvcGxhaW47Y2hhcnNldD1VVEYtOCcpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlCbG9iICYmIHRoaXMuX2JvZHlCbG9iLnR5cGUpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCB0aGlzLl9ib2R5QmxvYi50eXBlKTtcbiAgICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLTgnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgICB0aGlzLmJsb2IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcyk7XG4gICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKSlcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYicpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keVRleHRdKSlcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnN1bWVkKHRoaXMpIHx8IFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpLnRoZW4ocmVhZEJsb2JBc0FycmF5QnVmZmVyKVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcyk7XG4gICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICByZXR1cm4gcmVhZEJsb2JBc1RleHQodGhpcy5fYm9keUJsb2IpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlYWRBcnJheUJ1ZmZlckFzVGV4dCh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIHRleHQnKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgIHRoaXMuZm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLmpzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKEpTT04ucGFyc2UpXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBIVFRQIG1ldGhvZHMgd2hvc2UgY2FwaXRhbGl6YXRpb24gc2hvdWxkIGJlIG5vcm1hbGl6ZWRcbiAgdmFyIG1ldGhvZHMgPSBbJ0RFTEVURScsICdHRVQnLCAnSEVBRCcsICdPUFRJT05TJywgJ1BPU1QnLCAnUFVUJ107XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgIHZhciB1cGNhc2VkID0gbWV0aG9kLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuIG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xID8gdXBjYXNlZCA6IG1ldGhvZFxuICB9XG5cbiAgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5O1xuXG4gICAgaWYgKGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgICAgaWYgKGlucHV0LmJvZHlVc2VkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpXG4gICAgICB9XG4gICAgICB0aGlzLnVybCA9IGlucHV0LnVybDtcbiAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBpbnB1dC5jcmVkZW50aWFscztcbiAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpO1xuICAgICAgfVxuICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2Q7XG4gICAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlO1xuICAgICAgdGhpcy5zaWduYWwgPSBpbnB1dC5zaWduYWw7XG4gICAgICBpZiAoIWJvZHkgJiYgaW5wdXQuX2JvZHlJbml0ICE9IG51bGwpIHtcbiAgICAgICAgYm9keSA9IGlucHV0Ll9ib2R5SW5pdDtcbiAgICAgICAgaW5wdXQuYm9keVVzZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVybCA9IFN0cmluZyhpbnB1dCk7XG4gICAgfVxuXG4gICAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgdGhpcy5jcmVkZW50aWFscyB8fCAnc2FtZS1vcmlnaW4nO1xuICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICB9XG4gICAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgJ0dFVCcpO1xuICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbDtcbiAgICB0aGlzLnNpZ25hbCA9IG9wdGlvbnMuc2lnbmFsIHx8IHRoaXMuc2lnbmFsO1xuICAgIHRoaXMucmVmZXJyZXIgPSBudWxsO1xuXG4gICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gJ0dFVCcgfHwgdGhpcy5tZXRob2QgPT09ICdIRUFEJykgJiYgYm9keSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHMnKVxuICAgIH1cbiAgICB0aGlzLl9pbml0Qm9keShib2R5KTtcbiAgfVxuXG4gIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMsIHtib2R5OiB0aGlzLl9ib2R5SW5pdH0pXG4gIH07XG5cbiAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgIGJvZHlcbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdCgnJicpXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgICBpZiAoYnl0ZXMpIHtcbiAgICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdCgnPScpO1xuICAgICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgJyAnKTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc9JykucmVwbGFjZSgvXFwrL2csICcgJyk7XG4gICAgICAgICAgZm9ybS5hcHBlbmQoZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpLCBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgcmV0dXJuIGZvcm1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlSGVhZGVycyhyYXdIZWFkZXJzKSB7XG4gICAgdmFyIGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICAgIC8vIFJlcGxhY2UgaW5zdGFuY2VzIG9mIFxcclxcbiBhbmQgXFxuIGZvbGxvd2VkIGJ5IGF0IGxlYXN0IG9uZSBzcGFjZSBvciBob3Jpem9udGFsIHRhYiB3aXRoIGEgc3BhY2VcbiAgICAvLyBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNzIzMCNzZWN0aW9uLTMuMlxuICAgIHZhciBwcmVQcm9jZXNzZWRIZWFkZXJzID0gcmF3SGVhZGVycy5yZXBsYWNlKC9cXHI/XFxuW1xcdCBdKy9nLCAnICcpO1xuICAgIHByZVByb2Nlc3NlZEhlYWRlcnMuc3BsaXQoL1xccj9cXG4vKS5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoJzonKTtcbiAgICAgIHZhciBrZXkgPSBwYXJ0cy5zaGlmdCgpLnRyaW0oKTtcbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gcGFydHMuam9pbignOicpLnRyaW0oKTtcbiAgICAgICAgaGVhZGVycy5hcHBlbmQoa2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhlYWRlcnNcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXF1ZXN0LnByb3RvdHlwZSk7XG5cbiAgZnVuY3Rpb24gUmVzcG9uc2UoYm9keUluaXQsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnZGVmYXVsdCc7XG4gICAgdGhpcy5zdGF0dXMgPSBvcHRpb25zLnN0YXR1cyA9PT0gdW5kZWZpbmVkID8gMjAwIDogb3B0aW9ucy5zdGF0dXM7XG4gICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMDtcbiAgICB0aGlzLnN0YXR1c1RleHQgPSAnc3RhdHVzVGV4dCcgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzVGV4dCA6ICdPSyc7XG4gICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsIHx8ICcnO1xuICAgIHRoaXMuX2luaXRCb2R5KGJvZHlJbml0KTtcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpO1xuXG4gIFJlc3BvbnNlLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgICBzdGF0dXNUZXh0OiB0aGlzLnN0YXR1c1RleHQsXG4gICAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgICAgdXJsOiB0aGlzLnVybFxuICAgIH0pXG4gIH07XG5cbiAgUmVzcG9uc2UuZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogMCwgc3RhdHVzVGV4dDogJyd9KTtcbiAgICByZXNwb25zZS50eXBlID0gJ2Vycm9yJztcbiAgICByZXR1cm4gcmVzcG9uc2VcbiAgfTtcblxuICB2YXIgcmVkaXJlY3RTdGF0dXNlcyA9IFszMDEsIDMwMiwgMzAzLCAzMDcsIDMwOF07XG5cbiAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHN0YXR1cyBjb2RlJylcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IHN0YXR1cywgaGVhZGVyczoge2xvY2F0aW9uOiB1cmx9fSlcbiAgfTtcblxuICBleHBvcnRzLkRPTUV4Y2VwdGlvbiA9IHNlbGYuRE9NRXhjZXB0aW9uO1xuICB0cnkge1xuICAgIG5ldyBleHBvcnRzLkRPTUV4Y2VwdGlvbigpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBleHBvcnRzLkRPTUV4Y2VwdGlvbiA9IGZ1bmN0aW9uKG1lc3NhZ2UsIG5hbWUpIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgdmFyIGVycm9yID0gRXJyb3IobWVzc2FnZSk7XG4gICAgICB0aGlzLnN0YWNrID0gZXJyb3Iuc3RhY2s7XG4gICAgfTtcbiAgICBleHBvcnRzLkRPTUV4Y2VwdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSk7XG4gICAgZXhwb3J0cy5ET01FeGNlcHRpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gZXhwb3J0cy5ET01FeGNlcHRpb247XG4gIH1cblxuICBmdW5jdGlvbiBmZXRjaChpbnB1dCwgaW5pdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpO1xuXG4gICAgICBpZiAocmVxdWVzdC5zaWduYWwgJiYgcmVxdWVzdC5zaWduYWwuYWJvcnRlZCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBleHBvcnRzLkRPTUV4Y2VwdGlvbignQWJvcnRlZCcsICdBYm9ydEVycm9yJykpXG4gICAgICB9XG5cbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgZnVuY3Rpb24gYWJvcnRYaHIoKSB7XG4gICAgICAgIHhoci5hYm9ydCgpO1xuICAgICAgfVxuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBwYXJzZUhlYWRlcnMoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpIHx8ICcnKVxuICAgICAgICB9O1xuICAgICAgICBvcHRpb25zLnVybCA9ICdyZXNwb25zZVVSTCcgaW4geGhyID8geGhyLnJlc3BvbnNlVVJMIDogb3B0aW9ucy5oZWFkZXJzLmdldCgnWC1SZXF1ZXN0LVVSTCcpO1xuICAgICAgICB2YXIgYm9keSA9ICdyZXNwb25zZScgaW4geGhyID8geGhyLnJlc3BvbnNlIDogeGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSk7XG4gICAgICB9O1xuXG4gICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBleHBvcnRzLkRPTUV4Y2VwdGlvbignQWJvcnRlZCcsICdBYm9ydEVycm9yJykpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKTtcblxuICAgICAgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09ICdpbmNsdWRlJykge1xuICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAocmVxdWVzdC5jcmVkZW50aWFscyA9PT0gJ29taXQnKSB7XG4gICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCdyZXNwb25zZVR5cGUnIGluIHhociAmJiBzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJztcbiAgICAgIH1cblxuICAgICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgdmFsdWUpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXF1ZXN0LnNpZ25hbCkge1xuICAgICAgICByZXF1ZXN0LnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0WGhyKTtcblxuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gRE9ORSAoc3VjY2VzcyBvciBmYWlsdXJlKVxuICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgcmVxdWVzdC5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydFhocik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB4aHIuc2VuZCh0eXBlb2YgcmVxdWVzdC5fYm9keUluaXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0KTtcbiAgICB9KVxuICB9XG5cbiAgZmV0Y2gucG9seWZpbGwgPSB0cnVlO1xuXG4gIGlmICghc2VsZi5mZXRjaCkge1xuICAgIHNlbGYuZmV0Y2ggPSBmZXRjaDtcbiAgICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzO1xuICAgIHNlbGYuUmVxdWVzdCA9IFJlcXVlc3Q7XG4gICAgc2VsZi5SZXNwb25zZSA9IFJlc3BvbnNlO1xuICB9XG5cbiAgZXhwb3J0cy5IZWFkZXJzID0gSGVhZGVycztcbiAgZXhwb3J0cy5SZXF1ZXN0ID0gUmVxdWVzdDtcbiAgZXhwb3J0cy5SZXNwb25zZSA9IFJlc3BvbnNlO1xuICBleHBvcnRzLmZldGNoID0gZmV0Y2g7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbiIsImltcG9ydCBVdGlscyBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyB1cmwgfSBmcm9tICdpbnNwZWN0b3InO1xuXG4vKipcbiAqIERSSU5LU0FQSSBDTEFTU1xuICogRGVhbHMgd2l0aCB0YWxraW5nIHRvIFRoZSBDb2NrdGFpbCBEQlxuICogXG4gKiAvanMvZHJpbmtzLWFwaS9pbmRleC5qc1xuICovXG5jbGFzcyBEcmlua3NBUEkge1xuXG4gICAgLyoqXG4gICAgICogU2V0IHRlc3QgbW9kZSAoZ2V0IGxvY2FsIGRhdGEgaWYgd2UncmUgdGVzdGluZywgcmVtb3RlIGRhdGEgaWYgbm90KVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXQgVEVTVF9NT0RFICgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZmVyZW5jZSB0byB0aGUgdGVtcGxhdGUgdXNlZCBmb3IgcmVjaXBlc1xuICAgICAqIFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gSUQgb2YgdGhlIHRlbXBsYXRlXG4gICAgICovXG4gICAgc3RhdGljIGdldCBERVRBSUxTX1RFTVBMQVRFICgpIHtcbiAgICAgICAgcmV0dXJuIGBjb2NrdGFpbF9kZXRhaWxzYDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWZlcmVuY2UgdG8gdGhlIHRlbXBsYXRlIHVzZWQgZm9yIHRoZSBsaXN0c1xuICAgICAqIFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gSUQgb2YgdGhlIHRlbXBsYXRlXG4gICAgICovXG4gICAgc3RhdGljIGdldCBMSVNUX1RFTVBMQVRFICgpIHtcbiAgICAgICAgcmV0dXJuIGBjb2NrdGFpbHNfbGlzdGA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSURzIGZvciB0aGUgUG9wdWxhciBzZWN0aW9uLCBlYWNoIG9uZSBpcyBhIGNvY2t0YWlsXG4gICAgICogXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBJRCBvZiB0aGUgdGVtcGxhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IFBPUFVMQVJfSURTICgpIHtcbiAgICAgICAgcmV0dXJuIFsxMTAwMCwgMTEwMDEsIDExMDAyLCAxMTAwNywgMTcyMDddO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdvcmtzIG91dCB3aGljaCBBUEkgVVJMIHdlIHNob3VsZCBiZSB1c2luZ1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjYXRlZ29yeSAtIFdoYXQgc2VjdGlvbiB3ZSdyZSBvblxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpZCAtIElmIHdlJ3JlIGFza2luZyBmb3IgYSBwYXJ0aWN1bGFyIHJlY2lwZSwgdGhpcyBpcyB0aGUgSURcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB1cmxcbiAgICAgKi9cbiAgICBzdGF0aWMgQVBJX1VSTCAoY2F0ZWdvcnksIGlkKSB7XG4gICAgICAgIGxldCBhcGkgPSBgaHR0cHM6Ly93d3cudGhlY29ja3RhaWxkYi5jb20vYXBpL2pzb24vdjEvMS9gO1xuICAgICAgICBsZXQgc3VmZml4ID0gdGhpcy5URVNUX01PREUgPyAnLmpzb24nIDogJy5waHAnOyBcbiAgICAgICAgbGV0IHF1ZXJ5ID0gYGA7XG4gICAgICAgIGxldCBkZXN0O1xuICAgICAgICBpZiAodGhpcy5URVNUX01PREUpIHtcbiAgICAgICAgICAgIGFwaSA9IGAvbG9jYWxfZGF0YWA7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlICdyYW5kb20nOlxuICAgICAgICAgICAgICAgIGRlc3QgPSBgcmFuZG9tYDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYnktaWQnOlxuICAgICAgICAgICAgICAgIGRlc3QgPSBgbG9va3VwYDtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IGA/aT0ke2lkfWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2ZpbHRlcic6XG4gICAgICAgICAgICAgICAgZGVzdCA9IGBmaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHF1ZXJ5ID0gYD9pPSR7aWR9YDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndmlyZ2luJzpcbiAgICAgICAgICAgICAgICBkZXN0ID0gYGZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSBgP2E9JHtpZH1gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHthcGl9JHtkZXN0fSR7c3VmZml4fSR7cXVlcnl9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBjb2NrdGFpbCByZWNpcGUgZnJvbSBhbiBJRC5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIFdoYXQgc2VjdGlvbiB3ZSdyZSBvblxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpZCAtIElmIHdlJ3JlIGFza2luZyBmb3IgYSBwYXJ0aWN1bGFyIHJlY2lwZSwgdGhpcyBpcyB0aGUgSURcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0Q29ja3RhaWxEZXRhaWxzICh0eXBlLCBpZCkge1xuICAgICAgICBjb25zdCBzdWNjY2VzcyA9IChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICBVdGlscy5UZW1wbGF0ZUVuZ2luZS5jcmVhdGVIVE1MKGAke3RoaXMuREVUQUlMU19URU1QTEFURX1gLCB7IGRhdGE6IHJlc3VsdHMgfSwgJ2NvY2t0YWlsLWRhdGEnKTtcbiAgICAgICAgfTtcbiAgICAgICAgZmV0Y2goYCR7dGhpcy5BUElfVVJMKHR5cGUsIGlkKX1gKVxuXHRcdCAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG5cdFx0ICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1x0XG5cdFx0ICAgIH0pXG5cdFx0ICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICBVdGlscy5UZW1wbGF0ZUVuZ2luZS5ub0RhdGEoJ2NvY2t0YWlsLWRhdGEnKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhIGxpc3Qgb2YgY29ja3RhaWxzXG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgc3RhdGljIGdldENvY2t0YWlscyAoKSB7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaDtcbiAgICAgICAgaWYgKHF1ZXJ5ICYmIHF1ZXJ5LmluZGV4T2YoJ2xpc3Q9JykpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0UXVlcnkgPSBxdWVyeS5zcGxpdCgnbGlzdD0nKVsxXTtcbiAgICAgICAgICAgIGlmIChzcGxpdFF1ZXJ5ICYmIHNwbGl0UXVlcnkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGlzdFR5cGUgPSBzcGxpdFF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2Nlc3MgPSAocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBVdGlscy5UZW1wbGF0ZUVuZ2luZS5jcmVhdGVIVE1MKGAke3RoaXMuTElTVF9URU1QTEFURX1gLCB7IGRhdGE6IHJlc3VsdHMgfSwgJ2NvY2t0YWlsLWRhdGEnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHN3aXRjaCAobGlzdFR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncG9wdWxhcic6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cmxzID0gdGhpcy5QT1BVTEFSX0lEUy5tYXAoaWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmZXRjaChgJHt0aGlzLkFQSV9VUkwoJ2J5LWlkJywgaWQpfWApLnRoZW4odmFsdWUgPT4gdmFsdWUuanNvbigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwodXJscylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Nlc3MocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLlRlbXBsYXRlRW5naW5lLm5vRGF0YSgnY29ja3RhaWwtZGF0YScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndmlyZ2luJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZldGNoKGAke3RoaXMuQVBJX1VSTCgndmlyZ2luJywgJ25vbl9hbGNvaG9saWMnKX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHZhbHVlID0+IHZhbHVlLmpzb24oKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Nlc3MocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLlRlbXBsYXRlRW5naW5lLm5vRGF0YSgnY29ja3RhaWwtZGF0YScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZldGNoKGAke3RoaXMuQVBJX1VSTCgnZmlsdGVyJywgbGlzdFR5cGUpfWApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4odmFsdWUgPT4gdmFsdWUuanNvbigpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUubm9EYXRhKCdjb2NrdGFpbC1kYXRhJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8nO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB3aGF0IHR5cGUgb2YgcmVjaXBlIHRvIHNob3cuIFJhbmRvbSwgb3IgYnkgSUQuIEdldHMgdGhlIElEIGZyb20gdGhlIHVybC5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0Q29ja3RhaWwgKCkge1xuICAgICAgICBjb25zdCBxdWVyeSA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgICAgIGlmIChxdWVyeSAmJiBxdWVyeS5pbmRleE9mKCdpZD0nKSkge1xuICAgICAgICAgICAgY29uc3Qgc3BsaXRRdWVyeSA9IHF1ZXJ5LnNwbGl0KCdpZD0nKVsxXTtcbiAgICAgICAgICAgIGlmIChzcGxpdFF1ZXJ5ICYmIHNwbGl0UXVlcnkubGVuZ3RoICYmIChwYXJzZUludChzcGxpdFF1ZXJ5KSB8fCBzcGxpdFF1ZXJ5ID09PSAncmFuZG9tJykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpZCA9IHNwbGl0UXVlcnk7XG4gICAgICAgICAgICAgICAgaWYgKGlkID09PSAncmFuZG9tJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldENvY2t0YWlsRGV0YWlscygncmFuZG9tJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb2NrdGFpbERldGFpbHMoJ2J5LWlkJywgaWQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvJztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IERyaW5rc0FQSTsiLCJpbXBvcnQgJ3doYXR3Zy1mZXRjaCdcbmltcG9ydCBEcmlua3NBUEkgZnJvbSAnLi9kcmlua3MtYXBpJztcbmltcG9ydCBOZXdzIGZyb20gJy4vbmV3cyc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogS2lja3MgZXZlcnl0aGluZyBvZmZcbiAqIFxuICogL2pzL21haW4uanNcbiAqL1xuXG4vKipcbiAqIEluaXRpYWxpc2Ugb3VyIG1haW4gYXBwIGNvZGUgd2hlbiB0aGUgRE9NIGlzIHJlYWR5XG4gKi9cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBldmVudCA9PiB7XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBkcmF3ZXIgZnVuY3Rpb25hbGl0eSBmb3Igc21hbGxlciBzY3JlZW4gc2l6ZXNcbiAgICAgKi9cbiAgICBjb25zdCBEcmF3ZXIgPSBuZXcgVXRpbHMuRHJhd2VyKCk7XG4gICAgRHJhd2VyLmluaXQoKTtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2UgdGhlIHNocmlua2luZyBoZWFkZXJcbiAgICAgKi9cbiAgICBjb25zdCBTaHJpbmtIZWFkZXIgPSBuZXcgVXRpbHMuU2hyaW5rSGVhZGVyKCk7XG4gICAgU2hyaW5rSGVhZGVyLmluaXQoKTtcblxuICAgIC8qKlxuICAgICAqIEFkZCB0aGUgYmFjayB0byB0b3AgZnVuY3Rpb25hbGl0eVxuICAgICAqL1xuICAgIFV0aWxzLmJhY2tUb1RvcCgpO1xuXG4gICAgLyoqXG4gICAgICogU3RhcnQgdGhlIHNwbGFzaCBzY3JlZW5cbiAgICAgKi9cbiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NwbGFzaC1zY3JlZW4nKSkge1xuICAgICAgICBVdGlscy5zdGFydFNwbGFzaCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHdlJ3JlIG9uIGEgbGlzdCBwYWdlLCBwYXNzIGl0IHRvIHRoZSBBUEkgYW5kIGxldCBpdCBkZXRlcm1pbmUgd2hhdCB0byBzaG93XG4gICAgICovXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXRlZ29yeS1saXN0JykpIHtcbiAgICAgICAgRHJpbmtzQVBJLmdldENvY2t0YWlscygpO1xuICAgICAgICBVdGlscy5hY3RpdmF0ZUZ1bGxEZXRhaWxCdXR0b25zKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSWYgd2UncmUgb24gYSBkZXRhaWwgcGFnZSwgcGFzcyBpdCB0byB0aGUgQVBJIGFuZCBsZXQgaXQgZGV0ZXJtaW5lIHdoYXQgdG8gc2hvd1xuICAgICAqL1xuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2F0ZWdvcnktY29ja3RhaWwnKSkge1xuICAgICAgICBEcmlua3NBUEkuZ2V0Q29ja3RhaWwoKTtcbiAgICAgICAgVXRpbHMuYWN0aXZhdGVGdWxsRGV0YWlsQnV0dG9ucygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHdlJ3JlIG9uIHRoZSBOZXdzIGluZGV4IHBhZ2UsIGdldCB0aGUgYWxsIG5ld3NcbiAgICAgKi9cbiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhdGVnb3J5LWNvY2t0YWlsLW5ld3MnKSkge1xuICAgICAgICBOZXdzLmdldEFsbE5ld3MoKTtcbiAgICAgICAgVXRpbHMuYWN0aXZhdGVGdWxsRGV0YWlsQnV0dG9ucygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHdlJ3JlIG9uIGFuIGFydGljbGUgcGFnZSBwYWdlLCBwYXNzIGl0IHRvIHRoZSBOZXdzIGFuZCBsZXQgaXQgZGV0ZXJtaW5lIHdoaWNoIG9uZSB0byBzaG93XG4gICAgICovXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXRlZ29yeS1jb2NrdGFpbC1hcnRpY2xlJykpIHtcbiAgICAgICAgTmV3cy5nZXROZXdzKCk7XG4gICAgfVxuXG59KTsiLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xuXG4vKipcbiAqIE5FV1MgQ0xBU1NcbiAqIERlYWxzIHdpdGggdGhlIE5ld3MgYW5kIE5ld3MgQXJ0aWNsZXMgcGFnZXNcbiAqIFxuICogL2pzL25ld3MvaW5kZXguanNcbiAqL1xuY2xhc3MgTmV3cyB7XG5cbiAgICAvKipcbiAgICAgKiBSZWZlcmVuY2UgdG8gdGhlIHRlbXBsYXRlIHVzZWQgZm9yIHJlY2lwZXNcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IElEIG9mIHRoZSB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXQgTkVXU19URU1QTEFURSAoKSB7XG4gICAgICAgIHJldHVybiBgY29ja3RhaWxfbmV3c2A7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXJsIG9mIHRoZSBsb2NhbCBkYXRhXG4gICAgICogXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBVcmwgb2YgdGhlIGxvY2FsIGpzb24gZmlsZVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXQgTkVXU19VUkwgKCkge1xuICAgICAgICByZXR1cm4gYC9kYXRhL25ld3MuanNvbmA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbG9jYWwganNvbiBhbmQgc2VuZHMgYWxsIG9mIHRoZSBkYXRhIHRvIHRoZSB0ZW1wbGF0ZVxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRBbGxOZXdzICgpIHtcbiAgICAgICAgY29uc3Qgc3VjY2Nlc3MgPSAocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUuY3JlYXRlSFRNTChgJHt0aGlzLk5FV1NfVEVNUExBVEV9YCwgeyBkYXRhOiByZXN1bHRzIH0sICdjb2NrdGFpbC1uZXdzJyk7XG4gICAgICAgIH07XG4gICAgICAgIGZldGNoKGAke3RoaXMuTkVXU19VUkx9YClcblx0XHQgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuXHRcdCAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcdFxuXHRcdCAgICB9KVxuXHRcdCAgICAuY2F0Y2goZSA9PiB7XG5cdFx0XHQgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUubm9EYXRhKCdjb2NrdGFpbC1uZXdzJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBsb2NhbCBqc29uIGFuZCBzZW5kcyB0aGUgYXJ0aWNsZSB0aGF0IG1hdGNoZXMgdGhlIElEIGluIHRoZSBhZGRyZXNzIGJhclxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIHN0YXRpYyBnZXROZXdzICgpIHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgICAgICBpZiAocXVlcnkgJiYgcXVlcnkuaW5kZXhPZignaWQ9JykpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0UXVlcnkgPSBxdWVyeS5zcGxpdCgnaWQ9JylbMV07XG4gICAgICAgICAgICBpZiAoc3BsaXRRdWVyeSAmJiBzcGxpdFF1ZXJ5Lmxlbmd0aCAmJiBwYXJzZUludChzcGxpdFF1ZXJ5LCAxMCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpZCA9IHBhcnNlSW50KHNwbGl0UXVlcnksIDEwKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjY2VzcyA9IChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFydGljbGUgPSByZXN1bHRzLmZpbHRlcihhcnRpY2xlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnRpY2xlLmlkID09PSBpZDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYXJ0aWNsZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLlRlbXBsYXRlRW5naW5lLmNyZWF0ZUhUTUwoYCR7dGhpcy5ORVdTX1RFTVBMQVRFfWAsIHsgZGF0YTogYXJ0aWNsZSB9LCAnY29ja3RhaWwtbmV3cycpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZmV0Y2goYCR7dGhpcy5ORVdTX1VSTH1gKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Nlc3MocmVzdWx0cyk7XHRcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUubm9EYXRhKCdjb2NrdGFpbC1uZXdzJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvJztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBOZXdzOyIsIi8qKlxuICogVVRJTFMgQ0xBU1NcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIHVzZWQgYW55d2hlcmUgd2l0aGluIHRoZSBzaXRlXG4gKiBcbiAqIE5PVEU6XG4gKiBBcyBjcmVkaXRlZCBiZWxvdywgYW5kIGluIHRoZSByZXBvcnQuaHRtbCwgdGhlIGZ1bmN0aW9uIGJlbG93ICh0ZW1wbGF0ZVRvSFRNTClcbiAqIHdhcyB3cml0dGVuIGJ5IEpvaG4gUmVzaWcgYW5kIGZlYXR1cmVkIGluIGEgYmxvZyBwb3N0IGluIDIwMDguIE1vcmUgZGV0YWlsc1xuICogY2FuIGJlIGZvdW5kIGluIHRoZSByZXBvcnQuaHRtbCBmaWxlLlxuICogXG4gKiAvanMvdXRpbHMvaW5kZXguanNcbiAqL1xuY2xhc3MgVXRpbHMge31cblxuLyoqXG4gKiBTSFJJTktIRUFERVIgQ0xBU1NcbiAqIEFkZHMgYSBjbGFzcyB0byB0aGUgYm9keSB3aGVuIGEgdXNlciBzY3JvbGxzLCB0byBzaHJpbmsgdGhlIGhlYWRlciBhbmQgc2hvdyBtb3JlIGNvbnRlbnRcbiAqL1xuVXRpbHMuU2hyaW5rSGVhZGVyID0gY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLnNjcm9sbFBvcyA9IDY0OyAvLyBTY3JvbGwgcG9zaXRpb24sIGluIHBpeGVscywgd2hlbiB0byB0cmlnZ2VyIHRoZSBzaHJpbmtpbmcgaGVhZGVyXG4gICAgICAgIHRoaXMuc2hyaW5rQ2xhc3MgPSAnYm9keS0tc2Nyb2xsZWQnOyAvLyBDbGFzcyB0byBhZGQgdG8gdGhlIGJvZHlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBoZWFkZXIgc2NyaXB0XG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgaW5pdCAoKSB7XG4gICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdGhpcyB0byB3b3JrIG9uIHRoZSBob21lcGFnZVxuICAgICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnZpZGVvLXdyYXBwZXInKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgdGhlIHNjcm9sbCBldmVudCAqL1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgZSA9PiB7XG4gICAgICAgICAgICAvLyBFdmVudCBoZWFyZC4gQ2FsbCB0aGUgc2Nyb2xsUGFnZSBmdW5jdGlvbiAqL1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxQYWdlKCk7XG4gICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAvLyBOb3cgY2FsbCB0aGUgZnVuY3Rpb24gYW55d2F5LCBzbyB3ZSBrbm93IHdoZXJlIHdlIGFyZSBhZnRlciByZWZyZXNoLCBldGNcbiAgICAgICAgdGhpcy5zY3JvbGxQYWdlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyB0aGUgc2Nyb2xsZWQgY2xhc3NcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBzY3JvbGxQYWdlICgpIHtcbiAgICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIC8vIEdyYWIgdGhlIGxhdGVzdCBzY3JvbGwgcG9zaXRpb24gKi9cbiAgICAgICAgY29uc3Qgc3kgPSB0aGlzLnNjcm9sbGVkUG9zKCk7XG4gICAgICAgIC8vIENoZWNrIGlmIHdlJ3ZlIHNjcm9sbGVkIGZhciBlbm91Z2hcbiAgICAgICAgaWYgKHN5ID4gdGhpcy5zY3JvbGxQb3MpIHtcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgc2Nyb2xsZWQgY2xhc3NcbiAgICAgICAgICAgIGJvZHkuY2xhc3NMaXN0LmFkZCh0aGlzLnNocmlua0NsYXNzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgc2Nyb2xsZWQgY2xhc3NcbiAgICAgICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLnNocmlua0NsYXNzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBwYWdlXG4gICAgICogXG4gICAgICogQHJldHVybiBXaW5kb3cgeSBwb3NpdGlvblxuICAgICAqL1xuICAgIHNjcm9sbGVkUG9zICgpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIH1cbn07XG5cbi8qKlxuICogRFJBV0VSIENMQVNTXG4gKiBBZGRzIGEgbmF2aWdhdGlvbiBkcmF3ZXIgZm9yIHNtYWxsZXIgc2NyZWVuc1xuICovXG5VdGlscy5EcmF3ZXIgPSBjbGFzcyB7XG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHRoaXMubWVudUJ1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudG9nZ2xlLWRyYXdlcicpOyAvLyBHcmFiIGFsbCBlbGVtZW50cyB3aXRoIGEgdG9nZ2xlLWRyYXdlciBjbGFzc1xuICAgICAgICB0aGlzLmRyYXdlckVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHJhd2VyJyk7IC8vIFRoZSBkcmF3ZXIgaXRzZWxmXG4gICAgICAgIHRoaXMuY2xvYWsgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2xvYWsnKTsgLy8gVGhlIHNoYWRlZCBvdmVybGF5IHdoZW4gdGhlIGRyYXdlciBpcyBvcGVuXG4gICAgICAgIHRoaXMuZHJhd2VyQ2xhc3MgPSAnYm9keS0tZHJhd2VyLXZpc2libGUnOyAvLyBDbGFzcyB0byBhZGQgdG8gdGhlIGJvZHkgdG8gc2xpZGUgdGhlIGRyYXdlciBpbiBhbmQgb3V0XG4gICAgICAgIHRoaXMuYm9keSA9IGRvY3VtZW50LmJvZHk7IC8vIEdyYWIgYSBoYW5kbGUgb24gdGggYm9keVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2UgdGhlIGRyYXdlciBzY3JpcHRcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBpbml0ICgpIHtcbiAgICAgICAgLy8gQWRkIGEgY2xpY2sgZXZlbnQgdG8gZXZlcnkgZWxlbWVudCB3aXRoIHRoZSB0b2dnbGUgY2xhc3NcbiAgICAgICAgLy8gVGhpcyBpcyBhIG5vZGUgbGlzdCwgc28gdHVybiBpdCBpbnRvIGFuIGFycmF5IGZpcnN0XG4gICAgICAgIFtdLnNsaWNlLmNhbGwodGhpcy5tZW51QnV0dG9ucykuZm9yRWFjaChidG4gPT4ge1xuICAgICAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgdG9nZ2xlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGVEcmF3ZXIoKVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGEgY2xpY2sgZXZlbnQgb24gdGhlIGNsb2FrLCB0byBjbG9zZSB0aGUgZHJhd2VyXG4gICAgICAgIHRoaXMuY2xvYWsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgICAgICAgIC8vIENhbGwgdGhlIHRvZ2dsZSBmdW5jdGlvblxuICAgICAgICAgICAgdGhpcy50b2dnbGVEcmF3ZXIoKVxuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIG9yIHJlbW92ZSB0aGUgdG9nZ2xlIGNsYXNzIHRvIHNob3cgdGhlIGRyYXdlclxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIHRvZ2dsZURyYXdlciAoKSB7XG4gICAgICAgIC8vIFRvZ2dsZSB0aGUgY2xhc3NcbiAgICAgICAgdGhpcy5ib2R5LmNsYXNzTGlzdC50b2dnbGUodGhpcy5kcmF3ZXJDbGFzcyk7XG4gICAgICAgIC8vIENhbGwgdGhlIGFyaWEgY2hhbmdlIGZ1bmN0aW9uXG4gICAgICAgIHRoaXMudG9nZ2xlQXJpYUF0dHIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGVzIHRoZSBBUklBIGF0dHJpYnV0ZSBvZiB0aGUgZHJhd2VyLlxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIHRvZ2dsZUFyaWFBdHRyICgpIHtcbiAgICAgICAgaWYgKHRoaXMuYm9keS5jbGFzc0xpc3QuY29udGFpbnModGhpcy5kcmF3ZXJDbGFzcykpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcblxuLyoqXG4gKiBURU1QTEFURUVOR0lORSBDTEFTU1xuICogQ3VzdG9tIGxpZ2h0d2VpZ2h0IHRlbXBsYXRpbmcgZW5naW5lLlxuICogSGVhdmlseSB0YWtlbiBmcm9tOlxuICogSm9obiBSZXNpZyDigJMgaHR0cDovL2Vqb2huLm9yZy8g4oCTIE1JVCBMaWNlbnNlZFxuICovXG5VdGlscy5UZW1wbGF0ZUVuZ2luZSA9IGNsYXNzIHtcblxuICAgIC8qKlxuICAgICogU3RvcmVzIHRoZSB0ZW1wbGF0ZSBkYXRhLCBzbyB3ZSBkb24ndCBrZWVwIHF1ZXJ5aW5nIHRoZSBET01cbiAgICAqIFxuICAgICogQHJldHVybiBFbXB0eSBvYmplY3RcbiAgICAqL1xuICAgIHN0YXRpYyBnZXQgQ0FDSEUgKCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBUYWtlcyB0aGUgdGVtcGxhdGUsIG1vZGVsIGFuZCBkZXN0aW5hdGlvbiB0byBwYXNzIG9uIHRvIHRoZSB0ZW1wbGF0aW5nIGZ1bmN0aW9uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgdGVtcGxhdGUgLSBJRCBvZiBzY3JpcHQgdGVtcGxhdGVcbiAgICAqIEBwYXJhbSB7b2JqZWN0fSAgIG1vZGVsIC0gRGF0YSBtb2RlbCB0byBwYXNzIHRvIHRlbXBsYXRlIFxuICAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgZGVzdGluYXRpb24gLSBJRCBvZiB3aGVyZSB0aGUgZmluaXNoZWQgdGVtcGxhdGUgaXMgZ29pbmcgdG8gZ29cbiAgICAqIFxuICAgICpAcmV0dXJuIHZvaWRcbiAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVIVE1MICh0ZW1wbGF0ZSwgbW9kZWwsIGRlc3RpbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZXN0aW5hdGlvbik7XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IHRoaXMudGVtcGxhdGVUb0hUTUwodGVtcGxhdGUsIG1vZGVsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBldmVudCA9IG5ldyBFdmVudCgndGVtcGxhdGVMb2FkZWQnKTtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQ29tYmluZXMgZHluYW1pYyBkYXRhIHdpdGggb3VyIHRlbXBsYXRlcyBhbmQgcmV0dXJucyB0aGUgcmVzdWx0XG4gICAgKiBKb2huIFJlc2lnIOKAkyBodHRwOi8vZWpvaG4ub3JnLyDigJMgTUlUIExpY2Vuc2VkXG4gICAgKiBcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSAgIHN0ciAtIElEIG9mIHNjcmlwdCB0ZW1wbGF0ZVxuICAgICogQHBhcmFtIHtvYmplY3R9ICAgZGF0YSAtIERhdGEgbW9kZWwgdG8gcGFzcyB0byB0ZW1wbGF0ZVxuICAgICogXG4gICAgKiBAcmV0dXJuIFRoZSBmaW5pc2hlZCB0ZW1wbGF0ZVxuICAgICovXG4gICAgc3RhdGljIHRlbXBsYXRlVG9IVE1MIChzdHIsIGRhdGEpIHtcbiAgICAgICAgY29uc3QgZm4gPSAhL1xcVy8udGVzdChzdHIpID9cbiAgICAgICAgICAgIHRoaXMuQ0FDSEVbc3RyXSA9IHRoaXMuQ0FDSEVbc3RyXSB8fFxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZVRvSFRNTChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdHIpLmlubmVySFRNTCkgOlxuXG4gICAgICAgICAgICAgICAgbmV3IEZ1bmN0aW9uKFwib2JqXCIsIFwidmFyIHA9W10scHJpbnQ9ZnVuY3Rpb24oKXtwLnB1c2guYXBwbHkocCxhcmd1bWVudHMpO307XCIgK1xuXG4gICAgICAgICAgICAgICAgXCJ3aXRoKG9iail7cC5wdXNoKCdcIiArXG5cbiAgICAgICAgICAgICAgICBzdHJcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1tcXHJcXHRcXG5dL2csIFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCI8JVwiKS5qb2luKFwiXFx0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oKF58JT4pW15cXHRdKiknL2csIFwiJDFcXHJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcdD0oLio/KSU+L2csIFwiJywkMSwnXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIlxcdFwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcIicpO1wiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCIlPlwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcInAucHVzaCgnXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIlxcclwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcIlxcXFwnXCIpXG5cbiAgICAgICAgICAgICAgICAgICAgKyBcIicpO31yZXR1cm4gcC5qb2luKCcnKTtcIik7XG5cbiAgICAgICAgcmV0dXJuIGRhdGEgPyBmbiggZGF0YSApIDogZm47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBTaG93IGFuIGVycm9yIG1lc3NhZ2UgaWYgd2UgY2FuJ3QgZ2V0IGFueSBpbmZvIFxuICAgICogXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gICBzdHIgLSBJRCBvZiBkZXN0aW5hdGlvbiB0ZW1wbGF0ZVxuICAgICovXG4gICAgc3RhdGljIG5vRGF0YSAoc3RyKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgncGVuZGluZycpO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdHIpLmlubmVySFRNTCA9IGA8cCBjbGFzcz1cIm5vLWRhdGFcIj48aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+ZXJyb3Jfb3V0bGluZTwvaT4gVWggb2ghIFdlJ3JlIHVuYWJsZSB0byBkaXNwbGF5IHRoYXQgaW5mb21hdGlvbi4gUGxlYXNlIGNoZWNrIHlvdXIgY29ubmVjdGlvbiBhbmQgdHJ5IGFnYWluLjwvcD5gO1xuICAgIH1cblxufTtcblxuLyoqXG4gKiBCYWNrIFRvIFRvcCBmdW5jdGlvbmFsaXR5XG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5iYWNrVG9Ub3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFjay10by10b3AnKTtcbiAgICBpZiAoZWwpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfVxufVxuXG4vKipcbiAqIFN0YXJ0cyB0aGUgc3BsYXNoIHNjcmVlbiBieSByZW1vdmluZyB0aGUgcGVuZGluZyBjbGFzcyBmcm9tIHRoZSBib2R5XG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5zdGFydFNwbGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBmaXJzdFRpbWVyID0gNTAwO1xuICAgIGNvbnN0IHNlY29uZFRpbWVyID0gMzAwMDtcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnc3BsYXNoLTEnKTtcbiAgICB9LCBmaXJzdFRpbWVyKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnc3BsYXNoLTInKTtcbiAgICB9LCBzZWNvbmRUaW1lcik7XG59XG5cbi8qKlxuICogU2V0IHRoZSBzdHlsZXNoZWV0IHByb3BlcnR5IGZvciB2aWRlbyBoZWlnaHQgZm9yIG1vYmlsZSBkZXZpY2VzXG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5nZXRIZWlnaHRGb3JWaWRlbyA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCB2aWV3SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmlld0hlaWdodCcsIGAke3ZpZXdIZWlnaHR9cHhgKTtcbn07XG5cbi8qKlxuICogQWRkIGEgY2xpY2sgZXZlbnQgdG8gdGhlIGJ1dHRvbnMgb24gdGhlIGNvY2t0YWlsIGxpc3QgcGFnZXNcbiAqIFxuICogQHJldHVybiB2b2lkXG4gKi9cblV0aWxzLmFjdGl2YXRlRnVsbERldGFpbEJ1dHRvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgYWRkQ2xpY2tFdmVudHMgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ0bnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdidXR0b24uZnVsbC1kZXRhaWxzLWJ1dHRvbicpO1xuICAgICAgICBpZiAoIWJ0bnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgW10uc2xpY2UuY2FsbChidG5zKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGUudGFyZ2V0LmRhdGFzZXQubGluaztcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3QgcmVtb3ZlUGVuZGluZyA9ICgpID0+IHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdwZW5kaW5nJyk7XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndGVtcGxhdGVMb2FkZWQnLCBlID0+IHtcbiAgICAgICAgcmVtb3ZlUGVuZGluZygpO1xuICAgICAgICBhZGRDbGlja0V2ZW50cygpO1xuICAgIH0sIGZhbHNlKTtcbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgVXRpbHM7Il19
