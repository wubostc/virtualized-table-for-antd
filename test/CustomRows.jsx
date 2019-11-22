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

import { VTComponents, setComponents } from '../../virtualized-table-for-antd';

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


class CustomRows extends React.Component {
  constructor(props) {
    super(props);
    setComponents(1, { body: { row: MyRow } });
    this.columns = [
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
    ];
  }


  render() {
    return (
      <Table
        components={VTComponents({ id: 1, debug: true })}
        bordered
        scroll={{ y: 500 }}
        dataSource={data}
        columns={this.columns}
        pagination={false}
      />
    );
  }
}

export default CustomRows;
