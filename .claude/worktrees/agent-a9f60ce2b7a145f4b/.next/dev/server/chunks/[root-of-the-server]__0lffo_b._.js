module.exports = [
"[project]/node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs/dist/bcrypt.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*
 Copyright (c) 2012 Nevins Bartolomeo <nevins.bartolomeo@gmail.com>
 Copyright (c) 2012 Shane Girish <shaneGirish@gmail.com>
 Copyright (c) 2014 Daniel Wirtz <dcode@dcode.io>

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:
 1. Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 3. The name of the author may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */ /**
 * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/bcrypt.js for details
 */ (function(global, factory) {
    /* AMD */ if (typeof define === 'function' && define["amd"]) ((r)=>r !== undefined && __turbopack_context__.v(r))(factory());
    else if (("TURBOPACK compile-time value", "function") === 'function' && ("TURBOPACK compile-time value", "object") === "object" && module && module["exports"]) module["exports"] = factory();
    else (global["dcodeIO"] = global["dcodeIO"] || {})["bcrypt"] = factory();
})(/*TURBOPACK member replacement*/ __turbopack_context__.e, function() {
    "use strict";
    /**
     * bcrypt namespace.
     * @type {Object.<string,*>}
     */ var bcrypt = {};
    /**
     * The random implementation to use as a fallback.
     * @type {?function(number):!Array.<number>}
     * @inner
     */ var randomFallback = null;
    /**
     * Generates cryptographically secure random bytes.
     * @function
     * @param {number} len Bytes length
     * @returns {!Array.<number>} Random bytes
     * @throws {Error} If no random implementation is available
     * @inner
     */ function random(len) {
        /* node */ if (("TURBOPACK compile-time value", "object") !== 'undefined' && module && module['exports']) try {
            return __turbopack_context__.r("[externals]/crypto [external] (crypto, cjs)")['randomBytes'](len);
        } catch (e) {}
        /* WCA */ try {
            var a;
            (self['crypto'] || self['msCrypto'])['getRandomValues'](a = new Uint32Array(len));
            return Array.prototype.slice.call(a);
        } catch (e) {}
        /* fallback */ if (!randomFallback) throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
    }
    // Test if any secure randomness source is available
    var randomAvailable = false;
    try {
        random(1);
        randomAvailable = true;
    } catch (e) {}
    // Default fallback, if any
    randomFallback = null;
    /**
     * Sets the pseudo random number generator to use as a fallback if neither node's `crypto` module nor the Web Crypto
     *  API is available. Please note: It is highly important that the PRNG used is cryptographically secure and that it
     *  is seeded properly!
     * @param {?function(number):!Array.<number>} random Function taking the number of bytes to generate as its
     *  sole argument, returning the corresponding array of cryptographically secure random byte values.
     * @see http://nodejs.org/api/crypto.html
     * @see http://www.w3.org/TR/WebCryptoAPI/
     */ bcrypt.setRandomFallback = function(random) {
        randomFallback = random;
    };
    /**
     * Synchronously generates a salt.
     * @param {number=} rounds Number of rounds to use, defaults to 10 if omitted
     * @param {number=} seed_length Not supported.
     * @returns {string} Resulting salt
     * @throws {Error} If a random fallback is required but not set
     * @expose
     */ bcrypt.genSaltSync = function(rounds, seed_length) {
        rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof rounds !== 'number') throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        if (rounds < 4) rounds = 4;
        else if (rounds > 31) rounds = 31;
        var salt = [];
        salt.push("$2a$");
        if (rounds < 10) salt.push("0");
        salt.push(rounds.toString());
        salt.push('$');
        salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN)); // May throw
        return salt.join('');
    };
    /**
     * Asynchronously generates a salt.
     * @param {(number|function(Error, string=))=} rounds Number of rounds to use, defaults to 10 if omitted
     * @param {(number|function(Error, string=))=} seed_length Not supported.
     * @param {function(Error, string=)=} callback Callback receiving the error, if any, and the resulting salt
     * @returns {!Promise} If `callback` has been omitted
     * @throws {Error} If `callback` is present but not a function
     * @expose
     */ bcrypt.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length === 'function') callback = seed_length, seed_length = undefined; // Not supported.
        if (typeof rounds === 'function') callback = rounds, rounds = undefined;
        if (typeof rounds === 'undefined') rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds !== 'number') throw Error("illegal arguments: " + typeof rounds);
        function _async(callback) {
            nextTick(function() {
                try {
                    callback(null, bcrypt.genSaltSync(rounds));
                } catch (err) {
                    callback(err);
                }
            });
        }
        if (callback) {
            if (typeof callback !== 'function') throw Error("Illegal callback: " + typeof callback);
            _async(callback);
        } else return new Promise(function(resolve, reject) {
            _async(function(err, res) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(res);
            });
        });
    };
    /**
     * Synchronously generates a hash for the given string.
     * @param {string} s String to hash
     * @param {(number|string)=} salt Salt length to generate or salt to use, default to 10
     * @returns {string} Resulting hash
     * @expose
     */ bcrypt.hashSync = function(s, salt) {
        if (typeof salt === 'undefined') salt = GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof salt === 'number') salt = bcrypt.genSaltSync(salt);
        if (typeof s !== 'string' || typeof salt !== 'string') throw Error("Illegal arguments: " + typeof s + ', ' + typeof salt);
        return _hash(s, salt);
    };
    /**
     * Asynchronously generates a hash for the given string.
     * @param {string} s String to hash
     * @param {number|string} salt Salt length to generate or salt to use
     * @param {function(Error, string=)=} callback Callback receiving the error, if any, and the resulting hash
     * @param {function(number)=} progressCallback Callback successively called with the percentage of rounds completed
     *  (0.0 - 1.0), maximally once per `MAX_EXECUTION_TIME = 100` ms.
     * @returns {!Promise} If `callback` has been omitted
     * @throws {Error} If `callback` is present but not a function
     * @expose
     */ bcrypt.hash = function(s, salt, callback, progressCallback) {
        function _async(callback) {
            if (typeof s === 'string' && typeof salt === 'number') bcrypt.genSalt(salt, function(err, salt) {
                _hash(s, salt, callback, progressCallback);
            });
            else if (typeof s === 'string' && typeof salt === 'string') _hash(s, salt, callback, progressCallback);
            else nextTick(callback.bind(this, Error("Illegal arguments: " + typeof s + ', ' + typeof salt)));
        }
        if (callback) {
            if (typeof callback !== 'function') throw Error("Illegal callback: " + typeof callback);
            _async(callback);
        } else return new Promise(function(resolve, reject) {
            _async(function(err, res) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(res);
            });
        });
    };
    /**
     * Compares two strings of the same length in constant time.
     * @param {string} known Must be of the correct length
     * @param {string} unknown Must be the same length as `known`
     * @returns {boolean}
     * @inner
     */ function safeStringCompare(known, unknown) {
        var right = 0, wrong = 0;
        for(var i = 0, k = known.length; i < k; ++i){
            if (known.charCodeAt(i) === unknown.charCodeAt(i)) ++right;
            else ++wrong;
        }
        // Prevent removal of unused variables (never true, actually)
        if (right < 0) return false;
        return wrong === 0;
    }
    /**
     * Synchronously tests a string against a hash.
     * @param {string} s String to compare
     * @param {string} hash Hash to test against
     * @returns {boolean} true if matching, otherwise false
     * @throws {Error} If an argument is illegal
     * @expose
     */ bcrypt.compareSync = function(s, hash) {
        if (typeof s !== "string" || typeof hash !== "string") throw Error("Illegal arguments: " + typeof s + ', ' + typeof hash);
        if (hash.length !== 60) return false;
        return safeStringCompare(bcrypt.hashSync(s, hash.substr(0, hash.length - 31)), hash);
    };
    /**
     * Asynchronously compares the given data against the given hash.
     * @param {string} s Data to compare
     * @param {string} hash Data to be compared to
     * @param {function(Error, boolean)=} callback Callback receiving the error, if any, otherwise the result
     * @param {function(number)=} progressCallback Callback successively called with the percentage of rounds completed
     *  (0.0 - 1.0), maximally once per `MAX_EXECUTION_TIME = 100` ms.
     * @returns {!Promise} If `callback` has been omitted
     * @throws {Error} If `callback` is present but not a function
     * @expose
     */ bcrypt.compare = function(s, hash, callback, progressCallback) {
        function _async(callback) {
            if (typeof s !== "string" || typeof hash !== "string") {
                nextTick(callback.bind(this, Error("Illegal arguments: " + typeof s + ', ' + typeof hash)));
                return;
            }
            if (hash.length !== 60) {
                nextTick(callback.bind(this, null, false));
                return;
            }
            bcrypt.hash(s, hash.substr(0, 29), function(err, comp) {
                if (err) callback(err);
                else callback(null, safeStringCompare(comp, hash));
            }, progressCallback);
        }
        if (callback) {
            if (typeof callback !== 'function') throw Error("Illegal callback: " + typeof callback);
            _async(callback);
        } else return new Promise(function(resolve, reject) {
            _async(function(err, res) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(res);
            });
        });
    };
    /**
     * Gets the number of rounds used to encrypt the specified hash.
     * @param {string} hash Hash to extract the used number of rounds from
     * @returns {number} Number of rounds used
     * @throws {Error} If `hash` is not a string
     * @expose
     */ bcrypt.getRounds = function(hash) {
        if (typeof hash !== "string") throw Error("Illegal arguments: " + typeof hash);
        return parseInt(hash.split("$")[2], 10);
    };
    /**
     * Gets the salt portion from a hash. Does not validate the hash.
     * @param {string} hash Hash to extract the salt from
     * @returns {string} Extracted salt part
     * @throws {Error} If `hash` is not a string or otherwise invalid
     * @expose
     */ bcrypt.getSalt = function(hash) {
        if (typeof hash !== 'string') throw Error("Illegal arguments: " + typeof hash);
        if (hash.length !== 60) throw Error("Illegal hash length: " + hash.length + " != 60");
        return hash.substring(0, 29);
    };
    /**
     * Continues with the callback on the next tick.
     * @function
     * @param {function(...[*])} callback Callback to execute
     * @inner
     */ var nextTick = typeof process !== 'undefined' && process && typeof process.nextTick === 'function' ? typeof setImmediate === 'function' ? setImmediate : process.nextTick : setTimeout;
    /**
     * Converts a JavaScript string to UTF8 bytes.
     * @param {string} str String
     * @returns {!Array.<number>} UTF8 bytes
     * @inner
     */ function stringToBytes(str) {
        var out = [], i = 0;
        utfx.encodeUTF16toUTF8(function() {
            if (i >= str.length) return null;
            return str.charCodeAt(i++);
        }, function(b) {
            out.push(b);
        });
        return out;
    }
    // A base64 implementation for the bcrypt algorithm. This is partly non-standard.
    /**
     * bcrypt's own non-standard base64 dictionary.
     * @type {!Array.<string>}
     * @const
     * @inner
     **/ var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split('');
    /**
     * @type {!Array.<number>}
     * @const
     * @inner
     **/ var BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
    ];
    /**
     * @type {!function(...number):string}
     * @inner
     */ var stringFromCharCode = String.fromCharCode;
    /**
     * Encodes a byte array to base64 with up to len bytes of input.
     * @param {!Array.<number>} b Byte array
     * @param {number} len Maximum input length
     * @returns {string}
     * @inner
     */ function base64_encode(b, len) {
        var off = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
        while(off < len){
            c1 = b[off++] & 0xff;
            rs.push(BASE64_CODE[c1 >> 2 & 0x3f]);
            c1 = (c1 & 0x03) << 4;
            if (off >= len) {
                rs.push(BASE64_CODE[c1 & 0x3f]);
                break;
            }
            c2 = b[off++] & 0xff;
            c1 |= c2 >> 4 & 0x0f;
            rs.push(BASE64_CODE[c1 & 0x3f]);
            c1 = (c2 & 0x0f) << 2;
            if (off >= len) {
                rs.push(BASE64_CODE[c1 & 0x3f]);
                break;
            }
            c2 = b[off++] & 0xff;
            c1 |= c2 >> 6 & 0x03;
            rs.push(BASE64_CODE[c1 & 0x3f]);
            rs.push(BASE64_CODE[c2 & 0x3f]);
        }
        return rs.join('');
    }
    /**
     * Decodes a base64 encoded string to up to len bytes of output.
     * @param {string} s String to decode
     * @param {number} len Maximum output length
     * @returns {!Array.<number>}
     * @inner
     */ function base64_decode(s, len) {
        var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0) throw Error("Illegal len: " + len);
        while(off < slen - 1 && olen < len){
            code = s.charCodeAt(off++);
            c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
            code = s.charCodeAt(off++);
            c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
            if (c1 == -1 || c2 == -1) break;
            o = c1 << 2 >>> 0;
            o |= (c2 & 0x30) >> 4;
            rs.push(stringFromCharCode(o));
            if (++olen >= len || off >= slen) break;
            code = s.charCodeAt(off++);
            c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
            if (c3 == -1) break;
            o = (c2 & 0x0f) << 4 >>> 0;
            o |= (c3 & 0x3c) >> 2;
            rs.push(stringFromCharCode(o));
            if (++olen >= len || off >= slen) break;
            code = s.charCodeAt(off++);
            c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
            o = (c3 & 0x03) << 6 >>> 0;
            o |= c4;
            rs.push(stringFromCharCode(o));
            ++olen;
        }
        var res = [];
        for(off = 0; off < olen; off++)res.push(rs[off].charCodeAt(0));
        return res;
    }
    /**
     * utfx-embeddable (c) 2014 Daniel Wirtz <dcode@dcode.io>
     * Released under the Apache License, Version 2.0
     * see: https://github.com/dcodeIO/utfx for details
     */ var utfx = function() {
        "use strict";
        /**
         * utfx namespace.
         * @inner
         * @type {!Object.<string,*>}
         */ var utfx = {};
        /**
         * Maximum valid code point.
         * @type {number}
         * @const
         */ utfx.MAX_CODEPOINT = 0x10FFFF;
        /**
         * Encodes UTF8 code points to UTF8 bytes.
         * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
         *  respectively `null` if there are no more code points left or a single numeric code point.
         * @param {!function(number)} dst Bytes destination as a function successively called with the next byte
         */ utfx.encodeUTF8 = function(src, dst) {
            var cp = null;
            if (typeof src === 'number') cp = src, src = function() {
                return null;
            };
            while(cp !== null || (cp = src()) !== null){
                if (cp < 0x80) dst(cp & 0x7F);
                else if (cp < 0x800) dst(cp >> 6 & 0x1F | 0xC0), dst(cp & 0x3F | 0x80);
                else if (cp < 0x10000) dst(cp >> 12 & 0x0F | 0xE0), dst(cp >> 6 & 0x3F | 0x80), dst(cp & 0x3F | 0x80);
                else dst(cp >> 18 & 0x07 | 0xF0), dst(cp >> 12 & 0x3F | 0x80), dst(cp >> 6 & 0x3F | 0x80), dst(cp & 0x3F | 0x80);
                cp = null;
            }
        };
        /**
         * Decodes UTF8 bytes to UTF8 code points.
         * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
         *  are no more bytes left.
         * @param {!function(number)} dst Code points destination as a function successively called with each decoded code point.
         * @throws {RangeError} If a starting byte is invalid in UTF8
         * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
         *  remaining bytes.
         */ utfx.decodeUTF8 = function(src, dst) {
            var a, b, c, d, fail = function(b) {
                b = b.slice(0, b.indexOf(null));
                var err = Error(b.toString());
                err.name = "TruncatedError";
                err['bytes'] = b;
                throw err;
            };
            while((a = src()) !== null){
                if ((a & 0x80) === 0) dst(a);
                else if ((a & 0xE0) === 0xC0) (b = src()) === null && fail([
                    a,
                    b
                ]), dst((a & 0x1F) << 6 | b & 0x3F);
                else if ((a & 0xF0) === 0xE0) ((b = src()) === null || (c = src()) === null) && fail([
                    a,
                    b,
                    c
                ]), dst((a & 0x0F) << 12 | (b & 0x3F) << 6 | c & 0x3F);
                else if ((a & 0xF8) === 0xF0) ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([
                    a,
                    b,
                    c,
                    d
                ]), dst((a & 0x07) << 18 | (b & 0x3F) << 12 | (c & 0x3F) << 6 | d & 0x3F);
                else throw RangeError("Illegal starting byte: " + a);
            }
        };
        /**
         * Converts UTF16 characters to UTF8 code points.
         * @param {!function():number|null} src Characters source as a function returning the next char code respectively
         *  `null` if there are no more characters left.
         * @param {!function(number)} dst Code points destination as a function successively called with each converted code
         *  point.
         */ utfx.UTF16toUTF8 = function(src, dst) {
            var c1, c2 = null;
            while(true){
                if ((c1 = c2 !== null ? c2 : src()) === null) break;
                if (c1 >= 0xD800 && c1 <= 0xDFFF) {
                    if ((c2 = src()) !== null) {
                        if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
                            dst((c1 - 0xD800) * 0x400 + c2 - 0xDC00 + 0x10000);
                            c2 = null;
                            continue;
                        }
                    }
                }
                dst(c1);
            }
            if (c2 !== null) dst(c2);
        };
        /**
         * Converts UTF8 code points to UTF16 characters.
         * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
         *  respectively `null` if there are no more code points left or a single numeric code point.
         * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
         * @throws {RangeError} If a code point is out of range
         */ utfx.UTF8toUTF16 = function(src, dst) {
            var cp = null;
            if (typeof src === 'number') cp = src, src = function() {
                return null;
            };
            while(cp !== null || (cp = src()) !== null){
                if (cp <= 0xFFFF) dst(cp);
                else cp -= 0x10000, dst((cp >> 10) + 0xD800), dst(cp % 0x400 + 0xDC00);
                cp = null;
            }
        };
        /**
         * Converts and encodes UTF16 characters to UTF8 bytes.
         * @param {!function():number|null} src Characters source as a function returning the next char code respectively `null`
         *  if there are no more characters left.
         * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
         */ utfx.encodeUTF16toUTF8 = function(src, dst) {
            utfx.UTF16toUTF8(src, function(cp) {
                utfx.encodeUTF8(cp, dst);
            });
        };
        /**
         * Decodes and converts UTF8 bytes to UTF16 characters.
         * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
         *  are no more bytes left.
         * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
         * @throws {RangeError} If a starting byte is invalid in UTF8
         * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
         */ utfx.decodeUTF8toUTF16 = function(src, dst) {
            utfx.decodeUTF8(src, function(cp) {
                utfx.UTF8toUTF16(cp, dst);
            });
        };
        /**
         * Calculates the byte length of an UTF8 code point.
         * @param {number} cp UTF8 code point
         * @returns {number} Byte length
         */ utfx.calculateCodePoint = function(cp) {
            return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
        };
        /**
         * Calculates the number of UTF8 bytes required to store UTF8 code points.
         * @param {(!function():number|null)} src Code points source as a function returning the next code point respectively
         *  `null` if there are no more code points left.
         * @returns {number} The number of UTF8 bytes required
         */ utfx.calculateUTF8 = function(src) {
            var cp, l = 0;
            while((cp = src()) !== null)l += utfx.calculateCodePoint(cp);
            return l;
        };
        /**
         * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
         * @param {(!function():number|null)} src Characters source as a function returning the next char code respectively
         *  `null` if there are no more characters left.
         * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
         */ utfx.calculateUTF16asUTF8 = function(src) {
            var n = 0, l = 0;
            utfx.UTF16toUTF8(src, function(cp) {
                ++n;
                l += utfx.calculateCodePoint(cp);
            });
            return [
                n,
                l
            ];
        };
        return utfx;
    }();
    Date.now = Date.now || function() {
        return +new Date;
    };
    /**
     * @type {number}
     * @const
     * @inner
     */ var BCRYPT_SALT_LEN = 16;
    /**
     * @type {number}
     * @const
     * @inner
     */ var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
    /**
     * @type {number}
     * @const
     * @inner
     */ var BLOWFISH_NUM_ROUNDS = 16;
    /**
     * @type {number}
     * @const
     * @inner
     */ var MAX_EXECUTION_TIME = 100;
    /**
     * @type {Array.<number>}
     * @const
     * @inner
     */ var P_ORIG = [
        0x243f6a88,
        0x85a308d3,
        0x13198a2e,
        0x03707344,
        0xa4093822,
        0x299f31d0,
        0x082efa98,
        0xec4e6c89,
        0x452821e6,
        0x38d01377,
        0xbe5466cf,
        0x34e90c6c,
        0xc0ac29b7,
        0xc97c50dd,
        0x3f84d5b5,
        0xb5470917,
        0x9216d5d9,
        0x8979fb1b
    ];
    /**
     * @type {Array.<number>}
     * @const
     * @inner
     */ var S_ORIG = [
        0xd1310ba6,
        0x98dfb5ac,
        0x2ffd72db,
        0xd01adfb7,
        0xb8e1afed,
        0x6a267e96,
        0xba7c9045,
        0xf12c7f99,
        0x24a19947,
        0xb3916cf7,
        0x0801f2e2,
        0x858efc16,
        0x636920d8,
        0x71574e69,
        0xa458fea3,
        0xf4933d7e,
        0x0d95748f,
        0x728eb658,
        0x718bcd58,
        0x82154aee,
        0x7b54a41d,
        0xc25a59b5,
        0x9c30d539,
        0x2af26013,
        0xc5d1b023,
        0x286085f0,
        0xca417918,
        0xb8db38ef,
        0x8e79dcb0,
        0x603a180e,
        0x6c9e0e8b,
        0xb01e8a3e,
        0xd71577c1,
        0xbd314b27,
        0x78af2fda,
        0x55605c60,
        0xe65525f3,
        0xaa55ab94,
        0x57489862,
        0x63e81440,
        0x55ca396a,
        0x2aab10b6,
        0xb4cc5c34,
        0x1141e8ce,
        0xa15486af,
        0x7c72e993,
        0xb3ee1411,
        0x636fbc2a,
        0x2ba9c55d,
        0x741831f6,
        0xce5c3e16,
        0x9b87931e,
        0xafd6ba33,
        0x6c24cf5c,
        0x7a325381,
        0x28958677,
        0x3b8f4898,
        0x6b4bb9af,
        0xc4bfe81b,
        0x66282193,
        0x61d809cc,
        0xfb21a991,
        0x487cac60,
        0x5dec8032,
        0xef845d5d,
        0xe98575b1,
        0xdc262302,
        0xeb651b88,
        0x23893e81,
        0xd396acc5,
        0x0f6d6ff3,
        0x83f44239,
        0x2e0b4482,
        0xa4842004,
        0x69c8f04a,
        0x9e1f9b5e,
        0x21c66842,
        0xf6e96c9a,
        0x670c9c61,
        0xabd388f0,
        0x6a51a0d2,
        0xd8542f68,
        0x960fa728,
        0xab5133a3,
        0x6eef0b6c,
        0x137a3be4,
        0xba3bf050,
        0x7efb2a98,
        0xa1f1651d,
        0x39af0176,
        0x66ca593e,
        0x82430e88,
        0x8cee8619,
        0x456f9fb4,
        0x7d84a5c3,
        0x3b8b5ebe,
        0xe06f75d8,
        0x85c12073,
        0x401a449f,
        0x56c16aa6,
        0x4ed3aa62,
        0x363f7706,
        0x1bfedf72,
        0x429b023d,
        0x37d0d724,
        0xd00a1248,
        0xdb0fead3,
        0x49f1c09b,
        0x075372c9,
        0x80991b7b,
        0x25d479d8,
        0xf6e8def7,
        0xe3fe501a,
        0xb6794c3b,
        0x976ce0bd,
        0x04c006ba,
        0xc1a94fb6,
        0x409f60c4,
        0x5e5c9ec2,
        0x196a2463,
        0x68fb6faf,
        0x3e6c53b5,
        0x1339b2eb,
        0x3b52ec6f,
        0x6dfc511f,
        0x9b30952c,
        0xcc814544,
        0xaf5ebd09,
        0xbee3d004,
        0xde334afd,
        0x660f2807,
        0x192e4bb3,
        0xc0cba857,
        0x45c8740f,
        0xd20b5f39,
        0xb9d3fbdb,
        0x5579c0bd,
        0x1a60320a,
        0xd6a100c6,
        0x402c7279,
        0x679f25fe,
        0xfb1fa3cc,
        0x8ea5e9f8,
        0xdb3222f8,
        0x3c7516df,
        0xfd616b15,
        0x2f501ec8,
        0xad0552ab,
        0x323db5fa,
        0xfd238760,
        0x53317b48,
        0x3e00df82,
        0x9e5c57bb,
        0xca6f8ca0,
        0x1a87562e,
        0xdf1769db,
        0xd542a8f6,
        0x287effc3,
        0xac6732c6,
        0x8c4f5573,
        0x695b27b0,
        0xbbca58c8,
        0xe1ffa35d,
        0xb8f011a0,
        0x10fa3d98,
        0xfd2183b8,
        0x4afcb56c,
        0x2dd1d35b,
        0x9a53e479,
        0xb6f84565,
        0xd28e49bc,
        0x4bfb9790,
        0xe1ddf2da,
        0xa4cb7e33,
        0x62fb1341,
        0xcee4c6e8,
        0xef20cada,
        0x36774c01,
        0xd07e9efe,
        0x2bf11fb4,
        0x95dbda4d,
        0xae909198,
        0xeaad8e71,
        0x6b93d5a0,
        0xd08ed1d0,
        0xafc725e0,
        0x8e3c5b2f,
        0x8e7594b7,
        0x8ff6e2fb,
        0xf2122b64,
        0x8888b812,
        0x900df01c,
        0x4fad5ea0,
        0x688fc31c,
        0xd1cff191,
        0xb3a8c1ad,
        0x2f2f2218,
        0xbe0e1777,
        0xea752dfe,
        0x8b021fa1,
        0xe5a0cc0f,
        0xb56f74e8,
        0x18acf3d6,
        0xce89e299,
        0xb4a84fe0,
        0xfd13e0b7,
        0x7cc43b81,
        0xd2ada8d9,
        0x165fa266,
        0x80957705,
        0x93cc7314,
        0x211a1477,
        0xe6ad2065,
        0x77b5fa86,
        0xc75442f5,
        0xfb9d35cf,
        0xebcdaf0c,
        0x7b3e89a0,
        0xd6411bd3,
        0xae1e7e49,
        0x00250e2d,
        0x2071b35e,
        0x226800bb,
        0x57b8e0af,
        0x2464369b,
        0xf009b91e,
        0x5563911d,
        0x59dfa6aa,
        0x78c14389,
        0xd95a537f,
        0x207d5ba2,
        0x02e5b9c5,
        0x83260376,
        0x6295cfa9,
        0x11c81968,
        0x4e734a41,
        0xb3472dca,
        0x7b14a94a,
        0x1b510052,
        0x9a532915,
        0xd60f573f,
        0xbc9bc6e4,
        0x2b60a476,
        0x81e67400,
        0x08ba6fb5,
        0x571be91f,
        0xf296ec6b,
        0x2a0dd915,
        0xb6636521,
        0xe7b9f9b6,
        0xff34052e,
        0xc5855664,
        0x53b02d5d,
        0xa99f8fa1,
        0x08ba4799,
        0x6e85076a,
        0x4b7a70e9,
        0xb5b32944,
        0xdb75092e,
        0xc4192623,
        0xad6ea6b0,
        0x49a7df7d,
        0x9cee60b8,
        0x8fedb266,
        0xecaa8c71,
        0x699a17ff,
        0x5664526c,
        0xc2b19ee1,
        0x193602a5,
        0x75094c29,
        0xa0591340,
        0xe4183a3e,
        0x3f54989a,
        0x5b429d65,
        0x6b8fe4d6,
        0x99f73fd6,
        0xa1d29c07,
        0xefe830f5,
        0x4d2d38e6,
        0xf0255dc1,
        0x4cdd2086,
        0x8470eb26,
        0x6382e9c6,
        0x021ecc5e,
        0x09686b3f,
        0x3ebaefc9,
        0x3c971814,
        0x6b6a70a1,
        0x687f3584,
        0x52a0e286,
        0xb79c5305,
        0xaa500737,
        0x3e07841c,
        0x7fdeae5c,
        0x8e7d44ec,
        0x5716f2b8,
        0xb03ada37,
        0xf0500c0d,
        0xf01c1f04,
        0x0200b3ff,
        0xae0cf51a,
        0x3cb574b2,
        0x25837a58,
        0xdc0921bd,
        0xd19113f9,
        0x7ca92ff6,
        0x94324773,
        0x22f54701,
        0x3ae5e581,
        0x37c2dadc,
        0xc8b57634,
        0x9af3dda7,
        0xa9446146,
        0x0fd0030e,
        0xecc8c73e,
        0xa4751e41,
        0xe238cd99,
        0x3bea0e2f,
        0x3280bba1,
        0x183eb331,
        0x4e548b38,
        0x4f6db908,
        0x6f420d03,
        0xf60a04bf,
        0x2cb81290,
        0x24977c79,
        0x5679b072,
        0xbcaf89af,
        0xde9a771f,
        0xd9930810,
        0xb38bae12,
        0xdccf3f2e,
        0x5512721f,
        0x2e6b7124,
        0x501adde6,
        0x9f84cd87,
        0x7a584718,
        0x7408da17,
        0xbc9f9abc,
        0xe94b7d8c,
        0xec7aec3a,
        0xdb851dfa,
        0x63094366,
        0xc464c3d2,
        0xef1c1847,
        0x3215d908,
        0xdd433b37,
        0x24c2ba16,
        0x12a14d43,
        0x2a65c451,
        0x50940002,
        0x133ae4dd,
        0x71dff89e,
        0x10314e55,
        0x81ac77d6,
        0x5f11199b,
        0x043556f1,
        0xd7a3c76b,
        0x3c11183b,
        0x5924a509,
        0xf28fe6ed,
        0x97f1fbfa,
        0x9ebabf2c,
        0x1e153c6e,
        0x86e34570,
        0xeae96fb1,
        0x860e5e0a,
        0x5a3e2ab3,
        0x771fe71c,
        0x4e3d06fa,
        0x2965dcb9,
        0x99e71d0f,
        0x803e89d6,
        0x5266c825,
        0x2e4cc978,
        0x9c10b36a,
        0xc6150eba,
        0x94e2ea78,
        0xa5fc3c53,
        0x1e0a2df4,
        0xf2f74ea7,
        0x361d2b3d,
        0x1939260f,
        0x19c27960,
        0x5223a708,
        0xf71312b6,
        0xebadfe6e,
        0xeac31f66,
        0xe3bc4595,
        0xa67bc883,
        0xb17f37d1,
        0x018cff28,
        0xc332ddef,
        0xbe6c5aa5,
        0x65582185,
        0x68ab9802,
        0xeecea50f,
        0xdb2f953b,
        0x2aef7dad,
        0x5b6e2f84,
        0x1521b628,
        0x29076170,
        0xecdd4775,
        0x619f1510,
        0x13cca830,
        0xeb61bd96,
        0x0334fe1e,
        0xaa0363cf,
        0xb5735c90,
        0x4c70a239,
        0xd59e9e0b,
        0xcbaade14,
        0xeecc86bc,
        0x60622ca7,
        0x9cab5cab,
        0xb2f3846e,
        0x648b1eaf,
        0x19bdf0ca,
        0xa02369b9,
        0x655abb50,
        0x40685a32,
        0x3c2ab4b3,
        0x319ee9d5,
        0xc021b8f7,
        0x9b540b19,
        0x875fa099,
        0x95f7997e,
        0x623d7da8,
        0xf837889a,
        0x97e32d77,
        0x11ed935f,
        0x16681281,
        0x0e358829,
        0xc7e61fd6,
        0x96dedfa1,
        0x7858ba99,
        0x57f584a5,
        0x1b227263,
        0x9b83c3ff,
        0x1ac24696,
        0xcdb30aeb,
        0x532e3054,
        0x8fd948e4,
        0x6dbc3128,
        0x58ebf2ef,
        0x34c6ffea,
        0xfe28ed61,
        0xee7c3c73,
        0x5d4a14d9,
        0xe864b7e3,
        0x42105d14,
        0x203e13e0,
        0x45eee2b6,
        0xa3aaabea,
        0xdb6c4f15,
        0xfacb4fd0,
        0xc742f442,
        0xef6abbb5,
        0x654f3b1d,
        0x41cd2105,
        0xd81e799e,
        0x86854dc7,
        0xe44b476a,
        0x3d816250,
        0xcf62a1f2,
        0x5b8d2646,
        0xfc8883a0,
        0xc1c7b6a3,
        0x7f1524c3,
        0x69cb7492,
        0x47848a0b,
        0x5692b285,
        0x095bbf00,
        0xad19489d,
        0x1462b174,
        0x23820e00,
        0x58428d2a,
        0x0c55f5ea,
        0x1dadf43e,
        0x233f7061,
        0x3372f092,
        0x8d937e41,
        0xd65fecf1,
        0x6c223bdb,
        0x7cde3759,
        0xcbee7460,
        0x4085f2a7,
        0xce77326e,
        0xa6078084,
        0x19f8509e,
        0xe8efd855,
        0x61d99735,
        0xa969a7aa,
        0xc50c06c2,
        0x5a04abfc,
        0x800bcadc,
        0x9e447a2e,
        0xc3453484,
        0xfdd56705,
        0x0e1e9ec9,
        0xdb73dbd3,
        0x105588cd,
        0x675fda79,
        0xe3674340,
        0xc5c43465,
        0x713e38d8,
        0x3d28f89e,
        0xf16dff20,
        0x153e21e7,
        0x8fb03d4a,
        0xe6e39f2b,
        0xdb83adf7,
        0xe93d5a68,
        0x948140f7,
        0xf64c261c,
        0x94692934,
        0x411520f7,
        0x7602d4f7,
        0xbcf46b2e,
        0xd4a20068,
        0xd4082471,
        0x3320f46a,
        0x43b7d4b7,
        0x500061af,
        0x1e39f62e,
        0x97244546,
        0x14214f74,
        0xbf8b8840,
        0x4d95fc1d,
        0x96b591af,
        0x70f4ddd3,
        0x66a02f45,
        0xbfbc09ec,
        0x03bd9785,
        0x7fac6dd0,
        0x31cb8504,
        0x96eb27b3,
        0x55fd3941,
        0xda2547e6,
        0xabca0a9a,
        0x28507825,
        0x530429f4,
        0x0a2c86da,
        0xe9b66dfb,
        0x68dc1462,
        0xd7486900,
        0x680ec0a4,
        0x27a18dee,
        0x4f3ffea2,
        0xe887ad8c,
        0xb58ce006,
        0x7af4d6b6,
        0xaace1e7c,
        0xd3375fec,
        0xce78a399,
        0x406b2a42,
        0x20fe9e35,
        0xd9f385b9,
        0xee39d7ab,
        0x3b124e8b,
        0x1dc9faf7,
        0x4b6d1856,
        0x26a36631,
        0xeae397b2,
        0x3a6efa74,
        0xdd5b4332,
        0x6841e7f7,
        0xca7820fb,
        0xfb0af54e,
        0xd8feb397,
        0x454056ac,
        0xba489527,
        0x55533a3a,
        0x20838d87,
        0xfe6ba9b7,
        0xd096954b,
        0x55a867bc,
        0xa1159a58,
        0xcca92963,
        0x99e1db33,
        0xa62a4a56,
        0x3f3125f9,
        0x5ef47e1c,
        0x9029317c,
        0xfdf8e802,
        0x04272f70,
        0x80bb155c,
        0x05282ce3,
        0x95c11548,
        0xe4c66d22,
        0x48c1133f,
        0xc70f86dc,
        0x07f9c9ee,
        0x41041f0f,
        0x404779a4,
        0x5d886e17,
        0x325f51eb,
        0xd59bc0d1,
        0xf2bcc18f,
        0x41113564,
        0x257b7834,
        0x602a9c60,
        0xdff8e8a3,
        0x1f636c1b,
        0x0e12b4c2,
        0x02e1329e,
        0xaf664fd1,
        0xcad18115,
        0x6b2395e0,
        0x333e92e1,
        0x3b240b62,
        0xeebeb922,
        0x85b2a20e,
        0xe6ba0d99,
        0xde720c8c,
        0x2da2f728,
        0xd0127845,
        0x95b794fd,
        0x647d0862,
        0xe7ccf5f0,
        0x5449a36f,
        0x877d48fa,
        0xc39dfd27,
        0xf33e8d1e,
        0x0a476341,
        0x992eff74,
        0x3a6f6eab,
        0xf4f8fd37,
        0xa812dc60,
        0xa1ebddf8,
        0x991be14c,
        0xdb6e6b0d,
        0xc67b5510,
        0x6d672c37,
        0x2765d43b,
        0xdcd0e804,
        0xf1290dc7,
        0xcc00ffa3,
        0xb5390f92,
        0x690fed0b,
        0x667b9ffb,
        0xcedb7d9c,
        0xa091cf0b,
        0xd9155ea3,
        0xbb132f88,
        0x515bad24,
        0x7b9479bf,
        0x763bd6eb,
        0x37392eb3,
        0xcc115979,
        0x8026e297,
        0xf42e312d,
        0x6842ada7,
        0xc66a2b3b,
        0x12754ccc,
        0x782ef11c,
        0x6a124237,
        0xb79251e7,
        0x06a1bbe6,
        0x4bfb6350,
        0x1a6b1018,
        0x11caedfa,
        0x3d25bdd8,
        0xe2e1c3c9,
        0x44421659,
        0x0a121386,
        0xd90cec6e,
        0xd5abea2a,
        0x64af674e,
        0xda86a85f,
        0xbebfe988,
        0x64e4c3fe,
        0x9dbc8057,
        0xf0f7c086,
        0x60787bf8,
        0x6003604d,
        0xd1fd8346,
        0xf6381fb0,
        0x7745ae04,
        0xd736fccc,
        0x83426b33,
        0xf01eab71,
        0xb0804187,
        0x3c005e5f,
        0x77a057be,
        0xbde8ae24,
        0x55464299,
        0xbf582e61,
        0x4e58f48f,
        0xf2ddfda2,
        0xf474ef38,
        0x8789bdc2,
        0x5366f9c3,
        0xc8b38e74,
        0xb475f255,
        0x46fcd9b9,
        0x7aeb2661,
        0x8b1ddf84,
        0x846a0e79,
        0x915f95e2,
        0x466e598e,
        0x20b45770,
        0x8cd55591,
        0xc902de4c,
        0xb90bace1,
        0xbb8205d0,
        0x11a86248,
        0x7574a99e,
        0xb77f19b6,
        0xe0a9dc09,
        0x662d09a1,
        0xc4324633,
        0xe85a1f02,
        0x09f0be8c,
        0x4a99a025,
        0x1d6efe10,
        0x1ab93d1d,
        0x0ba5a4df,
        0xa186f20f,
        0x2868f169,
        0xdcb7da83,
        0x573906fe,
        0xa1e2ce9b,
        0x4fcd7f52,
        0x50115e01,
        0xa70683fa,
        0xa002b5c4,
        0x0de6d027,
        0x9af88c27,
        0x773f8641,
        0xc3604c06,
        0x61a806b5,
        0xf0177a28,
        0xc0f586e0,
        0x006058aa,
        0x30dc7d62,
        0x11e69ed7,
        0x2338ea63,
        0x53c2dd94,
        0xc2c21634,
        0xbbcbee56,
        0x90bcb6de,
        0xebfc7da1,
        0xce591d76,
        0x6f05e409,
        0x4b7c0188,
        0x39720a3d,
        0x7c927c24,
        0x86e3725f,
        0x724d9db9,
        0x1ac15bb4,
        0xd39eb8fc,
        0xed545578,
        0x08fca5b5,
        0xd83d7cd3,
        0x4dad0fc4,
        0x1e50ef5e,
        0xb161e6f8,
        0xa28514d9,
        0x6c51133c,
        0x6fd5c7e7,
        0x56e14ec4,
        0x362abfce,
        0xddc6c837,
        0xd79a3234,
        0x92638212,
        0x670efa8e,
        0x406000e0,
        0x3a39ce37,
        0xd3faf5cf,
        0xabc27737,
        0x5ac52d1b,
        0x5cb0679e,
        0x4fa33742,
        0xd3822740,
        0x99bc9bbe,
        0xd5118e9d,
        0xbf0f7315,
        0xd62d1c7e,
        0xc700c47b,
        0xb78c1b6b,
        0x21a19045,
        0xb26eb1be,
        0x6a366eb4,
        0x5748ab2f,
        0xbc946e79,
        0xc6a376d2,
        0x6549c2c8,
        0x530ff8ee,
        0x468dde7d,
        0xd5730a1d,
        0x4cd04dc6,
        0x2939bbdb,
        0xa9ba4650,
        0xac9526e8,
        0xbe5ee304,
        0xa1fad5f0,
        0x6a2d519a,
        0x63ef8ce2,
        0x9a86ee22,
        0xc089c2b8,
        0x43242ef6,
        0xa51e03aa,
        0x9cf2d0a4,
        0x83c061ba,
        0x9be96a4d,
        0x8fe51550,
        0xba645bd6,
        0x2826a2f9,
        0xa73a3ae1,
        0x4ba99586,
        0xef5562e9,
        0xc72fefd3,
        0xf752f7da,
        0x3f046f69,
        0x77fa0a59,
        0x80e4a915,
        0x87b08601,
        0x9b09e6ad,
        0x3b3ee593,
        0xe990fd5a,
        0x9e34d797,
        0x2cf0b7d9,
        0x022b8b51,
        0x96d5ac3a,
        0x017da67d,
        0xd1cf3ed6,
        0x7c7d2d28,
        0x1f9f25cf,
        0xadf2b89b,
        0x5ad6b472,
        0x5a88f54c,
        0xe029ac71,
        0xe019a5e6,
        0x47b0acfd,
        0xed93fa9b,
        0xe8d3c48d,
        0x283b57cc,
        0xf8d56629,
        0x79132e28,
        0x785f0191,
        0xed756055,
        0xf7960e44,
        0xe3d35e8c,
        0x15056dd4,
        0x88f46dba,
        0x03a16125,
        0x0564f0bd,
        0xc3eb9e15,
        0x3c9057a2,
        0x97271aec,
        0xa93a072a,
        0x1b3f6d9b,
        0x1e6321f5,
        0xf59c66fb,
        0x26dcf319,
        0x7533d928,
        0xb155fdf5,
        0x03563482,
        0x8aba3cbb,
        0x28517711,
        0xc20ad9f8,
        0xabcc5167,
        0xccad925f,
        0x4de81751,
        0x3830dc8e,
        0x379d5862,
        0x9320f991,
        0xea7a90c2,
        0xfb3e7bce,
        0x5121ce64,
        0x774fbe32,
        0xa8b6e37e,
        0xc3293d46,
        0x48de5369,
        0x6413e680,
        0xa2ae0810,
        0xdd6db224,
        0x69852dfd,
        0x09072166,
        0xb39a460a,
        0x6445c0dd,
        0x586cdecf,
        0x1c20c8ae,
        0x5bbef7dd,
        0x1b588d40,
        0xccd2017f,
        0x6bb4e3bb,
        0xdda26a7e,
        0x3a59ff45,
        0x3e350a44,
        0xbcb4cdd5,
        0x72eacea8,
        0xfa6484bb,
        0x8d6612ae,
        0xbf3c6f47,
        0xd29be463,
        0x542f5d9e,
        0xaec2771b,
        0xf64e6370,
        0x740e0d8d,
        0xe75b1357,
        0xf8721671,
        0xaf537d5d,
        0x4040cb08,
        0x4eb4e2cc,
        0x34d2466a,
        0x0115af84,
        0xe1b00428,
        0x95983a1d,
        0x06b89fb4,
        0xce6ea048,
        0x6f3f3b82,
        0x3520ab82,
        0x011a1d4b,
        0x277227f8,
        0x611560b1,
        0xe7933fdc,
        0xbb3a792b,
        0x344525bd,
        0xa08839e1,
        0x51ce794b,
        0x2f32c9b7,
        0xa01fbac9,
        0xe01cc87e,
        0xbcc7d1f6,
        0xcf0111c3,
        0xa1e8aac7,
        0x1a908749,
        0xd44fbd9a,
        0xd0dadecb,
        0xd50ada38,
        0x0339c32a,
        0xc6913667,
        0x8df9317c,
        0xe0b12b4f,
        0xf79e59b7,
        0x43f5bb3a,
        0xf2d519ff,
        0x27d9459c,
        0xbf97222c,
        0x15e6fc2a,
        0x0f91fc71,
        0x9b941525,
        0xfae59361,
        0xceb69ceb,
        0xc2a86459,
        0x12baa8d1,
        0xb6c1075e,
        0xe3056a0c,
        0x10d25065,
        0xcb03a442,
        0xe0ec6e0e,
        0x1698db3b,
        0x4c98a0be,
        0x3278e964,
        0x9f1f9532,
        0xe0d392df,
        0xd3a0342b,
        0x8971f21e,
        0x1b0a7441,
        0x4ba3348c,
        0xc5be7120,
        0xc37632d8,
        0xdf359f8d,
        0x9b992f2e,
        0xe60b6f47,
        0x0fe3f11d,
        0xe54cda54,
        0x1edad891,
        0xce6279cf,
        0xcd3e7e6f,
        0x1618b166,
        0xfd2c1d05,
        0x848fd2c5,
        0xf6fb2299,
        0xf523f357,
        0xa6327623,
        0x93a83531,
        0x56cccd02,
        0xacf08162,
        0x5a75ebb5,
        0x6e163697,
        0x88d273cc,
        0xde966292,
        0x81b949d0,
        0x4c50901b,
        0x71c65614,
        0xe6c6c7bd,
        0x327a140a,
        0x45e1d006,
        0xc3f27b9a,
        0xc9aa53fd,
        0x62a80f00,
        0xbb25bfe2,
        0x35bdd2f6,
        0x71126905,
        0xb2040222,
        0xb6cbcf7c,
        0xcd769c2b,
        0x53113ec0,
        0x1640e3d3,
        0x38abbd60,
        0x2547adf0,
        0xba38209c,
        0xf746ce76,
        0x77afa1c5,
        0x20756060,
        0x85cbfe4e,
        0x8ae88dd8,
        0x7aaaf9b0,
        0x4cf9aa7e,
        0x1948c25c,
        0x02fb8a8c,
        0x01c36ae4,
        0xd6ebe1f9,
        0x90d4f869,
        0xa65cdea0,
        0x3f09252d,
        0xc208e69f,
        0xb74e6132,
        0xce77e25b,
        0x578fdfe3,
        0x3ac372e6
    ];
    /**
     * @type {Array.<number>}
     * @const
     * @inner
     */ var C_ORIG = [
        0x4f727068,
        0x65616e42,
        0x65686f6c,
        0x64657253,
        0x63727944,
        0x6f756274
    ];
    /**
     * @param {Array.<number>} lr
     * @param {number} off
     * @param {Array.<number>} P
     * @param {Array.<number>} S
     * @returns {Array.<number>}
     * @inner
     */ function _encipher(lr, off, P, S) {
        var n, l = lr[off], r = lr[off + 1];
        l ^= P[0];
        /*
        for (var i=0, k=BLOWFISH_NUM_ROUNDS-2; i<=k;)
            // Feistel substitution on left word
            n  = S[l >>> 24],
            n += S[0x100 | ((l >> 16) & 0xff)],
            n ^= S[0x200 | ((l >> 8) & 0xff)],
            n += S[0x300 | (l & 0xff)],
            r ^= n ^ P[++i],
            // Feistel substitution on right word
            n  = S[r >>> 24],
            n += S[0x100 | ((r >> 16) & 0xff)],
            n ^= S[0x200 | ((r >> 8) & 0xff)],
            n += S[0x300 | (r & 0xff)],
            l ^= n ^ P[++i];
        */ //The following is an unrolled version of the above loop.
        //Iteration 0
        n = S[l >>> 24];
        n += S[0x100 | l >> 16 & 0xff];
        n ^= S[0x200 | l >> 8 & 0xff];
        n += S[0x300 | l & 0xff];
        r ^= n ^ P[1];
        n = S[r >>> 24];
        n += S[0x100 | r >> 16 & 0xff];
        n ^= S[0x200 | r >> 8 & 0xff];
        n += S[0x300 | r & 0xff];
        l ^= n ^ P[2];
        //Iteration 1
        n = S[l >>> 24];
        n += S[0x100 | l >> 16 & 0xff];
        n ^= S[0x200 | l >> 8 & 0xff];
        n += S[0x300 | l & 0xff];
        r ^= n ^ P[3];
        n = S[r >>> 24];
        n += S[0x100 | r >> 16 & 0xff];
        n ^= S[0x200 | r >> 8 & 0xff];
        n += S[0x300 | r & 0xff];
        l ^= n ^ P[4];
        //Iteration 2
        n = S[l >>> 24];
        n += S[0x100 | l >> 16 & 0xff];
        n ^= S[0x200 | l >> 8 & 0xff];
        n += S[0x300 | l & 0xff];
        r ^= n ^ P[5];
        n = S[r >>> 24];
        n += S[0x100 | r >> 16 & 0xff];
        n ^= S[0x200 | r >> 8 & 0xff];
        n += S[0x300 | r & 0xff];
        l ^= n ^ P[6];
        //Iteration 3
        n = S[l >>> 24];
        n += S[0x100 | l >> 16 & 0xff];
        n ^= S[0x200 | l >> 8 & 0xff];
        n += S[0x300 | l & 0xff];
        r ^= n ^ P[7];
        n = S[r >>> 24];
        n += S[0x100 | r >> 16 & 0xff];
        n ^= S[0x200 | r >> 8 & 0xff];
        n += S[0x300 | r & 0xff];
        l ^= n ^ P[8];
        //Iteration 4
        n = S[l >>> 24];
        n += S[0x100 | l >> 16 & 0xff];
        n ^= S[0x200 | l >> 8 & 0xff];
        n += S[0x300 | l & 0xff];
        r ^= n ^ P[9];
        n = S[r >>> 24];
        n += S[0x100 | r >> 16 & 0xff];
        n ^= S[0x200 | r >> 8 & 0xff];
        n += S[0x300 | r & 0xff];
        l ^= n ^ P[10];
        //Iteration 5
        n = S[l >>> 24];
        n += S[0x100 | l >> 16 & 0xff];
        n ^= S[0x200 | l >> 8 & 0xff];
        n += S[0x300 | l & 0xff];
        r ^= n ^ P[11];
        n = S[r >>> 24];
        n += S[0x100 | r >> 16 & 0xff];
        n ^= S[0x200 | r >> 8 & 0xff];
        n += S[0x300 | r & 0xff];
        l ^= n ^ P[12];
        //Iteration 6
        n = S[l >>> 24];
        n += S[0x100 | l >> 16 & 0xff];
        n ^= S[0x200 | l >> 8 & 0xff];
        n += S[0x300 | l & 0xff];
        r ^= n ^ P[13];
        n = S[r >>> 24];
        n += S[0x100 | r >> 16 & 0xff];
        n ^= S[0x200 | r >> 8 & 0xff];
        n += S[0x300 | r & 0xff];
        l ^= n ^ P[14];
        //Iteration 7
        n = S[l >>> 24];
        n += S[0x100 | l >> 16 & 0xff];
        n ^= S[0x200 | l >> 8 & 0xff];
        n += S[0x300 | l & 0xff];
        r ^= n ^ P[15];
        n = S[r >>> 24];
        n += S[0x100 | r >> 16 & 0xff];
        n ^= S[0x200 | r >> 8 & 0xff];
        n += S[0x300 | r & 0xff];
        l ^= n ^ P[16];
        lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off + 1] = l;
        return lr;
    }
    /**
     * @param {Array.<number>} data
     * @param {number} offp
     * @returns {{key: number, offp: number}}
     * @inner
     */ function _streamtoword(data, offp) {
        for(var i = 0, word = 0; i < 4; ++i)word = word << 8 | data[offp] & 0xff, offp = (offp + 1) % data.length;
        return {
            key: word,
            offp: offp
        };
    }
    /**
     * @param {Array.<number>} key
     * @param {Array.<number>} P
     * @param {Array.<number>} S
     * @inner
     */ function _key(key, P, S) {
        var offset = 0, lr = [
            0,
            0
        ], plen = P.length, slen = S.length, sw;
        for(var i = 0; i < plen; i++)sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for(i = 0; i < plen; i += 2)lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for(i = 0; i < slen; i += 2)lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
    }
    /**
     * Expensive key schedule Blowfish.
     * @param {Array.<number>} data
     * @param {Array.<number>} key
     * @param {Array.<number>} P
     * @param {Array.<number>} S
     * @inner
     */ function _ekskey(data, key, P, S) {
        var offp = 0, lr = [
            0,
            0
        ], plen = P.length, slen = S.length, sw;
        for(var i = 0; i < plen; i++)sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        offp = 0;
        for(i = 0; i < plen; i += 2)sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for(i = 0; i < slen; i += 2)sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
    }
    /**
     * Internaly crypts a string.
     * @param {Array.<number>} b Bytes to crypt
     * @param {Array.<number>} salt Salt bytes to use
     * @param {number} rounds Number of rounds
     * @param {function(Error, Array.<number>=)=} callback Callback receiving the error, if any, and the resulting bytes. If
     *  omitted, the operation will be performed synchronously.
     *  @param {function(number)=} progressCallback Callback called with the current progress
     * @returns {!Array.<number>|undefined} Resulting bytes if callback has been omitted, otherwise `undefined`
     * @inner
     */ function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        // Validate
        if (rounds < 4 || rounds > 31) {
            err = Error("Illegal number of rounds (4-31): " + rounds);
            if (callback) {
                nextTick(callback.bind(this, err));
                return;
            } else throw err;
        }
        if (salt.length !== BCRYPT_SALT_LEN) {
            err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
            if (callback) {
                nextTick(callback.bind(this, err));
                return;
            } else throw err;
        }
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        //Use typed arrays when available - huge speedup!
        if (Int32Array) {
            P = new Int32Array(P_ORIG);
            S = new Int32Array(S_ORIG);
        } else {
            P = P_ORIG.slice();
            S = S_ORIG.slice();
        }
        _ekskey(salt, b, P, S);
        /**
         * Calcualtes the next round.
         * @returns {Array.<number>|undefined} Resulting array if callback has been omitted, otherwise `undefined`
         * @inner
         */ function next() {
            if (progressCallback) progressCallback(i / rounds);
            if (i < rounds) {
                var start = Date.now();
                for(; i < rounds;){
                    i = i + 1;
                    _key(b, P, S);
                    _key(salt, P, S);
                    if (Date.now() - start > MAX_EXECUTION_TIME) break;
                }
            } else {
                for(i = 0; i < 64; i++)for(j = 0; j < clen >> 1; j++)_encipher(cdata, j << 1, P, S);
                var ret = [];
                for(i = 0; i < clen; i++)ret.push((cdata[i] >> 24 & 0xff) >>> 0), ret.push((cdata[i] >> 16 & 0xff) >>> 0), ret.push((cdata[i] >> 8 & 0xff) >>> 0), ret.push((cdata[i] & 0xff) >>> 0);
                if (callback) {
                    callback(null, ret);
                    return;
                } else return ret;
            }
            if (callback) nextTick(next);
        }
        // Async
        if (typeof callback !== 'undefined') {
            next();
        // Sync
        } else {
            var res;
            while(true)if (typeof (res = next()) !== 'undefined') return res || [];
        }
    }
    /**
     * Internally hashes a string.
     * @param {string} s String to hash
     * @param {?string} salt Salt to use, actually never null
     * @param {function(Error, string=)=} callback Callback receiving the error, if any, and the resulting hash. If omitted,
     *  hashing is perormed synchronously.
     *  @param {function(number)=} progressCallback Callback called with the current progress
     * @returns {string|undefined} Resulting hash if callback has been omitted, otherwise `undefined`
     * @inner
     */ function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s !== 'string' || typeof salt !== 'string') {
            err = Error("Invalid string / salt: Not a string");
            if (callback) {
                nextTick(callback.bind(this, err));
                return;
            } else throw err;
        }
        // Validate the salt
        var minor, offset;
        if (salt.charAt(0) !== '$' || salt.charAt(1) !== '2') {
            err = Error("Invalid salt version: " + salt.substring(0, 2));
            if (callback) {
                nextTick(callback.bind(this, err));
                return;
            } else throw err;
        }
        if (salt.charAt(2) === '$') minor = String.fromCharCode(0), offset = 3;
        else {
            minor = salt.charAt(2);
            if (minor !== 'a' && minor !== 'b' && minor !== 'y' || salt.charAt(3) !== '$') {
                err = Error("Invalid salt revision: " + salt.substring(2, 4));
                if (callback) {
                    nextTick(callback.bind(this, err));
                    return;
                } else throw err;
            }
            offset = 4;
        }
        // Extract number of rounds
        if (salt.charAt(offset + 2) > '$') {
            err = Error("Missing salt rounds");
            if (callback) {
                nextTick(callback.bind(this, err));
                return;
            } else throw err;
        }
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= 'a' ? "\x00" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        /**
         * Finishes hashing.
         * @param {Array.<number>} bytes Byte array
         * @returns {string}
         * @inner
         */ function finish(bytes) {
            var res = [];
            res.push("$2");
            if (minor >= 'a') res.push(minor);
            res.push("$");
            if (rounds < 10) res.push("0");
            res.push(rounds.toString());
            res.push("$");
            res.push(base64_encode(saltb, saltb.length));
            res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
            return res.join('');
        }
        // Sync
        if (typeof callback == 'undefined') return finish(_crypt(passwordb, saltb, rounds));
        else {
            _crypt(passwordb, saltb, rounds, function(err, bytes) {
                if (err) callback(err, null);
                else callback(null, finish(bytes));
            }, progressCallback);
        }
    }
    /**
     * Encodes a byte array to base64 with up to len bytes of input, using the custom bcrypt alphabet.
     * @function
     * @param {!Array.<number>} b Byte array
     * @param {number} len Maximum input length
     * @returns {string}
     * @expose
     */ bcrypt.encodeBase64 = base64_encode;
    /**
     * Decodes a base64 encoded string to up to len bytes of output, using the custom bcrypt alphabet.
     * @function
     * @param {string} s String to decode
     * @param {number} len Maximum output length
     * @returns {!Array.<number>}
     * @expose
     */ bcrypt.decodeBase64 = base64_decode;
    return bcrypt;
});
}),
"[project]/node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs/index.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*
 Copyright (c) 2012 Nevins Bartolomeo <nevins.bartolomeo@gmail.com>
 Copyright (c) 2012 Shane Girish <shaneGirish@gmail.com>
 Copyright (c) 2013 Daniel Wirtz <dcode@dcode.io>

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:
 1. Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 3. The name of the author may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */ module.exports = __turbopack_context__.r("[project]/node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs/dist/bcrypt.js [instrumentation] (ecmascript)");
}),
"[project]/node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

