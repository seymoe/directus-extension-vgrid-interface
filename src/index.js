import InterfaceComponent from './interface.vue'

export default {
	id: 'interface-datagrid',
	name: 'Data Grid',
	icon: 'open_in_new',
	description: 'Specify fixed columns to generate an editable table field.',
	component: InterfaceComponent,
	group: 'standard',
	types: ['json'],
  options: ({ field }) => {
		const jsonOptions = {
			standard: [
				{
          field: 'columns',
          name: 'Columns',
          type: 'json',
          meta: {
            width: 'full',
            interface: 'input-code'
          },
          schema: {
            default_value: JSON.stringify([
              {
                prop: 'time',
                name: 'Column Name'
              },
              {
                prop: 'power',
                name: 'Column Name',
                columnType: 'numeric'
              }
            ], null, 2)
          }
        }
			],
      advanced: []
		};
    if (field?.type === 'json') {
			return jsonOptions
		}
	}
}
