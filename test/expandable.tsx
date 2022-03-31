/**
 * copy this file to your working directory.
 */
import React, { FC, useState } from 'react';
import { useVT } from 'virtualizedtableforantd4';
import { Table } from 'antd';


function rndstr(str: string) {
  const n = 0 | (Math.random() * 10) + 1;
  let s = '';
  for (let i = 0; i < n; ++i) {
    s += str;
  }
  return s;
}

const _data: any[] = [];

for (let i = 0; i < 1000; i++) {
  _data.push({
    index: i,
    name: `Edrward ${i}`,
    expandable: ((Math.random() * 10) | 0) > 4,
    age: 32,
    address: rndstr(`London Park no. ${i}`),
  });
}

const TableScrollTo: FC = () => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const [VT] = useVT(() => {
    return {
      // ref: ref, // deprecated
      initTop: 1000,
      debug: true,
      scroll: {
        y: 600,
      }
    }
  }, []);

  
  return (
    <>
      <Table
        columns={[{
          title: 'index',
          dataIndex: 'index',
        }, {
          title: 'address',
          dataIndex: 'address',
        }]}
        scroll={{
          y: 600,
        }}
        rowKey="index"
        dataSource={_data}
        components={VT}
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) => {
            if (expanded) {
              setExpandedRowKeys([...expandedRowKeys, record.index]);
            } else {
              const keys = expandedRowKeys.filter((k) => k !== record.index);
              setExpandedRowKeys(keys);
            }
          },
          expandedRowRender: record => <p style={{ margin: 0 }}>my name is {record.name}</p>,
          rowExpandable: record => record.expandable,
        }}
      />
    </>
  )
}

export default TableScrollTo;
