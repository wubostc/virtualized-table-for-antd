# virtualized-table-for-antd
the virtualized table component for Ant Design


```typescript

export
interface vt_opts {
  id: number; // the id of context
  height: number; // the trs to render
  overscanRowCount?: number; // default 1
  VTWrapperRender?: (head: number, tail: number, children: any[], restProps: object) => JSX.Element; // head and tail is index of the trs(children)
  reflection?: string[] | string; // reflect to context
  changedBits?: (prev: vt_ctx, next: vt_ctx) => number;
}



// using in the antd table
<Table
...
  components={VTComponents({ id: 1000/*the id is immutable*/, height: 500 /*the height prop is variable*/ })}
...
/>


/* API */
function VTComponents(vt_opts: vt_opts)
function getVTContext(id: number)
function getVTComponents(id: number)


// e.g. (decorator)
class C extends React.Component {
  constructor(...args) {

    this.EditableComponents = getVTComponents(1000);
    this.EditableComponents.table = Form.create()(this.EditableComponents.table); // the From is a component of antd
    this.EditableContext = getVTContext(1000);

    ...
  }

  render() {
    const Context = this.EditableContext;
    const Consumer = Context.Consumer;


    <Table
      columns={[{
        title: "from reflection",
        render: (text) => {

          return (
            <Comsumer>
            {
              (form) => {
                return <Form.Item>{form.getFieldDecorator("myreflection")(<Input/>)}</Form.Item>;
              }
            }
            </Comsumer>
          );

        }
      }]}
      components={VTComponents({ id: 1000, height: 500, reflection: ["form"] })}
      ...
    />
  }
}


```

VTComponents

