<template>
	<div class="extension-fixtable-wrapper">
    <div class="toolbar" v-if="!fixedTable">
      <v-button @click="addRow">Add Row</v-button>
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
			type: [String, Array],
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
      defualt: ''
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

    if (props.type === 'json') {
      watch(() => props.columns,
        (val) => {
          // 如果 props.fixedTable 为 false，则添加内置列
          if (!props.fixedTable && !val.find(item => item.prop === '$$_action')) {
            val.push({
              prop: '$$_action',
              name: 'Actions',
              pin: 'colPinEnd',
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
        if (props.type === 'text' && typeof val === 'string') {
          try {
            const { data, meta } = Papa.parse(val, {header: true, skipEmptyLines: true})
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
          } catch (err) {
            console.log(err)
          }
        } else {
          dataList.value = val === null ? [] : val
        }
        setupChart(props.chartOptions)
      },
      { immediate: true, deep: true }
    )

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
        emit('input', JSON.stringify(data))
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
      // if (Array.isArray(yaxis)) {
      //   options.yaxis = yaxis.map((item, index) => {
      //     const o = {
      //       title: {
      //         text: item
      //       }
      //     }
      //     if (index > 0) {
      //       o.opposite = true
      //     }
      //     return o
      //   })
      // }
      // if (chart.value) chart.value?.destroy()
      nextTick(() => {
        if (chart.value) {
          chart.value.updateOptions(options)
        } else {
          chart.value = new ApexCharts(chartEl.value, options)
          chart.value.render()
        }
      })
    }

    onMounted(() => {
      setupChart(props.chartOptions)
    })
    onUnmounted(() => {
			chart.value?.destroy()
		})

		return { columnTypes, dataList, columnList, vgrid, onBeforeEditStart, onAfterEdit, onBeforeRange, addRow, chartEl };
	}
});
</script>

<style scoped>
.toolbar{
  margin-bottom: 15px;
}
.table-wrap{
  margin-bottom: 15px;
  height: 300px;
}
</style>