var constants = __turbopack_context__.r("[externals]/constants [external] (constants, cjs)");
var origCwd = process.cwd;
var cwd = null;
var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
    if (!cwd) cwd = origCwd.call(process);
    return cwd;
};
try {
    process.cwd();
} catch (er) {}
// This check is needed until node.js 12 is required
if (typeof process.chdir === 'function') {
    var chdir = process.chdir;
    process.chdir = function(d) {
        cwd = null;
        chdir.call(process, d);
    };
    if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
}
module.exports = patch;
function patch(fs) {
    // (re-)implement some things that are known busted or missing.
    // lchmod, broken prior to 0.6.2
    // back-port the fix here.
    if (constants.hasOwnProperty('O_SYMLINK') && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs);
    }
    // lutimes implementation, or no-op
    if (!fs.lutimes) {
        patchLutimes(fs);
    }
    // https://github.com/isaacs/node-graceful-fs/issues/4
    // Chown should not fail on einval or eperm if non-root.
    // It should not fail on enosys ever, as this just indicates
    // that a fs doesn't support the intended operation.
    fs.chown = chownFix(fs.chown);
    fs.fchown = chownFix(fs.fchown);
    fs.lchown = chownFix(fs.lchown);
    fs.chmod = chmodFix(fs.chmod);
    fs.fchmod = chmodFix(fs.fchmod);
    fs.lchmod = chmodFix(fs.lchmod);
    fs.chownSync = chownFixSync(fs.chownSync);
    fs.fchownSync = chownFixSync(fs.fchownSync);
    fs.lchownSync = chownFixSync(fs.lchownSync);
    fs.chmodSync = chmodFixSync(fs.chmodSync);
    fs.fchmodSync = chmodFixSync(fs.fchmodSync);
    fs.lchmodSync = chmodFixSync(fs.lchmodSync);
    fs.stat = statFix(fs.stat);
    fs.fstat = statFix(fs.fstat);
    fs.lstat = statFix(fs.lstat);
    fs.statSync = statFixSync(fs.statSync);
    fs.fstatSync = statFixSync(fs.fstatSync);
    fs.lstatSync = statFixSync(fs.lstatSync);
    // if lchmod/lchown do not exist, then make them no-ops
    if (fs.chmod && !fs.lchmod) {
        fs.lchmod = function(path, mode, cb) {
            if (cb) process.nextTick(cb);
        };
        fs.lchmodSync = function() {};
    }
    if (fs.chown && !fs.lchown) {
        fs.lchown = function(path, uid, gid, cb) {
            if (cb) process.nextTick(cb);
        };
        fs.lchownSync = function() {};
    }
    // on Windows, A/V software can lock the directory, causing this
    // to fail with an EACCES or EPERM if the directory contains newly
    // created files.  Try again on failure, for up to 60 seconds.
    // Set the timeout this long because some Windows Anti-Virus, such as Parity
    // bit9, may lock files for up to a minute, causing npm package install
    // failures. Also, take care to yield the scheduler. Windows scheduling gives
    // CPU to a busy looping process, which can cause the program causing the lock
    // contention to be starved of CPU by node, so the contention doesn't resolve.
    if (platform === "win32") {
        fs.rename = typeof fs.rename !== 'function' ? fs.rename : function(fs$rename) {
            function rename(from, to, cb) {
                var start = Date.now();
                var backoff = 0;
                fs$rename(from, to, function CB(er) {
                    if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 60000) {
                        setTimeout(function() {
                            fs.stat(to, function(stater, st) {
                                if (stater && stater.code === "ENOENT") fs$rename(from, to, CB);
                                else cb(er);
                            });
                        }, backoff);
                        if (backoff < 100) backoff += 10;
                        return;
                    }
                    if (cb) cb(er);
                });
            }
            if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
            return rename;
        }(fs.rename);
    }
    // if read() returns EAGAIN, then just try it again.
    fs.read = typeof fs.read !== 'function' ? fs.read : function(fs$read) {
        function read(fd, buffer, offset, length, position, callback_) {
            var callback;
            if (callback_ && typeof callback_ === 'function') {
                var eagCounter = 0;
                callback = function(er, _, __) {
                    if (er && er.code === 'EAGAIN' && eagCounter < 10) {
                        eagCounter++;
                        return fs$read.call(fs, fd, buffer, offset, length, position, callback);
                    }
                    callback_.apply(this, arguments);
                };
            }
            return fs$read.call(fs, fd, buffer, offset, length, position, callback);
        }
        // This ensures `util.promisify` works as it does for native `fs.read`.
        if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
        return read;
    }(fs.read);
    fs.readSync = typeof fs.readSync !== 'function' ? fs.readSync : function(fs$readSync) {
        return function(fd, buffer, offset, length, position) {
            var eagCounter = 0;
            while(true){
                try {
                    return fs$readSync.call(fs, fd, buffer, offset, length, position);
                } catch (er) {
                    if (er.code === 'EAGAIN' && eagCounter < 10) {
                        eagCounter++;
                        continue;
                    }
                    throw er;
                }
            }
        };
    }(fs.readSync);
    function patchLchmod(fs) {
        fs.lchmod = function(path, mode, callback) {
            fs.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function(err, fd) {
                if (err) {
                    if (callback) callback(err);
                    return;
                }
                // prefer to return the chmod error, if one occurs,
                // but still try to close, and report closing errors if they occur.
                fs.fchmod(fd, mode, function(err) {
                    fs.close(fd, function(err2) {
                        if (callback) callback(err || err2);
                    });
                });
            });
        };
        fs.lchmodSync = function(path, mode) {
            var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
            // prefer to return the chmod error, if one occurs,
            // but still try to close, and report closing errors if they occur.
            var threw = true;
            var ret;
            try {
                ret = fs.fchmodSync(fd, mode);
                threw = false;
            } finally{
                if (threw) {
                    try {
                        fs.closeSync(fd);
                    } catch (er) {}
                } else {
                    fs.closeSync(fd);
                }
            }
            return ret;
        };
    }
    function patchLutimes(fs) {
        if (constants.hasOwnProperty("O_SYMLINK") && fs.futimes) {
            fs.lutimes = function(path, at, mt, cb) {
                fs.open(path, constants.O_SYMLINK, function(er, fd) {
                    if (er) {
                        if (cb) cb(er);
                        return;
                    }
                    fs.futimes(fd, at, mt, function(er) {
                        fs.close(fd, function(er2) {
                            if (cb) cb(er || er2);
                        });
                    });
                });
            };
            fs.lutimesSync = function(path, at, mt) {
                var fd = fs.openSync(path, constants.O_SYMLINK);
                var ret;
                var threw = true;
                try {
                    ret = fs.futimesSync(fd, at, mt);
                    threw = false;
                } finally{
                    if (threw) {
                        try {
                            fs.closeSync(fd);
                        } catch (er) {}
                    } else {
                        fs.closeSync(fd);
                    }
                }
                return ret;
            };
        } else if (fs.futimes) {
            fs.lutimes = function(_a, _b, _c, cb) {
                if (cb) process.nextTick(cb);
            };
            fs.lutimesSync = function() {};
        }
    }
    function chmodFix(orig) {
        if (!orig) return orig;
        return function(target, mode, cb) {
            return orig.call(fs, target, mode, function(er) {
                if (chownErOk(er)) er = null;
                if (cb) cb.apply(this, arguments);
            });
        };
    }
    function chmodFixSync(orig) {
        if (!orig) return orig;
        return function(target, mode) {
            try {
                return orig.call(fs, target, mode);
            } catch (er) {
                if (!chownErOk(er)) throw er;
            }
        };
    }
    function chownFix(orig) {
        if (!orig) return orig;
        return function(target, uid, gid, cb) {
            return orig.call(fs, target, uid, gid, function(er) {
                if (chownErOk(er)) er = null;
                if (cb) cb.apply(this, arguments);
            });
        };
    }
    function chownFixSync(orig) {
        if (!orig) return orig;
        return function(target, uid, gid) {
            try {
                return orig.call(fs, target, uid, gid);
            } catch (er) {
                if (!chownErOk(er)) throw er;
            }
        };
    }
    function statFix(orig) {
        if (!orig) return orig;
        // Older versions of Node erroneously returned signed integers for
        // uid + gid.
        return function(target, options, cb) {
            if (typeof options === 'function') {
                cb = options;
                options = null;
            }
            function callback(er, stats) {
                if (stats) {
                    if (stats.uid < 0) stats.uid += 0x100000000;
                    if (stats.gid < 0) stats.gid += 0x100000000;
                }
                if (cb) cb.apply(this, arguments);
            }
            return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
        };
    }
    function statFixSync(orig) {
        if (!orig) return orig;
        // Older versions of Node erroneously returned signed integers for
        // uid + gid.
        return function(target, options) {
            var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
            if (stats) {
                if (stats.uid < 0) stats.uid += 0x100000000;
                if (stats.gid < 0) stats.gid += 0x100000000;
            }
            return stats;
        };
    }
    // ENOSYS means that the fs doesn't support the op. Just ignore
    // that, because it doesn't matter.
    //
    // if there's no getuid, or if getuid() is something other
    // than 0, and the error is EINVAL or EPERM, then just ignore
    // it.
    //
    // This specific case is a silent failure in cp, install, tar,
    // and most other unix tools that manage permissions.
    //
    // When running as root, or if other types of errors are
    // encountered, then it's strict.
    function chownErOk(er) {
        if (!er) return true;
        if (er.code === "ENOSYS") return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
            if (er.code === "EINVAL" || er.code === "EPERM") return true;
        }
        return false;
    }
}
}),
"[project]/node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

