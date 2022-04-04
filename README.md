# FixTable - Directus extension

A directus extension with `@revolist/vue3-datagrid`, specify fixed rows and columns to generate an editable table field.

## Installation

In your Directus installation root

```
npm install directus-extension-fixtable
```

Restart directus

## Usage

To use this custom interface into a data model, you have to:

![](https://github.com/seymoe/directus-extension-fixtable-interface/master/screenshot.png)

- Add a simple field with **JSON** type
- Config default value and columns
- Enjoy ! 🎉

### Example default value

```json
[
  {
    "time": 2022,
    "power": 0
  }
]
```

### Example columns

```json
[
  {
    "prop": "time",
    "name": "Time"
  },
  {
    "prop": "power",
    "name": "Power"
  }
]
```

## Building locally and contributing

You can also clone this repository and build it by yourself.

```
npm i
npm run build
```

Then use `index.js` in your custom `/extensions/interfaces` directory or in whatever you want.
