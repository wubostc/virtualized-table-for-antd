## 0.7.1
  1. improve consistency to avoid incorrect rendering.


## 0.7.0
  1. add a new Hooks API, `useVT`.
  1. fix a bug that free the same index repeatedly.(#21)


## 0.6.3~0.6.4
  1. fix some bugs.(#21)



## 0.6.2
  1. an unmounted component will not update style.
  1. fix a bug.(#25)
  1. `getComponent` has been deprecated, use `setComponent` instead(#26).
  1. adjusted log format.


## 0.6.1
  1. removed debug info `console.log` (sorry, guys~).


## 0.6.0
### this is first stable version, and the main changes are:
  1. removed `VTRefresh`.
  1. removed `height`, now it depends entirely on `scroll.y`.
  1. redesigned interface `VTScroll`.
  1. much bugs was fixed.
  1. fast, fast and more faster, with my best trying that all operations costs time about O(1).
  1. browers required support `requestAnimationFrame`.
> I suggest you to test this library carefully after installing it.


## 0.5.5
  1. improving compatibility.

## 0.5.4
  1. fix some bugs.

## 0.5.3
  1. fix `debug` bug when the param `e` is `null`.

## 0.5.2
  1. refactory `scrollHook`.

## 0.5.1
  1. refactory `scrollHook` to optimize performance.
  1. update README.md.

## 0.5.0
  1. fix the definition of `vt_ctx`.
  1. remove `VTWrapperRender` option.
  1. remove `changedBits` option.
  1. more friendly reading format for this file.
  1. `debug` can shows `scrollTop`.


## 0.4.0
  1. { debug: true, ... } to see more debugging details.
  2. fix VTScroll bug.
  3. using render-lock, VT can now renders stably.
  4. improved throttling.
  5. fix some problems in TS 3.5.
  6. the default value of vt_opts.overscanRowCount is now 5.


## 0.4.0-beta.2
  1. show the warning when you don't have 'height' as a field in the vt_opts.
  2. add throttling to optimize scrolling.
  3. change the styles ([#9](https://github.com/wubostc/virtualized-table-for-antd/issues/9 "Style Error"))


## 0.4.0-beta.1
  1. support for the opt ColumnProps.fixed ([#5](https://github.com/wubostc/virtualized-table-for-antd/issues/5 "不支持 fixed"))
  2. support for the fixed lists.
  3. compatible with ie9-11.


## 0.3.4
  1. fix VTScroll bug.


## 0.3.1
  1. fix minor style bug that using offsetHeight instead of clientHeight ([#2](https://github.com/wubostc/virtualized-table-for-antd/issues/2 "offsetHeight instead of clientHeight"))


## 0.3.0
  1. optimize the program logic
  2. add debug feature


## 0.2.1 (ignored)


## 0.2.0
  1. removed two interfaces in vt_opts ( VTScroll and VTRefresh)


## 0.1.0
  1. by default, CACHE is enable, , set the prop destory to control whether the component is destroyed when it is uninstalled


## 0.0.9
  1. rewrite const enum to enum


## 0.0.8
  1. the interface vt_opts no longer requires too many params


## 0.0.7
  1. now, the func VTScroll can correct restores last scroll state of antd table


## 0.0.6
  1. add new API VTScroll (overload+2)
  ```typescript

  class MyComponent extends React.Component {
      ...
      render() {
          <Table
              ...
              scroll={{ y }}
              components={VTComponents({ id: 1000, height: 500 })}
          />
      }

      componentDitMount() {
          VTScroll(1000, { top: 200 }) // to set
          const { top, left } = VTScroll(1000); // to get
      }
  }

  ```
  2. add new API onScroll of the scroll event
  ```typescript
  <Table
      ...
      scroll={{ y }}
      components={
          VTComponents({ id: 1000, height: y, onScoll: ({ left, top }) => console.log(left, top) })}
  />
  ```


## 0.0.5
  1. add new API VTRefresh
  ```typescript
  export declare function VTRefresh(id: number): void;
  ```
  <del>2. remove the func shouldComponentUpdate of VTWrapper</del>
  <del>3. remove the func shouldComponentUpdate of VTRow</del>


## 0.0.4
  1. Solve the initial rendering bug. ([#1](https://github.com/wubostc/virtualized-table-for-antd/issues/1 "能有个完整的demo吗"))
  2. Update the README.md


## 0.0.3
  1. Added missing type.
  ```typescript
  function VTComponents(vt_opts: vt_opts): TableComponents
  ```
  2. Some bugs fixed.


## 0.0.1 ~ 0.0.2
  1. init ver.