var Stream = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)").Stream;
module.exports = legacy;
function legacy(fs) {
    return {
        ReadStream: ReadStream,
        WriteStream: WriteStream
    };
    //TURBOPACK unreachable
    ;
    function ReadStream(path, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path, options);
        Stream.call(this);
        var self = this;
        this.path = path;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = 'r';
        this.mode = 438; /*=0666*/ 
        this.bufferSize = 64 * 1024;
        options = options || {};
        // Mixin options into this
        var keys = Object.keys(options);
        for(var index = 0, length = keys.length; index < length; index++){
            var key = keys[index];
            this[key] = options[key];
        }
        if (this.encoding) this.setEncoding(this.encoding);
        if (this.start !== undefined) {
            if ('number' !== typeof this.start) {
                throw TypeError('start must be a Number');
            }
            if (this.end === undefined) {
                this.end = Infinity;
            } else if ('number' !== typeof this.end) {
                throw TypeError('end must be a Number');
            }
            if (this.start > this.end) {
                throw new Error('start must be <= end');
            }
            this.pos = this.start;
        }
        if (this.fd !== null) {
            process.nextTick(function() {
                self._read();
            });
            return;
        }
        fs.open(this.path, this.flags, this.mode, function(err, fd) {
            if (err) {
                self.emit('error', err);
                self.readable = false;
                return;
            }
            self.fd = fd;
            self.emit('open', fd);
            self._read();
        });
    }
    function WriteStream(path, options) {
        if (!(this instanceof WriteStream)) return new WriteStream(path, options);
        Stream.call(this);
        this.path = path;
        this.fd = null;
        this.writable = true;
        this.flags = 'w';
        this.encoding = 'binary';
        this.mode = 438; /*=0666*/ 
        this.bytesWritten = 0;
        options = options || {};
        // Mixin options into this
        var keys = Object.keys(options);
        for(var index = 0, length = keys.length; index < length; index++){
            var key = keys[index];
            this[key] = options[key];
        }
        if (this.start !== undefined) {
            if ('number' !== typeof this.start) {
                throw TypeError('start must be a Number');
            }
            if (this.start < 0) {
                throw new Error('start must be >= zero');
            }
            this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
            this._open = fs.open;
            this._queue.push([
                this._open,
                this.path,
                this.flags,
                this.mode,
                undefined
            ]);
            this.flush();
        }
    }
}
}),
"[project]/node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = clone;
var getPrototypeOf = Object.getPrototypeOf || function(obj) {
    return obj.__proto__;
};
function clone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Object) var copy = {
        __proto__: getPrototypeOf(obj)
    };
    else var copy = Object.create(null);
    Object.getOwnPropertyNames(obj).forEach(function(key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
    });
    return copy;
}
}),
"[project]/node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

var fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
var polyfills = __turbopack_context__.r("[project]/node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js [instrumentation] (ecmascript)");
var legacy = __turbopack_context__.r("[project]/node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js [instrumentation] (ecmascript)");
var clone = __turbopack_context__.r("[project]/node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js [instrumentation] (ecmascript)");
var util = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
/* istanbul ignore next - node 0.x polyfill */ var gracefulQueue;
var previousSymbol;
/* istanbul ignore else - node 0.x polyfill */ if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
    gracefulQueue = Symbol.for('graceful-fs.queue');
    // This is used in testing by future versions
    previousSymbol = Symbol.for('graceful-fs.previous');
} else {
    gracefulQueue = '___graceful-fs.queue';
    previousSymbol = '___graceful-fs.previous';
}
function noop() {}
function publishQueue(context, queue) {
    Object.defineProperty(context, gracefulQueue, {
        get: function() {
            return queue;
        }
    });
}
var debug = noop;
if (util.debuglog) debug = util.debuglog('gfs4');
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) debug = function() {
    var m = util.format.apply(util, arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
};
// Once time initialization
if (!fs[gracefulQueue]) {
    // This queue can be shared by multiple loaded instances
    var queue = /*TURBOPACK member replacement*/ __turbopack_context__.g[gracefulQueue] || [];
    publishQueue(fs, queue);
    // Patch fs.close/closeSync to shared queue version, because we need
    // to retry() whenever a close happens *anywhere* in the program.
    // This is essential when multiple graceful-fs instances are
    // in play at the same time.
    fs.close = function(fs$close) {
        function close(fd, cb) {
            return fs$close.call(fs, fd, function(err) {
                // This function uses the graceful-fs shared queue
                if (!err) {
                    resetQueue();
                }
                if (typeof cb === 'function') cb.apply(this, arguments);
            });
        }
        Object.defineProperty(close, previousSymbol, {
            value: fs$close
        });
        return close;
    }(fs.close);
    fs.closeSync = function(fs$closeSync) {
        function closeSync(fd) {
            // This function uses the graceful-fs shared queue
            fs$closeSync.apply(fs, arguments);
            resetQueue();
        }
        Object.defineProperty(closeSync, previousSymbol, {
            value: fs$closeSync
        });
        return closeSync;
    }(fs.closeSync);
    if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
        process.on('exit', function() {
            debug(fs[gracefulQueue]);
            __turbopack_context__.r("[externals]/assert [external] (assert, cjs)").equal(fs[gracefulQueue].length, 0);
        });
    }
}
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g[gracefulQueue]) {
    publishQueue(/*TURBOPACK member replacement*/ __turbopack_context__.g, fs[gracefulQueue]);
}
module.exports = patch(clone(fs));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
    module.exports = patch(fs);
    fs.__patched = true;
}
function patch(fs) {
    // Everything that references the open() function needs to be in here
    polyfills(fs);
    fs.gracefulify = patch;
    fs.createReadStream = createReadStream;
    fs.createWriteStream = createWriteStream;
    var fs$readFile = fs.readFile;
    fs.readFile = readFile;
    function readFile(path, options, cb) {
        if (typeof options === 'function') cb = options, options = null;
        return go$readFile(path, options, cb);
        //TURBOPACK unreachable
        ;
        function go$readFile(path, options, cb, startTime) {
            return fs$readFile(path, options, function(err) {
                if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([
                    go$readFile,
                    [
                        path,
                        options,
                        cb
                    ],
                    err,
                    startTime || Date.now(),
                    Date.now()
                ]);
                else {
                    if (typeof cb === 'function') cb.apply(this, arguments);
                }
            });
        }
    }
    var fs$writeFile = fs.writeFile;
    fs.writeFile = writeFile;
    function writeFile(path, data, options, cb) {
        if (typeof options === 'function') cb = options, options = null;
        return go$writeFile(path, data, options, cb);
        //TURBOPACK unreachable
        ;
        function go$writeFile(path, data, options, cb, startTime) {
            return fs$writeFile(path, data, options, function(err) {
                if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([
                    go$writeFile,
                    [
                        path,
                        data,
                        options,
                        cb
                    ],
                    err,
                    startTime || Date.now(),
                    Date.now()
                ]);
                else {
                    if (typeof cb === 'function') cb.apply(this, arguments);
                }
            });
        }
    }
    var fs$appendFile = fs.appendFile;
    if (fs$appendFile) fs.appendFile = appendFile;
    function appendFile(path, data, options, cb) {
        if (typeof options === 'function') cb = options, options = null;
        return go$appendFile(path, data, options, cb);
        //TURBOPACK unreachable
        ;
        function go$appendFile(path, data, options, cb, startTime) {
            return fs$appendFile(path, data, options, function(err) {
                if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([
                    go$appendFile,
                    [
                        path,
                        data,
                        options,
                        cb
                    ],
                    err,
                    startTime || Date.now(),
                    Date.now()
                ]);
                else {
                    if (typeof cb === 'function') cb.apply(this, arguments);
                }
            });
        }
    }
    var fs$copyFile = fs.copyFile;
    if (fs$copyFile) fs.copyFile = copyFile;
    function copyFile(src, dest, flags, cb) {
        if (typeof flags === 'function') {
            cb = flags;
            flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        //TURBOPACK unreachable
        ;
        function go$copyFile(src, dest, flags, cb, startTime) {
            return fs$copyFile(src, dest, flags, function(err) {
                if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([
                    go$copyFile,
                    [
                        src,
                        dest,
                        flags,
                        cb
                    ],
                    err,
                    startTime || Date.now(),
                    Date.now()
                ]);
                else {
                    if (typeof cb === 'function') cb.apply(this, arguments);
                }
            });
        }
    }
    var fs$readdir = fs.readdir;
    fs.readdir = readdir;
    var noReaddirOptionVersions = /^v[0-5]\./;
    function readdir(path, options, cb) {
        if (typeof options === 'function') cb = options, options = null;
        var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir(path, options, cb, startTime) {
            return fs$readdir(path, fs$readdirCallback(path, options, cb, startTime));
        } : function go$readdir(path, options, cb, startTime) {
            return fs$readdir(path, options, fs$readdirCallback(path, options, cb, startTime));
        };
        return go$readdir(path, options, cb);
        //TURBOPACK unreachable
        ;
        function fs$readdirCallback(path, options, cb, startTime) {
            return function(err, files) {
                if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([
                    go$readdir,
                    [
                        path,
                        options,
                        cb
                    ],
                    err,
                    startTime || Date.now(),
                    Date.now()
                ]);
                else {
                    if (files && files.sort) files.sort();
                    if (typeof cb === 'function') cb.call(this, err, files);
                }
            };
        }
    }
    if (process.version.substr(0, 4) === 'v0.8') {
        var legStreams = legacy(fs);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
    }
    var fs$ReadStream = fs.ReadStream;
    if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
    }
    var fs$WriteStream = fs.WriteStream;
    if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
    }
    Object.defineProperty(fs, 'ReadStream', {
        get: function() {
            return ReadStream;
        },
        set: function(val) {
            ReadStream = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(fs, 'WriteStream', {
        get: function() {
            return WriteStream;
        },
        set: function(val) {
            WriteStream = val;
        },
        enumerable: true,
        configurable: true
    });
    // legacy names
    var FileReadStream = ReadStream;
    Object.defineProperty(fs, 'FileReadStream', {
        get: function() {
            return FileReadStream;
        },
        set: function(val) {
            FileReadStream = val;
        },
        enumerable: true,
        configurable: true
    });
    var FileWriteStream = WriteStream;
    Object.defineProperty(fs, 'FileWriteStream', {
        get: function() {
            return FileWriteStream;
        },
        set: function(val) {
            FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
    });
    function ReadStream(path, options) {
        if (this instanceof ReadStream) return fs$ReadStream.apply(this, arguments), this;
        else return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
    }
    function ReadStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
            if (err) {
                if (that.autoClose) that.destroy();
                that.emit('error', err);
            } else {
                that.fd = fd;
                that.emit('open', fd);
                that.read();
            }
        });
    }
    function WriteStream(path, options) {
        if (this instanceof WriteStream) return fs$WriteStream.apply(this, arguments), this;
        else return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
    }
    function WriteStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
            if (err) {
                that.destroy();
                that.emit('error', err);
            } else {
                that.fd = fd;
                that.emit('open', fd);
            }
        });
    }
    function createReadStream(path, options) {
        return new fs.ReadStream(path, options);
    }
    function createWriteStream(path, options) {
        return new fs.WriteStream(path, options);
    }
    var fs$open = fs.open;
    fs.open = open;
    function open(path, flags, mode, cb) {
        if (typeof mode === 'function') cb = mode, mode = null;
        return go$open(path, flags, mode, cb);
        //TURBOPACK unreachable
        ;
        function go$open(path, flags, mode, cb, startTime) {
            return fs$open(path, flags, mode, function(err, fd) {
                if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([
                    go$open,
                    [
                        path,
                        flags,
                        mode,
                        cb
                    ],
                    err,
                    startTime || Date.now(),
                    Date.now()
                ]);
                else {
                    if (typeof cb === 'function') cb.apply(this, arguments);
                }
            });
        }
    }
    return fs;
}
function enqueue(elem) {
    debug('ENQUEUE', elem[0].name, elem[1]);
    fs[gracefulQueue].push(elem);
    retry();
}
// keep track of the timeout between retry() calls
var retryTimer;
// reset the startTime and lastTime to now
// this resets the start of the 60 second overall timeout as well as the
// delay between attempts so that we'll retry these jobs sooner
function resetQueue() {
    var now = Date.now();
    for(var i = 0; i < fs[gracefulQueue].length; ++i){
        // entries that are only a length of 2 are from an older version, don't
        // bother modifying those since they'll be retried anyway.
        if (fs[gracefulQueue][i].length > 2) {
            fs[gracefulQueue][i][3] = now; // startTime
            fs[gracefulQueue][i][4] = now; // lastTime
        }
    }
    // call retry to make sure we're actively processing the queue
    retry();
}
function retry() {
    // clear the timer and remove it to help prevent unintended concurrency
    clearTimeout(retryTimer);
    retryTimer = undefined;
    if (fs[gracefulQueue].length === 0) return;
    var elem = fs[gracefulQueue].shift();
    var fn = elem[0];
    var args = elem[1];
    // these items may be unset if they were added by an older graceful-fs
    var err = elem[2];
    var startTime = elem[3];
    var lastTime = elem[4];
    // if we don't have a startTime we have no way of knowing if we've waited
    // long enough, so go ahead and retry this item now
    if (startTime === undefined) {
        debug('RETRY', fn.name, args);
        fn.apply(null, args);
    } else if (Date.now() - startTime >= 60000) {
        // it's been more than 60 seconds total, bail now
        debug('TIMEOUT', fn.name, args);
        var cb = args.pop();
        if (typeof cb === 'function') cb.call(null, err);
    } else {
        // the amount of time between the last attempt and right now
        var sinceAttempt = Date.now() - lastTime;
        // the amount of time between when we first tried, and when we last tried
        // rounded up to at least 1
        var sinceStart = Math.max(lastTime - startTime, 1);
        // backoff. wait longer than the total time we've been retrying, but only
        // up to a maximum of 100ms
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        // it's been long enough since the last retry, do it again
        if (sinceAttempt >= desiredDelay) {
            debug('RETRY', fn.name, args);
            fn.apply(null, args.concat([
                startTime
            ]));
        } else {
            // if we can't do this job yet, push it to the end of the queue
            // and let the next iteration check again
            fs[gracefulQueue].push(elem);
        }
    }
    // schedule our next run if one isn't already scheduled
    if (retryTimer === undefined) {
        retryTimer = setTimeout(retry, 0);
    }
}
}),
"[project]/node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry_operation.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

