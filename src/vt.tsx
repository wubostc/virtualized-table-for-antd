
/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/


import { useRef, useState, useCallback, useContext, useEffect, useMemo, useImperativeHandle } from "react";
import * as React from "react";


type CustomizeComponent = React.FC<any>;

export
interface TableComponents {
  table?: CustomizeComponent;
  header?: {
      wrapper?: CustomizeComponent;
      row?: CustomizeComponent;
      cell?: CustomizeComponent;
  };
  body?: {
      wrapper?: CustomizeComponent;
      row?: CustomizeComponent;
      cell?: CustomizeComponent;
  };
}



/**
 * THE EVENTS OF SCROLLING.
 */
const SCROLLEVT_NULL       = (0<<0);
const SCROLLEVT_INIT       = (1<<0);
const SCROLLEVT_RECOMPUTE  = (1<<1);
const SCROLLEVT_NATIVE     = (1<<3);
const SCROLLEVT_BY_HOOK    = (1<<6);


// any events will be `SCROLLEVT_BY_HOOK` if the `ctx.f_top ===  TOP_CONTINUE`.
const TOP_CONTINUE = 0;
const TOP_DONE     = 1;



export
interface vt_opts {
  id?: number;
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
   * @default false
   */
  debug?: boolean;


  // pass -1 means scroll to the bottom of the table
  ref?: React.MutableRefObject<{
    scrollTo: (y: number) => void;
    scrollToIndex: (idx: number) => void;
  }>;
}

/**
 * `INIT` -> `LOADED` -> `RUNNING`
 */
enum e_VT_STATE {
  INIT       = 1,
  LOADED     = 2,
  RUNNING    = 4,
}


interface VT_CONTEXT extends vt_opts {
  _y: number; // an actual height of the HTML element '.ant-table-body'.
  _scroll_y: number | string; // this is the same as the `Table.scroll.y`.

  _vtcomponents: TableComponents; // virtual layer.
  components: TableComponents;    // implementation layer.
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


  computed_h: number;             // a cache for the WH.
  WH: number;      // Wrapped Height.
                   // it's the newest value of `wrap_inst`'s height to update.

  HND_PAINT: number;      // a handle for Batch Repainting.


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

  top: number;
  left: number;
  evt: number;
  end: boolean;

  final_top: number;
  f_final_top: number;

  update_count: number;

  on_update_wrap_style: () => void; /* it will be called when the `_y` is 0. */
}


const row_idx = typeof Symbol === 'function' ? Symbol.for('idx') : '$$idx';


function default_context(): VT_CONTEXT {
  return {
    vt_state: e_VT_STATE.INIT,
    possible_hight_per_tr: -1,
    computed_h: 0,
    re_computed: 0,
    row_height: [],
    row_count: 0,
    prev_row_count: 0,
    _offset_top: 0 | 0,
    _offset_head: 0 | 0,
    _offset_tail: 0 | 1,
    WH: 0,                 // the wrapper's height
    top: 0,
    left: 0,
    evt: SCROLLEVT_NULL,
    end: false,
    final_top: 0,
    f_final_top: TOP_DONE,
    update_count: 0,
  } as unknown as VT_CONTEXT;
}



