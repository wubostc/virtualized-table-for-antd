
/*
The MIT License (MIT)

Copyright (c) 2019 wubooo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/


import * as React from "react";
import { TableComponents } from "antd/lib/table/interface";

interface vt_ctx {
  head: number;
  tail: number;
  user_context?: object;
}

export
interface vt_opts {
  id: number;
  height: number;
  overscanRowCount?: number;
  VTWrapperRender?: (head: number, tail: number, children: any[], restProps: object) => JSX.Element;
  reflection?: string[] | string;
  changedBits?: (prev: vt_ctx, next: vt_ctx) => number;
}



interface storeValue extends vt_opts {
  components: {
    table: React.ReactType,
    wrapper: React.ReactType,
    row: React.ReactType
  };
  computed_h: number;
  load_the_trs_once: 0 | 1 | 2;
  possible_hight_per_tr: number;
  re_computed: number;
  row_height: number[];
  row_count: number;
  wrap_inst: React.RefObject<HTMLDivElement>;
  context: React.Context<vt_ctx>;
}

const store: Map<number, storeValue> = new Map();

export
const enum excellent_observer {
  update_self = 0x0001,
  skip = 0x0001 << 1
}

namespace VT_CONTEXT {

export
function Switch(ID: number) {


const S = React.createContext<vt_ctx>({ head: 0, tail: 0 }, (prev, next) => {
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

  public constructor(props: VTRowProps, context: any) {
    super(props, context);
    this.inst = React.createRef();
    // this.id = ID;
  }

  public render() {
    const { children, ...restProps } = this.props;
    return (<tr {...restProps} ref={this.inst}>{children}</tr>);
  }

  public componentDidMount() {
    this.collect_h_tr(this.props.children[0].props.index, this.inst.current.clientHeight);
    const values = store.get(ID);
    if (values.load_the_trs_once === 0) values.load_the_trs_once = 1;
  }

  public componentDidUpdate() {
    this.collect_h_tr(this.props.children[0].props.index, this.inst.current.clientHeight);
  }

  private collect_h_tr(idx: number, val: number) {

    const values = store.get(ID);
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

    // writeback
    if (values.computed_h !== _computed_h) {
      update_wrap_style(values.wrap_inst.current, _computed_h);
      values.computed_h = _computed_h;
    }
    values.row_height = row_height;
  }
}


type VTWrapperProps = {
  children: any[];
};


class VTWrapper extends React.Component<VTWrapperProps> {

  private cnt: number;
  private id: number;
  private VTWrapperRender?: storeValue["VTWrapperRender"];

  public constructor(props: VTWrapperProps, context: any) {
    super(props, context);
    this.cnt = 0;
    this.id = ID;
    this.VTWrapperRender = store.get(ID).VTWrapperRender;
  }

  public render() {
    const { children, ...restProps } = this.props;
    return (
      <S.Consumer unstable_observedBits={excellent_observer.update_self}>
        {
          ({ head, tail }) => {
            if (this.cnt !== children.length) {
              this.set_tr_cnt(children.length, this.id);
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
    this.predict_height_and_update();
  }

  public componentDidUpdate() {
    this.predict_height_and_update();
  }

  public shouldComponentUpdate(nextProps: VTWrapperProps, nextState: unknown) {
    return true;
  }

  public predict_height_and_update() {
    const values = store.get(this.id);
    const possible_hight_per_tr = values.possible_hight_per_tr;

    if (possible_hight_per_tr === -1) return;

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
    // values.re_computed = 0;

    // update_wrap_style(values.wrap_inst.current, computed_h);

  }

  private set_tr_cnt(n: number, id: number) {
    const vals = store.get(id);
    const row_count = vals.row_count || 0;
    let re_computed; // 0: no need to recalculate, > 0: add, < 0 subtract

    re_computed = n - row_count;


    // writeback
    store.set(id, { ...vals, row_count: n, re_computed });
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
  private timestamp: number;

  public state: {
    top: number;
    head: number;
    tail: number;
  };

  private id: number;

  private user_context: any;

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

    this.id = ID;

    // hooks event
    this.scrollHook = this.scrollHook.bind(this);


    const values = store.get(this.id);
    values.possible_hight_per_tr = -1;
    values.computed_h = 0;
    values.load_the_trs_once = 0; // 0: init, 1: load once, 2: off
    values.re_computed = 0;
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
    const _style = { ...style, ...{ position: "absolute", top } } as React.CSSProperties;

    return (
      <div
        ref={this.wrap_inst}
        style={{ display: "block", position: "relative", transform: "matrix(1, 0, 0, 1, 0, 0)" }}
      >
        <table {...rest} ref={this.inst} style={_style}>
          <S.Provider value={{ tail, head, ...this.user_context }}>{children}</S.Provider>
        </table>
      </div>
    );

  }

  public componentDidMount() {
    this.wrap_inst.current.setAttribute("vt", `[${ID}] vt is works!`);
    this.wrap_inst.current.parentElement.onscroll = this.scrollHook;
    
    store.set(this.id, { ...store.get(this.id), wrap_inst: this.wrap_inst });

    const values = store.get(this.id);




    update_wrap_style(values.wrap_inst.current, values.computed_h);
  }

  public componentDidUpdate() {

    const values = store.get(this.id);

    update_wrap_style(values.wrap_inst.current, values.computed_h);

    if (values.load_the_trs_once === 1) {
      values.load_the_trs_once = 2;

      // force update for initialization
      this.scrollHook({ target: { scrollTop: 0, scrollLeft: 0 } });

    }
    
    if (values.re_computed !== 0) { // rerender
      
      values.re_computed = 0;
      this.scrollHook({ target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft } });
    }

  }

  public componentWillUnmount() {
    store.delete(this.id);
    this.setState = (...args) => null;
  }


  private scroll_with_computed(top: number, left: number) {
    const { row_height, row_count, height, possible_hight_per_tr, overscanRowCount = 1, } = store.get(this.id);

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


  private scrollHook(e: any) {

    const { scrollTop, scrollLeft } = e.target;

    requestAnimationFrame((timestamp) => {
      if (!this.timestamp) {
        this.timestamp = timestamp;
      }
      // console.info(timestamp - this.timestamp);

      // if (timestamp - this.timestamp < 16.7) {
      //   //
      // }

      const [head, tail, top] = this.scroll_with_computed(scrollTop, scrollLeft);

      const prev_head = this.state.head,
            prev_tail = this.state.tail,
            prev_top = this.state.top;
  
      if (head === prev_head && tail === prev_tail && top === prev_top) return;
  
      this.scrollLeft = scrollLeft;
      this.scrollTop = scrollTop;
      this.setState({ top, head, tail });

      this.timestamp = timestamp;

      cancelAnimationFrame(timestamp);
    });


  }


  public static Wrapper = VTWrapper;

  public static Row = VTRow;
}


return { VT, Wrapper: VTWrapper, Row: VTRow, S };

} // Switch

} // VT_CONTEXT


function init(id: number) {
  const inside = store.get(id) || {} as storeValue;
  if (!inside.components) {
    const { VT, Wrapper, Row, S } = VT_CONTEXT.Switch(id);
    inside.components = { table: VT, wrapper: Wrapper, row: Row };
    inside.context = S;
  }
  return inside;
}

function createVT(vt_opts: vt_opts) {
  console.assert(typeof vt_opts.id === "number" && typeof vt_opts.height === "number");
  const id = vt_opts.id;
  const inside = init(id);
  store.set(id, { ...vt_opts, ...inside, ...{ height: vt_opts.height } });
  return inside;
}


export
function VTComponents(vt_opts: vt_opts): TableComponents {
  const _store = createVT(vt_opts);

  return {
    table: _store.components.table,
    body: {
      wrapper: _store.components.wrapper,
      row: _store.components.row
    }
  };
}

export
function getVTContext(id: number) {
  const inside = init(id);
  store.set(id, { ...inside });
  return store.get(id).context;
}

export
function getVTComponents(id: number) {
  const inside = init(id);
  store.set(id, { ...inside });
  return store.get(id).components;
}
