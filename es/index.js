function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
var _brower = 1;
var _node = 2;

(function () {
  var env = (typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object' && window instanceof Window ? _brower : _node;

  if (env & _brower) {
    if (!Object.hasOwnProperty.call(window, "requestAnimationFrame")) throw new Error("Please using the modern browers or appropriate polyfill!");
  }
})();

export { VTComponents, VTScroll, setComponents } from "./vt";
export { useVT } from "./hooks";