function RetryOperation(timeouts, options) {
    // Compatibility for the old (timeouts, retryForever) signature
    if (typeof options === 'boolean') {
        options = {
            forever: options
        };
    }
    this._originalTimeouts = JSON.parse(JSON.stringify(timeouts));
    this._timeouts = timeouts;
    this._options = options || {};
    this._maxRetryTime = options && options.maxRetryTime || Infinity;
    this._fn = null;
    this._errors = [];
    this._attempts = 1;
    this._operationTimeout = null;
    this._operationTimeoutCb = null;
    this._timeout = null;
    this._operationStart = null;
    if (this._options.forever) {
        this._cachedTimeouts = this._timeouts.slice(0);
    }
}
module.exports = RetryOperation;
RetryOperation.prototype.reset = function() {
    this._attempts = 1;
    this._timeouts = this._originalTimeouts;
};
RetryOperation.prototype.stop = function() {
    if (this._timeout) {
        clearTimeout(this._timeout);
    }
    this._timeouts = [];
    this._cachedTimeouts = null;
};
RetryOperation.prototype.retry = function(err) {
    if (this._timeout) {
        clearTimeout(this._timeout);
    }
    if (!err) {
        return false;
    }
    var currentTime = new Date().getTime();
    if (err && currentTime - this._operationStart >= this._maxRetryTime) {
        this._errors.unshift(new Error('RetryOperation timeout occurred'));
        return false;
    }
    this._errors.push(err);
    var timeout = this._timeouts.shift();
    if (timeout === undefined) {
        if (this._cachedTimeouts) {
            // retry forever, only keep last error
            this._errors.splice(this._errors.length - 1, this._errors.length);
            this._timeouts = this._cachedTimeouts.slice(0);
            timeout = this._timeouts.shift();
        } else {
            return false;
        }
    }
    var self = this;
    var timer = setTimeout(function() {
        self._attempts++;
        if (self._operationTimeoutCb) {
            self._timeout = setTimeout(function() {
                self._operationTimeoutCb(self._attempts);
            }, self._operationTimeout);
            if (self._options.unref) {
                self._timeout.unref();
            }
        }
        self._fn(self._attempts);
    }, timeout);
    if (this._options.unref) {
        timer.unref();
    }
    return true;
};
RetryOperation.prototype.attempt = function(fn, timeoutOps) {
    this._fn = fn;
    if (timeoutOps) {
        if (timeoutOps.timeout) {
            this._operationTimeout = timeoutOps.timeout;
        }
        if (timeoutOps.cb) {
            this._operationTimeoutCb = timeoutOps.cb;
        }
    }
    var self = this;
    if (this._operationTimeoutCb) {
        this._timeout = setTimeout(function() {
            self._operationTimeoutCb();
        }, self._operationTimeout);
    }
    this._operationStart = new Date().getTime();
    this._fn(this._attempts);
};
RetryOperation.prototype.try = function(fn) {
    console.log('Using RetryOperation.try() is deprecated');
    this.attempt(fn);
};
RetryOperation.prototype.start = function(fn) {
    console.log('Using RetryOperation.start() is deprecated');
    this.attempt(fn);
};
RetryOperation.prototype.start = RetryOperation.prototype.try;
RetryOperation.prototype.errors = function() {
    return this._errors;
};
RetryOperation.prototype.attempts = function() {
    return this._attempts;
};
RetryOperation.prototype.mainError = function() {
    if (this._errors.length === 0) {
        return null;
    }
    var counts = {};
    var mainError = null;
    var mainErrorCount = 0;
    for(var i = 0; i < this._errors.length; i++){
        var error = this._errors[i];
        var message = error.message;
        var count = (counts[message] || 0) + 1;
        counts[message] = count;
        if (count >= mainErrorCount) {
            mainError = error;
            mainErrorCount = count;
        }
    }
    return mainError;
};
}),
"[project]/node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

var RetryOperation = __turbopack_context__.r("[project]/node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry_operation.js [instrumentation] (ecmascript)");
exports.operation = function(options) {
    var timeouts = exports.timeouts(options);
    return new RetryOperation(timeouts, {
        forever: options && options.forever,
        unref: options && options.unref,
        maxRetryTime: options && options.maxRetryTime
    });
};
exports.timeouts = function(options) {
    if (options instanceof Array) {
        return [].concat(options);
    }
    var opts = {
        retries: 10,
        factor: 2,
        minTimeout: 1 * 1000,
        maxTimeout: Infinity,
        randomize: false
    };
    for(var key in options){
        opts[key] = options[key];
    }
    if (opts.minTimeout > opts.maxTimeout) {
        throw new Error('minTimeout is greater than maxTimeout');
    }
    var timeouts = [];
    for(var i = 0; i < opts.retries; i++){
        timeouts.push(this.createTimeout(i, opts));
    }
    if (options && options.forever && !timeouts.length) {
        timeouts.push(this.createTimeout(i, opts));
    }
    // sort the array numerically ascending
    timeouts.sort(function(a, b) {
        return a - b;
    });
    return timeouts;
};
exports.createTimeout = function(attempt, opts) {
    var random = opts.randomize ? Math.random() + 1 : 1;
    var timeout = Math.round(random * opts.minTimeout * Math.pow(opts.factor, attempt));
    timeout = Math.min(timeout, opts.maxTimeout);
    return timeout;
};
exports.wrap = function(obj, options, methods) {
    if (options instanceof Array) {
        methods = options;
        options = null;
    }
    if (!methods) {
        methods = [];
        for(var key in obj){
            if (typeof obj[key] === 'function') {
                methods.push(key);
            }
        }
    }
    for(var i = 0; i < methods.length; i++){
        var method = methods[i];
        var original = obj[method];
        obj[method] = (function retryWrapper(original) {
            var op = exports.operation(options);
            var args = Array.prototype.slice.call(arguments, 1);
            var callback = args.pop();
            args.push(function(err) {
                if (op.retry(err)) {
                    return;
                }
                if (err) {
                    arguments[0] = op.mainError();
                }
                callback.apply(this, arguments);
            });
            op.attempt(function() {
                original.apply(obj, args);
            });
        }).bind(obj, original);
        obj[method].options = options;
    }
};
}),
"[project]/node_modules/.pnpm/retry@0.12.0/node_modules/retry/index.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry.js [instrumentation] (ecmascript)");
}),
"[project]/node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

