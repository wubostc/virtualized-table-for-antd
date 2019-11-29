/**
 * copy this file to your working directory.
 */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Table, Button, Input, Switch, Modal, Checkbox } from 'antd';
import { VTComponents, VTScroll, } from '../../virtualized-table-for-antd';
import { isNumber } from 'util';


function rndstr(str: string) {
  const n = 0 | (Math.random() * 10) + 1;
  let s = '';
  for (let i = 0; i < n; ++i) {
    s += str;
  }
  return s;
}

export default function Table1() {
  

  const myajax = useCallback(() => {
    const data: any[] = [];
    for (let i = 0; i < 970; i++) {
      const n = 0 | Math.random() * 3000 + 1000;
      data.push({
        key: i + n,
        name: `Edrward ${n}`,
        age: 0 | Math.random() * 88 + 12,
        address: rndstr(`London Park no. ${n}`),
      });
    }

    return new Promise<any[]>((resolve, reject) => {
      setTimeout(() => {
        resolve(data);
      }, Math.random() * 200 + 100);
    });
  }, []);


  const _data = useMemo(() => {
    const data: any[] = [];
    for (let i = 0; i < 1000; i++) {
      data.push({
        key: i,
        name: `Edrward ${i}`,
        age: 32,
        address: rndstr(`London Park no. ${i}`),
      });
    }
    return data;
  }, []);


  const [data, setData] = useState(_data);
  const [rowKeys, setSelectedRowKeys] = useState([]);
  const [showPagination, setPagination] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [showSelection, setSelection] = useState(false);
  const [visibleOfUpdateModal, setVisibleOfUpdateModal] = useState(false);

  const [text, setText] = useState("");


  // add record
  const [name, setFullname] = useState("");
  const [age, setAge] = useState<number>();
  const [key, setKey] = useState<string>();


  const showDeleteConfirm = useCallback((record: any, data: any[]) => {
    Modal.confirm({
      title: 'Are you sure delete this record?',
      content: 'Some descriptions',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        const arr = data.filter((v) => {
          return v.key !== record.key;
        });
        setData(arr);
      },
      onCancel() {
      },
    });
  }, [setData]);


  const record = useRef<any>();
  const showUpdateDialog = useCallback((_record: any) => {
    setVisibleOfUpdateModal(true);
    setText(_record.address);
    record.current = _record;
  }, [setVisibleOfUpdateModal, setText]);

  // Column name age 1 2 3 4 5 6 7 8 operation
  const _columns = useMemo(() => [
    {
      title: 'Full Name',
      width: 150,
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Age',
      width: 100,
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Column 1',
      dataIndex: 'address',
      key: '1',
      width: 200,
    },
    {
      title: 'Column 2',
      dataIndex: 'address',
      key: '2',
      width: 200,
    },
    {
      title: 'Column 3',
      dataIndex: 'address',
      key: '3',
      width: 200,
    },
    {
      title: 'Column 4',
      dataIndex: 'address',
      key: '4',
      width: 200,
    },
    {
      title: 'Column 5',
      dataIndex: 'address',
      key: '5',
      width: 200,
    },
    {
      title: 'Column 6',
      dataIndex: 'address',
      key: '6',
      width: 200,
    },
    {
      title: 'Column 7',
      dataIndex: 'address',
      key: '7',
      width: 200,

    },
    { title: 'Column 8', dataIndex: 'address', key: '8' },
    {
      title: 'Action',
      key: 'operation',
      width: 180,
      render: (text: any, record: any, index: any) => {
        return (
          <>
            <a onClick={() => showUpdateDialog(record)}>update</a>
            |
            <a onClick={() => showDeleteConfirm(record, data)}>delete</a>
          </>
        );
      },
    },
  ], [data]);

  // columns
  const [checkedColumns, setCheckedColumns] = useState(["name", "age", "1", "2", "3", "4", "operation"]);
  const [columns, setColumns] = useState(checkedColumns.map(v => _columns.find(column => column.key === v)));


  const [checkedColumnsFixed, setCheckedColumnsFixed] = useState();



  // VTComponents
  const [height, setHeight] = useState<string | number>(500);
  const [overscanRowCount, setOverscanRowCount] = useState(5);
  const [destroy, setDestroy] = useState(false);

  return (
    <>
      <Button onClick={() => setData([])}>{"clear data"}</Button>
      <Button onClick={() => setData(_data)}>{"load data"}</Button>
      <Button onClick={async () => setData(await myajax())}>{"load data(ajax)"}</Button>
      
      <br />
      <br />
      ---- pagination ----
      <br />
      <Button onClick={() => {
        if (showPagination) {
          setPagination(false);
        } else {
          setPagination(true);
        }
      }}>{!showPagination ? "show" : "hide"}</Button>
      

      <br />
      <br />
      ---- add record ----
      <br />
      key:<Input style={{ width: 100 }} value={key} onChange={(ev) => {
        setKey(ev.target.value);
      }}></Input>
      Full Name:<Input style={{ width: 200 }} value={name} onChange={(ev) => {
        setFullname(ev.target.value);
      }}></Input>
      Age:<Input style={{ width: 100 }} value={age} onChange={(ev) => {
        setAge(isNaN(+ev.target.value) ? 0 : +ev.target.value);
      }}></Input>
      <button onClick={(ev) => {
        if (!key) window.alert("this key can not be null!");
        setData([...data,
          {
            key,
            name,
            age,
            address: "",
          }]);

        setKey(null);
        setFullname(null);
        setAge(null);
      }}>append record</button>
      <button onClick={(ev) => {
        if (!key) window.alert("this key can not be null!");
        setData([
          {
            key,
            name,
            age,
            address: "",
          }, ...data]);

        setKey(null);
        setFullname(null);
        setAge(null);
      }}>prepend record</button>

      <br />
      <br />


      ----rowSelection----
      <br />
      <Switch defaultChecked={showSelection} onChange={(checked) => setSelection(checked)} />
      <br />

      <button onClick={() => {
        if (rowKeys.length === 0) return window.alert("no records selected");
        const _ = data.filter(v => {
          for (let key of rowKeys) {
            if (key === v.key) return false;
          }
          return true;
        });
        setData(_);
      }}>delete the selected records</button>

      <br />
      <br />


      ----Columns----
      <br />

      <Checkbox.Group
        options={[{
          label: "Full Name (fixed left)",
          value: "name",
        },{
          label: "Age (fixed left)",
          value: "age",
        },{
          label: "column1 (fixed left)",
          value: "1",
        },{
          label: "column2 (fixed left)",
          value: "2",
        },{
          label: "column3 (fixed left)",
          value: "3",
        },{
          label: "column4",
          value: "4",
        },{
          label: "column5",
          value: "5",
        },{
          label: "column6 (fixed right)",
          value: "6",
        },{
          label: "column7 (fixed right)",
          value: "7",
        },{
          label: "column8 (fixed right)",
          value: "8",
        },{
          label: "Action (fixed right)",
          value: "operation",
        }]}
        value={checkedColumnsFixed}
        onChange={(checkedValue: string[]) => {
          setCheckedColumnsFixed(checkedValue);
          const fixed: any = {
            "name": "left",
            "age": "left",
            "1": "left",
            "2": "left",
            "3": "left",
      
            "6": "right",
            "7": "right",
            "8": "right",
            "operation": "right",
          };
          columns.forEach((column) => {
            const c = checkedValue.find(v => v === column.key);
            if (c) {
              (column as any).fixed = fixed[c];
            } else {
              try {
                delete (column as any).fixed;
              } catch {}
            }
          });
        }}
      />

      <Checkbox.Group
        options={[{
          label: "Full Name",
          value: "name",
        },{
          label: "Age",
          value: "age",
        },{
          label: "column1",
          value: "1",
        },{
          label: "column2",
          value: "2",
        },{
          label: "column3",
          value: "3",
        },{
          label: "column4",
          value: "4",
        },{
          label: "column5",
          value: "5",
        },{
          label: "column6",
          value: "6",
        },{
          label: "column7",
          value: "7",
        },{
          label: "column8",
          value: "8",
        },{
          label: "Action",
          value: "operation",
        }]}
        value={checkedColumns}
        onChange={(checkedValue: string[]) => {
          setCheckedColumns(checkedValue);
          setColumns(checkedValue.map(v => _columns.find(column => column.key === v)));
        }}
      />


      <br />
      <br />


      ----VTComponents----
      <br />
      height: 
      <Input style={{ width: 100 }} value={height} onChange={e => {
        // isNumber(+e.target.value) ?
        // setHeight(+e.target.value) : setHeight(void 0);
        setHeight(e.target.value);
      }}></Input><br />
      overscanRowCount: 
      <Input style={{ width: 100 }} value={overscanRowCount}
        onChange={e => {
          isNumber(+e.target.value) ?
          setOverscanRowCount(+e.target.value) : setOverscanRowCount(5);
        }}></Input><br />
      destroy: <Checkbox checked={destroy} onChange={e => setDestroy(e.target.checked)}></Checkbox> <br />
      <br />
      <br />
      <br />


      <Table
        style={{ width: 1200 }}
        columns={columns}
        dataSource={data}
        scroll={{ y: height, x: 1600 }}
        components={
          VTComponents(Object.assign({
            id: 1, debug: true,/* onScroll: ({ left, top }) => console.log(top, left) */
          },
          overscanRowCount ? { overscanRowCount } : null))
        }
        pagination={
          showPagination ?
          {
            total: data.length,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSize,
            pageSizeOptions: ["20", "100", "200", "500", "1000"],
            onChange: (_page, pageSize) => {
              setPageSize(pageSize);

              // if (_page !== page) {
              //   setPage(_page);
              //   VTScroll(1, { top: 0, left: 0 });
              // } 
            },
            onShowSizeChange(current, size) {
              setPageSize(size);

            }
          } : false
        }
        rowSelection={
          showSelection ?
          {
            selectedRowKeys: rowKeys,
            onChange: (selectedRowKeys, selectedRows) => {
              setSelectedRowKeys(selectedRowKeys);
            }
          } : null
        }
      >
      </Table>

      <Modal
        title="Basic Modal"
        visible={visibleOfUpdateModal}
        onOk={() => {
          const k = record.current.key;
          data.find((v) => v.key === k).address = text;
          setData([...data]);
          setVisibleOfUpdateModal(false);
        }}
        onCancel={() => {
          setVisibleOfUpdateModal(false);
        }}
      >
        Column 1:
        <Input value={text} onChange={(ev) => {
          setText(ev.target.value);
        }}></Input>
      </Modal>
    </>
  );
}