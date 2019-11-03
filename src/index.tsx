
/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/


import * as React from "react";
import { TableComponents } from "antd/lib/table/interface";


const _brower = 1;
const _node = 2;
const env = typeof window === 'object' && window instanceof Window ? _brower : _node;


if (env & _brower) {
  let f: boolean = Object.hasOwnProperty.call(window, "requestAnimationFrame");
  if (!f) throw new Error("Please using the modern browers or appropriate polyfill!");
}

interface obj extends Object {
  [field: string]: any;
}

interface vt_ctx {
  head: number;
  tail: number;
  fixed: e_fixed;
  [reflection: string]: any;
}

export
interface vt_opts extends Object {
  readonly id: number;
  height?: number; // will use the Table.scroll.y if unset.
  overscanRowCount?: number; // default 5
  reflection?: string[] | string;

  onScroll?: ({ left, top }: { top: number, left: number }) => void;
  destory?: boolean; // default false
  debug?: boolean;
}


enum e_vt_state {
  INIT,
  LOADED,
  RUNNING,
  SUSPENDED
}

enum e_fixed {
  UNKNOW = -1,
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

  // return the last state.
  VTScroll?: (param?: { top: number, left: number }) => { top: number, left: number };
  VTRefresh?: () => void;

  _React_ptr: any; // pointer to the instance of `VT`.

  _lstoreval: storeValue; // fixed left.
  _rstoreval: storeValue; // fixed right.


  WH: number;      // Wrapped Height.
                   // it's the newest value of `wrap_inst`'s height to update.
  HND_WH: number;  // a handle that timeout's returns for `warp_height`.


  PAINT: Map<number/* index */, HTMLTableRowElement>;
  HND_PAINT: number;  // a handle for Batch Repainting.
}

const store: Map<number, storeValue> = new Map();

/**
 * THE EVENTS OF SCROLLING.
 */
const SCROLLEVT_NULL       = (0<<0);
const SCROLLEVT_INIT       = (1<<0);
const SCROLLEVT_RECOMPUTE  = (1<<1);
const SCROLLEVT_RESTORETO  = (1<<2);
const SCROLLEVT_NATIVE     = (1<<3);
const SCROLLEVT_MASK       = (0x7); // The mask exclueds native event.
const SCROLLEVT_BARRIER    = (1<<4); // It only for INIT, RECOMPUTE and RESTORETO.

/**
 * define CONSTANTs.
 */
const MIN_FRAME = 16;


/** update to ColumnProps.fixed synchronously */
function _RC_fixed_setState(val: storeValue, top: number, head: number, tail: number) {
  if (val._lstoreval)
    val._lstoreval._React_ptr.setState({ top, head, tail });
  if (val._rstoreval)
    val._rstoreval._React_ptr.setState({ top, head, tail });
}


/**
 * the following functions bind the `values`.
 */
function _Update_wrap_style(val: storeValue, h: number) {
  val.wrap_inst.current.style.height = `${h}px`;
  val.wrap_inst.current.style.maxHeight = `${h}px`;
}


/** non-block, just create a macro tack, then only update once. */
function update_wrap_style(val: storeValue, h: number) {
  if (val.WH === h) return;

  val.WH = h;

  if (val.HND_WH > 0) return;

  val.HND_WH = setTimeout(() => {
    const h = val.WH < 0 ? 0 : val.WH;
    _Update_wrap_style(val, h);

    /* update the `ColumnProps.fixed` synchronously */
    if (val._lstoreval) _Update_wrap_style(val._lstoreval, h);
    if (val._rstoreval) _Update_wrap_style(val._rstoreval, h);

    // free this handle.
    val.HND_WH = 0;
  }, MIN_FRAME);
}


