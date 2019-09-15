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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3doYXR3Zy1mZXRjaC9kaXN0L2ZldGNoLnVtZC5qcyIsInNyYy9qcy9kcmlua3MtYXBpL2luZGV4LmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvbmV3cy9pbmRleC5qcyIsInNyYy9qcy91dGlscy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDbmhCQTs7OztBQUNBOzs7Ozs7QUFFQTs7Ozs7O0lBTU0sUzs7Ozs7Ozs7O0FBb0NGOzs7Ozs7OztnQ0FRZ0IsUSxFQUFVLEUsRUFBSTtBQUMxQixnQkFBSSxvREFBSjtBQUNBLGdCQUFJLFNBQVMsS0FBSyxTQUFMLEdBQWlCLE9BQWpCLEdBQTJCLE1BQXhDO0FBQ0EsZ0JBQUksVUFBSjtBQUNBLGdCQUFJLGFBQUo7QUFDQSxnQkFBSSxLQUFLLFNBQVQsRUFBb0I7QUFDaEI7QUFDSDtBQUNELG9CQUFPLFFBQVA7QUFDSSxxQkFBSyxRQUFMO0FBQ0k7QUFDSjtBQUNBLHFCQUFLLE9BQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBLHFCQUFLLFFBQUw7QUFDSTtBQUNBLG9DQUFjLEVBQWQ7QUFDSjtBQUNBO0FBaEJKO0FBa0JBLHdCQUFVLEdBQVYsR0FBZ0IsSUFBaEIsR0FBdUIsTUFBdkIsR0FBZ0MsS0FBaEM7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7MkNBUTJCLEksRUFBTSxFLEVBQUk7QUFBQTs7QUFDakMsZ0JBQU0sV0FBVyxTQUFYLFFBQVcsQ0FBQyxPQUFELEVBQWE7QUFDMUIsZ0NBQU0sY0FBTixDQUFxQixVQUFyQixNQUFtQyxNQUFLLGdCQUF4QyxFQUE0RCxFQUFFLE1BQU0sT0FBUixFQUE1RCxFQUErRSxlQUEvRTtBQUNILGFBRkQ7QUFHQSx1QkFBUyxLQUFLLE9BQUwsQ0FBYSxJQUFiLEVBQW1CLEVBQW5CLENBQVQsRUFDRCxJQURDLENBQ0k7QUFBQSx1QkFBWSxTQUFTLElBQVQsRUFBWjtBQUFBLGFBREosRUFFRCxJQUZDLENBRUksbUJBQVc7QUFDUCx5QkFBUyxPQUFUO0FBQ1QsYUFKQyxFQUtELEtBTEMsQ0FLSyxhQUFLO0FBQ0YsZ0NBQU0sY0FBTixDQUFxQixNQUFyQixDQUE0QixlQUE1QjtBQUNILGFBUEw7QUFRSDs7QUFFRDs7Ozs7Ozs7dUNBS3VCO0FBQUE7O0FBQ25CLGdCQUFNLFFBQVEsT0FBTyxRQUFQLENBQWdCLE1BQTlCO0FBQ0EsZ0JBQUksU0FBUyxNQUFNLE9BQU4sQ0FBYyxPQUFkLENBQWIsRUFBcUM7QUFDakMsb0JBQU0sYUFBYSxNQUFNLEtBQU4sQ0FBWSxPQUFaLEVBQXFCLENBQXJCLENBQW5CO0FBQ0Esb0JBQUksY0FBYyxXQUFXLE1BQTdCLEVBQXFDO0FBQ2pDLHdCQUFNLFdBQVcsV0FBVyxXQUFYLEVBQWpCO0FBQ0Esd0JBQU0sV0FBVyxTQUFYLFFBQVcsQ0FBQyxPQUFELEVBQWE7QUFDMUIsd0NBQU0sY0FBTixDQUFxQixVQUFyQixNQUFtQyxPQUFLLGFBQXhDLEVBQXlELEVBQUUsTUFBTSxPQUFSLEVBQXpELEVBQTRFLGVBQTVFO0FBQ0gscUJBRkQ7QUFHQSw0QkFBUSxRQUFSO0FBQ0ksNkJBQUssU0FBTDtBQUNJLGdDQUFNLE9BQU8sS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLGNBQU07QUFDcEMsdUNBQU8sV0FBUyxPQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQXNCLEVBQXRCLENBQVQsRUFBc0MsSUFBdEMsQ0FBMkM7QUFBQSwyQ0FBUyxNQUFNLElBQU4sRUFBVDtBQUFBLGlDQUEzQyxDQUFQO0FBQ0gsNkJBRlksQ0FBYjtBQUdBLG9DQUFRLEdBQVIsQ0FBWSxJQUFaLEVBQ0ssSUFETCxDQUNVLG1CQUFXO0FBQ2IseUNBQVMsT0FBVDtBQUNILDZCQUhMLEVBSUssS0FKTCxDQUlXLGFBQUs7QUFDUixnREFBTSxjQUFOLENBQXFCLE1BQXJCLENBQTRCLGVBQTVCO0FBQ0gsNkJBTkw7QUFPSjtBQUNBLDZCQUFLLFFBQUw7QUFDSSx1Q0FBUyxLQUFLLE9BQUwsQ0FBYSxRQUFiLEVBQXVCLGVBQXZCLENBQVQsRUFDSyxJQURMLENBQ1U7QUFBQSx1Q0FBUyxNQUFNLElBQU4sRUFBVDtBQUFBLDZCQURWLEVBRUssSUFGTCxDQUVVLG1CQUFXO0FBQ2IseUNBQVMsT0FBVDtBQUNILDZCQUpMLEVBS0ssS0FMTCxDQUtXLGFBQUs7QUFDUixnREFBTSxjQUFOLENBQXFCLE1BQXJCLENBQTRCLGVBQTVCO0FBQ0gsNkJBUEw7QUFRSjtBQUNBO0FBQ0ksdUNBQVMsS0FBSyxPQUFMLENBQWEsUUFBYixFQUF1QixRQUF2QixDQUFULEVBQ0ssSUFETCxDQUNVO0FBQUEsdUNBQVMsTUFBTSxJQUFOLEVBQVQ7QUFBQSw2QkFEVixFQUVLLElBRkwsQ0FFVSxtQkFBVztBQUNiLHlDQUFTLE9BQVQ7QUFDSCw2QkFKTCxFQUtLLEtBTEwsQ0FLVyxhQUFLO0FBQ1IsZ0RBQU0sY0FBTixDQUFxQixNQUFyQixDQUE0QixlQUE1QjtBQUNILDZCQVBMOztBQXhCUjtBQWtDQTtBQUNIO0FBQ0o7QUFDRCxtQkFBTyxRQUFQLENBQWdCLElBQWhCLEdBQXVCLEdBQXZCO0FBQ0E7QUFDSDs7QUFFRDs7Ozs7Ozs7c0NBS3NCO0FBQ2xCLGdCQUFNLFFBQVEsT0FBTyxRQUFQLENBQWdCLE1BQTlCO0FBQ0EsZ0JBQUksU0FBUyxNQUFNLE9BQU4sQ0FBYyxLQUFkLENBQWIsRUFBbUM7QUFDL0Isb0JBQU0sYUFBYSxNQUFNLEtBQU4sQ0FBWSxLQUFaLEVBQW1CLENBQW5CLENBQW5CO0FBQ0Esb0JBQUksY0FBYyxXQUFXLE1BQXpCLEtBQW9DLFNBQVMsVUFBVCxLQUF3QixlQUFlLFFBQTNFLENBQUosRUFBMEY7QUFDdEYsd0JBQU0sS0FBSyxVQUFYO0FBQ0Esd0JBQUksT0FBTyxRQUFYLEVBQXFCO0FBQ2pCLDZCQUFLLGtCQUFMLENBQXdCLFFBQXhCO0FBQ0E7QUFDSDtBQUNELHlCQUFLLGtCQUFMLENBQXdCLE9BQXhCLEVBQWlDLEVBQWpDO0FBQ0E7QUFDSDtBQUNKO0FBQ0QsbUJBQU8sUUFBUCxDQUFnQixJQUFoQixHQUF1QixHQUF2QjtBQUNBO0FBQ0g7Ozs7O0FBektEOzs7NEJBR3dCO0FBQ3BCLG1CQUFPLEtBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7NEJBSytCO0FBQzNCO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzRCQUs0QjtBQUN4QjtBQUNIOztBQUVEOzs7Ozs7Ozs0QkFLMEI7QUFDdEIsbUJBQU8sQ0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLEtBQWYsRUFBc0IsS0FBdEIsRUFBNkIsS0FBN0IsQ0FBUDtBQUNIOzs7Ozs7a0JBOElVLFM7Ozs7O0FDekxmOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUE7Ozs7OztBQU1BOzs7QUFHQSxTQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxpQkFBUzs7QUFFbkQ7OztBQUdBLE1BQU0sU0FBUyxJQUFJLGdCQUFNLE1BQVYsRUFBZjtBQUNBLFNBQU8sSUFBUDs7QUFFQTs7O0FBR0EsTUFBTSxlQUFlLElBQUksZ0JBQU0sWUFBVixFQUFyQjtBQUNBLGVBQWEsSUFBYjs7QUFFQTs7O0FBR0Esa0JBQU0sU0FBTjs7QUFFQTs7O0FBR0EsTUFBSSxTQUFTLGNBQVQsQ0FBd0IsZUFBeEIsQ0FBSixFQUE4QztBQUMxQyxvQkFBTSxXQUFOO0FBQ0g7O0FBRUQ7OztBQUdBLE1BQUksU0FBUyxjQUFULENBQXdCLGVBQXhCLENBQUosRUFBOEM7QUFDMUMsd0JBQVUsWUFBVjtBQUNBLG9CQUFNLHlCQUFOO0FBQ0g7O0FBRUQ7OztBQUdBLE1BQUksU0FBUyxjQUFULENBQXdCLG1CQUF4QixDQUFKLEVBQWtEO0FBQzlDLHdCQUFVLFdBQVY7QUFDQSxvQkFBTSx5QkFBTjtBQUNIOztBQUVEOzs7QUFHQSxNQUFJLFNBQVMsY0FBVCxDQUF3Qix3QkFBeEIsQ0FBSixFQUF1RDtBQUNuRCxtQkFBSyxVQUFMO0FBQ0Esb0JBQU0seUJBQU47QUFDSDs7QUFFRDs7O0FBR0EsTUFBSSxTQUFTLGNBQVQsQ0FBd0IsMkJBQXhCLENBQUosRUFBMEQ7QUFDdEQsbUJBQUssT0FBTDtBQUNIO0FBRUosQ0F6REQ7Ozs7Ozs7Ozs7O0FDZEE7Ozs7Ozs7O0FBRUE7Ozs7OztJQU1NLEk7Ozs7Ozs7OztBQW9CRjs7Ozs7cUNBS3FCO0FBQUE7O0FBQ2pCLGdCQUFNLFdBQVcsU0FBWCxRQUFXLENBQUMsT0FBRCxFQUFhO0FBQzFCLGdDQUFNLGNBQU4sQ0FBcUIsVUFBckIsTUFBbUMsTUFBSyxhQUF4QyxFQUF5RCxFQUFFLE1BQU0sT0FBUixFQUF6RCxFQUE0RSxlQUE1RTtBQUNILGFBRkQ7QUFHQSx1QkFBUyxLQUFLLFFBQWQsRUFDRCxJQURDLENBQ0k7QUFBQSx1QkFBWSxTQUFTLElBQVQsRUFBWjtBQUFBLGFBREosRUFFRCxJQUZDLENBRUksbUJBQVc7QUFDUCx5QkFBUyxPQUFUO0FBQ1QsYUFKQyxFQUtELEtBTEMsQ0FLSyxhQUFLO0FBQ1gsZ0NBQU0sY0FBTixDQUFxQixNQUFyQixDQUE0QixlQUE1QjtBQUNNLGFBUEw7QUFRSDs7QUFFRDs7Ozs7Ozs7a0NBS2tCO0FBQUE7O0FBQ2QsZ0JBQU0sUUFBUSxPQUFPLFFBQVAsQ0FBZ0IsTUFBOUI7QUFDQSxnQkFBSSxTQUFTLE1BQU0sT0FBTixDQUFjLEtBQWQsQ0FBYixFQUFtQztBQUMvQixvQkFBTSxhQUFhLE1BQU0sS0FBTixDQUFZLEtBQVosRUFBbUIsQ0FBbkIsQ0FBbkI7QUFDQSxvQkFBSSxjQUFjLFdBQVcsTUFBekIsSUFBbUMsU0FBUyxVQUFULEVBQXFCLEVBQXJCLENBQXZDLEVBQWlFO0FBQzdELHdCQUFNLEtBQUssU0FBUyxVQUFULEVBQXFCLEVBQXJCLENBQVg7QUFDQSx3QkFBTSxXQUFXLFNBQVgsUUFBVyxDQUFDLE9BQUQsRUFBYTtBQUMxQiw0QkFBTSxVQUFVLFFBQVEsTUFBUixDQUFlLG1CQUFXO0FBQ3RDLG1DQUFPLFFBQVEsRUFBUixLQUFlLEVBQXRCO0FBQ0gseUJBRmUsQ0FBaEI7QUFHQSw0QkFBSSxDQUFDLFFBQVEsTUFBYixFQUFxQjtBQUNqQixtQ0FBTyxRQUFQLENBQWdCLElBQWhCLEdBQXVCLEdBQXZCO0FBQ0E7QUFDSDtBQUNELHdDQUFNLGNBQU4sQ0FBcUIsVUFBckIsTUFBbUMsT0FBSyxhQUF4QyxFQUF5RCxFQUFFLE1BQU0sT0FBUixFQUF6RCxFQUE0RSxlQUE1RTtBQUNILHFCQVREO0FBVUEsK0JBQVMsS0FBSyxRQUFkLEVBQ0ssSUFETCxDQUNVO0FBQUEsK0JBQVksU0FBUyxJQUFULEVBQVo7QUFBQSxxQkFEVixFQUVLLElBRkwsQ0FFVSxtQkFBVztBQUNiLGlDQUFTLE9BQVQ7QUFDSCxxQkFKTCxFQUtLLEtBTEwsQ0FLVyxhQUFLO0FBQ1Isd0NBQU0sY0FBTixDQUFxQixNQUFyQixDQUE0QixlQUE1QjtBQUNILHFCQVBMO0FBUUE7QUFDSDtBQUNKO0FBQ0QsbUJBQU8sUUFBUCxDQUFnQixJQUFoQixHQUF1QixHQUF2QjtBQUNBO0FBQ0g7Ozs7O0FBdkVEOzs7Ozs0QkFLNEI7QUFDeEI7QUFDSDs7QUFFRDs7Ozs7Ozs7NEJBS3VCO0FBQ25CO0FBQ0g7Ozs7OztrQkEyRFUsSTs7Ozs7Ozs7Ozs7OztBQ3JGZjs7Ozs7O0lBTU0sSzs7OztBQUVOOzs7Ozs7QUFJQSxNQUFNLFlBQU47QUFFSSxzQkFBZTtBQUFBOztBQUNYLGFBQUssU0FBTCxHQUFpQixFQUFqQixDQURXLENBQ1U7QUFDckIsYUFBSyxXQUFMLEdBQW1CLGdCQUFuQixDQUZXLENBRTBCO0FBQ3hDOztBQUVEOzs7Ozs7O0FBUEo7QUFBQTtBQUFBLCtCQVlZO0FBQUE7O0FBQ0o7QUFDQSxnQkFBSSxTQUFTLGdCQUFULENBQTBCLGdCQUExQixFQUE0QyxNQUFoRCxFQUF3RDtBQUNwRDtBQUNIOztBQUVEO0FBQ0EsbUJBQU8sZ0JBQVAsQ0FBd0IsUUFBeEIsRUFBa0MsYUFBSztBQUNuQztBQUNBLHNCQUFLLFVBQUw7QUFDSCxhQUhELEVBR0csS0FISDs7QUFLQTtBQUNBLGlCQUFLLFVBQUw7QUFDSDs7QUFFRDs7Ozs7O0FBNUJKO0FBQUE7QUFBQSxxQ0FpQ2tCO0FBQ1YsZ0JBQU0sT0FBTyxTQUFTLElBQXRCO0FBQ0E7QUFDQSxnQkFBTSxLQUFLLEtBQUssV0FBTCxFQUFYO0FBQ0E7QUFDQSxnQkFBSSxLQUFLLEtBQUssU0FBZCxFQUF5QjtBQUNyQjtBQUNBLHFCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLEtBQUssV0FBeEI7QUFDSCxhQUhELE1BR087QUFDSDtBQUNBLHFCQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLEtBQUssV0FBM0I7QUFDSDtBQUNKOztBQUVEOzs7Ozs7QUEvQ0o7QUFBQTtBQUFBLHNDQW9EbUI7QUFDWCxtQkFBTyxPQUFPLFdBQVAsSUFBc0IsU0FBUyxlQUFULENBQXlCLFNBQXREO0FBQ0g7QUF0REw7O0FBQUE7QUFBQTs7QUF5REE7Ozs7QUFJQSxNQUFNLE1BQU47QUFFSSx1QkFBZTtBQUFBOztBQUNYLGFBQUssV0FBTCxHQUFtQixTQUFTLGdCQUFULENBQTBCLGdCQUExQixDQUFuQixDQURXLENBQ3FEO0FBQ2hFLGFBQUssYUFBTCxHQUFxQixTQUFTLGFBQVQsQ0FBdUIsU0FBdkIsQ0FBckIsQ0FGVyxDQUU2QztBQUN4RCxhQUFLLEtBQUwsR0FBYSxTQUFTLGNBQVQsQ0FBd0IsT0FBeEIsQ0FBYixDQUhXLENBR29DO0FBQy9DLGFBQUssV0FBTCxHQUFtQixzQkFBbkIsQ0FKVyxDQUlnQztBQUMzQyxhQUFLLElBQUwsR0FBWSxTQUFTLElBQXJCLENBTFcsQ0FLZ0I7QUFDOUI7O0FBRUQ7Ozs7Ozs7QUFWSjtBQUFBO0FBQUEsK0JBZVk7QUFBQTs7QUFDSjtBQUNBO0FBQ0EsZUFBRyxLQUFILENBQVMsSUFBVCxDQUFjLEtBQUssV0FBbkIsRUFBZ0MsT0FBaEMsQ0FBd0MsZUFBTztBQUMzQyxvQkFBSSxnQkFBSixDQUFxQixPQUFyQixFQUE4QixhQUFLO0FBQy9CO0FBQ0EsMkJBQUssWUFBTDtBQUNILGlCQUhELEVBR0csS0FISDtBQUlILGFBTEQ7O0FBT0E7QUFDQSxpQkFBSyxLQUFMLENBQVcsZ0JBQVgsQ0FBNEIsT0FBNUIsRUFBcUMsYUFBSztBQUN0QztBQUNBLHVCQUFLLFlBQUw7QUFDSCxhQUhELEVBR0csS0FISDtBQUlIOztBQUVEOzs7Ozs7QUFoQ0o7QUFBQTtBQUFBLHVDQXFDb0I7QUFDWjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLE1BQXBCLENBQTJCLEtBQUssV0FBaEM7QUFDQTtBQUNBLGlCQUFLLGNBQUw7QUFDSDs7QUFFRDs7Ozs7O0FBNUNKO0FBQUE7QUFBQSx5Q0FpRHNCO0FBQ2QsZ0JBQUksS0FBSyxJQUFMLENBQVUsU0FBVixDQUFvQixRQUFwQixDQUE2QixLQUFLLFdBQWxDLENBQUosRUFBb0Q7QUFDaEQscUJBQUssYUFBTCxDQUFtQixZQUFuQixDQUFnQyxhQUFoQyxFQUErQyxLQUEvQztBQUNILGFBRkQsTUFFTztBQUNILHFCQUFLLGFBQUwsQ0FBbUIsWUFBbkIsQ0FBZ0MsYUFBaEMsRUFBK0MsSUFBL0M7QUFDSDtBQUNKO0FBdkRMOztBQUFBO0FBQUE7O0FBMkRBOzs7Ozs7QUFNQSxNQUFNLGNBQU47QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTs7O0FBV0k7Ozs7Ozs7OztBQVhKLG1DQW9CdUIsUUFwQnZCLEVBb0JpQyxLQXBCakMsRUFvQndDLFdBcEJ4QyxFQW9CcUQ7QUFDN0MsZ0JBQU0sVUFBVSxTQUFTLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBaEI7QUFDQSxnQkFBSSxPQUFKLEVBQWE7QUFDVCx3QkFBUSxTQUFSLEdBQW9CLEtBQUssY0FBTCxDQUFvQixRQUFwQixFQUE4QixLQUE5QixDQUFwQjtBQUNIO0FBQ0QsZ0JBQU0sUUFBUSxJQUFJLEtBQUosQ0FBVSxnQkFBVixDQUFkO0FBQ0EsbUJBQU8sYUFBUCxDQUFxQixLQUFyQjtBQUNIOztBQUVEOzs7Ozs7Ozs7O0FBN0JKO0FBQUE7QUFBQSx1Q0FzQzJCLEdBdEMzQixFQXNDZ0MsSUF0Q2hDLEVBc0NzQztBQUM5QixnQkFBTSxLQUFLLENBQUMsS0FBSyxJQUFMLENBQVUsR0FBVixDQUFELEdBQ1AsS0FBSyxLQUFMLENBQVcsR0FBWCxJQUFrQixLQUFLLEtBQUwsQ0FBVyxHQUFYLEtBQ2xCLEtBQUssY0FBTCxDQUFvQixTQUFTLGNBQVQsQ0FBd0IsR0FBeEIsRUFBNkIsU0FBakQsQ0FGTyxHQUlILElBQUksUUFBSixDQUFhLEtBQWIsRUFBb0IsMkRBRXBCLG9CQUZvQixHQUlwQixJQUNLLE9BREwsQ0FDYSxXQURiLEVBQzBCLEdBRDFCLEVBRUssS0FGTCxDQUVXLElBRlgsRUFFaUIsSUFGakIsQ0FFc0IsSUFGdEIsRUFHSyxPQUhMLENBR2Esa0JBSGIsRUFHaUMsTUFIakMsRUFJSyxPQUpMLENBSWEsYUFKYixFQUk0QixRQUo1QixFQUtLLEtBTEwsQ0FLVyxJQUxYLEVBTUssSUFOTCxDQU1VLEtBTlYsRUFPSyxLQVBMLENBT1csSUFQWCxFQVFLLElBUkwsQ0FRVSxVQVJWLEVBU0ssS0FUTCxDQVNXLElBVFgsRUFVSyxJQVZMLENBVVUsS0FWVixDQUpvQixHQWdCZCx3QkFoQk4sQ0FKUjs7QUFzQkEsbUJBQU8sT0FBTyxHQUFJLElBQUosQ0FBUCxHQUFvQixFQUEzQjtBQUNIOztBQUVEOzs7Ozs7QUFoRUo7QUFBQTtBQUFBLCtCQXFFbUIsR0FyRW5CLEVBcUV3QjtBQUNoQixxQkFBUyxJQUFULENBQWMsU0FBZCxDQUF3QixNQUF4QixDQUErQixTQUEvQjtBQUNBLHFCQUFTLGNBQVQsQ0FBd0IsR0FBeEIsRUFBNkIsU0FBN0I7QUFDSDtBQXhFTDtBQUFBOzs7QUFFSTs7Ozs7QUFGSiw0QkFPd0I7QUFDaEIsbUJBQU8sRUFBUDtBQUNIO0FBVEw7O0FBQUE7QUFBQTs7QUE0RUE7Ozs7O0FBS0EsTUFBTSxTQUFOLEdBQWtCLFlBQVk7QUFDMUIsUUFBTSxLQUFLLFNBQVMsY0FBVCxDQUF3QixhQUF4QixDQUFYO0FBQ0EsUUFBSSxFQUFKLEVBQVE7QUFDSixXQUFHLGdCQUFILENBQW9CLE9BQXBCLEVBQTZCLFVBQUMsQ0FBRCxFQUFPO0FBQ2hDLG1CQUFPLFFBQVAsQ0FBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkI7QUFDQSxjQUFFLGNBQUY7QUFDSCxTQUhELEVBR0csS0FISDtBQUlIO0FBQ0osQ0FSRDs7QUFVQTs7Ozs7QUFLQSxNQUFNLFdBQU4sR0FBb0IsWUFBWTtBQUM1QixRQUFNLGFBQWEsR0FBbkI7QUFDQSxRQUFNLGNBQWMsSUFBcEI7QUFDQSxRQUFNLE9BQU8sU0FBUyxJQUF0QjtBQUNBLFdBQU8sVUFBUCxDQUFrQixZQUFNO0FBQ3BCLGFBQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsVUFBdEI7QUFDSCxLQUZELEVBRUcsVUFGSDtBQUdBLFdBQU8sVUFBUCxDQUFrQixZQUFNO0FBQ3BCLGFBQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsVUFBdEI7QUFDSCxLQUZELEVBRUcsV0FGSDtBQUdILENBVkQ7O0FBWUE7Ozs7O0FBS0EsTUFBTSxpQkFBTixHQUEwQixZQUFZO0FBQ2xDLFFBQU0sYUFBYSxPQUFPLFdBQVAsR0FBcUIsSUFBeEM7QUFDQSxhQUFTLGVBQVQsQ0FBeUIsS0FBekIsQ0FBK0IsV0FBL0IsQ0FBMkMsY0FBM0MsRUFBOEQsVUFBOUQ7QUFDSCxDQUhEOztBQUtBOzs7OztBQUtBLE1BQU0seUJBQU4sR0FBa0MsWUFBWTtBQUMxQyxRQUFNLGlCQUFpQixTQUFqQixjQUFpQixHQUFNO0FBQ3pCLFlBQU0sT0FBTyxTQUFTLGdCQUFULENBQTBCLDRCQUExQixDQUFiO0FBQ0EsWUFBSSxDQUFDLEtBQUssTUFBVixFQUFrQjtBQUNkO0FBQ0g7QUFDRCxXQUFHLEtBQUgsQ0FBUyxJQUFULENBQWMsSUFBZCxFQUFvQixPQUFwQixDQUE0QixlQUFPO0FBQy9CLGdCQUFJLGdCQUFKLENBQXFCLE9BQXJCLEVBQThCLGFBQUs7QUFDL0IsdUJBQU8sUUFBUCxDQUFnQixJQUFoQixHQUF1QixFQUFFLE1BQUYsQ0FBUyxPQUFULENBQWlCLElBQXhDO0FBQ0Esa0JBQUUsY0FBRjtBQUNILGFBSEQsRUFHRyxLQUhIO0FBSUgsU0FMRDtBQU1ILEtBWEQ7QUFZQSxRQUFNLGdCQUFnQixTQUFoQixhQUFnQixHQUFNO0FBQ3hCLGlCQUFTLElBQVQsQ0FBYyxTQUFkLENBQXdCLE1BQXhCLENBQStCLFNBQS9CO0FBQ0gsS0FGRDtBQUdBLFdBQU8sZ0JBQVAsQ0FBd0IsZ0JBQXhCLEVBQTBDLGFBQUs7QUFDM0M7QUFDQTtBQUNILEtBSEQsRUFHRyxLQUhIO0FBSUgsQ0FwQkQ7O2tCQXVCZSxLIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiIiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuICAoZmFjdG9yeSgoZ2xvYmFsLldIQVRXR0ZldGNoID0ge30pKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbiAgdmFyIHN1cHBvcnQgPSB7XG4gICAgc2VhcmNoUGFyYW1zOiAnVVJMU2VhcmNoUGFyYW1zJyBpbiBzZWxmLFxuICAgIGl0ZXJhYmxlOiAnU3ltYm9sJyBpbiBzZWxmICYmICdpdGVyYXRvcicgaW4gU3ltYm9sLFxuICAgIGJsb2I6XG4gICAgICAnRmlsZVJlYWRlcicgaW4gc2VsZiAmJlxuICAgICAgJ0Jsb2InIGluIHNlbGYgJiZcbiAgICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBuZXcgQmxvYigpO1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSkoKSxcbiAgICBmb3JtRGF0YTogJ0Zvcm1EYXRhJyBpbiBzZWxmLFxuICAgIGFycmF5QnVmZmVyOiAnQXJyYXlCdWZmZXInIGluIHNlbGZcbiAgfTtcblxuICBmdW5jdGlvbiBpc0RhdGFWaWV3KG9iaikge1xuICAgIHJldHVybiBvYmogJiYgRGF0YVZpZXcucHJvdG90eXBlLmlzUHJvdG90eXBlT2Yob2JqKVxuICB9XG5cbiAgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIpIHtcbiAgICB2YXIgdmlld0NsYXNzZXMgPSBbXG4gICAgICAnW29iamVjdCBJbnQ4QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQ4QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScsXG4gICAgICAnW29iamVjdCBJbnQxNkFycmF5XScsXG4gICAgICAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgSW50MzJBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDMyQXJyYXldJyxcbiAgICAgICdbb2JqZWN0IEZsb2F0MzJBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgRmxvYXQ2NEFycmF5XSdcbiAgICBdO1xuXG4gICAgdmFyIGlzQXJyYXlCdWZmZXJWaWV3ID1cbiAgICAgIEFycmF5QnVmZmVyLmlzVmlldyB8fFxuICAgICAgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogJiYgdmlld0NsYXNzZXMuaW5kZXhPZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSkgPiAtMVxuICAgICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU5hbWUobmFtZSkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgfVxuICAgIGlmICgvW15hLXowLTlcXC0jJCUmJyorLl5fYHx+XS9pLnRlc3QobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgY2hhcmFjdGVyIGluIGhlYWRlciBmaWVsZCBuYW1lJylcbiAgICB9XG4gICAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKVxuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgdmFsdWUgPSBTdHJpbmcodmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuXG4gIC8vIEJ1aWxkIGEgZGVzdHJ1Y3RpdmUgaXRlcmF0b3IgZm9yIHRoZSB2YWx1ZSBsaXN0XG4gIGZ1bmN0aW9uIGl0ZXJhdG9yRm9yKGl0ZW1zKSB7XG4gICAgdmFyIGl0ZXJhdG9yID0ge1xuICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGl0ZW1zLnNoaWZ0KCk7XG4gICAgICAgIHJldHVybiB7ZG9uZTogdmFsdWUgPT09IHVuZGVmaW5lZCwgdmFsdWU6IHZhbHVlfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgaXRlcmF0b3JbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZXJhdG9yXG4gIH1cblxuICBmdW5jdGlvbiBIZWFkZXJzKGhlYWRlcnMpIHtcbiAgICB0aGlzLm1hcCA9IHt9O1xuXG4gICAgaWYgKGhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGhlYWRlcnMpKSB7XG4gICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKGhlYWRlclswXSwgaGVhZGVyWzFdKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaGVhZGVycykge1xuICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoaGVhZGVycykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKTtcbiAgICB2YWx1ZSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKTtcbiAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm1hcFtuYW1lXTtcbiAgICB0aGlzLm1hcFtuYW1lXSA9IG9sZFZhbHVlID8gb2xkVmFsdWUgKyAnLCAnICsgdmFsdWUgOiB2YWx1ZTtcbiAgfTtcblxuICBIZWFkZXJzLnByb3RvdHlwZVsnZGVsZXRlJ10gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgZGVsZXRlIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldO1xuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKTtcbiAgICByZXR1cm4gdGhpcy5oYXMobmFtZSkgPyB0aGlzLm1hcFtuYW1lXSA6IG51bGxcbiAgfTtcblxuICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpXG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKTtcbiAgfTtcblxuICBIZWFkZXJzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICBmb3IgKHZhciBuYW1lIGluIHRoaXMubWFwKSB7XG4gICAgICBpZiAodGhpcy5tYXAuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB0aGlzLm1hcFtuYW1lXSwgbmFtZSwgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgIGl0ZW1zLnB1c2gobmFtZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaXRlbXMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgIGl0ZW1zLnB1c2goW25hbWUsIHZhbHVlXSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9O1xuXG4gIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXM7XG4gIH1cblxuICBmdW5jdGlvbiBjb25zdW1lZChib2R5KSB7XG4gICAgaWYgKGJvZHkuYm9keVVzZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKSlcbiAgICB9XG4gICAgYm9keS5ib2R5VXNlZCA9IHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpO1xuICAgICAgfTtcbiAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZWFkZXIuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKTtcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc1RleHQoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcik7XG4gICAgcmVhZGVyLnJlYWRBc1RleHQoYmxvYik7XG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRBcnJheUJ1ZmZlckFzVGV4dChidWYpIHtcbiAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1Zik7XG4gICAgdmFyIGNoYXJzID0gbmV3IEFycmF5KHZpZXcubGVuZ3RoKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgY2hhcnNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHZpZXdbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gY2hhcnMuam9pbignJylcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1ZmZlckNsb25lKGJ1Zikge1xuICAgIGlmIChidWYuc2xpY2UpIHtcbiAgICAgIHJldHVybiBidWYuc2xpY2UoMClcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYuYnl0ZUxlbmd0aCk7XG4gICAgICB2aWV3LnNldChuZXcgVWludDhBcnJheShidWYpKTtcbiAgICAgIHJldHVybiB2aWV3LmJ1ZmZlclxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIEJvZHkoKSB7XG4gICAgdGhpcy5ib2R5VXNlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5faW5pdEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gICAgICB0aGlzLl9ib2R5SW5pdCA9IGJvZHk7XG4gICAgICBpZiAoIWJvZHkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSAnJztcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keTtcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUJsb2IgPSBib2R5O1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmZvcm1EYXRhICYmIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlGb3JtRGF0YSA9IGJvZHk7XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmIFVSTFNlYXJjaFBhcmFtcy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkudG9TdHJpbmcoKTtcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiBzdXBwb3J0LmJsb2IgJiYgaXNEYXRhVmlldyhib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5LmJ1ZmZlcik7XG4gICAgICAgIC8vIElFIDEwLTExIGNhbid0IGhhbmRsZSBhIERhdGFWaWV3IGJvZHkuXG4gICAgICAgIHRoaXMuX2JvZHlJbml0ID0gbmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pO1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIChBcnJheUJ1ZmZlci5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSB8fCBpc0FycmF5QnVmZmVyVmlldyhib2R5KSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYm9keSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJykpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICd0ZXh0L3BsYWluO2NoYXJzZXQ9VVRGLTgnKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QmxvYiAmJiB0aGlzLl9ib2R5QmxvYi50eXBlKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgdGhpcy5fYm9keUJsb2IudHlwZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHN1cHBvcnQuYmxvYikge1xuICAgICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSkpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIGJsb2InKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICAgIHJldHVybiBjb25zdW1lZCh0aGlzKSB8fCBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUFycmF5QnVmZmVyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcilcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWFkQXJyYXlCdWZmZXJBc1RleHQodGhpcy5fYm9keUFycmF5QnVmZmVyKSlcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyB0ZXh0JylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgICB0aGlzLmZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKGRlY29kZSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihKU09OLnBhcnNlKVxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gIHZhciBtZXRob2RzID0gWydERUxFVEUnLCAnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUycsICdQT1NUJywgJ1BVVCddO1xuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgICB2YXIgdXBjYXNlZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiBtZXRob2RzLmluZGV4T2YodXBjYXNlZCkgPiAtMSA/IHVwY2FzZWQgOiBtZXRob2RcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXVlc3QoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keTtcblxuICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QpIHtcbiAgICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKVxuICAgICAgfVxuICAgICAgdGhpcy51cmwgPSBpbnB1dC51cmw7XG4gICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHM7XG4gICAgICBpZiAoIW9wdGlvbnMuaGVhZGVycykge1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWV0aG9kID0gaW5wdXQubWV0aG9kO1xuICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZTtcbiAgICAgIHRoaXMuc2lnbmFsID0gaW5wdXQuc2lnbmFsO1xuICAgICAgaWYgKCFib2R5ICYmIGlucHV0Ll9ib2R5SW5pdCAhPSBudWxsKSB7XG4gICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXQ7XG4gICAgICAgIGlucHV0LmJvZHlVc2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cmwgPSBTdHJpbmcoaW5wdXQpO1xuICAgIH1cblxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgJ3NhbWUtb3JpZ2luJztcbiAgICBpZiAob3B0aW9ucy5oZWFkZXJzIHx8ICF0aGlzLmhlYWRlcnMpIHtcbiAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycyk7XG4gICAgfVxuICAgIHRoaXMubWV0aG9kID0gbm9ybWFsaXplTWV0aG9kKG9wdGlvbnMubWV0aG9kIHx8IHRoaXMubWV0aG9kIHx8ICdHRVQnKTtcbiAgICB0aGlzLm1vZGUgPSBvcHRpb25zLm1vZGUgfHwgdGhpcy5tb2RlIHx8IG51bGw7XG4gICAgdGhpcy5zaWduYWwgPSBvcHRpb25zLnNpZ25hbCB8fCB0aGlzLnNpZ25hbDtcbiAgICB0aGlzLnJlZmVycmVyID0gbnVsbDtcblxuICAgIGlmICgodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpICYmIGJvZHkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0JvZHkgbm90IGFsbG93ZWQgZm9yIEdFVCBvciBIRUFEIHJlcXVlc3RzJylcbiAgICB9XG4gICAgdGhpcy5faW5pdEJvZHkoYm9keSk7XG4gIH1cblxuICBSZXF1ZXN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzLCB7Ym9keTogdGhpcy5fYm9keUluaXR9KVxuICB9O1xuXG4gIGZ1bmN0aW9uIGRlY29kZShib2R5KSB7XG4gICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKTtcbiAgICBib2R5XG4gICAgICAudHJpbSgpXG4gICAgICAuc3BsaXQoJyYnKVxuICAgICAgLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgICAgdmFyIHNwbGl0ID0gYnl0ZXMuc3BsaXQoJz0nKTtcbiAgICAgICAgICB2YXIgbmFtZSA9IHNwbGl0LnNoaWZ0KCkucmVwbGFjZSgvXFwrL2csICcgJyk7XG4gICAgICAgICAgdmFyIHZhbHVlID0gc3BsaXQuam9pbignPScpLnJlcGxhY2UoL1xcKy9nLCAnICcpO1xuICAgICAgICAgIGZvcm0uYXBwZW5kKGRlY29kZVVSSUNvbXBvbmVudChuYW1lKSwgZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHJldHVybiBmb3JtXG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUhlYWRlcnMocmF3SGVhZGVycykge1xuICAgIHZhciBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgICAvLyBSZXBsYWNlIGluc3RhbmNlcyBvZiBcXHJcXG4gYW5kIFxcbiBmb2xsb3dlZCBieSBhdCBsZWFzdCBvbmUgc3BhY2Ugb3IgaG9yaXpvbnRhbCB0YWIgd2l0aCBhIHNwYWNlXG4gICAgLy8gaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzcyMzAjc2VjdGlvbi0zLjJcbiAgICB2YXIgcHJlUHJvY2Vzc2VkSGVhZGVycyA9IHJhd0hlYWRlcnMucmVwbGFjZSgvXFxyP1xcbltcXHQgXSsvZywgJyAnKTtcbiAgICBwcmVQcm9jZXNzZWRIZWFkZXJzLnNwbGl0KC9cXHI/XFxuLykuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG4gICAgICB2YXIgcGFydHMgPSBsaW5lLnNwbGl0KCc6Jyk7XG4gICAgICB2YXIga2V5ID0gcGFydHMuc2hpZnQoKS50cmltKCk7XG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHBhcnRzLmpvaW4oJzonKS50cmltKCk7XG4gICAgICAgIGhlYWRlcnMuYXBwZW5kKGtleSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBoZWFkZXJzXG4gIH1cblxuICBCb2R5LmNhbGwoUmVxdWVzdC5wcm90b3R5cGUpO1xuXG4gIGZ1bmN0aW9uIFJlc3BvbnNlKGJvZHlJbml0LCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RlZmF1bHQnO1xuICAgIHRoaXMuc3RhdHVzID0gb3B0aW9ucy5zdGF0dXMgPT09IHVuZGVmaW5lZCA/IDIwMCA6IG9wdGlvbnMuc3RhdHVzO1xuICAgIHRoaXMub2sgPSB0aGlzLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5zdGF0dXMgPCAzMDA7XG4gICAgdGhpcy5zdGF0dXNUZXh0ID0gJ3N0YXR1c1RleHQnIGluIG9wdGlvbnMgPyBvcHRpb25zLnN0YXR1c1RleHQgOiAnT0snO1xuICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycyk7XG4gICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCAnJztcbiAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdCk7XG4gIH1cblxuICBCb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKTtcblxuICBSZXNwb25zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHRoaXMuX2JvZHlJbml0LCB7XG4gICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgc3RhdHVzVGV4dDogdGhpcy5zdGF0dXNUZXh0LFxuICAgICAgaGVhZGVyczogbmV3IEhlYWRlcnModGhpcy5oZWFkZXJzKSxcbiAgICAgIHVybDogdGhpcy51cmxcbiAgICB9KVxuICB9O1xuXG4gIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IDAsIHN0YXR1c1RleHQ6ICcnfSk7XG4gICAgcmVzcG9uc2UudHlwZSA9ICdlcnJvcic7XG4gICAgcmV0dXJuIHJlc3BvbnNlXG4gIH07XG5cbiAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdO1xuXG4gIFJlc3BvbnNlLnJlZGlyZWN0ID0gZnVuY3Rpb24odXJsLCBzdGF0dXMpIHtcbiAgICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCBzdGF0dXMgY29kZScpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiBzdGF0dXMsIGhlYWRlcnM6IHtsb2NhdGlvbjogdXJsfX0pXG4gIH07XG5cbiAgZXhwb3J0cy5ET01FeGNlcHRpb24gPSBzZWxmLkRPTUV4Y2VwdGlvbjtcbiAgdHJ5IHtcbiAgICBuZXcgZXhwb3J0cy5ET01FeGNlcHRpb24oKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgZXhwb3J0cy5ET01FeGNlcHRpb24gPSBmdW5jdGlvbihtZXNzYWdlLCBuYW1lKSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgIHZhciBlcnJvciA9IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgdGhpcy5zdGFjayA9IGVycm9yLnN0YWNrO1xuICAgIH07XG4gICAgZXhwb3J0cy5ET01FeGNlcHRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuICAgIGV4cG9ydHMuRE9NRXhjZXB0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGV4cG9ydHMuRE9NRXhjZXB0aW9uO1xuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2goaW5wdXQsIGluaXQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KTtcblxuICAgICAgaWYgKHJlcXVlc3Quc2lnbmFsICYmIHJlcXVlc3Quc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgZXhwb3J0cy5ET01FeGNlcHRpb24oJ0Fib3J0ZWQnLCAnQWJvcnRFcnJvcicpKVxuICAgICAgfVxuXG4gICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgIGZ1bmN0aW9uIGFib3J0WGhyKCkge1xuICAgICAgICB4aHIuYWJvcnQoKTtcbiAgICAgIH1cblxuICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICBzdGF0dXM6IHhoci5zdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgaGVhZGVyczogcGFyc2VIZWFkZXJzKHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSB8fCAnJylcbiAgICAgICAgfTtcbiAgICAgICAgb3B0aW9ucy51cmwgPSAncmVzcG9uc2VVUkwnIGluIHhociA/IHhoci5yZXNwb25zZVVSTCA6IG9wdGlvbnMuaGVhZGVycy5nZXQoJ1gtUmVxdWVzdC1VUkwnKTtcbiAgICAgICAgdmFyIGJvZHkgPSAncmVzcG9uc2UnIGluIHhociA/IHhoci5yZXNwb25zZSA6IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgIHJlc29sdmUobmV3IFJlc3BvbnNlKGJvZHksIG9wdGlvbnMpKTtcbiAgICAgIH07XG5cbiAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKTtcbiAgICAgIH07XG5cbiAgICAgIHhoci5vbmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgZXhwb3J0cy5ET01FeGNlcHRpb24oJ0Fib3J0ZWQnLCAnQWJvcnRFcnJvcicpKTtcbiAgICAgIH07XG5cbiAgICAgIHhoci5vcGVuKHJlcXVlc3QubWV0aG9kLCByZXF1ZXN0LnVybCwgdHJ1ZSk7XG5cbiAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSAnaW5jbHVkZScpIHtcbiAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09ICdvbWl0Jykge1xuICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICgncmVzcG9uc2VUeXBlJyBpbiB4aHIgJiYgc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYmxvYic7XG4gICAgICB9XG5cbiAgICAgIHJlcXVlc3QuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIHZhbHVlKTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocmVxdWVzdC5zaWduYWwpIHtcbiAgICAgICAgcmVxdWVzdC5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydFhocik7XG5cbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIC8vIERPTkUgKHN1Y2Nlc3Mgb3IgZmFpbHVyZSlcbiAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgIHJlcXVlc3Quc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgYWJvcnRYaHIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgeGhyLnNlbmQodHlwZW9mIHJlcXVlc3QuX2JvZHlJbml0ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiByZXF1ZXN0Ll9ib2R5SW5pdCk7XG4gICAgfSlcbiAgfVxuXG4gIGZldGNoLnBvbHlmaWxsID0gdHJ1ZTtcblxuICBpZiAoIXNlbGYuZmV0Y2gpIHtcbiAgICBzZWxmLmZldGNoID0gZmV0Y2g7XG4gICAgc2VsZi5IZWFkZXJzID0gSGVhZGVycztcbiAgICBzZWxmLlJlcXVlc3QgPSBSZXF1ZXN0O1xuICAgIHNlbGYuUmVzcG9uc2UgPSBSZXNwb25zZTtcbiAgfVxuXG4gIGV4cG9ydHMuSGVhZGVycyA9IEhlYWRlcnM7XG4gIGV4cG9ydHMuUmVxdWVzdCA9IFJlcXVlc3Q7XG4gIGV4cG9ydHMuUmVzcG9uc2UgPSBSZXNwb25zZTtcbiAgZXhwb3J0cy5mZXRjaCA9IGZldGNoO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKSk7XG4iLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgdXJsIH0gZnJvbSAnaW5zcGVjdG9yJztcblxuLyoqXG4gKiBEUklOS1NBUEkgQ0xBU1NcbiAqIERlYWxzIHdpdGggdGFsa2luZyB0byBUaGUgQ29ja3RhaWwgREJcbiAqIFxuICogL2pzL2RyaW5rcy1hcGkvaW5kZXguanNcbiAqL1xuY2xhc3MgRHJpbmtzQVBJIHtcblxuICAgIC8qKlxuICAgICAqIFNldCB0ZXN0IG1vZGUgKGdldCBsb2NhbCBkYXRhIGlmIHdlJ3JlIHRlc3RpbmcsIHJlbW90ZSBkYXRhIGlmIG5vdClcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IFRFU1RfTU9ERSAoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWZlcmVuY2UgdG8gdGhlIHRlbXBsYXRlIHVzZWQgZm9yIHJlY2lwZXNcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IElEIG9mIHRoZSB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXQgREVUQUlMU19URU1QTEFURSAoKSB7XG4gICAgICAgIHJldHVybiBgY29ja3RhaWxfZGV0YWlsc2A7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVmZXJlbmNlIHRvIHRoZSB0ZW1wbGF0ZSB1c2VkIGZvciB0aGUgbGlzdHNcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IElEIG9mIHRoZSB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXQgTElTVF9URU1QTEFURSAoKSB7XG4gICAgICAgIHJldHVybiBgY29ja3RhaWxzX2xpc3RgO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElEcyBmb3IgdGhlIFBvcHVsYXIgc2VjdGlvbiwgZWFjaCBvbmUgaXMgYSBjb2NrdGFpbFxuICAgICAqIFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gSUQgb2YgdGhlIHRlbXBsYXRlXG4gICAgICovXG4gICAgc3RhdGljIGdldCBQT1BVTEFSX0lEUyAoKSB7XG4gICAgICAgIHJldHVybiBbMTEwMDAsIDExMDAxLCAxMTAwMiwgMTEwMDcsIDE3MjA3XTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXb3JrcyBvdXQgd2hpY2ggQVBJIFVSTCB3ZSBzaG91bGQgYmUgdXNpbmdcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2F0ZWdvcnkgLSBXaGF0IHNlY3Rpb24gd2UncmUgb25cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaWQgLSBJZiB3ZSdyZSBhc2tpbmcgZm9yIGEgcGFydGljdWxhciByZWNpcGUsIHRoaXMgaXMgdGhlIElEXG4gICAgICogXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgdXJsXG4gICAgICovXG4gICAgc3RhdGljIEFQSV9VUkwgKGNhdGVnb3J5LCBpZCkge1xuICAgICAgICBsZXQgYXBpID0gYGh0dHBzOi8vd3d3LnRoZWNvY2t0YWlsZGIuY29tL2FwaS9qc29uL3YxLzEvYDtcbiAgICAgICAgbGV0IHN1ZmZpeCA9IHRoaXMuVEVTVF9NT0RFID8gJy5qc29uJyA6ICcucGhwJzsgXG4gICAgICAgIGxldCBxdWVyeSA9IGBgO1xuICAgICAgICBsZXQgZGVzdDtcbiAgICAgICAgaWYgKHRoaXMuVEVTVF9NT0RFKSB7XG4gICAgICAgICAgICBhcGkgPSBgL2xvY2FsX2RhdGFgO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaChjYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSAncmFuZG9tJzpcbiAgICAgICAgICAgICAgICBkZXN0ID0gYHJhbmRvbWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2J5LWlkJzpcbiAgICAgICAgICAgICAgICBkZXN0ID0gYGxvb2t1cGA7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSBgP2k9JHtpZH1gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdmaWx0ZXInOlxuICAgICAgICAgICAgICAgIGRlc3QgPSBgZmlsdGVyYDtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IGA/aT0ke2lkfWA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3Zpcmdpbic6XG4gICAgICAgICAgICAgICAgZGVzdCA9IGBmaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHF1ZXJ5ID0gYD9hPSR7aWR9YDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7YXBpfSR7ZGVzdH0ke3N1ZmZpeH0ke3F1ZXJ5fWA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgY29ja3RhaWwgcmVjaXBlIGZyb20gYW4gSUQuXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBXaGF0IHNlY3Rpb24gd2UncmUgb25cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaWQgLSBJZiB3ZSdyZSBhc2tpbmcgZm9yIGEgcGFydGljdWxhciByZWNpcGUsIHRoaXMgaXMgdGhlIElEXG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgc3RhdGljIGdldENvY2t0YWlsRGV0YWlscyAodHlwZSwgaWQpIHtcbiAgICAgICAgY29uc3Qgc3VjY2Nlc3MgPSAocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUuY3JlYXRlSFRNTChgJHt0aGlzLkRFVEFJTFNfVEVNUExBVEV9YCwgeyBkYXRhOiByZXN1bHRzIH0sICdjb2NrdGFpbC1kYXRhJyk7XG4gICAgICAgIH07XG4gICAgICAgIGZldGNoKGAke3RoaXMuQVBJX1VSTCh0eXBlLCBpZCl9YClcblx0XHQgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuXHRcdCAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICBzdWNjY2VzcyhyZXN1bHRzKTtcdFxuXHRcdCAgICB9KVxuXHRcdCAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUubm9EYXRhKCdjb2NrdGFpbC1kYXRhJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBsaXN0IG9mIGNvY2t0YWlsc1xuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRDb2NrdGFpbHMgKCkge1xuICAgICAgICBjb25zdCBxdWVyeSA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgICAgIGlmIChxdWVyeSAmJiBxdWVyeS5pbmRleE9mKCdsaXN0PScpKSB7XG4gICAgICAgICAgICBjb25zdCBzcGxpdFF1ZXJ5ID0gcXVlcnkuc3BsaXQoJ2xpc3Q9JylbMV07XG4gICAgICAgICAgICBpZiAoc3BsaXRRdWVyeSAmJiBzcGxpdFF1ZXJ5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3RUeXBlID0gc3BsaXRRdWVyeS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NjZXNzID0gKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuVGVtcGxhdGVFbmdpbmUuY3JlYXRlSFRNTChgJHt0aGlzLkxJU1RfVEVNUExBVEV9YCwgeyBkYXRhOiByZXN1bHRzIH0sICdjb2NrdGFpbC1kYXRhJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGxpc3RUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3BvcHVsYXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdXJscyA9IHRoaXMuUE9QVUxBUl9JRFMubWFwKGlkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmV0Y2goYCR7dGhpcy5BUElfVVJMKCdieS1pZCcsIGlkKX1gKS50aGVuKHZhbHVlID0+IHZhbHVlLmpzb24oKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuYWxsKHVybHMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBVdGlscy5UZW1wbGF0ZUVuZ2luZS5ub0RhdGEoJ2NvY2t0YWlsLWRhdGEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Zpcmdpbic6XG4gICAgICAgICAgICAgICAgICAgICAgICBmZXRjaChgJHt0aGlzLkFQSV9VUkwoJ3ZpcmdpbicsICdub25fYWxjb2hvbGljJyl9YClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbih2YWx1ZSA9PiB2YWx1ZS5qc29uKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBVdGlscy5UZW1wbGF0ZUVuZ2luZS5ub0RhdGEoJ2NvY2t0YWlsLWRhdGEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBmZXRjaChgJHt0aGlzLkFQSV9VUkwoJ2ZpbHRlcicsIGxpc3RUeXBlKX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHZhbHVlID0+IHZhbHVlLmpzb24oKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Nlc3MocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLlRlbXBsYXRlRW5naW5lLm5vRGF0YSgnY29ja3RhaWwtZGF0YScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvJztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgd2hhdCB0eXBlIG9mIHJlY2lwZSB0byBzaG93LiBSYW5kb20sIG9yIGJ5IElELiBHZXRzIHRoZSBJRCBmcm9tIHRoZSB1cmwuXG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgc3RhdGljIGdldENvY2t0YWlsICgpIHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgICAgICBpZiAocXVlcnkgJiYgcXVlcnkuaW5kZXhPZignaWQ9JykpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0UXVlcnkgPSBxdWVyeS5zcGxpdCgnaWQ9JylbMV07XG4gICAgICAgICAgICBpZiAoc3BsaXRRdWVyeSAmJiBzcGxpdFF1ZXJ5Lmxlbmd0aCAmJiAocGFyc2VJbnQoc3BsaXRRdWVyeSkgfHwgc3BsaXRRdWVyeSA9PT0gJ3JhbmRvbScpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBzcGxpdFF1ZXJ5O1xuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gJ3JhbmRvbScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRDb2NrdGFpbERldGFpbHMoJ3JhbmRvbScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29ja3RhaWxEZXRhaWxzKCdieS1pZCcsIGlkKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnLyc7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cblxufVxuXG5leHBvcnQgZGVmYXVsdCBEcmlua3NBUEk7IiwiaW1wb3J0ICd3aGF0d2ctZmV0Y2gnXG5pbXBvcnQgRHJpbmtzQVBJIGZyb20gJy4vZHJpbmtzLWFwaSc7XG5pbXBvcnQgTmV3cyBmcm9tICcuL25ld3MnO1xuaW1wb3J0IFV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEtpY2tzIGV2ZXJ5dGhpbmcgb2ZmXG4gKiBcbiAqIC9qcy9tYWluLmpzXG4gKi9cblxuLyoqXG4gKiBJbml0aWFsaXNlIG91ciBtYWluIGFwcCBjb2RlIHdoZW4gdGhlIERPTSBpcyByZWFkeVxuICovXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZXZlbnQgPT4ge1xuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgZHJhd2VyIGZ1bmN0aW9uYWxpdHkgZm9yIHNtYWxsZXIgc2NyZWVuIHNpemVzXG4gICAgICovXG4gICAgY29uc3QgRHJhd2VyID0gbmV3IFV0aWxzLkRyYXdlcigpO1xuICAgIERyYXdlci5pbml0KCk7XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBzaHJpbmtpbmcgaGVhZGVyXG4gICAgICovXG4gICAgY29uc3QgU2hyaW5rSGVhZGVyID0gbmV3IFV0aWxzLlNocmlua0hlYWRlcigpO1xuICAgIFNocmlua0hlYWRlci5pbml0KCk7XG5cbiAgICAvKipcbiAgICAgKiBBZGQgdGhlIGJhY2sgdG8gdG9wIGZ1bmN0aW9uYWxpdHlcbiAgICAgKi9cbiAgICBVdGlscy5iYWNrVG9Ub3AoKTtcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IHRoZSBzcGxhc2ggc2NyZWVuXG4gICAgICovXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzcGxhc2gtc2NyZWVuJykpIHtcbiAgICAgICAgVXRpbHMuc3RhcnRTcGxhc2goKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB3ZSdyZSBvbiBhIGxpc3QgcGFnZSwgcGFzcyBpdCB0byB0aGUgQVBJIGFuZCBsZXQgaXQgZGV0ZXJtaW5lIHdoYXQgdG8gc2hvd1xuICAgICAqL1xuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2F0ZWdvcnktbGlzdCcpKSB7XG4gICAgICAgIERyaW5rc0FQSS5nZXRDb2NrdGFpbHMoKTtcbiAgICAgICAgVXRpbHMuYWN0aXZhdGVGdWxsRGV0YWlsQnV0dG9ucygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHdlJ3JlIG9uIGEgZGV0YWlsIHBhZ2UsIHBhc3MgaXQgdG8gdGhlIEFQSSBhbmQgbGV0IGl0IGRldGVybWluZSB3aGF0IHRvIHNob3dcbiAgICAgKi9cbiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhdGVnb3J5LWNvY2t0YWlsJykpIHtcbiAgICAgICAgRHJpbmtzQVBJLmdldENvY2t0YWlsKCk7XG4gICAgICAgIFV0aWxzLmFjdGl2YXRlRnVsbERldGFpbEJ1dHRvbnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB3ZSdyZSBvbiB0aGUgTmV3cyBpbmRleCBwYWdlLCBnZXQgdGhlIGFsbCBuZXdzXG4gICAgICovXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXRlZ29yeS1jb2NrdGFpbC1uZXdzJykpIHtcbiAgICAgICAgTmV3cy5nZXRBbGxOZXdzKCk7XG4gICAgICAgIFV0aWxzLmFjdGl2YXRlRnVsbERldGFpbEJ1dHRvbnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB3ZSdyZSBvbiBhbiBhcnRpY2xlIHBhZ2UgcGFnZSwgcGFzcyBpdCB0byB0aGUgTmV3cyBhbmQgbGV0IGl0IGRldGVybWluZSB3aGljaCBvbmUgdG8gc2hvd1xuICAgICAqL1xuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2F0ZWdvcnktY29ja3RhaWwtYXJ0aWNsZScpKSB7XG4gICAgICAgIE5ld3MuZ2V0TmV3cygpO1xuICAgIH1cblxufSk7IiwiaW1wb3J0IFV0aWxzIGZyb20gJy4uL3V0aWxzJztcblxuLyoqXG4gKiBORVdTIENMQVNTXG4gKiBEZWFscyB3aXRoIHRoZSBOZXdzIGFuZCBOZXdzIEFydGljbGVzIHBhZ2VzXG4gKiBcbiAqIC9qcy9uZXdzL2luZGV4LmpzXG4gKi9cbmNsYXNzIE5ld3Mge1xuXG4gICAgLyoqXG4gICAgICogUmVmZXJlbmNlIHRvIHRoZSB0ZW1wbGF0ZSB1c2VkIGZvciByZWNpcGVzXG4gICAgICogXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBJRCBvZiB0aGUgdGVtcGxhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IE5FV1NfVEVNUExBVEUgKCkge1xuICAgICAgICByZXR1cm4gYGNvY2t0YWlsX25ld3NgO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVybCBvZiB0aGUgbG9jYWwgZGF0YVxuICAgICAqIFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gVXJsIG9mIHRoZSBsb2NhbCBqc29uIGZpbGVcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IE5FV1NfVVJMICgpIHtcbiAgICAgICAgcmV0dXJuIGAvZGF0YS9uZXdzLmpzb25gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGxvY2FsIGpzb24gYW5kIHNlbmRzIGFsbCBvZiB0aGUgZGF0YSB0byB0aGUgdGVtcGxhdGVcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0QWxsTmV3cyAoKSB7XG4gICAgICAgIGNvbnN0IHN1Y2NjZXNzID0gKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgIFV0aWxzLlRlbXBsYXRlRW5naW5lLmNyZWF0ZUhUTUwoYCR7dGhpcy5ORVdTX1RFTVBMQVRFfWAsIHsgZGF0YTogcmVzdWx0cyB9LCAnY29ja3RhaWwtbmV3cycpO1xuICAgICAgICB9O1xuICAgICAgICBmZXRjaChgJHt0aGlzLk5FV1NfVVJMfWApXG5cdFx0ICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcblx0XHQgICAgLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICAgICAgc3VjY2Nlc3MocmVzdWx0cyk7XHRcblx0XHQgICAgfSlcblx0XHQgICAgLmNhdGNoKGUgPT4ge1xuXHRcdFx0ICAgIFV0aWxzLlRlbXBsYXRlRW5naW5lLm5vRGF0YSgnY29ja3RhaWwtbmV3cycpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbG9jYWwganNvbiBhbmQgc2VuZHMgdGhlIGFydGljbGUgdGhhdCBtYXRjaGVzIHRoZSBJRCBpbiB0aGUgYWRkcmVzcyBiYXJcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0TmV3cyAoKSB7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaDtcbiAgICAgICAgaWYgKHF1ZXJ5ICYmIHF1ZXJ5LmluZGV4T2YoJ2lkPScpKSB7XG4gICAgICAgICAgICBjb25zdCBzcGxpdFF1ZXJ5ID0gcXVlcnkuc3BsaXQoJ2lkPScpWzFdO1xuICAgICAgICAgICAgaWYgKHNwbGl0UXVlcnkgJiYgc3BsaXRRdWVyeS5sZW5ndGggJiYgcGFyc2VJbnQoc3BsaXRRdWVyeSwgMTApKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBwYXJzZUludChzcGxpdFF1ZXJ5LCAxMCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2Nlc3MgPSAocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcnRpY2xlID0gcmVzdWx0cy5maWx0ZXIoYXJ0aWNsZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJ0aWNsZS5pZCA9PT0gaWQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWFydGljbGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBVdGlscy5UZW1wbGF0ZUVuZ2luZS5jcmVhdGVIVE1MKGAke3RoaXMuTkVXU19URU1QTEFURX1gLCB7IGRhdGE6IGFydGljbGUgfSwgJ2NvY2t0YWlsLW5ld3MnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGZldGNoKGAke3RoaXMuTkVXU19VUkx9YClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2NjZXNzKHJlc3VsdHMpO1x0XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLlRlbXBsYXRlRW5naW5lLm5vRGF0YSgnY29ja3RhaWwtbmV3cycpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnLyc7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgTmV3czsiLCIvKipcbiAqIFVUSUxTIENMQVNTXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyB1c2VkIGFueXdoZXJlIHdpdGhpbiB0aGUgc2l0ZVxuICogXG4gKiAvanMvdXRpbHMvaW5kZXguanNcbiAqL1xuY2xhc3MgVXRpbHMge31cblxuLyoqXG4gKiBTSFJJTktIRUFERVIgQ0xBU1NcbiAqIEFkZHMgYSBjbGFzcyB0byB0aGUgYm9keSB3aGVuIGEgdXNlciBzY3JvbGxzLCB0byBzaHJpbmsgdGhlIGhlYWRlciBhbmQgc2hvdyBtb3JlIGNvbnRlbnRcbiAqL1xuVXRpbHMuU2hyaW5rSGVhZGVyID0gY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLnNjcm9sbFBvcyA9IDY0OyAvLyBTY3JvbGwgcG9zaXRpb24sIGluIHBpeGVscywgd2hlbiB0byB0cmlnZ2VyIHRoZSBzaHJpbmtpbmcgaGVhZGVyXG4gICAgICAgIHRoaXMuc2hyaW5rQ2xhc3MgPSAnYm9keS0tc2Nyb2xsZWQnOyAvLyBDbGFzcyB0byBhZGQgdG8gdGhlIGJvZHlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBoZWFkZXIgc2NyaXB0XG4gICAgICogXG4gICAgICogQHJldHVybiB2b2lkXG4gICAgICovXG4gICAgaW5pdCAoKSB7XG4gICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdGhpcyB0byB3b3JrIG9uIHRoZSBob21lcGFnZVxuICAgICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnZpZGVvLXdyYXBwZXInKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgdGhlIHNjcm9sbCBldmVudCAqL1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgZSA9PiB7XG4gICAgICAgICAgICAvLyBFdmVudCBoZWFyZC4gQ2FsbCB0aGUgc2Nyb2xsUGFnZSBmdW5jdGlvbiAqL1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxQYWdlKCk7XG4gICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAvLyBOb3cgY2FsbCB0aGUgZnVuY3Rpb24gYW55d2F5LCBzbyB3ZSBrbm93IHdoZXJlIHdlIGFyZSBhZnRlciByZWZyZXNoLCBldGNcbiAgICAgICAgdGhpcy5zY3JvbGxQYWdlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyB0aGUgc2Nyb2xsZWQgY2xhc3NcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBzY3JvbGxQYWdlICgpIHtcbiAgICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIC8vIEdyYWIgdGhlIGxhdGVzdCBzY3JvbGwgcG9zaXRpb24gKi9cbiAgICAgICAgY29uc3Qgc3kgPSB0aGlzLnNjcm9sbGVkUG9zKCk7XG4gICAgICAgIC8vIENoZWNrIGlmIHdlJ3ZlIHNjcm9sbGVkIGZhciBlbm91Z2hcbiAgICAgICAgaWYgKHN5ID4gdGhpcy5zY3JvbGxQb3MpIHtcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgc2Nyb2xsZWQgY2xhc3NcbiAgICAgICAgICAgIGJvZHkuY2xhc3NMaXN0LmFkZCh0aGlzLnNocmlua0NsYXNzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgc2Nyb2xsZWQgY2xhc3NcbiAgICAgICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLnNocmlua0NsYXNzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBwYWdlXG4gICAgICogXG4gICAgICogQHJldHVybiBXaW5kb3cgeSBwb3NpdGlvblxuICAgICAqL1xuICAgIHNjcm9sbGVkUG9zICgpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIH1cbn07XG5cbi8qKlxuICogRFJBV0VSIENMQVNTXG4gKiBBZGRzIGEgbmF2aWdhdGlvbiBkcmF3ZXIgZm9yIHNtYWxsZXIgc2NyZWVuc1xuICovXG5VdGlscy5EcmF3ZXIgPSBjbGFzcyB7XG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHRoaXMubWVudUJ1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudG9nZ2xlLWRyYXdlcicpOyAvLyBHcmFiIGFsbCBlbGVtZW50cyB3aXRoIGEgdG9nZ2xlLWRyYXdlciBjbGFzc1xuICAgICAgICB0aGlzLmRyYXdlckVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHJhd2VyJyk7IC8vIFRoZSBkcmF3ZXIgaXRzZWxmXG4gICAgICAgIHRoaXMuY2xvYWsgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2xvYWsnKTsgLy8gVGhlIHNoYWRlZCBvdmVybGF5IHdoZW4gdGhlIGRyYXdlciBpcyBvcGVuXG4gICAgICAgIHRoaXMuZHJhd2VyQ2xhc3MgPSAnYm9keS0tZHJhd2VyLXZpc2libGUnOyAvLyBDbGFzcyB0byBhZGQgdG8gdGhlIGJvZHkgdG8gc2xpZGUgdGhlIGRyYXdlciBpbiBhbmQgb3V0XG4gICAgICAgIHRoaXMuYm9keSA9IGRvY3VtZW50LmJvZHk7IC8vIEdyYWIgYSBoYW5kbGUgb24gdGggYm9keVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2UgdGhlIGRyYXdlciBzY3JpcHRcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgKi9cbiAgICBpbml0ICgpIHtcbiAgICAgICAgLy8gQWRkIGEgY2xpY2sgZXZlbnQgdG8gZXZlcnkgZWxlbWVudCB3aXRoIHRoZSB0b2dnbGUgY2xhc3NcbiAgICAgICAgLy8gVGhpcyBpcyBhIG5vZGUgbGlzdCwgc28gdHVybiBpdCBpbnRvIGFuIGFycmF5IGZpcnN0XG4gICAgICAgIFtdLnNsaWNlLmNhbGwodGhpcy5tZW51QnV0dG9ucykuZm9yRWFjaChidG4gPT4ge1xuICAgICAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgdG9nZ2xlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGVEcmF3ZXIoKVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGEgY2xpY2sgZXZlbnQgb24gdGhlIGNsb2FrLCB0byBjbG9zZSB0aGUgZHJhd2VyXG4gICAgICAgIHRoaXMuY2xvYWsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgICAgICAgIC8vIENhbGwgdGhlIHRvZ2dsZSBmdW5jdGlvblxuICAgICAgICAgICAgdGhpcy50b2dnbGVEcmF3ZXIoKVxuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIG9yIHJlbW92ZSB0aGUgdG9nZ2xlIGNsYXNzIHRvIHNob3cgdGhlIGRyYXdlclxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIHRvZ2dsZURyYXdlciAoKSB7XG4gICAgICAgIC8vIFRvZ2dsZSB0aGUgY2xhc3NcbiAgICAgICAgdGhpcy5ib2R5LmNsYXNzTGlzdC50b2dnbGUodGhpcy5kcmF3ZXJDbGFzcyk7XG4gICAgICAgIC8vIENhbGwgdGhlIGFyaWEgY2hhbmdlIGZ1bmN0aW9uXG4gICAgICAgIHRoaXMudG9nZ2xlQXJpYUF0dHIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGVzIHRoZSBBUklBIGF0dHJpYnV0ZSBvZiB0aGUgZHJhd2VyLlxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIHRvZ2dsZUFyaWFBdHRyICgpIHtcbiAgICAgICAgaWYgKHRoaXMuYm9keS5jbGFzc0xpc3QuY29udGFpbnModGhpcy5kcmF3ZXJDbGFzcykpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcblxuLyoqXG4gKiBURU1QTEFURUVOR0lORSBDTEFTU1xuICogQ3VzdG9tIGxpZ2h0d2VpZ2h0IHRlbXBsYXRpbmcgZW5naW5lLlxuICogSGVhdmlseSB0YWtlbiBmcm9tOlxuICogSm9obiBSZXNpZyDigJMgaHR0cDovL2Vqb2huLm9yZy8g4oCTIE1JVCBMaWNlbnNlZFxuICovXG5VdGlscy5UZW1wbGF0ZUVuZ2luZSA9IGNsYXNzIHtcblxuICAgIC8qKlxuICAgICogU3RvcmVzIHRoZSB0ZW1wbGF0ZSBkYXRhLCBzbyB3ZSBkb24ndCBrZWVwIHF1ZXJ5aW5nIHRoZSBET01cbiAgICAqIFxuICAgICogQHJldHVybiBFbXB0eSBvYmplY3RcbiAgICAqL1xuICAgIHN0YXRpYyBnZXQgQ0FDSEUgKCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBUYWtlcyB0aGUgdGVtcGxhdGUsIG1vZGVsIGFuZCBkZXN0aW5hdGlvbiB0byBwYXNzIG9uIHRvIHRoZSB0ZW1wbGF0aW5nIGZ1bmN0aW9uXG4gICAgKlxuICAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgdGVtcGxhdGUgLSBJRCBvZiBzY3JpcHQgdGVtcGxhdGVcbiAgICAqIEBwYXJhbSB7b2JqZWN0fSAgIG1vZGVsIC0gRGF0YSBtb2RlbCB0byBwYXNzIHRvIHRlbXBsYXRlIFxuICAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgZGVzdGluYXRpb24gLSBJRCBvZiB3aGVyZSB0aGUgZmluaXNoZWQgdGVtcGxhdGUgaXMgZ29pbmcgdG8gZ29cbiAgICAqIFxuICAgICpAcmV0dXJuIHZvaWRcbiAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVIVE1MICh0ZW1wbGF0ZSwgbW9kZWwsIGRlc3RpbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZXN0aW5hdGlvbik7XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IHRoaXMudGVtcGxhdGVUb0hUTUwodGVtcGxhdGUsIG1vZGVsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBldmVudCA9IG5ldyBFdmVudCgndGVtcGxhdGVMb2FkZWQnKTtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQ29tYmluZXMgZHluYW1pYyBkYXRhIHdpdGggb3VyIHRlbXBsYXRlcyBhbmQgcmV0dXJucyB0aGUgcmVzdWx0XG4gICAgKiBKb2huIFJlc2lnIOKAkyBodHRwOi8vZWpvaG4ub3JnLyDigJMgTUlUIExpY2Vuc2VkXG4gICAgKiBcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSAgIHN0ciAtIElEIG9mIHNjcmlwdCB0ZW1wbGF0ZVxuICAgICogQHBhcmFtIHtvYmplY3R9ICAgZGF0YSAtIERhdGEgbW9kZWwgdG8gcGFzcyB0byB0ZW1wbGF0ZVxuICAgICogXG4gICAgKiBAcmV0dXJuIFRoZSBmaW5pc2hlZCB0ZW1wbGF0ZVxuICAgICovXG4gICAgc3RhdGljIHRlbXBsYXRlVG9IVE1MIChzdHIsIGRhdGEpIHtcbiAgICAgICAgY29uc3QgZm4gPSAhL1xcVy8udGVzdChzdHIpID9cbiAgICAgICAgICAgIHRoaXMuQ0FDSEVbc3RyXSA9IHRoaXMuQ0FDSEVbc3RyXSB8fFxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZVRvSFRNTChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdHIpLmlubmVySFRNTCkgOlxuXG4gICAgICAgICAgICAgICAgbmV3IEZ1bmN0aW9uKFwib2JqXCIsIFwidmFyIHA9W10scHJpbnQ9ZnVuY3Rpb24oKXtwLnB1c2guYXBwbHkocCxhcmd1bWVudHMpO307XCIgK1xuXG4gICAgICAgICAgICAgICAgXCJ3aXRoKG9iail7cC5wdXNoKCdcIiArXG5cbiAgICAgICAgICAgICAgICBzdHJcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1tcXHJcXHRcXG5dL2csIFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCI8JVwiKS5qb2luKFwiXFx0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oKF58JT4pW15cXHRdKiknL2csIFwiJDFcXHJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcdD0oLio/KSU+L2csIFwiJywkMSwnXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIlxcdFwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcIicpO1wiKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCIlPlwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcInAucHVzaCgnXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIlxcclwiKVxuICAgICAgICAgICAgICAgICAgICAuam9pbihcIlxcXFwnXCIpXG5cbiAgICAgICAgICAgICAgICAgICAgKyBcIicpO31yZXR1cm4gcC5qb2luKCcnKTtcIik7XG5cbiAgICAgICAgcmV0dXJuIGRhdGEgPyBmbiggZGF0YSApIDogZm47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBTaG93IGFuIGVycm9yIG1lc3NhZ2UgaWYgd2UgY2FuJ3QgZ2V0IGFueSBpbmZvIFxuICAgICogXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gICBzdHIgLSBJRCBvZiBkZXN0aW5hdGlvbiB0ZW1wbGF0ZVxuICAgICovXG4gICAgc3RhdGljIG5vRGF0YSAoc3RyKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgncGVuZGluZycpO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdHIpLmlubmVySFRNTCA9IGA8cCBjbGFzcz1cIm5vLWRhdGFcIj48aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+ZXJyb3Jfb3V0bGluZTwvaT4gVWggb2ghIFdlJ3JlIHVuYWJsZSB0byBkaXNwbGF5IHRoYXQgaW5mb21hdGlvbi4gUGxlYXNlIGNoZWNrIHlvdXIgY29ubmVjdGlvbiBhbmQgdHJ5IGFnYWluLjwvcD5gO1xuICAgIH1cblxufTtcblxuLyoqXG4gKiBCYWNrIFRvIFRvcCBmdW5jdGlvbmFsaXR5XG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5iYWNrVG9Ub3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFjay10by10b3AnKTtcbiAgICBpZiAoZWwpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfVxufVxuXG4vKipcbiAqIFN0YXJ0cyB0aGUgc3BsYXNoIHNjcmVlbiBieSByZW1vdmluZyB0aGUgcGVuZGluZyBjbGFzcyBmcm9tIHRoZSBib2R5XG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5zdGFydFNwbGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBmaXJzdFRpbWVyID0gNTAwO1xuICAgIGNvbnN0IHNlY29uZFRpbWVyID0gMzAwMDtcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnc3BsYXNoLTEnKTtcbiAgICB9LCBmaXJzdFRpbWVyKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnc3BsYXNoLTInKTtcbiAgICB9LCBzZWNvbmRUaW1lcik7XG59XG5cbi8qKlxuICogU2V0IHRoZSBzdHlsZXNoZWV0IHByb3BlcnR5IGZvciB2aWRlbyBoZWlnaHQgZm9yIG1vYmlsZSBkZXZpY2VzXG4gKiBcbiAqIEByZXR1cm4gdm9pZFxuICovXG5VdGlscy5nZXRIZWlnaHRGb3JWaWRlbyA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCB2aWV3SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmlld0hlaWdodCcsIGAke3ZpZXdIZWlnaHR9cHhgKTtcbn07XG5cbi8qKlxuICogQWRkIGEgY2xpY2sgZXZlbnQgdG8gdGhlIGJ1dHRvbnMgb24gdGhlIGNvY2t0YWlsIGxpc3QgcGFnZXNcbiAqIFxuICogQHJldHVybiB2b2lkXG4gKi9cblV0aWxzLmFjdGl2YXRlRnVsbERldGFpbEJ1dHRvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgYWRkQ2xpY2tFdmVudHMgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ0bnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdidXR0b24uZnVsbC1kZXRhaWxzLWJ1dHRvbicpO1xuICAgICAgICBpZiAoIWJ0bnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgW10uc2xpY2UuY2FsbChidG5zKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGUudGFyZ2V0LmRhdGFzZXQubGluaztcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3QgcmVtb3ZlUGVuZGluZyA9ICgpID0+IHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdwZW5kaW5nJyk7XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndGVtcGxhdGVMb2FkZWQnLCBlID0+IHtcbiAgICAgICAgcmVtb3ZlUGVuZGluZygpO1xuICAgICAgICBhZGRDbGlja0V2ZW50cygpO1xuICAgIH0sIGZhbHNlKTtcbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgVXRpbHM7Il19
