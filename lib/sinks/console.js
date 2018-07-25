/**
 * @file An implementation of a console log sink
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const {Writable} = require('stream')

/**
 * An implementation of a console log sink
 * @extends {Writable}
 * @type {ConsoleSink}
 */
module.exports = class ConsoleSink extends Writable {
  /**
   * An implementation of a console log sink
   *
   * @param {Object} props Properties of the instance
   * @param {Function} [props.filter] Function to filter the logs written to the sink
   * @constructor
   */
  constructor (props) {
    super({objectMode: true})
    this._props = Object.assign({filter: () => true}, props)
  }

  /**
   * @inheritdoc
   */
  _write (obj, encoding, cb) {
    if (this._props.filter(obj)) {
      process.stderr.write(`${JSON.stringify(obj)}\n`, cb)
    } else {
      cb()
    }
  }
}
