## 0.0.1 ~ 0.0.2
### init ver.

## 0.0.3
### 1. Added missing type.
```typescript
function VTComponents(vt_opts: vt_opts): TableComponents
```
### 2. Some bugs fixed.

## 0.0.4
### 1. Solve the initial rendering bug. ([#1](https://github.com/wubostc/virtualized-table-for-antd/issues/1 "能有个完整的demo吗"))

### 2. Update the README.md

## 0.0.5
### 1. add new API VTRefresh
```typescript
export declare function VTRefresh(id: number): void;
```
### <del>2. remove the func shouldComponentUpdate of VTWrapper</del>
### <del>3. remove the func shouldComponentUpdate of VTRow</del>

## 0.0.6
### 1. add new API VTScroll (overload+2)

e.g.

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

### 2. add new API onScroll of the scroll event
e.g.

```typescript

<Table
    ...
    scroll={{ y }}
    components={
        VTComponents({ id: 1000, height: y, onScoll: ({ left, top }) => console.log(left, top) })}
/>

```

## 0.0.7
### 1. now, the func VTScroll can correct restores last scroll state of antd table


## 0.0.8
### 1. the interface vt_opts no longer requires too many params

## 0.0.9
### 1. rewrite const enum to enum

## 0.1.0
### 1. by default, CACHE is enable, , set the prop destory to control whether the component is destroyed when it is uninstalled

## 0.2.0
### 1. removed two interfaces in vt_opts ( VTScroll and VTRefresh)

## 0.2.1 (ignored)

## 0.3.0
### 1. optimize the program logic
### 2. add debug feature


## 0.3.1
### 1. fix minor style bug that using offsetHeight instead of clientHeight ([#2](https://github.com/wubostc/virtualized-table-for-antd/issues/2 "offsetHeight instead of clientHeight"))



## 0.3.4
### 1. fix VTScroll bug.


## 0.4.0
### 1. support for the opt ColumnProps.fixed ([#5](https://github.com/wubostc/virtualized-table-for-antd/issues/5 "不支持 fixed"))
### 2. support for the fixed lists.
### 3. compatible with ie9-11.