/* overload __DIAGNOSIS__. */
function helper_diagnosis(ctx: VT_CONTEXT): void {
  if (Object.prototype.hasOwnProperty.call(ctx, "CLICK~__DIAGNOSIS__")) return;
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


type SimEvent = {
  target: { scrollTop: number; scrollLeft: number };
  flag: number;
  end?: boolean;
};

// the factory function returns a SimEvent.
function make_evt(ne: Event): SimEvent {
  const target: any = ne.target;
  return {
    target: {
      scrollTop: target.scrollTop,
      scrollLeft: target.scrollLeft,
    },
    end: target.scrollHeight - target.clientHeight === Math.round(target.scrollTop),
    flag: SCROLLEVT_NATIVE,
  };
}



/**
 * Default Implementation Layer.
 */
/** AntD.TableComponent.table */
const TableImpl = React.forwardRef<any>(function TableImpl(props, ref) {
  return <table ref={ref} {...props} />;
});
/** AntD.TableComponent.body.wrapper */
function WrapperImpl(props: any): JSX.Element {
  return <tbody {...props} />; 
}
/** AntD.TableComponent.body.row */
const RowImpl = React.forwardRef<any>(function RowImpl(props, ref) {
  return <tr ref={ref} {...props} />;
});


/**
 * O(n)
 * returns offset: [head, tail, top] 
 */
function scroll_with_offset(ctx: VT_CONTEXT, top: number): [number, number, number] {

  const {
    row_height,
    row_count,
    overscanRowCount,
  } = ctx;

  ctx._scroll_y = '';

  if (ctx.scroll) {
    const t = typeof ctx.scroll.y;
    if (t === 'number' || t === 'string')
      ctx._scroll_y = ctx.scroll.y;
  }

  if (typeof ctx._scroll_y === "number") {
    ctx._y = ctx._scroll_y;
  } else if (typeof ctx._scroll_y === "string") {
    /* a string, like "calc(100vh - 300px)" */
    // this offsetHeight may be 0!
    ctx._y = ctx.wrap_inst.current.parentElement.offsetHeight;
  } else {
    console.warn("VT: did you forget to set `scroll.y`?");
    ctx._y = ctx.wrap_inst.current.parentElement.offsetHeight;
  }

  console.assert(ctx._y >= 0);
  // to calc `_top` with `row_height` and `overscan`.
  let _top = 0, i = 0, j = 0;
  // the height to render.
  let torender_h = 0

  // scroll to the bottom of the table.
  if (top === -1 && row_count > 0) {
    i = row_count;
    while (i > 0 && torender_h < ctx._y) {
      torender_h += row_height[--i];
    }

    return [0 | i, 0 | row_count, 0 | ctx.computed_h - torender_h];
  }

  for (; i < row_count && _top < top; ++i) {
    _top += row_height[i];
  }

  // start j from the visible area
  j = i;
  for (; j < row_count && torender_h < ctx._y; ++j) {
    torender_h += row_height[j];
  }

  // keep offset row on top and bottom
  let overscan = overscanRowCount! < 0 ? 0 : overscanRowCount!;
  while (i > 0 && overscan--) {
    _top -= row_height[--i];
  }
  j += overscanRowCount!;
  
  if (j > row_count) j = row_count;
  // returns [head, tail, top].
  return [0 | i, 0 | j, 0 | _top];
}


// set the variables for offset top/head/tail.
function set_offset(
  ctx: VT_CONTEXT, top: number, head: number, tail: number): void
{
  ctx._offset_top = 0 | top;
  ctx._offset_head = 0 | head;
  ctx._offset_tail = 0 | tail;
}


function set_scroll(ctx: VT_CONTEXT,
  top: number, left: number, evt: number, end: boolean): void
{
  ctx.top = top;
  ctx.left = left;
  ctx.evt = evt;
  ctx.end = end;
}


function update_wrap_style(ctx: VT_CONTEXT, h: number): void {
  if (ctx.WH === h) return;
  ctx.WH = h;
  const s = ctx.wrap_inst.current.style;
  s.height = h ?
    (s.maxHeight = h + 'px', s.maxHeight) :
    (s.maxHeight = 'unset', s.maxHeight);
  ctx.on_update_wrap_style();
}


// scrolls the parent element to specified location.
function scroll_to(ctx: VT_CONTEXT, top: number, left: number): void {
  if (!ctx.wrap_inst.current) return;
  const ele = ctx.wrap_inst.current.parentElement!;
  /** ie */
  ele.scrollTop = top;
  ele.scrollLeft = Math.max(left, ele.scrollLeft);
}



function _repainting(ctx: VT_CONTEXT, ms: number): number {
  const fn = (): void => {
    log_debug(ctx, "REPAINTING");

    if (ctx.vt_state === e_VT_STATE.RUNNING && ctx.wrap_inst.current) {
      // output to the buffer
      update_wrap_style(ctx, ctx.computed_h);
    }

    // free this handle manually.
    ctx.HND_PAINT = 0;
  }

  return ms < 0 ? window.requestAnimationFrame(fn) : window.setTimeout(fn, ms);
}


// a wrapper function for `_repainting`.
function repainting(ctx: VT_CONTEXT): void {
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx, -1);
}


