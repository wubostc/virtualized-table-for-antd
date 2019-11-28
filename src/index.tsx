
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
  overscanRowCount?: number; // default 5
  reflection?: string[] | string;

  onScroll?: ({ left, top }: { top: number, left: number }) => void;
  destroy?: boolean; // default false
  debug?: boolean;
}

/**
 * `INIT` -> `LOADED` -> `RUNNING` -> `SUSPENDED`
 * `SUSPENDED` -> `WAITING` -> `RUNNING`
 *  */
enum e_vt_state {
  INIT       = 1,
  LOADED     = 2,
  RUNNING    = 4,
  SUSPENDED  = 8,
  WAITING    = 16,
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
  _y: number; // will use the Table.scroll.y.
  _raw_y: number | string;

  _vtcomponents: TableComponents; // virtual layer.
  components: TableComponents;    // implementation layer.
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

  _React_ptr: any; // pointer to the instance of `VT`.

  _lvt_ctx: storeValue; // fixed left.
  _rvt_ctx: storeValue; // fixed right.


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
  prev_row_count: number;

  // persistent stroage index when switch `RUNNING` to `SUSPENDED`.
  _index_persister: Set<number/* */>;
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
 * Implementation Layer.
 */
/** AntD.TableComponent.table */
const Table = React.forwardRef(function Table(props: any, ref) {
  const { style, children, ...rest } = props;
  return <table ref={ref} style={style} {...rest}>{children}</table>;
});
/** AntD.TableComponent.body.wrapper */
function Wrapper(props: any) {
  const { children, ...rest } = props;
  return <tbody {...rest}>{children}</tbody>; 
}
/** AntD.TableComponent.body.row */
const Row = React.forwardRef(function Row(props: any, ref) {
  const { children, ...rest } = props;
  return <tr {...rest} ref={ref}>{children}</tr>;
});



/**
 * define CONSTANTs.
 */
// const MIN_FRAME = 16;

/**
 * the following functions bind the `ctx`.
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
function _RC_fixed_setState(ctx: storeValue, top: number, head: number, tail: number) {
  if (ctx._lvt_ctx)
    ctx._lvt_ctx._React_ptr.setState({ top, head, tail });
  if (ctx._rvt_ctx)
    ctx._rvt_ctx._React_ptr.setState({ top, head, tail });
}


function _Update_wrap_style(ctx: storeValue, h: number) {
  // a component has unmounted.
  if (!ctx.wrap_inst.current) return;

  if (ctx.load_the_trs_once === e_vt_state.WAITING) h = 0;
  ctx.wrap_inst.current.style.height = `${h}px`;
  ctx.wrap_inst.current.style.maxHeight = `${h}px`;
}


/** non-block, just create a macro tack, then only update once. */
function update_wrap_style(ctx: storeValue, h: number) {
  if (ctx.WH === h) return;
  ctx.WH = h;
  _Update_wrap_style(ctx, h);
  /* update the `ColumnProps.fixed` synchronously */
  if (ctx._lvt_ctx) _Update_wrap_style(ctx._lvt_ctx, h);
  if (ctx._rvt_ctx) _Update_wrap_style(ctx._rvt_ctx, h);
}


function _scroll_to(ctx: storeValue, top: number, left: number) {
  const ele = ctx.wrap_inst.current.parentElement;
  /** ie */
  ele.scrollTop = top;
  ele.scrollLeft = left;
}


function scroll_to(ctx: storeValue, top: number, left: number) {
  _scroll_to(ctx, top, left);

  if (ctx._lvt_ctx) _scroll_to(ctx._lvt_ctx, top, left);
  if (ctx._rvt_ctx) _scroll_to(ctx._rvt_ctx, top, left);
}


/**
 * running level: `RUNNING`.
 */
function apply_h(ctx: storeValue, idx: number, h: number) {
  console.assert(!isNaN(h), `failed to apply height with index ${idx}!`);
  ctx.row_height[idx] = h;
  ctx.computed_h += h; // just do add up.
}


function free_h_tr(ctx: storeValue, idx: number) {
  console.assert(!isNaN(ctx.row_height[idx]), `failed to free this tr[${idx}].`);
  ctx.computed_h -= ctx.row_height[idx];
}


function _repainting(ctx: storeValue) {
  return requestAnimationFrame(() => {
    const { PAINT_ADD, PAINT_SADD, PAINT_FREE, PAINT_SFREE } = ctx;
    
    log_debug(ctx, "START-REPAINTING");

    if (PAINT_FREE.size) {
      for (let idx of PAINT_FREE) {
        free_h_tr(ctx, idx);
      }
      console.assert(!Number.isNaN(ctx.computed_h));
      console.assert(ctx.computed_h >= 0);
    }

    if (PAINT_SFREE.size) {
      for (let idx of PAINT_SFREE) {
        free_h_tr(ctx, idx);
      }
      console.assert(!Number.isNaN(ctx.computed_h));
      console.assert(ctx.computed_h >= 0);
    }

    if (PAINT_ADD.size) {
      for (let [idx, el] of PAINT_ADD) {
        apply_h(ctx, idx, el.offsetHeight);
      }
      console.assert(!Number.isNaN(ctx.computed_h));
      console.assert(ctx.computed_h >= 0);
    }

    if (PAINT_SADD.size) {
      for (let [idx, h] of PAINT_SADD) {
        apply_h(ctx, idx, h);
      }
      console.assert(!Number.isNaN(ctx.computed_h));
      console.assert(ctx.computed_h >= 0);
    }


    // clear
    PAINT_SFREE.clear();
    PAINT_FREE.clear();
    PAINT_ADD.clear();
    PAINT_SADD.clear();

    if (ctx.load_the_trs_once === e_vt_state.RUNNING) {
      // output to the buffer
      update_wrap_style(ctx, ctx.computed_h);
    }

    // free this handle manually.
    ctx.HND_PAINT = 0;

    log_debug(ctx, "END-REPAINTING");
  });
}


/** non-block */
function repainting_with_add(ctx: storeValue, idx: number, tr: HTMLTableRowElement) {
  ctx.PAINT_ADD.set(idx, tr);
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx);
}


