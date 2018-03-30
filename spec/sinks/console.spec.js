/**
 * @file Unit tests for the console sink
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const {expect} = require('chai')
const ConsoleSink = require('../../lib/sinks/console')

describe('ConsoleSink', () => {
  describe('new', () => {
    it('should be callable', () => {
      expect(ConsoleSink).to.be.a('function')
    })

    it('should be instantiable without any arguments', () => {
      expect(() => { return new ConsoleSink() }).to.not.throw()
    })
  })
})