function srs_expand(ctx: VT_CONTEXT, len: number, prev_len: number, fill_value: number): void {
  const slen = len - prev_len;
  const shadow_rows = new Array(slen).fill(fill_value);
  ctx.row_height = ctx.row_height.concat(shadow_rows);
  ctx.computed_h += slen * fill_value;
}


function srs_shrink(ctx: VT_CONTEXT, len: number, prev_len: number): void {
  if (len === 0) {
    ctx.computed_h = 0;
    ctx.row_height.length = 0;
    ctx.top = 0;
    return;
  }
  const rows = ctx.row_height;
  let h2shrink = 0;
  for (let i = len; i < prev_len; ++i) {
    h2shrink += rows[i];
  }
  ctx.computed_h -= h2shrink;
}


function set_tr_cnt(ctx: VT_CONTEXT, n: number): void {
  ctx.re_computed = n - ctx.row_count;
  ctx.prev_row_count = ctx.row_count;
  ctx.row_count = n;
}


interface VTableProps extends React.FC {
  style: React.CSSProperties;
  context: React.Context<VT_CONTEXT>;
  [prop: string]: any;
}


function VTable(props: VTableProps, ref: React.Ref<{
  scrollTo: (y: number) => void;
  scrollToIndex: (idx: number) => void;
}>) {
  const { style, context, ...rest } = props;


  // force update this vt.
  const force = useState(0);

  const ref_func = useRef<() => void>(() => {});


  /*********** DOM ************/
  const wrap_inst = useMemo(() => React.createRef<HTMLDivElement>(), []);

  /*********** context ************/
  const ctx = useContext(context);
  useMemo(() => {
    Object.assign(ctx, default_context());
    if (ctx.wrap_inst && ctx.wrap_inst.current) {
      ctx.wrap_inst.current.parentElement!.onscroll = null;
    }
    ctx.wrap_inst = wrap_inst;
    ctx.top = ctx.initTop!;
    ctx.on_update_wrap_style = () => {
      if (ctx._y === 0 && `${ctx._scroll_y}`.length) {
        scroll_hook({
          flag: SCROLLEVT_BY_HOOK,
          target: {
            scrollTop: ctx.top,
            scrollLeft: ctx.left,
          }
        })
      }
    }
    helper_diagnosis(ctx);
  }, []);


  /*********** scroll event ************/
  const event_queue = useRef<SimEvent[]>([]).current;

  const HND_RAF = useRef(0); // handle of requestAnimationFrame

  /* eslint-disable prefer-const */
  let RAF_update_self: FrameRequestCallback;

  /*********** scroll hook ************/
  const scroll_hook = useCallback((e: SimEvent | null) => {
    if (ctx.vt_state !== e_VT_STATE.RUNNING) return;

    if (e) {
      event_queue.push(e);

      if (ctx.f_final_top === TOP_CONTINUE) {
        e.flag = SCROLLEVT_BY_HOOK;
        return RAF_update_self(0);
      }
    }

    if (event_queue.length) {
      if (HND_RAF.current) cancelAnimationFrame(HND_RAF.current);
      // requestAnimationFrame, ie >= 10
      HND_RAF.current = requestAnimationFrame(RAF_update_self);
    }
  }, []);
  const scroll_hook_native = useCallback((e: Event) => {
    scroll_hook(make_evt(e));
  }, []);

  /* requestAnimationFrame callback */
  RAF_update_self = useCallback((_: number) => {
    if (ctx.vt_state !== e_VT_STATE.RUNNING) return;

    const evq  = event_queue;

    let e: SimEvent;
    // consume the `evq` first.
    if (evq.length) {
      e = evq.shift()!;
    } else {
      return;
    }

    let etop = e.target.scrollTop;
    let eleft = e.target.scrollLeft;
    const flag = e.flag;

    if (ctx.debug) {
      console.debug(`[${ctx.id}][SCROLL] top: %d, left: %d`, etop, eleft);
    }


    // checks every tr's height, which will take some time...
    const offset = scroll_with_offset(
                     ctx,
                     ctx.f_final_top === TOP_CONTINUE ? ctx.final_top : etop);

    const head = offset[0];
    const tail = offset[1];
    const top = offset[2];

    const prev_head = ctx._offset_head;
    const prev_tail = ctx._offset_tail;
    const prev_top = ctx._offset_top;

    let end: boolean;

    switch (flag) {
      case SCROLLEVT_INIT:
        log_debug(ctx, "SCROLLEVT_INIT");
        end = false;
        break;

      case SCROLLEVT_BY_HOOK:
        log_debug(ctx, "SCROLLEVT_BY_HOOK");

        if (head === prev_head && tail === prev_tail && top === prev_top) {
          ctx.f_final_top = TOP_DONE;
          if (ctx.final_top === -1) etop = ctx.computed_h - ctx._y;
          end = true;
        } else {
          if (ctx.final_top === -1) etop = top;
          end = false;
        }

        break;

      case SCROLLEVT_RECOMPUTE:
        log_debug(ctx, "SCROLLEVT_RECOMPUTE");

        if (head === prev_head && tail === prev_tail && top === prev_top) {
          HND_RAF.current = 0;

          if (event_queue.length) scroll_hook(null); // consume the next.
          return;
        }

        end = false;
        break;


      case SCROLLEVT_NATIVE:
        log_debug(ctx, "SCROLLEVT_NATIVE");

        HND_RAF.current = 0;
        if (ctx.onScroll) {
          ctx.onScroll({
            top: etop,
            left: eleft,
            isEnd: e.end!,
          });
        }

        if (head === prev_head && tail === prev_tail && top === prev_top) {
          return;
        }

        end = e.end!;
        break;
    }

    set_offset(ctx, top, head, tail);
    set_scroll(ctx, etop, eleft, flag, end!);
    force[1](++ctx.update_count);
  }, []);


  // expose to the parent components you are using.
  useImperativeHandle(ref, () => {
    // `y === -1` indicates you need to scroll to the bottom of the table.
    const scrollTo = (y: number) => {
      ctx.f_final_top = TOP_CONTINUE;
      ctx.final_top = y;
      scroll_hook({
        target: { scrollTop: y, scrollLeft: -1 },
        flag: SCROLLEVT_BY_HOOK,
      });
    }
    return {
      scrollTo: (y) => {
        ref_func.current = () => scrollTo(y);
        ref_func.current();
      },
      scrollToIndex: (idx) => {
        ref_func.current = () => {
          if (idx > ctx.row_count - 1) idx = ctx.row_count - 1;
          if (idx < 0) idx = 0;
          let y = 0;
          for (let i = 0; i < idx; ++i) {
            y += ctx.row_height[i];
          }
          scrollTo(y);
        }
        ref_func.current();
      }
    }
  }, []);


  useEffect(() => {
    ctx.wrap_inst.current!.parentElement!.onscroll = scroll_hook_native;
  }, [wrap_inst]);


  // update DOM style.
  useEffect(() => {
    switch (ctx.evt) {
      case SCROLLEVT_BY_HOOK:
        if (ctx.f_final_top === TOP_CONTINUE) {
          ref_func.current()
        } else {
          scroll_to(ctx, ctx.top, ctx.left);
        }
        break;
      case SCROLLEVT_INIT:
      case SCROLLEVT_RECOMPUTE:
        scroll_to(ctx, ctx.top, ctx.left);
        if (event_queue.length) RAF_update_self(0); // consume the next.
        break;
    }
  }, [force[0]/* for performance. */]);


  useEffect(() => {
    switch (ctx.vt_state) {
      case e_VT_STATE.INIT:
        // init vt without the rows.
        break;

      case e_VT_STATE.LOADED: // changed by VTRow only.
        ctx.vt_state = e_VT_STATE.RUNNING;

        // force update.
        scroll_hook({
          target: { scrollTop: ctx.top, scrollLeft: 0 },
          flag: SCROLLEVT_INIT,
        });
        break;

      case e_VT_STATE.RUNNING:
        if (ctx.re_computed !== 0) { // rerender
          ctx.re_computed = 0;
          scroll_hook({
            target: { scrollTop: ctx.top, scrollLeft: ctx.left },
            flag: SCROLLEVT_RECOMPUTE,
          });
        }
        break;
    }
  });


  style.position = "relative";
  style.top = ctx._offset_top;
  const { width, ...rest_style } = style;

  const wrap_style = useMemo<React.CSSProperties>(
    () => ({
      width,
      minWidth: "100%",
      position: "relative",
      transform: "matrix(1, 0, 0, 1, 0, 0)",
    }),
    [width]
  );

  const Table = ctx.components.table!;

  return (
    <div
      ref={wrap_inst}
      style={wrap_style}
    >
      <context.Provider value={{...ctx}}>
        <Table {...rest} style={rest_style} />
      </context.Provider>
    </div>
  );

}


