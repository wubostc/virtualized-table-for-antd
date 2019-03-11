import * as React from "react";
import { TableComponents } from "antd/lib/table/interface";
interface vt_ctx {
    head: number;
    tail: number;
    user_context?: object;
}
export interface vt_opts {
    id: number;
    height: number;
    overscanRowCount?: number;
    VTWrapperRender?: (head: number, tail: number, children: any[], restProps: object) => JSX.Element;
    reflection?: string[] | string;
    changedBits?: (prev: vt_ctx, next: vt_ctx) => number;
    VTRefresh: () => void;
}
export declare const enum excellent_observer {
    update_self = 1,
    skip = 2
}
export declare function VTComponents(vt_opts: vt_opts): TableComponents;
export declare function getVTContext(id: number): React.Context<vt_ctx>;
export declare function getVTComponents(id: number): {
    table: React.ReactType<any>;
    wrapper: React.ReactType<any>;
    row: React.ReactType<any>;
};
export declare function VTRefresh(id: number): void;
export {};
