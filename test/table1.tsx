
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Table, Button, Input, Switch, Modal } from 'antd';
import { VTComponents, VTScroll, } from '../../virtualized-table-for-antd';


function rndstr(str: string) {
  const n = 0 | (Math.random() * 10) + 1;
  let s = '';
  for (let i = 0; i < n; ++i) {
    s += str;
  }
  return s;
}

export default function Table1() {
  
  const _data = useMemo(() => {
    const data: any[] = [];
    for (let i = 0; i < 20; i++) {
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

  const columns = useMemo(() => [
    {
      title: 'Full Name',
      width: 100,
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

    },
    { title: 'Column 8', dataIndex: 'address', key: '8' },
    {
      title: 'Action',
      key: 'operation',
      width: 100,
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



  return (
    <>
      <Button onClick={() => setData([])}>{"clear data"}</Button>
      <Button onClick={() => setData(_data)}>{"load data"}</Button>
      

      pagination:
      <Button onClick={() => {
        if (showPagination) {
          setPagination(false);
        } else {
          setPagination(true);
        }
      }}>{!showPagination ? "show" : "hide"}</Button>
      

      rowSelection:
      <Switch defaultChecked={showSelection} onChange={(checked) => setSelection(checked)} />


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
      <br />


      <Table
        columns={columns}
        dataSource={data}
        scroll={{ y: 500 }}
        components={VTComponents({ id: 1, debug: true,/* onScroll: ({ left, top }) => console.log(top, left) */})}
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