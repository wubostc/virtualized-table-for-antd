
/*
The MIT License (MIT)

Copyright (c) 2019 wubooo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/


import * as React from "react";
import { TableComponents } from "antd/lib/table/interface";

interface obj extends Object {
  [field: string]: any;
}

interface vt_ctx {
  head: number;
  tail: number;
  fixed: e_fixed;
  user_context?: obj;
}

export
interface vt_opts {
  id: number;
  height: number;
  overscanRowCount?: number;
  VTWrapperRender?: (head: number, tail: number, children: any[], restProps: obj) => JSX.Element;
  reflection?: string[] | string;
  changedBits?: (prev: vt_ctx, next: vt_ctx) => number;

  onScroll?: ({ left, top }: { top: number, left: number }) => void;
  destory?: boolean; // default false
  debug?: boolean;
}


enum e_vt_state {
  INIT,
  LOADED,
  RUNNING,
  CACHE
}

enum e_fixed {
  NEITHER,
  L,
  R
}

interface storeValue extends vt_opts {
  components: {
    table: React.ReactType,
    wrapper: React.ReactType,
    row: React.ReactType
  };
  computed_h: number;
  load_the_trs_once: e_vt_state;
  possible_hight_per_tr: number;
  re_computed: number;
  row_height: number[];
  row_count: number;
  wrap_inst: React.RefObject<HTMLDivElement>;
  context: React.Context<vt_ctx>;

  VTScroll?: (param?: { top: number, left: number }) => void | { top: number, left: number };
  VTRefresh?: () => void;

  lptr: any; // pointer to VT
  rptr: any; // pointer to VT
}

const store: Map<number, storeValue> = new Map();

export
enum excellent_observer {
  update_self = 0x0001,
  skip = 0x0001 << 1
}

class VT_CONTEXT {

// using closure
public static Switch(ID: number) {

const values = store.get(ID);

const S = React.createContext<vt_ctx>({ head: 0, tail: 0, fixed: -1 }, (prev, next) => {
  const ccb = store.get(ID).changedBits;
  if (ccb) {
    return ccb(prev, next);
  }

  if (prev.head !== next.head || prev.tail !== next.tail) {
    return excellent_observer.update_self | excellent_observer.skip;
  }

  return excellent_observer.skip;
});



type VTRowProps = {
  children: any[]
};

function update_wrap_style(warp: HTMLDivElement, h: number) {
  warp.style.height = `${h}px`;
  warp.style.maxHeight = `${h}px`;
}

class VTRow extends React.Component<VTRowProps> {

  private inst: React.RefObject<HTMLTableRowElement>;
  private fixed: e_fixed;

  public constructor(props: VTRowProps, context: any) {
    super(props, context);
    this.inst = React.createRef();

    this.fixed = -1;

  }

  public render() {
    const { children, ...restProps } = this.props;
    return (
      <S.Consumer>
        {
          ({ fixed }) => {
            if (this.fixed < 0) this.fixed = fixed;
            return <tr {...restProps} ref={this.inst}>{children}</tr>;
          }
        }
      </S.Consumer>
    )
  }

  public componentDidMount() {
    if (this.fixed !== e_fixed.NEITHER) return;

    this.collect_h_tr(this.props.children[0]!.props!.index, this.inst.current.offsetHeight);

    if (values.load_the_trs_once === e_vt_state.INIT) values.load_the_trs_once = e_vt_state.LOADED;
  }

  public shouldComponentUpdate(nextProps: VTRowProps, nextState: any) {
    return true;
  }

  public componentDidUpdate() {
    if (this.fixed !== e_fixed.NEITHER) return;

    this.collect_h_tr(this.props.children[0]!.props!.index, this.inst.current.offsetHeight);
  }

  private collect_h_tr(idx: number, val: number) {
    if (val === 0) {
      if (values.debug) {
        console.error(`[${ID}] the height of the tr can't be 0`);
      }
      return;
    }

    const { computed_h = 0, row_height = [], re_computed, } = values;
    
    let _computed_h = computed_h;
    if (values.possible_hight_per_tr === -1) {
      /* only call once */
      values.possible_hight_per_tr = val;
    }


    if (re_computed === 0) {
      if (row_height[idx]) {
        _computed_h += (val - row_height[idx]); // calculate diff
      } else {
        _computed_h = _computed_h - values.possible_hight_per_tr + val; // replace by real value
      }
      
    }

    // assignment
    row_height[idx] = val;


    if (values.computed_h !== _computed_h && values.load_the_trs_once !== e_vt_state.INIT) {
      update_wrap_style(values.wrap_inst.current, _computed_h);

      // update to ColumnProps.fixed synchronously
      const l = store.get(0 - ID), r = store.get((1 << 31) + ID);
      if (l) update_wrap_style(store.get(0 - ID).wrap_inst.current, _computed_h);
      if (r) update_wrap_style(store.get((1 << 31) + ID).wrap_inst.current, _computed_h);
    }
    values.computed_h = _computed_h;
    values.row_height = row_height;
  }
}


