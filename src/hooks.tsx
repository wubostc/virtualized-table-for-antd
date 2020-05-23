/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/


import { useRef, useMemo, } from "react";
import { VTComponents, VTScroll, setComponents, vt_opts, vt_context } from "./vt";
import { TableComponents } from "rc-table/es/interface";

/**
 * @private functions
 */
function _generate_id(): number {
  do {
    const id = 0 | Math.random() * (Math.pow(2, 31) - 1);
    if (!vt_context.has(id)) return id;
  } while (1);
}

/**
 * @private functions
 */
function init_once<T, U>(factory: (...args: U[]) => T, ...args: U[]): T {
  const ref = useRef(null);
  return useMemo(() => factory(...args), [ref.current]);
}

/**
 * `destroy` is invalid within Hooks.
 */
export type vt_opts_t<T> = Omit<vt_opts<T>, "id" | "destroy">;


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
export function useVT<RecordType>(opts: vt_opts_t<RecordType>): [TableComponents<RecordType>,
                                        (components: TableComponents<RecordType>) => void,
                                        (param?: { top: number; left: number }) => {
                                          top: number;
                                          left: number;
                                        }]
{

  const _id = init_once(_generate_id);
  const _lambda_scroll = init_once(() => (param?: { top: number; left: number }) => VTScroll(_id, param));
  const _lambda_set = init_once(() => (components: TableComponents<RecordType>) => setComponents(_id, components));

  return [VTComponents({ ...opts, id: _id, destroy: true }), _lambda_set, _lambda_scroll];
}