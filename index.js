var esprima    = require('esprima')
var staticEval = require('static-eval')
var compact    = require('lodash.compact')
var find       = require('lodash.find')
var execAll    = require('regexp.execall')

var stringRegex         = /^({.*})?(.*?)$/
var allExpressionsRegex = /{(.*?)}/g
var expressionRegex     = /([^:]*)?(?::\s*(.*))?/
var argsRegex           = /\s*,\s*/

/**
 * Parses a prefixnote expression.
 *   e.g. foo
 *        foo && bar
 *        foo:val1
 *        foo:arg1=val1
 * @returns { expression, args, options }
 */
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

/**
 * Parses a string with one or more prefixnote expressions. Extracts and parses each expression.
 * @returns { original, value, expressions }
 */
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

/**
 * A boolean function that checks if the given prefixnote (taken to be a conditional) evaluates to true or false for the given data.
 * @param prefixnote     May be an unparsed prefixnote string or a parsed prefixnote object (e.g. { original, value, expressions }).
 * @returns Boolean
 */
function test(prefixnote, data) {

  var parsed = typeof prefixnote === 'string' ? parse(prefixnote) : prefixnote
  return find(parsed.expressions, function (exp) {
    var ast = esprima.parse(exp.expression).body[0].expression
    return staticEval(ast, data)
  }) || null
}

// TODO: Convert to a generator function.
/**
 * Recursively traverses a file tree starting at the given path, treating each filename as a prefixnote. If the prefixnote evalutes to true for the given data, the branch is traversed, otherwise it is ignored.
 * @returns A stream of parsed filenames.
 */
function* parseFiles(path, data) {
  yield 'test'
}

module.exports = {
  parse: parse,
  test: test,
  parseFiles: parseFiles
}