interface VWrapperProps extends React.FC {
  style: React.CSSProperties;
  ctx: VT_CONTEXT;
  [prop: string]: any;
}

function VWrapper(props: VWrapperProps) {
  const { children: c, ctx, ...restProps } = props;
  const measureRow = c[0];
  const rows = c[1];

  const Wrapper = ctx.components.body!.wrapper!;

  // reference https://github.com/react-component/table/blob/master/src/Body/index.tsx#L6
  let len = Array.isArray(rows) ? rows.length : 0;

  let { _offset_head: head, _offset_tail: tail } = ctx;

  type RowType = React.ReactElement<{
    indent: number;
    record: Record<typeof row_idx, unknown> & object;
  }>

  let trs: RowType[] = [];

  switch (ctx.vt_state) {
    case e_VT_STATE.INIT:
      if (len >= 0) {
        console.assert(head === 0);
        console.assert(tail === 1);
        if (Array.isArray(rows)) {
          trs = rows.slice(head, tail);
          trs[0].props.record[row_idx] = 0;
        } else {
          trs = rows;
        }
        ctx.re_computed = len;
        ctx.prev_row_count = len;
        ctx.row_count = len;
      }
      break;

    case e_VT_STATE.RUNNING: {
      if (tail > len) {
        const offset = tail - len;
        tail -= offset;
        head -= offset;
        if (head < 0) head = 0;
        if (tail < 0) tail = 0;
        // update the `head` and `tail`.
        set_offset(ctx,
          ctx._offset_top/* NOTE: invalided param, just to fill for this param */,
          head, tail);
      }

      if (ctx.row_count !== len) {
        set_tr_cnt(ctx, len);
      }

      len = ctx.row_count;
      const prev_len = ctx.prev_row_count;

      /* shadow-rows rendering phase. */
      if (len < prev_len) {
        srs_shrink(ctx, len, prev_len);
      } else if (len > prev_len) {
        const row_h = ctx.row_height;
        if ((len - row_h.length) > 0) {
          srs_expand(ctx, len, row_h.length, ctx.possible_hight_per_tr);
        } else {
          // calculate the total height quickly.
          row_h.fill(ctx.possible_hight_per_tr, prev_len, len);
          ctx.computed_h += ctx.possible_hight_per_tr * (len - prev_len);
        }
      }

      /**
       * tree-structure if indent is not 0
       *        |  idx                              
       *        |   0   || 0a                                 0  || 0a
       *        |   1   || 0b     --collapse occurred--       1  || 0b
       *        |   2   || - 1                             5->2  || 0c
       *  head  |   3   || - 1                             6->3  || 0d
       *        |   4   ||   - 2                           7->4  || 0e
       *        |   5   || 0c                              8->5  || - 1
       *        |   6   || 0d                              9->6  ||   - 2
       *        |   7   || 0e                             10->7  ||     - 3
       *  tail  |   8   || - 1                            11->8  || 0f
       *        |   9   ||  - 2     
       *        |  10   ||    - 3      
       *        |  11   || 0f     
       *        |  12   ||    
       */
      if (len) {
        let idx = head;
        trs = rows.slice(idx, tail);
        trs.forEach(el => el.props.record[row_idx] = idx++);
      } else {
        trs = rows;
      }

      ctx.prev_row_count = ctx.row_count;
    }
      break;

    case e_VT_STATE.LOADED:
      console.assert(false);
      break;
  }


  return (
    <Wrapper {...restProps}>
      {measureRow}
      {trs}
    </Wrapper>
  );
}

