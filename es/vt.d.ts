import * as React from "react";
import { TableComponents } from "antd/lib/table/interface";
export interface vt_opts extends Object {
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
    onScroll?: ({ left, top, isEnd, }: {
        top: number;
        left: number;
        isEnd: boolean;
    }) => void;
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
declare enum e_VT_STATE {
    INIT = 1,
    LOADED = 2,
    RUNNING = 4,
    SUSPENDED = 8,
    WAITING = 16,
    PROTECTION = 128
}
/**
 * `L`: fixed: "left", `R`: fixed: "right"
 */
declare enum e_FIXED {
    UNKNOW = -1,
    NEITHER = 0,
    L = 1,
    R = 2
}
interface vt_ctx {
    head: number;
    tail: number;
    fixed: e_FIXED;
}
interface VT_CONTEXT extends vt_opts {
    _y: number;
    _raw_y: number | string;
    _vtcomponents: TableComponents;
    components: TableComponents;
    computed_h: number;
    vt_state: e_VT_STATE;
    possible_hight_per_tr: number;
    re_computed: number;
    row_height: number[];
    row_count: number;
    prev_row_count: number;
    wrap_inst: React.RefObject<HTMLDivElement>;
    context: React.Context<vt_ctx>;
    VTScroll?: (param?: {
        top: number;
        left: number;
    }) => {
        top: number;
        left: number;
    };
    _React_ptr: any;
    _lvt_ctx: VT_CONTEXT;
    _rvt_ctx: VT_CONTEXT;
    WH: number;
    HND_PAINT: number;
    PAINT_ADD: Map<number, HTMLTableRowElement>;
    PAINT_SADD: Map<number, number>;
    PAINT_FREE: Set<number>;
    PAINT_SFREE: Set<number>;
    PSRA: number[];
    PSRB: number[];
    _keys2free: Set<string>;
    _keys2insert: number;
    _prev_keys: Set<string>;
    _index_persister: Set<number>;
}
/**
 * @global
 */
export declare const vt_context: Map<number, VT_CONTEXT>;
export declare function VTComponents(vt_opts: vt_opts): TableComponents;
/**
 * @deprecated
 */
export declare function getVTContext(id: number): React.Context<vt_ctx>;
export declare function setComponents(id: number, components: TableComponents): void;
/**
 * @deprecated
 */
export declare function getVTComponents(id: number): TableComponents;
export declare function VTScroll(id: number, param?: {
    top: number;
    left: number;
}): {
    top: number;
    left: number;
};
export {};
