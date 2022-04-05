# Data Grid - Directus extension

A directus extension with `@revolist/vue3-datagrid`, specify fixed columns to generate an editable table field.

## Installation

In your Directus installation root

```
npm install directus-extension-vgrid
```

Restart directus

## Usage

To use this custom interface into a data model, you have to:

- Add a simple field with **JSON** type
- Config default columns
- Enjoy ! 🎉

### Example columns

```json
[
  {
    "prop": "time",
    "name": "Time"
  },
  {
    "prop": "power",
    "name": "Power",
    "columnType": "numeric"
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