function add_h_tr(val: storeValue, idx: number, h: number) {
  console.assert(h >= 0);

  let { computed_h, row_height } = val;

  if (val.possible_hight_per_tr === -1) {
    /* only call once */
    val.possible_hight_per_tr = h;
  }


  if (row_height[idx] >= 0) {
    computed_h += (h - row_height[idx]); // calculate diff
  } else {
    row_height[idx] = h;
    computed_h = computed_h - val.possible_hight_per_tr + h; // replace by real value
  }

  row_height[idx] = h;

  if (val.computed_h !== computed_h && val.load_the_trs_once !== e_vt_state.INIT) {
    update_wrap_style(val, computed_h);
  }

  val.computed_h = computed_h;
}


function free_h_tr(val: storeValue, idx: number) {
  console.assert(val.row_height[idx] >= 0);
  val.computed_h -= val.row_height[idx];
  if (val.computed_h < 0) val.computed_h = 0;
}


/** non-block */
function batch_repainting(val: storeValue, idx: number, tr: HTMLTableRowElement) {
  val.PAINT.set(idx, tr);

  if (val.HND_PAINT > 0) return;

  val.HND_PAINT = requestAnimationFrame(() => {
    for(let [index, el] of val.PAINT) {
      add_h_tr(val, index, el.offsetHeight);
    }
    val.PAINT = new Map();
    // free this handle manually.
    val.HND_PAINT = 0;
  });
}


function log_debug(val: storeValue & obj, msg: string) {
  if (val.debug) {
    val = { ...val };
    const ts = new Date().getTime();
    console.debug(`[${ts}][${val.id}][${msg}] render vt`, val);
    if (val._lstoreval)
      console.debug(`[${ts}][${val.id}][${msg}] render vt-fixedleft`, val._lstoreval);
    if (val._rstoreval)
      console.debug(`[${ts}][${val.id}][${msg}] render vt-fixedright`, val._rstoreval);
  }
}


function set_predict_height(values: storeValue) {

  const possible_hight_per_tr = values.possible_hight_per_tr;

  if (values.load_the_trs_once === e_vt_state.INIT) return;

  let computed_h = values.computed_h;
  let re_computed = values.re_computed ;
  const row_count = values.row_count;
  const row_height = values.row_height;

  /* predicted height */
  if (re_computed < 0) {
    for (let i = row_count; re_computed < 0; ++i, ++re_computed) {
      computed_h -= row_height[i] >= 0 ? row_height[i] : possible_hight_per_tr;
    }
    values.computed_h = computed_h;
  } else if (re_computed > 0) {
    for (let i = row_count - 1; re_computed > 0; --i, --re_computed) {
      computed_h += row_height[i] >= 0 ? row_height[i] : possible_hight_per_tr;
    }
    values.computed_h = computed_h;
  }

}


function set_tr_cnt(values: storeValue, n: number) {

  const row_count = values.row_count || 0;
  let re_computed; // 0: no need to recalculate, > 0: add, < 0 subtract

  re_computed = n - row_count;


  // writeback
  values.row_count = n;
  values.re_computed = re_computed;
}


