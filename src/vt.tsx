/* eslint-disable no-console */

/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/


import { useRef, useState, useCallback, useContext, useEffect, useMemo, useImperativeHandle, useLayoutEffect } from 'react'
import * as React from 'react'


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
const SCROLLEVT_NULL       = (0<<0)
const SCROLLEVT_INIT       = (1<<0)
const SCROLLEVT_RECOMPUTE  = (1<<1)
const SCROLLEVT_NATIVE     = (1<<3)
const SCROLLEVT_BY_HOOK    = (1<<6)


// any events will be `SCROLLEVT_BY_HOOK` if the `ctx.f_top ===  TOP_CONTINUE`.
const TOP_CONTINUE = 0
const TOP_DONE     = 1



interface RefObject {
  scrollTo: (y: number) => void;
  scrollToIndex: (idx: number) => void;
}

export
interface VtOpts {
  id?: number | string;
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
   * Offset of the table when isEnd becomes true.
   * @default 0
   */
  offset?: number;

  /**
   * @default false
   */
  debug?: boolean;


  // pass -1 means scroll to the bottom of the table
  ref?: React.MutableRefObject<RefObject>;
}

/**
 * `INIT` -> `LOADED` -> `RUNNING`
 */
enum e_VT_STATE {
  INIT       = 1,
  LOADED     = 2,
  RUNNING    = 4,
}



type SimEvent = {
  target: { scrollTop: number; scrollLeft: number };
  flag: number;
  end?: boolean;
};



interface VT_CONTEXT extends VtOpts {
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
  HND_RAF: number;        // a handler of requestAnimationFrame


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

  indexMap: WeakMap<object, number>;

  // computing queue.
  cq: { index: number; func: () => void }[];

  retry_count: number;
}

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
    indexMap: new WeakMap(),
    HND_PAINT: 0,
    retry_count: 5,
  } as VT_CONTEXT
}



/* overload __DIAGNOSIS__. */
function helper_diagnosis(ctx: VT_CONTEXT): void {
  if (Object.prototype.hasOwnProperty.call(ctx, 'CLICK~__DIAGNOSIS__')) return
  function diagnosis(flag: boolean) {
      let expect_height = 0
      for (let i = 0; i < ctx.row_count; ++i) {
        expect_height += ctx.row_height[i]
      }
      let color: string, explain: string
      if (expect_height > ctx.computed_h) {
        color = 'color:rgb(15, 179, 9)' // green
        explain = 'lower than expected'
      } else if (expect_height < ctx.computed_h) {
        color = 'color:rgb(202, 61, 81)' // red
        explain = 'higher than expected'
      } else {
        color = 'color:rgba(0, 0, 0, 0.85)'
        explain = 'normal'
      }
      const ret = ctx.computed_h - expect_height
      if (flag) {
        console.debug('OoOoOoO DIAGNOSIS OoOoOoO')
        console.debug(`%c%d(%d)(${explain})`, color, expect_height, ctx.computed_h - expect_height)
        console.debug('OoOoOoOoOoOoOOoOoOoOoOoOo')
      }
      return ret
  }
  Object.defineProperty(ctx, 'CLICK~__DIAGNOSIS__', {
    get() {
      diagnosis(true)
    },
    configurable: false,
    enumerable: false,
  })
  function cb() {
    if (diagnosis(false) !== 0) {
      window.alert('vt: an error occurred!')
      return
    }
    window.requestIdleCallback ? window.requestIdleCallback(cb) : window.setTimeout(cb)
  }
  ctx.debug && cb()
}



function log_debug(ctx: VT_CONTEXT, msg: string): void {
  if (ctx.debug) {
    if (msg[0] === '+') {
      return console.debug(msg.slice(1))
    }
    const d = new Date()
    const tid = `${d.toLocaleTimeString()}.${d.getMilliseconds()}`
    console.debug(`%c[${ctx.id}][${tid}][${msg}]`, 'color:#a00', ctx)
  }
}




/**
 * Default Implementation Layer.
 */
