# The virtualized table component for Ant Design


*[update_log.md](https://github.com/wubostc/virtualized-table-for-antd/blob/master/update_log.md)*

+ Install
  ```shell
  npm i --save virtualizedtableforantd
  ```

+ All interfaces
  ```typescript

  // the param of the func VTComponents
  interface vt_opts extends Object {
      readonly id: number;
      overscanRowCount?: number; // default 5
      reflection?: string[] | string;
      onScroll?: ({ left, top }: {
          top: number;
          left: number;
      }) => void;
      destroy?: boolean; // default false
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
  export declare function VTScroll(id: number, param?: {
      top: number;
      left: number;
  }): void | {
      top: number;
      left: number;
  };
  ```


+ Quick start
  ```typescript
  import { Table } from 'antd';

  // using in the antd table
  <Table
    scroll={{ y: 500 }} // it's important for using VTComponents!!!
    components={
      VTComponents({
        id: 1000,    /*the id is immutable*/
      })
    }
    columns={/*your columns*/}
    dataSource={/*your data*/}
  />
  ```

  > Maybe you need to fix your style.

  ```less
  ant-table [vt] > table > .ant-table-tbody > tr > td {
      padding: 8px;
  }
  ```


+ Restoring last state
  ```typescript
  import React, { PureComponent, useEffect } from 'react';
  import { Table } from 'antd';

  const ctx = { top: 0 };

  // Class version.
  class Users extends PureComponent {
    constructor(...args) {
      super(...args);
    }

    render() {
      return (
        <Table
          scroll={{ y: 500 }}
          components={VTComponents({
            id: 1000,
            onScoll: ({ left, top }) => ctx.top = top
            })
          }
        />
      );
    }

    componentDidMount() {
      VTScroll(1000, { top: ctx.top });
    }

    componentWillUnmount() {
      ctx.top = VTScroll(1000).top;
    }
  }

  // Hooks version.
  function Users() {

    useEffect(() => {
      VTScroll(1000, { top: ctx.top });

      return () => ctx.top = VTScroll(1000).top;
    }, []);

    return (
      <Table
        scroll={{ y: 500 }}
        components={VTComponents({
          id: 1000,
          onScoll: ({ left, top }) => ctx.top = top
          })
        }
        columns={/*your columns*/}
        dataSource={/*your dataSource*/}
      />
    );
  }

  //--------- About
  function About() {
    return "About...";
  }

  function App() {
    return (
      <>
        <NavLink to={'/users'}>Users</NavLink>
        <NavLink to={'/about'}>About</NavLink>
        <Switch>
          <Route component={Users} path="/users" />
          <Route component={About} path="/about" />
        </Switch>
      </>
    );
  }
  ```


+ Editable Table(decorator)

  > Note: the opt `reflection` only support `getVTComponents(1000).table`.

  ```typescript
  import React from 'react';
  import { Form, Input } from "antd";

  const EditableComponents = getVTComponents(1000);
  EditableComponents.table = Form.create()(EditableComponents.table); 

  class C extends React.Component {
    constructor(...args) {
      super(...args);
      this.EditableComponents = EditableComponents;
      this.EditableContext = getVTContext(1000);
    }

    render() {
      const Context = this.EditableContext;
      const Consumer = Context.Consumer;

      return (
        <Table
          columns={[{
            title: "from reflection",
            render: (text) => {
              return (
                <Comsumer>
                {
                  (form) => { // (form) is the same as `reflection: ["form"]`
                    return (
                      <Form.Item>
                        {form.getFieldDecorator("myreflection")(<Input />)}
                      </Form.Item>
                    );
                  }
                }
                </Comsumer>
              );
            }
          }]}
          components={VTComponents({ id: 1000, reflection: ["form"] })}
          scroll={{ y: 500 }}
          dataSource={[{}]}
        />
      );

    }
  }
  ```

+ support column.fixed
  ```typescript

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
      render: => 'Action',
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

