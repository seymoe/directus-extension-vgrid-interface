<template>
	<div class="extension-fixtable-wrapper">
    <div class="toolbar" v-if="!fixedTable">
      <v-button small @click="addRow">Add Row</v-button>
      <div class="right" v-if="importExport">
        <v-button @click="doExport" kind="info" small>Export</v-button>
        <div class="btn-import">
          <v-button kind="info" small>Import CSV</v-button>
          <input
            id="import-csv-file"
            ref="fileInput"
            type="file"
            accept="text/csv"
            @change="doImport"
          />
        </div>
      </div>
    </div>
    <div class="table-wrap" :style="{height: `${tableHeight}px`}">
      <v-grid
        ref="vgrid"
        range
        autoSizeColumn
        theme="material"
        :source="dataList"
        :columns="columnList"
        :columnTypes="columnTypes"
        @beforeeditstart="onBeforeEditStart"
        @focusout="onAfterEdit"
        @afteredit="onAfterEdit"
        @beforeaange="onBeforeRange"
      ></v-grid>
    </div>
    <div class="chart-wrap">
      <div class="chart-box">
        <div ref="chartEl" class="time-series" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import VGrid from '@revolist/vue3-datagrid'
import ApexCharts from 'apexcharts'
import NumberColumnType from '@revolist/revogrid-column-numeral'
import numeral from 'numeral'
import Papa from 'papaparse'
// import SelectTypePlugin from '@revolist/revogrid-column-select'
// import DateTypePlugin from '@revolist/revogrid-column-date'

