import { vt_opts } from "./vt";
import { TableComponents } from "antd/lib/table/interface";
/**
 * `destroy` is invalid within Hooks.
 */
export declare type vt_opts_t = Omit<vt_opts, "id" | "reflection" | "destroy">;
/**
 * @hooks No longer needs the parameter id.
 * @example
 *
 * function MyTableComponent() {
 *
 * // ... your code
 *
 *
 * // `set_components` is the same as the setComponents, excepet for the param id.
 * // `vt_scroll` is the same as the VTScroll, excepet for the param id.
 * const [ vt, set_components, vt_scroll ] = useVT();
 *
 *
 * return (
 *  <Table
 *   columns={columns}
 *   dataSource={dataSource}
 *   scroll={{ x: 1000, y: 600 }}
 *   components={vt}
 *  />
 * );
 * }
 */
export declare function useVT(opts: vt_opts_t): [TableComponents, (components: TableComponents) => void, (param?: {
    top: number;
    left: number;
}) => {
    top: number;
    left: number;
}];
