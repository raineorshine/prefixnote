const Readable = require('stream').Readable
const esprima = require('esprima')
const staticEval = require('static-eval')
const Promise = require('bluebird')
const compact = require('lodash.compact')
const find = require('lodash.find')
const execAll = require('regexp.execall')
const fs = require('fs')
const path = require('path')

Promise.promisifyAll(fs)

const stringRegex = /^({.*})?(.*?)$/
const allExpressionsRegex = /{(.*?)}/g
const expressionRegex = /([^:]*)?(?::\s*(.*))?/
const argsRegex = /\s*,\s*/

/**
 * Private function that parses a prefixnote expression.
 * e.g.
 * - foo
 * - foo && bar
 * - foo:val1
 * - foo:arg1=val1
 *
 * @returns
 */
function parseExpression(str) {

  const expMatches = str.match(expressionRegex)

  // get the args from the second match
  // extract options from args using filter with side effect
  const options = {}
  const args = compact((expMatches[2] || '').split(argsRegex))
    .filter(function (arg) {
      const keyValue = arg.split('=')
      if (keyValue.length !== 1) {
        options[keyValue[0]] = keyValue[1]
      }
      return keyValue.length === 1
    })

  return {
    expression: expMatches[1] || null,
    args: args,
    options: options
  }
}

/**
 * Parses a string with one or more prefixnote expressions. Extracts and parses each expression.
 *
 * @returns
 */
function parse(str) {

  // find the prefix expressions and the main value
  const stringMatches = str.match(stringRegex)
  const allExpString = stringMatches[1] || ''
  const value = stringMatches[2]

  // parse each prefix expression
  const expressions = execAll(allExpressionsRegex, allExpString)
    // grab the expression content inside the braces
    .map(function (match) {
      return match[1]
    })
    .map(parseExpression)

  return {
    original: str,
    value: value,
    expressions: expressions
  }
}

/**
 * Evaluates the given prefixnote with the given data.
 *
 * @param prefixnote     May be an unparsed prefixnote string or a parsed prefixnote object (e.g. { original, value, expressions }).
 * @returns The first expression that evaluates to true, otherwise null.
 */
function test(prefixnote, data) {

  const parsed = typeof prefixnote === 'string' ? parse(prefixnote) : prefixnote

  // no expressions should pass
  return parsed.original === parsed.value ?
    { expression: null, args: [], options: {} } :

    // otherwise return the first expression that passes
    find(parsed.expressions, function (exp) {

      // empty expressions should pass
      if (exp.expression === null) {
        return true
      }
      else {
        const ast = esprima.parse(exp.expression).body[0].expression
        return staticEval(ast, data)
      }
    }) || null
}

// TODO: Convert to async iterable.
/**
 * Recursively traverses a file tree starting at the given path, treating each filename as a prefixnote. If the prefixnote evalutes to true for the given data, the branch is traversed, otherwise it is ignored.
 *
 * @returns A stream of parsed filenames.
 */
function parseFiles(dirname, data) {

  // create a readable stream that will be returned
  // parse objects will be pushed onto the stream as we traverse the file tree
  const stream = new Readable({ objectMode: true })
  stream._read = function () {}
  parseRecursive(dirname).then(function () {
    stream.push(null) // eslint-disable-line fp/no-mutating-methods
  })
  return stream

  // the recursive parsing function
  // newDirname is passed to avoid re-parsing the base of the path each traversal
  function parseRecursive(dirname, newDirname) {

    newDirname = newDirname || dirname

    // get all the files in the directory
    // return a promise so we know when this completes
    return fs.readdirAsync(dirname).map(function (filename) {

      const filePath = path.join(dirname, filename)
      const parsed = parse(filename)
      const expression = test(parsed, data)

      return expression ?

        fs.statAsync(filePath).then(function (stat) {

          // generate the destination path
          const newName = parsed.value
          const newPath = path.join(newDirname, newName)

          // if it's a file, push the parse object onto the stream
          if (stat.isFile()) {
            // eslint-disable-next-line fp/no-mutating-methods
            stream.push({
              original: filePath,
              parsed: newPath,
              parsedObject: expression
            })
          }
          // if it's a directory, recursively call parseRecursive
          else {
            return parseRecursive(filePath, path.join(newDirname, newName), newPath) // RECURSE
          }
        }) :
        null
    })
  }
}

module.exports = {
  parse,
  test,
  parseFiles,
}
