
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
  CACHE
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

  VTScroll?: (param?: { top: number, left: number }) => void | { top: number, left: number };
  VTRefresh?: () => void;

  lptr: any; // pointer to VT
  rptr: any; // pointer to VT
}

const store: Map<number, storeValue> = new Map();

const SCROLLEVT_NULL       = (0<<0);
const SCROLLEVT_INIT       = (1<<0)
const SCROLLEVT_RECOMPUTE  = (1<<1);
const SCROLLEVT_RESTORETO  = (1<<2);
const SCROLLEVT_NATIVE     = (1<<3);
const SCROLLEVT_MASK       = (0x7); // The mask exclueds native event.
const SCROLLEVT_BARRIER    = (1<<4); // It only for INIT, RECOMPUTE and RESTORETO.


class VT_CONTEXT {

// using closure
public static Switch(ID: number) {

const values = store.get(ID);

const S = React.createContext<vt_ctx>({ head: 0, tail: 0, fixed: -1 });


type VTRowProps = {
  children: any[]
};

function update_wrap_style(warp: HTMLDivElement, h: number, w?: number) {
  warp.style.height = `${h < 0 ? 0 : h}px`;
  warp.style.maxHeight = `${h < 0 ? 0 : h}px`;
  // if (w) warp.style.width = `${w}px`;
}

function log_debug(val: storeValue & obj) {
  if (val.debug) {
    val = { ...val };
    const ts = new Date().getTime();
    console.debug(`[${val.id}][${ts}] render vt`, val);
    if (store.has(0 - val.id))
      console.debug(`[${val.id}][${ts}] render vt-fixedleft`, store.get(0 - val.id));
    if (store.has((1 << 31) + val.id))
      console.debug(`[${val.id}][${ts}] render vt-fixedright`, store.get((1 << 31) + val.id));
  }
}

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

    const { computed_h = 0, row_height = [] } = values;
    
    let _computed_h = computed_h;
    if (values.possible_hight_per_tr === -1) {
      /* only call once */
      values.possible_hight_per_tr = val;
    }


    if (row_height[idx]) {
      _computed_h += (val - row_height[idx]); // calculate diff
    } else {
      _computed_h = _computed_h - values.possible_hight_per_tr + val; // replace by real value
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

  public shouldComponentUpdate(nextProps: VTWrapperProps, nextState: any) {
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
        if (!row_height[i]) {
          row_height[i] = possible_hight_per_tr;
        }
        computed_h -= row_height[i];
      }
    } else if (re_computed > 0) {
      for (let i = row_count - 1; re_computed > 0; --i, --re_computed) {
        if (!row_height[i]) {
          row_height[i] = possible_hight_per_tr;
        }
        computed_h += row_height[i];
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
  private guard_lock: 1 | 0;
  private fixed: e_fixed;


  private user_context: obj;


  private fast_consolidation_event: { top: number, left: number, flags: number };
  private delay_events: Array<{ target: { scrollTop: number, scrollLeft: number }, flags?: number } & Event>;
  private throttling: number;
  private restoring: boolean;

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



    for (let i = 0; i < reflection.length; ++i) {
      this.user_context[reflection[i]] = this.props[reflection[i]];
    }


    this.guard_lock = 0;

    this.delay_events = [];
    this.fast_consolidation_event = { top: 0, left: 0, flags: SCROLLEVT_NULL };
    this.update_self = this.update_self.bind(this);
    this.throttling = 0;
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
      // set state of vt on didMount if it has children.
      values.load_the_trs_once = e_vt_state.RUNNING;

      // simulate a event scroll once
      if (this.fast_consolidation_event.flags & SCROLLEVT_RESTORETO) {
        this.scrollHook({
          target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft },
          flags: SCROLLEVT_INIT & SCROLLEVT_RESTORETO,
        });
      } else {
        this.scrollHook({
          target: { scrollTop: 0, scrollLeft: 0 },
          flags: SCROLLEVT_INIT,
        });
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

  private scroll_with_computed(top: number) {

    const { row_height, row_count, height, possible_hight_per_tr, overscanRowCount } = values;

    let overscan = overscanRowCount;

    const offsetHeight = this.wrap_inst.current.parentElement.offsetHeight;

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
      if (torender_h > (height || offsetHeight)) break;
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
    let skip = 0;
    const de = this.delay_events;
    if (e) {
      if (e.flags) {
        for (let i = 0; i < de.length; ++i) {
          // prevent repeat event for 10ms.
          if (e.flags & de[i].flags) return;

          if (!skip && de[i].flags & SCROLLEVT_MASK) skip = 1;
        }
      }
      de.push(e);
      if (skip) return;
    }

    if (e && values.debug)
    console.debug(
      `[${values.id}][scrollHook] scrollTop: %d, scrollLeft: %d`,
      e.target.scrollTop,
      e.target.scrollLeft);

    if (this.throttling === 1) return;

    if (this.guard_lock === 1) return;

    if (de.length === 0) return;

    this.throttling = 1;

    setTimeout(() => {

      let flags = SCROLLEVT_NULL;
      let cd = this.delay_events.length;
      while(cd--) {
        const c = this.delay_events.shift();

        if (c.flags) flags |= c.flags;
        else flags |= SCROLLEVT_NATIVE;

        this.fast_consolidation_event.top = c.target.scrollTop;
        this.fast_consolidation_event.left = c.target.scrollLeft;

        if (flags & SCROLLEVT_MASK) break;
      }
      this.fast_consolidation_event.flags |= flags;
      if (this.fast_consolidation_event.flags & SCROLLEVT_MASK)
        this.fast_consolidation_event.flags |= SCROLLEVT_BARRIER;

      if (this.fast_consolidation_event.flags !== SCROLLEVT_NULL)
        requestAnimationFrame(this.update_self);
    }, 20);

  }

  private update_self(timestamp: number) {
    cancelAnimationFrame(timestamp);
    this.throttling = 0;

    let scrollTop = this.fast_consolidation_event.top;
    let scrollLeft = this.fast_consolidation_event.left;
    let flags = this.fast_consolidation_event.flags;

    if (values.onScroll) {
      values.onScroll({ top: scrollTop, left: scrollLeft });
    }


    const [head, tail, top] = this.scroll_with_computed(scrollTop);

    const prev_head = this.state.head,
          prev_tail = this.state.tail,
          prev_top = this.state.top;

    if (flags & SCROLLEVT_INIT) {
      log_debug(values);
      this.guard_lock = 1; // to lock.

      console.assert(scrollTop === 0 && scrollLeft === 0);

      this.setState({ top, head, tail }, () => {
        this.el_scroll_to(0, 0); // init this vtable by (0, 0).
        this.guard_lock = 0; // free lock.

        flags &= ~SCROLLEVT_INIT;
        flags &= ~SCROLLEVT_BARRIER;
        this.fast_consolidation_event.flags &= flags;

        if (this.delay_events.length) this.scrollHook(null); // comsumer the next.
      });

      // update to ColumnProps.fixed synchronously
      const l = store.get(0 - ID), r = store.get((1 << 31) + ID);
      if (l) l.lptr.setState({ top, head, tail });
      if (r) r.rptr.setState({ top, head, tail });
      return;
    }

    if (flags & SCROLLEVT_RECOMPUTE) {
      if (head === prev_head && tail === prev_tail && top === prev_top) {
        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RECOMPUTE;
        this.fast_consolidation_event.flags &= flags;
        
        if (this.delay_events.length) this.scrollHook(null); // comsumer the next.
        return;
      }
      log_debug(values);
      this.guard_lock = 1; // to lock.

      this.setState({ top, head, tail }, () => {
        this.el_scroll_to(scrollTop, scrollLeft);
        this.guard_lock = 0; // free lock.

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RECOMPUTE;
        this.fast_consolidation_event.flags &= flags;

        if (this.delay_events.length) this.scrollHook(null); // comsumer the next.
      });
      return;
    }

    if (flags & SCROLLEVT_RESTORETO) {
      if (head === prev_head && tail === prev_tail && top === prev_top) {
        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RESTORETO;
        this.fast_consolidation_event.flags &= flags;
        this.restoring = false;

        if (this.delay_events.length) this.scrollHook(null); // comsumer the next.
        return;
      }
      log_debug(values);
      this.guard_lock = 1;
      this.restoring = true;


      this.setState({ top, head, tail }, () => {
        this.el_scroll_to(scrollTop, scrollLeft);
        this.guard_lock = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RESTORETO;
        this.fast_consolidation_event.flags &= flags;

        this.restoring = false;
        if (this.delay_events.length) this.scrollHook(null); // comsumer the next.
      });

      // update to ColumnProps.fixed synchronously
      const l = store.get(0 - ID), r = store.get((1 << 31) + ID);
      if (l) l.lptr.setState({ top, head, tail });
      if (r) r.rptr.setState({ top, head, tail });

      return;
    } 
    
    if (flags & SCROLLEVT_NATIVE) {
      if (head === prev_head && tail === prev_tail && top === prev_top) {
        flags &= ~SCROLLEVT_NATIVE;
        this.fast_consolidation_event.flags &= flags;

        if (this.delay_events.length) this.scrollHook(null); // comsumer the next.
        return;
      }
      log_debug(values);
      this.guard_lock = 1;

      this.scrollLeft = scrollLeft;
      this.scrollTop = scrollTop;

      this.setState({ top, head, tail }, () => {
        this.guard_lock = 0;
        flags &= ~SCROLLEVT_NATIVE;

        this.fast_consolidation_event.flags &= flags;
        if (this.delay_events.length) this.scrollHook(null); // comsumer the next.
      });

      // update to ColumnProps.fixed synchronously
      const l = store.get(0 - ID), r = store.get((1 << 31) + ID);
      if (l) l.lptr.setState({ top, head, tail });
      if (r) r.rptr.setState({ top, head, tail });
      return;
    }
  }

  public scroll(param?: { top: number, left: number }): void | { top: number, left: number } {

    if (param) {
      if (this.restoring) return;
      this.restoring = true;

      if (typeof param.top === "number") {
        this.scrollTop = param.top;
      }
      if (typeof param.left === "number") {
        this.scrollLeft = param.left;
      }

      this.forceUpdate();
    } else {
      return { top: this.scrollTop, left: this.scrollLeft };
    }
  }

  private el_scroll_to(top: number, left: number) {
    /* use this.scrollTop & scrollLeft as params directly, 
     * because it wouldn't be changed until this.scoll_snapshot is false,
     * and you should to know js closure. */
    let el = values.wrap_inst.current.parentElement;
    /** ie */
    el.scrollTop = top;
    el.scrollLeft = left;

    // update to ColumnProps.fixed synchronously
    const l = store.get(0 - ID), r = store.get((1 << 31) + ID);
    if (l) {
      el = l.wrap_inst.current.parentElement;
      el.scrollTop = top;
      el.scrollLeft = left;
    }
    if (r) {
      el = r.wrap_inst.current.parentElement;
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
  }/* else {
    console.warn("VTComponents: it will reduce the performance when scrolling if there is no 'height' prop.");
  }*/

  const inside = init(vt_opts.id);


  Object.assign(inside, { overscanRowCount: 5 }, vt_opts);

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
