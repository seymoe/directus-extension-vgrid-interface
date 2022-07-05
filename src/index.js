import InterfaceComponent from './interface.vue'

export default {
	id: 'interface-datagrid',
	name: 'Data Grid',
	icon: 'open_in_new',
	description: 'Specify fixed columns to generate an editable table field.',
	component: InterfaceComponent,
	group: 'standard',
	types: ['json', 'text'],
  options: ({ field }) => {
		const advancedList = [
      {
        field: 'tableHeight',
        name: 'Table Height',
        type: 'integer',
        meta: {
          width: 'half',
          interface: 'input',
          options: {
            placeholder: 'Please enter table height',
          }
        }
      },
      {
        field: 'fixedTable',
        name: 'Fixed Table',
        type: 'boolean',
        meta: {
          width: 'half',
          interface: 'boolean'
        },
        schema: {
          default_value: false
        }
      },
      {
        field: 'renderChart',
        name: 'Show Chart',
        type: 'boolean',
        meta: {
          width: 'half',
          interface: 'boolean'
        },
        schema: {
          default_value: false
        }
      },
      {
        field: 'importExport',
        name: 'Import Export',
        type: 'boolean',
        meta: {
          width: 'half',
          interface: 'boolean'
        },
        schema: {
          default_value: true
        }
      },
      {
        field: 'chartOptions',
        name: 'Chart Options',
        type: 'json',
        meta: {
          width: 'full',
          interface: 'input-code'
        },
        schema: {
          default_value: {
            chart: {
              height: 350
            },
            series: [
              {
                name: 'A SERIES NAME',
                dataKey: 'power',
                type: 'line'
              }
            ],
            xaxis: {
              categoryKey: 'time'
            },
            yaxis: {
              min: 0
            }      
          }
        }
      }
    ]
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
            default_value: [
              {
                prop: 'time',
                name: 'Time'
              },
              {
                prop: 'power',
                name: 'Power',
                columnType: 'numeric'
              },
              {
                prop: 'name',
                name: 'Name'
              }
            ]
          }
        }
			],
      advanced: advancedList
		};
    const textOptions = {
      standard: [],
      advanced: advancedList
    }
    if (field?.type === 'json') {
			return jsonOptions;
		}
    if (field?.type === 'text') {
      return textOptions;
    }
	}
}