type VTWrapperProps = {
  children: any[];
};


class VTWrapper extends React.Component<VTWrapperProps> {

  private cnt: number;
  private VTWrapperRender?: storeValue["VTWrapperRender"];

  private fixed: e_fixed;

  public constructor(props: VTWrapperProps, context: any) {
    super(props, context);
    this.cnt = 0;

    this.VTWrapperRender = store.get(ID).VTWrapperRender;
    const p: any = window;
    p["&REACT_DEBUG"] && p[`&REACT_HOOKS${p["&REACT_DEBUG"]}`][15] && (this.VTWrapperRender = (...args) => <tbody {...args[3]}>{args[2]}</tbody>);

    this.fixed = -1;
  }

  public render() {
    const { children, ...restProps } = this.props;
    return (
      <S.Consumer unstable_observedBits={excellent_observer.update_self}>
        {
          ({ head, tail, fixed }) => {
            
            if (this.fixed < 0) this.fixed = fixed;

            if ((this.cnt !== children.length) && (fixed === e_fixed.NEITHER)) {
              this.set_tr_cnt(children.length);
              this.cnt = children.length;
            }

            if (this.VTWrapperRender) {
              return this.VTWrapperRender(head, tail, children, restProps);
            }

            return <tbody {...restProps}>{children.slice(head, tail)}</tbody>;
          }
        }
      </S.Consumer>
    );
  }

  public componentDidMount() {
    if (this.fixed !== e_fixed.NEITHER) return;

    this.predict_height();
  }

  public componentDidUpdate() {
    if (this.fixed !== e_fixed.NEITHER) return;

    this.predict_height();
  }

  public shouldComponentUpdate(nextProps: VTWrapperProps, nextState: unknown) {
    return true;
  }

  public predict_height() {

    const possible_hight_per_tr = values.possible_hight_per_tr;

    if (values.load_the_trs_once === e_vt_state.INIT) return;

    let { computed_h = 0, re_computed, } = values;
    const row_count = values.row_count;
    const row_height = values.row_height;

    /* predicted height */
    if (re_computed < 0) {
      for (let i = row_count; re_computed < 0; ++i, ++re_computed) {
        computed_h -= (row_height[i] || possible_hight_per_tr);
      }
    } else if (re_computed > 0) {
      for (let i = row_count - 1; re_computed > 0; --i, --re_computed) {
        computed_h += (row_height[i] || possible_hight_per_tr);
      }
    }

    values.computed_h = computed_h;


  }

  private set_tr_cnt(n: number) {

    const row_count = values.row_count || 0;
    let re_computed; // 0: no need to recalculate, > 0: add, < 0 subtract

    re_computed = n - row_count;


    // writeback
    values.row_count = n;
    values.re_computed = re_computed;
  }

}



type VTProps = {
  children: any[];
  style: React.CSSProperties;
};

class VT extends React.Component<VTProps> {

  private inst: React.RefObject<HTMLTableElement>;
  private wrap_inst: React.RefObject<HTMLDivElement>;
  private scrollTop: number;
  private scrollLeft: number;
  // private timestamp: number;
  private scoll_snapshot: boolean;

  private fixed: e_fixed;

  public state: {
    top: number;
    head: number;
    tail: number;
  };


  private user_context: any;

  public constructor(props: VTProps, context: any) {
    super(props, context);
    this.inst = React.createRef();
    this.wrap_inst = React.createRef();
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.scoll_snapshot = false;
    this.state = {
      top: 0,
      head: 0,
      tail: 1,
    };

    const fixed = this.props.children[0].props.fixed;
    if (fixed === "left") {
      this.fixed = e_fixed.L;
      store.set(0 - ID, { lptr: this } as storeValue);
    } else if (fixed === "right") {
      this.fixed = e_fixed.R;
      store.set((1 << 31) + ID, { rptr: this } as storeValue);
    } else {
      this.fixed = e_fixed.NEITHER;
    }



    if (this.fixed === e_fixed.NEITHER) {
      // hooks event
      this.scrollHook = this.scrollHook.bind(this);



      if (values.load_the_trs_once !== e_vt_state.CACHE) {
        values.possible_hight_per_tr = -1;
        values.computed_h = 0;
        values.re_computed = 0;
      }
      values.VTRefresh = this.refresh.bind(this);
      values.VTScroll = this.scroll.bind(this);
      values.load_the_trs_once = e_vt_state.INIT;
    }


    this.user_context = {};



    let reflection = values.reflection || [];
    if (typeof reflection === "string") {
      reflection = [reflection];
    }

    const bereflected = this.props as any;

    for (const field of reflection) {
      this.user_context[field] = bereflected[field];
    }


  }