/** AntD.TableComponent.table */
const TableImpl = React.forwardRef<any>(function TableImpl(props, ref) {
  return <table ref={ref} {...props} />
})
/** AntD.TableComponent.body.wrapper */
function WrapperImpl(props: any): JSX.Element {
  return <tbody {...props} />
}
/** AntD.TableComponent.body.row */
const RowImpl = React.forwardRef<any>(function RowImpl(props, ref) {
  return <tr ref={ref} {...props} />
})


/**
 * O(n)
 * returns offset: [head, tail, top]
 */
function scroll_with_offset(ctx: VT_CONTEXT, top: number): [number, number, number] {

  const {
    row_height,
    row_count,
    overscanRowCount,
  } = ctx

  ctx._scroll_y = ctx.scroll.y

  if (typeof ctx._scroll_y === 'number') {
    ctx._y = ctx._scroll_y
  } else if (typeof ctx._scroll_y === 'string') {
    /* a string, like "calc(100vh - 300px)" */
    // this offsetHeight may be 0!
    ctx._y = ctx.wrap_inst.current.parentElement.offsetHeight
  } else {
    console.assert(false, 'VT: did you forget to set `scroll.y`?')
    ctx._y = ctx.wrap_inst.current.parentElement.offsetHeight
  }

  console.assert(ctx._y >= 0)
  // to calc `_top` with `row_height` and `overscan`.
  let _top = 0, i = 0, j = 0
  // the height to render.
  let torender_h = 0

  // scroll to the bottom of the table.
  if (top === -1 && row_count > 0) {
    i = row_count
    while (i > 0 && torender_h < ctx._y) {
      torender_h += row_height[--i]
    }

    return [0 | i, 0 | row_count, 0 | ctx.computed_h - torender_h]
  }

  for (; i < row_count && _top < top; ++i) {
    _top += row_height[i]
  }

  // start j from the visible area
  j = i
  for (; j < row_count && torender_h < ctx._y; ++j) {
    torender_h += row_height[j]
  }

  // keep offset row on top and bottom
  let overscan = overscanRowCount! < 0 ? 0 : overscanRowCount!
  while (i > 0 && overscan--) {
    _top -= row_height[--i]
  }
  j += overscanRowCount!

  if (j > row_count) j = row_count
  // returns [head, tail, top].
  return [0 | i, 0 | j, 0 | _top]
}


// set the variables for offset top/head/tail.
function set_offset(
  ctx: VT_CONTEXT, top: number, head: number, tail: number): void
{
  ctx._offset_top = 0 | top
  ctx._offset_head = 0 | head
  ctx._offset_tail = 0 | tail
}


function set_scroll(ctx: VT_CONTEXT,
  top: number, left: number, evt: number, end: boolean): void
{
  ctx.top = top
  ctx.left = left
  ctx.evt = evt
  ctx.end = end
}



// scrolls the parent element to specified location.
function scroll_to(ctx: VT_CONTEXT, top: number, left: number): void {
  if (!ctx.wrap_inst.current) return
  const ele = ctx.wrap_inst.current.parentElement!
  /** ie */
  ele.scrollTop = top
  ele.scrollLeft = Math.max(left, ele.scrollLeft)
}



function repainting(ctx: VT_CONTEXT): number {
  if (ctx.HND_PAINT) return

  const { cq, wrap_inst } = ctx

  const fn = (): void => {
    ctx.HND_PAINT = 0

    // BATCH PROCESS in once time...
    for (let i = 0; i < cq.length; ++i) {
      if (cq[i].index >= ctx._offset_head && cq[i].index < ctx._offset_tail) {
        cq[i].func()
      }
    }

    if (ctx.vt_state !== e_VT_STATE.RUNNING || !wrap_inst.current) return

    const h = ctx.computed_h

    if (ctx.WH === h) return

    ctx.WH = h
    const s = wrap_inst.current.style
    s.height = h ?
      (s.maxHeight = h + 'px', s.maxHeight) :
      (s.maxHeight = 'unset', s.maxHeight)

    ctx.on_update_wrap_style()
  }


  ctx.HND_PAINT = ctx.evt === SCROLLEVT_NATIVE ? window.requestAnimationFrame(fn)
                                : window.setTimeout(fn)
}


