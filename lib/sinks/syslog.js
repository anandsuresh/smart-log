/**
 * @file An implementation of a syslog sink
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const {Writable} = require('stream')
const os = require('os')
const dgram = require('dgram')
const Helper = require('../helper')

/**
 * A list of log facilities
 * @type {Object}
 */
/* eslint-disable */
const FACILITIES = {
  kernel: (0 << 3),  /* kernel messages */
  user:   (1 << 3),  /* user-level messages */
  mail:   (2 << 3),  /* mail system */
  daemon: (3 << 3),  /* system daemons */
  auth:   (4 << 3),  /* security/authorization messages */
  syslog: (5 << 3),  /* messages generated internally by syslogd */
  lpr:    (6 << 3),  /* line printer subsystem */
  news:   (7 << 3),  /* netnews subsystem */
  uucp:   (8 << 3),  /* uucp subsystem */
  audit:  (13 << 3), /* audit subsystem */
  cron:   (15 << 3), /* cron/at subsystem */

  local0: (16 << 3), /* reserved for local use */
  local1: (17 << 3), /* reserved for local use */
  local2: (18 << 3), /* reserved for local use */
  local3: (19 << 3), /* reserved for local use */
  local4: (20 << 3), /* reserved for local use */
  local5: (21 << 3), /* reserved for local use */
  local6: (22 << 3), /* reserved for local use */
  local7: (23 << 3)  /* reserved for local use */
}
/* eslint-enable */

/**
 * An implementation of a syslog sink
 * @extends {Writable}
 * @type {SyslogSink}
 */
module.exports = class SyslogSink extends Writable {
  /**
   * An implementation of a syslog sink
   *
   * @param {Object} props Properties of the instance
   * @param {Function} [props.filter] Function to filter the logs written to the sink
   * @param {String} props.id The unique process identifier to be reported to syslog
   * @param {String} [props.hostname='127.0.0.1'] The hostname/IP address of the syslog server
   * @param {Number} [props.port=514] The port of the syslog server
   * @param {Number} [props.facility='user'] The syslog facility to log to
   * @param {Number} [props.fqdn] The hostname to use in the syslog header
   * @constructor
   */
  constructor (props) {
    props = Object.assign({
      filter: () => true,
      hostname: '127.0.0.1',
      port: 514,
      facility: 'user',
      fqdn: os.hostname()
    }, props)

    if (props.id == null) {
      throw new Error('"id" is a required property!')
    }

    super({objectMode: true})

    this._props = Object.assign(props, {
      _client: dgram.createSocket('udp4').on('error', Helper.handleErrorIfAny)
    })
  }

  /**
   * A list of possible log levels
   * @type {Object}
   */
  static LEVELS () {
    return Helper.LOG_LEVELS
  }

  /**
   * A list of log facilities
   * @type {Object}
   */
  static FACILITIES () {
    return FACILITIES
  }

  /**
   * Returns the unique process identifier to be reported to syslog
   * @name {SyslogSink#id}
   * @type {String}
   */
  get id () {
    return this._props.id
  }

  /**
   * Returns the hostname of the syslog server
   * @name {SyslogSink#hostname}
   * @type {String}
   */
  get hostname () {
    return this._props.hostname
  }

  /**
   * Returns the port of the syslog server
   * @name {SyslogSink#port}
   * @type {String}
   */
  get port () {
    return this._props.port
  }

  /**
   * Returns the syslog facility to log to
   * @name {SyslogSink#facility}
   * @type {String}
   */
  get facility () {
    return this._props.facility
  }

  /**
   * Returns the hostname to use in the syslog header
   * @name {SyslogSink#fqdn}
   * @type {String}
   */
  get fqdn () {
    return this._props.fqdn
  }

  /**
   * @inheritdoc
   */
  _write (obj, encoding, cb) {
    const props = this._props

    if (!props.filter(obj)) return cb()

    const client = props._client
    const pri = `<${FACILITIES[this.facility] + Helper.LEVELS[obj.level]}>`
    const header = `${new Date().toISOString()} ${this.fqdn} ${this.id}:@cee:`
    const msg = Buffer.from(`${pri}${header}${JSON.stringify(obj)}`, 'utf-8')

    client.send(msg, 0, msg.length, this.port, this.hostname, err => {
      Helper.handleErrorIfAny(err)
      cb()
    })
  }

  /**
   * @inheritdoc
   */
  _final (cb) {
    this._cleanup()
    cb()
  }

  /**
   * @inheritdoc
   */
  _destroy (err, cb) {
    this._cleanup()
    Helper.handleErrorIfAny(err)
    cb()
  }

  /**
   * Releases resources held by the stream
   */
  _cleanup () {
    const props = this._props
    if (props._client !== null) {
      props._client.close()
      props._client = null
    }
  }
}
