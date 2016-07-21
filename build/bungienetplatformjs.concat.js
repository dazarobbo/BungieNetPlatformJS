/*! bignumber.js v2.4.0 https://github.com/MikeMcl/bignumber.js/LICENCE */

;(function (globalObj) {
    'use strict';

    /*
      bignumber.js v2.4.0
      A JavaScript library for arbitrary-precision arithmetic.
      https://github.com/MikeMcl/bignumber.js
      Copyright (c) 2016 Michael Mclaughlin <M8ch88l@gmail.com>
      MIT Expat Licence
    */


    var BigNumber, cryptoObj, parseNumeric,
        isNumeric = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
        mathceil = Math.ceil,
        mathfloor = Math.floor,
        notBool = ' not a boolean or binary digit',
        roundingMode = 'rounding mode',
        tooManyDigits = 'number type has more than 15 significant digits',
        ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_',
        BASE = 1e14,
        LOG_BASE = 14,
        MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
        // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
        POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
        SQRT_BASE = 1e7,

        /*
         * The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
         * the arguments to toExponential, toFixed, toFormat, and toPrecision, beyond which an
         * exception is thrown (if ERRORS is true).
         */
        MAX = 1E9;                                   // 0 to MAX_INT32

    if ( typeof crypto != 'undefined' ) cryptoObj = crypto;


    /*
     * Create and return a BigNumber constructor.
     */
    function constructorFactory(configObj) {
        var div,

            // id tracks the caller function, so its name can be included in error messages.
            id = 0,
            P = BigNumber.prototype,
            ONE = new BigNumber(1),


            /********************************* EDITABLE DEFAULTS **********************************/


            /*
             * The default values below must be integers within the inclusive ranges stated.
             * The values can also be changed at run-time using BigNumber.config.
             */

            // The maximum number of decimal places for operations involving division.
            DECIMAL_PLACES = 20,                     // 0 to MAX

            /*
             * The rounding mode used when rounding to the above decimal places, and when using
             * toExponential, toFixed, toFormat and toPrecision, and round (default value).
             * UP         0 Away from zero.
             * DOWN       1 Towards zero.
             * CEIL       2 Towards +Infinity.
             * FLOOR      3 Towards -Infinity.
             * HALF_UP    4 Towards nearest neighbour. If equidistant, up.
             * HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
             * HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
             * HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
             * HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
             */
            ROUNDING_MODE = 4,                       // 0 to 8

            // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

            // The exponent value at and beneath which toString returns exponential notation.
            // Number type: -7
            TO_EXP_NEG = -7,                         // 0 to -MAX

            // The exponent value at and above which toString returns exponential notation.
            // Number type: 21
            TO_EXP_POS = 21,                         // 0 to MAX

            // RANGE : [MIN_EXP, MAX_EXP]

            // The minimum exponent value, beneath which underflow to zero occurs.
            // Number type: -324  (5e-324)
            MIN_EXP = -1e7,                          // -1 to -MAX

            // The maximum exponent value, above which overflow to Infinity occurs.
            // Number type:  308  (1.7976931348623157e+308)
            // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
            MAX_EXP = 1e7,                           // 1 to MAX

            // Whether BigNumber Errors are ever thrown.
            ERRORS = true,                           // true or false

            // Change to intValidatorNoErrors if ERRORS is false.
            isValidInt = intValidatorWithErrors,     // intValidatorWithErrors/intValidatorNoErrors

            // Whether to use cryptographically-secure random number generation, if available.
            CRYPTO = false,                          // true or false

            /*
             * The modulo mode used when calculating the modulus: a mod n.
             * The quotient (q = a / n) is calculated according to the corresponding rounding mode.
             * The remainder (r) is calculated as: r = a - n * q.
             *
             * UP        0 The remainder is positive if the dividend is negative, else is negative.
             * DOWN      1 The remainder has the same sign as the dividend.
             *             This modulo mode is commonly known as 'truncated division' and is
             *             equivalent to (a % n) in JavaScript.
             * FLOOR     3 The remainder has the same sign as the divisor (Python %).
             * HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
             * EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
             *             The remainder is always positive.
             *
             * The truncated division, floored division, Euclidian division and IEEE 754 remainder
             * modes are commonly used for the modulus operation.
             * Although the other rounding modes can also be used, they may not give useful results.
             */
            MODULO_MODE = 1,                         // 0 to 9

            // The maximum number of significant digits of the result of the toPower operation.
            // If POW_PRECISION is 0, there will be unlimited significant digits.
            POW_PRECISION = 100,                     // 0 to MAX

            // The format specification used by the BigNumber.prototype.toFormat method.
            FORMAT = {
                decimalSeparator: '.',
                groupSeparator: ',',
                groupSize: 3,
                secondaryGroupSize: 0,
                fractionGroupSeparator: '\xA0',      // non-breaking space
                fractionGroupSize: 0
            };


        /******************************************************************************************/


        // CONSTRUCTOR


        /*
         * The BigNumber constructor and exported function.
         * Create and return a new instance of a BigNumber object.
         *
         * n {number|string|BigNumber} A numeric value.
         * [b] {number} The base of n. Integer, 2 to 64 inclusive.
         */
        function BigNumber( n, b ) {
            var c, e, i, num, len, str,
                x = this;

            // Enable constructor usage without new.
            if ( !( x instanceof BigNumber ) ) {

                // 'BigNumber() constructor call without new: {n}'
                if (ERRORS) raise( 26, 'constructor call without new', n );
                return new BigNumber( n, b );
            }

            // 'new BigNumber() base not an integer: {b}'
            // 'new BigNumber() base out of range: {b}'
            if ( b == null || !isValidInt( b, 2, 64, id, 'base' ) ) {

                // Duplicate.
                if ( n instanceof BigNumber ) {
                    x.s = n.s;
                    x.e = n.e;
                    x.c = ( n = n.c ) ? n.slice() : n;
                    id = 0;
                    return;
                }

                if ( ( num = typeof n == 'number' ) && n * 0 == 0 ) {
                    x.s = 1 / n < 0 ? ( n = -n, -1 ) : 1;

                    // Fast path for integers.
                    if ( n === ~~n ) {
                        for ( e = 0, i = n; i >= 10; i /= 10, e++ );
                        x.e = e;
                        x.c = [n];
                        id = 0;
                        return;
                    }

                    str = n + '';
                } else {
                    if ( !isNumeric.test( str = n + '' ) ) return parseNumeric( x, str, num );
                    x.s = str.charCodeAt(0) === 45 ? ( str = str.slice(1), -1 ) : 1;
                }
            } else {
                b = b | 0;
                str = n + '';

                // Ensure return value is rounded to DECIMAL_PLACES as with other bases.
                // Allow exponential notation to be used with base 10 argument.
                if ( b == 10 ) {
                    x = new BigNumber( n instanceof BigNumber ? n : str );
                    return round( x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE );
                }

                // Avoid potential interpretation of Infinity and NaN as base 44+ values.
                // Any number in exponential form will fail due to the [Ee][+-].
                if ( ( num = typeof n == 'number' ) && n * 0 != 0 ||
                  !( new RegExp( '^-?' + ( c = '[' + ALPHABET.slice( 0, b ) + ']+' ) +
                    '(?:\\.' + c + ')?$',b < 37 ? 'i' : '' ) ).test(str) ) {
                    return parseNumeric( x, str, num, b );
                }

                if (num) {
                    x.s = 1 / n < 0 ? ( str = str.slice(1), -1 ) : 1;

                    if ( ERRORS && str.replace( /^0\.0*|\./, '' ).length > 15 ) {

                        // 'new BigNumber() number type has more than 15 significant digits: {n}'
                        raise( id, tooManyDigits, n );
                    }

                    // Prevent later check for length on converted number.
                    num = false;
                } else {
                    x.s = str.charCodeAt(0) === 45 ? ( str = str.slice(1), -1 ) : 1;
                }

                str = convertBase( str, 10, b, x.s );
            }

            // Decimal point?
            if ( ( e = str.indexOf('.') ) > -1 ) str = str.replace( '.', '' );

            // Exponential form?
            if ( ( i = str.search( /e/i ) ) > 0 ) {

                // Determine exponent.
                if ( e < 0 ) e = i;
                e += +str.slice( i + 1 );
                str = str.substring( 0, i );
            } else if ( e < 0 ) {

                // Integer.
                e = str.length;
            }

            // Determine leading zeros.
            for ( i = 0; str.charCodeAt(i) === 48; i++ );

            // Determine trailing zeros.
            for ( len = str.length; str.charCodeAt(--len) === 48; );
            str = str.slice( i, len + 1 );

            if (str) {
                len = str.length;

                // Disallow numbers with over 15 significant digits if number type.
                // 'new BigNumber() number type has more than 15 significant digits: {n}'
                if ( num && ERRORS && len > 15 && ( n > MAX_SAFE_INTEGER || n !== mathfloor(n) ) ) {
                    raise( id, tooManyDigits, x.s * n );
                }

                e = e - i - 1;

                 // Overflow?
                if ( e > MAX_EXP ) {

                    // Infinity.
                    x.c = x.e = null;

                // Underflow?
                } else if ( e < MIN_EXP ) {

                    // Zero.
                    x.c = [ x.e = 0 ];
                } else {
                    x.e = e;
                    x.c = [];

                    // Transform base

                    // e is the base 10 exponent.
                    // i is where to slice str to get the first element of the coefficient array.
                    i = ( e + 1 ) % LOG_BASE;
                    if ( e < 0 ) i += LOG_BASE;

                    if ( i < len ) {
                        if (i) x.c.push( +str.slice( 0, i ) );

                        for ( len -= LOG_BASE; i < len; ) {
                            x.c.push( +str.slice( i, i += LOG_BASE ) );
                        }

                        str = str.slice(i);
                        i = LOG_BASE - str.length;
                    } else {
                        i -= len;
                    }

                    for ( ; i--; str += '0' );
                    x.c.push( +str );
                }
            } else {

                // Zero.
                x.c = [ x.e = 0 ];
            }

            id = 0;
        }


        // CONSTRUCTOR PROPERTIES


        BigNumber.another = constructorFactory;

        BigNumber.ROUND_UP = 0;
        BigNumber.ROUND_DOWN = 1;
        BigNumber.ROUND_CEIL = 2;
        BigNumber.ROUND_FLOOR = 3;
        BigNumber.ROUND_HALF_UP = 4;
        BigNumber.ROUND_HALF_DOWN = 5;
        BigNumber.ROUND_HALF_EVEN = 6;
        BigNumber.ROUND_HALF_CEIL = 7;
        BigNumber.ROUND_HALF_FLOOR = 8;
        BigNumber.EUCLID = 9;


        /*
         * Configure infrequently-changing library-wide settings.
         *
         * Accept an object or an argument list, with one or many of the following properties or
         * parameters respectively:
         *
         *   DECIMAL_PLACES  {number}  Integer, 0 to MAX inclusive
         *   ROUNDING_MODE   {number}  Integer, 0 to 8 inclusive
         *   EXPONENTIAL_AT  {number|number[]}  Integer, -MAX to MAX inclusive or
         *                                      [integer -MAX to 0 incl., 0 to MAX incl.]
         *   RANGE           {number|number[]}  Non-zero integer, -MAX to MAX inclusive or
         *                                      [integer -MAX to -1 incl., integer 1 to MAX incl.]
         *   ERRORS          {boolean|number}   true, false, 1 or 0
         *   CRYPTO          {boolean|number}   true, false, 1 or 0
         *   MODULO_MODE     {number}           0 to 9 inclusive
         *   POW_PRECISION   {number}           0 to MAX inclusive
         *   FORMAT          {object}           See BigNumber.prototype.toFormat
         *      decimalSeparator       {string}
         *      groupSeparator         {string}
         *      groupSize              {number}
         *      secondaryGroupSize     {number}
         *      fractionGroupSeparator {string}
         *      fractionGroupSize      {number}
         *
         * (The values assigned to the above FORMAT object properties are not checked for validity.)
         *
         * E.g.
         * BigNumber.config(20, 4) is equivalent to
         * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
         *
         * Ignore properties/parameters set to null or undefined.
         * Return an object with the properties current values.
         */
        BigNumber.config = function () {
            var v, p,
                i = 0,
                r = {},
                a = arguments,
                o = a[0],
                has = o && typeof o == 'object'
                  ? function () { if ( o.hasOwnProperty(p) ) return ( v = o[p] ) != null; }
                  : function () { if ( a.length > i ) return ( v = a[i++] ) != null; };

            // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
            // 'config() DECIMAL_PLACES not an integer: {v}'
            // 'config() DECIMAL_PLACES out of range: {v}'
            if ( has( p = 'DECIMAL_PLACES' ) && isValidInt( v, 0, MAX, 2, p ) ) {
                DECIMAL_PLACES = v | 0;
            }
            r[p] = DECIMAL_PLACES;

            // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
            // 'config() ROUNDING_MODE not an integer: {v}'
            // 'config() ROUNDING_MODE out of range: {v}'
            if ( has( p = 'ROUNDING_MODE' ) && isValidInt( v, 0, 8, 2, p ) ) {
                ROUNDING_MODE = v | 0;
            }
            r[p] = ROUNDING_MODE;

            // EXPONENTIAL_AT {number|number[]}
            // Integer, -MAX to MAX inclusive or [integer -MAX to 0 inclusive, 0 to MAX inclusive].
            // 'config() EXPONENTIAL_AT not an integer: {v}'
            // 'config() EXPONENTIAL_AT out of range: {v}'
            if ( has( p = 'EXPONENTIAL_AT' ) ) {

                if ( isArray(v) ) {
                    if ( isValidInt( v[0], -MAX, 0, 2, p ) && isValidInt( v[1], 0, MAX, 2, p ) ) {
                        TO_EXP_NEG = v[0] | 0;
                        TO_EXP_POS = v[1] | 0;
                    }
                } else if ( isValidInt( v, -MAX, MAX, 2, p ) ) {
                    TO_EXP_NEG = -( TO_EXP_POS = ( v < 0 ? -v : v ) | 0 );
                }
            }
            r[p] = [ TO_EXP_NEG, TO_EXP_POS ];

            // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
            // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
            // 'config() RANGE not an integer: {v}'
            // 'config() RANGE cannot be zero: {v}'
            // 'config() RANGE out of range: {v}'
            if ( has( p = 'RANGE' ) ) {

                if ( isArray(v) ) {
                    if ( isValidInt( v[0], -MAX, -1, 2, p ) && isValidInt( v[1], 1, MAX, 2, p ) ) {
                        MIN_EXP = v[0] | 0;
                        MAX_EXP = v[1] | 0;
                    }
                } else if ( isValidInt( v, -MAX, MAX, 2, p ) ) {
                    if ( v | 0 ) MIN_EXP = -( MAX_EXP = ( v < 0 ? -v : v ) | 0 );
                    else if (ERRORS) raise( 2, p + ' cannot be zero', v );
                }
            }
            r[p] = [ MIN_EXP, MAX_EXP ];

            // ERRORS {boolean|number} true, false, 1 or 0.
            // 'config() ERRORS not a boolean or binary digit: {v}'
            if ( has( p = 'ERRORS' ) ) {

                if ( v === !!v || v === 1 || v === 0 ) {
                    id = 0;
                    isValidInt = ( ERRORS = !!v ) ? intValidatorWithErrors : intValidatorNoErrors;
                } else if (ERRORS) {
                    raise( 2, p + notBool, v );
                }
            }
            r[p] = ERRORS;

            // CRYPTO {boolean|number} true, false, 1 or 0.
            // 'config() CRYPTO not a boolean or binary digit: {v}'
            // 'config() crypto unavailable: {crypto}'
            if ( has( p = 'CRYPTO' ) ) {

                if ( v === !!v || v === 1 || v === 0 ) {
                    CRYPTO = !!( v && cryptoObj );
                    if ( v && !CRYPTO && ERRORS ) raise( 2, 'crypto unavailable', cryptoObj );
                } else if (ERRORS) {
                    raise( 2, p + notBool, v );
                }
            }
            r[p] = CRYPTO;

            // MODULO_MODE {number} Integer, 0 to 9 inclusive.
            // 'config() MODULO_MODE not an integer: {v}'
            // 'config() MODULO_MODE out of range: {v}'
            if ( has( p = 'MODULO_MODE' ) && isValidInt( v, 0, 9, 2, p ) ) {
                MODULO_MODE = v | 0;
            }
            r[p] = MODULO_MODE;

            // POW_PRECISION {number} Integer, 0 to MAX inclusive.
            // 'config() POW_PRECISION not an integer: {v}'
            // 'config() POW_PRECISION out of range: {v}'
            if ( has( p = 'POW_PRECISION' ) && isValidInt( v, 0, MAX, 2, p ) ) {
                POW_PRECISION = v | 0;
            }
            r[p] = POW_PRECISION;

            // FORMAT {object}
            // 'config() FORMAT not an object: {v}'
            if ( has( p = 'FORMAT' ) ) {

                if ( typeof v == 'object' ) {
                    FORMAT = v;
                } else if (ERRORS) {
                    raise( 2, p + ' not an object', v );
                }
            }
            r[p] = FORMAT;

            return r;
        };


        /*
         * Return a new BigNumber whose value is the maximum of the arguments.
         *
         * arguments {number|string|BigNumber}
         */
        BigNumber.max = function () { return maxOrMin( arguments, P.lt ); };


        /*
         * Return a new BigNumber whose value is the minimum of the arguments.
         *
         * arguments {number|string|BigNumber}
         */
        BigNumber.min = function () { return maxOrMin( arguments, P.gt ); };


        /*
         * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
         * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
         * zeros are produced).
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         *
         * 'random() decimal places not an integer: {dp}'
         * 'random() decimal places out of range: {dp}'
         * 'random() crypto unavailable: {crypto}'
         */
        BigNumber.random = (function () {
            var pow2_53 = 0x20000000000000;

            // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
            // Check if Math.random() produces more than 32 bits of randomness.
            // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
            // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
            var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
              ? function () { return mathfloor( Math.random() * pow2_53 ); }
              : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
                  (Math.random() * 0x800000 | 0); };

            return function (dp) {
                var a, b, e, k, v,
                    i = 0,
                    c = [],
                    rand = new BigNumber(ONE);

                dp = dp == null || !isValidInt( dp, 0, MAX, 14 ) ? DECIMAL_PLACES : dp | 0;
                k = mathceil( dp / LOG_BASE );

                if (CRYPTO) {

                    // Browsers supporting crypto.getRandomValues.
                    if ( cryptoObj && cryptoObj.getRandomValues ) {

                        a = cryptoObj.getRandomValues( new Uint32Array( k *= 2 ) );

                        for ( ; i < k; ) {

                            // 53 bits:
                            // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
                            // 11111 11111111 11111111 11111111 11100000 00000000 00000000
                            // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
                            //                                     11111 11111111 11111111
                            // 0x20000 is 2^21.
                            v = a[i] * 0x20000 + (a[i + 1] >>> 11);

                            // Rejection sampling:
                            // 0 <= v < 9007199254740992
                            // Probability that v >= 9e15, is
                            // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
                            if ( v >= 9e15 ) {
                                b = cryptoObj.getRandomValues( new Uint32Array(2) );
                                a[i] = b[0];
                                a[i + 1] = b[1];
                            } else {

                                // 0 <= v <= 8999999999999999
                                // 0 <= (v % 1e14) <= 99999999999999
                                c.push( v % 1e14 );
                                i += 2;
                            }
                        }
                        i = k / 2;

                    // Node.js supporting crypto.randomBytes.
                    } else if ( cryptoObj && cryptoObj.randomBytes ) {

                        // buffer
                        a = cryptoObj.randomBytes( k *= 7 );

                        for ( ; i < k; ) {

                            // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
                            // 0x100000000 is 2^32, 0x1000000 is 2^24
                            // 11111 11111111 11111111 11111111 11111111 11111111 11111111
                            // 0 <= v < 9007199254740992
                            v = ( ( a[i] & 31 ) * 0x1000000000000 ) + ( a[i + 1] * 0x10000000000 ) +
                                  ( a[i + 2] * 0x100000000 ) + ( a[i + 3] * 0x1000000 ) +
                                  ( a[i + 4] << 16 ) + ( a[i + 5] << 8 ) + a[i + 6];

                            if ( v >= 9e15 ) {
                                cryptoObj.randomBytes(7).copy( a, i );
                            } else {

                                // 0 <= (v % 1e14) <= 99999999999999
                                c.push( v % 1e14 );
                                i += 7;
                            }
                        }
                        i = k / 7;
                    } else if (ERRORS) {
                        raise( 14, 'crypto unavailable', cryptoObj );
                    }
                }

                // Use Math.random: CRYPTO is false or crypto is unavailable and ERRORS is false.
                if (!i) {

                    for ( ; i < k; ) {
                        v = random53bitInt();
                        if ( v < 9e15 ) c[i++] = v % 1e14;
                    }
                }

                k = c[--i];
                dp %= LOG_BASE;

                // Convert trailing digits to zeros according to dp.
                if ( k && dp ) {
                    v = POWS_TEN[LOG_BASE - dp];
                    c[i] = mathfloor( k / v ) * v;
                }

                // Remove trailing elements which are zero.
                for ( ; c[i] === 0; c.pop(), i-- );

                // Zero?
                if ( i < 0 ) {
                    c = [ e = 0 ];
                } else {

                    // Remove leading elements which are zero and adjust exponent accordingly.
                    for ( e = -1 ; c[0] === 0; c.shift(), e -= LOG_BASE);

                    // Count the digits of the first element of c to determine leading zeros, and...
                    for ( i = 1, v = c[0]; v >= 10; v /= 10, i++);

                    // adjust the exponent accordingly.
                    if ( i < LOG_BASE ) e -= LOG_BASE - i;
                }

                rand.e = e;
                rand.c = c;
                return rand;
            };
        })();


        // PRIVATE FUNCTIONS


        // Convert a numeric string of baseIn to a numeric string of baseOut.
        function convertBase( str, baseOut, baseIn, sign ) {
            var d, e, k, r, x, xc, y,
                i = str.indexOf( '.' ),
                dp = DECIMAL_PLACES,
                rm = ROUNDING_MODE;

            if ( baseIn < 37 ) str = str.toLowerCase();

            // Non-integer.
            if ( i >= 0 ) {
                k = POW_PRECISION;

                // Unlimited precision.
                POW_PRECISION = 0;
                str = str.replace( '.', '' );
                y = new BigNumber(baseIn);
                x = y.pow( str.length - i );
                POW_PRECISION = k;

                // Convert str as if an integer, then restore the fraction part by dividing the
                // result by its base raised to a power.
                y.c = toBaseOut( toFixedPoint( coeffToString( x.c ), x.e ), 10, baseOut );
                y.e = y.c.length;
            }

            // Convert the number as integer.
            xc = toBaseOut( str, baseIn, baseOut );
            e = k = xc.length;

            // Remove trailing zeros.
            for ( ; xc[--k] == 0; xc.pop() );
            if ( !xc[0] ) return '0';

            if ( i < 0 ) {
                --e;
            } else {
                x.c = xc;
                x.e = e;

                // sign is needed for correct rounding.
                x.s = sign;
                x = div( x, y, dp, rm, baseOut );
                xc = x.c;
                r = x.r;
                e = x.e;
            }

            d = e + dp + 1;

            // The rounding digit, i.e. the digit to the right of the digit that may be rounded up.
            i = xc[d];
            k = baseOut / 2;
            r = r || d < 0 || xc[d + 1] != null;

            r = rm < 4 ? ( i != null || r ) && ( rm == 0 || rm == ( x.s < 0 ? 3 : 2 ) )
                       : i > k || i == k &&( rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
                         rm == ( x.s < 0 ? 8 : 7 ) );

            if ( d < 1 || !xc[0] ) {

                // 1^-dp or 0.
                str = r ? toFixedPoint( '1', -dp ) : '0';
            } else {
                xc.length = d;

                if (r) {

                    // Rounding up may mean the previous digit has to be rounded up and so on.
                    for ( --baseOut; ++xc[--d] > baseOut; ) {
                        xc[d] = 0;

                        if ( !d ) {
                            ++e;
                            xc.unshift(1);
                        }
                    }
                }

                // Determine trailing zeros.
                for ( k = xc.length; !xc[--k]; );

                // E.g. [4, 11, 15] becomes 4bf.
                for ( i = 0, str = ''; i <= k; str += ALPHABET.charAt( xc[i++] ) );
                str = toFixedPoint( str, e );
            }

            // The caller will add the sign.
            return str;
        }


        // Perform division in the specified base. Called by div and convertBase.
        div = (function () {

            // Assume non-zero x and k.
            function multiply( x, k, base ) {
                var m, temp, xlo, xhi,
                    carry = 0,
                    i = x.length,
                    klo = k % SQRT_BASE,
                    khi = k / SQRT_BASE | 0;

                for ( x = x.slice(); i--; ) {
                    xlo = x[i] % SQRT_BASE;
                    xhi = x[i] / SQRT_BASE | 0;
                    m = khi * xlo + xhi * klo;
                    temp = klo * xlo + ( ( m % SQRT_BASE ) * SQRT_BASE ) + carry;
                    carry = ( temp / base | 0 ) + ( m / SQRT_BASE | 0 ) + khi * xhi;
                    x[i] = temp % base;
                }

                if (carry) x.unshift(carry);

                return x;
            }

            function compare( a, b, aL, bL ) {
                var i, cmp;

                if ( aL != bL ) {
                    cmp = aL > bL ? 1 : -1;
                } else {

                    for ( i = cmp = 0; i < aL; i++ ) {

                        if ( a[i] != b[i] ) {
                            cmp = a[i] > b[i] ? 1 : -1;
                            break;
                        }
                    }
                }
                return cmp;
            }

            function subtract( a, b, aL, base ) {
                var i = 0;

                // Subtract b from a.
                for ( ; aL--; ) {
                    a[aL] -= i;
                    i = a[aL] < b[aL] ? 1 : 0;
                    a[aL] = i * base + a[aL] - b[aL];
                }

                // Remove leading zeros.
                for ( ; !a[0] && a.length > 1; a.shift() );
            }

            // x: dividend, y: divisor.
            return function ( x, y, dp, rm, base ) {
                var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
                    yL, yz,
                    s = x.s == y.s ? 1 : -1,
                    xc = x.c,
                    yc = y.c;

                // Either NaN, Infinity or 0?
                if ( !xc || !xc[0] || !yc || !yc[0] ) {

                    return new BigNumber(

                      // Return NaN if either NaN, or both Infinity or 0.
                      !x.s || !y.s || ( xc ? yc && xc[0] == yc[0] : !yc ) ? NaN :

                        // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
                        xc && xc[0] == 0 || !yc ? s * 0 : s / 0
                    );
                }

                q = new BigNumber(s);
                qc = q.c = [];
                e = x.e - y.e;
                s = dp + e + 1;

                if ( !base ) {
                    base = BASE;
                    e = bitFloor( x.e / LOG_BASE ) - bitFloor( y.e / LOG_BASE );
                    s = s / LOG_BASE | 0;
                }

                // Result exponent may be one less then the current value of e.
                // The coefficients of the BigNumbers from convertBase may have trailing zeros.
                for ( i = 0; yc[i] == ( xc[i] || 0 ); i++ );
                if ( yc[i] > ( xc[i] || 0 ) ) e--;

                if ( s < 0 ) {
                    qc.push(1);
                    more = true;
                } else {
                    xL = xc.length;
                    yL = yc.length;
                    i = 0;
                    s += 2;

                    // Normalise xc and yc so highest order digit of yc is >= base / 2.

                    n = mathfloor( base / ( yc[0] + 1 ) );

                    // Not necessary, but to handle odd bases where yc[0] == ( base / 2 ) - 1.
                    // if ( n > 1 || n++ == 1 && yc[0] < base / 2 ) {
                    if ( n > 1 ) {
                        yc = multiply( yc, n, base );
                        xc = multiply( xc, n, base );
                        yL = yc.length;
                        xL = xc.length;
                    }

                    xi = yL;
                    rem = xc.slice( 0, yL );
                    remL = rem.length;

                    // Add zeros to make remainder as long as divisor.
                    for ( ; remL < yL; rem[remL++] = 0 );
                    yz = yc.slice();
                    yz.unshift(0);
                    yc0 = yc[0];
                    if ( yc[1] >= base / 2 ) yc0++;
                    // Not necessary, but to prevent trial digit n > base, when using base 3.
                    // else if ( base == 3 && yc0 == 1 ) yc0 = 1 + 1e-15;

                    do {
                        n = 0;

                        // Compare divisor and remainder.
                        cmp = compare( yc, rem, yL, remL );

                        // If divisor < remainder.
                        if ( cmp < 0 ) {

                            // Calculate trial digit, n.

                            rem0 = rem[0];
                            if ( yL != remL ) rem0 = rem0 * base + ( rem[1] || 0 );

                            // n is how many times the divisor goes into the current remainder.
                            n = mathfloor( rem0 / yc0 );

                            //  Algorithm:
                            //  1. product = divisor * trial digit (n)
                            //  2. if product > remainder: product -= divisor, n--
                            //  3. remainder -= product
                            //  4. if product was < remainder at 2:
                            //    5. compare new remainder and divisor
                            //    6. If remainder > divisor: remainder -= divisor, n++

                            if ( n > 1 ) {

                                // n may be > base only when base is 3.
                                if (n >= base) n = base - 1;

                                // product = divisor * trial digit.
                                prod = multiply( yc, n, base );
                                prodL = prod.length;
                                remL = rem.length;

                                // Compare product and remainder.
                                // If product > remainder.
                                // Trial digit n too high.
                                // n is 1 too high about 5% of the time, and is not known to have
                                // ever been more than 1 too high.
                                while ( compare( prod, rem, prodL, remL ) == 1 ) {
                                    n--;

                                    // Subtract divisor from product.
                                    subtract( prod, yL < prodL ? yz : yc, prodL, base );
                                    prodL = prod.length;
                                    cmp = 1;
                                }
                            } else {

                                // n is 0 or 1, cmp is -1.
                                // If n is 0, there is no need to compare yc and rem again below,
                                // so change cmp to 1 to avoid it.
                                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                                if ( n == 0 ) {

                                    // divisor < remainder, so n must be at least 1.
                                    cmp = n = 1;
                                }

                                // product = divisor
                                prod = yc.slice();
                                prodL = prod.length;
                            }

                            if ( prodL < remL ) prod.unshift(0);

                            // Subtract product from remainder.
                            subtract( rem, prod, remL, base );
                            remL = rem.length;

                             // If product was < remainder.
                            if ( cmp == -1 ) {

                                // Compare divisor and new remainder.
                                // If divisor < new remainder, subtract divisor from remainder.
                                // Trial digit n too low.
                                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                                while ( compare( yc, rem, yL, remL ) < 1 ) {
                                    n++;

                                    // Subtract divisor from remainder.
                                    subtract( rem, yL < remL ? yz : yc, remL, base );
                                    remL = rem.length;
                                }
                            }
                        } else if ( cmp === 0 ) {
                            n++;
                            rem = [0];
                        } // else cmp === 1 and n will be 0

                        // Add the next digit, n, to the result array.
                        qc[i++] = n;

                        // Update the remainder.
                        if ( rem[0] ) {
                            rem[remL++] = xc[xi] || 0;
                        } else {
                            rem = [ xc[xi] ];
                            remL = 1;
                        }
                    } while ( ( xi++ < xL || rem[0] != null ) && s-- );

                    more = rem[0] != null;

                    // Leading zero?
                    if ( !qc[0] ) qc.shift();
                }

                if ( base == BASE ) {

                    // To calculate q.e, first get the number of digits of qc[0].
                    for ( i = 1, s = qc[0]; s >= 10; s /= 10, i++ );
                    round( q, dp + ( q.e = i + e * LOG_BASE - 1 ) + 1, rm, more );

                // Caller is convertBase.
                } else {
                    q.e = e;
                    q.r = +more;
                }

                return q;
            };
        })();


        /*
         * Return a string representing the value of BigNumber n in fixed-point or exponential
         * notation rounded to the specified decimal places or significant digits.
         *
         * n is a BigNumber.
         * i is the index of the last digit required (i.e. the digit that may be rounded up).
         * rm is the rounding mode.
         * caller is caller id: toExponential 19, toFixed 20, toFormat 21, toPrecision 24.
         */
        function format( n, i, rm, caller ) {
            var c0, e, ne, len, str;

            rm = rm != null && isValidInt( rm, 0, 8, caller, roundingMode )
              ? rm | 0 : ROUNDING_MODE;

            if ( !n.c ) return n.toString();
            c0 = n.c[0];
            ne = n.e;

            if ( i == null ) {
                str = coeffToString( n.c );
                str = caller == 19 || caller == 24 && ne <= TO_EXP_NEG
                  ? toExponential( str, ne )
                  : toFixedPoint( str, ne );
            } else {
                n = round( new BigNumber(n), i, rm );

                // n.e may have changed if the value was rounded up.
                e = n.e;

                str = coeffToString( n.c );
                len = str.length;

                // toPrecision returns exponential notation if the number of significant digits
                // specified is less than the number of digits necessary to represent the integer
                // part of the value in fixed-point notation.

                // Exponential notation.
                if ( caller == 19 || caller == 24 && ( i <= e || e <= TO_EXP_NEG ) ) {

                    // Append zeros?
                    for ( ; len < i; str += '0', len++ );
                    str = toExponential( str, e );

                // Fixed-point notation.
                } else {
                    i -= ne;
                    str = toFixedPoint( str, e );

                    // Append zeros?
                    if ( e + 1 > len ) {
                        if ( --i > 0 ) for ( str += '.'; i--; str += '0' );
                    } else {
                        i += e - len;
                        if ( i > 0 ) {
                            if ( e + 1 == len ) str += '.';
                            for ( ; i--; str += '0' );
                        }
                    }
                }
            }

            return n.s < 0 && c0 ? '-' + str : str;
        }


        // Handle BigNumber.max and BigNumber.min.
        function maxOrMin( args, method ) {
            var m, n,
                i = 0;

            if ( isArray( args[0] ) ) args = args[0];
            m = new BigNumber( args[0] );

            for ( ; ++i < args.length; ) {
                n = new BigNumber( args[i] );

                // If any number is NaN, return NaN.
                if ( !n.s ) {
                    m = n;
                    break;
                } else if ( method.call( m, n ) ) {
                    m = n;
                }
            }

            return m;
        }


        /*
         * Return true if n is an integer in range, otherwise throw.
         * Use for argument validation when ERRORS is true.
         */
        function intValidatorWithErrors( n, min, max, caller, name ) {
            if ( n < min || n > max || n != truncate(n) ) {
                raise( caller, ( name || 'decimal places' ) +
                  ( n < min || n > max ? ' out of range' : ' not an integer' ), n );
            }

            return true;
        }


        /*
         * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
         * Called by minus, plus and times.
         */
        function normalise( n, c, e ) {
            var i = 1,
                j = c.length;

             // Remove trailing zeros.
            for ( ; !c[--j]; c.pop() );

            // Calculate the base 10 exponent. First get the number of digits of c[0].
            for ( j = c[0]; j >= 10; j /= 10, i++ );

            // Overflow?
            if ( ( e = i + e * LOG_BASE - 1 ) > MAX_EXP ) {

                // Infinity.
                n.c = n.e = null;

            // Underflow?
            } else if ( e < MIN_EXP ) {

                // Zero.
                n.c = [ n.e = 0 ];
            } else {
                n.e = e;
                n.c = c;
            }

            return n;
        }


        // Handle values that fail the validity test in BigNumber.
        parseNumeric = (function () {
            var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
                dotAfter = /^([^.]+)\.$/,
                dotBefore = /^\.([^.]+)$/,
                isInfinityOrNaN = /^-?(Infinity|NaN)$/,
                whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

            return function ( x, str, num, b ) {
                var base,
                    s = num ? str : str.replace( whitespaceOrPlus, '' );

                // No exception on ±Infinity or NaN.
                if ( isInfinityOrNaN.test(s) ) {
                    x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
                } else {
                    if ( !num ) {

                        // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
                        s = s.replace( basePrefix, function ( m, p1, p2 ) {
                            base = ( p2 = p2.toLowerCase() ) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
                            return !b || b == base ? p1 : m;
                        });

                        if (b) {
                            base = b;

                            // E.g. '1.' to '1', '.1' to '0.1'
                            s = s.replace( dotAfter, '$1' ).replace( dotBefore, '0.$1' );
                        }

                        if ( str != s ) return new BigNumber( s, base );
                    }

                    // 'new BigNumber() not a number: {n}'
                    // 'new BigNumber() not a base {b} number: {n}'
                    if (ERRORS) raise( id, 'not a' + ( b ? ' base ' + b : '' ) + ' number', str );
                    x.s = null;
                }

                x.c = x.e = null;
                id = 0;
            }
        })();


        // Throw a BigNumber Error.
        function raise( caller, msg, val ) {
            var error = new Error( [
                'new BigNumber',     // 0
                'cmp',               // 1
                'config',            // 2
                'div',               // 3
                'divToInt',          // 4
                'eq',                // 5
                'gt',                // 6
                'gte',               // 7
                'lt',                // 8
                'lte',               // 9
                'minus',             // 10
                'mod',               // 11
                'plus',              // 12
                'precision',         // 13
                'random',            // 14
                'round',             // 15
                'shift',             // 16
                'times',             // 17
                'toDigits',          // 18
                'toExponential',     // 19
                'toFixed',           // 20
                'toFormat',          // 21
                'toFraction',        // 22
                'pow',               // 23
                'toPrecision',       // 24
                'toString',          // 25
                'BigNumber'          // 26
            ][caller] + '() ' + msg + ': ' + val );

            error.name = 'BigNumber Error';
            id = 0;
            throw error;
        }


        /*
         * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
         * If r is truthy, it is known that there are more digits after the rounding digit.
         */
        function round( x, sd, rm, r ) {
            var d, i, j, k, n, ni, rd,
                xc = x.c,
                pows10 = POWS_TEN;

            // if x is not Infinity or NaN...
            if (xc) {

                // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
                // n is a base 1e14 number, the value of the element of array x.c containing rd.
                // ni is the index of n within x.c.
                // d is the number of digits of n.
                // i is the index of rd within n including leading zeros.
                // j is the actual index of rd within n (if < 0, rd is a leading zero).
                out: {

                    // Get the number of digits of the first element of xc.
                    for ( d = 1, k = xc[0]; k >= 10; k /= 10, d++ );
                    i = sd - d;

                    // If the rounding digit is in the first element of xc...
                    if ( i < 0 ) {
                        i += LOG_BASE;
                        j = sd;
                        n = xc[ ni = 0 ];

                        // Get the rounding digit at index j of n.
                        rd = n / pows10[ d - j - 1 ] % 10 | 0;
                    } else {
                        ni = mathceil( ( i + 1 ) / LOG_BASE );

                        if ( ni >= xc.length ) {

                            if (r) {

                                // Needed by sqrt.
                                for ( ; xc.length <= ni; xc.push(0) );
                                n = rd = 0;
                                d = 1;
                                i %= LOG_BASE;
                                j = i - LOG_BASE + 1;
                            } else {
                                break out;
                            }
                        } else {
                            n = k = xc[ni];

                            // Get the number of digits of n.
                            for ( d = 1; k >= 10; k /= 10, d++ );

                            // Get the index of rd within n.
                            i %= LOG_BASE;

                            // Get the index of rd within n, adjusted for leading zeros.
                            // The number of leading zeros of n is given by LOG_BASE - d.
                            j = i - LOG_BASE + d;

                            // Get the rounding digit at index j of n.
                            rd = j < 0 ? 0 : n / pows10[ d - j - 1 ] % 10 | 0;
                        }
                    }

                    r = r || sd < 0 ||

                    // Are there any non-zero digits after the rounding digit?
                    // The expression  n % pows10[ d - j - 1 ]  returns all digits of n to the right
                    // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
                      xc[ni + 1] != null || ( j < 0 ? n : n % pows10[ d - j - 1 ] );

                    r = rm < 4
                      ? ( rd || r ) && ( rm == 0 || rm == ( x.s < 0 ? 3 : 2 ) )
                      : rd > 5 || rd == 5 && ( rm == 4 || r || rm == 6 &&

                        // Check whether the digit to the left of the rounding digit is odd.
                        ( ( i > 0 ? j > 0 ? n / pows10[ d - j ] : 0 : xc[ni - 1] ) % 10 ) & 1 ||
                          rm == ( x.s < 0 ? 8 : 7 ) );

                    if ( sd < 1 || !xc[0] ) {
                        xc.length = 0;

                        if (r) {

                            // Convert sd to decimal places.
                            sd -= x.e + 1;

                            // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                            xc[0] = pows10[ ( LOG_BASE - sd % LOG_BASE ) % LOG_BASE ];
                            x.e = -sd || 0;
                        } else {

                            // Zero.
                            xc[0] = x.e = 0;
                        }

                        return x;
                    }

                    // Remove excess digits.
                    if ( i == 0 ) {
                        xc.length = ni;
                        k = 1;
                        ni--;
                    } else {
                        xc.length = ni + 1;
                        k = pows10[ LOG_BASE - i ];

                        // E.g. 56700 becomes 56000 if 7 is the rounding digit.
                        // j > 0 means i > number of leading zeros of n.
                        xc[ni] = j > 0 ? mathfloor( n / pows10[ d - j ] % pows10[j] ) * k : 0;
                    }

                    // Round up?
                    if (r) {

                        for ( ; ; ) {

                            // If the digit to be rounded up is in the first element of xc...
                            if ( ni == 0 ) {

                                // i will be the length of xc[0] before k is added.
                                for ( i = 1, j = xc[0]; j >= 10; j /= 10, i++ );
                                j = xc[0] += k;
                                for ( k = 1; j >= 10; j /= 10, k++ );

                                // if i != k the length has increased.
                                if ( i != k ) {
                                    x.e++;
                                    if ( xc[0] == BASE ) xc[0] = 1;
                                }

                                break;
                            } else {
                                xc[ni] += k;
                                if ( xc[ni] != BASE ) break;
                                xc[ni--] = 0;
                                k = 1;
                            }
                        }
                    }

                    // Remove trailing zeros.
                    for ( i = xc.length; xc[--i] === 0; xc.pop() );
                }

                // Overflow? Infinity.
                if ( x.e > MAX_EXP ) {
                    x.c = x.e = null;

                // Underflow? Zero.
                } else if ( x.e < MIN_EXP ) {
                    x.c = [ x.e = 0 ];
                }
            }

            return x;
        }


        // PROTOTYPE/INSTANCE METHODS


        /*
         * Return a new BigNumber whose value is the absolute value of this BigNumber.
         */
        P.absoluteValue = P.abs = function () {
            var x = new BigNumber(this);
            if ( x.s < 0 ) x.s = 1;
            return x;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber rounded to a whole
         * number in the direction of Infinity.
         */
        P.ceil = function () {
            return round( new BigNumber(this), this.e + 1, 2 );
        };


        /*
         * Return
         * 1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
         * -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
         * 0 if they have the same value,
         * or null if the value of either is NaN.
         */
        P.comparedTo = P.cmp = function ( y, b ) {
            id = 1;
            return compare( this, new BigNumber( y, b ) );
        };


        /*
         * Return the number of decimal places of the value of this BigNumber, or null if the value
         * of this BigNumber is ±Infinity or NaN.
         */
        P.decimalPlaces = P.dp = function () {
            var n, v,
                c = this.c;

            if ( !c ) return null;
            n = ( ( v = c.length - 1 ) - bitFloor( this.e / LOG_BASE ) ) * LOG_BASE;

            // Subtract the number of trailing zeros of the last number.
            if ( v = c[v] ) for ( ; v % 10 == 0; v /= 10, n-- );
            if ( n < 0 ) n = 0;

            return n;
        };


        /*
         *  n / 0 = I
         *  n / N = N
         *  n / I = 0
         *  0 / n = 0
         *  0 / 0 = N
         *  0 / N = N
         *  0 / I = 0
         *  N / n = N
         *  N / 0 = N
         *  N / N = N
         *  N / I = N
         *  I / n = I
         *  I / 0 = I
         *  I / N = N
         *  I / I = N
         *
         * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
         * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
         */
        P.dividedBy = P.div = function ( y, b ) {
            id = 3;
            return div( this, new BigNumber( y, b ), DECIMAL_PLACES, ROUNDING_MODE );
        };


        /*
         * Return a new BigNumber whose value is the integer part of dividing the value of this
         * BigNumber by the value of BigNumber(y, b).
         */
        P.dividedToIntegerBy = P.divToInt = function ( y, b ) {
            id = 4;
            return div( this, new BigNumber( y, b ), 0, 1 );
        };


        /*
         * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
         * otherwise returns false.
         */
        P.equals = P.eq = function ( y, b ) {
            id = 5;
            return compare( this, new BigNumber( y, b ) ) === 0;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber rounded to a whole
         * number in the direction of -Infinity.
         */
        P.floor = function () {
            return round( new BigNumber(this), this.e + 1, 3 );
        };


        /*
         * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
         * otherwise returns false.
         */
        P.greaterThan = P.gt = function ( y, b ) {
            id = 6;
            return compare( this, new BigNumber( y, b ) ) > 0;
        };


        /*
         * Return true if the value of this BigNumber is greater than or equal to the value of
         * BigNumber(y, b), otherwise returns false.
         */
        P.greaterThanOrEqualTo = P.gte = function ( y, b ) {
            id = 7;
            return ( b = compare( this, new BigNumber( y, b ) ) ) === 1 || b === 0;

        };


        /*
         * Return true if the value of this BigNumber is a finite number, otherwise returns false.
         */
        P.isFinite = function () {
            return !!this.c;
        };


        /*
         * Return true if the value of this BigNumber is an integer, otherwise return false.
         */
        P.isInteger = P.isInt = function () {
            return !!this.c && bitFloor( this.e / LOG_BASE ) > this.c.length - 2;
        };


        /*
         * Return true if the value of this BigNumber is NaN, otherwise returns false.
         */
        P.isNaN = function () {
            return !this.s;
        };


        /*
         * Return true if the value of this BigNumber is negative, otherwise returns false.
         */
        P.isNegative = P.isNeg = function () {
            return this.s < 0;
        };


        /*
         * Return true if the value of this BigNumber is 0 or -0, otherwise returns false.
         */
        P.isZero = function () {
            return !!this.c && this.c[0] == 0;
        };


        /*
         * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
         * otherwise returns false.
         */
        P.lessThan = P.lt = function ( y, b ) {
            id = 8;
            return compare( this, new BigNumber( y, b ) ) < 0;
        };


        /*
         * Return true if the value of this BigNumber is less than or equal to the value of
         * BigNumber(y, b), otherwise returns false.
         */
        P.lessThanOrEqualTo = P.lte = function ( y, b ) {
            id = 9;
            return ( b = compare( this, new BigNumber( y, b ) ) ) === -1 || b === 0;
        };


        /*
         *  n - 0 = n
         *  n - N = N
         *  n - I = -I
         *  0 - n = -n
         *  0 - 0 = 0
         *  0 - N = N
         *  0 - I = -I
         *  N - n = N
         *  N - 0 = N
         *  N - N = N
         *  N - I = N
         *  I - n = I
         *  I - 0 = I
         *  I - N = N
         *  I - I = N
         *
         * Return a new BigNumber whose value is the value of this BigNumber minus the value of
         * BigNumber(y, b).
         */
        P.minus = P.sub = function ( y, b ) {
            var i, j, t, xLTy,
                x = this,
                a = x.s;

            id = 10;
            y = new BigNumber( y, b );
            b = y.s;

            // Either NaN?
            if ( !a || !b ) return new BigNumber(NaN);

            // Signs differ?
            if ( a != b ) {
                y.s = -b;
                return x.plus(y);
            }

            var xe = x.e / LOG_BASE,
                ye = y.e / LOG_BASE,
                xc = x.c,
                yc = y.c;

            if ( !xe || !ye ) {

                // Either Infinity?
                if ( !xc || !yc ) return xc ? ( y.s = -b, y ) : new BigNumber( yc ? x : NaN );

                // Either zero?
                if ( !xc[0] || !yc[0] ) {

                    // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
                    return yc[0] ? ( y.s = -b, y ) : new BigNumber( xc[0] ? x :

                      // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
                      ROUNDING_MODE == 3 ? -0 : 0 );
                }
            }

            xe = bitFloor(xe);
            ye = bitFloor(ye);
            xc = xc.slice();

            // Determine which is the bigger number.
            if ( a = xe - ye ) {

                if ( xLTy = a < 0 ) {
                    a = -a;
                    t = xc;
                } else {
                    ye = xe;
                    t = yc;
                }

                t.reverse();

                // Prepend zeros to equalise exponents.
                for ( b = a; b--; t.push(0) );
                t.reverse();
            } else {

                // Exponents equal. Check digit by digit.
                j = ( xLTy = ( a = xc.length ) < ( b = yc.length ) ) ? a : b;

                for ( a = b = 0; b < j; b++ ) {

                    if ( xc[b] != yc[b] ) {
                        xLTy = xc[b] < yc[b];
                        break;
                    }
                }
            }

            // x < y? Point xc to the array of the bigger number.
            if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

            b = ( j = yc.length ) - ( i = xc.length );

            // Append zeros to xc if shorter.
            // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
            if ( b > 0 ) for ( ; b--; xc[i++] = 0 );
            b = BASE - 1;

            // Subtract yc from xc.
            for ( ; j > a; ) {

                if ( xc[--j] < yc[j] ) {
                    for ( i = j; i && !xc[--i]; xc[i] = b );
                    --xc[i];
                    xc[j] += BASE;
                }

                xc[j] -= yc[j];
            }

            // Remove leading zeros and adjust exponent accordingly.
            for ( ; xc[0] == 0; xc.shift(), --ye );

            // Zero?
            if ( !xc[0] ) {

                // Following IEEE 754 (2008) 6.3,
                // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
                y.s = ROUNDING_MODE == 3 ? -1 : 1;
                y.c = [ y.e = 0 ];
                return y;
            }

            // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
            // for finite x and y.
            return normalise( y, xc, ye );
        };


        /*
         *   n % 0 =  N
         *   n % N =  N
         *   n % I =  n
         *   0 % n =  0
         *  -0 % n = -0
         *   0 % 0 =  N
         *   0 % N =  N
         *   0 % I =  0
         *   N % n =  N
         *   N % 0 =  N
         *   N % N =  N
         *   N % I =  N
         *   I % n =  N
         *   I % 0 =  N
         *   I % N =  N
         *   I % I =  N
         *
         * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
         * BigNumber(y, b). The result depends on the value of MODULO_MODE.
         */
        P.modulo = P.mod = function ( y, b ) {
            var q, s,
                x = this;

            id = 11;
            y = new BigNumber( y, b );

            // Return NaN if x is Infinity or NaN, or y is NaN or zero.
            if ( !x.c || !y.s || y.c && !y.c[0] ) {
                return new BigNumber(NaN);

            // Return x if y is Infinity or x is zero.
            } else if ( !y.c || x.c && !x.c[0] ) {
                return new BigNumber(x);
            }

            if ( MODULO_MODE == 9 ) {

                // Euclidian division: q = sign(y) * floor(x / abs(y))
                // r = x - qy    where  0 <= r < abs(y)
                s = y.s;
                y.s = 1;
                q = div( x, y, 0, 3 );
                y.s = s;
                q.s *= s;
            } else {
                q = div( x, y, 0, MODULO_MODE );
            }

            return x.minus( q.times(y) );
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber negated,
         * i.e. multiplied by -1.
         */
        P.negated = P.neg = function () {
            var x = new BigNumber(this);
            x.s = -x.s || null;
            return x;
        };


        /*
         *  n + 0 = n
         *  n + N = N
         *  n + I = I
         *  0 + n = n
         *  0 + 0 = 0
         *  0 + N = N
         *  0 + I = I
         *  N + n = N
         *  N + 0 = N
         *  N + N = N
         *  N + I = N
         *  I + n = I
         *  I + 0 = I
         *  I + N = N
         *  I + I = I
         *
         * Return a new BigNumber whose value is the value of this BigNumber plus the value of
         * BigNumber(y, b).
         */
        P.plus = P.add = function ( y, b ) {
            var t,
                x = this,
                a = x.s;

            id = 12;
            y = new BigNumber( y, b );
            b = y.s;

            // Either NaN?
            if ( !a || !b ) return new BigNumber(NaN);

            // Signs differ?
             if ( a != b ) {
                y.s = -b;
                return x.minus(y);
            }

            var xe = x.e / LOG_BASE,
                ye = y.e / LOG_BASE,
                xc = x.c,
                yc = y.c;

            if ( !xe || !ye ) {

                // Return ±Infinity if either ±Infinity.
                if ( !xc || !yc ) return new BigNumber( a / 0 );

                // Either zero?
                // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
                if ( !xc[0] || !yc[0] ) return yc[0] ? y : new BigNumber( xc[0] ? x : a * 0 );
            }

            xe = bitFloor(xe);
            ye = bitFloor(ye);
            xc = xc.slice();

            // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
            if ( a = xe - ye ) {
                if ( a > 0 ) {
                    ye = xe;
                    t = yc;
                } else {
                    a = -a;
                    t = xc;
                }

                t.reverse();
                for ( ; a--; t.push(0) );
                t.reverse();
            }

            a = xc.length;
            b = yc.length;

            // Point xc to the longer array, and b to the shorter length.
            if ( a - b < 0 ) t = yc, yc = xc, xc = t, b = a;

            // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
            for ( a = 0; b; ) {
                a = ( xc[--b] = xc[b] + yc[b] + a ) / BASE | 0;
                xc[b] %= BASE;
            }

            if (a) {
                xc.unshift(a);
                ++ye;
            }

            // No need to check for zero, as +x + +y != 0 && -x + -y != 0
            // ye = MAX_EXP + 1 possible
            return normalise( y, xc, ye );
        };


        /*
         * Return the number of significant digits of the value of this BigNumber.
         *
         * [z] {boolean|number} Whether to count integer-part trailing zeros: true, false, 1 or 0.
         */
        P.precision = P.sd = function (z) {
            var n, v,
                x = this,
                c = x.c;

            // 'precision() argument not a boolean or binary digit: {z}'
            if ( z != null && z !== !!z && z !== 1 && z !== 0 ) {
                if (ERRORS) raise( 13, 'argument' + notBool, z );
                if ( z != !!z ) z = null;
            }

            if ( !c ) return null;
            v = c.length - 1;
            n = v * LOG_BASE + 1;

            if ( v = c[v] ) {

                // Subtract the number of trailing zeros of the last element.
                for ( ; v % 10 == 0; v /= 10, n-- );

                // Add the number of digits of the first element.
                for ( v = c[0]; v >= 10; v /= 10, n++ );
            }

            if ( z && x.e + 1 > n ) n = x.e + 1;

            return n;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber rounded to a maximum of
         * dp decimal places using rounding mode rm, or to 0 and ROUNDING_MODE respectively if
         * omitted.
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'round() decimal places out of range: {dp}'
         * 'round() decimal places not an integer: {dp}'
         * 'round() rounding mode not an integer: {rm}'
         * 'round() rounding mode out of range: {rm}'
         */
        P.round = function ( dp, rm ) {
            var n = new BigNumber(this);

            if ( dp == null || isValidInt( dp, 0, MAX, 15 ) ) {
                round( n, ~~dp + this.e + 1, rm == null ||
                  !isValidInt( rm, 0, 8, 15, roundingMode ) ? ROUNDING_MODE : rm | 0 );
            }

            return n;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
         * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
         *
         * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
         *
         * If k is out of range and ERRORS is false, the result will be ±0 if k < 0, or ±Infinity
         * otherwise.
         *
         * 'shift() argument not an integer: {k}'
         * 'shift() argument out of range: {k}'
         */
        P.shift = function (k) {
            var n = this;
            return isValidInt( k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER, 16, 'argument' )

              // k < 1e+21, or truncate(k) will produce exponential notation.
              ? n.times( '1e' + truncate(k) )
              : new BigNumber( n.c && n.c[0] && ( k < -MAX_SAFE_INTEGER || k > MAX_SAFE_INTEGER )
                ? n.s * ( k < 0 ? 0 : 1 / 0 )
                : n );
        };


        /*
         *  sqrt(-n) =  N
         *  sqrt( N) =  N
         *  sqrt(-I) =  N
         *  sqrt( I) =  I
         *  sqrt( 0) =  0
         *  sqrt(-0) = -0
         *
         * Return a new BigNumber whose value is the square root of the value of this BigNumber,
         * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
         */
        P.squareRoot = P.sqrt = function () {
            var m, n, r, rep, t,
                x = this,
                c = x.c,
                s = x.s,
                e = x.e,
                dp = DECIMAL_PLACES + 4,
                half = new BigNumber('0.5');

            // Negative/NaN/Infinity/zero?
            if ( s !== 1 || !c || !c[0] ) {
                return new BigNumber( !s || s < 0 && ( !c || c[0] ) ? NaN : c ? x : 1 / 0 );
            }

            // Initial estimate.
            s = Math.sqrt( +x );

            // Math.sqrt underflow/overflow?
            // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
            if ( s == 0 || s == 1 / 0 ) {
                n = coeffToString(c);
                if ( ( n.length + e ) % 2 == 0 ) n += '0';
                s = Math.sqrt(n);
                e = bitFloor( ( e + 1 ) / 2 ) - ( e < 0 || e % 2 );

                if ( s == 1 / 0 ) {
                    n = '1e' + e;
                } else {
                    n = s.toExponential();
                    n = n.slice( 0, n.indexOf('e') + 1 ) + e;
                }

                r = new BigNumber(n);
            } else {
                r = new BigNumber( s + '' );
            }

            // Check for zero.
            // r could be zero if MIN_EXP is changed after the this value was created.
            // This would cause a division by zero (x/t) and hence Infinity below, which would cause
            // coeffToString to throw.
            if ( r.c[0] ) {
                e = r.e;
                s = e + dp;
                if ( s < 3 ) s = 0;

                // Newton-Raphson iteration.
                for ( ; ; ) {
                    t = r;
                    r = half.times( t.plus( div( x, t, dp, 1 ) ) );

                    if ( coeffToString( t.c   ).slice( 0, s ) === ( n =
                         coeffToString( r.c ) ).slice( 0, s ) ) {

                        // The exponent of r may here be one less than the final result exponent,
                        // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
                        // are indexed correctly.
                        if ( r.e < e ) --s;
                        n = n.slice( s - 3, s + 1 );

                        // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
                        // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
                        // iteration.
                        if ( n == '9999' || !rep && n == '4999' ) {

                            // On the first iteration only, check to see if rounding up gives the
                            // exact result as the nines may infinitely repeat.
                            if ( !rep ) {
                                round( t, t.e + DECIMAL_PLACES + 2, 0 );

                                if ( t.times(t).eq(x) ) {
                                    r = t;
                                    break;
                                }
                            }

                            dp += 4;
                            s += 4;
                            rep = 1;
                        } else {

                            // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
                            // result. If not, then there are further digits and m will be truthy.
                            if ( !+n || !+n.slice(1) && n.charAt(0) == '5' ) {

                                // Truncate to the first rounding digit.
                                round( r, r.e + DECIMAL_PLACES + 2, 1 );
                                m = !r.times(r).eq(x);
                            }

                            break;
                        }
                    }
                }
            }

            return round( r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m );
        };


        /*
         *  n * 0 = 0
         *  n * N = N
         *  n * I = I
         *  0 * n = 0
         *  0 * 0 = 0
         *  0 * N = N
         *  0 * I = N
         *  N * n = N
         *  N * 0 = N
         *  N * N = N
         *  N * I = N
         *  I * n = I
         *  I * 0 = N
         *  I * N = N
         *  I * I = I
         *
         * Return a new BigNumber whose value is the value of this BigNumber times the value of
         * BigNumber(y, b).
         */
        P.times = P.mul = function ( y, b ) {
            var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
                base, sqrtBase,
                x = this,
                xc = x.c,
                yc = ( id = 17, y = new BigNumber( y, b ) ).c;

            // Either NaN, ±Infinity or ±0?
            if ( !xc || !yc || !xc[0] || !yc[0] ) {

                // Return NaN if either is NaN, or one is 0 and the other is Infinity.
                if ( !x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc ) {
                    y.c = y.e = y.s = null;
                } else {
                    y.s *= x.s;

                    // Return ±Infinity if either is ±Infinity.
                    if ( !xc || !yc ) {
                        y.c = y.e = null;

                    // Return ±0 if either is ±0.
                    } else {
                        y.c = [0];
                        y.e = 0;
                    }
                }

                return y;
            }

            e = bitFloor( x.e / LOG_BASE ) + bitFloor( y.e / LOG_BASE );
            y.s *= x.s;
            xcL = xc.length;
            ycL = yc.length;

            // Ensure xc points to longer array and xcL to its length.
            if ( xcL < ycL ) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

            // Initialise the result array with zeros.
            for ( i = xcL + ycL, zc = []; i--; zc.push(0) );

            base = BASE;
            sqrtBase = SQRT_BASE;

            for ( i = ycL; --i >= 0; ) {
                c = 0;
                ylo = yc[i] % sqrtBase;
                yhi = yc[i] / sqrtBase | 0;

                for ( k = xcL, j = i + k; j > i; ) {
                    xlo = xc[--k] % sqrtBase;
                    xhi = xc[k] / sqrtBase | 0;
                    m = yhi * xlo + xhi * ylo;
                    xlo = ylo * xlo + ( ( m % sqrtBase ) * sqrtBase ) + zc[j] + c;
                    c = ( xlo / base | 0 ) + ( m / sqrtBase | 0 ) + yhi * xhi;
                    zc[j--] = xlo % base;
                }

                zc[j] = c;
            }

            if (c) {
                ++e;
            } else {
                zc.shift();
            }

            return normalise( y, zc, e );
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber rounded to a maximum of
         * sd significant digits using rounding mode rm, or ROUNDING_MODE if rm is omitted.
         *
         * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toDigits() precision out of range: {sd}'
         * 'toDigits() precision not an integer: {sd}'
         * 'toDigits() rounding mode not an integer: {rm}'
         * 'toDigits() rounding mode out of range: {rm}'
         */
        P.toDigits = function ( sd, rm ) {
            var n = new BigNumber(this);
            sd = sd == null || !isValidInt( sd, 1, MAX, 18, 'precision' ) ? null : sd | 0;
            rm = rm == null || !isValidInt( rm, 0, 8, 18, roundingMode ) ? ROUNDING_MODE : rm | 0;
            return sd ? round( n, sd, rm ) : n;
        };


        /*
         * Return a string representing the value of this BigNumber in exponential notation and
         * rounded using ROUNDING_MODE to dp fixed decimal places.
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toExponential() decimal places not an integer: {dp}'
         * 'toExponential() decimal places out of range: {dp}'
         * 'toExponential() rounding mode not an integer: {rm}'
         * 'toExponential() rounding mode out of range: {rm}'
         */
        P.toExponential = function ( dp, rm ) {
            return format( this,
              dp != null && isValidInt( dp, 0, MAX, 19 ) ? ~~dp + 1 : null, rm, 19 );
        };


        /*
         * Return a string representing the value of this BigNumber in fixed-point notation rounding
         * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
         *
         * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
         * but e.g. (-0.00001).toFixed(0) is '-0'.
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toFixed() decimal places not an integer: {dp}'
         * 'toFixed() decimal places out of range: {dp}'
         * 'toFixed() rounding mode not an integer: {rm}'
         * 'toFixed() rounding mode out of range: {rm}'
         */
        P.toFixed = function ( dp, rm ) {
            return format( this, dp != null && isValidInt( dp, 0, MAX, 20 )
              ? ~~dp + this.e + 1 : null, rm, 20 );
        };


        /*
         * Return a string representing the value of this BigNumber in fixed-point notation rounded
         * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
         * of the FORMAT object (see BigNumber.config).
         *
         * FORMAT = {
         *      decimalSeparator : '.',
         *      groupSeparator : ',',
         *      groupSize : 3,
         *      secondaryGroupSize : 0,
         *      fractionGroupSeparator : '\xA0',    // non-breaking space
         *      fractionGroupSize : 0
         * };
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toFormat() decimal places not an integer: {dp}'
         * 'toFormat() decimal places out of range: {dp}'
         * 'toFormat() rounding mode not an integer: {rm}'
         * 'toFormat() rounding mode out of range: {rm}'
         */
        P.toFormat = function ( dp, rm ) {
            var str = format( this, dp != null && isValidInt( dp, 0, MAX, 21 )
              ? ~~dp + this.e + 1 : null, rm, 21 );

            if ( this.c ) {
                var i,
                    arr = str.split('.'),
                    g1 = +FORMAT.groupSize,
                    g2 = +FORMAT.secondaryGroupSize,
                    groupSeparator = FORMAT.groupSeparator,
                    intPart = arr[0],
                    fractionPart = arr[1],
                    isNeg = this.s < 0,
                    intDigits = isNeg ? intPart.slice(1) : intPart,
                    len = intDigits.length;

                if (g2) i = g1, g1 = g2, g2 = i, len -= i;

                if ( g1 > 0 && len > 0 ) {
                    i = len % g1 || g1;
                    intPart = intDigits.substr( 0, i );

                    for ( ; i < len; i += g1 ) {
                        intPart += groupSeparator + intDigits.substr( i, g1 );
                    }

                    if ( g2 > 0 ) intPart += groupSeparator + intDigits.slice(i);
                    if (isNeg) intPart = '-' + intPart;
                }

                str = fractionPart
                  ? intPart + FORMAT.decimalSeparator + ( ( g2 = +FORMAT.fractionGroupSize )
                    ? fractionPart.replace( new RegExp( '\\d{' + g2 + '}\\B', 'g' ),
                      '$&' + FORMAT.fractionGroupSeparator )
                    : fractionPart )
                  : intPart;
            }

            return str;
        };


        /*
         * Return a string array representing the value of this BigNumber as a simple fraction with
         * an integer numerator and an integer denominator. The denominator will be a positive
         * non-zero value less than or equal to the specified maximum denominator. If a maximum
         * denominator is not specified, the denominator will be the lowest value necessary to
         * represent the number exactly.
         *
         * [md] {number|string|BigNumber} Integer >= 1 and < Infinity. The maximum denominator.
         *
         * 'toFraction() max denominator not an integer: {md}'
         * 'toFraction() max denominator out of range: {md}'
         */
        P.toFraction = function (md) {
            var arr, d0, d2, e, exp, n, n0, q, s,
                k = ERRORS,
                x = this,
                xc = x.c,
                d = new BigNumber(ONE),
                n1 = d0 = new BigNumber(ONE),
                d1 = n0 = new BigNumber(ONE);

            if ( md != null ) {
                ERRORS = false;
                n = new BigNumber(md);
                ERRORS = k;

                if ( !( k = n.isInt() ) || n.lt(ONE) ) {

                    if (ERRORS) {
                        raise( 22,
                          'max denominator ' + ( k ? 'out of range' : 'not an integer' ), md );
                    }

                    // ERRORS is false:
                    // If md is a finite non-integer >= 1, round it to an integer and use it.
                    md = !k && n.c && round( n, n.e + 1, 1 ).gte(ONE) ? n : null;
                }
            }

            if ( !xc ) return x.toString();
            s = coeffToString(xc);

            // Determine initial denominator.
            // d is a power of 10 and the minimum max denominator that specifies the value exactly.
            e = d.e = s.length - x.e - 1;
            d.c[0] = POWS_TEN[ ( exp = e % LOG_BASE ) < 0 ? LOG_BASE + exp : exp ];
            md = !md || n.cmp(d) > 0 ? ( e > 0 ? d : n1 ) : n;

            exp = MAX_EXP;
            MAX_EXP = 1 / 0;
            n = new BigNumber(s);

            // n0 = d1 = 0
            n0.c[0] = 0;

            for ( ; ; )  {
                q = div( n, d, 0, 1 );
                d2 = d0.plus( q.times(d1) );
                if ( d2.cmp(md) == 1 ) break;
                d0 = d1;
                d1 = d2;
                n1 = n0.plus( q.times( d2 = n1 ) );
                n0 = d2;
                d = n.minus( q.times( d2 = d ) );
                n = d2;
            }

            d2 = div( md.minus(d0), d1, 0, 1 );
            n0 = n0.plus( d2.times(n1) );
            d0 = d0.plus( d2.times(d1) );
            n0.s = n1.s = x.s;
            e *= 2;

            // Determine which fraction is closer to x, n0/d0 or n1/d1
            arr = div( n1, d1, e, ROUNDING_MODE ).minus(x).abs().cmp(
                  div( n0, d0, e, ROUNDING_MODE ).minus(x).abs() ) < 1
                    ? [ n1.toString(), d1.toString() ]
                    : [ n0.toString(), d0.toString() ];

            MAX_EXP = exp;
            return arr;
        };


        /*
         * Return the value of this BigNumber converted to a number primitive.
         */
        P.toNumber = function () {
            return +this;
        };


        /*
         * Return a BigNumber whose value is the value of this BigNumber raised to the power n.
         * If m is present, return the result modulo m.
         * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
         * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using
         * ROUNDING_MODE.
         *
         * The modular power operation works efficiently when x, n, and m are positive integers,
         * otherwise it is equivalent to calculating x.toPower(n).modulo(m) (with POW_PRECISION 0).
         *
         * n {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
         * [m] {number|string|BigNumber} The modulus.
         *
         * 'pow() exponent not an integer: {n}'
         * 'pow() exponent out of range: {n}'
         *
         * Performs 54 loop iterations for n of 9007199254740991.
         */
        P.toPower = P.pow = function ( n, m ) {
            var k, y, z,
                i = mathfloor( n < 0 ? -n : +n ),
                x = this;

            if ( m != null ) {
                id = 23;
                m = new BigNumber(m);
            }

            // Pass ±Infinity to Math.pow if exponent is out of range.
            if ( !isValidInt( n, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER, 23, 'exponent' ) &&
              ( !isFinite(n) || i > MAX_SAFE_INTEGER && ( n /= 0 ) ||
                parseFloat(n) != n && !( n = NaN ) ) || n == 0 ) {
                k = Math.pow( +x, n );
                return new BigNumber( m ? k % m : k );
            }

            if (m) {
                if ( n > 1 && x.gt(ONE) && x.isInt() && m.gt(ONE) && m.isInt() ) {
                    x = x.mod(m);
                } else {
                    z = m;

                    // Nullify m so only a single mod operation is performed at the end.
                    m = null;
                }
            } else if (POW_PRECISION) {

                // Truncating each coefficient array to a length of k after each multiplication
                // equates to truncating significant digits to POW_PRECISION + [28, 41],
                // i.e. there will be a minimum of 28 guard digits retained.
                // (Using + 1.5 would give [9, 21] guard digits.)
                k = mathceil( POW_PRECISION / LOG_BASE + 2 );
            }

            y = new BigNumber(ONE);

            for ( ; ; ) {
                if ( i % 2 ) {
                    y = y.times(x);
                    if ( !y.c ) break;
                    if (k) {
                        if ( y.c.length > k ) y.c.length = k;
                    } else if (m) {
                        y = y.mod(m);
                    }
                }

                i = mathfloor( i / 2 );
                if ( !i ) break;
                x = x.times(x);
                if (k) {
                    if ( x.c && x.c.length > k ) x.c.length = k;
                } else if (m) {
                    x = x.mod(m);
                }
            }

            if (m) return y;
            if ( n < 0 ) y = ONE.div(y);

            return z ? y.mod(z) : k ? round( y, POW_PRECISION, ROUNDING_MODE ) : y;
        };


        /*
         * Return a string representing the value of this BigNumber rounded to sd significant digits
         * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
         * necessary to represent the integer part of the value in fixed-point notation, then use
         * exponential notation.
         *
         * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toPrecision() precision not an integer: {sd}'
         * 'toPrecision() precision out of range: {sd}'
         * 'toPrecision() rounding mode not an integer: {rm}'
         * 'toPrecision() rounding mode out of range: {rm}'
         */
        P.toPrecision = function ( sd, rm ) {
            return format( this, sd != null && isValidInt( sd, 1, MAX, 24, 'precision' )
              ? sd | 0 : null, rm, 24 );
        };


        /*
         * Return a string representing the value of this BigNumber in base b, or base 10 if b is
         * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
         * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
         * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
         * TO_EXP_NEG, return exponential notation.
         *
         * [b] {number} Integer, 2 to 64 inclusive.
         *
         * 'toString() base not an integer: {b}'
         * 'toString() base out of range: {b}'
         */
        P.toString = function (b) {
            var str,
                n = this,
                s = n.s,
                e = n.e;

            // Infinity or NaN?
            if ( e === null ) {

                if (s) {
                    str = 'Infinity';
                    if ( s < 0 ) str = '-' + str;
                } else {
                    str = 'NaN';
                }
            } else {
                str = coeffToString( n.c );

                if ( b == null || !isValidInt( b, 2, 64, 25, 'base' ) ) {
                    str = e <= TO_EXP_NEG || e >= TO_EXP_POS
                      ? toExponential( str, e )
                      : toFixedPoint( str, e );
                } else {
                    str = convertBase( toFixedPoint( str, e ), b | 0, 10, s );
                }

                if ( s < 0 && n.c[0] ) str = '-' + str;
            }

            return str;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber truncated to a whole
         * number.
         */
        P.truncated = P.trunc = function () {
            return round( new BigNumber(this), this.e + 1, 1 );
        };



        /*
         * Return as toString, but do not accept a base argument, and include the minus sign for
         * negative zero.
         */
        P.valueOf = P.toJSON = function () {
            var str,
                n = this,
                e = n.e;

            if ( e === null ) return n.toString();

            str = coeffToString( n.c );

            str = e <= TO_EXP_NEG || e >= TO_EXP_POS
                ? toExponential( str, e )
                : toFixedPoint( str, e );

            return n.s < 0 ? '-' + str : str;
        };


        // Aliases for BigDecimal methods.
        //P.add = P.plus;         // P.add included above
        //P.subtract = P.minus;   // P.sub included above
        //P.multiply = P.times;   // P.mul included above
        //P.divide = P.div;
        //P.remainder = P.mod;
        //P.compareTo = P.cmp;
        //P.negate = P.neg;


        if ( configObj != null ) BigNumber.config(configObj);

        return BigNumber;
    }


    // PRIVATE HELPER FUNCTIONS


    function bitFloor(n) {
        var i = n | 0;
        return n > 0 || n === i ? i : i - 1;
    }


    // Return a coefficient array as a string of base 10 digits.
    function coeffToString(a) {
        var s, z,
            i = 1,
            j = a.length,
            r = a[0] + '';

        for ( ; i < j; ) {
            s = a[i++] + '';
            z = LOG_BASE - s.length;
            for ( ; z--; s = '0' + s );
            r += s;
        }

        // Determine trailing zeros.
        for ( j = r.length; r.charCodeAt(--j) === 48; );
        return r.slice( 0, j + 1 || 1 );
    }


    // Compare the value of BigNumbers x and y.
    function compare( x, y ) {
        var a, b,
            xc = x.c,
            yc = y.c,
            i = x.s,
            j = y.s,
            k = x.e,
            l = y.e;

        // Either NaN?
        if ( !i || !j ) return null;

        a = xc && !xc[0];
        b = yc && !yc[0];

        // Either zero?
        if ( a || b ) return a ? b ? 0 : -j : i;

        // Signs differ?
        if ( i != j ) return i;

        a = i < 0;
        b = k == l;

        // Either Infinity?
        if ( !xc || !yc ) return b ? 0 : !xc ^ a ? 1 : -1;

        // Compare exponents.
        if ( !b ) return k > l ^ a ? 1 : -1;

        j = ( k = xc.length ) < ( l = yc.length ) ? k : l;

        // Compare digit by digit.
        for ( i = 0; i < j; i++ ) if ( xc[i] != yc[i] ) return xc[i] > yc[i] ^ a ? 1 : -1;

        // Compare lengths.
        return k == l ? 0 : k > l ^ a ? 1 : -1;
    }


    /*
     * Return true if n is a valid number in range, otherwise false.
     * Use for argument validation when ERRORS is false.
     * Note: parseInt('1e+1') == 1 but parseFloat('1e+1') == 10.
     */
    function intValidatorNoErrors( n, min, max ) {
        return ( n = truncate(n) ) >= min && n <= max;
    }


    function isArray(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    }


    /*
     * Convert string of baseIn to an array of numbers of baseOut.
     * Eg. convertBase('255', 10, 16) returns [15, 15].
     * Eg. convertBase('ff', 16, 10) returns [2, 5, 5].
     */
    function toBaseOut( str, baseIn, baseOut ) {
        var j,
            arr = [0],
            arrL,
            i = 0,
            len = str.length;

        for ( ; i < len; ) {
            for ( arrL = arr.length; arrL--; arr[arrL] *= baseIn );
            arr[ j = 0 ] += ALPHABET.indexOf( str.charAt( i++ ) );

            for ( ; j < arr.length; j++ ) {

                if ( arr[j] > baseOut - 1 ) {
                    if ( arr[j + 1] == null ) arr[j + 1] = 0;
                    arr[j + 1] += arr[j] / baseOut | 0;
                    arr[j] %= baseOut;
                }
            }
        }

        return arr.reverse();
    }


    function toExponential( str, e ) {
        return ( str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str ) +
          ( e < 0 ? 'e' : 'e+' ) + e;
    }


    function toFixedPoint( str, e ) {
        var len, z;

        // Negative exponent?
        if ( e < 0 ) {

            // Prepend zeros.
            for ( z = '0.'; ++e; z += '0' );
            str = z + str;

        // Positive exponent
        } else {
            len = str.length;

            // Append zeros.
            if ( ++e > len ) {
                for ( z = '0', e -= len; --e; z += '0' );
                str += z;
            } else if ( e < len ) {
                str = str.slice( 0, e ) + '.' + str.slice(e);
            }
        }

        return str;
    }


    function truncate(n) {
        n = parseFloat(n);
        return n < 0 ? mathceil(n) : mathfloor(n);
    }


    // EXPORT


    BigNumber = constructorFactory();
    BigNumber.default = BigNumber.BigNumber = BigNumber;


    // AMD.
    if ( typeof define == 'function' && define.amd ) {
        define( function () { return BigNumber; } );

    // Node.js and other environments that support module.exports.
    } else if ( typeof module != 'undefined' && module.exports ) {
        module.exports = BigNumber;

        // Split string stops browserify adding crypto shim.
        if ( !cryptoObj ) try { cryptoObj = require('cry' + 'pto'); } catch (e) {}

    // Browser.
    } else {
        if ( !globalObj ) globalObj = typeof self != 'undefined' ? self : Function('return this')();
        globalObj.BigNumber = BigNumber;
    }
})(this);

/*! URI.js v1.18.1 http://medialize.github.io/URI.js/ */
/* build contains: IPv6.js, punycode.js, SecondLevelDomains.js, URI.js */
(function(k,n){"object"===typeof exports?module.exports=n():"function"===typeof define&&define.amd?define(n):k.IPv6=n(k)})(this,function(k){var n=k&&k.IPv6;return{best:function(g){g=g.toLowerCase().split(":");var f=g.length,d=8;""===g[0]&&""===g[1]&&""===g[2]?(g.shift(),g.shift()):""===g[0]&&""===g[1]?g.shift():""===g[f-1]&&""===g[f-2]&&g.pop();f=g.length;-1!==g[f-1].indexOf(".")&&(d=7);var h;for(h=0;h<f&&""!==g[h];h++);if(h<d)for(g.splice(h,1,"0000");g.length<d;)g.splice(h,0,"0000");for(h=0;h<d;h++){for(var f=
g[h].split(""),k=0;3>k;k++)if("0"===f[0]&&1<f.length)f.splice(0,1);else break;g[h]=f.join("")}var f=-1,p=k=0,n=-1,u=!1;for(h=0;h<d;h++)u?"0"===g[h]?p+=1:(u=!1,p>k&&(f=n,k=p)):"0"===g[h]&&(u=!0,n=h,p=1);p>k&&(f=n,k=p);1<k&&g.splice(f,k,"");f=g.length;d="";""===g[0]&&(d=":");for(h=0;h<f;h++){d+=g[h];if(h===f-1)break;d+=":"}""===g[f-1]&&(d+=":");return d},noConflict:function(){k.IPv6===this&&(k.IPv6=n);return this}}});
(function(k){function n(d){throw new RangeError(e[d]);}function g(d,e){for(var f=d.length,h=[];f--;)h[f]=e(d[f]);return h}function f(d,e){var f=d.split("@"),h="";1<f.length&&(h=f[0]+"@",d=f[1]);d=d.replace(H,".");f=d.split(".");f=g(f,e).join(".");return h+f}function d(d){for(var e=[],f=0,h=d.length,g,a;f<h;)g=d.charCodeAt(f++),55296<=g&&56319>=g&&f<h?(a=d.charCodeAt(f++),56320==(a&64512)?e.push(((g&1023)<<10)+(a&1023)+65536):(e.push(g),f--)):e.push(g);return e}function h(d){return g(d,function(d){var e=
"";65535<d&&(d-=65536,e+=t(d>>>10&1023|55296),d=56320|d&1023);return e+=t(d)}).join("")}function w(d,e){return d+22+75*(26>d)-((0!=e)<<5)}function p(d,e,f){var h=0;d=f?r(d/700):d>>1;for(d+=r(d/e);455<d;h+=36)d=r(d/35);return r(h+36*d/(d+38))}function D(d){var e=[],f=d.length,g,k=0,a=128,b=72,c,l,m,q,y;c=d.lastIndexOf("-");0>c&&(c=0);for(l=0;l<c;++l)128<=d.charCodeAt(l)&&n("not-basic"),e.push(d.charCodeAt(l));for(c=0<c?c+1:0;c<f;){l=k;g=1;for(m=36;;m+=36){c>=f&&n("invalid-input");q=d.charCodeAt(c++);
q=10>q-48?q-22:26>q-65?q-65:26>q-97?q-97:36;(36<=q||q>r((2147483647-k)/g))&&n("overflow");k+=q*g;y=m<=b?1:m>=b+26?26:m-b;if(q<y)break;q=36-y;g>r(2147483647/q)&&n("overflow");g*=q}g=e.length+1;b=p(k-l,g,0==l);r(k/g)>2147483647-a&&n("overflow");a+=r(k/g);k%=g;e.splice(k++,0,a)}return h(e)}function u(e){var f,g,h,k,a,b,c,l,m,q=[],y,E,I;e=d(e);y=e.length;f=128;g=0;a=72;for(b=0;b<y;++b)m=e[b],128>m&&q.push(t(m));for((h=k=q.length)&&q.push("-");h<y;){c=2147483647;for(b=0;b<y;++b)m=e[b],m>=f&&m<c&&(c=m);
E=h+1;c-f>r((2147483647-g)/E)&&n("overflow");g+=(c-f)*E;f=c;for(b=0;b<y;++b)if(m=e[b],m<f&&2147483647<++g&&n("overflow"),m==f){l=g;for(c=36;;c+=36){m=c<=a?1:c>=a+26?26:c-a;if(l<m)break;I=l-m;l=36-m;q.push(t(w(m+I%l,0)));l=r(I/l)}q.push(t(w(l,0)));a=p(g,E,h==k);g=0;++h}++g;++f}return q.join("")}var B="object"==typeof exports&&exports&&!exports.nodeType&&exports,C="object"==typeof module&&module&&!module.nodeType&&module,z="object"==typeof global&&global;if(z.global===z||z.window===z||z.self===z)k=
z;var v,A=/^xn--/,F=/[^\x20-\x7E]/,H=/[\x2E\u3002\uFF0E\uFF61]/g,e={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},r=Math.floor,t=String.fromCharCode,x;v={version:"1.3.2",ucs2:{decode:d,encode:h},decode:D,encode:u,toASCII:function(d){return f(d,function(d){return F.test(d)?"xn--"+u(d):d})},toUnicode:function(d){return f(d,function(d){return A.test(d)?D(d.slice(4).toLowerCase()):d})}};if("function"==
typeof define&&"object"==typeof define.amd&&define.amd)define("punycode",function(){return v});else if(B&&C)if(module.exports==B)C.exports=v;else for(x in v)v.hasOwnProperty(x)&&(B[x]=v[x]);else k.punycode=v})(this);
(function(k,n){"object"===typeof exports?module.exports=n():"function"===typeof define&&define.amd?define(n):k.SecondLevelDomains=n(k)})(this,function(k){var n=k&&k.SecondLevelDomains,g={list:{ac:" com gov mil net org ",ae:" ac co gov mil name net org pro sch ",af:" com edu gov net org ",al:" com edu gov mil net org ",ao:" co ed gv it og pb ",ar:" com edu gob gov int mil net org tur ",at:" ac co gv or ",au:" asn com csiro edu gov id net org ",ba:" co com edu gov mil net org rs unbi unmo unsa untz unze ",
bb:" biz co com edu gov info net org store tv ",bh:" biz cc com edu gov info net org ",bn:" com edu gov net org ",bo:" com edu gob gov int mil net org tv ",br:" adm adv agr am arq art ato b bio blog bmd cim cng cnt com coop ecn edu eng esp etc eti far flog fm fnd fot fst g12 ggf gov imb ind inf jor jus lel mat med mil mus net nom not ntr odo org ppg pro psc psi qsl rec slg srv tmp trd tur tv vet vlog wiki zlg ",bs:" com edu gov net org ",bz:" du et om ov rg ",ca:" ab bc mb nb nf nl ns nt nu on pe qc sk yk ",
ck:" biz co edu gen gov info net org ",cn:" ac ah bj com cq edu fj gd gov gs gx gz ha hb he hi hl hn jl js jx ln mil net nm nx org qh sc sd sh sn sx tj tw xj xz yn zj ",co:" com edu gov mil net nom org ",cr:" ac c co ed fi go or sa ",cy:" ac biz com ekloges gov ltd name net org parliament press pro tm ","do":" art com edu gob gov mil net org sld web ",dz:" art asso com edu gov net org pol ",ec:" com edu fin gov info med mil net org pro ",eg:" com edu eun gov mil name net org sci ",er:" com edu gov ind mil net org rochest w ",
es:" com edu gob nom org ",et:" biz com edu gov info name net org ",fj:" ac biz com info mil name net org pro ",fk:" ac co gov net nom org ",fr:" asso com f gouv nom prd presse tm ",gg:" co net org ",gh:" com edu gov mil org ",gn:" ac com gov net org ",gr:" com edu gov mil net org ",gt:" com edu gob ind mil net org ",gu:" com edu gov net org ",hk:" com edu gov idv net org ",hu:" 2000 agrar bolt casino city co erotica erotika film forum games hotel info ingatlan jogasz konyvelo lakas media news org priv reklam sex shop sport suli szex tm tozsde utazas video ",
id:" ac co go mil net or sch web ",il:" ac co gov idf k12 muni net org ","in":" ac co edu ernet firm gen gov i ind mil net nic org res ",iq:" com edu gov i mil net org ",ir:" ac co dnssec gov i id net org sch ",it:" edu gov ",je:" co net org ",jo:" com edu gov mil name net org sch ",jp:" ac ad co ed go gr lg ne or ",ke:" ac co go info me mobi ne or sc ",kh:" com edu gov mil net org per ",ki:" biz com de edu gov info mob net org tel ",km:" asso com coop edu gouv k medecin mil nom notaires pharmaciens presse tm veterinaire ",
kn:" edu gov net org ",kr:" ac busan chungbuk chungnam co daegu daejeon es gangwon go gwangju gyeongbuk gyeonggi gyeongnam hs incheon jeju jeonbuk jeonnam k kg mil ms ne or pe re sc seoul ulsan ",kw:" com edu gov net org ",ky:" com edu gov net org ",kz:" com edu gov mil net org ",lb:" com edu gov net org ",lk:" assn com edu gov grp hotel int ltd net ngo org sch soc web ",lr:" com edu gov net org ",lv:" asn com conf edu gov id mil net org ",ly:" com edu gov id med net org plc sch ",ma:" ac co gov m net org press ",
mc:" asso tm ",me:" ac co edu gov its net org priv ",mg:" com edu gov mil nom org prd tm ",mk:" com edu gov inf name net org pro ",ml:" com edu gov net org presse ",mn:" edu gov org ",mo:" com edu gov net org ",mt:" com edu gov net org ",mv:" aero biz com coop edu gov info int mil museum name net org pro ",mw:" ac co com coop edu gov int museum net org ",mx:" com edu gob net org ",my:" com edu gov mil name net org sch ",nf:" arts com firm info net other per rec store web ",ng:" biz com edu gov mil mobi name net org sch ",
ni:" ac co com edu gob mil net nom org ",np:" com edu gov mil net org ",nr:" biz com edu gov info net org ",om:" ac biz co com edu gov med mil museum net org pro sch ",pe:" com edu gob mil net nom org sld ",ph:" com edu gov i mil net ngo org ",pk:" biz com edu fam gob gok gon gop gos gov net org web ",pl:" art bialystok biz com edu gda gdansk gorzow gov info katowice krakow lodz lublin mil net ngo olsztyn org poznan pwr radom slupsk szczecin torun warszawa waw wroc wroclaw zgora ",pr:" ac biz com edu est gov info isla name net org pro prof ",
ps:" com edu gov net org plo sec ",pw:" belau co ed go ne or ",ro:" arts com firm info nom nt org rec store tm www ",rs:" ac co edu gov in org ",sb:" com edu gov net org ",sc:" com edu gov net org ",sh:" co com edu gov net nom org ",sl:" com edu gov net org ",st:" co com consulado edu embaixada gov mil net org principe saotome store ",sv:" com edu gob org red ",sz:" ac co org ",tr:" av bbs bel biz com dr edu gen gov info k12 name net org pol tel tsk tv web ",tt:" aero biz cat co com coop edu gov info int jobs mil mobi museum name net org pro tel travel ",
tw:" club com ebiz edu game gov idv mil net org ",mu:" ac co com gov net or org ",mz:" ac co edu gov org ",na:" co com ",nz:" ac co cri geek gen govt health iwi maori mil net org parliament school ",pa:" abo ac com edu gob ing med net nom org sld ",pt:" com edu gov int net nome org publ ",py:" com edu gov mil net org ",qa:" com edu gov mil net org ",re:" asso com nom ",ru:" ac adygeya altai amur arkhangelsk astrakhan bashkiria belgorod bir bryansk buryatia cbg chel chelyabinsk chita chukotka chuvashia com dagestan e-burg edu gov grozny int irkutsk ivanovo izhevsk jar joshkar-ola kalmykia kaluga kamchatka karelia kazan kchr kemerovo khabarovsk khakassia khv kirov koenig komi kostroma kranoyarsk kuban kurgan kursk lipetsk magadan mari mari-el marine mil mordovia mosreg msk murmansk nalchik net nnov nov novosibirsk nsk omsk orenburg org oryol penza perm pp pskov ptz rnd ryazan sakhalin samara saratov simbirsk smolensk spb stavropol stv surgut tambov tatarstan tom tomsk tsaritsyn tsk tula tuva tver tyumen udm udmurtia ulan-ude vladikavkaz vladimir vladivostok volgograd vologda voronezh vrn vyatka yakutia yamal yekaterinburg yuzhno-sakhalinsk ",
rw:" ac co com edu gouv gov int mil net ",sa:" com edu gov med net org pub sch ",sd:" com edu gov info med net org tv ",se:" a ac b bd c d e f g h i k l m n o org p parti pp press r s t tm u w x y z ",sg:" com edu gov idn net org per ",sn:" art com edu gouv org perso univ ",sy:" com edu gov mil net news org ",th:" ac co go in mi net or ",tj:" ac biz co com edu go gov info int mil name net nic org test web ",tn:" agrinet com defense edunet ens fin gov ind info intl mincom nat net org perso rnrt rns rnu tourism ",
tz:" ac co go ne or ",ua:" biz cherkassy chernigov chernovtsy ck cn co com crimea cv dn dnepropetrovsk donetsk dp edu gov if in ivano-frankivsk kh kharkov kherson khmelnitskiy kiev kirovograd km kr ks kv lg lugansk lutsk lviv me mk net nikolaev od odessa org pl poltava pp rovno rv sebastopol sumy te ternopil uzhgorod vinnica vn zaporizhzhe zhitomir zp zt ",ug:" ac co go ne or org sc ",uk:" ac bl british-library co cym gov govt icnet jet lea ltd me mil mod national-library-scotland nel net nhs nic nls org orgn parliament plc police sch scot soc ",
us:" dni fed isa kids nsn ",uy:" com edu gub mil net org ",ve:" co com edu gob info mil net org web ",vi:" co com k12 net org ",vn:" ac biz com edu gov health info int name net org pro ",ye:" co com gov ltd me net org plc ",yu:" ac co edu gov org ",za:" ac agric alt bourse city co cybernet db edu gov grondar iaccess imt inca landesign law mil net ngo nis nom olivetti org pix school tm web ",zm:" ac co com edu gov net org sch "},has:function(f){var d=f.lastIndexOf(".");if(0>=d||d>=f.length-1)return!1;
var h=f.lastIndexOf(".",d-1);if(0>=h||h>=d-1)return!1;var k=g.list[f.slice(d+1)];return k?0<=k.indexOf(" "+f.slice(h+1,d)+" "):!1},is:function(f){var d=f.lastIndexOf(".");if(0>=d||d>=f.length-1||0<=f.lastIndexOf(".",d-1))return!1;var h=g.list[f.slice(d+1)];return h?0<=h.indexOf(" "+f.slice(0,d)+" "):!1},get:function(f){var d=f.lastIndexOf(".");if(0>=d||d>=f.length-1)return null;var h=f.lastIndexOf(".",d-1);if(0>=h||h>=d-1)return null;var k=g.list[f.slice(d+1)];return!k||0>k.indexOf(" "+f.slice(h+
1,d)+" ")?null:f.slice(h+1)},noConflict:function(){k.SecondLevelDomains===this&&(k.SecondLevelDomains=n);return this}};return g});
(function(k,n){"object"===typeof exports?module.exports=n(require("./punycode"),require("./IPv6"),require("./SecondLevelDomains")):"function"===typeof define&&define.amd?define(["./punycode","./IPv6","./SecondLevelDomains"],n):k.URI=n(k.punycode,k.IPv6,k.SecondLevelDomains,k)})(this,function(k,n,g,f){function d(a,b){var c=1<=arguments.length,l=2<=arguments.length;if(!(this instanceof d))return c?l?new d(a,b):new d(a):new d;if(void 0===a){if(c)throw new TypeError("undefined is not a valid argument for URI");
a="undefined"!==typeof location?location.href+"":""}this.href(a);return void 0!==b?this.absoluteTo(b):this}function h(a){return a.replace(/([.*+?^=!:${}()|[\]\/\\])/g,"\\$1")}function w(a){return void 0===a?"Undefined":String(Object.prototype.toString.call(a)).slice(8,-1)}function p(a){return"Array"===w(a)}function D(a,b){var c={},d,m;if("RegExp"===w(b))c=null;else if(p(b))for(d=0,m=b.length;d<m;d++)c[b[d]]=!0;else c[b]=!0;d=0;for(m=a.length;d<m;d++)if(c&&void 0!==c[a[d]]||!c&&b.test(a[d]))a.splice(d,
1),m--,d--;return a}function u(a,b){var c,d;if(p(b)){c=0;for(d=b.length;c<d;c++)if(!u(a,b[c]))return!1;return!0}var m=w(b);c=0;for(d=a.length;c<d;c++)if("RegExp"===m){if("string"===typeof a[c]&&a[c].match(b))return!0}else if(a[c]===b)return!0;return!1}function B(a,b){if(!p(a)||!p(b)||a.length!==b.length)return!1;a.sort();b.sort();for(var c=0,d=a.length;c<d;c++)if(a[c]!==b[c])return!1;return!0}function C(a){return a.replace(/^\/+|\/+$/g,"")}function z(a){return escape(a)}function v(a){return encodeURIComponent(a).replace(/[!'()*]/g,
z).replace(/\*/g,"%2A")}function A(a){return function(b,c){if(void 0===b)return this._parts[a]||"";this._parts[a]=b||null;this.build(!c);return this}}function F(a,b){return function(c,d){if(void 0===c)return this._parts[a]||"";null!==c&&(c+="",c.charAt(0)===b&&(c=c.substring(1)));this._parts[a]=c;this.build(!d);return this}}var H=f&&f.URI;d.version="1.18.1";var e=d.prototype,r=Object.prototype.hasOwnProperty;d._parts=function(){return{protocol:null,username:null,password:null,hostname:null,urn:null,
port:null,path:null,query:null,fragment:null,duplicateQueryParameters:d.duplicateQueryParameters,escapeQuerySpace:d.escapeQuerySpace}};d.duplicateQueryParameters=!1;d.escapeQuerySpace=!0;d.protocol_expression=/^[a-z][a-z0-9.+-]*$/i;d.idn_expression=/[^a-z0-9\.-]/i;d.punycode_expression=/(xn--)/i;d.ip4_expression=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;d.ip6_expression=/^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
d.find_uri_expression=/\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?\u00ab\u00bb\u201c\u201d\u2018\u2019]))/ig;d.findUri={start:/\b(?:([a-z][a-z0-9.+-]*:\/\/)|www\.)/gi,end:/[\s\r\n]|$/,trim:/[`!()\[\]{};:'".,<>?\u00ab\u00bb\u201c\u201d\u201e\u2018\u2019]+$/};d.defaultPorts={http:"80",https:"443",ftp:"21",gopher:"70",ws:"80",wss:"443"};d.invalid_hostname_characters=
/[^a-zA-Z0-9\.-]/;d.domAttributes={a:"href",blockquote:"cite",link:"href",base:"href",script:"src",form:"action",img:"src",area:"href",iframe:"src",embed:"src",source:"src",track:"src",input:"src",audio:"src",video:"src"};d.getDomAttribute=function(a){if(a&&a.nodeName){var b=a.nodeName.toLowerCase();return"input"===b&&"image"!==a.type?void 0:d.domAttributes[b]}};d.encode=v;d.decode=decodeURIComponent;d.iso8859=function(){d.encode=escape;d.decode=unescape};d.unicode=function(){d.encode=v;d.decode=
decodeURIComponent};d.characters={pathname:{encode:{expression:/%(24|26|2B|2C|3B|3D|3A|40)/ig,map:{"%24":"$","%26":"&","%2B":"+","%2C":",","%3B":";","%3D":"=","%3A":":","%40":"@"}},decode:{expression:/[\/\?#]/g,map:{"/":"%2F","?":"%3F","#":"%23"}}},reserved:{encode:{expression:/%(21|23|24|26|27|28|29|2A|2B|2C|2F|3A|3B|3D|3F|40|5B|5D)/ig,map:{"%3A":":","%2F":"/","%3F":"?","%23":"#","%5B":"[","%5D":"]","%40":"@","%21":"!","%24":"$","%26":"&","%27":"'","%28":"(","%29":")","%2A":"*","%2B":"+","%2C":",",
"%3B":";","%3D":"="}}},urnpath:{encode:{expression:/%(21|24|27|28|29|2A|2B|2C|3B|3D|40)/ig,map:{"%21":"!","%24":"$","%27":"'","%28":"(","%29":")","%2A":"*","%2B":"+","%2C":",","%3B":";","%3D":"=","%40":"@"}},decode:{expression:/[\/\?#:]/g,map:{"/":"%2F","?":"%3F","#":"%23",":":"%3A"}}}};d.encodeQuery=function(a,b){var c=d.encode(a+"");void 0===b&&(b=d.escapeQuerySpace);return b?c.replace(/%20/g,"+"):c};d.decodeQuery=function(a,b){a+="";void 0===b&&(b=d.escapeQuerySpace);try{return d.decode(b?a.replace(/\+/g,
"%20"):a)}catch(c){return a}};var t={encode:"encode",decode:"decode"},x,G=function(a,b){return function(c){try{return d[b](c+"").replace(d.characters[a][b].expression,function(c){return d.characters[a][b].map[c]})}catch(l){return c}}};for(x in t)d[x+"PathSegment"]=G("pathname",t[x]),d[x+"UrnPathSegment"]=G("urnpath",t[x]);t=function(a,b,c){return function(l){var m;m=c?function(a){return d[b](d[c](a))}:d[b];l=(l+"").split(a);for(var e=0,f=l.length;e<f;e++)l[e]=m(l[e]);return l.join(a)}};d.decodePath=
t("/","decodePathSegment");d.decodeUrnPath=t(":","decodeUrnPathSegment");d.recodePath=t("/","encodePathSegment","decode");d.recodeUrnPath=t(":","encodeUrnPathSegment","decode");d.encodeReserved=G("reserved","encode");d.parse=function(a,b){var c;b||(b={});c=a.indexOf("#");-1<c&&(b.fragment=a.substring(c+1)||null,a=a.substring(0,c));c=a.indexOf("?");-1<c&&(b.query=a.substring(c+1)||null,a=a.substring(0,c));"//"===a.substring(0,2)?(b.protocol=null,a=a.substring(2),a=d.parseAuthority(a,b)):(c=a.indexOf(":"),
-1<c&&(b.protocol=a.substring(0,c)||null,b.protocol&&!b.protocol.match(d.protocol_expression)?b.protocol=void 0:"//"===a.substring(c+1,c+3)?(a=a.substring(c+3),a=d.parseAuthority(a,b)):(a=a.substring(c+1),b.urn=!0)));b.path=a;return b};d.parseHost=function(a,b){a=a.replace(/\\/g,"/");var c=a.indexOf("/"),d;-1===c&&(c=a.length);if("["===a.charAt(0))d=a.indexOf("]"),b.hostname=a.substring(1,d)||null,b.port=a.substring(d+2,c)||null,"/"===b.port&&(b.port=null);else{var m=a.indexOf(":");d=a.indexOf("/");
m=a.indexOf(":",m+1);-1!==m&&(-1===d||m<d)?(b.hostname=a.substring(0,c)||null,b.port=null):(d=a.substring(0,c).split(":"),b.hostname=d[0]||null,b.port=d[1]||null)}b.hostname&&"/"!==a.substring(c).charAt(0)&&(c++,a="/"+a);return a.substring(c)||"/"};d.parseAuthority=function(a,b){a=d.parseUserinfo(a,b);return d.parseHost(a,b)};d.parseUserinfo=function(a,b){var c=a.indexOf("/"),l=a.lastIndexOf("@",-1<c?c:a.length-1);-1<l&&(-1===c||l<c)?(c=a.substring(0,l).split(":"),b.username=c[0]?d.decode(c[0]):null,
c.shift(),b.password=c[0]?d.decode(c.join(":")):null,a=a.substring(l+1)):(b.username=null,b.password=null);return a};d.parseQuery=function(a,b){if(!a)return{};a=a.replace(/&+/g,"&").replace(/^\?*&*|&+$/g,"");if(!a)return{};for(var c={},l=a.split("&"),m=l.length,e,f,g=0;g<m;g++)if(e=l[g].split("="),f=d.decodeQuery(e.shift(),b),e=e.length?d.decodeQuery(e.join("="),b):null,r.call(c,f)){if("string"===typeof c[f]||null===c[f])c[f]=[c[f]];c[f].push(e)}else c[f]=e;return c};d.build=function(a){var b="";
a.protocol&&(b+=a.protocol+":");a.urn||!b&&!a.hostname||(b+="//");b+=d.buildAuthority(a)||"";"string"===typeof a.path&&("/"!==a.path.charAt(0)&&"string"===typeof a.hostname&&(b+="/"),b+=a.path);"string"===typeof a.query&&a.query&&(b+="?"+a.query);"string"===typeof a.fragment&&a.fragment&&(b+="#"+a.fragment);return b};d.buildHost=function(a){var b="";if(a.hostname)b=d.ip6_expression.test(a.hostname)?b+("["+a.hostname+"]"):b+a.hostname;else return"";a.port&&(b+=":"+a.port);return b};d.buildAuthority=
function(a){return d.buildUserinfo(a)+d.buildHost(a)};d.buildUserinfo=function(a){var b="";a.username&&(b+=d.encode(a.username));a.password&&(b+=":"+d.encode(a.password));b&&(b+="@");return b};d.buildQuery=function(a,b,c){var l="",m,e,f,g;for(e in a)if(r.call(a,e)&&e)if(p(a[e]))for(m={},f=0,g=a[e].length;f<g;f++)void 0!==a[e][f]&&void 0===m[a[e][f]+""]&&(l+="&"+d.buildQueryParameter(e,a[e][f],c),!0!==b&&(m[a[e][f]+""]=!0));else void 0!==a[e]&&(l+="&"+d.buildQueryParameter(e,a[e],c));return l.substring(1)};
d.buildQueryParameter=function(a,b,c){return d.encodeQuery(a,c)+(null!==b?"="+d.encodeQuery(b,c):"")};d.addQuery=function(a,b,c){if("object"===typeof b)for(var l in b)r.call(b,l)&&d.addQuery(a,l,b[l]);else if("string"===typeof b)void 0===a[b]?a[b]=c:("string"===typeof a[b]&&(a[b]=[a[b]]),p(c)||(c=[c]),a[b]=(a[b]||[]).concat(c));else throw new TypeError("URI.addQuery() accepts an object, string as the name parameter");};d.removeQuery=function(a,b,c){var l;if(p(b))for(c=0,l=b.length;c<l;c++)a[b[c]]=
void 0;else if("RegExp"===w(b))for(l in a)b.test(l)&&(a[l]=void 0);else if("object"===typeof b)for(l in b)r.call(b,l)&&d.removeQuery(a,l,b[l]);else if("string"===typeof b)void 0!==c?"RegExp"===w(c)?!p(a[b])&&c.test(a[b])?a[b]=void 0:a[b]=D(a[b],c):a[b]!==String(c)||p(c)&&1!==c.length?p(a[b])&&(a[b]=D(a[b],c)):a[b]=void 0:a[b]=void 0;else throw new TypeError("URI.removeQuery() accepts an object, string, RegExp as the first parameter");};d.hasQuery=function(a,b,c,l){switch(w(b)){case "String":break;
case "RegExp":for(var e in a)if(r.call(a,e)&&b.test(e)&&(void 0===c||d.hasQuery(a,e,c)))return!0;return!1;case "Object":for(var f in b)if(r.call(b,f)&&!d.hasQuery(a,f,b[f]))return!1;return!0;default:throw new TypeError("URI.hasQuery() accepts a string, regular expression or object as the name parameter");}switch(w(c)){case "Undefined":return b in a;case "Boolean":return a=!(p(a[b])?!a[b].length:!a[b]),c===a;case "Function":return!!c(a[b],b,a);case "Array":return p(a[b])?(l?u:B)(a[b],c):!1;case "RegExp":return p(a[b])?
l?u(a[b],c):!1:!(!a[b]||!a[b].match(c));case "Number":c=String(c);case "String":return p(a[b])?l?u(a[b],c):!1:a[b]===c;default:throw new TypeError("URI.hasQuery() accepts undefined, boolean, string, number, RegExp, Function as the value parameter");}};d.joinPaths=function(){for(var a=[],b=[],c=0,l=0;l<arguments.length;l++){var e=new d(arguments[l]);a.push(e);for(var e=e.segment(),f=0;f<e.length;f++)"string"===typeof e[f]&&b.push(e[f]),e[f]&&c++}if(!b.length||!c)return new d("");b=(new d("")).segment(b);
""!==a[0].path()&&"/"!==a[0].path().slice(0,1)||b.path("/"+b.path());return b.normalize()};d.commonPath=function(a,b){var c=Math.min(a.length,b.length),d;for(d=0;d<c;d++)if(a.charAt(d)!==b.charAt(d)){d--;break}if(1>d)return a.charAt(0)===b.charAt(0)&&"/"===a.charAt(0)?"/":"";if("/"!==a.charAt(d)||"/"!==b.charAt(d))d=a.substring(0,d).lastIndexOf("/");return a.substring(0,d+1)};d.withinString=function(a,b,c){c||(c={});var l=c.start||d.findUri.start,e=c.end||d.findUri.end,f=c.trim||d.findUri.trim,g=
/[a-z0-9-]=["']?$/i;for(l.lastIndex=0;;){var h=l.exec(a);if(!h)break;h=h.index;if(c.ignoreHtml){var k=a.slice(Math.max(h-3,0),h);if(k&&g.test(k))continue}var k=h+a.slice(h).search(e),n=a.slice(h,k).replace(f,"");c.ignore&&c.ignore.test(n)||(k=h+n.length,n=b(n,h,k,a),a=a.slice(0,h)+n+a.slice(k),l.lastIndex=h+n.length)}l.lastIndex=0;return a};d.ensureValidHostname=function(a){if(a.match(d.invalid_hostname_characters)){if(!k)throw new TypeError('Hostname "'+a+'" contains characters other than [A-Z0-9.-] and Punycode.js is not available');
if(k.toASCII(a).match(d.invalid_hostname_characters))throw new TypeError('Hostname "'+a+'" contains characters other than [A-Z0-9.-]');}};d.noConflict=function(a){if(a)return a={URI:this.noConflict()},f.URITemplate&&"function"===typeof f.URITemplate.noConflict&&(a.URITemplate=f.URITemplate.noConflict()),f.IPv6&&"function"===typeof f.IPv6.noConflict&&(a.IPv6=f.IPv6.noConflict()),f.SecondLevelDomains&&"function"===typeof f.SecondLevelDomains.noConflict&&(a.SecondLevelDomains=f.SecondLevelDomains.noConflict()),
a;f.URI===this&&(f.URI=H);return this};e.build=function(a){if(!0===a)this._deferred_build=!0;else if(void 0===a||this._deferred_build)this._string=d.build(this._parts),this._deferred_build=!1;return this};e.clone=function(){return new d(this)};e.valueOf=e.toString=function(){return this.build(!1)._string};e.protocol=A("protocol");e.username=A("username");e.password=A("password");e.hostname=A("hostname");e.port=A("port");e.query=F("query","?");e.fragment=F("fragment","#");e.search=function(a,b){var c=
this.query(a,b);return"string"===typeof c&&c.length?"?"+c:c};e.hash=function(a,b){var c=this.fragment(a,b);return"string"===typeof c&&c.length?"#"+c:c};e.pathname=function(a,b){if(void 0===a||!0===a){var c=this._parts.path||(this._parts.hostname?"/":"");return a?(this._parts.urn?d.decodeUrnPath:d.decodePath)(c):c}this._parts.path=this._parts.urn?a?d.recodeUrnPath(a):"":a?d.recodePath(a):"/";this.build(!b);return this};e.path=e.pathname;e.href=function(a,b){var c;if(void 0===a)return this.toString();
this._string="";this._parts=d._parts();var e=a instanceof d,f="object"===typeof a&&(a.hostname||a.path||a.pathname);a.nodeName&&(f=d.getDomAttribute(a),a=a[f]||"",f=!1);!e&&f&&void 0!==a.pathname&&(a=a.toString());if("string"===typeof a||a instanceof String)this._parts=d.parse(String(a),this._parts);else if(e||f)for(c in e=e?a._parts:a,e)r.call(this._parts,c)&&(this._parts[c]=e[c]);else throw new TypeError("invalid input");this.build(!b);return this};e.is=function(a){var b=!1,c=!1,e=!1,f=!1,h=!1,
k=!1,n=!1,p=!this._parts.urn;this._parts.hostname&&(p=!1,c=d.ip4_expression.test(this._parts.hostname),e=d.ip6_expression.test(this._parts.hostname),b=c||e,h=(f=!b)&&g&&g.has(this._parts.hostname),k=f&&d.idn_expression.test(this._parts.hostname),n=f&&d.punycode_expression.test(this._parts.hostname));switch(a.toLowerCase()){case "relative":return p;case "absolute":return!p;case "domain":case "name":return f;case "sld":return h;case "ip":return b;case "ip4":case "ipv4":case "inet4":return c;case "ip6":case "ipv6":case "inet6":return e;
case "idn":return k;case "url":return!this._parts.urn;case "urn":return!!this._parts.urn;case "punycode":return n}return null};var J=e.protocol,K=e.port,L=e.hostname;e.protocol=function(a,b){if(void 0!==a&&a&&(a=a.replace(/:(\/\/)?$/,""),!a.match(d.protocol_expression)))throw new TypeError('Protocol "'+a+"\" contains characters other than [A-Z0-9.+-] or doesn't start with [A-Z]");return J.call(this,a,b)};e.scheme=e.protocol;e.port=function(a,b){if(this._parts.urn)return void 0===a?"":this;if(void 0!==
a&&(0===a&&(a=null),a&&(a+="",":"===a.charAt(0)&&(a=a.substring(1)),a.match(/[^0-9]/))))throw new TypeError('Port "'+a+'" contains characters other than [0-9]');return K.call(this,a,b)};e.hostname=function(a,b){if(this._parts.urn)return void 0===a?"":this;if(void 0!==a){var c={};if("/"!==d.parseHost(a,c))throw new TypeError('Hostname "'+a+'" contains characters other than [A-Z0-9.-]');a=c.hostname}return L.call(this,a,b)};e.origin=function(a,b){if(this._parts.urn)return void 0===a?"":this;if(void 0===
a){var c=this.protocol();return this.authority()?(c?c+"://":"")+this.authority():""}c=d(a);this.protocol(c.protocol()).authority(c.authority()).build(!b);return this};e.host=function(a,b){if(this._parts.urn)return void 0===a?"":this;if(void 0===a)return this._parts.hostname?d.buildHost(this._parts):"";if("/"!==d.parseHost(a,this._parts))throw new TypeError('Hostname "'+a+'" contains characters other than [A-Z0-9.-]');this.build(!b);return this};e.authority=function(a,b){if(this._parts.urn)return void 0===
a?"":this;if(void 0===a)return this._parts.hostname?d.buildAuthority(this._parts):"";if("/"!==d.parseAuthority(a,this._parts))throw new TypeError('Hostname "'+a+'" contains characters other than [A-Z0-9.-]');this.build(!b);return this};e.userinfo=function(a,b){if(this._parts.urn)return void 0===a?"":this;if(void 0===a){var c=d.buildUserinfo(this._parts);return c?c.substring(0,c.length-1):c}"@"!==a[a.length-1]&&(a+="@");d.parseUserinfo(a,this._parts);this.build(!b);return this};e.resource=function(a,
b){var c;if(void 0===a)return this.path()+this.search()+this.hash();c=d.parse(a);this._parts.path=c.path;this._parts.query=c.query;this._parts.fragment=c.fragment;this.build(!b);return this};e.subdomain=function(a,b){if(this._parts.urn)return void 0===a?"":this;if(void 0===a){if(!this._parts.hostname||this.is("IP"))return"";var c=this._parts.hostname.length-this.domain().length-1;return this._parts.hostname.substring(0,c)||""}c=this._parts.hostname.length-this.domain().length;c=this._parts.hostname.substring(0,
c);c=new RegExp("^"+h(c));a&&"."!==a.charAt(a.length-1)&&(a+=".");a&&d.ensureValidHostname(a);this._parts.hostname=this._parts.hostname.replace(c,a);this.build(!b);return this};e.domain=function(a,b){if(this._parts.urn)return void 0===a?"":this;"boolean"===typeof a&&(b=a,a=void 0);if(void 0===a){if(!this._parts.hostname||this.is("IP"))return"";var c=this._parts.hostname.match(/\./g);if(c&&2>c.length)return this._parts.hostname;c=this._parts.hostname.length-this.tld(b).length-1;c=this._parts.hostname.lastIndexOf(".",
c-1)+1;return this._parts.hostname.substring(c)||""}if(!a)throw new TypeError("cannot set domain empty");d.ensureValidHostname(a);!this._parts.hostname||this.is("IP")?this._parts.hostname=a:(c=new RegExp(h(this.domain())+"$"),this._parts.hostname=this._parts.hostname.replace(c,a));this.build(!b);return this};e.tld=function(a,b){if(this._parts.urn)return void 0===a?"":this;"boolean"===typeof a&&(b=a,a=void 0);if(void 0===a){if(!this._parts.hostname||this.is("IP"))return"";var c=this._parts.hostname.lastIndexOf("."),
c=this._parts.hostname.substring(c+1);return!0!==b&&g&&g.list[c.toLowerCase()]?g.get(this._parts.hostname)||c:c}if(a)if(a.match(/[^a-zA-Z0-9-]/))if(g&&g.is(a))c=new RegExp(h(this.tld())+"$"),this._parts.hostname=this._parts.hostname.replace(c,a);else throw new TypeError('TLD "'+a+'" contains characters other than [A-Z0-9]');else{if(!this._parts.hostname||this.is("IP"))throw new ReferenceError("cannot set TLD on non-domain host");c=new RegExp(h(this.tld())+"$");this._parts.hostname=this._parts.hostname.replace(c,
a)}else throw new TypeError("cannot set TLD empty");this.build(!b);return this};e.directory=function(a,b){if(this._parts.urn)return void 0===a?"":this;if(void 0===a||!0===a){if(!this._parts.path&&!this._parts.hostname)return"";if("/"===this._parts.path)return"/";var c=this._parts.path.length-this.filename().length-1,c=this._parts.path.substring(0,c)||(this._parts.hostname?"/":"");return a?d.decodePath(c):c}c=this._parts.path.length-this.filename().length;c=this._parts.path.substring(0,c);c=new RegExp("^"+
h(c));this.is("relative")||(a||(a="/"),"/"!==a.charAt(0)&&(a="/"+a));a&&"/"!==a.charAt(a.length-1)&&(a+="/");a=d.recodePath(a);this._parts.path=this._parts.path.replace(c,a);this.build(!b);return this};e.filename=function(a,b){if(this._parts.urn)return void 0===a?"":this;if(void 0===a||!0===a){if(!this._parts.path||"/"===this._parts.path)return"";var c=this._parts.path.lastIndexOf("/"),c=this._parts.path.substring(c+1);return a?d.decodePathSegment(c):c}c=!1;"/"===a.charAt(0)&&(a=a.substring(1));a.match(/\.?\//)&&
(c=!0);var e=new RegExp(h(this.filename())+"$");a=d.recodePath(a);this._parts.path=this._parts.path.replace(e,a);c?this.normalizePath(b):this.build(!b);return this};e.suffix=function(a,b){if(this._parts.urn)return void 0===a?"":this;if(void 0===a||!0===a){if(!this._parts.path||"/"===this._parts.path)return"";var c=this.filename(),e=c.lastIndexOf(".");if(-1===e)return"";c=c.substring(e+1);c=/^[a-z0-9%]+$/i.test(c)?c:"";return a?d.decodePathSegment(c):c}"."===a.charAt(0)&&(a=a.substring(1));if(c=this.suffix())e=
a?new RegExp(h(c)+"$"):new RegExp(h("."+c)+"$");else{if(!a)return this;this._parts.path+="."+d.recodePath(a)}e&&(a=d.recodePath(a),this._parts.path=this._parts.path.replace(e,a));this.build(!b);return this};e.segment=function(a,b,c){var d=this._parts.urn?":":"/",e=this.path(),f="/"===e.substring(0,1),e=e.split(d);void 0!==a&&"number"!==typeof a&&(c=b,b=a,a=void 0);if(void 0!==a&&"number"!==typeof a)throw Error('Bad segment "'+a+'", must be 0-based integer');f&&e.shift();0>a&&(a=Math.max(e.length+
a,0));if(void 0===b)return void 0===a?e:e[a];if(null===a||void 0===e[a])if(p(b)){e=[];a=0;for(var g=b.length;a<g;a++)if(b[a].length||e.length&&e[e.length-1].length)e.length&&!e[e.length-1].length&&e.pop(),e.push(C(b[a]))}else{if(b||"string"===typeof b)b=C(b),""===e[e.length-1]?e[e.length-1]=b:e.push(b)}else b?e[a]=C(b):e.splice(a,1);f&&e.unshift("");return this.path(e.join(d),c)};e.segmentCoded=function(a,b,c){var e,f;"number"!==typeof a&&(c=b,b=a,a=void 0);if(void 0===b){a=this.segment(a,b,c);if(p(a))for(e=
0,f=a.length;e<f;e++)a[e]=d.decode(a[e]);else a=void 0!==a?d.decode(a):void 0;return a}if(p(b))for(e=0,f=b.length;e<f;e++)b[e]=d.encode(b[e]);else b="string"===typeof b||b instanceof String?d.encode(b):b;return this.segment(a,b,c)};var M=e.query;e.query=function(a,b){if(!0===a)return d.parseQuery(this._parts.query,this._parts.escapeQuerySpace);if("function"===typeof a){var c=d.parseQuery(this._parts.query,this._parts.escapeQuerySpace),e=a.call(this,c);this._parts.query=d.buildQuery(e||c,this._parts.duplicateQueryParameters,
this._parts.escapeQuerySpace);this.build(!b);return this}return void 0!==a&&"string"!==typeof a?(this._parts.query=d.buildQuery(a,this._parts.duplicateQueryParameters,this._parts.escapeQuerySpace),this.build(!b),this):M.call(this,a,b)};e.setQuery=function(a,b,c){var e=d.parseQuery(this._parts.query,this._parts.escapeQuerySpace);if("string"===typeof a||a instanceof String)e[a]=void 0!==b?b:null;else if("object"===typeof a)for(var f in a)r.call(a,f)&&(e[f]=a[f]);else throw new TypeError("URI.addQuery() accepts an object, string as the name parameter");
this._parts.query=d.buildQuery(e,this._parts.duplicateQueryParameters,this._parts.escapeQuerySpace);"string"!==typeof a&&(c=b);this.build(!c);return this};e.addQuery=function(a,b,c){var e=d.parseQuery(this._parts.query,this._parts.escapeQuerySpace);d.addQuery(e,a,void 0===b?null:b);this._parts.query=d.buildQuery(e,this._parts.duplicateQueryParameters,this._parts.escapeQuerySpace);"string"!==typeof a&&(c=b);this.build(!c);return this};e.removeQuery=function(a,b,c){var e=d.parseQuery(this._parts.query,
this._parts.escapeQuerySpace);d.removeQuery(e,a,b);this._parts.query=d.buildQuery(e,this._parts.duplicateQueryParameters,this._parts.escapeQuerySpace);"string"!==typeof a&&(c=b);this.build(!c);return this};e.hasQuery=function(a,b,c){var e=d.parseQuery(this._parts.query,this._parts.escapeQuerySpace);return d.hasQuery(e,a,b,c)};e.setSearch=e.setQuery;e.addSearch=e.addQuery;e.removeSearch=e.removeQuery;e.hasSearch=e.hasQuery;e.normalize=function(){return this._parts.urn?this.normalizeProtocol(!1).normalizePath(!1).normalizeQuery(!1).normalizeFragment(!1).build():
this.normalizeProtocol(!1).normalizeHostname(!1).normalizePort(!1).normalizePath(!1).normalizeQuery(!1).normalizeFragment(!1).build()};e.normalizeProtocol=function(a){"string"===typeof this._parts.protocol&&(this._parts.protocol=this._parts.protocol.toLowerCase(),this.build(!a));return this};e.normalizeHostname=function(a){this._parts.hostname&&(this.is("IDN")&&k?this._parts.hostname=k.toASCII(this._parts.hostname):this.is("IPv6")&&n&&(this._parts.hostname=n.best(this._parts.hostname)),this._parts.hostname=
this._parts.hostname.toLowerCase(),this.build(!a));return this};e.normalizePort=function(a){"string"===typeof this._parts.protocol&&this._parts.port===d.defaultPorts[this._parts.protocol]&&(this._parts.port=null,this.build(!a));return this};e.normalizePath=function(a){var b=this._parts.path;if(!b)return this;if(this._parts.urn)return this._parts.path=d.recodeUrnPath(this._parts.path),this.build(!a),this;if("/"===this._parts.path)return this;var b=d.recodePath(b),c,e="",f,g;"/"!==b.charAt(0)&&(c=!0,
b="/"+b);if("/.."===b.slice(-3)||"/."===b.slice(-2))b+="/";b=b.replace(/(\/(\.\/)+)|(\/\.$)/g,"/").replace(/\/{2,}/g,"/");c&&(e=b.substring(1).match(/^(\.\.\/)+/)||"")&&(e=e[0]);for(;;){f=b.search(/\/\.\.(\/|$)/);if(-1===f)break;else if(0===f){b=b.substring(3);continue}g=b.substring(0,f).lastIndexOf("/");-1===g&&(g=f);b=b.substring(0,g)+b.substring(f+3)}c&&this.is("relative")&&(b=e+b.substring(1));this._parts.path=b;this.build(!a);return this};e.normalizePathname=e.normalizePath;e.normalizeQuery=
function(a){"string"===typeof this._parts.query&&(this._parts.query.length?this.query(d.parseQuery(this._parts.query,this._parts.escapeQuerySpace)):this._parts.query=null,this.build(!a));return this};e.normalizeFragment=function(a){this._parts.fragment||(this._parts.fragment=null,this.build(!a));return this};e.normalizeSearch=e.normalizeQuery;e.normalizeHash=e.normalizeFragment;e.iso8859=function(){var a=d.encode,b=d.decode;d.encode=escape;d.decode=decodeURIComponent;try{this.normalize()}finally{d.encode=
a,d.decode=b}return this};e.unicode=function(){var a=d.encode,b=d.decode;d.encode=v;d.decode=unescape;try{this.normalize()}finally{d.encode=a,d.decode=b}return this};e.readable=function(){var a=this.clone();a.username("").password("").normalize();var b="";a._parts.protocol&&(b+=a._parts.protocol+"://");a._parts.hostname&&(a.is("punycode")&&k?(b+=k.toUnicode(a._parts.hostname),a._parts.port&&(b+=":"+a._parts.port)):b+=a.host());a._parts.hostname&&a._parts.path&&"/"!==a._parts.path.charAt(0)&&(b+="/");
b+=a.path(!0);if(a._parts.query){for(var c="",e=0,f=a._parts.query.split("&"),g=f.length;e<g;e++){var h=(f[e]||"").split("="),c=c+("&"+d.decodeQuery(h[0],this._parts.escapeQuerySpace).replace(/&/g,"%26"));void 0!==h[1]&&(c+="="+d.decodeQuery(h[1],this._parts.escapeQuerySpace).replace(/&/g,"%26"))}b+="?"+c.substring(1)}return b+=d.decodeQuery(a.hash(),!0)};e.absoluteTo=function(a){var b=this.clone(),c=["protocol","username","password","hostname","port"],e,f;if(this._parts.urn)throw Error("URNs do not have any generally defined hierarchical components");
a instanceof d||(a=new d(a));b._parts.protocol||(b._parts.protocol=a._parts.protocol);if(this._parts.hostname)return b;for(e=0;f=c[e];e++)b._parts[f]=a._parts[f];b._parts.path?".."===b._parts.path.substring(-2)&&(b._parts.path+="/"):(b._parts.path=a._parts.path,b._parts.query||(b._parts.query=a._parts.query));"/"!==b.path().charAt(0)&&(c=(c=a.directory())?c:0===a.path().indexOf("/")?"/":"",b._parts.path=(c?c+"/":"")+b._parts.path,b.normalizePath());b.build();return b};e.relativeTo=function(a){var b=
this.clone().normalize(),c,e,f;if(b._parts.urn)throw Error("URNs do not have any generally defined hierarchical components");a=(new d(a)).normalize();c=b._parts;e=a._parts;f=b.path();a=a.path();if("/"!==f.charAt(0))throw Error("URI is already relative");if("/"!==a.charAt(0))throw Error("Cannot calculate a URI relative to another relative URI");c.protocol===e.protocol&&(c.protocol=null);if(c.username===e.username&&c.password===e.password&&null===c.protocol&&null===c.username&&null===c.password&&c.hostname===
e.hostname&&c.port===e.port)c.hostname=null,c.port=null;else return b.build();if(f===a)return c.path="",b.build();f=d.commonPath(f,a);if(!f)return b.build();e=e.path.substring(f.length).replace(/[^\/]*$/,"").replace(/.*?\//g,"../");c.path=e+c.path.substring(f.length)||"./";return b.build()};e.equals=function(a){var b=this.clone(),c=new d(a),e;a={};var f,g;b.normalize();c.normalize();if(b.toString()===c.toString())return!0;f=b.query();e=c.query();b.query("");c.query("");if(b.toString()!==c.toString()||
f.length!==e.length)return!1;b=d.parseQuery(f,this._parts.escapeQuerySpace);e=d.parseQuery(e,this._parts.escapeQuerySpace);for(g in b)if(r.call(b,g)){if(!p(b[g])){if(b[g]!==e[g])return!1}else if(!B(b[g],e[g]))return!1;a[g]=!0}for(g in e)if(r.call(e,g)&&!a[g])return!1;return!0};e.duplicateQueryParameters=function(a){this._parts.duplicateQueryParameters=!!a;return this};e.escapeQuerySpace=function(a){this._parts.escapeQuerySpace=!!a;return this};return d});

/*!
 * URI.js - Mutating URLs
 * URI Template Support - http://tools.ietf.org/html/rfc6570
 *
 * Version: 1.18.1
 *
 * Author: Rodney Rehm
 * Web: http://medialize.github.io/URI.js/
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *
 */
(function (root, factory) {
  'use strict';
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  if (typeof exports === 'object') {
    // Node
    module.exports = factory(require('./URI'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['./URI'], factory);
  } else {
    // Browser globals (root is window)
    root.URITemplate = factory(root.URI, root);
  }
}(this, function (URI, root) {
  'use strict';
  // FIXME: v2.0.0 renamce non-camelCase properties to uppercase
  /*jshint camelcase: false */

  // save current URITemplate variable, if any
  var _URITemplate = root && root.URITemplate;

  var hasOwn = Object.prototype.hasOwnProperty;
  function URITemplate(expression) {
    // serve from cache where possible
    if (URITemplate._cache[expression]) {
      return URITemplate._cache[expression];
    }

    // Allow instantiation without the 'new' keyword
    if (!(this instanceof URITemplate)) {
      return new URITemplate(expression);
    }

    this.expression = expression;
    URITemplate._cache[expression] = this;
    return this;
  }

  function Data(data) {
    this.data = data;
    this.cache = {};
  }

  var p = URITemplate.prototype;
  // list of operators and their defined options
  var operators = {
    // Simple string expansion
    '' : {
      prefix: '',
      separator: ',',
      named: false,
      empty_name_separator: false,
      encode : 'encode'
    },
    // Reserved character strings
    '+' : {
      prefix: '',
      separator: ',',
      named: false,
      empty_name_separator: false,
      encode : 'encodeReserved'
    },
    // Fragment identifiers prefixed by '#'
    '#' : {
      prefix: '#',
      separator: ',',
      named: false,
      empty_name_separator: false,
      encode : 'encodeReserved'
    },
    // Name labels or extensions prefixed by '.'
    '.' : {
      prefix: '.',
      separator: '.',
      named: false,
      empty_name_separator: false,
      encode : 'encode'
    },
    // Path segments prefixed by '/'
    '/' : {
      prefix: '/',
      separator: '/',
      named: false,
      empty_name_separator: false,
      encode : 'encode'
    },
    // Path parameter name or name=value pairs prefixed by ';'
    ';' : {
      prefix: ';',
      separator: ';',
      named: true,
      empty_name_separator: false,
      encode : 'encode'
    },
    // Query component beginning with '?' and consisting
    // of name=value pairs separated by '&'; an
    '?' : {
      prefix: '?',
      separator: '&',
      named: true,
      empty_name_separator: true,
      encode : 'encode'
    },
    // Continuation of query-style &name=value pairs
    // within a literal query component.
    '&' : {
      prefix: '&',
      separator: '&',
      named: true,
      empty_name_separator: true,
      encode : 'encode'
    }

    // The operator characters equals ("="), comma (","), exclamation ("!"),
    // at sign ("@"), and pipe ("|") are reserved for future extensions.
  };

  // storage for already parsed templates
  URITemplate._cache = {};
  // pattern to identify expressions [operator, variable-list] in template
  URITemplate.EXPRESSION_PATTERN = /\{([^a-zA-Z0-9%_]?)([^\}]+)(\}|$)/g;
  // pattern to identify variables [name, explode, maxlength] in variable-list
  URITemplate.VARIABLE_PATTERN = /^([^*:.](?:\.?[^*:.])*)((\*)|:(\d+))?$/;
  // pattern to verify variable name integrity
  URITemplate.VARIABLE_NAME_PATTERN = /[^a-zA-Z0-9%_.]/;
  // pattern to verify literal integrity
  URITemplate.LITERAL_PATTERN = /[<>{}'"`^| \\]/;

  // expand parsed expression (expression, not template!)
  URITemplate.expand = function(expression, data) {
    // container for defined options for the given operator
    var options = operators[expression.operator];
    // expansion type (include keys or not)
    var type = options.named ? 'Named' : 'Unnamed';
    // list of variables within the expression
    var variables = expression.variables;
    // result buffer for evaluating the expression
    var buffer = [];
    var d, variable, i;

    for (i = 0; (variable = variables[i]); i++) {
      // fetch simplified data source
      d = data.get(variable.name);
      if (!d.val.length) {
        if (d.type) {
          // empty variables (empty string)
          // still lead to a separator being appended!
          buffer.push('');
        }
        // no data, no action
        continue;
      }

      if (d.type > 1 && variable.maxlength) {
        // composite variable cannot specify maxlength
        throw new Error('Invalid expression: Prefix modifier not applicable to variable "' + variable.name + '"');
      }

      // expand the given variable
      buffer.push(URITemplate['expand' + type](
        d,
        options,
        variable.explode,
        variable.explode && options.separator || ',',
        variable.maxlength,
        variable.name
      ));
    }

    if (buffer.length) {
      return options.prefix + buffer.join(options.separator);
    } else {
      // prefix is not prepended for empty expressions
      return '';
    }
  };
  // expand a named variable
  URITemplate.expandNamed = function(d, options, explode, separator, length, name) {
    // variable result buffer
    var result = '';
    // peformance crap
    var encode = options.encode;
    var empty_name_separator = options.empty_name_separator;
    // flag noting if values are already encoded
    var _encode = !d[encode].length;
    // key for named expansion
    var _name = d.type === 2 ? '': URI[encode](name);
    var _value, i, l;

    // for each found value
    for (i = 0, l = d.val.length; i < l; i++) {
      if (length) {
        // maxlength must be determined before encoding can happen
        _value = URI[encode](d.val[i][1].substring(0, length));
        if (d.type === 2) {
          // apply maxlength to keys of objects as well
          _name = URI[encode](d.val[i][0].substring(0, length));
        }
      } else if (_encode) {
        // encode value
        _value = URI[encode](d.val[i][1]);
        if (d.type === 2) {
          // encode name and cache encoded value
          _name = URI[encode](d.val[i][0]);
          d[encode].push([_name, _value]);
        } else {
          // cache encoded value
          d[encode].push([undefined, _value]);
        }
      } else {
        // values are already encoded and can be pulled from cache
        _value = d[encode][i][1];
        if (d.type === 2) {
          _name = d[encode][i][0];
        }
      }

      if (result) {
        // unless we're the first value, prepend the separator
        result += separator;
      }

      if (!explode) {
        if (!i) {
          // first element, so prepend variable name
          result += URI[encode](name) + (empty_name_separator || _value ? '=' : '');
        }

        if (d.type === 2) {
          // without explode-modifier, keys of objects are returned comma-separated
          result += _name + ',';
        }

        result += _value;
      } else {
        // only add the = if it is either default (?&) or there actually is a value (;)
        result += _name + (empty_name_separator || _value ? '=' : '') + _value;
      }
    }

    return result;
  };
  // expand an unnamed variable
  URITemplate.expandUnnamed = function(d, options, explode, separator, length) {
    // variable result buffer
    var result = '';
    // performance crap
    var encode = options.encode;
    var empty_name_separator = options.empty_name_separator;
    // flag noting if values are already encoded
    var _encode = !d[encode].length;
    var _name, _value, i, l;

    // for each found value
    for (i = 0, l = d.val.length; i < l; i++) {
      if (length) {
        // maxlength must be determined before encoding can happen
        _value = URI[encode](d.val[i][1].substring(0, length));
      } else if (_encode) {
        // encode and cache value
        _value = URI[encode](d.val[i][1]);
        d[encode].push([
          d.type === 2 ? URI[encode](d.val[i][0]) : undefined,
          _value
        ]);
      } else {
        // value already encoded, pull from cache
        _value = d[encode][i][1];
      }

      if (result) {
        // unless we're the first value, prepend the separator
        result += separator;
      }

      if (d.type === 2) {
        if (length) {
          // maxlength also applies to keys of objects
          _name = URI[encode](d.val[i][0].substring(0, length));
        } else {
          // at this point the name must already be encoded
          _name = d[encode][i][0];
        }

        result += _name;
        if (explode) {
          // explode-modifier separates name and value by "="
          result += (empty_name_separator || _value ? '=' : '');
        } else {
          // no explode-modifier separates name and value by ","
          result += ',';
        }
      }

      result += _value;
    }

    return result;
  };

  URITemplate.noConflict = function() {
    if (root.URITemplate === URITemplate) {
      root.URITemplate = _URITemplate;
    }

    return URITemplate;
  };

  // expand template through given data map
  p.expand = function(data) {
    var result = '';

    if (!this.parts || !this.parts.length) {
      // lazilyy parse the template
      this.parse();
    }

    if (!(data instanceof Data)) {
      // make given data available through the
      // optimized data handling thingie
      data = new Data(data);
    }

    for (var i = 0, l = this.parts.length; i < l; i++) {
      /*jshint laxbreak: true */
      result += typeof this.parts[i] === 'string'
        // literal string
        ? this.parts[i]
        // expression
        : URITemplate.expand(this.parts[i], data);
      /*jshint laxbreak: false */
    }

    return result;
  };
  // parse template into action tokens
  p.parse = function() {
    // performance crap
    var expression = this.expression;
    var ePattern = URITemplate.EXPRESSION_PATTERN;
    var vPattern = URITemplate.VARIABLE_PATTERN;
    var nPattern = URITemplate.VARIABLE_NAME_PATTERN;
    var lPattern = URITemplate.LITERAL_PATTERN;
    // token result buffer
    var parts = [];
      // position within source template
    var pos = 0;
    var variables, eMatch, vMatch;

    var checkLiteral = function(literal) {
      if (literal.match(lPattern)) {
        throw new Error('Invalid Literal "' + literal + '"');
      }
      return literal;
    };

    // RegExp is shared accross all templates,
    // which requires a manual reset
    ePattern.lastIndex = 0;
    // I don't like while(foo = bar()) loops,
    // to make things simpler I go while(true) and break when required
    while (true) {
      eMatch = ePattern.exec(expression);
      if (eMatch === null) {
        // push trailing literal
        parts.push(checkLiteral(expression.substring(pos)));
        break;
      } else {
        // push leading literal
        parts.push(checkLiteral(expression.substring(pos, eMatch.index)));
        pos = eMatch.index + eMatch[0].length;
      }

      if (!operators[eMatch[1]]) {
        throw new Error('Unknown Operator "' + eMatch[1]  + '" in "' + eMatch[0] + '"');
      } else if (!eMatch[3]) {
        throw new Error('Unclosed Expression "' + eMatch[0]  + '"');
      }

      // parse variable-list
      variables = eMatch[2].split(',');
      for (var i = 0, l = variables.length; i < l; i++) {
        vMatch = variables[i].match(vPattern);
        if (vMatch === null) {
          throw new Error('Invalid Variable "' + variables[i] + '" in "' + eMatch[0] + '"');
        } else if (vMatch[1].match(nPattern)) {
          throw new Error('Invalid Variable Name "' + vMatch[1] + '" in "' + eMatch[0] + '"');
        }

        variables[i] = {
          name: vMatch[1],
          explode: !!vMatch[3],
          maxlength: vMatch[4] && parseInt(vMatch[4], 10)
        };
      }

      if (!variables.length) {
        throw new Error('Expression Missing Variable(s) "' + eMatch[0] + '"');
      }

      parts.push({
        expression: eMatch[0],
        operator: eMatch[1],
        variables: variables
      });
    }

    if (!parts.length) {
      // template doesn't contain any expressions
      // so it is a simple literal string
      // this probably should fire a warning or something?
      parts.push(checkLiteral(expression));
    }

    this.parts = parts;
    return this;
  };

  // simplify data structures
  Data.prototype.get = function(key) {
    // performance crap
    var data = this.data;
    // cache for processed data-point
    var d = {
      // type of data 0: undefined/null, 1: string, 2: object, 3: array
      type: 0,
      // original values (except undefined/null)
      val: [],
      // cache for encoded values (only for non-maxlength expansion)
      encode: [],
      encodeReserved: []
    };
    var i, l, value;

    if (this.cache[key] !== undefined) {
      // we've already processed this key
      return this.cache[key];
    }

    this.cache[key] = d;

    if (String(Object.prototype.toString.call(data)) === '[object Function]') {
      // data itself is a callback (global callback)
      value = data(key);
    } else if (String(Object.prototype.toString.call(data[key])) === '[object Function]') {
      // data is a map of callbacks (local callback)
      value = data[key](key);
    } else {
      // data is a map of data
      value = data[key];
    }

    // generalize input into [ [name1, value1], [name2, value2], … ]
    // so expansion has to deal with a single data structure only
    if (value === undefined || value === null) {
      // undefined and null values are to be ignored completely
      return d;
    } else if (String(Object.prototype.toString.call(value)) === '[object Array]') {
      for (i = 0, l = value.length; i < l; i++) {
        if (value[i] !== undefined && value[i] !== null) {
          // arrays don't have names
          d.val.push([undefined, String(value[i])]);
        }
      }

      if (d.val.length) {
        // only treat non-empty arrays as arrays
        d.type = 3; // array
      }
    } else if (String(Object.prototype.toString.call(value)) === '[object Object]') {
      for (i in value) {
        if (hasOwn.call(value, i) && value[i] !== undefined && value[i] !== null) {
          // objects have keys, remember them for named expansion
          d.val.push([i, String(value[i])]);
        }
      }

      if (d.val.length) {
        // only treat non-empty objects as objects
        d.type = 2; // object
      }
    } else {
      d.type = 1; // primitive string (could've been string, number, boolean and objects with a toString())
      // arrays don't have names
      d.val.push([undefined, String(value)]);
    }

    return d;
  };

  // hook into URI for fluid access
  URI.expand = function(expression, data) {
    var template = new URITemplate(expression);
    var expansion = template.expand(data);

    return new URI(expansion);
  };

  return URITemplate;
}));

class ExtendableError extends Error {
  constructor(message) {

    super(message);
    this.name = this.constructor.name;
    this.message = message;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
    else {
      this.stack = (new Error(message)).stack;
    }

  }
}

class BungieNet{

  /**
   * Gets the base bungie.net URI
   * @return {URI}
   */
  static get base(){
    return new URI({
      protocol: BungieNet.scheme,
      hostname: BungieNet.host
    });
  }

  /**
   * Fully qualified hostname
   * @return {String}
   */
  static get host(){
    return `www.${BungieNet.domain}`;
  }

  /**
   * Generates the most appropriate locale-aware base URI
   * @return {Promise}
   */
  static getLocaleBase(){
    return new Promise((resolve) => {
      BungieNet.getLocale().then((loc) => {
        return resolve(BungieNet.base.segment(loc));
      });
    });
  }

  /**
   * Base platform URI
   * @return {URI}
   */
  static get platformPath(){
    return BungieNet.base.segment("Platform");
  }

  /**
   * Find the most appropriate locale to use, taking into account any
   * currently detected user
   * @return {Promise}
   */
  static getLocale(){
    return new Promise((resolve) => {
      //use the current user's default locale if it exists
      //otherwise use the default locale
      BungieNet.CurrentUser.getLocale().then(resolve, () => {
        return resolve(BungieNet.defaultLocale);
      });
    });
  }

}

/**
 * @type {String}
 */
BungieNet.defaultLocale = "en";

/**
 * @type {String}
 */
BungieNet.scheme = "https";

/**
 * @type {String}
 */
BungieNet.domain = "bungie.net";


BungieNet.enums = {

  aclEnum: {
    none: 0,
    bnext_forum_ninja: 1,
    bnext_unlimited_groups: 2,
    bnext_founder_in_all_groups: 3,
    bnext_bungie_gold: 4,
    bnext_ninja_colors: 5,
    bnext_make_official_topics: 6,
    bnext_make_ninja_topics: 7,
    bnext_delete_forum_topics: 8,
    bnext_overturn_reports: 9,
    bnext_browse_reports: 10,
    bnext_global_ignore: 11,
    bnext_edit_any_public_post: 12,
    bnext_edit_users: 13,
    bnext_ultra_ban: 14,
    bnext_forum_mentor: 15,
    tiger_ban: 16,
    bnext_forum_curator: 17,
    bnext_big_likes: 18,
    bnext_player_support: 19,
    bnext_pin_topics: 20,
    bnext_lock_topics: 21,
    bnext_community_content_curator: 22,
    bnext_admin_history: 23,
    bnext_private_user_data_reader: 24,
    bnext_diagnostics_data_reader: 25,
    bnext_override_link_privacy: 26,
    bnext_discount_support: 27
  },

  activityAggregationType: {
    none: 0,
    activities: 1,
    followers: 2
  },

  activityItemOrigin: {
    undetermined: -1,
    followed_group: 0,
    followed_user: 1,
    activities_about_me: 2,
    my_activities: 3
  },

  activityOutputFormat: {
    bnet: 0,
    plain: 1,
    custom: 2
  },

  activityQueryFilter: {
    all: 0,
    friends: 1,
    followers: 2,
    groups: 3,
    mine: 4,
    tags: 5,
    clans: 6
  },

  activityStatus: {
    processing: 0,
    failed: 1,
    skipped: 2,
    complete: 3
  },

  activityType: {
    none: -1,
    create: 0,
    edit: 1,
    "delete": 2,
    rate: 3,
    follow: 4,
    unfollow: 5,
    apply: 6,
    rescind: 7,
    approve: 8,
    deny: 9,
    kick: 10,
    edit_membership_type: 11,
    like: 12,
    unlike: 13,
    share: 14,
    tagged_group: 15,
    tagged_topic: 16,
    avatar_changed: 17,
    display_name_changed: 18,
    title_changed: 19,
    title_unlocked: 20,
    group_topic_create: 21,
    group_reply_create: 22,
    reply: 23,
    change_clan_name: 24,
    group_alliance_rejected: 26
  },

  adminHistoryItemFlags: {
    none: 0
  },

  adminHistoryMembershipFlags: {
    none: 0,
    bungie: 1,
    playerSupport: 2,
    mentor: 4,
    ninja: 8,
    groupAdmin: 16,
    groupFounder: 32,
    founderInAllGroups: 64
  },

  adminHistoryType: {
    none: 0,
    forum_post_ban: 2,
    user_ban: 2,
    user_warning: 3,
    forum_topic_post: 4,
    forum_reply: 5,
    mark_as_answer: 6,
    user_profile_edit: 7,
    unmark_as_answer: 8,
    community_content_approved: 9,
    community_content_rejected: 10,
    group_post_ban: 11,
    forum_post_unban: 12,
    tag_alias: 13,
    tag_unalias: 14,
    group_profile_ban: 15,
    forum_post_edit: 16,
    edited_player_support_flags: 17,
    edited_player_support_text: 18,
    group_settings_edit: 19,
    group_founder_change: 20,
    group_member_promotion_to_admin: 21,
    group_admin_demotion_to_member: 22,
    group_kick_ban: 23,
    group_kick: 24,
    group_unban: 25,
    forum_delete_topic: 26,
    user_profile_ban: 27,
    user_message_ban: 28,
    group_wall_moderate: 29,
    group_wall_ban: 30
  },

  affectedItemType: {
    none: -1,
    user: 0,
    post: 1,
    topic: 2,
    group: 3,
    tag: 4,
    community_content: 5
  },

  bnetAccountPrivacy: {
    "default": 0,
    show_destiny_inventory: 1,
    hide_destiny_activity_history_feed: 2,
    hide_destiny_advisors: 3
  },

  bucketCategory: {
    invisible: 0,
    item: 1,
    currency: 2,
    equippable: 3,
    ignored: 4
  },

  bucketScope: {
    character: 0,
    account: 1
  },

  bungieCredentialType: {
    none: 0,
    xuid: 1,
    psnid: 2,
    wlid: 3,
    fake: 4,
    facebook: 5,
    google: 8,
    windows: 9,
    demonid: 10
  },

  bungieMembershipType: {
    all: -1,
    none: 0,
    tiger_xbox: 1,
    tiget_psn: 2,
    tiger_demon: 10,
    bungie_next: 254
  },

  capabilities: {
    none: 0,
    leaderboards: 1,
    callsign: 2
  },

  chatSecuritySetting: {
    group: 0,
    admins: 1
  },

  clientDeviceType: {
    unknown: 0,
    xbox360: 1,
    playstation3: 2,
    android_phone: 3,
    android_tablet: 4,
    apple_phone: 5,
    apple_tablet: 6,
    web_browser: 7,
    native_windows: 8,
    native_mac: 9,
    windows_phone: 10,
    windows_tablet: 11,
    xbox_one: 12,
    playstation4: 13,
    fake: 255
  },

  communityContentSortMode: {
    trending: 0,
    latest: 1,
    highest_rated: 2
  },

  contentDateRange: {
    all: 0,
    today: 1,
    yesterday: 2,
    this_month: 3,
    this_year: 4,
    last_year: 5,
    earlier_than_last_year: 6
  },

  contentDateType: {
    specific: 0,
    month_only: 1,
    custom: 2
  },

  contentPropertyDataType: {
    none: 0,
    plaintext: 1,
    html: 2,
    dropdown: 3,
    list: 4,
    json: 5,
    content: 6,
    representation: 7,
    set: 8,
    file: 9,
    folder_set: 10,
    date: 11,
    multiline_plaintext: 12,
    destiny_content: 13
  },

  contentSortBy: {
    creation_date: 0,
    cms_path: 1,
    modified_date: 2
  },

  credentialType: {
    none: 0,
    xuid: 1,
    psnid: 2,
    wlid: 3,
    fake: 4,
    facebook: 5,
    xbox_gamertag: 6,
    playstation_online_id: 7,
    google: 8,
    windows: 9,
    demon_id: 10,
    demon_display_name: 11,
    bungie_membership_id: 255
  },

  damageType: {
    none: 0,
    kinetic: 1,
    arc: 2,
    thermal: 3,
    "void": 4,
    raid: 5
  },

  destinyAccountTransferState: {
    unknown: 0,
    no_transfer: 1,
    back_transfer: 2,
    v1_active: 3,
    accounts_split: 4
  },

  destinyActivityDifficultyTier: {
    trivial: 0,
    easy: 1,
    normal: 2,
    challenging: 3,
    hard: 4,
    brave: 5,
    almost_impossible: 6,
    impossible: 7
  },

  destinyActivityModeType: {
    none: 0,
    story: 2,
    strike: 3,
    raid: 4,
    all_pvp: 5,
    patrol: 6,
    all_pve: 7,
    pvp_introduction: 8,
    three_vs_three: 9,
    control: 10,
    lockdown: 11,
    team: 12,
    free_for_all: 13,
    trials_of_osiris: 14,
    doubles: 15,
    nightfall: 16,
    heroic: 17,
    all_strikes: 18,
    iron_banner: 19,
    all_arena: 20,
    arena: 21,
    arena_challenge: 22,
    elimination: 23,
    rift: 24,
    all_mayhem: 25,
    mayhem_clash: 26,
    mayhem_rumble: 27,
    zone_control: 28,
    racing: 29,
    arena_elder_challenge: 30
  },

  destinyCardRarity: {
    none: 0,
    common: 1,
    superior: 2,
    exotic: 3
  },

  destinyClass: {
    titan: 0,
    hunter: 1,
    warlock: 2,
    unknown: 3
  },

  destinyDefinitionType: {
    none: 0,
    activity: 1,
    activity_type: 2,
    "class": 3,
    gender: 4,
    inventory_bucket: 5,
    inventory_item: 6,
    progression: 7,
    race: 8,
    stat: 9,
    talent_grid: 10,
    stat_group: 11,
    unlock_flag: 12,
    vendor: 13,
    destination: 14,
    place: 15,
    directory_book: 16,
    material_requirement: 17,
    sandbox_perk: 18,
    art_dye: 19,
    art_dye_channel: 20,
    activity_bundle: 21,
    gear_asset: 22,
    grimoire_card: 23
  },

  destinyExcellenceBadgeTier: {
    none: 0,
    bronze: 1,
    silver: 2,
    gold: 3
  },

  destinyExplorerBuckets: {
    none: 0,
    artifact: 1,
    materials: 2,
    consumables: 4,
    mission: 8,
    bounties: 16,
    build: 32,
    primary_weapon: 64,
    special_weapon: 128,
    heavy_weapon: 256,
    head: 512,
    arms: 1024,
    chest: 2048,
    legs: 4096,
    class_items: 8192,
    ghost: 16384,
    vehicle: 32758,
    ship: 65536,
    shader: 131072,
    emblem: 262144
  },

  destinyExplorerOrderBy: {
    none: 0,
    name: 1,
    item_type: 2,
    rarity: 3,
    item_type_name: 4,
    item_stat_hash: 5,
    minimum_required_level: 6,
    maximum_required_level: 7
  },

  destinyExplorerOrderDirection: {
    none: 0,
    ascending: 1,
    descending: 2
  },

  destinyGameVersions: {
    none: 0,
    destiny1: 1,
    the_dark_below: 2,
    house_of_wolves: 4,
    comet: 8
  },

  destinyGender: {
    male: 0,
    female: 1,
    unknown: 2
  },

  destinyItemSubType: {
    none: 0,
    crucible: 1,
    vanguard: 2,
    iron_banner: 3,
    queen: 4,
    exotic: 5,
    auto_rifle: 6,
    shotgun: 7,
    machinegun: 8,
    hand_cannon: 9,
    rocket_launcher: 10,
    fusion_rifle: 11,
    sniper_rifle: 12,
    pulse_rifle: 13,
    scout_rifle: 14,
    camera: 15,
    crm: 16,
    sidearm: 17,
    sword: 18,
    mask: 19
  },

  destinyItemType: {
    none: 0,
    currency: 1,
    armor: 2,
    weapon: 3,
    bounty: 4,
    completed_bounty: 5,
    bounty_reward: 6,
    message: 7,
    engram: 8,
    consumable: 9,
    exchange_material: 10,
    mission_reward: 11,
    quest_step: 12,
    quest_step_complete: 13,
    emblem: 14,
    quest: 15
  },

  destinyRace: {
    human: 0,
    awoken: 1,
    exo: 2,
    unknown: 3
  },

  destinyRecordBookPageDisplayStyle: {
    record_page: 0,
    summary_page: 1
  },

  destinyRecordCompletionStatus: {
    incomplete: 0,
    complete: 1,
    redeemed: 2
  },

  destinyRewardSourceCategory: {
    none: 0,
    activity: 1,
    vendor: 2,
    aggregate: 3
  },

  destinyStatsCategoryType: {
    none: 0,
    kills: 1,
    assists: 2,
    deaths: 3,
    criticals: 4,
    kda: 5,
    kd: 6,
    score: 7,
    entered: 8,
    time_played: 9,
    medal_wins: 10,
    medal_game: 11,
    medal_special_kills: 12,
    medal_sprees: 13,
    medal_multi_kills: 14,
    medal_abilities: 15
  },

  destinyStatsGroupType: {
    none: 0,
    general: 1,
    weapons: 2,
    medals: 3,
    enemies: 4,
    reserved_groups: 100,
    leaderboard: 101,
    activity: 102,
    unique_weapon: 103,
    internal: 104
  },

  destinyStatsMergeMethod: {
    add: 0,
    min: 1,
    max: 2
  },

  destinyTalentNodeState: {
    invalid: 0,
    can_upgrade: 1,
    no_points: 2,
    no_prerequisites: 3,
    no_steps: 4,
    no_unlock: 5,
    no_material: 6,
    no_grid_level: 7,
    swapping_locked: 8,
    must_swap: 9,
    complete: 10,
    unknown: 11,
    creation_only: 12,
    hidden: 13
  },

  destinyTalentNodeStepDamageTypes: {
    none: 0,
    kinetic: 1,
    arc: 2,
    solar: 4,
    void: 8,
    all: 15
  },

  destinyTalentNodeStepGuardianAttributes: {
    none: 0,
    stats: 1,
    shields: 2,
    health: 4,
    revive: 8,
    aim_under_fire: 16,
    radar: 32,
    invisibility: 64,
    reputations: 128,
    all: 255
  },

  destinyTalentNodeStepImpactEffects: {
    none: 0,
    armor_piercing: 1,
    ricochet: 2,
    flinch: 4,
    collateral_damage: 8,
    disorient: 16,
    highlight_target: 32,
    all: 63
  },

  destinyTalentNodeStepLightAbilities: {
    none: 0,
    grenades: 1,
    melee: 2,
    movement_modes: 4,
    orbs: 8,
    super_energy: 16,
    super_mods: 32,
    all: 63
  },

  destinyTalentNodeStepWeaponPerformances: {
    none: 0,
    rate_of_fire: 1,
    damage: 2,
    accuracy: 4,
    range: 8,
    zoom: 16,
    recoil: 32,
    ready: 64,
    reload: 128,
    hair_trigger: 256,
    ammo_and_magazine: 512,
    tracking_and_detonation: 1024,
    shotgun_spread: 2048,
    charge_tme: 4096,
    all: 8191
  },

  destinyUnlockFlagOperator: {
    invalid: 0,
    flag: 1,
    not: 2,
    or: 3,
    and: 4,
    nor: 5,
    xor: 6,
    nand: 7,
    equal: 8,
    not_equal: 9,
    unlock_value: 10,
    constant: 11,
    greater_than: 12,
    greater_than_or_equal: 13,
    less_than: 14,
    less_than_or_equal: 15,
    add: 16,
    subtract: 17,
    multiply: 18,
    divide: 19,
    modulus: 20,
    negate: 21
  },

  destinyUnlockValueUIStyle: {
    automatic: 0,
    fraction: 1,
    checkbox: 2,
    percentage: 3
  },

  destinyVendorItemRefundPolicy: {
    not_refundable: 0,
    deletes_item: 1,
    revokes_license: 2
  },

  directorNodeState: {
    hidden: 0,
    visible: 1,
    teaser: 2,
    incomplete: 3,
    completed: 4
  },

  directorNodeUIModifier: {
    none: 0,
    enlarge: 1,
    tower: 2,
    unexpected: 3
  },

  directorTransitionType: {
    transition_book: 0,
    transition_social: 1
  },

  entityType: {
    none: 0,
    user: 1,
    group: 2,
    post: 3,
    invitation: 4,
    report: 5,
    activity: 6,
    conversation: 7,
    tag: 8
  },

  equipFailureReason: {
    none: 0,
    item_unequippable: 1,
    item_unique_equip_restricted: 2,
    item_failed_unlock_check: 4,
    item_failed_level_check: 8,
    item_not_on_character: 16
  },

  eventConversationType: {
    none: 0,
    private: 1,
    group: 2
  },

  externalService: {
    none: 0,
    twitter: 1,
    facebook: 2,
    youtube: 3,
    twitter_help: 4
  },

  forumFlags: {
    none: 0,
    bungie_staff_post: 1,
    forum_ninja_post: 2,
    forum_mentor_post: 4,
    topic_bungie_staff_posted: 8,
    topic_bungie_volunteer_posted: 16,
    question_answered_by_bungie: 32,
    question_answered_by_ninja: 64,
    community_content: 128
  },

  forumFlagsEnum: {
    none: 0,
    bungie_staff_post: 1,
    forum_ninja_post: 2,
    forum_mentor_post: 4,
    topic_bungie_staff_posted: 8,
    topic_bungie_volunteer_posted: 16,
    question_answered_by_bungie: 32,
    question_answered_by_ninja: 64
  },

  forumMediaType: {
    none: 0,
    image: 1,
    video: 2,
    youtube: 3
  },

  forumPostCategory: {
    none: 0,
    text_only: 1,
    media: 2,
    link: 4,
    poll: 8,
    question: 16,
    answered: 32,
    announcement: 64,
    content_comment: 128,
    bungie_official: 256
  },

  forumPostCategoryEnums: {
    none: 0,
    text_only: 1,
    media: 2,
    link: 4,
    poll: 5,
    question: 16,
    answered: 32,
    announcement: 64,
    content_comment: 128,
    bungie_official: 256,
    ninja_official: 512
  },

  forumPostPopularity: {
    empty: 0,
    "default": 1,
    discussed: 2,
    cool_story: 3,
    heating_up: 4,
    hot: 5
  },

  forumPostSortEnum: {
    "default": 0,
    oldest_first: 1
  },

  forumRecruitmentIntensityLabel: {
    none: 0,
    casual: 1,
    professional: 2
  },

  forumRecruitmentToneLabel: {
    none: 0,
    family_friendly: 1,
    rowdy: 2
  },

  forumTopicsCategoryFilters: {
    none: 0,
    links: 1,
    questions: 2,
    answered_questions: 4,
    media: 8,
    text_only: 16,
    announcement: 32,
    bungie_official: 64,
    polls: 128
  },

  forumTopicsCategoryFiltersEnum: {
    none: 0,
    links: 1,
    questions: 2,
    answered_questions: 4,
    media: 8,
    text_only: 16,
    announcement: 32,
    bungie_official: 64,
    polls: 128
  },

  forumTopicsQuickDate: {
    all: 0,
    last_year: 1,
    last_month: 2,
    last_week: 3,
    last_day: 4
  },

  forumTopicsQuickDateEnum: {
    all: 0,
    last_year: 1,
    last_month: 2,
    last_week: 3,
    last_day: 4
  },

  forumTopicsSort: {
    "default": 0,
    last_replied: 1,
    most_replied: 2,
    popularity: 3,
    controversiality: 4,
    liked: 5,
    highest_rated: 6,
    most_upvoted: 7
  },

  forumTopicsSortEnum: {
    "default": 0,
    last_replied: 1,
    most_replied: 2,
    popularity: 3,
    controversiality: 4,
    liked: 5,
    highest_rated: 6
  },

  forumTypeEnum: {
    "public": 0,
    news: 1,
    group: 2,
    alliance: 3,
    related_posts: 4
  },

  friendOnlineStatus: {
    offline: 0,
    online: 1,
    idle: 2
  },

  gameServiceStatus: {
    error: 0,
    not_found: 1,
    success: 2,
    unknown: 3
  },

  globalAcknowledgementItem: {
    triumphs: 0,
    gear_manager: 1
  },

  globalAlertLevel: {
    unknown: 0,
    blue: 1,
    yellow: 2,
    red: 3
  },

  groupAllianceStatus: {
    unallied: 0,
    parent: 1,
    child: 2
  },

  groupApplicationResolveState: {
    unresolved: 0,
    accepted: 1,
    denied: 2,
    rescinded: 3
  },

  groupAttributeType: {
    computed: 0,
    point: 1,
    range: 2
  },

  groupClanEnableStatus: {
    not_applicable: 0,
    clan_enabled_success: 1,
    clan_enabled_failure: 2
  },

  groupDateRange: {
    all: 0,
    past_day: 1,
    past_week: 2,
    past_month: 3,
    past_year: 4
  },

  groupHomepage: {
    wall: 0,
    forum: 1,
    alliance_forum: 2
  },

  groupMemberCountFilter: {
    all: 0,
    one_to_ten: 1,
    eleven_to_one_hundred: 2,
    greater_than_one_hundred: 3
  },

  groupMemberSortBy: {
    type_and_duration: 0,
    duration: 1,
    name: 2,
    activity: 3
  },

  groupMemberType: {
    none: -1,
    member: 0,
    admin: 1,
    founder: 2
  },

  groupPostPublicity: {
    public: 0,
    alliance: 1,
    private: 2
  },

  groupRelationshipResult: {
    approved: 0,
    created: 1,
    failed: 2
  },

  groupSortBy: {
    name: 0,
    date: 1,
    popularity: 2,
    id: 3
  },

  groupType: {
    general: 0
  },

  groupsForMemberFilter: {
    all: 0,
    founded: 1,
    non_founded: 2
  },

  groupTypeSearchFilter: {
    all: 0,
    group: 1,
    clan: 2
  },

  ignoreLength: {
    none: 0,
    week: 1,
    two_weeks: 2,
    three_weeks: 3,
    month: 4,
    three_months: 5,
    six_months: 6,
    year: 7,
    forever: 8,
    three_minutes: 9,
    hour: 10,
    thirty_days: 11
  },

  ignoreStatus: {
    not_ignored: 0,
    ignored_user: 1,
    ignored_group: 2,
    ignored_by_group: 4,
    ignored_post: 8,
    ignored_tag: 16,
    ignored_global: 32
  },

  ignoredItemType: {
    all: 0,
    post: 1,
    group: 2,
    user: 3,
    tag: 4,
    group_profile: 5,
    user_profile: 6,
    user_private_message: 7,
    group_wall_post: 8,
    private_message: 9
  },

  invitationResponseState: {
    unreviewed: 0,
    approved: 1,
    rejected: 2
  },

  invitationType: {
    none: 0,
    group_alliance_join_from_child: 1,
    clan_join_invite: 2,
    group_alliance_invite_from_owner: 3,
    group_join_invite: 4,
    clan_join_request: 5,
    group_join_request: 6
  },

  itemBindStatus: {
    not_bound: 0,
    bound_to_character: 1,
    bound_to_account: 2,
    bound_to_guild: 3
  },

  itemLocation: {
    unknown: 0,
    inventory: 1,
    vault: 2,
    vendor: 3,
    postmaster: 4
  },

  itemState: {
    none: 0,
    locked: 1,
    tracked: 2
  },

  marketplaceCodeRegion: {
    global: 0,
    usa: 1,
    europe: 2,
    japan: 3
  },

  membershipOption: {
    reviewed: 0,
    open: 1,
    closed: 2
  },

  migrationMode: {
    convert_to_clan: 0,
    split_clan: 1
  },

  moderatorRequestedPunishment: {
    unknown: 0,
    warning: 1,
    seven_day_ban: 2,
    thirty_day_ban: 3,
    permanent_ban: 4
  },

  notificationMethod: {
    none: 0,
    email: 1,
    mobile_push: 2,
    web_only: 4
  },

  notificationType: {
    message: 1,
    forum_reply: 2,
    new_activity_rollup: 3,
    settings_change: 4,
    group_acceptance: 5,
    group_join_request: 6,
    follow_user_activity: 7,
    friend_user_activity: 8,
    forum_like: 9,
    followed: 10,
    group_banned: 11,
    banned: 12,
    unbanned: 13,
    group_open_join: 14,
    group_alliance_join_requested: 15,
    group_alliance_join_rejected: 16,
    group_alliance_join_approved: 17,
    group_alliance_broken: 18,
    group_denial: 19,
    warned: 20,
    clan_disabled: 21,
    group_alliance_invite_requested: 22,
    group_alliance_invite_rejected: 23,
    group_alliance_invite_approved: 24,
    group_followed_by_group: 25,
    grimoire_unobserved_cards: 26,
    community_content_like: 27,
    community_content_approved: 28,
    user_profile_banned: 29,
    user_message_banned: 30,
    support_form_received: 31,
    raf_newbie_needs_to_play_ttk: 32,
    raf_ttk_quest_ready: 33,
    recruit_thread_ready: 34,
    recruit_thread_kicked: 35,
    recruit_thread_canceled: 36,
    group_wall_banned: 37,
    banned_permanent: 38,
    user_profile_banned_permanent: 39,
    user_message_banned_permanent: 40,
    group_wall_banned_permanent: 41
  },

  offerRedeemMode: {
    off: 0,
    unlock: 1,
    platform: 2,
    expired: 3,
    consumable: 4
  },

  optInFlags: {
    newsletter: 1,
    system: 2,
    marketing: 4,
    user_research: 8,
    customer_service: 16
  },

  platformErrorCodes: {
    none: 0,
    success: 1,
    transport_exception: 2,
    unhandled_exception: 3,
    not_implemented: 4,
    system_disabled: 5,
    failed_to_load_available_locales_configuration: 6,
    parameter_parse_failure: 7,
    parameter_invalid_range: 8,
    bad_request: 9,
    authentication_invalid: 10,
    data_not_found: 11,
    insufficient_privileges: 12,
    duplicate: 13,
    unknown_sql_result: 14,
    validation_error: 15,
    validation_missing_field_error: 16,
    validation_invalid_input_error: 17,
    invalid_parameters: 18,
    parameter_not_found: 19,
    unhandled_http_exception: 20,
    not_found: 21,
    web_auth_module_async_failed: 22,
    invalid_return_value: 23,
    user_banned: 24,
    invalid_post_body: 25,
    missing_post_body: 26,
    external_service_timeout: 27,
    validation_length_error: 28,
    validation_range_error: 29,
    json_deserialization_error: 30,
    throttle_limit_exceeded: 31,
    validation_tag_error: 32,
    validation_profanity_error: 33,
    validation_url_format_error: 34,
    throttle_limit_exceeded_minutes: 35,
    throttle_limit_exceeded_momentarily: 36,
    throttle_limit_exceeded_seconds: 37,
    external_service_unknown: 38,
    validation_word_length_error: 39,
    validation_invisible_unicode: 40,
    validation_bad_names: 41,
    external_service_failed: 42,
    service_retired: 43,
    unknown_sql_exception: 44,
    unsupported_locale: 45,
    invalid_page_number: 46,
    maximum_page_size_exceeded: 47,
    service_unsupported: 48,
    validation_maximum_unicode_combining_characters: 49,
    validation_maximum_sequential_carriage_returns: 50,
    per_endpoint_request_throttle_exceeded: 51,
    auth_context_cache_assertion: 52,
    obsolete_credential_type: 89,
    unable_to_un_pair_mobile_app: 90,
    unable_to_pair_mobile_app: 91,
    cannot_use_mobile_auth_with_non_mobile_provider: 92,
    missing_device_cookie: 93,
    facebook_token_expired: 94,
    auth_ticket_required: 95,
    cookie_context_required: 96,
    unknown_authentication_error: 97,
    bungie_net_account_creation_required: 98,
    web_auth_required: 99,
    content_unknown_sql_result: 100,
    content_need_unique_path: 101,
    content_sql_exception: 102,
    content_not_found: 103,
    content_success_with_tag_add_fail: 104,
    content_search_missing_parameters: 105,
    content_invalid_id: 106,
    content_physical_file_deletion_error: 107,
    content_physical_file_creation_error: 108,
    content_perforce_submission_error: 109,
    content_perforce_initialization_error: 110,
    content_deployment_package_not_ready_error: 111,
    content_upload_failed: 112,
    content_too_many_results: 113,
    content_invalid_state: 115,
    content_navigation_parent_not_found: 116,
    content_navigation_parent_update_error: 117,
    deployment_package_not_editable: 118,
    content_validation_error: 119,
    content_properties_validation_error: 120,
    content_type_not_found: 121,
    deployment_package_not_found: 122,
    content_search_invalid_parameters: 123,
    content_item_property_aggregation_error: 124,
    deployment_package_file_not_found: 125,
    content_perforce_file_history_not_found: 126,
    content_asset_zip_creation_failure: 127,
    content_asset_zip_creation_busy: 128,
    content_project_not_found: 129,
    content_folder_not_found: 130,
    content_packages_inconsistent: 131,
    content_packages_invalid_state: 132,
    content_packages_inconsistent_type: 133,
    content_cannot_delete_package: 134,
    content_locked_for_changes: 135,
    content_file_upload_failed: 136,
    content_not_reviewed: 137,
    content_permission_denied: 138,
    content_invalid_external_url: 139,
    content_external_file_cannot_be_imported_locally: 140,
    content_tag_save_failure: 141,
    content_perforce_unmatched_file_error: 142,
    content_perforce_changelist_result_not_found: 143,
    content_perforce_changelist_file_items_not_found: 144,
    content_perforce_invalid_revision_error: 145,
    content_unloaded_save_result: 146,
    content_property_invalid_number: 147,
    content_property_invalid_url: 148,
    content_property_invalid_date: 149,
    content_property_invalid_set: 150,
    content_property_cannot_deserialize: 151,
    content_regex_validation_fail_on_property: 152,
    content_max_length_fail_on_property: 153,
    content_property_unexpected_deserialization_error: 154,
    content_property_required: 155,
    content_cannot_create_file: 156,
    content_invalid_migration_file: 157,
    content_migration_altering_processed_item: 158,
    content_property_definition_not_found: 159,
    content_review_data_changed: 160,
    content_rollback_revision_not_in_package: 161,
    content_item_not_based_on_latest_revision: 162,
    content_unauthorized: 163,
    content_cannot_create_deployment_package: 164,
    content_user_not_found: 165,
    content_locale_permission_denied: 166,
    content_invalid_link_to_internal_environment: 167,
    content_invalid_blacklisted_content: 168,
    content_macro_malformed_no_content_id: 169,
    content_macro_malformed_no_template_type: 170,
    content_illegal_bnet_membership_id: 171,
    content_locale_did_not_match_expected: 172,
    content_babel_call_failed: 173,
    user_non_unique_name: 200,
    user_manual_linking_step_required: 201,
    user_create_unknown_sql_result: 202,
    user_create_unknown_sql_exception: 203,
    user_malformed_membership_id: 204,
    user_cannot_find_requested_user: 205,
    user_cannot_load_account_credential_link_info: 206,
    user_invalid_mobile_app_type: 207,
    user_missing_mobile_pairing_info: 208,
    user_cannot_generate_mobile_key_while_using_mobile_credential: 209,
    user_generate_mobile_key_existing_slot_collision: 210,
    user_display_name_missing_or_invalid: 211,
    user_cannot_load_account_profile_data: 212,
    user_cannot_save_user_profile_data: 213,
    user_email_missing_or_invalid: 214,
    user_terms_of_use_required: 215,
    user_cannot_create_new_account_while_logged_in: 216,
    user_cannot_resolve_central_account: 217,
    user_invalid_avatar: 218,
    user_missing_created_user_result: 219,
    user_cannot_change_unique_name_yet: 220,
    user_cannot_change_display_name_yet: 221,
    user_cannot_change_email: 222,
    user_unique_name_must_start_with_letter: 223,
    user_no_linked_accounts_support_friend_listings: 224,
    user_acknowledgment_table_full: 225,
    user_creation_destiny_membership_required: 226,
    user_friends_token_needs_refresh: 227,
    messaging_unknown_error: 300,
    messaging_self_error: 301,
    messaging_send_throttle: 302,
    messaging_no_body: 303,
    messaging_too_many_users: 304,
    messaging_can_not_leave_conversation: 305,
    messaging_unable_to_send: 306,
    messaging_deleted_user_forbidden: 307,
    messaging_cannot_delete_external_conversation: 308,
    messaging_group_chat_disabled: 309,
    messaging_must_include_self_in_private_message: 310,
    messaging_sender_is_banned: 311,
    add_survey_answers_unknown_sql_exception: 400,
    forum_body_cannot_be_empty: 500,
    forum_subject_cannot_be_empty_on_topic_post: 501,
    forum_cannot_locate_parent_post: 502,
    forum_thread_locked_for_replies: 503,
    forum_unknown_sql_result_during_create_post: 504,
    forum_unknown_tag_creation_error: 505,
    forum_unknown_sql_result_during_tag_item: 506,
    forum_unknown_exception_create_post: 507,
    forum_question_must_be_topic_post: 508,
    forum_exception_during_tag_search: 509,
    forum_exception_during_topic_retrieval: 510,
    forum_aliased_tag_error: 511,
    forum_cannot_locate_thread: 512,
    forum_unknown_exception_edit_post: 513,
    forum_cannot_locate_post: 514,
    forum_unknown_exception_get_or_create_tags: 515,
    forum_edit_permission_denied: 516,
    forum_unknown_sql_result_during_tag_id_retrieval: 517,
    forum_cannot_get_rating: 518,
    forum_unknown_exception_get_rating: 519,
    forum_ratings_access_error: 520,
    forum_related_post_access_error: 521,
    forum_latest_reply_access_error: 522,
    forum_user_status_access_error: 523,
    forum_author_access_error: 524,
    forum_group_access_error: 525,
    forum_url_expected_but_missing: 526,
    forum_replies_cannot_be_empty: 527,
    forum_replies_cannot_be_in_different_groups: 528,
    forum_sub_topic_cannot_be_created_at_this_thread_level: 529,
    forum_cannot_create_content_topic: 530,
    forum_topic_does_not_exist: 531,
    forum_content_comments_not_allowed: 532,
    forum_unknown_sql_result_during_edit_post: 533,
    forum_unknown_sql_result_during_get_post: 534,
    forum_post_validation_bad_url: 535,
    forum_body_too_long: 536,
    forum_subject_too_long: 537,
    forum_announcement_not_allowed: 538,
    forum_cannot_share_own_post: 539,
    forum_edit_no_op: 540,
    forum_unknown_database_error_during_get_post: 541,
    forum_exceeed_maximum_row_limit: 542,
    forum_cannot_share_private_post: 543,
    forum_cannot_cross_post_between_groups: 544,
    forum_incompatible_categories: 555,
    forum_cannot_use_these_categories_on_non_topic_post: 556,
    forum_can_only_delete_topics: 557,
    forum_delete_sql_exception: 558,
    forum_delete_sql_unknown_result: 559,
    forum_too_many_tags: 560,
    forum_can_only_rate_topics: 561,
    forum_banned_posts_cannot_be_edited: 562,
    forum_thread_root_is_banned: 563,
    forum_cannot_use_official_tag_category_as_tag: 564,
    forum_answer_cannot_be_made_on_create_post: 565,
    forum_answer_cannot_be_made_on_edit_post: 566,
    forum_answer_post_id_is_not_adirect_reply_of_question: 567,
    forum_answer_topic_id_is_not_aquestion: 568,
    forum_unknown_exception_during_mark_answer: 569,
    forum_unknown_sql_result_during_mark_answer: 570,
    forum_cannot_rate_your_own_posts: 571,
    forum_polls_must_be_the_first_post_in_topic: 572,
    forum_invalid_poll_input: 573,
    forum_group_admin_edit_non_member: 574,
    forum_cannot_edit_moderator_edited_post: 575,
    forum_requires_destiny_membership: 576,
    forum_unexpected_error: 577,
    forum_age_lock: 578,
    forum_max_pages: 579,
    forum_max_pages_oldest_first: 580,
    forum_cannot_apply_forum_id_without_tags: 581,
    forum_cannot_apply_forum_id_to_non_topics: 582,
    forum_cannot_downvote_community_creations: 583,
    forum_topics_must_have_official_category: 584,
    forum_recruitment_topic_malformed: 585,
    forum_recruitment_topic_not_found: 586,
    forum_recruitment_topic_no_slots_remaining: 587,
    forum_recruitment_topic_kick_ban: 588,
    forum_recruitment_topic_requirements_not_met: 589,
    forum_recruitment_topic_no_players: 590,
    forum_recruitment_approve_fail_message_ban: 591,
    forum_recruitment_global_ban: 592,
    forum_user_banned_from_this_topic: 593,
    forum_recruitment_fireteam_members_only: 594,
    group_membership_application_already_resolved: 601,
    group_membership_already_applied: 602,
    group_membership_insufficient_privileges: 603,
    group_id_not_returned_from_creation: 604,
    group_search_invalid_parameters: 605,
    group_membership_pending_application_not_found: 606,
    group_invalid_id: 607,
    group_invalid_membership_id: 608,
    group_invalid_membership_type: 609,
    group_missing_tags: 610,
    group_membership_not_found: 611,
    group_invalid_rating: 612,
    group_user_following_access_error: 613,
    group_user_membership_access_error: 614,
    group_creator_access_error: 615,
    group_admin_access_error: 616,
    group_private_post_not_viewable: 617,
    group_membership_not_logged_in: 618,
    group_not_deleted: 619,
    group_unknown_error_undeleting_group: 620,
    group_deleted: 621,
    group_not_found: 622,
    group_member_banned: 623,
    group_membership_closed: 624,
    group_private_post_override_error: 625,
    group_name_taken: 626,
    group_deletion_grace_period_expired: 627,
    group_cannot_check_ban_status: 628,
    group_maximum_membership_count_reached: 629,
    no_destiny_account_for_clan_platform: 630,
    already_requesting_membership_for_clan_platform: 631,
    already_clan_member_on_platform: 632,
    group_joined_cannot_set_clan_name: 633,
    group_left_cannot_clear_clan_name: 634,
    group_relationship_request_pending: 635,
    group_relationship_request_blocked: 636,
    group_relationship_request_not_found: 637,
    group_relationship_block_not_found: 638,
    group_relationship_not_found: 639,
    group_already_allied: 641,
    group_already_member: 642,
    group_relationship_already_exists: 643,
    invalid_group_types_for_relationship_request: 644,
    group_at_maximum_alliances: 646,
    group_cannot_set_clan_only_settings: 647,
    clan_cannot_set_two_default_post_types: 648,
    group_member_invalid_member_type: 649,
    group_invalid_platform_type: 650,
    group_member_invalid_sort: 651,
    group_invalid_resolve_state: 652,
    clan_already_enabled_for_platform: 653,
    clan_not_enabled_for_platform: 654,
    clan_enabled_but_could_not_join_no_account: 655,
    clan_enabled_but_could_not_join_already_member: 656,
    clan_cannot_join_no_credential: 657,
    no_clan_membership_for_platform: 658,
    group_to_group_follow_limit_reached: 659,
    child_group_already_in_alliance: 660,
    owner_group_already_in_alliance: 661,
    alliance_owner_cannot_join_alliance: 662,
    group_not_in_alliance: 663,
    child_group_cannot_invite_to_alliance: 664,
    group_to_group_already_followed: 665,
    group_to_group_not_following: 666,
    clan_maximum_membership_reached: 667,
    clan_name_not_valid: 668,
    clan_name_not_valid_error: 669,
    alliance_owner_not_defined: 670,
    alliance_child_not_defined: 671,
    clan_name_illegal_characters: 672,
    clan_tag_illegal_characters: 673,
    clan_requires_invitation: 674,
    clan_membership_closed: 675,
    clan_invite_already_member: 676,
    group_invite_already_member: 677,
    group_join_approval_required: 678,
    clan_tag_required: 679,
    group_name_cannot_start_or_end_with_white_space: 680,
    clan_callsign_cannot_start_or_end_with_white_space: 681,
    clan_migration_failed: 682,
    clan_not_enabled_already_member_of_another_clan: 683,
    group_moderation_not_permitted_on_non_members: 684,
    clan_creation_in_world_server_failed: 685,
    clan_not_found: 686,
    clan_membership_level_does_not_permit_that_action: 687,
    clan_member_not_found: 688,
    clan_missing_membership_approvers: 689,
    clan_in_wrong_state_for_requested_action: 690,
    clan_name_already_used: 691,
    clan_too_few_members: 692,
    activities_unknown_exception: 701,
    activities_parameter_null: 702,
    activity_counts_diabled: 703,
    activity_search_invalid_parameters: 704,
    activity_permission_denied: 705,
    share_already_shared: 706,
    activity_logging_disabled: 707,
    item_already_followed: 801,
    item_not_followed: 802,
    cannot_follow_self: 803,
    group_follow_limit_exceeded: 804,
    tag_follow_limit_exceeded: 805,
    user_follow_limit_exceeded: 806,
    follow_unsupported_entity_type: 807,
    no_valid_tags_in_list: 900,
    below_minimum_suggestion_length: 901,
    cannot_get_suggestions_on_multiple_tags_simultaneously: 902,
    not_avalid_partial_tag: 903,
    tag_suggestions_unknown_sql_result: 904,
    tags_unable_to_load_popular_tags_from_database: 905,
    tag_invalid: 906,
    tag_not_found: 907,
    single_tag_expected: 908,
    ignore_invalid_parameters: 1,
    ignore_sql_exception: 1001,
    ignore_error_retrieving_group_permissions: 1002,
    ignore_error_insufficient_permission: 1003,
    ignore_error_retrieving_item: 1004,
    ignore_cannot_ignore_self: 1005,
    ignore_illegal_type: 1006,
    ignore_not_found: 1007,
    ignore_user_globally_ignored: 1008,
    ignore_user_ignored: 1009,
    notification_setting_invalid: 1100,
    psn_api_expired_access_token: 1204,
    psnex_forbidden: 1205,
    psnex_system_disabled: 1218,
    psn_api_error_code_unknown: 1223,
    psn_api_error_web_exception: 1224,
    psn_api_bad_request: 1225,
    psn_api_access_token_required: 1226,
    psn_api_invalid_access_token: 1227,
    psn_api_banned_user: 1229,
    psn_api_account_upgrade_required: 1230,
    psn_api_service_temporarily_unavailable: 1231,
    psn_api_server_busy: 1232,
    psn_api_under_maintenance: 1233,
    psn_api_profile_user_not_found: 1234,
    psn_api_profile_privacy_restriction: 1235,
    psn_api_profile_under_maintenance: 1236,
    psn_api_account_attribute_missing: 1237,
    xbl_ex_system_disabled: 1300,
    xbl_ex_unknown_error: 1301,
    xbl_api_error_web_exception: 1302,
    xbl_sts_token_invalid: 1303,
    xbl_sts_missing_token: 1304,
    xbl_sts_expired_token: 1305,
    xbl_access_to_the_sandbox_denied: 1306,
    xbl_msa_response_missing: 1307,
    xbl_msa_access_token_expired: 1308,
    xbl_msa_invalid_request: 1309,
    xbl_msa_friends_require_sign_in: 1310,
    xbl_user_action_required: 1311,
    xbl_parental_controls: 1312,
    xbl_developer_account: 1313,
    xbl_user_token_expired: 1314,
    xbl_user_token_invalid: 1315,
    xbl_offline: 1316,
    xbl_unknown_error_code: 1317,
    xbl_msa_invalid_grant: 1318,
    report_not_yet_resolved: 1400,
    report_overturn_does_not_change_decision: 1401,
    report_not_found: 1402,
    report_already_reported: 1403,
    report_invalid_resolution: 1404,
    legacy_game_stats_system_disabled: 1500,
    legacy_game_stats_unknown_error: 1501,
    legacy_game_stats_malformed_sneaker_net_code: 1502,
    destiny_account_acquisition_failure: 1600,
    destiny_account_not_found: 1601,
    destiny_build_stats_database_error: 1602,
    destiny_character_stats_database_error: 1603,
    destiny_pv_pstats_database_error: 1604,
    destiny_pv_estats_database_error: 1605,
    destiny_grimoire_stats_database_error: 1606,
    destiny_stats_parameter_membership_type_parse_error: 1607,
    destiny_stats_parameter_membership_id_parse_error: 1608,
    destiny_stats_parameter_range_parse_error: 1609,
    destiny_string_item_hash_not_found: 1610,
    destiny_string_set_not_found: 1611,
    destiny_content_lookup_not_found_for_key: 1612,
    destiny_content_item_not_found: 1613,
    destiny_content_section_not_found: 1614,
    destiny_content_property_not_found: 1615,
    destiny_content_config_not_found: 1616,
    destiny_content_property_bucket_value_not_found: 1617,
    destiny_unexpected_error: 1618,
    destiny_invalid_action: 1619,
    destiny_character_not_found: 1620,
    destiny_invalid_flag: 1621,
    destiny_invalid_request: 1622,
    destiny_item_not_found: 1623,
    destiny_invalid_customization_choices: 1624,
    destiny_vendor_item_not_found: 1625,
    destiny_internal_error: 1626,
    destiny_vendor_not_found: 1627,
    destiny_recent_activities_database_error: 1628,
    destiny_item_bucket_not_found: 1629,
    destiny_invalid_membership_type: 1630,
    destiny_version_incompatibility: 1631,
    destiny_item_already_in_inventory: 1632,
    destiny_bucket_not_found: 1633,
    destiny_character_not_in_tower: 1634,
    destiny_character_not_logged_in: 1635,
    destiny_definitions_not_loaded: 1636,
    destiny_inventory_full: 1637,
    destiny_item_failed_level_check: 1638,
    destiny_item_failed_unlock_check: 1639,
    destiny_item_unequippable: 1640,
    destiny_item_unique_equip_restricted: 1641,
    destiny_no_room_in_destination: 1642,
    destiny_service_failure: 1643,
    destiny_service_retired: 1644,
    destiny_transfer_failed: 1645,
    destiny_transfer_not_found_for_source_bucket: 1646,
    destiny_unexpected_result_in_vendor_transfer_check: 1647,
    destiny_uniqueness_violation: 1648,
    destiny_error_deserialization_failure: 1649,
    destiny_valid_account_ticket_required: 1650,
    destiny_shard_relay_client_timeout: 1651,
    destiny_shard_relay_proxy_timeout: 1652,
    destiny_pgcrnot_found: 1653,
    destiny_account_must_be_offline: 1654,
    destiny_can_only_equip_in_game: 1655,
    destiny_cannot_perform_action_on_equipped_item: 1656,
    destiny_quest_already_completed: 1657,
    destiny_quest_already_tracked: 1658,
    destiny_trackable_quests_full: 1659,
    destiny_item_not_transferrable: 1660,
    destiny_vendor_purchase_not_allowed: 1661,
    destiny_content_version_mismatch: 1662,
    destiny_item_action_forbidden: 1663,
    destiny_refund_invalid: 1664,
    destiny_privacy_restriction: 1665,
    destiny_action_insufficient_privileges: 1666,
    destiny_invalid_claim_exception: 1667,
    fb_invalid_request: 1800,
    fb_redirect_mismatch: 1801,
    fb_access_denied: 1802,
    fb_unsupported_response_type: 1803,
    fb_invalid_scope: 1804,
    fb_unsupported_grant_type: 1805,
    fb_invalid_grant: 1806,
    invitation_expired: 1900,
    invitation_unknown_type: 1901,
    invitation_invalid_response_status: 1902,
    invitation_invalid_type: 1903,
    invitation_already_pending: 1904,
    invitation_insufficient_permission: 1905,
    invitation_invalid_code: 1906,
    invitation_invalid_target_state: 1907,
    invitation_cannot_be_reactivated: 1908,
    invitation_no_recipients: 1910,
    invitation_group_cannot_send_to_self: 1911,
    invitation_too_many_recipients: 1912,
    invitation_invalid: 1913,
    invitation_not_found: 1914,
    token_invalid: 2,
    token_bad_format: 2001,
    token_already_claimed: 2002,
    token_already_claimed_self: 2003,
    token_throttling: 2004,
    token_unknown_redemption_failure: 2005,
    token_purchase_claim_failed_after_token_claimed: 2006,
    token_user_already_owns_offer: 2007,
    token_invalid_offer_key: 2008,
    token_email_not_validated: 2009,
    token_provisioning_bad_vendor_or_offer: 2010,
    token_purchase_history_unknown_error: 2011,
    token_throttle_state_unknown_error: 2012,
    token_user_age_not_verified: 2013,
    token_exceeded_offer_maximum: 2014,
    token_no_available_unlocks: 2015,
    token_marketplace_invalid_platform: 2016,
    token_no_marketplace_codes_found: 2017,
    token_offer_not_available_for_redemption: 2018,
    token_unlock_partial_failure: 2019,
    token_marketplace_invalid_region: 2020,
    token_offer_expired: 2021,
    rafexceeded_maximum_referrals: 2022,
    rafduplicate_bond: 2023,
    rafno_valid_veteran_destiny_memberships_found: 2024,
    rafnot_avalid_veteran_user: 2025,
    rafcode_already_claimed_or_not_found: 2026,
    rafmismatched_destiny_membership_type: 2027,
    rafunable_to_access_purchase_history: 2028,
    rafunable_to_create_bond: 2029,
    rafunable_to_find_bond: 2030,
    rafunable_to_remove_bond: 2031,
    rafcannot_bond_to_self: 2032,
    rafinvalid_platform: 2033,
    rafgenerate_throttled: 2034,
    rafunable_to_create_bond_version_mismatch: 2035,
    rafunable_to_remove_bond_version_mismatch: 2036,
    rafredeem_throttled: 2037,
    no_available_discount_code: 2038,
    discount_already_claimed: 2039,
    discount_claim_failure: 2040,
    discount_configuration_failure: 2041,
    discount_generation_failure: 2042,
    discount_already_exists: 2043,
    api_exceeded_max_keys: 2100,
    api_invalid_or_expired_key: 2101,
    api_key_missing_from_request: 2102
  },

  periodType: {
    none: 0,
    daily: 1,
    monthly: 2,
    all_time: 3,
    activity: 4
  },

  rafBondState: {
    none: 0,
    awaiting_new_player_destiny_membership: 1,
    awaiting_new_player_verification: 2,
    new_player_verified: 3,
    bond_locked_in: 100,
    bond_removed: -100,
    failed_new_player_already_referred: -3,
    failed_new_player_is_veteran_player: -2,
    failed_new_player_is_not_new: -1
  },

  rafEligibility: {
    unknown: 0,
    purchase_required: 1,
    new_player_eligible: 2,
    not_eligible: -1
  },

  realTimeEventType: {
    none: 0,
    conversation_changed: 1,
    typing: 2,
    notifications_changed: 3,
    message_counts: 4,
    friend_counts: 5,
    announcements: 6,
    recruit_thread_update: 7
  },

  reportResolutionStatus: {
    unresolved: 0,
    innocent: 1,
    guilty_ban: 2,
    guilty_blast_ban: 3,
    guilty_warn: 4,
    guilty_alias: 5,
    resolve_no_action: 6
  },

  requestedPunishment: {
    ban: 0,
    warn: 1,
    blast_ban: 2
  },

  specialItemType: {
    none: 0,
    special_currency: 1,
    completed_bounty: 2,
    crucible_bounty: 3,
    vanguard_bounty: 4,
    iron_banner_bounty: 5,
    queen_bounty: 6,
    exotic_bounty: 7,
    armor: 8,
    weapon: 9,
    engram: 23,
    consumable: 24,
    exchange_material: 25,
    pvp_ticket: 26,
    mission_reward: 27,
    bounty_reward: 28,
    currency: 29
  },

  statFeedbackState: {
    good: 0,
    too_high: 1,
    too_low: 2,
    wrong_name: 4
  },

  successMessages: {
    following: 1,
    unfollowing: 2,
    managing_group_members: 8,
    updating_settings: 16,
    managing_groups: 32
  },

  surveyCompletionFlags: {
    none: 0,
    user_research_web_page_one: 1,
    user_research_web_page_two: 2
  },

  templateFormat: {
    bnet: 0,
    plain: 1,
    e_mail: 2,
    push: 3
  },

  textParameterSearchType: {
    contains: 0,
    exact: 1,
    starts_with: 2,
    ends_with: 3
  },

  tierType: {
    unknown: 0,
    currency: 1,
    basic: 2,
    common: 3,
    rare: 4,
    superior: 5,
    exotic: 6
  },

  transferStatuses: {
    can_transfer: 0,
    item_is_equipped: 1,
    not_transferrable: 2,
    no_room_in_destination: 4
  },

  unitType: {
    none: 0,
    count: 1,
    per_game: 2,
    seconds: 3,
    points: 4,
    team: 5,
    distance: 6,
    percent: 7,
    ratio: 8,
    boolean: 9,
    weapon_type: 10,
    standing: 11,
    milliseconds: 12
  },

  vendorItemStatus: {
    success: 0,
    no_inventory_space: 1,
    no_funds: 2,
    no_progression: 4,
    no_unlock: 8,
    no_quantity: 16,
    outside_purchase_window: 32,
    not_available: 64,
    uniqueness_violation: 128,
    unknown_error: 256,
    already_selling: 512,
    unsellable: 1024,
    selling_inhibited: 2048,
    already_owned: 4096
  }

};

BungieNet.Error = class extends ExtendableError{
  constructor(code, message = null, data = null){
    super(message);
    this.code = code;
    this.data = data;
  }
};

BungieNet.Error.codes = {
  codes: {
    no_cookie_by_name: 1,
    network_error: 2,
    no_csrf_token: 3,
    corrupt_response: 4,
    no_cookie_provider: 5
  }
};

BungieNet.Cookies = class{

  /**
   * Returns the cookie with the given name
   * @param  {String} name
   * @return {Promise}
   */
  static get(name){
    return new Promise((resolve, reject) => {
      BungieNet.Cookies
        .getMatching(c => c.name === name)
        .then((cookies) => {

          if(cookies.length === 0){
            return reject(new BungieNet.Error(
              BungieNet.Error.codes.no_cookie_by_name
            ));
          }

          return resolve(cookies[0]);

        }, reject);
    });
  }

  /**
   * Returns an array of cookies which pass the predicate function
   * @param  {Function} predicate
   * @return {Promise}
   */
  static getMatching(predicate){
    return new Promise((resolve, reject) => {

      try{
        BungieNet.Cookies.provider
          .getAll()
          .then(cookies => resolve(cookies.filter(predicate)));
      }
      catch(ex){
        return reject(new BungieNet.Error(
          BungieNet.Error.codes.no_cookie_provider
        ));
      }

    });
  }

  /**
   * Returns an array of session cookies
   * @return {Promise}
   */
  static getSessionCookies(){
    return BungieNet.Cookies.getMatching(c => c.session);
  }

  /**
   * Returns the value for a given cookie name
   * @param  {String} name name of cookie
   * @return {Promise}
   */
  static getValue(name){
    return new Promise((resolve, reject) => {
      BungieNet.Cookies
        .get(name)
        .then(cookie => resolve(cookie.value), reject)
        .catch(() => reject(void 0));
    });
  }

};

/**
 * Cookie provider interface
 * @type {mixed}
 */
BungieNet.Cookies.provider = null;

BungieNet.CurrentUser = class{

  /**
   * Returns a bool for whether the user is signed in based on cookie existence
   * @return {Promise}
   */
  static authenticated(){
    return new Promise((resolve) => {

      //if cookie found, resolve as true
      //if it isn't found, resolve as false
      //TODO: does this make sense?
      return BungieNet.Cookies
        .get("bungleatk")
        .then(() => resolve(true), () => resolve(false));

    });
  }

  /**
   * Whether there is any trace of an existing user
   * @return {Promise}
   */
  static exists(){
    return new Promise((resolve, reject) => {
      BungieNet.Cookies
        .getMatching(c => c)
        .then(cookies => {

          if(cookies.length > 0){
            return resolve();
          }
          else{
            return reject();
          }

        });
    });
  }

  /**
   * Returns the CSRF token for API requests
   * @return {Promise}
   */
  static getCsrfToken(){
    //token is the value of the bungled cookie
    return BungieNet.Cookies.getValue("bungled");
  }

  /**
   * Returns the member id of the current user
   * @return {Promise}
   */
  static getMembershipId(){
    return new Promise((resolve, reject) => {
      BungieNet.Cookies
        .getValue("bungleme")
        .then(id => resolve(parseInt(id, 10)), reject);
    });
  }

  /**
   * Returns the set bungie.net theme
   * @return {Promise}
   */
  static getTheme(){
    return BungieNet.cookies.getValue("bungletheme");
  }

  /**
   * Returns the current user's locale
   * @return {Promise} resolves with string if successful, otherwise rejected
   * with null
   */
  static getLocale(){
    return new Promise((resolve, reject) => {
      BungieNet.Cookies.getValue("bungleloc")
        .then((str) => {

            //parse the locale from the cookie
            let arr = /&?lc=(.+?)(?:$|&)/i.exec(str);

            //if successful, resolve it
            if(arr.length >= 1){
              return resolve(arr[1]);
            }

            //otherwise reject as unable to find
            return reject(null);

        }, () => reject(null));
    });
  }

};

BungieNet.Platform = class{

  /**
   * Construct a new bungie.net platform instance with options
   *
   * {
   * 	apiKey: string bungie.net API key,
   * 	userContext: bool whether the platform should use cookies,
   * 	timeout: int network timeout in milliseconds,
   * 	beforeSend: function callback with the XHR object,
   * 	onStateChange: function callback with XHR object
   * }
   *
   * @param  {Object} opts
   * @return {BungieNet.Platform}
   */
  constructor(opts = {}){

    /**
     * Internal list of XHR requests
     * @type {Array}
     */
    this._requests = [];

    this._options = {
      apiKey: "",
      userContext: true,
      timeout: 5000,
      beforeSend: () => {},
      onStateChange: () => {}
    };

    //copy any value in opts to this._options
    Object.keys(this._options)
      .filter((x) => opts.hasOwnProperty(x))
      .forEach((x) => this._options[x] = opts[x]);

  }

  /**
   * Cancels all current requests
   */
  cancelAll(){
    this._requests.forEach((x) => x.abort());
    this._requests = [];
  }

  /**
   * Make a HTTP request
   * @param  {URI} uri
   * @param  {String} method = "GET"
   * @param  {mixed} data = void(0)
   * @return {Promise}
   */
  _httpRequest(uri, method = "GET", data = void 0){
    return new Promise((resolve, reject) => {

      let promises = [];

      let xhr = new XMLHttpRequest();
      xhr.open(method, uri.toString(), true);
      xhr.timeout = this._options.timeout;
      xhr.setRequestHeader(
        BungieNet.Platform.headers.apiKey,
        this._options.apiKey);

      //watch for changes
      xhr.onreadystatechange = () => {

        this._options.onStateChange(xhr);

        if(xhr.readyState === 4){

          //remove from internal arr
          this.requests = this._requests.filter((x) => x !== xhr);

          if(xhr.status === 200){
            return resolve(xhr.responseText);
          }
          else{
            return reject(new BungieNet.Error(
              BungieNet.Error.codes.network_error,
              xhr.status,
              xhr
            ));
          }

        }

      };

      //check if making request as a user and add cookies
      if(this._options.userContext){
        promises.push(
          BungieNet.CurrentUser.getCsrfToken()
            .then((token) => {
              xhr.withCredentials = true;
              xhr.setRequestHeader(BungieNet.Platform.headers.csrf, token);
            }, () => {
              return reject(new BungieNet.Error(
                BungieNet.Error.codes.no_csrf_token
              ));
            })
        );
      }

      this._requests.push(xhr);

      //wait for any promises to resolve then fire
      Promise.all(promises).then(() => {
        this._options.beforeSend(xhr);
        xhr.send(data);
      });

    });
  }

  /**
   * API-level request method
   * @param  {BungieNet.Platform.Request} request
   * @return {Promise}
   */
  _serviceRequest(request){
    return new Promise((resolve, reject) => {
      BungieNet.getLocale().then((loc) => {

        let theUri =
          BungieNet.platformPath
          .segment(request.uri.path())
          .setSearch(request.uri.search(true))
          .addSearch("lc", loc);

        if(!theUri.path().endsWith("/")){
          theUri.path(theUri.path() + "/");
        }

        this._httpRequest(
          theUri,
          request.method,
          JSON.stringify(request.data)).then((respText) => {

            let obj;

            //try to parse the response as JSON
            try{
              obj = JSON.parse(respText);
            }
            catch(err){
              return reject(new BungieNet.Error(
                BungieNet.Error.codes.corrupt_response
              ));
            }

            return resolve(new BungieNet.Platform.Response(obj));

          }, reject);

      });
    });
  }

  get key(){
    return this._options.apiKey;
  }

  set key(key){
    this._options.apiKey = key;
  }

  get userContext(){
    return this._options.userContext;
  }

  set userContext(ok){
    this._options.userContext = ok;
  }

  get timeout(){
    return this._options.timeout;
  }

  set timeout(timeout){
    this._options.timeout = timeout;
  }

  //

  getUsersFollowed(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Activity/Following/Users/")
    ));
  }

  createConversation(membersTo, body){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/CreateConversation/"),
      "POST",
      {
        membersToId: membersTo,
        body: body
      }
    ));
  }

  getConversationsV5(page){
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationsv5/{page}/", {
        page: page
      })
    ));
  }

  /**
   * @param  {BigNumber} id
   * @return {Promise}
   */
  getConversationByIdV2(id){
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationByIdV2/{id}/", {
        id: id.toString()
      })
    ));
  }

  /**
   * Get a page of a conversation
   * @param  {Number} id     conversation id
   * @param  {Number} page = 1        page to return
   * @param  {BigNumber} before = (2^63)-1  message id filter
   * @param  {BigNumber} after = 0          message id filter
   * @return {Promise}
   */
  getConversationThreadV3(
    id,
    page = 1,
    after = new BigNumber("0"),
    before = (new BigNumber(2)).pow(63).minus(1)
  ){

    let uri = URI.expand(
      "/Message/GetConversationThreadV3/{id}/{page}/", {
      id: id,
      page: page
    });

    uri.addSearch("after", after.toString());
    uri.addSearch("before", before.toString());

    return this._serviceRequest(new BungieNet.Platform.Request(uri));

  }

  getConversationWithMemberIdV2(mId){
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationWithMemberV2/{id}/", {
        id: mId
      })
    ));
  }

  getGroupConversations(page){
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetGroupConversations/{page}/", {
        page: page
      })
    ));
  }

  /**
   * Leave a given conversation by id
   * @param  {BigNumber} conversationId
   * @return {Promise}
   */
  leaveConversation(conversationId){
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/LeaveConversation/{id}/", {
        id: conversationId.toString()
      })
    ));
  }

  /**
   * Add a message to a conversation
   * @param  {String} body
   * @param  {BigNumber} conversationId
   * @return {Promise}
   */
  saveMessageV3(body, conversationId){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/saveMessageV3/"),
      "POST",
      {
        body: body,
        conversationId: conversationId.toString()
      }
    ));
  }

  /**
   * Signal that the current user is typing a message
   * @todo IF THIS RETURNS AN ERROR IT'S BECAUSE THE ID MUST BE A NUMBER
   * @param  {BigNumber} conversationId
   * @return {Promise}
   */
  userIsTyping(conversationId){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/UserIsTyping/"),
      "POST",
      {
        conversationId: conversationId.toString()
      }
    ));
  }

  getAvailableAvatars(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetAvailableAvatars/")
    ));
  }

  getAvailableThemes(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetAvailableThemes/")
    ));
  }

  getBungieAccount(membershipType, membershipId){
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand(
        "/User/GetBungieAccount/{membershipType}/{membershipId}/", {
          membershipType: membershipType,
          membershipId: membershipId
      })
    ));
  }

  getCountsForCurrentUser(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetCounts/")
    ));
  }

  getCurrentUser(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetBungieNetUser/")
    ));
  }

  updateUser(opts){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/UpdateUser/"),
      "POST",
      opts
    ));
  }

};

/**
 * Header key-name pairs
 * @type {Object}
 */
BungieNet.Platform.headers = {
  apiKey: "X-API-Key",
  csrf: "X-CSRF"
};

BungieNet.Platform.Request = class{

  constructor(uri, method = "GET", data = void 0){
    this.uri = uri;
    this.method = method;
    this.data = data;
  }

};

BungieNet.Platform.Response = class{

  /**
   * @param  {Object} o a JSON-decoded HTTP response
   * @return {BungieNet.Platform.Response}
   */
  constructor(o){
    this.errorCode = o.ErrorCode;
    this.errorStatus = o.ErrorStatus;
    this.message = o.Message;
    this.messageData = o.MessageData;
    this.response = o.Response;
    this.throttleSeconds = o.ThrottleSeconds;
  }

  /**
   * Whether this response represents an application error
   * @return {Boolean}
   */
  get isError(){
    return this.errorCode !== BungieNet.enums.platformErrorCodes.success;
  }

};
