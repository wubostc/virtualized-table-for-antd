/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/


import { useRef, useMemo, useEffect, } from "react";

// /**
//  * @private
//  */
// function _generate_id(): number {
//   do {
//     const id = 0 | Math.random() * (Math.pow(2, 31) - 1);
//     if (!vt_context.has(id)) return id;
//   } while (1);
// }


export function useOnce<T, U>(factory: (...args: U[]) => T, ...args: U[]): T {
  const ref = useRef(null);
  return useMemo(() => factory(...args), [ref.current]);
}

export function useMount(fn: () => void): void {
  useEffect(fn, []);
}



