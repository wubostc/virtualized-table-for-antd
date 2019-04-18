<!-- # virtualized-table-for-antd -->
## the virtualized table component for Ant Design


## [update_log.md](https://github.com/wubostc/virtualized-table-for-antd/blob/master/update_log.md)


```typescript

// the param of the func VTComponents
export interface vt_opts {
    id: number;
    height: number;
    overscanRowCount?: number;
    VTWrapperRender?: (head: number, tail: number, children: any[], restProps: object) => JSX.Element;
    reflection?: string[] | string;
    changedBits?: (prev: vt_ctx, next: vt_ctx) => number;
    VTRefresh?: () => void;
    VTScroll?: (param?: {
        top: number;
        left: number;
    }) => void | {
        top: number;
        left: number;
    };
    onScroll?: ({ left, top }: {
        top: number;
        left: number;
    }) => void;
    destory?: boolean;
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
  components={VTComponents({ id: 1000/*the id is immutable*/, height: 500 /*the height prop is variable*/ })}
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

and more...

```typescript


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
      scroll={{ y: 500 }}
      ...
    />
  }
}


```


## enjoy!