// This is not the set of all possible signals.
//
// It IS, however, the set of all signals that trigger
// an exit on either Linux or BSD systems.  Linux is a
// superset of the signal names supported on BSD, and
// the unknown signals just fail to register, so we can
// catch that easily enough.
//
// Don't bother with SIGKILL.  It's uncatchable, which
// means that we can't fire any callbacks anyway.
//
// If a user does happen to register a handler on a non-
// fatal signal like SIGWINCH or something, and then
// exit, it'll end up firing `process.emit('exit')`, so
// the handler will be fired anyway.
//
// SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
// artificially, inherently leave the process in a
// state from which it is not safe to try and enter JS
// listeners.
module.exports = [
    'SIGABRT',
    'SIGALRM',
    'SIGHUP',
    'SIGINT',
    'SIGTERM'
];
if ("TURBOPACK compile-time truthy", 1) {
    module.exports.push('SIGVTALRM', 'SIGXCPU', 'SIGXFSZ', 'SIGUSR2', 'SIGTRAP', 'SIGSYS', 'SIGQUIT', 'SIGIOT');
}
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
}),
"[project]/node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {

// Note: since nyc uses this module to output coverage, any lines
// that are in the direct sync flow of nyc's outputCoverage are
// ignored, since we can never get coverage for them.
// grab a reference to node's real process object right away
var process = /*TURBOPACK member replacement*/ __turbopack_context__.g.process;
const processOk = function(process) {
    return process && typeof process === 'object' && typeof process.removeListener === 'function' && typeof process.emit === 'function' && typeof process.reallyExit === 'function' && typeof process.listeners === 'function' && typeof process.kill === 'function' && typeof process.pid === 'number' && typeof process.on === 'function';
};
// some kind of non-node environment, just no-op
/* istanbul ignore if */ if (!processOk(process)) {
    module.exports = function() {
        return function() {};
    };
} else {
    var assert = __turbopack_context__.r("[externals]/assert [external] (assert, cjs)");
    var signals = __turbopack_context__.r("[project]/node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js [instrumentation] (ecmascript)");
    var isWin = /^win/i.test(process.platform);
    var EE = __turbopack_context__.r("[externals]/events [external] (events, cjs)");
    /* istanbul ignore if */ if (typeof EE !== 'function') {
        EE = EE.EventEmitter;
    }
    var emitter;
    if (process.__signal_exit_emitter__) {
        emitter = process.__signal_exit_emitter__;
    } else {
        emitter = process.__signal_exit_emitter__ = new EE();
        emitter.count = 0;
        emitter.emitted = {};
    }
    // Because this emitter is a global, we have to check to see if a
    // previous version of this library failed to enable infinite listeners.
    // I know what you're about to say.  But literally everything about
    // signal-exit is a compromise with evil.  Get used to it.
    if (!emitter.infinite) {
        emitter.setMaxListeners(Infinity);
        emitter.infinite = true;
    }
    module.exports = function(cb, opts) {
        /* istanbul ignore if */ if (!processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
            return function() {};
        }
        assert.equal(typeof cb, 'function', 'a callback must be provided for exit handler');
        if (loaded === false) {
            load();
        }
        var ev = 'exit';
        if (opts && opts.alwaysLast) {
            ev = 'afterexit';
        }
        var remove = function() {
            emitter.removeListener(ev, cb);
            if (emitter.listeners('exit').length === 0 && emitter.listeners('afterexit').length === 0) {
                unload();
            }
        };
        emitter.on(ev, cb);
        return remove;
    };
    var unload = function unload() {
        if (!loaded || !processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
            return;
        }
        loaded = false;
        signals.forEach(function(sig) {
            try {
                process.removeListener(sig, sigListeners[sig]);
            } catch (er) {}
        });
        process.emit = originalProcessEmit;
        process.reallyExit = originalProcessReallyExit;
        emitter.count -= 1;
    };
    module.exports.unload = unload;
    var emit = function emit(event, code, signal) {
        /* istanbul ignore if */ if (emitter.emitted[event]) {
            return;
        }
        emitter.emitted[event] = true;
        emitter.emit(event, code, signal);
    };
    // { <signal>: <listener fn>, ... }
    var sigListeners = {};
    signals.forEach(function(sig) {
        sigListeners[sig] = function listener() {
            /* istanbul ignore if */ if (!processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
                return;
            }
            // If there are no other listeners, an exit is coming!
            // Simplest way: remove us and then re-send the signal.
            // We know that this will kill the process, so we can
            // safely emit now.
            var listeners = process.listeners(sig);
            if (listeners.length === emitter.count) {
                unload();
                emit('exit', null, sig);
                /* istanbul ignore next */ emit('afterexit', null, sig);
                /* istanbul ignore next */ if (isWin && sig === 'SIGHUP') {
                    // "SIGHUP" throws an `ENOSYS` error on Windows,
                    // so use a supported signal instead
                    sig = 'SIGINT';
                }
                /* istanbul ignore next */ process.kill(process.pid, sig);
            }
        };
    });
    module.exports.signals = function() {
        return signals;
    };
    var loaded = false;
    var load = function load() {
        if (loaded || !processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
            return;
        }
        loaded = true;
        // This is the number of onSignalExit's that are in play.
        // It's important so that we can count the correct number of
        // listeners on signals, and don't wait for the other one to
        // handle it instead of us.
        emitter.count += 1;
        signals = signals.filter(function(sig) {
            try {
                process.on(sig, sigListeners[sig]);
                return true;
            } catch (er) {
                return false;
            }
        });
        process.emit = processEmit;
        process.reallyExit = processReallyExit;
    };
    module.exports.load = load;
    var originalProcessReallyExit = process.reallyExit;
    var processReallyExit = function processReallyExit(code) {
        /* istanbul ignore if */ if (!processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
            return;
        }
        process.exitCode = code || /* istanbul ignore next */ 0;
        emit('exit', process.exitCode, null);
        /* istanbul ignore next */ emit('afterexit', process.exitCode, null);
        /* istanbul ignore next */ originalProcessReallyExit.call(process, process.exitCode);
    };
    var originalProcessEmit = process.emit;
    var processEmit = function processEmit(ev, arg) {
        if (ev === 'exit' && processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
            /* istanbul ignore else */ if (arg !== undefined) {
                process.exitCode = arg;
            }
            var ret = originalProcessEmit.apply(this, arguments);
            /* istanbul ignore next */ emit('exit', process.exitCode, null);
            /* istanbul ignore next */ emit('afterexit', process.exitCode, null);
            /* istanbul ignore next */ return ret;
        } else {
            return originalProcessEmit.apply(this, arguments);
        }
    };
}
}),
"[project]/node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/mtime-precision.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const cacheSymbol = Symbol();
function probe(file, fs, callback) {
    const cachedPrecision = fs[cacheSymbol];
    if (cachedPrecision) {
        return fs.stat(file, (err, stat)=>{
            /* istanbul ignore if */ if (err) {
                return callback(err);
            }
            callback(null, stat.mtime, cachedPrecision);
        });
    }
    // Set mtime by ceiling Date.now() to seconds + 5ms so that it's "not on the second"
    const mtime = new Date(Math.ceil(Date.now() / 1000) * 1000 + 5);
    fs.utimes(file, mtime, mtime, (err)=>{
        /* istanbul ignore if */ if (err) {
            return callback(err);
        }
        fs.stat(file, (err, stat)=>{
            /* istanbul ignore if */ if (err) {
                return callback(err);
            }
            const precision = stat.mtime.getTime() % 1000 === 0 ? 's' : 'ms';
            // Cache the precision in a non-enumerable way
            Object.defineProperty(fs, cacheSymbol, {
                value: precision
            });
            callback(null, stat.mtime, precision);
        });
    });
}
function getMtime(precision) {
    let now = Date.now();
    if (precision === 's') {
        now = Math.ceil(now / 1000) * 1000;
    }
    return new Date(now);
}
module.exports.probe = probe;
module.exports.getMtime = getMtime;
}),
"[project]/node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/lockfile.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
const fs = __turbopack_context__.r("[project]/node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js [instrumentation] (ecmascript)");
const retry = __turbopack_context__.r("[project]/node_modules/.pnpm/retry@0.12.0/node_modules/retry/index.js [instrumentation] (ecmascript)");
const onExit = __turbopack_context__.r("[project]/node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js [instrumentation] (ecmascript)");
const mtimePrecision = __turbopack_context__.r("[project]/node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/mtime-precision.js [instrumentation] (ecmascript)");
const locks = {};
function getLockFile(file, options) {
    return options.lockfilePath || `${file}.lock`;
}
function resolveCanonicalPath(file, options, callback) {
    if (!options.realpath) {
        return callback(null, path.resolve(file));
    }
    // Use realpath to resolve symlinks
    // It also resolves relative paths
    options.fs.realpath(file, callback);
}
function acquireLock(file, options, callback) {
    const lockfilePath = getLockFile(file, options);
    // Use mkdir to create the lockfile (atomic operation)
    options.fs.mkdir(lockfilePath, (err)=>{
        if (!err) {
            // At this point, we acquired the lock!
            // Probe the mtime precision
            return mtimePrecision.probe(lockfilePath, options.fs, (err, mtime, mtimePrecision)=>{
                // If it failed, try to remove the lock..
                /* istanbul ignore if */ if (err) {
                    options.fs.rmdir(lockfilePath, ()=>{});
                    return callback(err);
                }
                callback(null, mtime, mtimePrecision);
            });
        }
        // If error is not EEXIST then some other error occurred while locking
        if (err.code !== 'EEXIST') {
            return callback(err);
        }
        // Otherwise, check if lock is stale by analyzing the file mtime
        if (options.stale <= 0) {
            return callback(Object.assign(new Error('Lock file is already being held'), {
                code: 'ELOCKED',
                file
            }));
        }
        options.fs.stat(lockfilePath, (err, stat)=>{
            if (err) {
                // Retry if the lockfile has been removed (meanwhile)
                // Skip stale check to avoid recursiveness
                if (err.code === 'ENOENT') {
                    return acquireLock(file, {
                        ...options,
                        stale: 0
                    }, callback);
                }
                return callback(err);
            }
            if (!isLockStale(stat, options)) {
                return callback(Object.assign(new Error('Lock file is already being held'), {
                    code: 'ELOCKED',
                    file
                }));
            }
            // If it's stale, remove it and try again!
            // Skip stale check to avoid recursiveness
            removeLock(file, options, (err)=>{
                if (err) {
                    return callback(err);
                }
                acquireLock(file, {
                    ...options,
                    stale: 0
                }, callback);
            });
        });
    });
}
function isLockStale(stat, options) {
    return stat.mtime.getTime() < Date.now() - options.stale;
}
function removeLock(file, options, callback) {
    // Remove lockfile, ignoring ENOENT errors
    options.fs.rmdir(getLockFile(file, options), (err)=>{
        if (err && err.code !== 'ENOENT') {
            return callback(err);
        }
        callback();
    });
}
function updateLock(file, options) {
    const lock = locks[file];
    // Just for safety, should never happen
    /* istanbul ignore if */ if (lock.updateTimeout) {
        return;
    }
    lock.updateDelay = lock.updateDelay || options.update;
    lock.updateTimeout = setTimeout(()=>{
        lock.updateTimeout = null;
        // Stat the file to check if mtime is still ours
        // If it is, we can still recover from a system sleep or a busy event loop
        options.fs.stat(lock.lockfilePath, (err, stat)=>{
            const isOverThreshold = lock.lastUpdate + options.stale < Date.now();
            // If it failed to update the lockfile, keep trying unless
            // the lockfile was deleted or we are over the threshold
            if (err) {
                if (err.code === 'ENOENT' || isOverThreshold) {
                    return setLockAsCompromised(file, lock, Object.assign(err, {
                        code: 'ECOMPROMISED'
                    }));
                }
                lock.updateDelay = 1000;
                return updateLock(file, options);
            }
            const isMtimeOurs = lock.mtime.getTime() === stat.mtime.getTime();
            if (!isMtimeOurs) {
                return setLockAsCompromised(file, lock, Object.assign(new Error('Unable to update lock within the stale threshold'), {
                    code: 'ECOMPROMISED'
                }));
            }
            const mtime = mtimePrecision.getMtime(lock.mtimePrecision);
            options.fs.utimes(lock.lockfilePath, mtime, mtime, (err)=>{
                const isOverThreshold = lock.lastUpdate + options.stale < Date.now();
                // Ignore if the lock was released
                if (lock.released) {
                    return;
                }
                // If it failed to update the lockfile, keep trying unless
                // the lockfile was deleted or we are over the threshold
                if (err) {
                    if (err.code === 'ENOENT' || isOverThreshold) {
                        return setLockAsCompromised(file, lock, Object.assign(err, {
                            code: 'ECOMPROMISED'
                        }));
                    }
                    lock.updateDelay = 1000;
                    return updateLock(file, options);
                }
                // All ok, keep updating..
                lock.mtime = mtime;
                lock.lastUpdate = Date.now();
                lock.updateDelay = null;
                updateLock(file, options);
            });
        });
    }, lock.updateDelay);
    // Unref the timer so that the nodejs process can exit freely
    // This is safe because all acquired locks will be automatically released
    // on process exit
    // We first check that `lock.updateTimeout.unref` exists because some users
    // may be using this module outside of NodeJS (e.g., in an electron app),
    // and in those cases `setTimeout` return an integer.
    /* istanbul ignore else */ if (lock.updateTimeout.unref) {
        lock.updateTimeout.unref();
    }
}
function setLockAsCompromised(file, lock, err) {
    // Signal the lock has been released
    lock.released = true;
    // Cancel lock mtime update
    // Just for safety, at this point updateTimeout should be null
    /* istanbul ignore if */ if (lock.updateTimeout) {
        clearTimeout(lock.updateTimeout);
    }
    if (locks[file] === lock) {
        delete locks[file];
    }
    lock.options.onCompromised(err);
}
// ----------------------------------------------------------
function lock(file, options, callback) {
    /* istanbul ignore next */ options = {
        stale: 10000,
        update: null,
        realpath: true,
        retries: 0,
        fs,
        onCompromised: (err)=>{
            throw err;
        },
        ...options
    };
    options.retries = options.retries || 0;
    options.retries = typeof options.retries === 'number' ? {
        retries: options.retries
    } : options.retries;
    options.stale = Math.max(options.stale || 0, 2000);
    options.update = options.update == null ? options.stale / 2 : options.update || 0;
    options.update = Math.max(Math.min(options.update, options.stale / 2), 1000);
    // Resolve to a canonical file path
    resolveCanonicalPath(file, options, (err, file)=>{
        if (err) {
            return callback(err);
        }
        // Attempt to acquire the lock
        const operation = retry.operation(options.retries);
        operation.attempt(()=>{
            acquireLock(file, options, (err, mtime, mtimePrecision)=>{
                if (operation.retry(err)) {
                    return;
                }
                if (err) {
                    return callback(operation.mainError());
                }
                // We now own the lock
                const lock = locks[file] = {
                    lockfilePath: getLockFile(file, options),
                    mtime,
                    mtimePrecision,
                    options,
                    lastUpdate: Date.now()
                };
                // We must keep the lock fresh to avoid staleness
                updateLock(file, options);
                callback(null, (releasedCallback)=>{
                    if (lock.released) {
                        return releasedCallback && releasedCallback(Object.assign(new Error('Lock is already released'), {
                            code: 'ERELEASED'
                        }));
                    }
                    // Not necessary to use realpath twice when unlocking
                    unlock(file, {
                        ...options,
                        realpath: false
                    }, releasedCallback);
                });
            });
        });
    });
}
function unlock(file, options, callback) {
    options = {
        fs,
        realpath: true,
        ...options
    };
    // Resolve to a canonical file path
    resolveCanonicalPath(file, options, (err, file)=>{
        if (err) {
            return callback(err);
        }
        // Skip if the lock is not acquired
        const lock = locks[file];
        if (!lock) {
            return callback(Object.assign(new Error('Lock is not acquired/owned by you'), {
                code: 'ENOTACQUIRED'
            }));
        }
        lock.updateTimeout && clearTimeout(lock.updateTimeout); // Cancel lock mtime update
        lock.released = true; // Signal the lock has been released
        delete locks[file]; // Delete from locks
        removeLock(file, options, callback);
    });
}
function check(file, options, callback) {
    options = {
        stale: 10000,
        realpath: true,
        fs,
        ...options
    };
    options.stale = Math.max(options.stale || 0, 2000);
    // Resolve to a canonical file path
    resolveCanonicalPath(file, options, (err, file)=>{
        if (err) {
            return callback(err);
        }
        // Check if lockfile exists
        options.fs.stat(getLockFile(file, options), (err, stat)=>{
            if (err) {
                // If does not exist, file is not locked. Otherwise, callback with error
                return err.code === 'ENOENT' ? callback(null, false) : callback(err);
            }
            // Otherwise, check if lock is stale by analyzing the file mtime
            return callback(null, !isLockStale(stat, options));
        });
    });
}
function getLocks() {
    return locks;
}
// Remove acquired locks on exit
/* istanbul ignore next */ onExit(()=>{
    for(const file in locks){
        const options = locks[file].options;
        try {
            options.fs.rmdirSync(getLockFile(file, options));
        } catch (e) {}
    }
});
module.exports.lock = lock;
module.exports.unlock = unlock;
module.exports.check = check;
module.exports.getLocks = getLocks;
}),
"[project]/node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/adapter.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const fs = __turbopack_context__.r("[project]/node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js [instrumentation] (ecmascript)");
function createSyncFs(fs) {
    const methods = [
        'mkdir',
        'realpath',
        'stat',
        'rmdir',
        'utimes'
    ];
    const newFs = {
        ...fs
    };
    methods.forEach((method)=>{
        newFs[method] = (...args)=>{
            const callback = args.pop();
            let ret;
            try {
                ret = fs[`${method}Sync`](...args);
            } catch (err) {
                return callback(err);
            }
            callback(null, ret);
        };
    });
    return newFs;
}
// ----------------------------------------------------------
function toPromise(method) {
    return (...args)=>new Promise((resolve, reject)=>{
            args.push((err, result)=>{
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
            method(...args);
        });
}
function toSync(method) {
    return (...args)=>{
        let err;
        let result;
        args.push((_err, _result)=>{
            err = _err;
            result = _result;
        });
        method(...args);
        if (err) {
            throw err;
        }
        return result;
    };
}
function toSyncOptions(options) {
    // Shallow clone options because we are oging to mutate them
    options = {
        ...options
    };
    // Transform fs to use the sync methods instead
    options.fs = createSyncFs(options.fs || fs);
    // Retries are not allowed because it requires the flow to be sync
    if (typeof options.retries === 'number' && options.retries > 0 || options.retries && typeof options.retries.retries === 'number' && options.retries.retries > 0) {
        throw Object.assign(new Error('Cannot use retries with the sync api'), {
            code: 'ESYNC'
        });
    }
    return options;
}
module.exports = {
    toPromise,
    toSync,
    toSyncOptions
};
}),
"[project]/node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/index.js [instrumentation] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const lockfile = __turbopack_context__.r("[project]/node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/lockfile.js [instrumentation] (ecmascript)");
const { toPromise, toSync, toSyncOptions } = __turbopack_context__.r("[project]/node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/adapter.js [instrumentation] (ecmascript)");
async function lock(file, options) {
    const release = await toPromise(lockfile.lock)(file, options);
    return toPromise(release);
}
function lockSync(file, options) {
    const release = toSync(lockfile.lock)(file, toSyncOptions(options));
    return toSync(release);
}
function unlock(file, options) {
    return toPromise(lockfile.unlock)(file, options);
}
function unlockSync(file, options) {
    return toSync(lockfile.unlock)(file, toSyncOptions(options));
}
function check(file, options) {
    return toPromise(lockfile.check)(file, options);
}
function checkSync(file, options) {
    return toSync(lockfile.check)(file, toSyncOptions(options));
}
module.exports = lock;
module.exports.lock = lock;
module.exports.unlock = unlock;
module.exports.lockSync = lockSync;
module.exports.unlockSync = unlockSync;
module.exports.check = check;
module.exports.checkSync = checkSync;
}),
"[project]/node_modules/.pnpm/@netlify+runtime-utils@2.3.0/node_modules/@netlify/runtime-utils/dist/main.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "base64Decode",
    ()=>base64Decode,
    "base64Encode",
    ()=>base64Encode,
    "getEnvironment",
    ()=>getEnvironment
]);
// src/lib/base64.ts
var getString = (input)=>typeof input === "string" ? input : JSON.stringify(input);
var base64Decode = globalThis.Buffer ? (input)=>Buffer.from(input, "base64").toString() : (input)=>atob(input);
var base64Encode = globalThis.Buffer ? (input)=>Buffer.from(getString(input)).toString("base64") : (input)=>btoa(getString(input));
// src/lib/environment.ts
var getEnvironment = ()=>{
    const { Deno, Netlify, process } = globalThis;
    return Netlify?.env ?? Deno?.env ?? {
        delete: (key)=>delete process?.env[key],
        get: (key)=>process?.env[key],
        has: (key)=>Boolean(process?.env[key]),
        set: (key, value)=>{
            if (process?.env) {
                process.env[key] = value;
            }
        },
        toObject: ()=>process?.env ?? {}
    };
};
;
}),
"[project]/node_modules/.pnpm/@netlify+otel@6.0.3/node_modules/@netlify/otel/dist/main.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTracer",
    ()=>getTracer,
    "shutdownTracers",
    ()=>shutdownTracers,
    "withActiveSpan",
    ()=>withActiveSpan
]);
// src/constants.ts
var GET_TRACER = "__netlify__getTracer";
var SHUTDOWN_TRACERS = "__netlify__shutdownTracers";
// src/main.ts
var getTracer = (name, version)=>{
    return globalThis[GET_TRACER]?.(name, version);
};
var shutdownTracers = async ()=>{
    return globalThis[SHUTDOWN_TRACERS]?.();
};
function withActiveSpan(tracer, name, optionsOrFn, contextOrFn, fn) {
    const func = typeof contextOrFn === "function" ? contextOrFn : typeof optionsOrFn === "function" ? optionsOrFn : fn;
    if (!func) {
        throw new Error("function to execute with active span is missing");
    }
    if (!tracer) {
        return func();
    }
    return tracer.withActiveSpan(name, optionsOrFn, contextOrFn, func);
}
;
}),
"[project]/node_modules/.pnpm/@netlify+blobs@10.7.9/node_modules/@netlify/blobs/dist/chunk-YAGWSQMB.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BlobsInternalError",
    ()=>BlobsInternalError,
    "Client",
    ()=>Client,
    "METADATA_HEADER_INTERNAL",
    ()=>METADATA_HEADER_INTERNAL,
    "MissingBlobsEnvironmentError",
    ()=>MissingBlobsEnvironmentError,
    "REGION_AUTO",
    ()=>REGION_AUTO,
    "SIGNED_URL_ACCEPT_HEADER",
    ()=>SIGNED_URL_ACCEPT_HEADER,
    "collectIterator",
    ()=>collectIterator,
    "decodeMetadata",
    ()=>decodeMetadata,
    "decodeName",
    ()=>decodeName,
    "encodeMetadata",
    ()=>encodeMetadata,
    "encodeName",
    ()=>encodeName,
    "getClientOptions",
    ()=>getClientOptions,
    "getEnvironmentContext",
    ()=>getEnvironmentContext,
    "getMetadataFromResponse",
    ()=>getMetadataFromResponse,
    "isNodeError",
    ()=>isNodeError,
    "setEnvironmentContext",
    ()=>setEnvironmentContext,
    "withSpan",
    ()=>withSpan
]);
// src/environment.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@netlify+runtime-utils@2.3.0/node_modules/@netlify/runtime-utils/dist/main.js [instrumentation] (ecmascript)");
// src/util.ts
var __TURBOPACK__imported__module__$5b$externals$5d2f$process__$5b$external$5d$__$28$process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/process [external] (process, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$otel$40$6$2e$0$2e$3$2f$node_modules$2f40$netlify$2f$otel$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@netlify+otel@6.0.3/node_modules/@netlify/otel/dist/main.js [instrumentation] (ecmascript)");
;
var getEnvironmentContext = ()=>{
    const context = globalThis.netlifyBlobsContext || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getEnvironment"])().get("NETLIFY_BLOBS_CONTEXT");
    if (typeof context !== "string" || !context) {
        return {};
    }
    const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["base64Decode"])(context);
    try {
        return JSON.parse(data);
    } catch  {}
    return {};
};
var setEnvironmentContext = (context)=>{
    const encodedContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["base64Encode"])(JSON.stringify(context));
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getEnvironment"])().set("NETLIFY_BLOBS_CONTEXT", encodedContext);
};
var MissingBlobsEnvironmentError = class extends Error {
    constructor(requiredProperties){
        super(`The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: ${requiredProperties.join(", ")}`);
        this.name = "MissingBlobsEnvironmentError";
    }
};
;
var BASE64_PREFIX = "b64;";
var METADATA_HEADER_INTERNAL = "x-amz-meta-user";
var METADATA_HEADER_EXTERNAL = "netlify-blobs-metadata";
var METADATA_MAX_SIZE = 2 * 1024;
var encodeMetadata = (metadata)=>{
    if (!metadata) {
        return null;
    }
    const encodedObject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["base64Encode"])(JSON.stringify(metadata));
    const payload = `b64;${encodedObject}`;
    if (METADATA_HEADER_EXTERNAL.length + payload.length > METADATA_MAX_SIZE) {
        throw new Error("Metadata object exceeds the maximum size");
    }
    return payload;
};
var decodeMetadata = (header)=>{
    if (!header?.startsWith(BASE64_PREFIX)) {
        return {};
    }
    const encodedData = header.slice(BASE64_PREFIX.length);
    const decodedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["base64Decode"])(encodedData);
    const metadata = JSON.parse(decodedData);
    return metadata;
};
var getMetadataFromResponse = (response)=>{
    if (!response.headers) {
        return {};
    }
    const value = response.headers.get(METADATA_HEADER_EXTERNAL) || response.headers.get(METADATA_HEADER_INTERNAL);
    try {
        return decodeMetadata(value);
    } catch  {
        throw new Error("An internal error occurred while trying to retrieve the metadata for an entry. Please try updating to the latest version of the Netlify Blobs client.");
    }
};
;
;
// src/headers.ts
var NF_ERROR = "x-nf-error";
var NF_REQUEST_ID = "x-nf-request-id";
// src/util.ts
var BlobsInternalError = class extends Error {
    constructor(res){
        let details = res.headers.get(NF_ERROR) || `${res.status} status code`;
        if (res.headers.has(NF_REQUEST_ID)) {
            details += `, ID: ${res.headers.get(NF_REQUEST_ID)}`;
        }
        super(`Netlify Blobs has generated an internal error (${details})`);
        this.name = "BlobsInternalError";
    }
};
var collectIterator = async (iterator)=>{
    const result = [];
    for await (const item of iterator){
        result.push(item);
    }
    return result;
};
var isNodeError = (error)=>error instanceof Error;
function percentEncode(str) {
    return str.replace(/./, (char)=>{
        return "%" + char.charCodeAt(0).toString(16).padStart(2, "0");
    });
}
var invalidWin32File = /^(CON|COM[1-9]|LPT[1-9]|NUL|PRN|AUX)$/i;
function encodeWin32SafeName(string) {
    if (invalidWin32File.exec(string)) {
        return percentEncode(string);
    }
    return encodeURIComponent(string).replace(/([*]|[. ]$)/g, percentEncode);
}
function decodeWin32SafeName(string) {
    return decodeURIComponent(string);
}
function encodeName(string) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$process__$5b$external$5d$__$28$process$2c$__cjs$29$__["default"].platform == "win32" ? encodeWin32SafeName(string) : string;
}
function decodeName(string) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$process__$5b$external$5d$__$28$process$2c$__cjs$29$__["default"].platform == "win32" ? decodeWin32SafeName(string) : string;
}
function withSpan(span, name, fn) {
    if (span) return fn(span);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$otel$40$6$2e$0$2e$3$2f$node_modules$2f40$netlify$2f$otel$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["withActiveSpan"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$otel$40$6$2e$0$2e$3$2f$node_modules$2f40$netlify$2f$otel$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getTracer"])(), name, (span2)=>{
        return fn(span2);
    });
}
// src/consistency.ts
var BlobsConsistencyError = class extends Error {
    constructor(){
        super(`Netlify Blobs has failed to perform a read using strong consistency because the environment has not been configured with a 'uncachedEdgeURL' property`);
        this.name = "BlobsConsistencyError";
    }
};
// src/region.ts
var REGION_AUTO = "auto";
var regions = {
    "us-east-1": true,
    "us-east-2": true,
    "eu-central-1": true,
    "ap-southeast-1": true,
    "ap-southeast-2": true
};
var isValidRegion = (input)=>Object.keys(regions).includes(input);
var InvalidBlobsRegionError = class extends Error {
    constructor(region){
        super(`${region} is not a supported Netlify Blobs region. Supported values are: ${Object.keys(regions).join(", ")}.`);
        this.name = "InvalidBlobsRegionError";
    }
};
;
var DEFAULT_RETRY_DELAY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getEnvironment"])().get("NODE_ENV") === "test" ? 1 : 5e3;
var MIN_RETRY_DELAY = 1e3;
var MAX_RETRY = 5;
var RATE_LIMIT_HEADER = "X-RateLimit-Reset";
var fetchAndRetry = async (fetch, url, options, attemptsLeft = MAX_RETRY)=>{
    try {
        const res = await fetch(url, options);
        if (attemptsLeft > 0 && (res.status === 429 || res.status >= 500)) {
            const delay = getDelay(res.headers.get(RATE_LIMIT_HEADER));
            await sleep(delay);
            return fetchAndRetry(fetch, url, options, attemptsLeft - 1);
        }
        return res;
    } catch (error) {
        if (attemptsLeft === 0) {
            throw error;
        }
        const delay = getDelay();
        await sleep(delay);
        return fetchAndRetry(fetch, url, options, attemptsLeft - 1);
    }
};
var getDelay = (rateLimitReset)=>{
    if (!rateLimitReset) {
        return DEFAULT_RETRY_DELAY;
    }
    return Math.max(Number(rateLimitReset) * 1e3 - Date.now(), MIN_RETRY_DELAY);
};
var sleep = (ms)=>new Promise((resolve)=>{
        setTimeout(resolve, ms);
    });
