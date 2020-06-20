/* eslint-disable no-unused-vars */
/* eslint-disable object-curly-newline */
/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable arrow-parens */
/* eslint-disable react/react-in-jsx-scope */
/**
 * copy this file to your working directory.
 */
import React, { useRef, useEffect, useMemo } from 'react';
import { Table } from 'antd';

import { useVT } from 'virtualizedtableforantd';

const data = [];
for (let i = 0; i < 100; i++) {
  data.push({
    key: i.toString(),
    name: `Edrward ${i}`,
    age: 32,
    address: `London Park no. ${i}`,
  });
}


/**
 * must use `React.forwardRef` to create your custom component, and don't forget to use `ref`.
 */
const MyRow = React.forwardRef((props, ref) => {
  const { children, ...rest } = props;
  return <tr {...rest} ref={ref} style={{ backgroundColor: 'red' }} onClick={() => window.alert('1')}>{children}</tr>;
});


function CustomRowsHooks() {
  const columns = useRef([
    {
      title: 'name',
      dataIndex: 'name',
      width: '25%',
      editable: true,
    },
    {
      title: 'age',
      dataIndex: 'age',
      width: '15%',
      editable: true,
    },
    {
      title: 'address',
      dataIndex: 'address',
      // width: '40%',
      editable: true,
    },
  ]);

  const [VT, setVT] = useVT(() => ({ scroll: { y: 500 }, debug: true }));

  useMemo(() => setVT({ body: { row: MyRow } }), [setVT]);

  return (
    <Table
      components={VT}
      bordered
      scroll={{ y: 500 }}
      dataSource={data}
      columns={columns.current}
      pagination={false}
    />
  );
}

export default CustomRowsHooks;
