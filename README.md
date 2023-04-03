# The virtualized table component for AntD4，fast, restorable and smallest size for gzip!


![npm](https://img.shields.io/npm/v/virtualizedtableforantd4)
![dm](https://img.shields.io/npm/dm/virtualizedtableforantd4)
![license](https://img.shields.io/npm/l/virtualizedtableforantd4)


[![NPM](https://nodei.co/npm/virtualizedtableforantd4.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/virtualizedtableforantd4/)

+ Install

  ```shell
  npm i --save virtualizedtableforantd4
  ```

+ the opts of `useVT`([examples](https://github.com/wubostc/virtualized-table-for-antd/blob/master/test))
    ```typescript
    interface VtOpts {
      id?: number | string;
      /**
       * @default 5
       */
      overscanRowCount?: number;

      /**
       * this only needs the scroll.y
       */
      scroll: {
          y: number | string;
      };

      /**
       * wheel event(only works on native events).
       */
      onScroll?: ({ left, top, isEnd, }:
        { top: number; left: number; isEnd: boolean }) => void;

      initTop?: number;
  
      /**
       * Offset of the table when isEnd becomes true.
       * @default 0
       */
      offset?: number;

      /**
       * @default false
       */
      debug?: boolean;


      // pass -1 means scroll to the bottom of the table
      ref?: React.MutableRefObject<{
        scrollTo: (y: number) => void;
        scrollToIndex: (idx: number) => void;
      }>
    }
    ```


+ Quick start
  > You need to change your style like following if your Table.size is not default.
  
  ```less
  // size={'small'}
  ant-table [vt] > table > .ant-table-tbody > tr > td {
      padding: 8px;
  }
  ```
  ```typescript
  import React from 'react';
  import { Table } from 'antd';
  import { useVT } from 'virtualizedtableforantd4';

  const [ vt, set_components ] = useVT(() => ({ scroll: { y: 600 } }), []);

  <Table
    scroll={{ y: 600 }} // It's important for using VT!!! DO NOT FORGET!!!
    components={vt}
    columns={/*your columns*/}
    dataSource={/*your data*/}
  />
  ```

+ Scroll to
  - [scroll-to](https://github.com/wubostc/virtualized-table-for-antd/blob/master/test/scroll-to.tsx)


+ Restoring last state

  - [reload](https://github.com/wubostc/virtualized-table-for-antd/blob/master/test/reload.tsx)


+ Editable Table

  - [CustomRows Hooks](https://github.com/wubostc/virtualized-table-for-antd/blob/master/test/CustomRows%20Hooks.jsx)
  - [Editable Rows](https://github.com/wubostc/virtualized-table-for-antd/blob/master/test/Editable%20Rows.jsx)

+ Drag soring

  - [Drag soring](https://github.com/wubostc/virtualized-table-for-antd/blob/master/test/Drag%20soring.jsx)

+ expanded rows & tree-structure
  has been well supported!

## License

[MIT](LICENSE)
