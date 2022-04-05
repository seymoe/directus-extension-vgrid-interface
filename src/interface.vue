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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import VGrid from '@revolist/vue3-datagrid'
import NumberColumnType from '@revolist/revogrid-column-numeral'
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
    }
	},
  components: {
    VGrid
  },
	emits: ['input'],
	setup(props, {emit}) {
    const columnList = ref([])
    const dataList = ref([])
    let vgrid = ref()
    let gRowIndex = ref(0)
    let gColName = ref('')
    const columnTypes = ref({
      'numeric': new NumberColumnType('0,0')
    })

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
		return { columnTypes, dataList, columnList, vgrid, onBeforeEditStart, onAfterEdit, onBeforeRange, addRow };
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
