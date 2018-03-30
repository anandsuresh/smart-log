/**
 * @file Unit tests for the rotating file sink
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const {expect} = require('chai')
const {basename, resolve} = require('path')
const {readdirSync, readFileSync, unlinkSync} = require('fs')
const Agent = require('../../lib/agent')
const RotatingFileSink = require('../../lib/sinks/rotating_file')
const moment = require('moment')

describe('RotatingFileSink', () => {
  const logDir = '/tmp'
  const logPrefix = 'log-'
  const logSuffix = '.log'

  beforeEach(() => {
    readdirSync(logDir).forEach(file => {
      const filename = basename(file)
      if (filename.startsWith(logPrefix) && filename.endsWith(logSuffix)) {
        unlinkSync(resolve(logDir, file))
      }
    })
  })

  describe('new', () => {
    it('should be callable', () => {
      expect(RotatingFileSink).to.be.a('function')
    })

    it('should be instantiable without any arguments', () => {
      let rotatingFile = null
      expect(() => { rotatingFile = new RotatingFileSink() }).to.not.throw()
      rotatingFile.destroy()
    })
  })

  describe('stream', () => {
    it('should write an incoming log-stream to a file', done => {
      const ts = moment().valueOf()
      const log = new Agent()
      const rotatingFile = new RotatingFileSink({path: '/tmp'})
        .once('finish', () => {
          try {
            const filename = `/tmp/log-${moment(ts).format('YYYYMMDD')}.log`
            const data = JSON.parse(readFileSync(filename))
            expect(data).to.have.keys('ts', 'level', 'foo')
            expect(data.ts).to.be.within(ts, ts + 10)
            expect(data.level).to.equal('error')
            expect(data.foo).to.equal('bar')
            done()
          } catch (e) {
            done(e)
          }
        })

      log.pipe(rotatingFile)
      log.error({foo: 'bar'})
      log.end()
    })

    it('should rotate the file, when needed', done => {
      const ts = moment()
      const ts1 = moment(ts.startOf('day')).valueOf() - 1
      const ts2 = moment(ts.startOf('day')).valueOf() + 1
      const log = new Agent()
      const rotatingFile = new RotatingFileSink({path: '/tmp'})
        .once('finish', () => {
          try {
            const f1 = `/tmp/log-${moment(ts1).format('YYYYMMDD')}.log`
            const f1Data = JSON.parse(readFileSync(f1))
            expect(f1Data).to.deep.equal({ts: ts1, level: 'error'})

            const f2 = `/tmp/log-${moment(ts2).format('YYYYMMDD')}.log`
            const f2Data = JSON.parse(readFileSync(f2))
            expect(f2Data).to.deep.equal({ts: ts2, level: 'error'})

            done()
          } catch (e) {
            done(e)
          }
        })

      log.pipe(rotatingFile)
      log.error({ts: ts1})
      log.error({ts: ts2})
      log.end()
    })

    it('should filter out unnecessary logs', function (done) {
      const log = new Agent()
      const filter = log => log.level === 'alert'

      const rotatingFile = new RotatingFileSink({path: '/tmp', filter})
        .once('finish', () => {
          try {
            const filename = `/tmp/log-${moment().format('YYYYMMDD')}.log`
            const data = JSON.parse(readFileSync(filename))
            expect(data).to.have.keys('ts', 'level')
            expect(data.level).to.equal('alert')
            done()
          } catch (e) {
            done(e)
          }
        })

      log.pipe(rotatingFile)
      log.error()
      log.alert()
      log.end()
    })
  })
})