/** non-block */
function repainting_with_sadd(ctx: storeValue, idx: number, h: number) {
  ctx.PAINT_SADD.set(idx, h);
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx);
}


/** non-block */
function repainting_with_free(ctx: storeValue, idx: number) {
  ctx.PAINT_FREE.add(idx);
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx);
}

/** non-block */
function repainting_with_sfree(ctx: storeValue, idx: number) {
  ctx.PAINT_SFREE.add(idx);
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx);
}

/* overload __DIAGNOSIS__. */
function __DIAGNOSIS__(ctx: storeValue) {
  Object.defineProperty(ctx, "__DIAGNOSIS__", {
    get() {
      console.debug("OoOoOoO DIAGNOSIS OoOoOoO");
      let total = 0;
      for (let i = 0; i < ctx.row_count; ++i) {
        total += ctx.row_height[i];
      }
      console.debug("Verify computed_h", total);
      console.debug("OoOoOoOoOoOoOOoOoOoOoOoOo");
    },
    configurable: false,
    enumerable: false,
  });
}

function log_debug(ctx: storeValue & obj, msg: string) {
  if (ctx.debug) {
    ctx = { ...ctx };
    __DIAGNOSIS__(ctx);
    const ts = new Date().getTime();
    console.debug(`%c[${ctx.id}][${ts}][${msg}] vt`, "color:#a00", ctx);
  }
}


function set_tr_cnt(ctx: storeValue, n: number) {
  ctx.re_computed = n - ctx.row_count;
  ctx.prev_row_count = ctx.row_count;
  ctx.row_count = n;
}

