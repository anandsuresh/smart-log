/**
 * @file An implementation of a smart log agent
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const LogAgent = require('./lib/agent')
const ConsoleSink = require('./lib/sinks/console')
const SyslogSink = require('./lib/sinks/syslog')
const RotatingFileSink = require('./lib/sinks/rotating_file')

/**
 * Export the interface
 * @type {Object}
 */
const SmartLog = exports = module.exports

/**
 * An initialized singleton instance of the smart log agent
 * @type {SmartLogAgent}
 */
SmartLog.agent = null

/**
 * Initializes the singleton instance of the smart log agent
 *
 * @param {Object} [props] Properties of the instance
 * @param {Number} [props.default] Properties to be logged on each log-object
 * @param {Number} [props.level] The currently selected log level for output
 * @param {Object} [props.queue] Properties of the queue
 * @return {LogAgent}
 */
SmartLog.init = function (props) {
  if (SmartLog.agent != null) {
    throw new Error('log agent has already been initialized!')
  }

  SmartLog.agent = new LogAgent(props)
  return SmartLog.agent
}

/**
 * Creates an instance of a console sink
 * @return {ConsoleSink}
 */
SmartLog.createConsoleSink = function () {
  return new ConsoleSink()
}

/**
 * Creates an instance of a syslog sink
 *
 * @param {[type]} props [description]
 * @return {SyslogSink}
 */
SmartLog.createSyslogSink = function (props) {
  return new SyslogSink(props)
}

/**
 * Creates an instance of a rotating file sink
 *
 * @param {[type]} props [description]
 * @return {RotatingFileSink}
 */
SmartLog.createRotatingFileSink = function (props) {
  return new RotatingFileSink(props)
}