export default defineComponent({
	props: {
		value: {
			type: [String, Array, Object],
			default: null
		},
		columns: {
			type: Array,
			default: () => {
        return []
      },
		},
    field: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    tableHeight: {
      type: Number,
      default: 300
    },
    fixedTable: {
      type: Boolean,
      default: false
    },
    renderChart: {
      type: Boolean,
      default: false
    },
    importExport: {
      type: Boolean,
      default: true
    },
    chartOptions: {
			type: Object,
			default: () => {
        return {}
      }
		}
	},
  components: {
    VGrid
  },
	emits: ['input'],
	setup(props, {emit}) {
    // column data
    const columnList = ref([])
    // row data
    const dataList = ref([])
    // table ref
    let vgrid = ref()
    // current row index
    let gRowIndex = ref(0)
    // current column name
    let gColName = ref('')
    // 表格配置cell类型插件
    const columnTypes = ref({
      'numeric': new NumberColumnType('0,0')
    })
    // charts
    const chartEl = ref()
    const chart = ref()
    // json format type
    const jsonFormat = ref('')
    const shouldInitEmit = ref(true)

    if (props.type === 'json') {
      watch(() => props.columns,
        (val) => {
          // 如果 props.fixedTable 为 false，则添加内置列
          if (!props.fixedTable && !val.find(item => item.prop === '$$_action')) {
            val.push({
              prop: '$$_action',
              name: 'Actions',
              pin: 'colPinEnd',
              readonly: true,
              cellTemplate: (createElement, _props) => {
                return createElement('span', {
                  style: {
                    color: 'red'
                  },
                  onClick: () => {
                    let rows = dataList.value
                    rows.splice(_props.rowIndex, 1)
                    rows.forEach(row => {
                      delete row.$$_action
                    })
                    emitTableData(rows)
                  }
                }, 'Remove');
              }
            })
          }
          columnList.value = val.map(c => {
            if (c.columnType === 'numeric' && c.format) {
              c.cellTemplate = (createElement, _props) => {
                return createElement('span', {}, numeral(_props.model[_props.prop]).format(c.format));
              }
            }
            return {
              ...c,
              autoSize: true
            }
          })
        },
        { immediate: true }
      )
    }

    watch(() => props.value,
      (val) => {
        if (typeof val === 'string') {
          if (props.type === 'text') {
            try {
              const { data, meta } = Papa.parse(val, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true
              })
              setTableFromCsvData(data, meta)
            } catch (err) {
              console.log(err)
            }
          } else if (props.type === 'json') {
            try {
              const _val = JSON.parse(val)
              let list = []
              if (Array.isArray(_val)) {
                list = _val
                jsonFormat.value = 'array'
              } else if (_val && Object.keys(_val).length) {
                let keys = Object.keys(_val)
                let rowLen = _val[keys[0]]['length']
                for (let i = 0; i < rowLen; i++) {
                  let o = {}
                  for (let j = 0; j < keys.length; j++) {
                    let k = keys[j]
                    o[k] = _val[k][i]
                  }
                  list.push(o)
                }
                jsonFormat.value = 'object'
              } else {
                jsonFormat.value = 'array'
              }
              dataList.value = list || []
            } catch (err) {
              console.log(err)
            }
          }
        } else {
          let list = []
          if (Array.isArray(val)) {
            list = val
            jsonFormat.value = 'array'
          } else if (val && Object.keys(val).length) {
            let keys = Object.keys(val)
            let rowLen = val[keys[0]]['length']
            for (let i = 0; i < rowLen; i++) {
              let o = {}
              for (let j = 0; j < keys.length; j++) {
                let k = keys[j]
                o[k] = val[k][i]
              }
              list.push(o)
            }
            jsonFormat.value = 'object'
          } else {
            jsonFormat.value = 'array'
          }
          dataList.value = list
          if (shouldInitEmit.value) {
            console.log('更新数据！！！', dataList.value)
            emitTableData(dataList.value)
            shouldInitEmit.value = false
          }
        }
        setupChart(props.chartOptions)
      },
      { immediate: true, deep: true }
    )

    function setTableFromCsvData(data, meta) {
      if (meta?.fields.length) {
        const columns = meta.fields.map(field => {
          return {
            prop: field,
            name: field,
            autoSize: true
          }
        })
        // 如果 props.fixedTable 为 false，则添加内置列
        if (!props.fixedTable && !columns.find(item => item.prop === '$$_action')) {
          columns.push({
            prop: '$$_action',
            name: 'Actions',
            pin: 'colPinEnd',
            readonly: true,
            cellTemplate: (createElement, _props) => {
              return createElement('span', {
                style: {
                  color: 'red'
                },
                onClick: () => {
                  let rows = dataList.value
                  rows.splice(_props.rowIndex, 1)
                  rows.forEach(row => {
                    delete row.$$_action
                  })
                  emitTableData(rows)
                }
              }, 'Remove');
            }
          })
        }
        columnList.value = columns
      }
      dataList.value = data || []
    }

    // table callbacks
    const onBeforeEditStart = (e) => {
      gRowIndex.value = e.detail.rowIndex
      gColName.value = e.detail.prop
    }
    async function onAfterEdit(e) {
      let viewData = await vgrid.value.$el.getVisibleSource()
      let value = e.target.value
      const _column = columnList.value.find(item => item.prop === gColName.value)
      if (_column && _column.columnType === 'numeric') {
        value = parseFloat(value)
      }
      viewData[gRowIndex.value][gColName.value] = value
      viewData.forEach(row => {
        delete row.$$_action
      })
      emitTableData(viewData)
    }
    async function onBeforeRange(e) {
      let viewData = await vgrid.value.$el.getVisibleSource()
      viewData.forEach(row => {
        delete row.$$_action
      })
      emitTableData(viewData)
    }
    function addRow() {
      const o = {}
      columnList.value.forEach(column => {
        o[column.prop] = column.columnType === 'numeric' ? 0 : ''
      })
      dataList.value.push(o)
      emitTableData(dataList.value)
    }

    // update table data
    function emitTableData(data) {
      if (props.type === 'json') {
        if (jsonFormat.value === 'array') {
          emit('input', JSON.stringify(data))
        } else if (jsonFormat.value === 'object') {
          let _data = {}
          columnList.value.map(c => {
            _data[c.prop] = []
            data.forEach(row => {
              _data[c.prop].push(row[c.prop])
            })
          })
          delete _data.$$_action
          emit('input', JSON.stringify(_data))
        }
      } else if (props.type === 'text') {
        const csv = Papa.unparse(data, { header: true, skipEmptyLines: true })
        emit('input', csv)
      }
    }

    // chart methods
    function setupChart(opt = {}) {
      if (!props.renderChart) return
      const { series, xaxis, yaxis } = opt
      if (!series || !xaxis) return
      const genOptions = () => ({
        chart: {
          height: 350
        },
        stroke: {
          width: 2
        },
        ...opt
      })
      const options = genOptions()
      if (Array.isArray(series)) {
        options.series = series.map(item => {
          return {
            name: item.name,
            data: dataList.value.map(row => Number(row[item.dataKey])),
            type: item.type
          }
        })
      }
      if (xaxis) {
        options.xaxis = {
          categories: dataList.value.map(row => row[xaxis.categoryKey])
        }
      }
      nextTick(() => {
        if (chart.value) {
          chart.value.updateOptions(options)
        } else {
          chart.value = new ApexCharts(chartEl.value, options)
          chart.value.render()
        }
      })
    }

    function doExport() {
      let tableData = dataList.value.map(item => {
        const o = item
        delete o.$$_action
        return o
      })
      const csv = Papa.unparse(tableData)
      console.log('export csv content: ', csv)
      const aNode = document.createElement('a')
      aNode.href = `data:text/csv;charset=utf-8,\ufeff${csv}`
      aNode.download = `${props.field}_${Date.now()}.csv`
      aNode.click()
    }

    function doImport(event) {
      const files = event.target?.files
      let file = files[0] || null
      if (!file) return
      console.log('File Object', file)
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
          console.log("File Parsing complete:", results);
          setTableFromCsvData(results.data || [], results.meta || { fields: [] })
          setTimeout(() => {
            emitTableData(dataList.value)
          }, 300)
        }
      })
    }

    onMounted(() => {
      setupChart(props.chartOptions)
    })
    onUnmounted(() => {
			chart.value?.destroy()
		})

		return { columnTypes, dataList, columnList, vgrid, onBeforeEditStart, onAfterEdit, onBeforeRange, addRow, chartEl, doExport, doImport };
	}
});
</script>

<style scoped>
.toolbar{
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}
.toolbar .right{
  display: flex;
  align-items: center;
}
.toolbar .btn-import{
  position: relative;
  margin-left: 15px;
}
.toolbar .btn-import #import-csv-file{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}
.table-wrap{
  margin-bottom: 15px;
  height: 300px;
}
</style>
