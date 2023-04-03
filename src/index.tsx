
/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/* eslint-disable no-console */

import { TableComponents, _set_components, VtOpts, init } from './vt'

const _brower = 1
const _node = 2

;(function () {
  const env = typeof window === 'object' && window instanceof Window ? _brower : _node
  if (env & _brower) {
    if (!Object.hasOwnProperty.call(window, 'requestAnimationFrame') && !window.requestAnimationFrame)
      throw new Error('Please using the modern browers or appropriate polyfill!')
  }
})()



/**
 * @example
 *
 * function MyTableComponent() {
 *
 * // ... your code
 *
 *
 * const y = 600;
 * const [ vt, setComponents, vtRef ] = useVT(() => ({
 *  scroll: {
 *    y
 *  }
 * }),
 * [y]);
 *
 * // useEffect(() => {
 * //  setComponents({
 * //    body: {
 * //      cell: MyCell,
 * //    }
 * //  })
 * // });
 *
 * // useEffect(() => vtRef.current.toScroll(100), []);
 *
 * return (
 *  <Table
 *   columns={columns}
 *   dataSource={dataSource}
 *   scroll={{ x: 1000, y }}
 *   components={vt}
 *  />
 * );
 * }
 */
function useVT(fnOpts: () => VtOpts, deps: React.DependencyList):
  [
    TableComponents,
    (components: TableComponents) => void,
    Required<VtOpts>['ref']
  ]
{
  const ctx = init(fnOpts, deps || [])


  return [ctx._vtcomponents, (components: TableComponents) => _set_components(ctx, components), ctx.ref]
}


export { useVT }
