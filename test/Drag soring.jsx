import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Table } from 'antd';
import { DndProvider, useDrag, useDrop, createDndContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import { useVT } from 'virtualizedtableforantd';


const RNDContext = createDndContext(HTML5Backend);

const type = 'DragableBodyRow';


/**
 * must use `React.forwardRef` to create your custom component, and don't forget to use `ref`.
 */
const DragableBodyRow = React.forwardRef((props, ref) => {

  const { index, moveRow, className, style, ...restProps } = props as any;


  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: type,
    collect: monitor => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
      };
    },
    drop: item => {
      moveRow((item as any).index, index);
    },
  });

  const [, drag] = useDrag({
    item: { type, index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    drop(drag((ref as any).current));
  }, []);
  

  return (
    <tr
      ref={ref}
      className={`${className}${isOver ? dropClassName : ''}`}
      style={{ cursor: 'move', ...style }}
      {...restProps}
    />
  );

});

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
  },
];

const DragSortingTable: React.FC = () => {
  const [data, setData] = useState([
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sidney No. 1 Lake Park',
    },
  ]);


  const moveRow = useCallback(
    (dragIndex, hoverIndex) => {
      const dragRow = data[dragIndex];
      setData(
        update(data, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRow],
          ],
        }),
      );
    },
    [data],
  );

  const manager = useRef(RNDContext);

  /************************/
  const [vt, setVT] = useVT<any>(() => {
    return {
      scroll: { y: 500 },
    }
  });

  useMemo(() => setVT({
    body: {
      row: DragableBodyRow,
    },
  }), []);
  /************************/

  return (
    <DndProvider manager={manager.current.dragDropManager}>
      <Table
        columns={columns}
        dataSource={data}
        components={vt}
        scroll={{ y: 500 }}
        onRow={(record, index) => ({
          index,
          moveRow,
        })}
      />
    </DndProvider>
  );
};

export default DragSortingTable;