function srs_expand(ctx: VT_CONTEXT, len: number, prev_len: number, fill_value: number): void {
  const slen = len - prev_len
  const shadow_rows = new Array(slen).fill(fill_value)
  ctx.row_height = ctx.row_height.concat(shadow_rows)
  ctx.computed_h += slen * fill_value
}


function srs_shrink(ctx: VT_CONTEXT, len: number, prev_len: number): void {
  if (len === 0) {
    ctx.computed_h = 0
    ctx.row_height.length = 0
    ctx.top = 0
    return
  }
  const rows = ctx.row_height
  let h2shrink = 0
  for (let i = len; i < prev_len; ++i) {
    h2shrink += rows[i]
  }
  ctx.computed_h -= h2shrink
}


function set_tr_cnt(ctx: VT_CONTEXT, n: number): void {
  ctx.re_computed = n - ctx.row_count
  ctx.prev_row_count = ctx.row_count
  ctx.row_count = n
}


interface VTableProps {
  style: React.CSSProperties;
  context: React.Context<VT_CONTEXT>;
  children: React.ReactNode;
}


const VTable: React.ForwardRefRenderFunction<RefObject, VTableProps> = (props, ref) => {
  const { style, context, ...rest } = props


  // force update this vt.
  const force = useState(0)

  const ref_func = useRef<() => void>(() => {})

  // eslint-disable-next-line prefer-const
  let scroll_hook: (e?: SimEvent | Event) => void

  /*********** DOM ************/
  const wrap_inst = useMemo(() => React.createRef<HTMLDivElement>(), [])

  /*********** context ************/
  const ctx = useContext(context)
  useMemo(() => {
    Object.assign(ctx, default_context())
    if (ctx.wrap_inst && ctx.wrap_inst.current) {
      ctx.wrap_inst.current.parentElement.removeEventListener('scroll', scroll_hook as any)
    }
    ctx.wrap_inst = wrap_inst
    ctx.top = ctx.initTop
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

    if (process.env.NODE_ENV !== 'production')
      helper_diagnosis(ctx)

    ctx.cq = []
    let pfirst = 0
    // let plast = 0
    let circleBufferSize = 0
    ctx.cq.push = (item) => {
      if (ctx.vt_state !== e_VT_STATE.RUNNING) return

      const size = ctx._offset_tail - ctx._offset_head + ctx.overscanRowCount * 2 + 10
      circleBufferSize = Math.max(circleBufferSize, size)

      if (pfirst > circleBufferSize) {
        pfirst = 0
      }

      ctx.cq[pfirst++] = item

      return 0
    }
  }, [])


  /*********** scroll event ************/
  const event_queue = useRef<SimEvent[]>([]).current


  /* eslint-disable prefer-const */
  let RAF_update_self: FrameRequestCallback

  /*********** scroll hook ************/
  scroll_hook = useCallback((ev?: SimEvent | Event) => {
    if (ctx.vt_state !== e_VT_STATE.RUNNING) return

    const t0 = performance.now()

    if (ev) {
      if ('flag' in ev) {
        event_queue.push(ev)
      } else {
        const target = ev.target as any
        const top = Math.max(target.scrollTop, 0)

        event_queue.push({
          target: {
            scrollTop: top,
            scrollLeft: target.scrollLeft,
          },
          end: Math.abs(target.scrollHeight - target.clientHeight - Math.round(top)) <= (ctx.offset || 0),
          flag: SCROLLEVT_NATIVE,
        })
      }


      if (ctx.f_final_top === TOP_CONTINUE) {
        return RAF_update_self(t0)
      }
    }

    if (ctx.HND_RAF) return
    ctx.HND_RAF = window.setTimeout(() => Promise.resolve().then(() => RAF_update_self(t0)))
  }, [])


  /* requestAnimationFrame callback */
  RAF_update_self = useCallback((time: number) => {
    ctx.HND_RAF = 0

    const t1 = performance.now()
    if (t1 - time > 10 && ctx.retry_count-- > 0) {
      scroll_hook()
      return
    }

    ctx.retry_count = 5

    if (ctx.vt_state !== e_VT_STATE.RUNNING) return

    const evq  = event_queue

    let e: SimEvent
    if (!evq.length) {
      return
    }

    // this always consumes the last element of the event queue.
    e = evq.pop()
    evq.length = 0

    let etop = e.target.scrollTop
    let eleft = e.target.scrollLeft
    const flag = e.flag

    log_debug(ctx, `top: ${etop}, left: ${eleft}`)

    // checks every tr's height, which will take some time...
    const offset = scroll_with_offset(
                     ctx,
                     ctx.f_final_top === TOP_CONTINUE ? ctx.final_top : etop)

    const head = offset[0]
    const tail = offset[1]
    const top = offset[2]

    const prev_head = ctx._offset_head
    const prev_tail = ctx._offset_tail
    const prev_top = ctx._offset_top

    let end = false

    switch (flag) {
      case SCROLLEVT_INIT:
        log_debug(ctx, 'SCROLLEVT_INIT')
        break

      case SCROLLEVT_BY_HOOK:
        log_debug(ctx, 'SCROLLEVT_BY_HOOK')

        if (head === prev_head && tail === prev_tail && top === prev_top) {
          ctx.f_final_top = TOP_DONE
          if (ctx.final_top === -1) etop = ctx.computed_h - ctx._y
          end = true
        } else {
          if (ctx.final_top === -1) etop = top
        }

        break

      case SCROLLEVT_RECOMPUTE:
        if (head === prev_head && tail === prev_tail && top === prev_top) {
          return
        }

        log_debug(ctx, 'SCROLLEVT_RECOMPUTE')
        break


      case SCROLLEVT_NATIVE:
        if (head === prev_head && tail === prev_tail && top === prev_top) {
          return
        }

        log_debug(ctx, 'SCROLLEVT_NATIVE')

        if (ctx.onScroll) {
          ctx.onScroll({
            top: etop,
            left: eleft,
            isEnd: e.end,
          })
        }

        end = e.end
        break
    }

    set_offset(ctx, top, head, tail)
    set_scroll(ctx, etop, eleft, flag, end)
    force[1](++ctx.update_count)
  }, [])


  // expose to the parent components you are using.
  useImperativeHandle(ref, () => {
    // `y === -1` indicates you need to scroll to the bottom of the table.
    const scrollTo = (y: number) => {
      ctx.f_final_top = TOP_CONTINUE
      ctx.final_top = y
      scroll_hook({
        target: { scrollTop: y, scrollLeft: -1 },
        flag: SCROLLEVT_BY_HOOK,
      })
    }
    return {
      scrollTo: (y) => {
        ref_func.current = () => scrollTo(y)
        ref_func.current()
      },
      scrollToIndex: (idx) => {
        ref_func.current = () => {
          if (idx > ctx.row_count - 1) idx = ctx.row_count - 1
          if (idx < 0) idx = 0
          let y = 0
          for (let i = 0; i < idx; ++i) {
            y += ctx.row_height[i]
          }
          scrollTo(y)
        }
        ref_func.current()
      }
    }
  }, [])


  useEffect(() => {
    const el = wrap_inst.current.parentElement
    try {
      el.addEventListener('scroll', scroll_hook as any, {
        passive: true,
      })
    } catch {
      el.addEventListener('scroll', scroll_hook as any, false)
    }
  }, [wrap_inst.current])



  useEffect(() => {
    scroll_hook({
      flag: SCROLLEVT_BY_HOOK,
      target: {
        scrollLeft: ctx.left,
        scrollTop: ctx.top,
      }
    })
  }, [ctx.scroll.y])


  // update DOM style.
  useEffect(() => {
    switch (ctx.evt) {
      case SCROLLEVT_BY_HOOK:
        if (ctx.f_final_top === TOP_CONTINUE) {
          ref_func.current()
        } else {
          scroll_to(ctx, ctx.top, ctx.left)
        }
        break
      case SCROLLEVT_INIT:
      case SCROLLEVT_RECOMPUTE:
        scroll_to(ctx, ctx.top, ctx.left)
        break
    }
  }, [force[0]/* for performance. */])


  useEffect(() => {
    switch (ctx.vt_state) {
      case e_VT_STATE.LOADED: // changed by VTRow only.
        ctx.vt_state = e_VT_STATE.RUNNING

        // force update.
        scroll_hook({
          target: { scrollTop: ctx.top, scrollLeft: 0 },
          flag: SCROLLEVT_BY_HOOK,
        })
        break

      case e_VT_STATE.RUNNING:
        if (ctx.re_computed !== 0) { // rerender
          ctx.re_computed = 0
          scroll_hook({
            target: { scrollTop: ctx.top, scrollLeft: ctx.left },
            flag: SCROLLEVT_RECOMPUTE,
          })
        }
        break
    }
  })

  const wrapStyle = useMemo<React.CSSProperties>(
    () => ({
      width: style.width,
      minWidth: '100%',
      position: 'relative',
      transform: 'translate(0)',
    }),
    [style.width]
  )

  const tableStyle = useMemo<React.CSSProperties>(() => (
    {
      ...style,
      width: void 0,
      position: 'relative',
      top: ctx._offset_top,
      transform: 'translate(0)',
    }),
    [ctx._offset_top]
  )

  const internalCtx = useMemo(() => ({ ...ctx }), [ctx.update_count])

  const Table = ctx.components.table

  return (
    <div
      ref={wrap_inst}
      style={wrapStyle}
    >
      <context.Provider value={internalCtx}>
        <Table {...rest} style={tableStyle} />
      </context.Provider>
    </div>
  )

}


