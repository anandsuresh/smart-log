/**
 * @file Unit tests for the smart log agent
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2018-present Anand Suresh. All rights reserved.
 */

const {expect} = require('chai')
const {PassThrough} = require('stream')
const LogAgent = require('../lib/agent')

describe('Agent', function () {
  describe('new', function () {
    it('should be callable', function () {
      expect(LogAgent).to.be.a('function')
    })

    it('should be instantiable without any arguments', function () {
      expect(() => new LogAgent()).to.not.throw()
    })
  })

  describe('stream', function () {
    it('should emit data events when logs are recorded', function (done) {
      let calls = 0
      const log = new LogAgent()
        .on('data', data => {
          expect(data).to.be.an('object')
          expect(data).to.have.keys(['ts', 'level', 'msg'])
          expect(data.ts).to.be.a('number')
          expect(data.level).to.equal(data.msg)

          if (++calls === LogAgent.LEVELS.length) {
            log.destroy()
            done()
          }
        })

      LogAgent.LEVELS.forEach(method => log[method](method))
    })

    it('should queue up and drain out data, as required', function (done) {
      this.timeout(30000)

      const log = new LogAgent()
      const dest = new PassThrough({objectMode: true})

      const expectedPauses = 3
      let actualPauses = 0
      let emitted = 0
      let received = 0

      setTimeout(stream => stream.on('data', data => {
        received++

        if (actualPauses < expectedPauses) {
          if (Math.random() <= 0.1) {
            setTimeout(() => stream.resume(), Math.random() * 500)
            stream.pause()
            actualPauses++
          }
        } else {
          clearInterval(interval)
          if (emitted === received) {
            log.destroy()
            return done()
          }
        }
      }), Math.random() * 1000, log.pipe(dest))

      const interval = setInterval(function () {
        const random = Math.floor(Math.random() * LogAgent.LEVELS.length)
        const op = LogAgent.LEVELS[random]
        log[op](op)
        emitted++
      }, Math.random() * 100)
    })
  })

  describe('methods', function () {
    LogAgent.LEVELS.forEach(method => {
      it(`should record a log for .${method}()`, function (done) {
        const log = new LogAgent()
          .on('data', data => {
            expect(data).to.be.an('object')
            expect(data).to.have.keys(['ts', 'level', 'msg'])
            expect(data.ts).to.be.a('number')
            expect(data.level).to.equal(method)
            expect(data.msg).to.equal(method)

            log.destroy()
            done()
          })

        log[method](method)
      })
    })
  })
})
