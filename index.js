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
 */
function parseExpression(str) {

  const expMatches = str.match(expressionRegex)

  // get the args from the second match
  // extract options from args using filter with side effect
  const options = {}
  const args = compact((expMatches[2] || '').split(argsRegex))
    .filter(arg => {
      const keyValue = arg.split('=')
      if (keyValue.length !== 1) {
        options[keyValue[0]] = keyValue[1]
      }
      return keyValue.length === 1
    })

  return {
    expression: expMatches[1] || null,
    args,
    options,
  }
}

/**
 * Parses a string with one or more prefixnote expressions. Extracts and parses each expression.
 */
function parse(str) {

  // find the prefix expressions and the main value
  const stringMatches = str.match(stringRegex)
  const allExpString = stringMatches[1] || ''
  const value = stringMatches[2]

  // parse each prefix expression
  const expressions = execAll(allExpressionsRegex, allExpString)
    // grab and parse the expression content inside the braces
    .map(match => parseExpression(match[1]))

  return {
    original: str,
    value,
    expressions,
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
  if (parsed.original === parsed.value) {
    return {
      expression: null,
      args: [],
      options: {}
    }
  }

  return find(parsed.expressions, exp => {

    // empty expressions should pass
    if (!exp.expression) return true

    // otherwise return the first expression that passes
    const ast = esprima.parse(exp.expression).body[0].expression
    return staticEval(ast, data)

  }) || null
}

/**
 * Recursively traverses a file tree starting at the given path, treating each filename as a prefixnote. If the prefixnote evalutes to true for the given data, the branch is traversed, otherwise it is ignored.
 *
 * @returns A stream of parsed filenames.
 */
function parseFiles(dirname, data) {

  // the recursive parsing function
  // newDirname is passed to avoid re-parsing the base of the path each traversal
  function parseRecursive(dirname, newDirname) {

    newDirname = newDirname || dirname

    // get all the files in the directory
    // return a promise so we know when this completes
    return fs.readdirAsync(dirname).map(async filename => {

      const filePath = path.join(dirname, filename)
      const parsed = parse(filename)
      const expression = test(parsed, data)

      if (!expression) return null

      const stat = await fs.statAsync(filePath)

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

    })
  }

  // create a readable stream that will be returned
  // parse objects will be pushed onto the stream as we traverse the file tree
  const stream = new Readable({ objectMode: true })
  stream._read = function () {}
  parseRecursive(dirname).then(() => {
    stream.push(null) // eslint-disable-line fp/no-mutating-methods
  })
  return stream
}

module.exports = {
  parse,
  test,
  parseFiles,
}
