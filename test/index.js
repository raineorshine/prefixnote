var should = require('chai').should()
var prefixnote = require('../index.js')

describe('prefixnote', function() {

  describe('parse', function() {

    it('should parse a string without an expression', function() {
      prefixnote.parse('test').should.eql({
        original: 'test',
        value: 'test',
        expressions: []
      })
    })

    it('should parse basic expressions', function() {

      prefixnote.parse('{a}test').should.eql({
        original: '{a}test',
        value: 'test',
        expressions: [{
          expression: 'a',
          args: [],
          options: {}
        }]
      })

      prefixnote.parse('{a}').should.eql({
        original: '{a}',
        value: '',
        expressions: [{
          expression: 'a',
          args: [],
          options: {}
        }]
      })

      prefixnote.parse('{a && b}').should.eql({
        original: '{a && b}',
        value: '',
        expressions: [{
          expression: 'a && b',
          args: [],
          options: {}
        }]
      })

    })

    it('should parse multiple expressions', function() {
      prefixnote.parse('{a}{b}test').should.eql({
        original: '{a}{b}test',
        value: 'test',
        expressions: [
          {
            expression: 'a',
            args: [],
            options: {}
          },
          {
            expression: 'b',
            args: [],
            options: {}
          }
        ]
      })
    })

    it('should parse arguments', function() {

      prefixnote.parse('{: a, b, c}test').should.eql({
        original: '{: a, b, c}test',
        value: 'test',
        expressions: [{
          expression: null,
          args: ['a', 'b', 'c'],
          options: {}
        }]
      })

    })

    it('should parse options', function() {

      prefixnote.parse('{: a=1, b=2, c=3}test').should.eql({
        original: '{: a=1, b=2, c=3}test',
        value: 'test',
        expressions: [{
          expression: null,
          args: [],
          options: {
            a: '1',
            b: '2',
            c: '3'
          }
        }]
      })

    })

    it('should parse arguments and options', function() {

      prefixnote.parse('{: a=1, b, c=3}test').should.eql({
        original: '{: a=1, b, c=3}test',
        value: 'test',
        expressions: [{
          expression: null,
          args: ['b'],
          options: {
            a: '1',
            c: '3'
          }
        }]
      })

    })

  })

  describe('test', function() {

    it('should evaluate a simple expression with the given data', function() {
      prefixnote.test('{a}', { a: true }).should.eql({
        expression: 'a',
        args: [],
        options: {}
      })
      should.equal(prefixnote.test('{a}', { a: false }), null)
      should.equal(prefixnote.test('{a}', {}), null)
    })

    it('should accept already parsed strings', function() {
      var parsed = prefixnote.parse('{a}')
      prefixnote.test(parsed, { a: true }).should.eql({
        expression: 'a',
        args: [],
        options: {}
      })
    })

    it('should evaluate a boolean expression', function() {
      prefixnote.test('{a && b}', {
        a: true,
        b: true
      }).should.eql({
        expression: 'a && b',
        args: [],
        options: {}
      })

      should.equal(prefixnote.test('{a && b}', {
        a: true,
        b: false
      }), null)

      should.equal(prefixnote.test('{a && b}', {
        a: false,
        b: true
      }), null)

    })

    it('if there are multiple expressions, should return the first one that is true', function() {

      prefixnote.test('{a}{b}', {a:true}).should.eql({
        expression: 'a',
        args: [],
        options: {}
      })

      prefixnote.test('{a}{b}', {b:true}).should.eql({
        expression: 'b',
        args: [],
        options: {}
      })

      should.equal(prefixnote.test('{a}{b}', {}), null)

    })

  })

})