interface VRowProps extends React.FC {
  style: React.CSSProperties;
  context: VT_CONTEXT;
  [prop: string]: any;
}


function VTRow(props: VRowProps) {

  const inst = React.createRef<HTMLTableRowElement>();

  const { context, ...rest } = props;

  const ctx = context;

  const children = props.children;

  const Row = ctx.components.body!.row!;

  if (!Array.isArray(children)) {
    // https://github.com/react-component/table/blob/master/src/Body/BodyRow.tsx#L211
    // https://github.com/react-component/table/blob/master/src/Body/index.tsx#L105
    // only empty or expanded row...
    return <Row {...rest}>{children}</Row>;
  }

  const row_props = children[0].props;
  const index: number = row_props.record[row_idx];
  const last_index = useRef(index);

  const expanded_cls = useMemo(() => `.${row_props.prefixCls}-expanded-row`, [row_props.prefixCls]);

  useEffect(() => {
    if (ctx.vt_state === e_VT_STATE.RUNNING) {
      // apply_h(ctx, index, inst.current.offsetHeight, "dom");
      repainting(ctx);
    } else {
      console.assert(ctx.vt_state === e_VT_STATE.INIT);
      ctx.vt_state = e_VT_STATE.LOADED;
      ctx.possible_hight_per_tr = inst.current!.offsetHeight;
      srs_expand(ctx, ctx.row_count, 0, ctx.possible_hight_per_tr);
      // create a timeout task.
      _repainting(ctx, 16);
    }

    return () => repainting(ctx);
  }, []);


  useEffect(() => {
    const rowElm = inst.current;

    // for nested(expanded) elements don't calculate height and add on cache as its already accommodated on parent row
    // if (!rowElm.matches(".ant-table-row-level-0")) return;

    let h = rowElm!.offsetHeight;
    let sibling = rowElm!.nextSibling as HTMLTableRowElement;
    // https://github.com/react-component/table/blob/master/src/Body/BodyRow.tsx#L212
    // include heights of all expanded rows, in parent rows
    while (sibling && sibling.matches(expanded_cls)) {
      h += sibling.offsetHeight;
      sibling = sibling.nextSibling as HTMLTableRowElement;
    }
    
    const curr_h = ctx.row_height[index];
    const last_h = ctx.row_height[last_index.current];

    ctx.computed_h -= curr_h;
    ctx.computed_h += last_h;
    ctx.computed_h += h - last_h;
    ctx.row_height[index] = h;

    repainting(ctx);
  });

  return <Row {...rest} ref={inst} />;
}




