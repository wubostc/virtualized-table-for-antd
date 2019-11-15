
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
  destroy?: boolean; // default false
  debug?: boolean;
}

/**
 * `INIT` -> `LOADED` -> `RUNNING` <-> `SUSPENDED`
 *  */
enum e_vt_state {
  INIT       = 1,
  LOADED     = 2,
  RUNNING    = 4,
  SUSPENDED  = 8,
}

/**
 * `L`: fixed: "left", `R`: fixed: "right"
 */
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
  
  /* 0: needn't to recalculate, > 0: to add, < 0 to subtract */
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

  HND_PAINT: number;      // a handle for Batch Repainting.
  PAINT_ADD: Map<number/* index */, HTMLTableRowElement>;
  PAINT_SADD: Map<number/* shadow index */, number/* height */>;
  PAINT_FREE: Set<number/* index */>;
  PAINT_SFREE: Set<number/* index */>;

  /* stores [begin, end], `INIT`: [-1, -1] */
  PSRA: number[]; // represents the Previous Shadow-Rows Above `trs`.
  PSRB: number[]; // represents the Previous Shadow-Rows Below `trs`.

  _keys2free: Set<string/* key */>;
  _keys2insert: number/* indexex */;
  _prev_keys: Set<string/* key */>; /* stores a Set of keys of the previous rendering,
                            * and default is null. */
  _prev_row_count: number;
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
const SCROLLEVT_BARRIER    = (1<<4); // It only for `SCROLLEVT_RECOMPUTE`.
const SCROLLEVT_MASK       = SCROLLEVT_BARRIER | SCROLLEVT_RECOMPUTE;

type SimEvent = { target: { scrollTop: number, scrollLeft: number }, flags: number };

function _make_evt(ne:　Event): SimEvent {
  return {
    target: {
      scrollTop: (ne.target as any).scrollTop,
      scrollLeft: (ne.target as any).scrollLeft,
    },
    flags: SCROLLEVT_NATIVE
  };
}

/**
 * define CONSTANTs.
 */
// const MIN_FRAME = 16;

/**
 * the following functions bind the `values`.
 */
/** Shadow Rows. */
function srs_diff(
  ctx: storeValue, PSR: number[],
  begin: number, end: number, prev_begin: number, prev_end: number) {

  const { row_height, possible_hight_per_tr } = ctx;

  if (begin > prev_begin) {
    for (let i = prev_begin; i < begin; ++i) {
      repainting_with_sfree(ctx, i);
    }
  } else if (begin < prev_begin) {
    for (let i = begin; i < prev_begin; ++i) {
      repainting_with_sadd(ctx, i,
        isNaN(row_height[i]) ? possible_hight_per_tr : row_height[i]);
    }
  }

  if (end > prev_end) {
    for (let i = prev_end; i < end; ++i) {
      repainting_with_sadd(ctx, i,
        isNaN(row_height[i]) ? possible_hight_per_tr : row_height[i]);
    }
  } else if (end < prev_end) {
    for (let i = end; i < prev_end; ++i) {
      repainting_with_sfree(ctx, i);
    }
  }

  PSR[0] = begin;
  PSR[1] = end;
}
 
/** update to ColumnProps.fixed synchronously */
function _RC_fixed_setState(val: storeValue, top: number, head: number, tail: number) {
  if (val._lstoreval)
    val._lstoreval._React_ptr.setState({ top, head, tail });
  if (val._rstoreval)
    val._rstoreval._React_ptr.setState({ top, head, tail });
}


function _Update_wrap_style(val: storeValue, h: number) {
  val.wrap_inst.current.style.height = `${h}px`;
  val.wrap_inst.current.style.maxHeight = `${h}px`;
}


/** non-block, just create a macro tack, then only update once. */
function update_wrap_style(val: storeValue, h: number) {
  if (val.WH === h) return;
  val.WH = h;
  _Update_wrap_style(val, h);
  /* update the `ColumnProps.fixed` synchronously */
  if (val._lstoreval) _Update_wrap_style(val._lstoreval, h);
  if (val._rstoreval) _Update_wrap_style(val._rstoreval, h);
}


/**
 * running level: `RUNNING`.
 */
function apply_h(val: storeValue, idx: number, h: number) {
  console.assert(!isNaN(h), `failed to apply height with index ${idx}!`);

  console.log("add", idx, h);

  val.row_height[idx] = h;
  val.computed_h += h; // just do add up.
}


function free_h_tr(val: storeValue, idx: number) {
  console.log("free", idx, val.row_height[idx]);
  console.assert(!isNaN(val.row_height[idx]), `failed to free this tr[${idx}].`);
  val.computed_h -= val.row_height[idx];
}


