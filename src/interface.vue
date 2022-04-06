<template>
	<div class="extension-fixtable-wrapper">
    <div class="toolbar">
      <v-button @click="addRow">Add Row</v-button>
    </div>
    <div class="table-wrap">
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
    console.log(props.field, ':', props)
    // 列数据
    const columnList = ref([])
    // 行数据
    const dataList = ref([])
    // 表格实例
    let vgrid = ref()
    // 当前行索引
    let gRowIndex = ref(0)
    // 当前列名称
    let gColName = ref('')
    // 表格配置cell类型插件
    const columnTypes = ref({
      'numeric': new NumberColumnType('0,0')
    })
    // 表格
    const chartEl = ref()
    const chart = ref()

    watch(() => props.columns,
      (val) => {
        // 添加内置列
        if (!val.find(item => item.prop === '$$_action')) {
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
                  emit('input', JSON.stringify(rows))
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
    watch(() => props.value,
      (val) => {
        if (typeof val === 'string') {
          try {
            dataList.value = JSON.parse(val)
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

    const onBeforeEditStart = (e) => {
      gRowIndex.value = e.detail.rowIndex
      gColName.value = e.detail.prop
    }

    async function onAfterEdit(e) {
      console.log('FixTable: afterEdit', e, dataList.value)
      let viewData = await vgrid.value.$el.getVisibleSource()
      let value = e.target.value
      const _column = columnList.value.find(item => item.prop === gColName.value)
      if (_column && _column.columnType === 'numeric') {
        value = parseFloat(value)
      }
      viewData[gRowIndex.value][gColName.value] = value
      console.log(viewData)
      viewData.forEach(row => {
        delete row.$$_action
      })
      emit('input', JSON.stringify(viewData))
    }

    async function onBeforeRange(e) {
      let viewData = await vgrid.value.$el.getVisibleSource()
      viewData.forEach(row => {
        delete row.$$_action
      })
      emit('input', JSON.stringify(viewData))
    }

    const addRow = () => {
      const o = {}
      columnList.value.forEach(column => {
        o[column.prop] = column.columnType === 'numeric' ? 0 : ''
      })
      dataList.value.push(o)
      emit('input', JSON.stringify(dataList.value))
    }

    // 表格相关
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
          console.log('图表更新', options)
          chart.value.updateOptions(options)
        } else {
          console.log('图表创建', options)
          chart.value = new ApexCharts(chartEl.value, options)
          chart.value.render()
        }
      })
    }

    onMounted(() => {
      setupChart(props.chartOptions)
    })
    onUnmounted(() => {
      console.log('组件卸载了', chart.value, chartEl)
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
