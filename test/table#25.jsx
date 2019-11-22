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
import React from 'react';
import { Table, Form } from 'antd';

import { VTComponents } from '../../virtualized-table-for-antd';

const data = [];
for (let i = 0; i < 5; i++) {
  data.push({
    key: i.toString(),
    name: `Edrward ${i}`,
    age: 32,
    address: `London Park no. ${i}`,
  });
}


function Table$25() {
  const [dataSource, setDataSource] = React.useState([]);

  const tempDataSource = [];
  for (let i = 0; i < 100; i++) {
    tempDataSource.push({
      company_name: `aaa${i}`,
    });
  }

  React.useEffect(() => {
    setTimeout(() => {
      setDataSource(tempDataSource);
    }, 5000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const columns = [
    {
      title: '序号',
      key: 'id',
      render(text, record, index) {
        return index + 1;
      },
      width: 100,
    },
    {
      title: '公司',
      dataIndex: 'company_name',
      width: 200,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      scroll={{ y: 500 }}
      rowKey={'id'}
      components={VTComponents({
        id: 1,
        debug: true,
      })}
    />
  );
}

export default Table$25;
