## The virtualized table component for Ant Design


## [update_log.md](https://github.com/wubostc/virtualized-table-for-antd/blob/master/update_log.md)

install
```shell
npm i --save virtualizedtableforantd
```

```typescript

// the param of the func VTComponents
interface vt_opts extends Object {
    id: number;
    height?: number; // will using the Table.scroll.y if unset.
    overscanRowCount?: number; // default 5
    VTWrapperRender?: (head: number, tail: number, children: any[], restProps: obj) => JSX.Element;
    reflection?: string[] | string;
    changedBits?: (prev: vt_ctx, next: vt_ctx) => number;
    onScroll?: ({ left, top }: {
        top: number;
        left: number;
    }) => void;
    destory?: boolean; // default false
    debug?: boolean;
}

/* all APIs */
export declare function VTComponents(vt_opts: vt_opts): TableComponents;
export declare function getVTContext(id: number): React.Context<vt_ctx>;
export declare function getVTComponents(id: number): {
    table: React.ReactType<any>;
    wrapper: React.ReactType<any>;
    row: React.ReactType<any>;
};
export declare function VTRefresh(id: number): void;
export declare function VTScroll(id: number, param?: {
    top: number;
    left: number;
}): void | {
    top: number;
    left: number;
};

```


```typescript
/*-------------------------- quick start --------------------------*/
// using in the antd table
<Table
...
  scroll={{ y: 500 }} // it's important!!!
  components={
    VTComponents({
      id: 1000,    /*the id is immutable*/
      height: 500, /*the height prop is NOT required*/
    })
  }
...
/>
```

maybe you need to fix your style

```less
ant-table [vt] > table > .ant-table-tbody > tr > td {
    padding: 8px;
}
```

```typescript
// restore last state

const ctx = { top: 0 };

//--------- Users render
render() {
  <Table
    scroll={{ y }}
    components={VTComponents({ id: 1000, height: y, onScoll: ({ left, top }) => ctx.top = top })
    ...
  />
}
componentDidMount() {
  VTScroll(1000, { top: ctx.top });
}
componentWillUnmount() {
  ctx.top = VTScroll(1000).top;
}

//--------- About
function () {
  return "About...";
}

//--------- router render
render() {
  <Switch>
    <Route component={Users} path="/users" />
    <Route component={About} path="/about" />
  </Switch>
}

```


```typescript
// Editable Table
// e.g. (decorator)

const EditableComponents = getVTComponents(1000);
EditableComponents.table = Form.create()(this.EditableComponents.table); // the From is a component of antd

class C extends React.Component {
  constructor(...args) {

    this.EditableComponents = EditableComponents;
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
      scroll={{ y: 500 }}
      ...
    />
  }
}


```


```typescript
// support column.fixed


const columns = [
  {
    title: 'Full Name',
    width: 100,
    dataIndex: 'name',
    key: 'name',
    fixed: 'left',
  },
  {
    title: 'Age',
    width: 100,
    dataIndex: 'age',
    key: 'age',
    fixed: 'left',
  },
  {
    title: 'Column 1',
    dataIndex: 'address',
    key: '1',
    width: 150,
  },
  {
    title: 'Column 2',
    dataIndex: 'address',
    key: '2',
    width: 150,
  },
  {
    title: 'Column 3',
    dataIndex: 'address',
    key: '3',
    width: 150,
  },
  {
    title: 'Column 4',
    dataIndex: 'address',
    key: '4',
    width: 150,
  },
  {
    title: 'Column 5',
    dataIndex: 'address',
    key: '5',
    width: 150,
  },
  {
    title: 'Column 6',
    dataIndex: 'address',
    key: '6',
    width: 150,
  },
  {
    title: 'Column 7',
    dataIndex: 'address',
    key: '7',
    width: 150,
  },
  { title: 'Column 8', dataIndex: 'address', key: '8' },
  {
    title: 'Action',
    key: 'operation',
    fixed: 'right',
    width: 100,
    render: () => <a href="javascript:;">action</a>,
  },
];

const data = [];
for (let i = 0; i < 100; i++) {
  data.push({
    key: i,
    name: `Edrward ${i}`,
    age: 32,
    address: `London Park no. ${i}`,
  });
}


function renderTable() {
  return (
    <Table
      columns={columns}
      dataSource={data}
      scroll={{ x: 1500, y: 300 }}
      components={VTComponents({ id: 1000, height: 500, })}
    />
  );
}

```



## enjoy!