  public render() {
    const { head, tail, top } = this.state;
    // const { computed_h } = store.get(this.id);

    const { style, children, ...rest } = this.props;
    const _style: React.CSSProperties = { ...style, position: "absolute", top };

    return (
      <div
        ref={this.wrap_inst}
        style={{ position: "relative", transform: "matrix(1, 0, 0, 1, 0, 0)" }}
      >
        <table {...rest} ref={this.inst} style={_style}>
          <S.Provider value={{ tail, head, fixed: this.fixed, ...this.user_context }}>{children}</S.Provider>
        </table>
      </div>
    );

  }

  public componentDidMount() {
    
    switch (this.fixed) {
      case e_fixed.L:
        this.wrap_inst.current.setAttribute("vt-left", `[${ID}]`);
        store.get(0 - ID).wrap_inst = this.wrap_inst;
        update_wrap_style(this.wrap_inst.current, values.computed_h);
        break;

      case e_fixed.R:
        this.wrap_inst.current.setAttribute("vt-right", `[${ID}]`);
        store.get((1 << 31) + ID).wrap_inst = this.wrap_inst;
        update_wrap_style(this.wrap_inst.current, values.computed_h);
        break;

      default:
        this.wrap_inst.current.setAttribute("vt", `[${ID}] vt is works!`);
        this.wrap_inst.current.parentElement.onscroll = this.scrollHook;
        values.wrap_inst = this.wrap_inst;
        values.re_computed = 0;
        update_wrap_style(values.wrap_inst.current, values.computed_h);
        break;
    }

    if (this.props.children[2].props.children.length) {
      // simulate a event scroll once
      if (this.scoll_snapshot) {
        this.scrollHook({ target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft } });
      } else {
        this.scrollHook({ target: { scrollTop: 0, scrollLeft: 0 } });
      }
    }

  }

  public componentDidUpdate() {

    if (this.fixed === e_fixed.L) {
      return update_wrap_style(store.get(0 - ID).wrap_inst.current, values.computed_h);
    } else if (this.fixed === e_fixed.R) {
      return update_wrap_style(store.get((1 << 31) + ID).wrap_inst.current, values.computed_h);
    }

    update_wrap_style(values.wrap_inst.current, values.computed_h);

    if (values.load_the_trs_once === e_vt_state.INIT) {
      return;
    }

    if (this.scoll_snapshot) {
      // this.scoll_snapshot = false;
      values.load_the_trs_once = e_vt_state.RUNNING;
      values.re_computed = 0;
      this.scrollHook({ target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft } });
      return;
    }


    if (values.load_the_trs_once === e_vt_state.LOADED) {
      values.load_the_trs_once = e_vt_state.RUNNING;

      // force update for initialization
      this.scrollHook({ target: { scrollTop: 0, scrollLeft: 0 } });

    }
    
    if (values.re_computed !== 0) { // rerender
      
      values.re_computed = 0;
      this.scrollHook({ target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft } });
    }

  }

  public componentWillUnmount() {
    // store.delete(this.id);
    if (values.destory) {
      store.delete(ID);
      store.delete(0 - ID);        // fixed left
      store.delete((1 << 31) + ID);// fixed right
    } else {
      values.load_the_trs_once = e_vt_state.CACHE;
    }
    this.setState = (...args) => null;
  }

  public shouldComponentUpdate(nextProps: VTProps, nextState: any) {
    return true;
  }

  private scroll_with_computed(top: number, left: number) {

    const { row_height, row_count, height, possible_hight_per_tr, overscanRowCount = 1, } = values;

    let overscan = overscanRowCount;

    let accumulate_top = 0, i = 0;
    for (; i < row_count; ++i) {
      if (accumulate_top > top) break;
      accumulate_top += (row_height[i] || possible_hight_per_tr);
    }

    if (i > 0) {
      do {
        accumulate_top -= (row_height[--i] || possible_hight_per_tr);
      } while (overscan-- && i);
    }

    overscan = overscanRowCount * 2;

    let torender_h = 0, j = i;
    for (; j < row_count; ++j) {
      if (torender_h > height) break;
      torender_h += (row_height[j] || possible_hight_per_tr);
    }

    if (j < row_count) {
      do {
        torender_h += (row_height[j++] || possible_hight_per_tr);
      } while ((--overscan > 0) && (j < row_count));
    }

    return [0 | i, 0 | j, 0 | accumulate_top];
  }

  public refresh() {
    const [head, tail, top] = this.scroll_with_computed(this.scrollTop, this.scrollLeft);
    this.setState({ top, head, tail });
  }


  private scrollHook(e: any) {

    const { scrollTop, scrollLeft } = e.target;

    requestAnimationFrame((timestamp) => {

      cancelAnimationFrame(timestamp);



      if (values.onScroll) {
        const top = values.wrap_inst.current.parentElement.scrollTop;
        const left = values.wrap_inst.current.parentElement.scrollLeft;
        values.onScroll({ top, left });
      }

      // console.info(timestamp - this.timestamp);

      // if (timestamp - this.timestamp < 16.7) {
      //   //
      // }

      const [head, tail, top] = this.scroll_with_computed(
                                  this.scoll_snapshot ? this.scrollTop : scrollTop,
                                  this.scoll_snapshot ? this.scrollLeft : scrollLeft
                                );

      const prev_head = this.state.head,
            prev_tail = this.state.tail,
            prev_top = this.state.top;
  
      if (head === prev_head && tail === prev_tail && top === prev_top) return;
  

      if (this.scoll_snapshot) {
        this.scoll_snapshot = false;
        this.setState({ top, head, tail }, () => {
          // use this.scrollTop & scrollLeft as params directly, 
          // because it wouldn't be changed until this.scoll_snapshot is false,
          // and you should to know js closure.
          values.wrap_inst.current.parentElement.scrollTo(this.scrollLeft, this.scrollTop);

          // update to ColumnProps.fixed synchronously
          const l = store.get(0 - ID), r = store.get((1 << 31) + ID);
          if (l) l.wrap_inst.current.parentElement.scrollTo(this.scrollLeft, this.scrollTop);
          if (r) r.wrap_inst.current.parentElement.scrollTo(this.scrollLeft, this.scrollTop);
        });

        // update to ColumnProps.fixed synchronously
        const l = store.get(0 - ID), r = store.get((1 << 31) + ID);
        if (l) l.lptr.setState({ top, head, tail });
        if (r) r.rptr.setState({ top, head, tail });
      } else {
        this.scrollLeft = scrollLeft;
        this.scrollTop = scrollTop;
        this.setState({ top, head, tail });

        // update to ColumnProps.fixed synchronously
        const l = store.get(0 - ID), r = store.get((1 << 31) + ID);
        if (l) l.lptr.setState({ top, head, tail });
        if (r) r.rptr.setState({ top, head, tail });
      }

      // this.timestamp = timestamp;

    });


  }

  public scroll(param?: { top: number, left: number }): void | { top: number, left: number } {
    if (param) {
      if (typeof param.top === "number") {
        this.scrollTop = param.top;
      }
      if (typeof param.left === "number") {
        this.scrollLeft = param.left;
      }
    
      this.scoll_snapshot = true;
      this.forceUpdate();

    } else {
      return { top: this.scrollTop, left: this.scrollLeft };
    }
  }



  public static Wrapper = VTWrapper;

  public static Row = VTRow;
}