class VT_CONTEXT {

// using closure
public static Switch(ID: number) {

const ctx = store.get(ID);

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
            const Row = ctx.components.body.row;
            return <Row {...restProps} ref={this.inst}>{children}</Row>;
          }
        }
      </S.Consumer>
    )
  }

  public componentDidMount() {
    if (this.fixed !== e_fixed.NEITHER) return;

    const props: any = this.props;
    const index = props.children[0]!.props!.index;

    if (ctx._index_persister.size && ctx._index_persister.delete(index)) {
      return;
    }

    if (ctx.load_the_trs_once === e_vt_state.RUNNING) {
      const key = String(props["data-row-key"]);
      if (ctx._keys2free.delete(key)) {
        repainting_with_free(ctx, index);
      }
      repainting_with_add(ctx, index, this.inst.current);
    } else {
      /* init context */
      console.assert(ctx.load_the_trs_once === e_vt_state.INIT);
      ctx.load_the_trs_once = e_vt_state.LOADED;
      const h = this.inst.current.offsetHeight;
      if (ctx.possible_hight_per_tr === -1) {
        /* assign only once */
        ctx.possible_hight_per_tr = h;
      }
      ctx.computed_h = 0; // reset initial value.
      apply_h(ctx, index, h);
    }
  }

  public componentDidUpdate() {
    if (this.fixed !== e_fixed.NEITHER) return;

    const index = this.props.children[0]!.props!.index;
    if (ctx.PAINT_FREE.size && ctx.PAINT_FREE.has(index)) {
      repainting_with_add(ctx, index, this.inst.current);
    } else {
      repainting_with_free(ctx, index);
      repainting_with_add(ctx, index, this.inst.current);
    }
  }

  public componentWillUnmount() {
    if (this.fixed !== e_fixed.NEITHER) return;

    const props: any = this.props;
    const index: number = props.children[0]!.props!.index;

    // `RUNNING` -> `SUSPENDED`
    if (ctx.load_the_trs_once === e_vt_state.SUSPENDED) {
      ctx._index_persister.add(index);
      return;
    }


    if (ctx._keys2insert > 0) {
      ctx._keys2insert--;
      // nothing to do... just return.
      return;
    }

    if (!ctx.PAINT_SFREE.has(index)) {
      repainting_with_free(ctx, index);
    }
  }

}


type VTWrapperProps = {
  children: any[];
};


class VTWrapper extends React.Component<VTWrapperProps> {

  public constructor(props: VTWrapperProps, context: any) {
    super(props, context);
  }

