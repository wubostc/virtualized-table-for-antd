/**
 * copy this file to your working directory.
 */
import React, { useState} from 'react';
import { Table } from 'antd';
import { useVT } from 'virtualizedtableforantd4';




export default function Table1() {
  const initialItems = [
    { name: "Item1", description: "Description1", key: 1 },
    { name: "Item2", description: "Description2", key: 2 },
    { name: "Item3", description: "Description3", key: 3 },
    { name: "Item4", description: "Description4", key: 4 }
  ];
  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Description", dataIndex: "description" }
  ];

  const [items, setItems] = useState([]);

  const [vt] = useVT(() => ({ debug:true, scroll: { y: 500 } }), []);

  const addFirstTwo = () => {
    const firstTwo = [initialItems[0], initialItems[1]];
    setItems(firstTwo);
  };

  const removeAll = () => {
    setItems([]);
  };

  const addFirstFour = () => {
    const firstFour = [
      initialItems[0],
      initialItems[1],
      initialItems[2],
      initialItems[3]
    ];

    setItems(firstFour);
  };

  return (
    <div>
      <button onClick={addFirstTwo}>Add first two</button>
      <button onClick={removeAll}>Remove all</button>
      <button onClick={addFirstFour}>Add first four</button>

      <Table
        scroll={{ y: 500 }}
        columns={columns}
        components={vt}
        dataSource={items}
        size={"small"}
        pagination={false}
      />
    </div>
  );
}

