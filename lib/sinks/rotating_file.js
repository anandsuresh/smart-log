/**
 * @file An implementation of a rotating file sink
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const {Writable} = require('stream')
const {resolve} = require('path')
const {createWriteStream} = require('fs')
const moment = require('moment')
const Helper = require('../helper')

/**
 * An implementation of a rotating file sink
 * @extends {Writable}
 * @type {RotatingFileSink}
 */
module.exports = class RotatingFileSink extends Writable {
  /**
   * An implementation of a rotating file sink
   *
   * @param {Object} props Properties of the instance
   * @param {Function} [props.filter] Function to filter the logs written to the sink
   * @param {String} [props.path='/var/log'] Path to the log file directory
   * @param {String} [props.prefix='log-'] Prefix to the log file name
   * @param {String} [props.suffix='.log'] Suffix to the log file name
   * @param {Number} [props.inactiveTimeout=60000] Inactivity timeout (ms) for closing open files
   * @constructor
   */
  constructor (props) {
    props = Object.assign({
      filter: () => true,
      path: '/var/log',
      prefix: 'log-',
      suffix: '.log',
      inactiveTimeout: 60000
    }, props)

    super({objectMode: true})

    this._props = Object.assign(props, {
      id: `${props.path}/${props.prefix}-YYYYMMDD${props.suffix}`,
      _fileStreams: {},
      _timer: setInterval(() => this._closeFiles(), props.inactiveTimeout)
    })
  }

  /**
   * Returns the path to directory where the files are written
   * @name {RotatingFileSink#path}
   * @type {String}
   */
  get path () {
    return this._props.path
  }

  /**
   * Returns the prefix of the rotating file
   * @name {RotatingFileSink#prefix}
   * @type {String}
   */
  get prefix () {
    return this._props.prefix
  }

  /**
   * Returns the suffix of the file
   * @name {RotatingFileSink#suffix}
   * @type {String}
   */
  get suffix () {
    return this._props.suffix
  }

  /**
   * Returns the inactivity timeout after which open files are closed
   * @name {RotatingFileSink#inactiveTimeout}
   * @type {String}
   */
  get inactiveTimeout () {
    return this._props.inactiveTimeout
  }

  /**
   * @inheritdoc
   */
  _write (obj, encoding, cb) {
    const props = this._props

    if (!props.filter(obj)) return cb()

    const fileStreams = this._props._fileStreams
    const key = moment(obj.ts || moment()).format('YYYYMMDD')

    if (fileStreams[key] == null) {
      const path = resolve(`${this.path}/${this.prefix}${key}${this.suffix}`)
      const stream = createWriteStream(path, {flags: 'a+'})
        .on('error', Helper.handleErrorIfAny)

      fileStreams[key] = {stream: stream, active: false}
    }

    const buf = `${JSON.stringify(obj)}\n`
    fileStreams[key].active = true
    fileStreams[key].stream.write(buf, 'utf8', cb)
  }

  /**
   * @inheritdoc
   */
  _final (cb) {
    this._cleanup(cb)
  }

  /**
   * @inheritdoc
   */
  _destroy (err, cb) {
    Helper.handleErrorIfAny(err)
    this._cleanup(cb)
  }

  /**
   * Releases resources held by the stream
   */
  _cleanup (cb) {
    clearInterval(this._props._timer)
    this._closeFiles(true)
    cb()
  }

  /**
   * Closes all open, but inactive file streams
   *
   * @param {Boolean} endAll Whether or not to end all file streams
   */
  _closeFiles (endAll) {
    const fileStreams = this._props._fileStreams
    Object.keys(fileStreams).forEach(id => {
      const fileStream = fileStreams[id]
      if (endAll || !fileStream.active) {
        fileStream.stream.end()
      } else {
        fileStream.active = false
      }
    })
  }
}