  public render() {
    const { children, ...restProps } = this.props;
    return (
      <S.Consumer>
        {
          ({ head, tail, fixed }) => {

            let trs: any[] = [];
            let len = children.length;

            const Wrapper = ctx.components.body.wrapper;

            if (ctx.load_the_trs_once === e_vt_state.WAITING) {
              // waitting for loading data as soon, just return this as following.
              return <Wrapper {...restProps}>{trs}</Wrapper>;
            }

            if ((ctx.row_count !== len) && (fixed === e_fixed.NEITHER)) {
              set_tr_cnt(ctx, len);
            }


            if (len >= 0 && fixed === e_fixed.NEITHER) {
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
              } = ctx;

              let fixed_PSRA0 = PSRA[0] - offset,
                  fixed_PSRA1 = PSRA[1] - offset;
              if (fixed_PSRA0 < 0) fixed_PSRA0 = 0;
              if (fixed_PSRA1 < 0) fixed_PSRA1 = 0;

              let fixed_PSRB0 = PSRB[0] - offset,
                  fixed_PSRB1 = PSRB[1] - offset;
              if (fixed_PSRB0 < 0) fixed_PSRB0 = 0;
              if (fixed_PSRB1 < 0) fixed_PSRB1 = 0;

              


              if (ctx.load_the_trs_once === e_vt_state.INIT) {
                /* init trs [0, 1] */
                for (let i = head; i < tail; ++i) {
                  trs.push(children[i]);
                }

                // reset `prev_row_count` as same as `row_count`
                ctx.prev_row_count = ctx.row_count;

              } else if (ctx.load_the_trs_once === e_vt_state.RUNNING) {

                len = ctx.row_count;
                let prev_len = ctx.prev_row_count;

                if (len > prev_len) {
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
                  ctx._keys2insert = 0;
                  for (let i = head; i < tail; ++i) {
                    let child = children[i];
                    keys.add(child.key);
                    if (!ctx._prev_keys.has(child.key)) {
                      ctx._keys2insert++;
                      // insert a row at index `i` with height `0`.
                      ctx.row_height.splice(i, 0, 0);
                    }
                    trs.push(child);
                  }

                  ctx._prev_keys = keys;

                } else if (len < prev_len) {
                  const keys = new Set<string>();
                  ctx._keys2free.clear();
                  for (let i = head; i < tail; ++i) {
                    let child = children[i];
                    if (fixed_PSRA1 === head && fixed_PSRB0 === tail && // no movement occurred
                        !ctx._prev_keys.has(child.key))
                    {
                      // then, manually free this index befor mounting React Component.
                      ctx._keys2free.add(child.key);
                    }
                    trs.push(child);
                    keys.add(child.key);
                  }
                  ctx._prev_keys = keys;
                } else {
                  const keys = new Set<string>();
                  ctx._keys2free.clear();
                  for (let i = head; i < tail; ++i) {
                    let child = children[i];
                    if (fixed_PSRA1 === head && fixed_PSRB0 === tail && // no movement occurred
                       !ctx._prev_keys.has(child.key))
                    {
                      // then, manually free this index befor mounting React Component.
                      ctx._keys2free.add(child.key);
                    }
                    trs.push(child);
                    keys.add(child.key);
                  }
                  ctx._prev_keys = keys;
                }

                /**
                 * start srs_diff phase.
                 * first up, Previous-Shadow-Rows below `trs`,
                 * then Previous-Shadow-Rows above `trs`.
                 */
                // how many Shadow Rows need to be deleted.
                let SR_n2delete = 0, SR_n2insert = 0;

                /* PSR's range: [begin, end) */
                if (PSRB[0] === -1) {
                  // init Rows.
                  const rows = new Array(tail - 1/* substract the first row */).fill(0, 0, tail - 1);
                  ctx.row_height = ctx.row_height.concat(rows);
                  // init Shadow Rows.
                  const shadow_rows = new Array(len - tail).fill(ctx.possible_hight_per_tr, 0, len - tail);
                  ctx.row_height = ctx.row_height.concat(shadow_rows);
                  ctx.computed_h = ctx.computed_h + ctx.possible_hight_per_tr * (len - tail);

                  PSRB[0] = tail;
                  PSRB[1] = len;
                } else {
                  if (len < prev_len) {
                    /* free some rows */
                    SR_n2delete = prev_len - len - (PSRB[1] - len);
                    srs_diff(ctx, PSRB, tail, len, fixed_PSRB0, PSRB[1]);
                  } else if (len > prev_len) {
                    /* insert some rows */
                    SR_n2insert = ctx._keys2insert;
                    srs_diff(ctx, PSRB, tail, len, PSRB[0], PSRB[1] + SR_n2insert);
                  } else {
                    srs_diff(ctx, PSRB, tail, len, PSRB[0], PSRB[1]);
                  }
                }

                if (PSRA[0] === -1) {
                  // init Shadow Rows, just do `apply_h`.
                  console.assert(head === 0);
                  srs_diff(ctx, PSRA, 0, head, 0, 0);
                } else {
                  srs_diff(ctx, PSRA, 0, head, PSRA[0], fixed_PSRA1 + SR_n2delete);
                }

                ctx.prev_row_count = ctx.row_count;
              } /* RUNNING */

            } /* len && this.fixed === e_fixed.NEITHER */

            /* fixed L R */
            if (len >= 0 && fixed !== e_fixed.NEITHER) {
              for (let i = head; i < tail; ++i) {
                trs.push(children[i]);
              }
            }

            return <Wrapper {...restProps}>{trs}</Wrapper>;
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

  // HandleId of requestAnimationFrame.
  private HNDID_RAF: number;

  public constructor(props: VTProps, context: any) {
    super(props, context);
    this.inst = React.createRef();
    this.wrap_inst = React.createRef();
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.state = {
      top: 0,
      head: 0,
      tail: 1,
    };

    const fixed = this.props.children[0].props.fixed;
    if (fixed === "left") {
      this.fixed = e_fixed.L;
    } else if (fixed === "right") {
      this.fixed = e_fixed.R;
    } else {
      this.fixed = e_fixed.NEITHER;
    }



    if (this.fixed === e_fixed.NEITHER) {
      this.restoring = false;

      this.user_context = {};

      let reflection = ctx.reflection || [];
      if (typeof reflection === "string") {
        reflection = [reflection];
      }
  
      for (let i = 0; i < reflection.length; ++i) {
        this.user_context[reflection[i]] = this.props[reflection[i]];
      }
  
      this.event_queue = [];
      this.nevent_queue = [];
      this.update_self = this.update_self.bind(this);

      this.HNDID_RAF = 0;
    }



    if (ctx.load_the_trs_once === e_vt_state.INIT) {
      if (this.fixed === e_fixed.NEITHER) {

        ctx.possible_hight_per_tr = -1;
        ctx.computed_h = 0;
        ctx.re_computed = 0;
        ctx.row_height = [];
        ctx.row_count = 0;
        ctx.prev_row_count = 0;
  
        ctx.PSRA = [-1, -1];
        ctx.PSRB = [-1, -1];
        ctx.PAINT_ADD = new Map();
        ctx.PAINT_SADD = new Map();
        ctx.PAINT_FREE = new Set();
        ctx.PAINT_SFREE = new Set();
  
        /* init keys */
        ctx._prev_keys = new Set();
        ctx._keys2free = new Set();
        ctx._keys2insert = 0;
  
        __DIAGNOSIS__(ctx);

        ctx._index_persister = new Set();
      }

      // init context for all of the `L` `R` and `NEITHER`.
      ctx.WH = 0;

    } else {
      if (this.fixed === e_fixed.NEITHER) {
        console.assert(ctx.load_the_trs_once === e_vt_state.SUSPENDED);

        /* `SUSPENDED` -> `WAITING` */
        ctx.load_the_trs_once = e_vt_state.WAITING;

        const { state, scrollTop, scrollLeft } = ctx._React_ptr;
        this.state = { head: state.head, top: state.top, tail: state.tail };
        this.scrollTop = scrollTop;
        this.scrollLeft = scrollLeft;
      }
    }

    if (this.fixed === e_fixed.NEITHER) {
      ctx.VTScroll = this.scroll.bind(this);
      ctx._React_ptr = this;
    }
  }

  public render() {
    const { head, tail, top } = this.state;

    const { style, children, ...rest } = this.props;
    style.position = "absolute";
    style.top = top;
    const { width, ...rest_style } = style;

    const Table = ctx.components.table;

    return (
      <div
        ref={this.wrap_inst}
        style={{ width, position: "relative", transform: "matrix(1, 0, 0, 1, 0, 0)" }}
      >
        <S.Provider value={{ tail, head, fixed: this.fixed, ...this.user_context }}>
          <Table {...rest} ref={this.inst} style={rest_style}>{children}</Table>
        </S.Provider>
      </div>
    );

  }

  public componentDidMount() {
    switch (this.fixed) {
      case e_fixed.L:
        {
          /* registers the `_lvt_ctx` at the `ctx`. */
          store.set(0 - ID, { _React_ptr: this } as storeValue);
          ctx._lvt_ctx = store.get(0 - ID);
          ctx._lvt_ctx.wrap_inst = this.wrap_inst;
          _Update_wrap_style(ctx._lvt_ctx, ctx.computed_h);
          const { scrollTop, scrollLeft, state } = ctx._React_ptr;
          _scroll_to(ctx._lvt_ctx, scrollTop, scrollLeft);
          ctx._lvt_ctx._React_ptr.setState({
            top: state.top,
            head: state.head,
            tail: state.tail,
          });
          this.wrap_inst.current.setAttribute("vt-left", `[${ID}]`);
        }
        return;

      case e_fixed.R:
        {
          /* registers the `_rvt_ctx` at the `ctx`. */
          store.set((1 << 31) + ID, { _React_ptr: this } as storeValue);
          ctx._rvt_ctx = store.get((1 << 31) + ID);
          ctx._rvt_ctx.wrap_inst = this.wrap_inst;
          _Update_wrap_style(ctx._rvt_ctx, ctx.computed_h);
          const { scrollTop, scrollLeft, state } = ctx._React_ptr;
          _scroll_to(ctx._rvt_ctx, scrollTop, scrollLeft);
          ctx._rvt_ctx._React_ptr.setState({
            top: state.top,
            head: state.head,
            tail: state.tail,
          });
          this.wrap_inst.current.setAttribute("vt-right", `[${ID}]`);
        }
        return;

      default:
        ctx.wrap_inst = this.wrap_inst;
        // ctx.re_computed = 0;
        this.wrap_inst.current.parentElement.onscroll = this.scrollHook.bind(this);
        _Update_wrap_style(ctx, ctx.computed_h);
        this.wrap_inst.current.setAttribute("vt", `[${ID}]`);
        break;
    }

    // 0 - head, 2 - body
    const children = this.props.children[2].props.children;

    if (ctx.load_the_trs_once === e_vt_state.WAITING) {
      /* switch `SUSPENDED` to `WAITING` from VT's constructor. */
      if (children.length) {
        // just only switch to `RUNNING`.
        ctx.load_the_trs_once = e_vt_state.RUNNING;
      }
    } else {
      if (children.length) {
        // `load_the_trs_once` is changed by `VTRow`.
        console.assert(ctx.load_the_trs_once === e_vt_state.LOADED);
        ctx.load_the_trs_once = e_vt_state.RUNNING;
        this.scrollHook({
          target: { scrollTop: 0, scrollLeft: 0 },
          flags: SCROLLEVT_INIT,
        });
      } else {
        console.assert(ctx.load_the_trs_once === e_vt_state.INIT);
      }
    }

  }

  public componentDidUpdate() {

    if (this.fixed !== e_fixed.NEITHER) return;

    if (ctx.load_the_trs_once === e_vt_state.INIT) {
      return;
    }

    if (ctx.load_the_trs_once === e_vt_state.LOADED) {
      // `LOADED` -> `RUNNING`.
      ctx.load_the_trs_once = e_vt_state.RUNNING;

      // force update for initialization
      this.scrollHook({
        target: { scrollTop: 0, scrollLeft: 0 },
        flags: SCROLLEVT_INIT,
      });
    }

    if (ctx.load_the_trs_once === e_vt_state.WAITING) {
      // Do you get the previous data back?
      if (this.props.children[2].props.children.length) {
        // Y, `WAITING` -> `RUNNING`.
        ctx.load_the_trs_once = e_vt_state.RUNNING;
      } else {
        // N, keep `WAITING` then just return.
        return;
      }
    }

    if (ctx.load_the_trs_once === e_vt_state.RUNNING) {
      if (this.restoring) {
        this.restoring = false;
        this.scrollHook({
          target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft },
          flags: SCROLLEVT_RESTORETO,
        });
      }

      if (ctx.re_computed !== 0) { // rerender
        ctx.re_computed = 0;
        this.scrollHook({
          target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft },
          flags: SCROLLEVT_RECOMPUTE,
        });
      }
    }

  }

  public componentWillUnmount() {
    if (this.fixed !== e_fixed.NEITHER) return;

    if (ctx.destroy) {
      store.delete(0 - ID);        // fixed left
      store.delete((1 << 31) + ID);// fixed right
      store.delete(ID);
    } else {
      ctx.load_the_trs_once = e_vt_state.SUSPENDED;
      const { state, scrollTop, scrollLeft } = ctx._React_ptr;
      ctx._React_ptr = { state, scrollTop, scrollLeft };
    }
    this.setState = (...args) => null;
  }

  public shouldComponentUpdate(nextProps: VTProps, nextState: any) {
    return true;
  }

  private scroll_with_computed(top: number) {

    const {
      row_height,
      row_count,
      possible_hight_per_tr,
      overscanRowCount,
    } = ctx;

    let overscan = overscanRowCount;

    const props = this.props.children[2].props.children[0].props;

    if (typeof props.scroll.y === "number") {
      ctx._raw_y = props.scroll.y as number;
      ctx._y = ctx._raw_y;
    } else if (typeof props.scroll.y === "string") {
      /* a string, like "calc(100vh - 300px)" */
      if (ctx.debug)
        console.warn(`AntD.Table.scroll.y: ${props.scroll.y}, it may cause performance problems.`);
      ctx._raw_y = props.scroll.y;
      ctx._y = this.wrap_inst.current.parentElement.offsetHeight;
    } else {
      if (ctx.debug)
        console.warn(`AntD.Table.scroll.y: ${props.scroll.y}, it may cause performance problems.`);
      console.info("VT will not works well, did you forget to set `scroll.y`?");
      ctx._raw_y = null;
      ctx._y = this.wrap_inst.current.parentElement.offsetHeight;
    }

    console.assert(ctx._y >= 0);

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
      if (torender_h > ctx._y) break;
      torender_h += (row_height[j] || possible_hight_per_tr);
    }

    if (j < row_count) {
      do {
        torender_h += (row_height[j++] || possible_hight_per_tr);
      } while ((--overscan > 0) && (j < row_count));
    }

    return [0 | i, 0 | j, 0 | accumulate_top];
  }