function _repainting(val: storeValue) {
  return requestAnimationFrame(() => {
    const { PAINT_ADD, PAINT_SADD, PAINT_FREE, PAINT_SFREE } = val;
    
    log_debug(val, "START-REPAINTING");

    if (PAINT_FREE.size) {
      for (let idx of PAINT_FREE) {
        free_h_tr(val, idx);
      }
      console.assert(!isNaN(val.computed_h) && val.computed_h >= 0);
    }

    if (PAINT_SFREE.size) {
      for (let idx of PAINT_SFREE) {
        free_h_tr(val, idx);
      }
      console.assert(!isNaN(val.computed_h) && val.computed_h >= 0);
    }

    if (PAINT_ADD.size) {
      for (let [idx, el] of PAINT_ADD) {
        apply_h(val, idx, el.offsetHeight);
      }
      console.assert(!isNaN(val.computed_h) && val.computed_h >= 0);
    }

    if (PAINT_SADD.size) {
      for (let [idx, h] of PAINT_SADD) {
        apply_h(val, idx, h);
      }
      console.assert(!isNaN(val.computed_h) && val.computed_h >= 0);
    }


    // clear
    PAINT_SFREE.clear();
    PAINT_FREE.clear();
    PAINT_ADD.clear();
    PAINT_SADD.clear();

    // output to the buffer
    update_wrap_style(val, val.computed_h);

    // free this handle manually.
    val.HND_PAINT = 0;

    log_debug(val, "END-REPAINTING");
  });
}


/** non-block */
function repainting_with_add(val: storeValue, idx: number, tr: HTMLTableRowElement) {
  val.PAINT_ADD.set(idx, tr);
  if (val.HND_PAINT > 0) return;
  val.HND_PAINT = _repainting(val);
}


/** non-block */
function repainting_with_sadd(val: storeValue, idx: number, h: number) {
  val.PAINT_SADD.set(idx, h);
  if (val.HND_PAINT > 0) return;
  val.HND_PAINT = _repainting(val);
}


/** non-block */
function repainting_with_free(val: storeValue, idx: number) {
  val.PAINT_FREE.add(idx);
  if (val.HND_PAINT > 0) return;
  val.HND_PAINT = _repainting(val);
}

/** non-block */
function repainting_with_sfree(val: storeValue, idx: number) {
  val.PAINT_SFREE.add(idx);
  if (val.HND_PAINT > 0) return;
  val.HND_PAINT = _repainting(val);
}

/* overload __DIAGNOSIS__. */
function __DIAGNOSIS__(val: storeValue) {
  Object.defineProperty(val, "__DIAGNOSIS__", {
    get() {
      console.log("OoOoOoO DIAGNOSIS OoOoOoO");
      let total = 0;
      for (let i = 0; i < val.row_count; ++i) {
        total += val.row_height[i];
      }
      console.log("Verify computed_h", total);
      console.log("OoOoOoOoOoOoOOoOoOoOoOoOo");
    },
    configurable: false,
    enumerable: false,
  });
}

function log_debug(val: storeValue & obj, msg: string) {
  if (val.debug) {
    val = { ...val };
    __DIAGNOSIS__(val);
    const ts = new Date().getTime();
    console.debug(`%c[${val.id}][${ts}][${msg}] vt`, "color:#a00", val);
    if (val._lstoreval)
      console.debug(`%c[${val.id}][${ts}][${msg}] vt-fixedleft`, "color:#a00", val._lstoreval);
    if (val._rstoreval)
      console.debug(`%c[${val.id}][${ts}][${msg}] vt-fixedright`, "color:#a00", val._rstoreval);
  }
}


