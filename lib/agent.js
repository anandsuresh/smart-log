/**
 * @file An implementation of a smart log agent
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const {Readable} = require('stream')
const {create: createQueue} = require('@anandsuresh/smart-queue')
const Helper = require('./helper')

/**
 * An implementation of a smart log agent
 * @extends {Readable}
 * @type {LogAgent}
 */
module.exports = class LogAgent extends Readable {
  /**
   * An implementation of a smart log agent
   *
   * @param {Object} [props] Properties of the instance
   * @param {Number} [props.default] Properties to be logged on each log-object
   * @param {Number} [props.level] The currently selected log level for output
   * @param {Object} [props.queue] Properties of the queue
   * @constructor
   */
  constructor (props) {
    props = Object.assign({
      default: null,
      level: 'warning',
      queue: {strategy: 'grow'}
    }, props)

    super({objectMode: true})

    this._props = props = Object.assign(props, {
      _canPush: true,
      _queue: createQueue(props.queue)
    })

    this.level = props.level
  }

  /**
   * The available log levels
   * @name {LogAgent.LEVELS}
   * @type {Object}
   */
  static get LEVELS () {
    return Helper.LEVELS
  }

  /**
   * The available metrics
   * @name {LogAgent.METRICS}
   * @type {Array}
   */
  static get METRICS () {
    return Helper.METRICS
  }

  /**
   * Returns the length of the queued data
   * @name {LogAgent#length}
   * @type {Number}
   */
  get length () {
    return this._props._queue.length
  }

  /**
   * Returns the current log level
   * @name {LogAgent#level}
   * @type {String}
   */
  get level () {
    return this._props.level
  }

  /**
   * Sets the current log level
   * @name {LogAgent#level}
   * @type {String}
   */
  set level (newLevel) {
    LogAgent.LEVELS.forEach(levelName => {
      this[levelName] = (LogAgent.LEVELS[levelName] <= newLevel)
        ? () => {}
        : (...args) => this._log(levelName, ...args)
    })
  }

  /**
   * @inheritdoc
   */
  _read () {
    if (!this._readableState.destroyed) {
      const props = this._props
      const queue = props._queue

      props._canPush = true
      while (queue.length > 0 && props._canPush) {
        props._canPush = this.push(queue.dequeue())
      }
    }
  }

  /**
   * @inheritdoc
   */
  _destroy (err, cb) {
    this._props._queue = null
    Helper.handleErrorIfAny(err)
    if (typeof cb === 'function') cb()
  }

  /**
   * Pushes or enqueues data for the stream
   *
   * @param {Object|Buffer|String|null} chunk The data to push or enqueue
   */
  _pushOrEnqueue (obj) {
    if (!this._readableState.destroyed) {
      const props = this._props

      if (props._canPush) {
        props._canPush = this.push(obj)
      } else {
        props._queue.enqueue(obj)
      }
    }
  }

  /**
   * Internal method that creates a log object
   *
   * @param {String} level The log level to use for the log-stream object
   * @param {*} args Arguments to be logged
   */
  _log (level, ...args) {
    const props = this._props
    const log = args.reduce((acc, arg) => {
      if (arg instanceof Error) {
        acc.error = arg
      } else if (typeof arg === 'string') {
        acc.msg = arg
      } else {
        Object.assign(acc, arg)
      }

      return acc
    }, Object.assign({ts: Date.now(), level: level}, props.default))

    this._pushOrEnqueue(log)
  }

  /**
   * Internal method that creates a metric object
   *
   * @param {String} metric The type of metric
   * @param {String} key The unique identifier of the metric key
   * @param {Number} value The type of metric
   * @param {String} [unit] The unit of the metric
   */
  _metric (metric, key, value, unit) {
    this._pushOrEnqueue({ts: Date.now(), level: metric, key, value, unit})
  }

  /**
   * Records a counter metric
   *
   * @param {String} key The unique identifier of the metric key
   * @param {Number} [value=1] The type of metric
   * @param {String} [unit] The unit of the metric
   */
  counter (key, value = 1, unit) {
    this._metric('counter', key, value, unit)
  }

  /**
   * Records a histogram metric
   *
   * @param {String} key The unique identifier of the metric key
   * @param {Number} value The type of metric
   * @param {String} [unit] The unit of the metric
   */
  histogram (key, value, unit) {
    this._metric('histogram', key, value, unit)
  }

  /**
   * Closes the stream
   */
  end () {
    this._pushOrEnqueue(null)
  }
}
