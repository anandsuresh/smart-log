![npm (scoped)](https://img.shields.io/npm/v/@anandsuresh/smart-log.svg?style=plastic)
![node (scoped)](https://img.shields.io/node/v/@anandsuresh/smart-log.svg?style=plastic)
![Travis](https://img.shields.io/travis/anandsuresh/smart-log.svg?style=plastic)
![npm](https://img.shields.io/npm/dt/@anandsuresh/smart-log.svg?style=plastic)


# smart-log

The smart-log module provides a set of modules to log information to one or more log sinks. It consists of a singleton log agent implemented as a `Readable` object stream and exposes logging/metrics methods. The agent can be piped into one or more `Writable` log sinks including:
- `ConsoleSink`: writes the `process.stderr`
- `SyslogSink`: writes to the specified syslog server
- `RotatingFileSink`: writes to a local file and rotates it at the start of each new day

## usage

```
const SmartLog = require('@anandsuresh/smart-log')

// Initialize the log agent to:
// - log things at info and lower
// - log the process pid in each log message
// - queue up to 1000 of the latest log items if the sink(s) is/are slow
const log = SmartLog.init({
  level: 'info',
  default: { pid: process.pid },
  queue: { strategy: 'overwrite', size: 1000 }
})

// Log everything from the agent to stderr
const stderr = SmartLog.createConsoleSink()

// Log notice and above to a file
const rotatingFile = SmartLog.createRotatingFile({
  filter: log => ~['debug', 'info', 'notice'].indexOf(log.level),
  path: '/var/log', // make sure your process has write privileges at this path
  prefix: 'log-',   // log file name prefix; date will be appended to this
  suffix: '.log'    // log file name suffix; will be appended to the end of the file name
})

// Only log warning and below to syslog
const syslog = SmartLog.createSyslogSink({
  filter: log => ~['warning', 'error', 'critical', 'alert', 'emergency'].indexOf(log.level),
  id: process.pid,        // unique name reported to syslog
  hostname: '127.0.0.1',  // hostname/IP address of the syslog daemon
  port: 514,              // TCP port of the syslog daemon
  facility: 'user',       // syslog facility to log to
  fqdn: os.hostname()     // hostname of the system; logged in syslog header
})

// Pipe the log agent into the sinks
log.pipe(stderr)
log.pipe(rotatingFile)
log.pipe(syslog)

// Use the log agent
log.emergency('this will be logged to stderr and syslog')
log.alert('this will be logged to stderr and syslog')
log.critical('this will be logged to stderr and syslog')
log.error('this will be logged to stderr and rotating file')
log.warning('this will be logged to stderr and rotating file')
log.notice('this will be logged only to stderr and rotating file')
log.info('this will be logged only to stderr and rotating file')
log.debug('this will be logged only to stderr')
```

## agent

The log agent is a `Readable` object-mode stream with logging/metrics methods attached and is provided by the module as a singleton.

The log levels are taken from Syslog and include:
- `emergency`: conditions requiring immediate operator intervention to proceed (e.g. out-of-memory)
- `alert`: conditions requiring immediate operator intervention (e.g. high cpu usage)
- `critical`: conditions indicating critical process state (e.g. low disk space)
- `error`: error conditions
- `warning`: warning conditions
- `notice`: normal but significant conditions
- `info`: informational logging
- `debug`: debug logging

The metrics methods include:
- `counter`: records the count of values
- `histogram`: records the distribution of values

## sinks

Sinks are `Writable` object-mode streams that filter log messages and write them to the specified destination. The sinks provided with this module include:

### `ConsoleSink`

The console sink writes JSON-serialized logs to the process' `stderr` stream.

### `RotatingFileSink`

The rotating file sink writes JSON-serialized logs to a file that is rotated every 24 hours. The timestamp from the log message is used to identify when files need to be rotated.

### `SyslogSink`

The syslog sink writes JSON-serialized logs to the specified syslog server. Since the messages are in JSON format, the syslog server MUST use the [Common Event Expression](https://cee.mitre.org) module.

### `PagerDuty` (future work)

The PagerDuty sink will allow log messages to be sent to PagerDuty. This would be useful for messages logged at the `alert` and `emergency` levels.

### `GitHub` (future work)

The GitHub sink will allow logs to be written to GitHub issues, enabling crash-reporting functionality. Should the issue already be open, it would upvote it, making it easy for developers to identity the most critical problems.
