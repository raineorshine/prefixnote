# prefixnote
[![npm version](https://img.shields.io/npm/v/prefixnote.svg)](https://npmjs.org/package/prefixnote) 
[![Build Status](https://travis-ci.org/metaraine/prefixnote.svg?branch=master)](https://travis-ci.org/metaraine/prefixnote)

Annotate strings with simple, embedded prefix expressions.

Used by [yoga](https://github.com/metaraine/yoga).

## Install

```sh
$ npm install --save prefixnote
```


## Basic Usage

```js
var prefixnote = require('prefixnote')
```

Given a trivial expression of `{a}`, testing the expression with the data `{ a: true }` will yield a match result.

```js
prefixnote.test('{a}', { a: true }) // { expression: 'a', args: [], options: {} })
```

Testing the same expression with the data `{ a:false }` will yield null since the expression does not evaluate to true for the given data.

```js
prefixnote.test('{a}', { a: false }) // null
```

It accepts any static boolean expression.

```js
prefixnote.test('{a && b}', { a: true, b: true }) // { expression: 'a && b', args: [], options: {} })
prefixnote.test('{a && b}', { a: true, b: false }) // null
prefixnote.test('{a && b}', { a: false, b: true }) // null
```

If multiple expressions are embedded, it returns the first one that evaluates to true (like an `or` expression).

```js
prefixnote.test('{a}{b}', { a:true }) // { expression: 'a', args: [], options: {} })
prefixnote.test('{a}{b}', { b:true }) // { expression: 'b', args: [], options: {} })
```

## More Usage

Use prefixnotes as smart file filters (used by [yoga](https://github.com/metaraine/yoga)).

```js
prefixnote.parseFiles('./sample', {
  a: false,
  b: false
})
```

Parse prefixnotes and then do whatever you want with them.

```js

prefixnote.parse('{a}{b}test')

/*
{
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
}
*/
```


## License

ISC © [Raine Lourie](https://github.com/metaraine)
