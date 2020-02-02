
/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/


import * as React from "react";
import { TableComponents } from "antd/lib/table/interface";


interface obj extends Object {
  [field: string]: any;
}


export
interface vt_opts extends Object {
  readonly id: number;
  /**
   * @default 5
   */
  overscanRowCount?: number;

  /**
   * @deprecated
   */
  reflection?: string[] | string;

  /**
   * wheel event(only works on native events).
   */
  onScroll?: ({ left, top, isEnd, }:
    { top: number; left: number; isEnd: boolean }) => void;

  /**
   * @summary it can help you to optimize your next rendering.
   * @default false
   */
  destroy?: boolean;

  /**
   * @default false
   */
  debug?: boolean;
}

/**
 * `INIT` -> `LOADED` -> `RUNNING` -> `SUSPENDED`
 * `SUSPENDED` -> `WAITING` -> `RUNNING`
 */
enum e_VT_STATE {
  INIT       = 1,
  LOADED     = 2,
  RUNNING    = 4,
  SUSPENDED  = 8,
  WAITING    = 16,
  PROTECTION = 128,
}

/**
 * `L`: fixed: "left", `R`: fixed: "right"
 */
enum e_FIXED {
  UNKNOW = -1,
  NEITHER,
  L,
  R
}


interface vt_ctx {
  fixed: e_FIXED;
}


interface VT_CONTEXT extends vt_opts {
  _y: number; // will use the Table.scroll.y.
  _raw_y: number | string; // this is the same as the `Table.scroll.y`.

  _vtcomponents: TableComponents; // virtual layer.
  components: TableComponents;    // implementation layer.
  computed_h: number;
  vt_state: e_VT_STATE;
  possible_hight_per_tr: number;
  
  /* 0: needn't to recalculate, > 0: to add, < 0 to subtract */
  re_computed: number;
  row_height: number[];
  row_count: number;
  prev_row_count: number;
  wrap_inst: React.RefObject<HTMLDivElement>;
  _store: React.Context<vt_ctx>;

  // return the last state.
  VTScroll?: (param?: { top: number; left: number }) => { top: number; left: number };

  _React_ptr: any; // a pointer to the instance of `VTable`.

  _lvt_ctx: VT_CONTEXT; // fixed left.
  _rvt_ctx: VT_CONTEXT; // fixed right.


  WH: number;      // Wrapped Height.
                   // it's the newest value of `wrap_inst`'s height to update.

  HND_PAINT: number;      // a handle for Batch Repainting.

  /* stores [begin, end], `INIT`: [-1, -1] */
  PSRA: number[]; // represents the Previous Shadow-Rows Above `trs`.
  PSRB: number[]; // represents the Previous Shadow-Rows Below `trs`.

  /* render with React. */
  _keys2insert: number; // a number of indexes.

  // persistent stroage index when switch `RUNNING` to `SUSPENDED`.
  // it will prevent to change the `ctx._computed_h`.
  _index_persister: Set<number/* index */>;

  // stores the variables for the offset following.
  //  |
  //  |
  //  top
  //  children[index] - head
  //  .
  //  .
  //  .
  //  .
  //  children[index] - tail <= children.len
  //  |
  _offset_top: number/* int */;
  _offset_head: number/* int */;
  _offset_tail: number/* int */;
}

/**
 * @global
 */
export const vt_context: Map<number, VT_CONTEXT> = new Map();


/* overload __DIAGNOSIS__. */
function __DIAGNOSIS__(ctx: VT_CONTEXT): void {
  Object.defineProperty(ctx, "__DIAGNOSIS__", {
    get() {
      console.debug("OoOoOoO DIAGNOSIS OoOoOoO");
      let total = 0;
      for (let i = 0; i < ctx.row_count; ++i) {
        total += ctx.row_height[i];
      }
      let color: string;
      if (total > ctx.computed_h) {
        color = "color:rgb(15, 179, 9)"; // green
      } else if (total < ctx.computed_h) {
        color = "color:rgb(202, 61, 81)"; // red
      } else {
        color = "color:rgba(0, 0, 0, 0.85)";
      }
      console.debug("Verify %c%d(%d)", color, total, ctx.computed_h - total);
      console.debug("OoOoOoOoOoOoOOoOoOoOoOoOo");
    },
    configurable: false,
    enumerable: false,
  });
}



