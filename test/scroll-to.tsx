import React, { FC, useState, useRef } from 'react';
import { useVT } from 'virtualizedtableforantd4';
import { Table, Input, Button } from 'antd';


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
    age: 32,
    address: rndstr(`London Park no. ${i}`),
  });
}

const TableScrollTo: FC = () => {
  const [top, setTop] = useState(-1);
  const ref = useRef();

  const [VT] = useVT(() => {
    return {
      ref: ref,
      initTop: 1000,
      debug: true,
      scroll: {
        y: 600,
      }
    }
  }, []);

  
  return (
    <>
      <Input
        onChange={e => {
          const top = (+e.target.value);
          setTop(Number.isNaN(top) ? 0 : top);
        }}
      />
      <Button
        onClick={() => {
          ref.current.scrollTo(top)
        }}
      >
        {`jump to ${top === -1 ? 'the bottom of the table' : `top: ${top}`}`}
      </Button>
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
        dataSource={_data}
        components={VT}
        pagination={false}
      />
    </>
  )
}

export default TableScrollTo;
