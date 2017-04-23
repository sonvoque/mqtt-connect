var test = require('tape')
var EventEmitter = require('events').EventEmitter
var MQTTClient = require('../lib').Client

/* Simulate incoming Msg */
var client = new EventEmitter()
var app = new MQTTClient(client)
client.on('message', app.stack)

test('MQTTClient basic', function (t) {
  t.plan(21) // plan assertions

    // declare middleware with no-topic.
  app.use(function (client, msg, next) {
    t.ok(client, 'client exists')
    t.ok(msg.data, 'msg has data prop.')
    t.ok(msg.topic, 'msg has topic prop.')
    t.equal(typeof next, 'function', 'next is a function')
    next()
  })
    // mount middleware with topic.
  app.use('/hello', function (client, msg, next) {
    t.ok(msg.topic, '/hello')
    t.equal(msg.data, 'mex', 'got the right msg data from /hello')
    next()
  })
    // should not receive msg on a different topic.
  app.use('/stayaway', function (client, msg, next) {
    t.fail('should not be reached! nobody publish in /stayaway')
    next()
  })
    // should edit a given msg obj (+1).
  app.use('/compute', function (client, msg, next) {
    t.equal(msg.topic, '/compute', 'got msg on the /compute topic')
    t.equal(msg.data, 1, 'got 1 on /compute')
    msg.data++
    next()
  })
    // should retrieve that changed msg obj previously edited
  app.use('/compute', function (client, msg, next) {
    t.equal(msg.topic, '/compute')
    t.equal(msg.data, 2, 'msg data changed from prev. middleware')
    next()
  })
    // Should return exactly X middlewares
  t.equal(app.getCount(), 5, 'got 5 middlewares')
    // Istantiate 3 middlewares.
  app.use('/no/next', function (client, msg, next) {
    t.equal(msg.topic, '/no/next', 'Reached the /no/next middl.') // reached once
      // no next()
  }).use('/no/next', function (client, msg, next) {
      // never reached
    t.fail('should not be reached! missing next() statement in the prev. middleware')
  }).use('/no/next', function (client, msg, next) {
      // never reached
    t.fail('should not be reached! missing next() statement in the prev. middleware')
  })
    // The 1th one won't call next()
    // expect the 2th and 3th not to be reached.

    // Should return X middlewares
  t.equal(app.getCount(), 8, 'got 8 middlewares')

  setTimeout(function () {
    client.emit('message', '/hello', 'mex')
    client.emit('message', '/compute', 1)
    client.emit('message', '/no/next', 1)
  }, 1000)
})

test('MQTTClient API', function (t) {
  t.plan(4)

    // app.use should be a function
  t.equal(typeof app.use, 'function', 'app.use is a function')
    // app.stack should be a function
  t.equal(typeof app.stack, 'function', 'app.stack is a function')
    // reset app
  app.reset()
    // istantiate a middl.
  app.use(function (client, msg, next) {
    next()
  })
    // Should return exactly 1 middleware
  t.equal(app.getCount(), 1)
    // Should reset the loaded middlewares
  app.reset()
    // Should return exactly 0 middlewares
  t.equal(app.getCount(), 0)
})

/*

test('MQTTClient middlewares order', function (t) {
    t.plan(3)

    // Istantiate 24 middlewars
    // Order counts: every middleware adds a progressive letter.
    // expect final string

})

test('MQTTClient topic and wildcards', function (t) {
    t.plan(3)

    // / never reached

    // /hello/#

    // /hello/+

})

*/