function log_debug(ctx: VT_CONTEXT, msg: string): void {
  if (ctx.debug) {
    ctx = { ...ctx };
    __DIAGNOSIS__(ctx);
    const ts = new Date().getTime();
    console.debug(`%c[${ctx.id}][${ts}][${msg}] vt`, "color:#a00", ctx);
  }
}


/**
 * THE EVENTS OF SCROLLING.
 */
// const SCROLLEVT_NULL       = (0<<0);
const SCROLLEVT_INIT       = (1<<0);
const SCROLLEVT_RECOMPUTE  = (1<<1);
const SCROLLEVT_RESTORETO  = (1<<2);
const SCROLLEVT_NATIVE     = (1<<3);
const SCROLLEVT_BARRIER    = (1<<4); // It only for `SCROLLEVT_RECOMPUTE`.
// const SCROLLEVT_MASK       = SCROLLEVT_BARRIER | SCROLLEVT_RECOMPUTE;

type SimEvent = {
  target: { scrollTop: number; scrollLeft: number };
  flags: number;
  endOfElements?: boolean;
};

// the factory function returns a SimEvent.
function _make_evt(ne: Event): SimEvent {
  const target: any = ne.target;
  return {
    target: {
      scrollTop: target.scrollTop,
      scrollLeft: target.scrollLeft,
    },
    endOfElements: target.scrollHeight - target.clientHeight === target.scrollTop,
    flags: SCROLLEVT_NATIVE,
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
function Wrapper(props: any): JSX.Element {
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
/**
 * returns offset: [head, tail, top] 
 */
function scroll_with_offset(ctx: VT_CONTEXT, top: number, table_props: any): [number, number, number] {

  const {
    row_height,
    row_count,
    possible_hight_per_tr,
    overscanRowCount,
  } = ctx;
  let overscan = overscanRowCount;

  const props = table_props;
  if (typeof props.scroll.y === "number") {
    ctx._raw_y = props.scroll.y as number;
    ctx._y = ctx._raw_y;
  } else if (typeof props.scroll.y === "string") {
    /* a string, like "calc(100vh - 300px)" */
    if (ctx.debug)
      console.warn(`AntD.Table.scroll.y: ${props.scroll.y}, it may cause performance problems.`);
    ctx._raw_y = props.scroll.y;
    ctx._y = ctx.wrap_inst.current.parentElement.offsetHeight;
  } else {
    if (ctx.debug)
      console.warn(`AntD.Table.scroll.y: ${props.scroll.y}, it may cause performance problems.`);
    console.info("VT will not works well, did you forget to set `scroll.y`?");
    ctx._raw_y = null;
    ctx._y = ctx.wrap_inst.current.parentElement.offsetHeight;
  }

  console.assert(ctx._y >= 0);
  // to calc `accumulate_top` with `row_height` and `overscan`.
  let accumulate_top = 0, i = 0;
  for (; i < row_count && accumulate_top <= top; ++i) {
    accumulate_top += row_height[i];
  }
  while (i > 0 && overscan--) {
    accumulate_top -= row_height[--i];
  }
  // the height to render.
  let torender_h = 0, j = i;
  for (; j < row_count && torender_h < ctx._y; ++j) {
    torender_h += (row_height[i] === void 0) ? possible_hight_per_tr : row_height[j];
  }
  j += overscanRowCount * 2;
  if (j > row_count) j = row_count;
  // returns [head, tail, top].
  return [0 | i, 0 | j, 0 | accumulate_top];
}


// set the variables for offset top/head/tail.
function _set_offset(
  ctx: VT_CONTEXT, top: number, head: number, tail: number): void
{
  ctx._offset_top = 0 | top;
  ctx._offset_head = 0 | head;
  ctx._offset_tail = 0 | tail;
}

// the func a component to rerender.
function _RC_rerender(
  ctx: VT_CONTEXT, top: number, head: number, tail: number,
  handler: () => void = null): void
{
  _set_offset(ctx, top, head, tail);
  ctx._React_ptr.forceUpdate(handler);
}


/** update to ColumnProps.fixed synchronously */
function _RC_fixed_rerender(ctx: VT_CONTEXT): void {
  if (ctx._lvt_ctx)
    ctx._lvt_ctx._React_ptr.forceUpdate();
  if (ctx._rvt_ctx)
    ctx._rvt_ctx._React_ptr.forceUpdate();
}


function _Update_wrap_style(ctx: VT_CONTEXT, h: number): void {
  // a component has unmounted.
  if (!ctx.wrap_inst.current) return;

  if (ctx.vt_state === e_VT_STATE.WAITING) h = 0;
  ctx.wrap_inst.current.style.height = `${h}px`;
  ctx.wrap_inst.current.style.maxHeight = `${h}px`;
}


/** non-block, just create a macro tack, then only update once. */
function update_wrap_style(ctx: VT_CONTEXT, h: number): void {
  if (ctx.WH === h) return;
  ctx.WH = h;
  _Update_wrap_style(ctx, h);
  /* update the `ColumnProps.fixed` synchronously */
  if (ctx._lvt_ctx) _Update_wrap_style(ctx._lvt_ctx, h);
  if (ctx._rvt_ctx) _Update_wrap_style(ctx._rvt_ctx, h);
}


// scrolls the parent element to specified location.
function _scroll_to(ctx: VT_CONTEXT, top: number, left: number): void {
  if (!ctx.wrap_inst.current) return;
  const ele = ctx.wrap_inst.current.parentElement;
  /** ie */
  ele.scrollTop = top;
  ele.scrollLeft = left;
}


// a wrapper function for `_scroll_to`.
function scroll_to(ctx: VT_CONTEXT, top: number, left: number): void {
  _scroll_to(ctx, top, left);

  if (ctx._lvt_ctx) _scroll_to(ctx._lvt_ctx, top, left);
  if (ctx._rvt_ctx) _scroll_to(ctx._rvt_ctx, top, left);
}


function apply_h(ctx: VT_CONTEXT, idx: number, h: number, identity: "dom" | "shadow"): void {
  console.assert(h !== void 0, `failed to apply height at index ${idx}!`);
  const _h = h - ctx.row_height[idx];
  ctx.row_height[idx] += _h;
  ctx.computed_h += _h;
  if (ctx.debug) console.info("apply", identity, idx, _h);
}


function add_h(ctx: VT_CONTEXT, idx: number, h: number, identity: "dom" | "shadow"): void {
  console.assert(h !== void 0, `failed to add the height at index ${idx}!`);
  ctx.row_height[idx] = h;
  ctx.computed_h += h; // just do add up.
  if (ctx.debug) console.info("add", identity, idx, h);
}


function free_h(ctx: VT_CONTEXT, idx: number, identity: "dom" | "shadow"): void {
  console.assert(ctx.row_height[idx] !== void 0, `failed to free this tr[${idx}].`);
  ctx.computed_h -= ctx.row_height[idx];
  if (ctx.debug) console.info("free", identity, idx, ctx.row_height[idx]);
  if (identity === "dom") ctx.row_height[idx] = 0;
}


function _repainting(ctx: VT_CONTEXT, ms: number): number {
  const fn = (): void => {
    log_debug(ctx, "REPAINTING");

    if (ctx.vt_state === e_VT_STATE.RUNNING) {
      // output to the buffer
      update_wrap_style(ctx, ctx.computed_h);
    }

    // free this handle manually.
    ctx.HND_PAINT = 0;
  }

  if (ms < 0) return window.requestAnimationFrame(fn);
  return window.setTimeout(fn, ms);
}


// a wrapper function for `_repainting`.
function repainting(ctx: VT_CONTEXT): void {
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx, -1);
}


/** Shadow Rows. */
function srs_diff(
  ctx: VT_CONTEXT, PSR: number[],
  head: number, tail: number, // the range[head, tail) of the DOMs to render.
  begin: number, end: number, prev_begin: number, prev_end: number): void {

  const { row_height, possible_hight_per_tr } = ctx;

  if (begin > prev_begin) {
    for (let i = prev_begin; i < begin; ++i) {
      if (i >= head && i < tail) continue;
      free_h(ctx, i, "shadow");
    }
  } else if (begin < prev_begin) {
    for (let i = begin; i < prev_begin; ++i) {
      if (i >= head && i < tail) continue;
      add_h(ctx, i, row_height[i] || possible_hight_per_tr, "shadow");
    }
  }

  if (end > prev_end) {
    for (let i = prev_end; i < end; ++i) {
      if (i >= head && i < tail) continue;
      add_h(ctx, i, row_height[i] || possible_hight_per_tr, "shadow");
    }
  } else if (end < prev_end) {
    for (let i = end; i < prev_end; ++i) {
      if (i >= head && i < tail) continue;
      free_h(ctx, i, "shadow");
    }
  }

  PSR[0] = begin;
  PSR[1] = end;
}


function set_tr_cnt(ctx: VT_CONTEXT, n: number): void {
  ctx.re_computed = n - ctx.row_count;
  ctx.prev_row_count = ctx.row_count;
  ctx.row_count = n;
}

const VTContext = {

// using closure
Switch(ID: number) {

const ctx = vt_context.get(ID);

const S = React.createContext<vt_ctx>({ fixed: e_FIXED.UNKNOW });


type VTRowProps = {
  children: any[];
};

class VTRow extends React.Component<VTRowProps> {

  private inst: React.RefObject<HTMLTableRowElement>;
  private fixed: e_FIXED;
  private last_index: number;
  public constructor(props: VTRowProps, context: any) {
    super(props, context);
    this.inst = React.createRef();
    this.fixed = e_FIXED.UNKNOW;
    this.last_index = this.props.children[0].props.index;
  }

  public render(): JSX.Element {
    const { children, ...restProps } = this.props;
    return (
      <S.Consumer>
        {
          ({ fixed }) => {
            if (this.fixed === e_FIXED.UNKNOW) this.fixed = fixed;
            const Row = ctx.components.body.row;
            return <Row {...restProps} ref={this.inst}>{children}</Row>;
          }
        }
      </S.Consumer>
    )
  }

  public componentDidMount(): void {
    if (this.fixed !== e_FIXED.NEITHER) return;

    const index = this.props.children[0].props.index;

    if (ctx._index_persister.delete(index)) {
      return;
    }

    if (ctx.vt_state === e_VT_STATE.RUNNING) {
      apply_h(ctx, index, this.inst.current.offsetHeight, "dom");
      repainting(ctx);
    } else {
      /* init context */
      console.assert(ctx.vt_state === e_VT_STATE.INIT);
      ctx.vt_state = e_VT_STATE.LOADED;
      const h = this.inst.current.offsetHeight;
      if (ctx.possible_hight_per_tr === -1) {
        /* assign only once */
        ctx.possible_hight_per_tr = h;
      }
      ctx.computed_h = 0; // reset initial value.
      add_h(ctx, index, h, "dom");
      // create a timeout task.
      _repainting(ctx, 16);
    }
  }

  public componentDidUpdate(): void {
    if (this.fixed !== e_FIXED.NEITHER) return;

    const index = this.props.children[0].props.index;

    if (ctx.re_computed >= 0) {
      apply_h(ctx, index, this.inst.current.offsetHeight, "dom");
    } else {
      // the row moved to another index, so don't need to call `apply_h`.
      // udpate this height at the index directly.
      const h = this.inst.current.offsetHeight;
      const last_h = ctx.row_height[this.last_index];

      if (this.last_index >= ctx._offset_tail) {
        // need to free. so
        // first, free the current height at the index.
        ctx.computed_h -= ctx.row_height[index];
        // then, move and update the height.
        ctx.computed_h += h - last_h;
        // finaly, update the height at the index to ctx.row_height.
        ctx.row_height[index] = h;
      } else {
        // move and update the height.
        ctx.computed_h += h - last_h;
        // finaly, update the height at the index to ctx.row_height.
        ctx.row_height[index] = h;
      }

      if (this.last_index !== index) {
        // free the height of the row at the last index to easy to mount a new row.
        ctx.row_height[this.last_index] = 0;
        this.last_index = index;
      }
    }

    repainting(ctx);
  }

  public componentWillUnmount(): void {
    if (this.fixed !== e_FIXED.NEITHER) return;

    const index = this.props.children[0].props.index;

    // `RUNNING` -> `SUSPENDED`
    if (ctx.vt_state === e_VT_STATE.SUSPENDED) {
      ctx._index_persister.add(index);
      return;
    }

    if (ctx._keys2insert > 0) {
      ctx._keys2insert--;
      // nothing to do... just return.
      return;
    }

    if (ctx.re_computed >= 0) {
      // scrolling or added some rows... just return.
      return;
    }

    free_h(ctx, index, "dom");
    repainting(ctx);
  }

}


type VTWrapperProps = {
  children: any[];
};


class VTWrapper extends React.Component<VTWrapperProps> {

  public constructor(props: VTWrapperProps, context: any) {
    super(props, context);
  }

  public render(): JSX.Element {
    const { children, ...restProps } = this.props;
    return (
      <S.Consumer>
        {
          ({ fixed }) => {

            const { _offset_head, _offset_tail } = ctx;
            let head = _offset_head;
            let tail = _offset_tail;

            const trs: any[] = [];
            let len = children.length;

            const Wrapper = ctx.components.body.wrapper;

            if (ctx.vt_state === e_VT_STATE.WAITING) {
              // waitting for loading data as soon, just return this as following.
              return <Wrapper {...restProps}>{trs}</Wrapper>;
            }

            if (len >= 0 && fixed === e_FIXED.NEITHER) {

              if (ctx.vt_state === e_VT_STATE.INIT) {
                /* init trs [0, 1] */
                for (let i = head; i < tail; ++i) {
                  trs.push(children[i]);
                }

                if (ctx.row_count !== len) {
                  set_tr_cnt(ctx, len);
                }

              } else if (ctx.vt_state & e_VT_STATE.RUNNING) {

                let offset = 0;
                const last_head = ctx._offset_head;
                const last_tail = ctx._offset_tail;
                if (tail > len) {
                  offset = tail - len;
                  tail -= offset;
                  head -= offset;
                  if (head < 0) head = 0;
                  if (tail < 0) tail = 0;
                  // update the `head` and `tail`.
                  _set_offset(ctx,
                    ctx._offset_top/* NOTE: invalided param, just to fill for this param */,
                    head, tail);
                }

                const { PSRA, PSRB } = ctx;

                if (ctx.row_count !== len) {
                  set_tr_cnt(ctx, len);
                }

                len = ctx.row_count;
                let prev_len = ctx.prev_row_count;

                if (ctx.vt_state & e_VT_STATE.PROTECTION) {
                  ctx.vt_state &= ~e_VT_STATE.PROTECTION;
                  prev_len = len;
                }

                /**
                 * start rendering phase.
                 * to render rows to filter.
                 */
                if (len > prev_len) {
                  /* insert */
                  ctx._keys2insert = 0;
                  for (let i = head; i < tail; ++i) {
                    if (i >= ctx.row_height.length) {
                      ctx._keys2insert++;
                      // insert a row at index `i` with height `0`.
                      ctx.row_height.splice(i, 0, 0);
                    }
                    trs.push(children[i]);
                  }
                } else {
                  for (let i = head; i < tail; ++i) {
                    trs.push(children[i]);
                  }
                }

                /**
                 * start srs_diff phase.
                 * first up, Previous-Shadow-Rows below `trs`,
                 * then Previous-Shadow-Rows above `trs`.
                 */
                let fixed_PSRA1 = PSRA[1] - offset;
                if (fixed_PSRA1 < 0) fixed_PSRA1 = 0;
  
                let fixed_PSRB0 = PSRB[0] - offset;
                if (fixed_PSRB0 < 0) fixed_PSRB0 = 0;

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
                    srs_diff(
                      ctx, PSRB,
                      last_head, last_tail,
                      tail, len, fixed_PSRB0, PSRB[1]);
                  } else if (len > prev_len) {
                    /* insert some rows */
                    srs_diff(
                      ctx, PSRB,
                      last_head, last_tail,
                      tail, len, PSRB[0], PSRB[1]);
                  } else {
                    PSRB[0] = tail;
                    PSRB[1] = len;
                  }
                }

                if (PSRA[0] === -1) {
                  // init Shadow Rows.
                  PSRA[0] = 0;
                  PSRA[1] = 0;
                } else {
                  PSRA[0] = 0;
                  PSRA[1] = head;
                }

                ctx.prev_row_count = ctx.row_count;
              } /* RUNNING */

            } /* len && this.fixed === e_FIXED.NEITHER */

            /* fixed L R */
            if (len >= 0 && fixed !== e_FIXED.NEITHER) {
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

  public shouldComponentUpdate(nextProps: VTWrapperProps, nextState: any): boolean {
    return true;
  }

}




type VTProps = {
  children: any[];
  style: React.CSSProperties;
} & obj;

class VTable extends React.Component<VTProps> {

  private inst: React.RefObject<HTMLTableElement>;
  private wrap_inst: React.RefObject<HTMLDivElement>;
  private scrollTop: number;
  private scrollLeft: number;
  private fixed: e_FIXED;


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

    const fixed = this.props.children[0].props.fixed;
    if (fixed === "left") {
      this.fixed = e_FIXED.L;
    } else if (fixed === "right") {
      this.fixed = e_FIXED.R;
    } else {
      this.fixed = e_FIXED.NEITHER;
    }



    if (this.fixed === e_FIXED.NEITHER) {
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



    if (ctx.vt_state === e_VT_STATE.INIT) {
      if (this.fixed === e_FIXED.NEITHER) {

        ctx.possible_hight_per_tr = -1;
        ctx.computed_h = 0;
        ctx.re_computed = 0;
        ctx.row_height = [];
        ctx.row_count = 0;
        ctx.prev_row_count = 0;
  
        ctx.PSRA = [-1, -1];
        ctx.PSRB = [-1, -1];

        ctx._keys2insert = 0;
  
        __DIAGNOSIS__(ctx);

        ctx._index_persister = new Set();

        ctx._offset_top = 0 | 0;
        ctx._offset_head = 0 | 0;
        ctx._offset_tail = 0 | 1;
      }

      // init context for all of the `L` `R` and `NEITHER`.
      ctx.WH = 0;

    } else {
      if (this.fixed === e_FIXED.NEITHER) {
        console.assert(ctx.vt_state === e_VT_STATE.SUSPENDED);

        /* `SUSPENDED` -> `WAITING` */
        ctx.vt_state = e_VT_STATE.WAITING;

        const { scrollTop, scrollLeft } = ctx._React_ptr;
        this.scrollTop = scrollTop;
        this.scrollLeft = scrollLeft;
      }
    }

    if (this.fixed === e_FIXED.NEITHER) {
      ctx.VTScroll = this.scroll.bind(this);
      ctx._React_ptr = this;
    }
  }

  public render(): JSX.Element {
    const { _offset_top } = ctx;

    const { style, children, ...rest } = this.props;
    style.position = "relative";
    style.top = _offset_top;
    const { width, ...rest_style } = style;

    const Table = ctx.components.table;

    return (
      <div
        ref={this.wrap_inst}
        style={{ width, position: "relative", transform: "matrix(1, 0, 0, 1, 0, 0)" }}
      >
        <S.Provider value={{ fixed: this.fixed, ...this.user_context }}>
          <Table {...rest} ref={this.inst} style={rest_style}>{children}</Table>
        </S.Provider>
      </div>
    );

  }

  public componentDidMount(): void {
    switch (this.fixed) {
      case e_FIXED.L:
        {
          /* registers the `_lvt_ctx` at the `ctx`. */
          vt_context.set(0 - ID, { _React_ptr: this } as VT_CONTEXT);
          ctx._lvt_ctx = vt_context.get(0 - ID);
          ctx._lvt_ctx.wrap_inst = this.wrap_inst;
          _Update_wrap_style(ctx._lvt_ctx, ctx.computed_h);
          const { scrollTop, scrollLeft } = ctx._React_ptr;
          _scroll_to(ctx._lvt_ctx, scrollTop, scrollLeft);
          _RC_fixed_rerender(ctx);
          this.wrap_inst.current.setAttribute("vt-left", `[${ID}]`);
        }
        return;

      case e_FIXED.R:
        {
          /* registers the `_rvt_ctx` at the `ctx`. */
          vt_context.set((1 << 31) + ID, { _React_ptr: this } as VT_CONTEXT);
          ctx._rvt_ctx = vt_context.get((1 << 31) + ID);
          ctx._rvt_ctx.wrap_inst = this.wrap_inst;
          _Update_wrap_style(ctx._rvt_ctx, ctx.computed_h);
          const { scrollTop, scrollLeft } = ctx._React_ptr;
          _scroll_to(ctx._rvt_ctx, scrollTop, scrollLeft);
          _RC_fixed_rerender(ctx);
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

    if (ctx.vt_state === e_VT_STATE.WAITING) {
      /* switch `SUSPENDED` to `WAITING` from VT's constructor. */
      if (children.length) {
        // just only switch to `RUNNING`.
        ctx.vt_state = e_VT_STATE.RUNNING;
      }
    } else {
      if (children.length) {
        // `vt_state` is changed by `VTRow`.
        console.assert(ctx.vt_state === e_VT_STATE.LOADED);
        ctx.vt_state = e_VT_STATE.RUNNING | e_VT_STATE.PROTECTION;
        this.scrollHook({
          target: { scrollTop: 0, scrollLeft: 0 },
          flags: SCROLLEVT_INIT,
        });
      } else {
        console.assert(ctx.vt_state === e_VT_STATE.INIT);
      }
    }

  }

  public componentDidUpdate(): void {

    if (this.fixed !== e_FIXED.NEITHER) return;

    if (ctx.vt_state === e_VT_STATE.INIT) {
      return;
    }

    if (ctx.vt_state === e_VT_STATE.LOADED) {
      // `LOADED` -> `RUNNING`.
      ctx.vt_state = e_VT_STATE.RUNNING | e_VT_STATE.PROTECTION;

      // force update for initialization
      this.scrollHook({
        target: { scrollTop: 0, scrollLeft: 0 },
        flags: SCROLLEVT_INIT,
      });
    }

    if (ctx.vt_state === e_VT_STATE.WAITING) {
      // Do you get the previous data back?
      if (this.props.children[2].props.children.length) {
        // Y, `WAITING` -> `RUNNING`.
        ctx.vt_state = e_VT_STATE.RUNNING;
      } else {
        // N, keep `WAITING` then just return.
        return;
      }
    }

    if (ctx.vt_state & e_VT_STATE.RUNNING) {
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

  public componentWillUnmount(): void {
    if (this.fixed !== e_FIXED.NEITHER) return;

    if (ctx.destroy) {
      vt_context.delete(0 - ID);        // fixed left
      vt_context.delete((1 << 31) + ID);// fixed right
      vt_context.delete(ID);
    } else {
      ctx.vt_state = e_VT_STATE.SUSPENDED;
      const { scrollTop, scrollLeft } = ctx._React_ptr;

      // free the instances.
      ctx._React_ptr = { scrollTop, scrollLeft };
      ctx._lvt_ctx = null;
      ctx._rvt_ctx = null;
    }

    // free the RAF.
    cancelAnimationFrame(this.HNDID_RAF);
    this.HNDID_RAF = 0;
  }

  public shouldComponentUpdate(nextProps: VTProps, nextState: any): boolean {
    return true;
  }

  private scrollHook(e: any): void {

    if (e) {
      // preprocess.
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

  private update_self(timestamp: number): void {

    if (!(ctx.vt_state & e_VT_STATE.RUNNING)) {
      return;
    }

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

    const scrollTop = e.target.scrollTop;
    const scrollLeft = e.target.scrollLeft;
    let flags = e.flags;

    if (ctx.debug) {
      console.debug(`[${ctx.id}][SCROLL] top: %d, left: %d`, scrollTop, scrollLeft);
    }

    let head: number, tail: number, top: number;
    try {
      // checks every tr's height, so it may be take some times...
      const offset = scroll_with_offset(
                       ctx,
                       scrollTop,
                       this.props.children[2].props.children[0].props);

      head = offset[0];
      tail = offset[1];
      top = offset[2];
    } catch {
      head = 0 | 0;
      tail = 0 | 0;
      top = 0 | 0;
    }

    const prev_head = ctx._offset_head,
          prev_tail = ctx._offset_tail,
          prev_top = ctx._offset_top;

    if (flags & SCROLLEVT_INIT) {
      log_debug(ctx, "SCROLLEVT_INIT");

      console.assert(scrollTop === 0 && scrollLeft === 0);

      _RC_rerender(ctx, top, head, tail, () => {
        scroll_to(ctx, 0, 0); // init this vtable by (0, 0).
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_INIT;
        flags &= ~SCROLLEVT_BARRIER;

        if (this.event_queue.length) this.scrollHook(null); // consume the next.
      })

      _RC_fixed_rerender(ctx);
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

      _RC_rerender(ctx, top, head, tail, () => {
        scroll_to(ctx, scrollTop, scrollLeft);
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RECOMPUTE;

        if (this.event_queue.length) this.scrollHook(null); // consume the next.
      });

      _RC_fixed_rerender(ctx);
      return;
    }

    if (flags & SCROLLEVT_RESTORETO) {
      log_debug(ctx, "SCROLLEVT_RESTORETO");

      _RC_rerender(ctx, top, head, tail, () => {
        // to force update style assign `WH` to 0.
        ctx.WH = 0;
        update_wrap_style(ctx, ctx.computed_h);

        scroll_to(ctx, scrollTop, scrollLeft);
        this.HNDID_RAF = 0;

        flags &= ~SCROLLEVT_BARRIER;
        flags &= ~SCROLLEVT_RESTORETO;

        if (this.event_queue.length) this.scrollHook(null); // consume the next.
      });

      _RC_fixed_rerender(ctx);
      return;
    }
    
    if (flags & SCROLLEVT_NATIVE) {
      log_debug(ctx, "SCROLLEVT_NATIVE");

      this.scrollLeft = scrollLeft;
      this.scrollTop = scrollTop;

      const _cb_scroll = (): void => {
        if (ctx.onScroll) {
          ctx.onScroll({
            top: scrollTop,
            left: scrollLeft,
            isEnd: e.endOfElements,
          });
        }
      }

      if (head === prev_head && tail === prev_tail && top === prev_top) {
        this.HNDID_RAF = 0;
        flags &= ~SCROLLEVT_NATIVE;
        _cb_scroll();
        return;
      }

      _RC_rerender(ctx, top, head, tail, () => {
        this.HNDID_RAF = 0;
        flags &= ~SCROLLEVT_NATIVE;
        _cb_scroll();
      });

      _RC_fixed_rerender(ctx);
      return;
    }
  }

  // returns the last state.
  public scroll(param?: { top: number; left: number }): { top: number; left: number } {

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

      if (ctx.vt_state === e_VT_STATE.RUNNING && ctx.row_count >= 0) {
        setTimeout(() => this.forceUpdate(), 0);
      }

      return {
        top: lst_top,
        left: lst_left,
      };
    } else {
      return { top: this.scrollTop, left: this.scrollLeft };
    }
  }

}


return { VTable, VTWrapper, VTRow, S };

} // _context

} // VT

function ASSERT_ID(id: number): void {
  console.assert(typeof id === "number" && id > 0);
}

function _set_components(ctx: VT_CONTEXT, components: TableComponents): void {
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

function init_vt(id: number): VT_CONTEXT {
  ASSERT_ID(id);
  const inside = vt_context.get(id) || {} as VT_CONTEXT;
  if (!inside._vtcomponents) {
    vt_context.set(id, inside);
    const { VTable, VTWrapper, VTRow, S } = VTContext.Switch(id);
    // set the virtual layer.
    inside._vtcomponents = {
      table: VTable,
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
    inside._store = S;
    // start -> `INIT`
    inside.vt_state = e_VT_STATE.INIT;
  }
  return inside;
}



export
function VTComponents(vt_opts: vt_opts): TableComponents {

  if (Object.hasOwnProperty.call(vt_opts, "height")) {
    console.warn(`The property \`vt_opts.height\` has been deprecated.
                  Now it depends entirely on \`scroll.y\`.`);
  }

  if (Object.hasOwnProperty.call(vt_opts, "reflection")) {
    console.warn(`The property \`vt_opts.reflection\`
                  will be deprecated in the next release.`);
  }

  const inside = init_vt(vt_opts.id);


  Object.assign(
    inside,
    {
      overscanRowCount: 5,
      debug: false,
      destroy: false,
    } as VT_CONTEXT,
    vt_opts);

  if (vt_opts.debug) {
    console.debug(`[${vt_opts.id}] calling VTComponents with`, vt_opts);
  }

  return inside._vtcomponents;
}

/**
 * @deprecated 
 */
export
function getVTContext(id: number): React.Context<vt_ctx> {
  console.warn("This function will be deprecated in the next release.");
  return init_vt(id)._store;
}

export
function setComponents(id: number, components: TableComponents): void {
  _set_components(init_vt(id), components);
}

/**
 * @deprecated
 */
export
function getVTComponents(id: number): TableComponents {
  console.warn("This function will be deprecated in the next release.")
  return init_vt(id).components;
}

export
function VTScroll(id: number, param?: { top: number; left: number }): { top: number; left: number } {
  ASSERT_ID(id);
  try {
    return vt_context.get(id).VTScroll(param);
  } catch {
    throw new Error(`[${id}]You haven't initialized this VT yet.`);
  }
}