function set_tr_cnt(values: storeValue, n: number) {
  values.re_computed = n - values.row_count;
  values._prev_row_count = values._prev_row_count === -1 ? n : values.row_count;
  values.row_count = n;
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

    const props: any = this.props;
    const index = props.children[0]!.props!.index;

    if (values.load_the_trs_once === e_vt_state.RUNNING) {
      const key = String(props["data-row-key"]);
      if (values._keys2free.delete(key)) {
        repainting_with_free(values, index);
      }
      repainting_with_add(values, index, this.inst.current);
    } else {
      /* init context */
      console.assert(values.load_the_trs_once === e_vt_state.INIT);
      values.load_the_trs_once = e_vt_state.LOADED;
      const h = this.inst.current.offsetHeight;
      if (values.possible_hight_per_tr === -1) {
        /* assign only once */
        values.possible_hight_per_tr = h;
      }
      values.computed_h = 0; // reset initial value.
      apply_h(values, index, h);
    }
  }

  public componentDidUpdate() {
    if (this.fixed !== e_fixed.NEITHER) return;

    const index = this.props.children[0]!.props!.index;
    if (values.PAINT_FREE.size && values.PAINT_FREE.has(index)) {
      repainting_with_add(values, index, this.inst.current);
    } else {
      repainting_with_free(values, index);
      repainting_with_add(values, index, this.inst.current);
    }
  }

  public componentWillUnmount() {
    if (this.fixed !== e_fixed.NEITHER) return;
    const props: any = this.props;
    const index: number = props.children[0]!.props!.index;
    if (values._keys2insert > 0) {
      values._keys2insert--;
      // nothing to do... just return.
      return;
    }

    if (!values.PAINT_SFREE.has(index)) {
      repainting_with_free(values, index);
    }
  }

}


type VTWrapperProps = {
  children: any[];
};


class VTWrapper extends React.Component<VTWrapperProps> {

  private fixed: e_fixed;

  public constructor(props: VTWrapperProps, context: any) {
    super(props, context);

    this.fixed = e_fixed.UNKNOW;
  }

  public render() {
    const { children, ...restProps } = this.props;
    return (
      <S.Consumer>
        {
          ({ head, tail, fixed }) => {
            
            if (this.fixed < 0) this.fixed = fixed;

            let trs;
            let len = children.length;

            if ((values.row_count !== len) && (fixed === e_fixed.NEITHER)) {
              set_tr_cnt(values, len);
            }


            if (len && this.fixed === e_fixed.NEITHER) {
              let offset: number;
              if (tail > len) {
                offset = tail - len;
                tail -= offset;
                head -= offset;
                if (head < 0) head = 0;
                if (tail < 0) tail = 0;
              } else {
                offset = 0;
              }

              let {
                PSRA, PSRB,
              } = values;

              let fixed_PSRA0 = PSRA[0] - offset,
                  fixed_PSRA1 = PSRA[1] - offset;
              if (fixed_PSRA0 < 0) fixed_PSRA0 = 0;
              if (fixed_PSRA1 < 0) fixed_PSRA1 = 0;

              let fixed_PSRB0 = PSRB[0] - offset,
                  fixed_PSRB1 = PSRB[1] - offset;
              if (fixed_PSRB0 < 0) fixed_PSRB0 = 0;
              if (fixed_PSRB1 < 0) fixed_PSRB1 = 0;

              trs = [];
              let/* n2insert = 0, */n2delete = 0;
              len = values.row_count;

              let prev_len = values._prev_row_count;

              if (values.load_the_trs_once === e_vt_state.RUNNING) {
                if (values._prev_keys === null) {
                  /* init keys */
                  values._prev_keys = new Set();
                  for (let i = head; i < tail; ++i) {
                    let child = children[i];
                    trs.push(child);
                    values._prev_keys.add(child.key);
                  }
                  values._keys2free = new Set();
                  values._keys2insert = 0;
                } else if (len > prev_len) {
                  /**
                   *        the current keys of trs's       the previous keys of trs's
                   * =================================================================
                   * shadow 10                             +9
                   *        11                              10
                   *        12                              11
                   * -------head----------------------------head----------------------
                   * render 13                              12
                   *        14                              13
                   *        15                              14
                   *        16                              15
                   * -------tail----------------------------tail----------------------
                   * shadow 17                              16
                   *        18                              17
                   *                                        18
                   * =================================================================
                   * +: a new reocrd that will be inserted.
                   * NOTE: both of `head` and `tail` won't be changed.
                   */
                  console.assert(PSRA[1] === head && PSRB[0] === tail);
                  let keys = new Set<string>();
                  values._keys2insert = 0;
                  for (let i = head; i < tail; ++i) {
                    let child = children[i];
                    keys.add(child.key);
                    if (!values._prev_keys.has(child.key)) {
                      values._keys2insert++;
                      // insert a row at index `i` with height `0`.
                      values.row_height.splice(i, 0, 0);
                    }
                    trs.push(child);
                  }

                  values._prev_keys = keys;

                } else if (len < prev_len) {
                  const keys = new Set<string>();
                  values._keys2free.clear();
                  for (let i = head; i < tail; ++i) {
                    let child = children[i];
                    if (fixed_PSRA1 === head && fixed_PSRB0 === tail && // no movement occurred
                        !values._prev_keys.has(child.key))
                    {
                      // then, manually free this index befor mounting React Component.
                      values._keys2free.add(child.key);
                    }
                    trs.push(child);
                    keys.add(child.key);
                  }
                  values._prev_keys = keys;
                } else {
                  const keys = new Set<string>();
                  values._keys2free.clear();
                  for (let i = head; i < tail; ++i) {
                    let child = children[i];
                    if (fixed_PSRA1 === head && fixed_PSRB0 === tail && // no movement occurred
                       !values._prev_keys.has(child.key))
                    {
                      // then, manually free this index befor mounting React Component.
                      values._keys2free.add(child.key);
                    }
                    trs.push(child);
                    keys.add(child.key);
                  }
                  values._prev_keys = keys;
                }
              } else {
                console.assert(values.load_the_trs_once === e_vt_state.INIT)
                for (let i = head; i < tail; ++i) {
                  trs.push(children[i]);
                }
              }

              if (values.load_the_trs_once === e_vt_state.RUNNING) {

                n2delete = prev_len - len;

                // how many Shadow Rows need to be deleted.
                let SR_n2delete = 0, SR_n2insert = 0;

                /* PSR's range: [begin, end) */
                if (PSRB[0] === -1) {
                  // init Shadow Rows, just do `apply_h`.
                  srs_diff(values, PSRB, tail, len, tail, tail);
                } else {
                  if (len < prev_len) {
                    /* free some rows */
                    SR_n2delete = n2delete - (PSRB[1] - len);
                    srs_diff(values, PSRB, tail, len, fixed_PSRB0, PSRB[1]);
                  } else if (len > prev_len) {
                    /* insert some rows */
                    SR_n2insert = values._keys2insert;
                    srs_diff(values, PSRB, tail, len, PSRB[0], PSRB[1] + SR_n2insert);
                  } else {
                    srs_diff(values, PSRB, tail, len, PSRB[0], PSRB[1]);
                  }
                }

                if (PSRA[0] === -1) {
                  // init Shadow Rows, just do `apply_h`.
                  srs_diff(values, PSRA, 0, head, 0, 0);
                } else {
                  srs_diff(values, PSRA, 0, head, PSRA[0], fixed_PSRA1 + SR_n2delete);
                }

                values._prev_row_count = values.row_count;
              }
            }

            return <tbody {...restProps}>{trs}</tbody>;
          }
        }
      </S.Consumer>
    );
  }

