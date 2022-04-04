<template>
	<div class="extension-fixtable-wrapper">
    <div class="table-wrap">
      <v-grid
        ref="vgrid"
        :source="dataList"
        :columns="columnList"
        @beforeeditstart="onBeforeEditStart"
        @focusout="onAfterEdit"
      ></v-grid>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import VGrid from '@revolist/vue3-datagrid'

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

    watch(() => props.columns,
      (val) => {
        columnList.value = val
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
          dataList.value = val
        }
      },
      { immediate: true, deep: true }
    )

    const onBeforeEditStart = (e) => {
      gRowIndex.value = e.detail.rowIndex
      gColName.value = e.detail.prop
    }

    async function onAfterEdit(e) {
      let viewData = await vgrid.value.$el.getVisibleSource()
      viewData[gRowIndex.value][gColName.value] = e.target.value
      emit('input', JSON.stringify(viewData))
    }

		return { dataList, columnList, vgrid, onBeforeEditStart, onAfterEdit };
	},
});
</script>

<style scoped>
.table-wrap{
  margin-bottom: 15px;
  height: 300px;
}
</style>