  private scrollHook(e: any) {

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

    if (ctx.onScroll && (flags & SCROLLEVT_NATIVE)) {
      ctx.onScroll({ top: scrollTop, left: scrollLeft });
    }

    if (ctx.debug) {
      console.debug(`[${ctx.id}][SCROLL] top: %d, left: %d`, scrollTop, scrollLeft);
    }

    // checks every tr's height, so it may be take some times...
    const [head, tail, top] = this.scroll_with_computed(scrollTop);

    const prev_head = this.state.head,
          prev_tail = this.state.tail,
          prev_top = this.state.top;

    if (flags & SCROLLEVT_INIT) {
      log_debug(ctx, "SCROLLEVT_INIT");

      console.assert(scrollTop === 0 && scrollLeft === 0);

      this.setState({ top, head, tail }, () => {
        scroll_to(ctx, 0, 0); // init this vtable by (0, 0).
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_INIT;
        flags &= ~SCROLLEVT_BARRIER;

        if (this.event_queue.length) this.scrollHook(null); // consume the next.
      });

      _RC_fixed_setState(ctx, top, head, tail);
      return;
    }

    if (flags & SCROLLEVT_RECOMPUTE) {
      log_debug(ctx, "SCROLLEVT_RECOMPUTE");

      if (head === prev_head && tail === prev_tail && top === prev_top) {
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RECOMPUTE;
        
        if (this.event_queue.length) this.scrollHook(null); // consume the next.
        return;
      }

      this.setState({ top, head, tail }, () => {
        scroll_to(ctx, scrollTop, scrollLeft);
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RECOMPUTE;

        if (this.event_queue.length) this.scrollHook(null); // consume the next.
      });

      _RC_fixed_setState(ctx, top, head, tail);
      return;
    }

    if (flags & SCROLLEVT_RESTORETO) {
      log_debug(ctx, "SCROLLEVT_RESTORETO");

      this.setState({ top, head, tail }, () => {
        // to force update style assign `WH` to 0.
        ctx.WH = 0;
        update_wrap_style(ctx, ctx.computed_h);

        scroll_to(ctx, scrollTop, scrollLeft);
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RESTORETO;

        if (this.event_queue.length) this.scrollHook(null); // consume the next.
      });

      _RC_fixed_setState(ctx, top, head, tail);
      return;
    }
    
    if (flags & SCROLLEVT_NATIVE) {
      log_debug(ctx, "SCROLLEVT_NATIVE");

      this.scrollLeft = scrollLeft;
      this.scrollTop = scrollTop;

      if (head === prev_head && tail === prev_tail && top === prev_top) {
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_NATIVE;
        return;
      }

      this.setState({ top, head, tail }, () => {
        this.HNDID_RAF = 0;
        flags &= ~SCROLLEVT_NATIVE;
      });

      _RC_fixed_setState(ctx, top, head, tail);
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

}


return { VT, VTWrapper, VTRow, S };

} // Switch

} // VT_CONTEXT