export
function _set_components(ctx: VT_CONTEXT, components: TableComponents): void {
  const { table, body, header } = components;
  ctx.components.body = { ...ctx.components.body, ...body };
  if (body && body.cell) {
    ctx._vtcomponents.body!.cell = body.cell;
  } 
  if (header) {
    ctx.components.header = header;
    ctx._vtcomponents.header = header;
  }
  if (table) {
    ctx.components.table = table;
  }
}

export
function init(fnOpts: () => vt_opts, deps: React.DependencyList): VT_CONTEXT {
  const ctx = useRef(React.createContext<VT_CONTEXT>({ } as VT_CONTEXT)).current;
  const ctx_value = useContext(ctx);
  const default_ref: vt_opts['ref'] = useRef({
    scrollTo: (y: number) => {},
    scrollToIndex: (idx: number) => {},
  });
  useMemo(() => {
    return Object.assign(
      ctx_value,
      {
        id: +new Date(),
        initTop: 0,
        overscanRowCount: 5,
        debug: false,
        ref: default_ref,
      },
      fnOpts());
    }, deps);

  useMemo(() => {
    const VTable2 = React.forwardRef(VTable);

    // set the virtual layer.
    ctx_value._vtcomponents = {
      table: (props) => <VTable2 {...props} context={ctx} ref={ctx_value.ref} />,
      body: {
        wrapper: (props: any) => {
          return (
            <ctx.Consumer>
              {(/* value */) => {
                return (
                  <VWrapper {...props} ctx={ctx_value}/>
                );
              }}
            </ctx.Consumer>
          )
        },
        row: (props) => <VTRow {...props} context={ctx_value} />,
      }
    };
    // set the default implementation layer.
    ctx_value.components = {};
    _set_components(ctx_value, {
      table: TableImpl,
      body: {
        wrapper: WrapperImpl,
        row: RowImpl,
      }
    });
    // start -> `INIT`
    ctx_value.vt_state = e_VT_STATE.INIT;
  }, []);

  return ctx_value;
}