return { VT, Wrapper: VTWrapper, Row: VTRow, S };

} // Switch

} // VT_CONTEXT

function ASSERT_ID(id: number) {
  console.assert(typeof id === "number" && id > 0);
}

function init(id: number) {
  const inside = store.get(id) || {} as storeValue;
  if (!inside.components) {
    store.set(id, inside);
    const { VT, Wrapper, Row, S } = VT_CONTEXT.Switch(id);
    inside.components = { table: VT, wrapper: Wrapper, row: Row };
    inside.context = S;
    inside.load_the_trs_once = e_vt_state.INIT;
  }
  return inside;
}



export
function VTComponents(vt_opts: vt_opts): TableComponents {

  ASSERT_ID(vt_opts.id);
  console.assert(typeof vt_opts.height === "number" && vt_opts.height >= 0);

  const inside = init(vt_opts.id);


  Object.assign(inside, vt_opts);


  if (inside.debug) {
    console.log(`[${vt_opts.id}] vt: `, inside);
    if (store.has(0 - vt_opts.id))
      console.log(`[${vt_opts.id}] vt-fixedleft: `, store.get(0 - vt_opts.id));
    if (store.has((1 << 31) + vt_opts.id))
      console.log(`[${vt_opts.id}] vt-fixedright: `, store.get((1 << 31) + vt_opts.id));
  }

  return {
    table: inside.components.table,
    body: {
      wrapper: inside.components.wrapper,
      row: inside.components.row
    }
  };
}

export
function getVTContext(id: number) {
  ASSERT_ID(id);
  return init(id).context;
}

export
function getVTComponents(id: number) {
  ASSERT_ID(id);
  return init(id).components;
}

export
function VTScroll(id: number, param?: { top: number, left: number }) {
  ASSERT_ID(id);
  return store.get(id).VTScroll(param);
}

export
function VTRefresh(id: number) {
  ASSERT_ID(id);
  store.get(id).VTRefresh();
}
