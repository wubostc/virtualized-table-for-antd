
/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useRef, useMemo } from "react";
import { TableComponents, _set_components, vt_opts, init } from "./vt";

const _brower = 1;
const _node = 2;

(function () {
  const env = typeof window === 'object' && window instanceof Window ? _brower : _node;
  if (env & _brower) {
    if (!Object.hasOwnProperty.call(window, "requestAnimationFrame") && !window.requestAnimationFrame)
      throw new Error("Please using the modern browers or appropriate polyfill!");
  }
})();


export function useOnce<T, U>(factory: (...args: U[]) => T, ...args: U[]): T {
  const ref = useRef(null);
  return useMemo(() => factory(...args), [ref.current]);
}

/**
 * @example
 * 
 * function MyTableComponent() {
 * 
 * // ... your code
 * 
 * 
 * // `set_components` is the same as the setComponents
 * const [ vt, set_components ] = useVT(() => ({ scroll: { y: 600 } }));
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
function useVT(fnOpts: () => vt_opts, deps: React.DependencyList = []):
  [
    TableComponents,
    (components: TableComponents) => void,
  ]
{
  const ctx = init(fnOpts, deps);
  const set = useOnce(() => (components: TableComponents) => _set_components(ctx, components));


  return [ctx._vtcomponents, set];
}

export { useVT };
