# Data Grid - Directus extension

A directus extension with `@revolist/vue3-datagrid`, specify fixed columns to generate an editable table field.

## Installation

In your Directus installation root

```
npm install directus-extension-vgrid-interface
```

Restart directus

## Usage

To use this custom interface into a data model, you have to:

- Add a simple field with **JSON** type or select **Text** type
- you have to config default columns when you choose json type, and you have to config the default value(csv) when you choose text type.
- Enjoy ! 🎉

### Json type Example columns

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

### Text type CSV
```
time,power
2022,0
```

## Building locally and contributing

You can also clone this repository and build it by yourself.

```
npm i
npm run build
```

Then use `index.js` in your custom `/extensions/interfaces` directory or in whatever you want.
