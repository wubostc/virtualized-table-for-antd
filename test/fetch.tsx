/**
 * copy this file to your working directory.
 */
import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { useVT } from 'virtualizedtableforantd';

export default function TableFetch() {
  const [dataSource, setDataSource] = useState([]);
  const y = 500;
  const [vt] = useVT(() => {
    return {
      scroll: { y },
      debug: true,
    };
  });

  let tempDataSource: any[] = [];
  for (let i = 0; i < 100; i++) {
    tempDataSource.push({
      company_name: `aaa${i}`,
      key: i,
    });
  }

  useEffect(() => {
    setTimeout(() => {
      setDataSource(tempDataSource);
    }, 5000);
  }, []);


  const columns = [
    {
      title: "No.",
      key: "id",
      render(text: any, record: any, index: any) {
        return index + 1;
      },
      width: 100
    },
    {
      title: "company name",
      dataIndex: "company_name",
      width: 200
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      scroll={{ y }}
      components={vt}
    />
  );
}