interface VWrapperProps {
  ctx: VT_CONTEXT;
  className: string;
  children: React.ReactNode;
}

const VWrapper: React.FC<VWrapperProps> = (props) => {
  const { children, className, ctx } = props
  const measureRow = children[0]
  const rows = children[1]

  // reference https://github.com/react-component/table/blob/master/src/Body/index.tsx#L6
  let len = Array.isArray(rows) ? rows.length : 0

  let { _offset_head: head, _offset_tail: tail } = ctx

  type RowType = React.ReactElement<{
    indent: number;
    record: object;
  }>

  let trs: RowType[] = []

  switch (ctx.vt_state) {
    case e_VT_STATE.INIT:
      if (len >= 0) {
        console.assert(head === 0)
        console.assert(tail === 1)
        if (Array.isArray(rows)) {
          trs = rows.slice(head, tail)
          ctx.indexMap.set(trs[0].props.record, 0)
        } else {
          trs = rows
        }
        ctx.re_computed = len
        ctx.prev_row_count = len
        ctx.row_count = len
      }
      break

    case e_VT_STATE.RUNNING: {
      if (tail > len) {
        const offset = tail - len
        tail -= offset
        head -= offset
        if (head < 0) head = 0
        if (tail < 0) tail = 0
        // update the `head` and `tail`.
        set_offset(ctx,
          ctx._offset_top/* NOTE: invalided param, just to fill for this param */,
          head, tail)
      }

      if (ctx.row_count !== len) {
        set_tr_cnt(ctx, len)
      }

      len = ctx.row_count
      const prev_len = ctx.prev_row_count

      /* shadow-rows rendering phase. */
      if (len < prev_len) {
        srs_shrink(ctx, len, prev_len)
      } else if (len > prev_len) {
        const row_h = ctx.row_height
        if ((len - row_h.length) > 0) {
          srs_expand(ctx, len, prev_len, ctx.possible_hight_per_tr)
        } else {
          // using an existing array.
          row_h.fill(ctx.possible_hight_per_tr, prev_len, len)
          ctx.computed_h += ctx.possible_hight_per_tr * (len - prev_len)
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
        let idx = head
        trs = rows.slice(idx, tail)
        trs.forEach(el => ctx.indexMap.set(el.props.record, idx++))
      } else {
        trs = rows
      }

      ctx.prev_row_count = ctx.row_count
    }
      break

    case e_VT_STATE.LOADED:
      console.assert(false)
      break
  }

  const Wrapper = ctx.components.body.wrapper

  return (
    <Wrapper className={className}>
      {measureRow}
      {trs}
    </Wrapper>
  )
}

interface VRowProps {
  style: React.CSSProperties;
  ctx: VT_CONTEXT;
  children: React.ReactNode;
}


const VTRow: React.FC<VRowProps> = (props) => {

  const ref = React.createRef<HTMLTableRowElement>()

  const { ctx, ...rest } = props

  const children = props.children

  const Row = ctx.components.body.row

  if (!Array.isArray(children)) {
    // https://github.com/react-component/table/blob/master/src/Body/BodyRow.tsx#L211
    // https://github.com/react-component/table/blob/master/src/Body/index.tsx#L105
    // only empty or expanded row...
    return <Row {...rest}>{children}</Row>
  }

  const row_props = children[0].props
  const index: number = ctx.indexMap.get(row_props.record)
  const last_index = useRef(index)

  const expanded_cls = useMemo(() => `.${row_props.prefixCls}-expanded-row`, [row_props.prefixCls])

  const t0 = performance.now()

  useLayoutEffect(() => {
    const t1 = performance.now()
    log_debug(ctx, `+idx ${index} tooks ${t1 - t0} ms`)

    if (ctx.vt_state === e_VT_STATE.RUNNING) {
      repainting(ctx)
    } else {
      ctx.possible_hight_per_tr = ref.current.offsetHeight
      srs_expand(ctx, ctx.row_count, 0, ctx.possible_hight_per_tr)
      repainting(ctx)
      ctx.vt_state = e_VT_STATE.LOADED
    }

    return () => {
      repainting(ctx)
    }
  }, [])


  useEffect(() => {
    ctx.cq.push({
      index: index,
      func: () => {
        const rowElm = ref.current

        if (!rowElm) return

        let h = rowElm.offsetHeight
        let sibling = rowElm.nextSibling as HTMLTableRowElement
        // https://github.com/react-component/table/blob/master/src/Body/BodyRow.tsx#L212
        // include heights of all expanded rows, in parent rows
        while (sibling && sibling.matches(expanded_cls)) {
          h += sibling.offsetHeight
          sibling = sibling.nextSibling as HTMLTableRowElement
        }

        const curr_h = ctx.row_height[index]
        const last_h = ctx.row_height[last_index.current]

        ctx.computed_h -= curr_h
        ctx.computed_h += last_h
        ctx.computed_h += h - last_h
        ctx.row_height[index] = h
      }
    })

    repainting(ctx)
  })

  return <Row {...rest} ref={ref} />
}




export
function _set_components(ctx: VT_CONTEXT, components: TableComponents): void {
  const { table, body, header } = components
  ctx.components.body = { ...ctx.components.body, ...body }
  if (body && body.cell) {
    ctx._vtcomponents.body.cell = body.cell
  }
  if (header) {
    ctx.components.header = header
    ctx._vtcomponents.header = header
  }
  if (table) {
    ctx.components.table = table
  }
}

export
function init(fnOpts: () => VtOpts, deps: React.DependencyList): VT_CONTEXT {
  const ctx = useRef(React.createContext<VT_CONTEXT>({ } as VT_CONTEXT)).current
  const ctx_value = useContext(ctx)
  const default_ref: VtOpts['ref'] = useRef({
    scrollTo: (y: number) => {},
    scrollToIndex: (idx: number) => {},
  })
  useMemo(() => {
    return Object.assign(
      ctx_value,
      {
        id: (+new Date()).toString(36).slice(4),
        initTop: 0,
        overscanRowCount: 5,
        debug: false,
        ref: default_ref,
      },
      fnOpts())
    }, deps)

  useMemo(() => {
    const VT = React.forwardRef(VTable)

    // set the virtual layer.
    ctx_value._vtcomponents = {
      table: props => <VT {...props} context={ctx} ref={ctx_value.ref} />,
      body: {
        // https://github.com/react-component/table/blob/master/src/Body/index.tsx#L114
        wrapper: props => {
          return (
            <ctx.Consumer>
              {(/* value */) => {
                return (
                  <VWrapper {...props} ctx={ctx_value}/>
                )
              }}
            </ctx.Consumer>
          )
        },
        row: props => <VTRow {...props} ctx={ctx_value} />,
      }
    }
    // set the default implementation layer.
    ctx_value.components = {}
    _set_components(ctx_value, {
      table: TableImpl,
      body: {
        wrapper: WrapperImpl,
        row: RowImpl,
      }
    })
    // start -> `INIT`
    ctx_value.vt_state = e_VT_STATE.INIT
  }, [])

  return ctx_value
}