function ASSERT_ID(id: number) {
  console.assert(typeof id === "number" && id > 0);
}

function _set_components(ctx: storeValue, components: TableComponents) {
  const { table, body, header } = components;
  ctx.components.body = { ...ctx.components.body, ...body };
  if (body && body.cell) {
    ctx._vtcomponents.body.cell = body.cell;
  } 
  if (header) {
    ctx.components.header = header;
    ctx._vtcomponents.header = header;
  }
  if (table) {
    ctx.components.table = table;
  }
}

function init(id: number) {
  const inside = store.get(id) || {} as storeValue;
  if (!inside._vtcomponents) {
    store.set(id, inside);
    const { VT, VTWrapper, VTRow, S } = VT_CONTEXT.Switch(id);
    // set the virtual layer.
    inside._vtcomponents = {
      table: VT,
      body: {
        wrapper: VTWrapper,
        row: VTRow,
      }
    };
    // set the default implementation layer.
    inside.components = {};
    _set_components(inside, {
      table: Table,
      body: {
        wrapper: Wrapper,
        row: Row,
      }
    });
    inside.context = S;
    // start -> `INIT`
    inside.load_the_trs_once = e_vt_state.INIT;
  }
  return inside;
}



export
function VTComponents(vt_opts: vt_opts): TableComponents {

  ASSERT_ID(vt_opts.id);

  if (Object.hasOwnProperty.call(vt_opts, "height")) {
    console.warn(`The property \`vt_opts.height\` has been deprecated.
                  Now it depends entirely on \`scroll.y\`.`);
  }

  if (Object.hasOwnProperty.call(vt_opts, "reflection")) {
    console.warn(`The property \`vt_opts.reflection\`
                  will be deprecated in the next release.`);
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

  return inside._vtcomponents;
}

export
function getVTContext(id: number) {
  ASSERT_ID(id);
  return init(id).context;
}

export
function setComponents(id: number, components: TableComponents) {
  ASSERT_ID(id);
  _set_components(init(id), components);
}

/**
 * @deprecated
 */
export
function getVTComponents(id: number) {
  console.warn("This function will be deprecated in the next release.")
  return init(id).components;
}

export
function VTScroll(id: number, param?: { top: number, left: number }) {
  ASSERT_ID(id);
  return store.get(id).VTScroll(param);
}