// src/client.ts
var SIGNED_URL_ACCEPT_HEADER = "application/json;type=signed-url";
var Client = class {
    constructor({ apiURL, consistency, edgeURL, fetch, region, siteID, token, uncachedEdgeURL }){
        this.apiURL = apiURL;
        this.consistency = consistency ?? "eventual";
        this.edgeURL = edgeURL;
        this.fetch = fetch ?? globalThis.fetch;
        this.region = region;
        this.siteID = siteID;
        this.token = token;
        this.uncachedEdgeURL = uncachedEdgeURL;
        if (!this.fetch) {
            throw new Error("Netlify Blobs could not find a `fetch` client in the global scope. You can either update your runtime to a version that includes `fetch` (like Node.js 18.0.0 or above), or you can supply your own implementation using the `fetch` property.");
        }
    }
    async getFinalRequest({ consistency: opConsistency, key, metadata, method, parameters = {}, storeName }) {
        const encodedMetadata = encodeMetadata(metadata);
        const consistency = opConsistency ?? this.consistency;
        let urlPath = `/${this.siteID}`;
        if (storeName) {
            urlPath += `/${storeName}`;
        }
        if (key) {
            urlPath += `/${key}`;
        }
        if (this.edgeURL) {
            if (consistency === "strong" && !this.uncachedEdgeURL) {
                throw new BlobsConsistencyError();
            }
            const headers = {
                authorization: `Bearer ${this.token}`
            };
            if (encodedMetadata) {
                headers[METADATA_HEADER_INTERNAL] = encodedMetadata;
            }
            if (this.region) {
                urlPath = `/region:${this.region}${urlPath}`;
            }
            const url2 = new URL(urlPath, consistency === "strong" ? this.uncachedEdgeURL : this.edgeURL);
            for(const key2 in parameters){
                url2.searchParams.set(key2, parameters[key2]);
            }
            return {
                headers,
                url: url2.toString()
            };
        }
        const apiHeaders = {
            authorization: `Bearer ${this.token}`
        };
        const url = new URL(`/api/v1/blobs${urlPath}`, this.apiURL ?? "https://api.netlify.com");
        for(const key2 in parameters){
            url.searchParams.set(key2, parameters[key2]);
        }
        if (this.region) {
            url.searchParams.set("region", this.region);
        }
        if (storeName === void 0 || key === void 0) {
            return {
                headers: apiHeaders,
                url: url.toString()
            };
        }
        if (encodedMetadata) {
            apiHeaders[METADATA_HEADER_EXTERNAL] = encodedMetadata;
        }
        if (method === "head" /* HEAD */  || method === "delete" /* DELETE */ ) {
            return {
                headers: apiHeaders,
                url: url.toString()
            };
        }
        const res = await this.fetch(url.toString(), {
            headers: {
                ...apiHeaders,
                accept: SIGNED_URL_ACCEPT_HEADER
            },
            method
        });
        if (res.status !== 200) {
            throw new BlobsInternalError(res);
        }
        const { url: signedURL } = await res.json();
        const userHeaders = encodedMetadata ? {
            [METADATA_HEADER_INTERNAL]: encodedMetadata
        } : void 0;
        return {
            headers: userHeaders,
            url: signedURL
        };
    }
    async makeRequest({ body, conditions = {}, consistency, headers: extraHeaders, key, metadata, method, parameters, storeName }) {
        const { headers: baseHeaders = {}, url } = await this.getFinalRequest({
            consistency,
            key,
            metadata,
            method,
            parameters,
            storeName
        });
        const headers = {
            ...baseHeaders,
            ...extraHeaders
        };
        if (method === "put" /* PUT */ ) {
            headers["cache-control"] = "max-age=0, stale-while-revalidate=60";
        }
        if ("onlyIfMatch" in conditions && conditions.onlyIfMatch) {
            headers["if-match"] = conditions.onlyIfMatch;
        } else if ("onlyIfNew" in conditions && conditions.onlyIfNew) {
            headers["if-none-match"] = "*";
        }
        const options = {
            body,
            headers,
            method
        };
        if (body instanceof ReadableStream) {
            options.duplex = "half";
        }
        return fetchAndRetry(this.fetch, url, options);
    }
};
var getClientOptions = (options, contextOverride)=>{
    const context = contextOverride ?? getEnvironmentContext();
    const siteID = context.siteID ?? options.siteID;
    const token = context.token ?? options.token;
    if (!siteID || !token) {
        throw new MissingBlobsEnvironmentError([
            "siteID",
            "token"
        ]);
    }
    if (options.region !== void 0 && !isValidRegion(options.region)) {
        throw new InvalidBlobsRegionError(options.region);
    }
    const clientOptions = {
        apiURL: context.apiURL ?? options.apiURL,
        consistency: options.consistency,
        edgeURL: context.edgeURL ?? options.edgeURL,
        fetch: options.fetch,
        region: options.region,
        siteID,
        token,
        uncachedEdgeURL: context.uncachedEdgeURL ?? options.uncachedEdgeURL
    };
    return clientOptions;
};
;
}),
"[project]/node_modules/.pnpm/@netlify+blobs@10.7.9/node_modules/@netlify/blobs/dist/main.js [instrumentation] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "connectLambda",
    ()=>connectLambda,
    "getDeployStore",
    ()=>getDeployStore,
    "getStore",
    ()=>getStore,
    "listStores",
    ()=>listStores
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@netlify+blobs@10.7.9/node_modules/@netlify/blobs/dist/chunk-YAGWSQMB.js [instrumentation] (ecmascript)");
// src/lambda_compat.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@netlify+runtime-utils@2.3.0/node_modules/@netlify/runtime-utils/dist/main.js [instrumentation] (ecmascript)");
;
;
var connectLambda = (event)=>{
    const rawData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$runtime$2d$utils$40$2$2e$3$2e$0$2f$node_modules$2f40$netlify$2f$runtime$2d$utils$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["base64Decode"])(event.blobs);
    const data = JSON.parse(rawData);
    const environmentContext = {
        deployID: event.headers["x-nf-deploy-id"],
        edgeURL: data.url,
        siteID: event.headers["x-nf-site-id"],
        token: data.token
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["setEnvironmentContext"])(environmentContext);
};
// src/store.ts
var DEPLOY_STORE_PREFIX = "deploy:";
var LEGACY_STORE_INTERNAL_PREFIX = "netlify-internal/legacy-namespace/";
var SITE_STORE_PREFIX = "site:";
var STATUS_OK = 200;
var STATUS_PRE_CONDITION_FAILED = 412;
var Store = class _Store {
    constructor(options){
        this.client = options.client;
        if ("deployID" in options) {
            _Store.validateDeployID(options.deployID);
            let name = DEPLOY_STORE_PREFIX + options.deployID;
            if (options.name) {
                name += `:${options.name}`;
            }
            this.name = name;
        } else if (options.name.startsWith(LEGACY_STORE_INTERNAL_PREFIX)) {
            const storeName = options.name.slice(LEGACY_STORE_INTERNAL_PREFIX.length);
            _Store.validateStoreName(storeName);
            this.name = storeName;
        } else {
            _Store.validateStoreName(options.name);
            this.name = SITE_STORE_PREFIX + options.name;
        }
    }
    async delete(key) {
        const res = await this.client.makeRequest({
            key,
            method: "delete" /* DELETE */ ,
            storeName: this.name
        });
        if (![
            200,
            204,
            404
        ].includes(res.status)) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
        }
    }
    async deleteAll() {
        let totalDeletedBlobs = 0;
        let hasMore = true;
        while(hasMore){
            const res = await this.client.makeRequest({
                method: "delete" /* DELETE */ ,
                storeName: this.name
            });
            if (res.status !== 200) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
            }
            const data = await res.json();
            if (typeof data.blobs_deleted !== "number") {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
            }
            totalDeletedBlobs += data.blobs_deleted;
            hasMore = typeof data.has_more === "boolean" && data.has_more;
        }
        return {
            deletedBlobs: totalDeletedBlobs
        };
    }
    async get(key, options) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["withSpan"])(options?.span, "blobs.get", async (span)=>{
            const { consistency, type } = options ?? {};
            span?.setAttributes({
                "blobs.store": this.name,
                "blobs.key": key,
                "blobs.type": type,
                "blobs.method": "GET",
                "blobs.consistency": consistency
            });
            const res = await this.client.makeRequest({
                consistency,
                key,
                method: "get" /* GET */ ,
                storeName: this.name
            });
            span?.setAttributes({
                "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
                "blobs.response.status": res.status
            });
            if (res.status === 404) {
                return null;
            }
            if (res.status !== 200) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
            }
            if (type === void 0 || type === "text") {
                return res.text();
            }
            if (type === "arrayBuffer") {
                return res.arrayBuffer();
            }
            if (type === "blob") {
                return res.blob();
            }
            if (type === "json") {
                return res.json();
            }
            if (type === "stream") {
                return res.body;
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
        });
    }
    async getMetadata(key, options = {}) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["withSpan"])(options?.span, "blobs.getMetadata", async (span)=>{
            span?.setAttributes({
                "blobs.store": this.name,
                "blobs.key": key,
                "blobs.method": "HEAD",
                "blobs.consistency": options.consistency
            });
            const res = await this.client.makeRequest({
                consistency: options.consistency,
                key,
                method: "head" /* HEAD */ ,
                storeName: this.name
            });
            span?.setAttributes({
                "blobs.response.status": res.status
            });
            if (res.status === 404) {
                return null;
            }
            if (res.status !== 200 && res.status !== 304) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
            }
            const etag = res?.headers.get("etag") ?? void 0;
            const metadata = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getMetadataFromResponse"])(res);
            const result = {
                etag,
                metadata
            };
            return result;
        });
    }
    async getWithMetadata(key, options) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["withSpan"])(options?.span, "blobs.getWithMetadata", async (span)=>{
            const { consistency, etag: requestETag, type } = options ?? {};
            const headers = requestETag ? {
                "if-none-match": requestETag
            } : void 0;
            span?.setAttributes({
                "blobs.store": this.name,
                "blobs.key": key,
                "blobs.method": "GET",
                "blobs.consistency": options?.consistency,
                "blobs.type": type,
                "blobs.request.etag": requestETag
            });
            const res = await this.client.makeRequest({
                consistency,
                headers,
                key,
                method: "get" /* GET */ ,
                storeName: this.name
            });
            const responseETag = res?.headers.get("etag") ?? void 0;
            span?.setAttributes({
                "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
                "blobs.response.etag": responseETag,
                "blobs.response.status": res.status
            });
            if (res.status === 404) {
                return null;
            }
            if (res.status !== 200 && res.status !== 304) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
            }
            const metadata = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getMetadataFromResponse"])(res);
            const result = {
                etag: responseETag,
                metadata
            };
            if (res.status === 304 && requestETag) {
                return {
                    data: null,
                    ...result
                };
            }
            if (type === void 0 || type === "text") {
                return {
                    data: await res.text(),
                    ...result
                };
            }
            if (type === "arrayBuffer") {
                return {
                    data: await res.arrayBuffer(),
                    ...result
                };
            }
            if (type === "blob") {
                return {
                    data: await res.blob(),
                    ...result
                };
            }
            if (type === "json") {
                return {
                    data: await res.json(),
                    ...result
                };
            }
            if (type === "stream") {
                return {
                    data: res.body,
                    ...result
                };
            }
            throw new Error(`Invalid 'type' property: ${type}. Expected: arrayBuffer, blob, json, stream, or text.`);
        });
    }
    list(options = {}) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["withSpan"])(options.span, "blobs.list", (span)=>{
            span?.setAttributes({
                "blobs.store": this.name,
                "blobs.method": "GET",
                "blobs.list.paginate": options.paginate ?? false
            });
            const iterator = this.getListIterator(options);
            if (options.paginate) {
                return iterator;
            }
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["collectIterator"])(iterator).then((items)=>items.reduce((acc, item)=>({
                        blobs: [
                            ...acc.blobs,
                            ...item.blobs
                        ],
                        directories: [
                            ...acc.directories,
                            ...item.directories
                        ]
                    }), {
                    blobs: [],
                    directories: []
                }));
        });
    }
    async set(key, data, options = {}) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["withSpan"])(options.span, "blobs.set", async (span)=>{
            span?.setAttributes({
                "blobs.store": this.name,
                "blobs.key": key,
                "blobs.method": "PUT",
                "blobs.data.size": typeof data == "string" ? data.length : data instanceof Blob ? data.size : data.byteLength,
                "blobs.data.type": typeof data == "string" ? "string" : data instanceof Blob ? "blob" : "arrayBuffer",
                "blobs.atomic": Boolean(options.onlyIfMatch ?? options.onlyIfNew)
            });
            _Store.validateKey(key);
            const conditions = _Store.getConditions(options);
            const res = await this.client.makeRequest({
                conditions,
                body: data,
                key,
                metadata: options.metadata,
                method: "put" /* PUT */ ,
                storeName: this.name
            });
            const etag = res.headers.get("etag") ?? "";
            span?.setAttributes({
                "blobs.response.etag": etag,
                "blobs.response.status": res.status
            });
            if (conditions) {
                return res.status === STATUS_PRE_CONDITION_FAILED ? {
                    modified: false
                } : {
                    etag,
                    modified: true
                };
            }
            if (res.status === STATUS_OK) {
                return {
                    etag,
                    modified: true
                };
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
        });
    }
    async setJSON(key, data, options = {}) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["withSpan"])(options.span, "blobs.setJSON", async (span)=>{
            span?.setAttributes({
                "blobs.store": this.name,
                "blobs.key": key,
                "blobs.method": "PUT",
                "blobs.data.type": "json"
            });
            _Store.validateKey(key);
            const conditions = _Store.getConditions(options);
            const payload = JSON.stringify(data);
            const headers = {
                "content-type": "application/json"
            };
            const res = await this.client.makeRequest({
                ...conditions,
                body: payload,
                headers,
                key,
                metadata: options.metadata,
                method: "put" /* PUT */ ,
                storeName: this.name
            });
            const etag = res.headers.get("etag") ?? "";
            span?.setAttributes({
                "blobs.response.etag": etag,
                "blobs.response.status": res.status
            });
            if (conditions) {
                return res.status === STATUS_PRE_CONDITION_FAILED ? {
                    modified: false
                } : {
                    etag,
                    modified: true
                };
            }
            if (res.status === STATUS_OK) {
                return {
                    etag,
                    modified: true
                };
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
        });
    }
    static formatListResultBlob(result) {
        if (!result.key) {
            return null;
        }
        return {
            etag: result.etag,
            key: result.key
        };
    }
    static getConditions(options) {
        if ("onlyIfMatch" in options && "onlyIfNew" in options) {
            throw new Error(`The 'onlyIfMatch' and 'onlyIfNew' options are mutually exclusive. Using 'onlyIfMatch' will make the write succeed only if there is an entry for the key with the given content, while 'onlyIfNew' will make the write succeed only if there is no entry for the key.`);
        }
        if ("onlyIfMatch" in options && options.onlyIfMatch) {
            if (typeof options.onlyIfMatch !== "string") {
                throw new Error(`The 'onlyIfMatch' property expects a string representing an ETag.`);
            }
            return {
                onlyIfMatch: options.onlyIfMatch
            };
        }
        if ("onlyIfNew" in options && options.onlyIfNew) {
            if (typeof options.onlyIfNew !== "boolean") {
                throw new Error(`The 'onlyIfNew' property expects a boolean indicating whether the write should fail if an entry for the key already exists.`);
            }
            return {
                onlyIfNew: true
            };
        }
    }
    static validateKey(key) {
        if (key === "") {
            throw new Error("Blob key must not be empty.");
        }
        if (key.startsWith("/") || key.startsWith("%2F")) {
            throw new Error("Blob key must not start with forward slash (/).");
        }
        if (new TextEncoder().encode(key).length > 600) {
            throw new Error("Blob key must be a sequence of Unicode characters whose UTF-8 encoding is at most 600 bytes long.");
        }
    }
    static validateDeployID(deployID) {
        if (!/^\w{1,24}$/.test(deployID)) {
            throw new Error(`'${deployID}' is not a valid Netlify deploy ID.`);
        }
    }
    static validateStoreName(name) {
        if (name.includes("/") || name.includes("%2F")) {
            throw new Error("Store name must not contain forward slashes (/).");
        }
        if (new TextEncoder().encode(name).length > 64) {
            throw new Error("Store name must be a sequence of Unicode characters whose UTF-8 encoding is at most 64 bytes long.");
        }
    }
    getListIterator(options) {
        const { client, name: storeName } = this;
        const parameters = {};
        if (options?.prefix) {
            parameters.prefix = options.prefix;
        }
        if (options?.directories) {
            parameters.directories = "true";
        }
        return {
            [Symbol.asyncIterator] () {
                let currentCursor = null;
                let done = false;
                return {
                    async next () {
                        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["withSpan"])(options?.span, "blobs.list.next", async (span)=>{
                            span?.setAttributes({
                                "blobs.store": storeName,
                                "blobs.method": "GET",
                                "blobs.list.paginate": options?.paginate ?? false,
                                "blobs.list.done": done,
                                "blobs.list.cursor": currentCursor ?? void 0
                            });
                            if (done) {
                                return {
                                    done: true,
                                    value: void 0
                                };
                            }
                            const nextParameters = {
                                ...parameters
                            };
                            if (currentCursor !== null) {
                                nextParameters.cursor = currentCursor;
                            }
                            const res = await client.makeRequest({
                                method: "get" /* GET */ ,
                                parameters: nextParameters,
                                storeName
                            });
                            span?.setAttributes({
                                "blobs.response.status": res.status
                            });
                            let blobs = [];
                            let directories = [];
                            if (![
                                200,
                                204,
                                404
                            ].includes(res.status)) {
                                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BlobsInternalError"](res);
                            }
                            if (res.status === 404) {
                                done = true;
                            } else {
                                const page = await res.json();
                                if (page.next_cursor) {
                                    currentCursor = page.next_cursor;
                                } else {
                                    done = true;
                                }
                                blobs = (page.blobs ?? []).map(_Store.formatListResultBlob).filter(Boolean);
                                directories = page.directories ?? [];
                            }
                            return {
                                done: false,
                                value: {
                                    blobs,
                                    directories
                                }
                            };
                        });
                    }
                };
            }
        };
    }
};
// src/store_factory.ts
var getDeployStore = (input = {}, options)=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getEnvironmentContext"])();
    const mergedOptions = typeof input === "string" ? {
        ...options,
        name: input
    } : input;
    const deployID = mergedOptions.deployID ?? context.deployID;
    if (!deployID) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["MissingBlobsEnvironmentError"]([
            "deployID"
        ]);
    }
    const clientOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getClientOptions"])(mergedOptions, context);
    if (!clientOptions.region) {
        if (clientOptions.edgeURL || clientOptions.uncachedEdgeURL) {
            if (!context.primaryRegion) {
                throw new Error("When accessing a deploy store, the Netlify Blobs client needs to be configured with a region, and one was not found in the environment. To manually set the region, set the `region` property in the `getDeployStore` options. If you are using the Netlify CLI, you may have an outdated version; run `npm install -g netlify-cli@latest` to update and try again.");
            }
            clientOptions.region = context.primaryRegion;
        } else {
            clientOptions.region = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["REGION_AUTO"];
        }
    }
    const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["Client"](clientOptions);
    return new Store({
        client,
        deployID,
        name: mergedOptions.name
    });
};
var getStore = (input, options)=>{
    if (typeof input === "string") {
        const contextOverride = options?.siteID && options?.token ? {
            siteID: options?.siteID,
            token: options?.token
        } : void 0;
        const clientOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getClientOptions"])(options ?? {}, contextOverride);
        const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["Client"](clientOptions);
        return new Store({
            client,
            name: input
        });
    }
    if (typeof input?.name === "string") {
        const { name } = input;
        const contextOverride = input?.siteID && input?.token ? {
            siteID: input?.siteID,
            token: input?.token
        } : void 0;
        const clientOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getClientOptions"])(input, contextOverride);
        if (!name) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["MissingBlobsEnvironmentError"]([
                "name"
            ]);
        }
        const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["Client"](clientOptions);
        return new Store({
            client,
            name
        });
    }
    if (typeof input?.deployID === "string") {
        const clientOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getClientOptions"])(input);
        const { deployID } = input;
        if (!deployID) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["MissingBlobsEnvironmentError"]([
                "deployID"
            ]);
        }
        const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["Client"](clientOptions);
        return new Store({
            client,
            deployID
        });
    }
    throw new Error("The `getStore` method requires the name of the store as a string or as the `name` property of an options object");
};
// src/store_list.ts
function listStores(options = {}) {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getEnvironmentContext"])();
    const clientOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["getClientOptions"])(options, context);
    const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["Client"](clientOptions);
    const iterator = getListIterator(client, SITE_STORE_PREFIX);
    if (options.paginate) {
        return iterator;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$chunk$2d$YAGWSQMB$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["collectIterator"])(iterator).then((results)=>({
            stores: results.flatMap((page)=>page.stores)
        }));
}
var formatListStoreResponse = (stores)=>stores.filter((store)=>!store.startsWith(DEPLOY_STORE_PREFIX)).map((store)=>store.startsWith(SITE_STORE_PREFIX) ? store.slice(SITE_STORE_PREFIX.length) : store);
var getListIterator = (client, prefix)=>{
    const parameters = {
        prefix
    };
    return {
        [Symbol.asyncIterator] () {
            let currentCursor = null;
            let done = false;
            return {
                async next () {
                    if (done) {
                        return {
                            done: true,
                            value: void 0
                        };
                    }
                    const nextParameters = {
                        ...parameters
                    };
                    if (currentCursor !== null) {
                        nextParameters.cursor = currentCursor;
                    }
                    const res = await client.makeRequest({
                        method: "get" /* GET */ ,
                        parameters: nextParameters
                    });
                    if (res.status === 404) {
                        return {
                            done: true,
                            value: void 0
                        };
                    }
                    const page = await res.json();
                    if (page.next_cursor) {
                        currentCursor = page.next_cursor;
                    } else {
                        done = true;
                    }
                    return {
                        done: false,
                        value: {
                            ...page,
                            stores: formatListStoreResponse(page.stores)
                        }
                    };
                }
            };
        }
    };
};
;
}),
"[externals]/pino [external] (pino, cjs, [project]/node_modules/.pnpm/pino@10.3.1/node_modules/pino)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("pino-2e79642258e38174", () => require("pino-2e79642258e38174"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0lffo_b._.js.map