class VT_CONTEXT {

// using closure
public static Switch(ID: number) {

const values = store.get(ID);

const S = React.createContext<vt_ctx>({ head: 0, tail: 0, fixed: -1 });


type VTRowProps = {
  children: any[]
};

class VTRow extends React.Component<VTRowProps> {

  private inst: React.RefObject<HTMLTableRowElement>;
  private fixed: e_fixed;

  public constructor(props: VTRowProps, context: any) {
    super(props, context);
    this.inst = React.createRef();

    this.fixed = e_fixed.UNKNOW;

  }

  public render() {
    const { children, ...restProps } = this.props;
    return (
      <S.Consumer>
        {
          ({ fixed }) => {
            if (this.fixed === e_fixed.UNKNOW) this.fixed = fixed;
            return <tr {...restProps} ref={this.inst}>{children}</tr>;
          }
        }
      </S.Consumer>
    )
  }

  public componentDidMount() {
    if (this.fixed !== e_fixed.NEITHER) return;

    if (values.load_the_trs_once === e_vt_state.INIT) {
      add_h_tr(values, this.props.children[0]!.props!.index, this.inst.current.offsetHeight);
      values.load_the_trs_once = e_vt_state.LOADED;
    } else {
      batch_repainting(values, this.props.children[0]!.props!.index, this.inst.current);
    }
  }

  public shouldComponentUpdate(nextProps: VTRowProps, nextState: any) {
    return true;
  }

  public componentDidUpdate() {
    if (this.fixed !== e_fixed.NEITHER) return;

    batch_repainting(values, this.props.children[0]!.props!.index, this.inst.current);
  }

  public componentWillUnmount() {
    // To prevent repainting this index of this row need not to
    // get the property "offsetHeight" if this component will unmount.
    if (this.fixed !== e_fixed.NEITHER || values.PAINT.size === 0) return;
    const idx = this.props.children[0]!.props!.index;
    free_h_tr(values, idx);
    values.PAINT.delete(idx);
  }

}


type VTWrapperProps = {
  children: any[];
};


class VTWrapper extends React.Component<VTWrapperProps> {

  private cnt: number;
  private VTWrapperRender: (...args: any[]) => JSX.Element;

  private fixed: e_fixed;

  public constructor(props: VTWrapperProps, context: any) {
    super(props, context);
    this.cnt = 0;

    this.VTWrapperRender = null;

    if (env & _brower) {
      const p: any = window;
      p["&REACT_DEBUG"] && p[`&REACT_HOOKS${p["&REACT_DEBUG"]}`][15] && (this.VTWrapperRender = (...args) => <tbody {...args[3]}>{args[2]}</tbody>);
    }

    this.fixed = e_fixed.UNKNOW;
  }

  public render() {
    const { children, ...restProps } = this.props;
    return (
      <S.Consumer>
        {
          ({ head, tail, fixed }) => {
            
            if (this.fixed < 0) this.fixed = fixed;

            if ((this.cnt !== children.length) && (fixed === e_fixed.NEITHER)) {
              set_tr_cnt(values, children.length);
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

    set_predict_height(values);
  }

  public componentDidUpdate() {
    if (this.fixed !== e_fixed.NEITHER) return;

    set_predict_height(values);
  }

  public shouldComponentUpdate(nextProps: VTWrapperProps, nextState: any) {
    return true;
  }

}



type SimEvent = { target: { scrollTop: number, scrollLeft: number }, flags: number };

type VTProps = {
  children: any[];
  style: React.CSSProperties;
} & obj;

class VT extends React.Component<VTProps, {
  top: number;
  head: number;
  tail: number;
}> {

  private inst: React.RefObject<HTMLTableElement>;
  private wrap_inst: React.RefObject<HTMLDivElement>;
  private scrollTop: number;
  private scrollLeft: number;
  private fixed: e_fixed;


  private user_context: obj;


  private event_queue: Array<SimEvent>;
  // the Native EVENT of the scrolling.
  private nevent_queue: Array<Event>;

  private restoring: boolean;

  private cached_height: number;
  private HNDID_TIMEOUT: number;

  // HandleId of requestAnimationFrame.
  private HNDID_RAF: number;

  public constructor(props: VTProps, context: any) {
    super(props, context);
    this.inst = React.createRef();
    this.wrap_inst = React.createRef();
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.restoring = false;
    this.state = {
      top: 0,
      head: 0,
      tail: 1,
    };

    const fixed = this.props.children[0].props.fixed;
    if (fixed === "left") {
      this.fixed = e_fixed.L;
      store.set(0 - ID, { _React_ptr: this } as storeValue);
    } else if (fixed === "right") {
      this.fixed = e_fixed.R;
      store.set((1 << 31) + ID, { _React_ptr: this } as storeValue);
    } else {
      this.fixed = e_fixed.NEITHER;
      values._React_ptr = this; // always set. even if it is `NEITHER`.
    }



    if (this.fixed === e_fixed.NEITHER) {
      // hooks event
      this.scrollHook = this.scrollHook.bind(this);

      if (values.load_the_trs_once !== e_vt_state.SUSPENDED) {
        values.possible_hight_per_tr = -1;
        values.computed_h = 0;
        values.re_computed = 0;
        values.row_height = [];
      }
      values.VTRefresh = this.refresh.bind(this);
      values.VTScroll = this.scroll.bind(this);
      values.load_the_trs_once = e_vt_state.INIT;

      this.user_context = {};

      let reflection = values.reflection || [];
      if (typeof reflection === "string") {
        reflection = [reflection];
      }
  
      for (let i = 0; i < reflection.length; ++i) {
        this.user_context[reflection[i]] = this.props[reflection[i]];
      }
  
      this.event_queue = [];
      this.nevent_queue = [];
      this.update_self = this.update_self.bind(this);

      this.HNDID_TIMEOUT = -1;
      this.HNDID_RAF = 0;
    }


    // init store, all of the `L` `R` and `NEITHER`.
    values.WH = 0;
    values.HND_WH = 0;
    values.PAINT = new Map();
    values.HND_PAINT = 0;
  }

  public render() {
    const { head, tail, top } = this.state;

    const { style, children, ...rest } = this.props;
    style.position = "absolute";
    style.top = top;
    const { width, ...rest_style } = style;

    return (
      <div
        ref={this.wrap_inst}
        style={{ width, position: "relative", transform: "matrix(1, 0, 0, 1, 0, 0)" }}
      >
        <table {...rest} ref={this.inst} style={rest_style}>
          <S.Provider value={{ tail, head, fixed: this.fixed, ...this.user_context }}>{children}</S.Provider>
        </table>
      </div>
    );

  }

  public componentDidMount() {
    switch (this.fixed) {
      case e_fixed.L:
        values._lstoreval = store.get(0 - ID);        // registers the `_lstoreval` at the `values`.
        values._lstoreval.wrap_inst = this.wrap_inst;
        _Update_wrap_style(values._lstoreval, values.computed_h);
        this.wrap_inst.current.setAttribute("vt-left", `[${ID}]`);
        return;

      case e_fixed.R:
        values._rstoreval = store.get((1 << 31) + ID); // registers the `_rstoreval` at the `values`.
        values._rstoreval.wrap_inst = this.wrap_inst;
        _Update_wrap_style(values._rstoreval, values.computed_h);
        this.wrap_inst.current.setAttribute("vt-right", `[${ID}]`);
        return;

      default:
        values.wrap_inst = this.wrap_inst;
        // values.re_computed = 0;
        this.wrap_inst.current.parentElement.onscroll = this.scrollHook;        
        _Update_wrap_style(values, values.computed_h);
        this.wrap_inst.current.setAttribute("vt", `[${ID}]`);
        break;
    }

    // 0 - head, 2 - body
    if (this.props.children[2].props.children.length) {
      console.assert(values.load_the_trs_once === e_vt_state.LOADED);

      values.load_the_trs_once = e_vt_state.RUNNING;
      this.scrollHook({
        target: { scrollTop: 0, scrollLeft: 0 },
        flags: SCROLLEVT_INIT,
      });
    }

  }

  public componentDidUpdate() {

    if (this.fixed !== e_fixed.NEITHER) return;

    if (values.load_the_trs_once === e_vt_state.INIT) {
      return;
    }


    if (values.load_the_trs_once === e_vt_state.LOADED) {
      values.load_the_trs_once = e_vt_state.RUNNING;

      // force update for initialization
      this.scrollHook({
        target: { scrollTop: 0, scrollLeft: 0 },
        flags: SCROLLEVT_INIT,
      });
    }

    if (values.load_the_trs_once === e_vt_state.RUNNING) {
      if (this.restoring) {
        this.restoring = false;
        this.scrollHook({
          target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft },
          flags: SCROLLEVT_RESTORETO,
        });
      }

      if (values.re_computed !== 0) { // rerender
        values.re_computed = 0;
        this.scrollHook({
          target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft },
          flags: SCROLLEVT_RECOMPUTE,
        });
      }
    }

    update_wrap_style(values, values.computed_h);
  }

  public componentWillUnmount() {
    if (this.fixed !== e_fixed.NEITHER) return;

    if (values.destory) {
      store.delete(0 - ID);        // fixed left
      store.delete((1 << 31) + ID);// fixed right
      store.delete(ID);
    } else {
      values.load_the_trs_once = e_vt_state.SUSPENDED;
    }
    this.setState = (...args) => null;
  }

  public shouldComponentUpdate(nextProps: VTProps, nextState: any) {
    return true;
  }

  private scroll_with_computed(top: number) {

    if (this.HNDID_TIMEOUT < 0) {
      this.cached_height = this.wrap_inst.current.parentElement.offsetHeight;    
    } else {
      clearTimeout(this.HNDID_TIMEOUT);
    }
    this.HNDID_TIMEOUT = setTimeout(() => {
      if (values.load_the_trs_once === e_vt_state.RUNNING)
        this.cached_height = this.wrap_inst.current.parentElement.offsetHeight;
    }, 1000);

    const {
      row_height,
      row_count,
      height = this.cached_height,
      possible_hight_per_tr,
      overscanRowCount
    } = values;

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

  /**
   * @deprecated
   */
  public refresh() {
    const [head, tail, top] = this.scroll_with_computed(this.scrollTop);
    this.setState({ top, head, tail });
  }


  private scrollHook(e: any) {
    if (e && values.debug) {
      console.debug(
        `[${values.id}][scrollHook] scrollTop: %d, scrollLeft: %d`,
        e.target.scrollTop,
        e.target.scrollLeft);
    }

    if (e) {
      if (e.flags) {
        this.event_queue.push(e);
      } else {
        this.nevent_queue.push(e);
      }
    }

    if (this.nevent_queue.length || this.event_queue.length) {
      if (this.HNDID_RAF) cancelAnimationFrame(this.HNDID_RAF);
      // requestAnimationFrame, ie >= 10
      this.HNDID_RAF = requestAnimationFrame(this.update_self);
    }
  }

  private update_self(timestamp: number) {

    const nevq = this.nevent_queue,
          evq  = this.event_queue;

    let e: SimEvent;
    // consume the `evq` first.
    if (evq.length) {
      e = evq.shift();
    } else if (nevq.length) {
      // take the last event from the `nevq`.
      let ne = nevq[nevq.length - 1];
      e = {
        target: {
          scrollTop: (ne.target as any).scrollTop,
          scrollLeft: (ne.target as any).scrollLeft,
        },
        flags: SCROLLEVT_NATIVE
      };
      nevq.length = 0;
    } else {
      return;
    }

    if (e.flags & SCROLLEVT_MASK) e.flags |= SCROLLEVT_BARRIER;

    let scrollTop = e.target.scrollTop;
    let scrollLeft = e.target.scrollLeft;
    let flags = e.flags;

    if (values.onScroll) {
      values.onScroll({ top: scrollTop, left: scrollLeft });
    }

    // checks every tr's height, so it may be take some times...
    const [head, tail, top] = this.scroll_with_computed(scrollTop);

    const prev_head = this.state.head,
          prev_tail = this.state.tail,
          prev_top = this.state.top;

    if (flags & SCROLLEVT_INIT) {
      log_debug(values, "SCROLLEVT_INIT");

      console.assert(scrollTop === 0 && scrollLeft === 0);

      this.setState({ top, head, tail }, () => {
        this.el_scroll_to(0, 0); // init this vtable by (0, 0).
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_INIT;
        flags &= ~SCROLLEVT_BARRIER;

        if (this.event_queue.length) this.scrollHook(null); // consume the next.
      });

      _RC_fixed_setState(values, top, head, tail);
      return;
    }

    if (flags & SCROLLEVT_RECOMPUTE) {
      log_debug(values, "SCROLLEVT_RECOMPUTE");

      if (head === prev_head && tail === prev_tail && top === prev_top) {
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RECOMPUTE;
        
        if (this.event_queue.length) this.scrollHook(null); // consume the next.
        return;
      }

      this.setState({ top, head, tail }, () => {
        this.el_scroll_to(scrollTop, scrollLeft);
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RECOMPUTE;

        if (this.event_queue.length) this.scrollHook(null); // consume the next.
      });

      _RC_fixed_setState(values, top, head, tail);
      return;
    }

    if (flags & SCROLLEVT_RESTORETO) {
      log_debug(values, "SCROLLEVT_RESTORETO");

      if (head === prev_head && tail === prev_tail && top === prev_top) {
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RESTORETO;
        this.restoring = false;

        if (this.event_queue.length) this.scrollHook(null); // consume the next.
        return;
      }

      this.restoring = true;


      this.setState({ top, head, tail }, () => {
        this.el_scroll_to(scrollTop, scrollLeft);
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RESTORETO;

        this.restoring = false;
        if (this.event_queue.length) this.scrollHook(null); // consume the next.
      });

      _RC_fixed_setState(values, top, head, tail);
      return;
    } 
    
    if (flags & SCROLLEVT_NATIVE) {
      log_debug(values, "SCROLLEVT_NATIVE");

      if (head === prev_head && tail === prev_tail && top === prev_top) {
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_NATIVE;
        return;
      }

      this.scrollLeft = scrollLeft;
      this.scrollTop = scrollTop;

      this.setState({ top, head, tail }, () => {
        this.HNDID_RAF = 0;
        flags &= ~SCROLLEVT_NATIVE;
      });

      _RC_fixed_setState(values, top, head, tail);
      return;
    }
  }

  // returns the last state.
  public scroll(param?: { top: number, left: number }): { top: number, left: number } {

    if (param) {
      if (this.restoring) {
        return {
          top: this.scrollTop,
          left: this.scrollLeft,
        };
      }

      const lst_top = this.scrollTop;
      const lst_left = this.scrollLeft;

      this.restoring = true;

      if (typeof param.top === "number") {
        this.scrollTop = param.top;
      }
      if (typeof param.left === "number") {
        this.scrollLeft = param.left;
      }

      this.forceUpdate();

      return {
        top: lst_top,
        left: lst_left,
      };
    } else {
      return { top: this.scrollTop, left: this.scrollLeft };
    }
  }

  private el_scroll_to(top: number, left: number) {

    let el = values.wrap_inst.current.parentElement;
    /** ie */
    el.scrollTop = top;
    el.scrollLeft = left;

    if (values._lstoreval) {
      el = values._lstoreval.wrap_inst.current.parentElement;
      el.scrollTop = top;
      el.scrollLeft = left;
    }
    if (values._rstoreval) {
      el = values._rstoreval.wrap_inst.current.parentElement;
      el.scrollTop = top;
      el.scrollLeft = left;
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

  if (Object.hasOwnProperty.call(vt_opts, "height")) {
    console.assert(typeof vt_opts.height === "number" && vt_opts.height >= 0);
  }

  const inside = init(vt_opts.id);


  Object.assign(
    inside,
    {
      overscanRowCount: 5,
      debug: false,
      destory: false,
    } as storeValue,
    vt_opts);

  if (vt_opts.debug) {
    console.debug(`[${vt_opts.id}] calling VTComponents with`, vt_opts);
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
  console.warn('VTRefresh will be deprecated in next release version.');
  ASSERT_ID(id);
  store.get(id).VTRefresh();
}
