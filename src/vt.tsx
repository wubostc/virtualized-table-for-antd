
/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/


import * as React from "react";
import { TableComponents, CustomizeComponent } from "rc-table/es/interface";
import { TableProps as RcTableProps } from 'rc-table/es/Table';

export
interface vt_opts<RecordType> {
  readonly id: number;
  /**
   * @default 5
   */
  overscanRowCount?: number;

  /**
   * this only needs the scroll.y
   */
  scroll: RcTableProps<RecordType>['scroll'];

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


type body_t = {
  wrapper?: CustomizeComponent;
  row?: CustomizeComponent;
  cell?: CustomizeComponent;
}


interface VT_CONTEXT<RecordType = any> extends vt_opts<any> {
  _y: number; // will use the Table.scroll.y.
  _raw_y: number | string; // this is the same as the `Table.scroll.y`.

  _vtcomponents: TableComponents<RecordType>; // virtual layer.
  components: TableComponents<RecordType>;    // implementation layer.
  computed_h: number;
  vt_state: e_VT_STATE;
  possible_hight_per_tr: number;
  
  /* 0: needn't to recalculate, > 0: to add, < 0 to subtract */
  re_computed: number;
  row_height: number[];
  row_count: number;
  prev_row_count: number;
  wrap_inst: React.RefObject<HTMLDivElement>;

  // return the last state.
  VTScroll?: (param?: { top: number; left: number }) => { top: number; left: number };

  _React_ptr: any; // a pointer to the instance of `VTable`.


  WH: number;      // Wrapped Height.
                   // it's the newest value of `wrap_inst`'s height to update.

  HND_PAINT: number;      // a handle for Batch Repainting.

