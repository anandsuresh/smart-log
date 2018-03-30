/**
 * @file Unit tests for the syslog sink
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const {expect} = require('chai')
const dgram = require('dgram')
const Agent = require('../../lib/agent')
const SyslogSink = require('../../lib/sinks/syslog')

describe('SyslogSink', function () {
  describe('new', function () {
    it('should be callable', function () {
      expect(SyslogSink).to.be.a('function')
    })

    it('should NOT be instantiable without any arguments', function () {
      expect(function () { return new SyslogSink() }).to.throw()
    })
  })

  describe('stream', function () {
    it('should write incoming messages to the syslog server', function (done) {
      const log = new Agent()
      const syslog = new SyslogSink({id: 'unitTest', port: 8514})
      const syslogServer = dgram
        .createSocket('udp4')
        .on('error', done)
        .on('message', msg => {
          expect(msg.toString()).to.include('foo')
          syslogServer.close()
          done()
        })
        .bind(8514, '127.0.0.1')

      log.pipe(syslog)
      log.error('foo')
      log.end()
    })

    it('should filter out unnecessary logs', function (done) {
      const log = new Agent()
      const filter = log => log.level === 'error' && log.msg !== 'foo'
      const syslog = new SyslogSink({id: 'unitTest', port: 8514, filter})

      const syslogServer = dgram
        .createSocket('udp4')
        .on('error', done)
        .on('message', msg => {
          expect(msg.toString()).to.include('bar')
          syslogServer.close()
          done()
        })
        .bind(8514, '127.0.0.1')

      log.pipe(syslog)
      log.error('foo')
      log.error('bar')
      log.end()
    })
  })
})
