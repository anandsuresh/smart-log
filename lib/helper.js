/**
 * @file A list of possible log levels (taken from syslog)
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const Helper = exports = module.exports

/**
 * A list of possible log levels (taken from syslog)
 * @type {Object}
 */
/* eslint-disable */
Helper.LEVELS = [
  'emergency',  /* system is unusable */
  'alert',      /* action must be taken immediately */
  'critical',   /* critical conditions */
  'error',      /* error conditions */
  'warning',    /* warning conditions */
  'notice',     /* normal but significant condition */
  'info',       /* informational */
  'debug'       /* debug-level messages */
]
/* eslint-enable */

/**
 * A list of metric types (taken from zag)
 * @type {Array}
 */
Helper.METRIC_TYPES = ['counter', 'histogram']

/**
 * Handles any error by writing it to the process' stderr
 *
 * @param {Error} [err] An optional error
 */
Helper.handleErrorIfAny = function (err) {
  if (err != null) process.stderr.write(`${err.stack}\n`)
}
