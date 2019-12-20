/* eslint-disable react/no-this-in-sfc */
/* eslint-disable no-shadow */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-param-reassign */
/* eslint-disable import/order */
/* eslint-disable react/no-access-state-in-setstate */
/* eslint-disable react/state-in-constructor */
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
import { Table } from 'antd';

import { VTComponents, setComponents } from '../../virtualized-table-for-antd';

import { DndProvider, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import update from 'immutability-helper';


/**
 * must use `React.forwardRef` to create your custom component, and don't forget to use `ref`.
 */
const MyRow = React.forwardRef((props, ref) => {
  let dragingIndex = -1;

  class BodyRow extends React.Component {
    render() {
      const { isOver, connectDragSource, connectDropTarget, moveRow, ...restProps } = this.props;
      const style = { ...restProps.style, cursor: 'move' };

      let { className } = restProps;
      if (isOver) {
        if (restProps.index > dragingIndex) {
          className += ' drop-over-downward';
        }
        if (restProps.index < dragingIndex) {
          className += ' drop-over-upward';
        }
      }

      return connectDragSource(
        connectDropTarget(<tr ref={ref} {...restProps} className={className} style={style} />),
      );
    }
  }

  const rowSource = {
    beginDrag(props) {
      dragingIndex = props.index;
      return {
        index: props.index,
      };
    },
  };

  const rowTarget = {
    drop(props, monitor) {
      const dragIndex = monitor.getItem().index;
      const hoverIndex = props.index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Time to actually perform the action
      props.moveRow(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      monitor.getItem().index = hoverIndex;
    },
  };

  const DragableBodyRow = DropTarget('row', rowTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
  }))(
    DragSource('row', rowSource, connect => ({
      connectDragSource: connect.dragSource(),
    }))(BodyRow),
  );

  return <DragableBodyRow {...props} />;
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

class DragSortingTable extends React.Component {
  state = {
    data: [
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
    ],
  };

  /**
   * --------------
   */
  // components = {
  //   body: {
  //     row: DragableBodyRow,
  //   },
  // };

  moveRow = (dragIndex, hoverIndex) => {
    const { data } = this.state;
    const dragRow = data[dragIndex];

    this.setState(
      update(this.state, {
        data: {
          $splice: [[dragIndex, 1], [hoverIndex, 0, dragRow]],
        },
      }),
    );
  };

  render() {
    /**
     * +++++++++++
     */
    setComponents(123, { body:
      {
        row: MyRow,
      },
    });


    return (
      <div id="components-table-demo-drag-sorting">
        <DndProvider backend={HTML5Backend}>
          <Table
            columns={columns}
            dataSource={this.state.data}
            components={VTComponents({ id: 123, debug: true })}
            scroll={{ y: 500 }}
            onRow={(record, index) => ({
              index,
              moveRow: this.moveRow,
            })}
          />
        </DndProvider>
      </div>
    );
  }
}

// ReactDOM.render(<DragSortingTable />, mountNode);

export default DragSortingTable;
