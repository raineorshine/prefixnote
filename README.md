# prefixnote
[![npm version](https://img.shields.io/npm/v/prefixnote.svg)](https://npmjs.org/package/prefixnote) 
[![Build Status](https://travis-ci.org/metaraine/prefixnote.svg?branch=master)](https://travis-ci.org/metaraine/prefixnote)

> Annotate strings with simple, embedded prefix expressions.


## Install

```sh
$ npm install --save prefixnote
```


## Usage

Use prefixnotes as embedded conditional expressions.

```js
var prefixnote = require('prefixnote')

prefixnote.test('{a}', { a: true }) // { expression: 'a', args: [], options: {} })
prefixnote.test('{a}', { a: false }) // null
prefixnote.test('{a}', {}) // null
prefixnote.test('{a && b}', { a: true, b: true }) // { expression: 'a && b', args: [], options: {} })
prefixnote.test('{a && b}', { a: true, b: false }) // null
prefixnote.test('{a && b}', { a: false, b: true }) // null
prefixnote.test('{a}{b}', { a:true }) // { expression: 'a', args: [], options: {} })
prefixnote.test('{a}{b}', { b:true }) // { expression: 'b', args: [], options: {} })
prefixnote.test('{a}{b}', {}), null)
```

Use prefixnotes as smart file filters (used by [yoga](https://github.com/metaraine/yoga)):

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
