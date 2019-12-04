function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import { useRef, useMemo } from "react";
import { VTComponents, VTScroll, setComponents, vt_context } from "./vt";
/**
 * @private functions
 */

function _generate_id() {
  do {
    var id = 0 | Math.random() * (Math.pow(2, 31) - 1);
    if (!vt_context.has(id)) return id;
  } while (1);
}
/**
 * @private functions
 */


function init_once(factory) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var ref = useRef(null);
  return useMemo(function () {
    return factory.apply(void 0, args);
  }, [ref.current]);
}
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


export function useVT(opts) {
  var _id = init_once(_generate_id);

  var _lambda_scroll = init_once(function () {
    return function (param) {
      return VTScroll(_id, param);
    };
  });

  var _lambda_set = init_once(function () {
    return function (components) {
      return setComponents(_id, components);
    };
  });

  return [VTComponents(_objectSpread({}, opts, {
    id: _id,
    destroy: true
  })), _lambda_set, _lambda_scroll];
}