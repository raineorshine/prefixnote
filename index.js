var esprima    = require('esprima')
var staticEval = require('static-eval')
var compact    = require('lodash.compact')
var find       = require('lodash.find')
var execAll    = require('regexp.execall')

var stringRegex         = /^({.*})?(.*?)$/
var allExpressionsRegex = /{(.*?)}/g
var expressionRegex     = /([^:]*)?(?::\s*(.*))?/
var argsRegex           = /\s*,\s*/

// parses a single prefix expression
function parseExpression(str) {

  var expMatches = str.match(expressionRegex)

  // get the args from the second match
  // extract options from args using filter with side effect
  var options = {}
  var args = compact((expMatches[2] || '').split(argsRegex))
    .filter(function (arg) {
      var keyValue = arg.split('=')
      return keyValue.length === 1 || (options[keyValue[0]] = keyValue[1], false)
    })

  return {
    expression: expMatches[1] || null,
    args: args,
    options: options
  }
}

function parse(str) {

  // find the prefix expressions and the main value
  var stringMatches = str.match(stringRegex)
  var allExpString = stringMatches[1] || ''
  var value = stringMatches[2]

  // parse each prefix expression
  var expressions = execAll(allExpressionsRegex, allExpString)
    // grab the expression content inside the braces
    .map(function (match) { return match[1] })
    .map(parseExpression)

  return {
    original:   str,
    value:      value,
    expressions: expressions
  }
}

function test(input, data) {

  var parsed = typeof input === 'string' ? parse(input) : input
  return find(parsed.expressions, function (exp) {
    var ast = esprima.parse(exp.expression).body[0].expression
    return staticEval(ast, data)
  }) || null
}

function* parseFiles(path, data) {
  yield 'test'
}

module.exports = {
  parse: parse,
  test: test,
  parseFiles: parseFiles
}
