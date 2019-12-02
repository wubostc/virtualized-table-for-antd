/**
 * copy this file to your working directory.
 */
import React, { useState, useMemo, } from 'react';
import { Table, Button } from 'antd';
import { VTComponents, VTScroll, } from '../../virtualized-table-for-antd';



function rndstr(str: string) {
  const n = 0 | (Math.random() * 4) + 1;
  let s = '';
  for (let i = 0; i < n; ++i) {
    s += str;
  }
  return s;
}


export default function Table21() {
  // Column name age 1 2 3 4 5 6 7 8 operation
  const _columns: any = useMemo(() => [
    {
      title: 'Full Name',
      width: 150,
      dataIndex: 'name',
      key: 'name',
  
      fixed: 'left',
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
      width: 170,
    },
    {
      title: 'Column 4',
      dataIndex: 'address',
      key: '4',
      width: 180,
    },
    {
      title: 'Column 5',
      dataIndex: 'address',
      key: '5',
      width: 190,
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
  ], []);


  const _data = useMemo(() => {
    const data: any[] = [];
    for (let i = 0; i < 83; i++) {
      data.push({
        key: `#21-${i}`,
        name: `Edrward ${i}`,
        age: 0 | Math.random() * 88 + 12,
        address: rndstr(`London Park no. ${i}`),
      });
    }
    return data;
  }, []);

  const [data, setData] = useState(_data);

  // Pagination
  const [showPagination, setPagination] = useState(true);

  return (
    <>
      <Button onClick={() => {
        setData(_data);
      }}>{"load data"}</Button>
      <Button onClick={async () => {
        setData([]);
      }}>{"clear data"}</Button>
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

      <Table
        style={{ width: 1500 }}
        columns={_columns}
        dataSource={data}
        scroll={{ y: 500, x: 1500 }}
        components={
          VTComponents({
            id: 2,
            debug: true,
        })}
        pagination={showPagination ? {
          pageSize: 20,
        } : false}
      >
      </Table>
    </>
  );
}