  public shouldComponentUpdate(nextProps: VTWrapperProps, nextState: any) {
    return true;
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

      if (values.load_the_trs_once !== e_vt_state.SUSPENDED) {
        values.possible_hight_per_tr = -1;
        values.computed_h = 0;
        values.re_computed = 0;
        values.row_height = [];
        values.row_count = 0;
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

    if (this.fixed === e_fixed.NEITHER) {
      values.PAINT_ADD = new Map();
      values.PAINT_SADD = new Map();
      values.PAINT_FREE = new Set();
      values.PAINT_SFREE = new Set();
      values.HND_PAINT = 0;

      values.PSRA = [-1, -1];
      values.PSRB = [-1, -1];

      values._keys2free = null;
      values._keys2insert = 0;
      values._prev_keys = null;
      values._prev_row_count = -1;

      __DIAGNOSIS__(values);
    }

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
        this.wrap_inst.current.parentElement.onscroll = this.scrollHook.bind(this);
        _Update_wrap_style(values, values.computed_h);
        this.wrap_inst.current.setAttribute("vt", `[${ID}]`);
        break;
    }

    // 0 - head, 2 - body
    if (this.props.children[2].props.children.length) {
      // `load_the_trs_once` is changed by `VTRow`.
      console.assert(values.load_the_trs_once === e_vt_state.LOADED);

      values.load_the_trs_once = e_vt_state.RUNNING;
      this.scrollHook({
        target: { scrollTop: 0, scrollLeft: 0 },
        flags: SCROLLEVT_INIT,
      });

    } else {
      console.assert(values.load_the_trs_once === e_vt_state.INIT);
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

  }

  public componentWillUnmount() {
    if (this.fixed !== e_fixed.NEITHER) return;

    if (values.destroy) {
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
        // if (e.flags === SCROLLEVT_RECOMPUTE) {
        //   e.flags |= SCROLLEVT_BARRIER;
        // }
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
      e = _make_evt(nevq.pop());
      nevq.length = 0;
    } else {
      return;
    }

    // if (e.flags & SCROLLEVT_MASK) {
    //   if (nevq.length) {
    //     e = _make_evt(nevq.pop());
    //     nevq.length = 0;
    //   }
    // }

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
      destroy: false,
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