  /* stores [begin, end], `INIT`: [-1, -1] */
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
export const vt_context: Map<number, VT_CONTEXT<any>> = new Map();


/* overload __DIAGNOSIS__. */
function helper_diagnosis(ctx: VT_CONTEXT): void {
  if (ctx.hasOwnProperty("CLICK~__DIAGNOSIS__")) return;
  Object.defineProperty(ctx, "CLICK~__DIAGNOSIS__", {
    get() {
      console.debug("OoOoOoO DIAGNOSIS OoOoOoO");
      let expect_height = 0;
      for (let i = 0; i < ctx.row_count; ++i) {
        expect_height += ctx.row_height[i];
      }
      let color: string, explain: string;
      if (expect_height > ctx.computed_h) {
        color = "color:rgb(15, 179, 9)"; // green
        explain = "lower than expected";
      } else if (expect_height < ctx.computed_h) {
        color = "color:rgb(202, 61, 81)"; // red
        explain = "higher than expected";
      } else {
        color = "color:rgba(0, 0, 0, 0.85)";
        explain = "normal";
      }
      console.debug(`%c%d(%d)(${explain})`, color, expect_height, ctx.computed_h - expect_height);
      console.debug("OoOoOoOoOoOoOOoOoOoOoOoOo");
    },
    configurable: false,
    enumerable: false,
  });
}



function log_debug(ctx: VT_CONTEXT, msg: string): void {
  if (ctx.debug) {
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



function get_data(children: any[]): any[] {
  return children.find((child) => child && child.props.data).props.data;
}


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
function scroll_with_offset(ctx: VT_CONTEXT, top: number, scroll_y: VT_CONTEXT['scroll']['y']): [number, number, number] {

  const {
    row_height,
    row_count,
    possible_hight_per_tr,
    overscanRowCount,
  } = ctx;
  let overscan = overscanRowCount;

  if (typeof scroll_y === "number") {
    ctx._raw_y = scroll_y as number;
    ctx._y = ctx._raw_y;
  } else if (typeof scroll_y === "string") {
    /* a string, like "calc(100vh - 300px)" */
    if (ctx.debug)
      console.warn(`AntD.Table.scroll.y: ${scroll_y}, it may cause performance problems.`);
    ctx._raw_y = scroll_y;
    ctx._y = ctx.wrap_inst.current.parentElement.offsetHeight;
  } else {
    if (ctx.debug)
      console.warn(`AntD.Table.scroll.y: ${scroll_y}, it may cause performance problems.`);
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
}


// scrolls the parent element to specified location.
function scroll_to(ctx: VT_CONTEXT, top: number, left: number): void {
  if (!ctx.wrap_inst.current) return;
  const ele = ctx.wrap_inst.current.parentElement;
  /** ie */
  ele.scrollTop = top;
  ele.scrollLeft = left;
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

const S = React.createContext<any>({ fixed: 0 });


type VTRowProps = {
  children: any[];
};

class VTRow extends React.Component<VTRowProps> {
  private inst: React.RefObject<HTMLTableRowElement>;
  private last_index: number;
  public constructor(props: VTRowProps, context: React.ContextType<typeof S>) {
    super(props, context);
    this.inst = React.createRef();
    this.last_index = this.props.children[0].props.index;
  }

  public render(): JSX.Element {
    const { children, ...restProps } = this.props;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const Row = (ctx.components.body as body_t).row;
    return <Row {...restProps} ref={this.inst}>{children}</Row>;
  }

  public componentDidMount(): void {
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
  declare context: React.ContextType<typeof S>
  static contextType = S

  public render(): JSX.Element {
    const { children: [measureRow, rows], ...restProps } = this.props;
    let { _offset_head: head, _offset_tail: tail } = ctx;

    let trs: any[];
    const children = Array.isArray(rows) ? rows : []; // emptyNode if the rows isn't exists.
    let len = children.length;
    

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const Wrapper = (ctx.components.body as body_t).wrapper;

    switch (ctx.vt_state) {
      case e_VT_STATE.WAITING: // waitting for loading data as soon, just return this as following.
      case e_VT_STATE.SUSPENDED:
        trs = children.slice(head, tail);
        break;

      case e_VT_STATE.INIT:
        if (len >= 0) {
          /* init trs [0, 1] */
          trs = children.slice(head, tail);
          if (ctx.row_count !== len) {
            set_tr_cnt(ctx, len);
          }
        }
        break;

      default: {
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

        const { PSRB } = ctx;

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
          trs = [];
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
          trs = children.slice(head, tail);
        }

        /**
         * start srs_diff phase.
         * first up, Previous-Shadow-Rows below `trs`,
         * then Previous-Shadow-Rows above `trs`.
         */
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

        ctx.prev_row_count = ctx.row_count;
        break;
      }
    }

    return (
      <Wrapper {...restProps}>
        {measureRow}
        {trs}
      </Wrapper>
    );
  }

  public shouldComponentUpdate(nextProps: VTWrapperProps, nextState: any): boolean {
    return true;
  }

}




type VTProps = {
  children: any[];
  style: React.CSSProperties;
};

class VTable extends React.Component<VTProps> {

  private inst: React.RefObject<HTMLTableElement>;
  private wrap_inst: React.RefObject<HTMLDivElement>;
  private scrollTop: number;
  private scrollLeft: number;


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

    this.restoring = false;
  
    this.event_queue = [];
    this.nevent_queue = [];
    this.update_self = this.update_self.bind(this);

    this.HNDID_RAF = 0;

    ctx.VTScroll = this.scroll.bind(this);
    ctx._React_ptr = this;

    if (ctx.vt_state === e_VT_STATE.INIT) {
      ctx.possible_hight_per_tr = -1;
      ctx.computed_h = 0;
      ctx.re_computed = 0;
      ctx.row_height = [];
      ctx.row_count = 0;
      ctx.prev_row_count = 0;
  
      ctx.PSRB = [-1, -1];

      ctx._keys2insert = 0;
  
      helper_diagnosis(ctx);

      ctx._index_persister = new Set();

      ctx._offset_top = 0 | 0;
      ctx._offset_head = 0 | 0;
      ctx._offset_tail = 0 | 1;

      ctx.WH = 0;

    } else {
      console.assert(ctx.vt_state === e_VT_STATE.SUSPENDED);

      const { scrollTop, scrollLeft } = ctx._React_ptr;
      this.scrollTop = scrollTop;
      this.scrollLeft = scrollLeft;
    }
  }

  public render(): JSX.Element {
    const { _offset_top } = ctx;

    const { style, children, ...rest } = this.props;
    style.position = "relative";
    style.top = _offset_top;
    const { width, ...rest_style } = style;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const Table = ctx.components.table;

    return (
      <div
        ref={this.wrap_inst}
        style={{ width, position: "relative", transform: "matrix(1, 0, 0, 1, 0, 0)" }}
      >
        <S.Provider value={{ fixed: 1 }}>
          <Table {...rest} ref={this.inst} style={rest_style}>{children}</Table>
        </S.Provider>
      </div>
    );

  }

  public componentDidMount(): void {
    ctx.wrap_inst = this.wrap_inst;
    // ctx.re_computed = 0;
    this.wrap_inst.current.parentElement.onscroll = this.scrollHook.bind(this);
    // _Update_wrap_style(ctx, ctx.computed_h);
    this.wrap_inst.current.setAttribute("vt", `[${ID}]`);


    const len = ctx.row_count;

    if (ctx.vt_state === e_VT_STATE.SUSPENDED) {
      if (len > 0) {
        // just only switch to `RUNNING`. 
        ctx.vt_state = e_VT_STATE.RUNNING;
      } else {
        /* `SUSPENDED` -> `WAITING` */
        ctx.vt_state = e_VT_STATE.WAITING;
      }
    } else {
      if (len > 0) {
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
      if (get_data(this.props.children).length) {
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

    if (ctx.destroy) {
      vt_context.delete(ID);
    } else {
      ctx.vt_state = e_VT_STATE.SUSPENDED;
      const { scrollTop, scrollLeft } = ctx._React_ptr;

      // free the instances.
      ctx._React_ptr = { scrollTop, scrollLeft };
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
                       ctx.scroll.y);

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
        setTimeout(() => {
          if (ctx.vt_state === e_VT_STATE.RUNNING && ctx.row_count >= 0) {
            this.forceUpdate();
          }
        }, 0);
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


return { VTable, VTWrapper, VTRow };

} // _context

} // VT

function ASSERT_ID(id: number): void {
  console.assert(typeof id === "number" && id > 0);
}

function _set_components(ctx: VT_CONTEXT, components: TableComponents<any>): void {
  const { table, body, header } = components;
  ctx.components.body = { ...ctx.components.body, ...body };
  if (body && (body as body_t).cell) {
    (ctx._vtcomponents.body as body_t).cell = (body as body_t).cell;
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
    const { VTable, VTWrapper, VTRow } = VTContext.Switch(id);
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
    // start -> `INIT`
    inside.vt_state = e_VT_STATE.INIT;
  }
  return inside;
}



export
function VTComponents<RecordType>(vt_opts: vt_opts<RecordType>): TableComponents<RecordType> {
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

export
function setComponents<RecordType>(id: number, components: TableComponents<RecordType>): void {
  _set_components(init_vt(id), components);
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
