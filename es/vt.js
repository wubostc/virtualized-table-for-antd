function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*
The MIT License (MIT)

Copyright (c) 2019 https://github.com/wubostc/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import * as React from "react";
/**
 * `INIT` -> `LOADED` -> `RUNNING` -> `SUSPENDED`
 * `SUSPENDED` -> `WAITING` -> `RUNNING`
 */

var e_VT_STATE;

(function (e_VT_STATE) {
  e_VT_STATE[e_VT_STATE["INIT"] = 1] = "INIT";
  e_VT_STATE[e_VT_STATE["LOADED"] = 2] = "LOADED";
  e_VT_STATE[e_VT_STATE["RUNNING"] = 4] = "RUNNING";
  e_VT_STATE[e_VT_STATE["SUSPENDED"] = 8] = "SUSPENDED";
  e_VT_STATE[e_VT_STATE["WAITING"] = 16] = "WAITING";
  e_VT_STATE[e_VT_STATE["PROTECTION"] = 128] = "PROTECTION";
})(e_VT_STATE || (e_VT_STATE = {}));
/**
 * `L`: fixed: "left", `R`: fixed: "right"
 */


var e_FIXED;

(function (e_FIXED) {
  e_FIXED[e_FIXED["UNKNOW"] = -1] = "UNKNOW";
  e_FIXED[e_FIXED["NEITHER"] = 0] = "NEITHER";
  e_FIXED[e_FIXED["L"] = 1] = "L";
  e_FIXED[e_FIXED["R"] = 2] = "R";
})(e_FIXED || (e_FIXED = {}));
/**
 * @global
 */


export var vt_context = new Map();
/* overload __DIAGNOSIS__. */

function __DIAGNOSIS__(ctx) {
  Object.defineProperty(ctx, "__DIAGNOSIS__", {
    get: function get() {
      console.debug("OoOoOoO DIAGNOSIS OoOoOoO");
      var total = 0;

      for (var i = 0; i < ctx.row_count; ++i) {
        total += ctx.row_height[i];
      }

      console.debug("Verify computed_h", total);
      console.debug("OoOoOoOoOoOoOOoOoOoOoOoOo");
    },
    configurable: false,
    enumerable: false
  });
}

function log_debug(ctx, msg) {
  if (ctx.debug) {
    ctx = _objectSpread({}, ctx);

    __DIAGNOSIS__(ctx);

    var ts = new Date().getTime();
    console.debug("%c[".concat(ctx.id, "][").concat(ts, "][").concat(msg, "] vt"), "color:#a00", ctx);
  }
}
/**
 * THE EVENTS OF SCROLLING.
 */
// const SCROLLEVT_NULL       = (0<<0);


var SCROLLEVT_INIT = 1 << 0;
var SCROLLEVT_RECOMPUTE = 1 << 1;
var SCROLLEVT_RESTORETO = 1 << 2;
var SCROLLEVT_NATIVE = 1 << 3;
var SCROLLEVT_BARRIER = 1 << 4; // It only for `SCROLLEVT_RECOMPUTE`.
// the factory function returns a SimEvent.

function _make_evt(ne) {
  var target = ne.target;
  return {
    target: {
      scrollTop: target.scrollTop,
      scrollLeft: target.scrollLeft
    },
    endOfElements: target.scrollHeight - target.clientHeight === target.scrollTop,
    flags: SCROLLEVT_NATIVE
  };
}
/**
 * Implementation Layer.
 */

/** AntD.TableComponent.table */


var Table = React.forwardRef(function Table(props, ref) {
  var style = props.style,
      children = props.children,
      rest = _objectWithoutProperties(props, ["style", "children"]);

  return React.createElement("table", Object.assign({
    ref: ref,
    style: style
  }, rest), children);
});
/** AntD.TableComponent.body.wrapper */

function Wrapper(props) {
  var children = props.children,
      rest = _objectWithoutProperties(props, ["children"]);

  return React.createElement("tbody", Object.assign({}, rest), children);
}
/** AntD.TableComponent.body.row */


var Row = React.forwardRef(function Row(props, ref) {
  var children = props.children,
      rest = _objectWithoutProperties(props, ["children"]);

  return React.createElement("tr", Object.assign({}, rest, {
    ref: ref
  }), children);
});
/**
 * define CONSTANTs.
 */
// const MIN_FRAME = 16;

/**
 * the following functions bind the `ctx`.
 */

/** update to ColumnProps.fixed synchronously */

function _RC_fixed_setState(ctx, top, head, tail) {
  if (ctx._lvt_ctx) ctx._lvt_ctx._React_ptr.setState({
    top: top,
    head: head,
    tail: tail
  });
  if (ctx._rvt_ctx) ctx._rvt_ctx._React_ptr.setState({
    top: top,
    head: head,
    tail: tail
  });
}

function _Update_wrap_style(ctx, h) {
  // a component has unmounted.
  if (!ctx.wrap_inst.current) return;
  if (ctx.vt_state === e_VT_STATE.WAITING) h = 0;
  ctx.wrap_inst.current.style.height = "".concat(h, "px");
  ctx.wrap_inst.current.style.maxHeight = "".concat(h, "px");
}
/** non-block, just create a macro tack, then only update once. */


function update_wrap_style(ctx, h) {
  if (ctx.WH === h) return;
  ctx.WH = h;

  _Update_wrap_style(ctx, h);
  /* update the `ColumnProps.fixed` synchronously */


  if (ctx._lvt_ctx) _Update_wrap_style(ctx._lvt_ctx, h);
  if (ctx._rvt_ctx) _Update_wrap_style(ctx._rvt_ctx, h);
} // scrolls the parent element to specified location.


function _scroll_to(ctx, top, left) {
  var ele = ctx.wrap_inst.current.parentElement;
  /** ie */

  ele.scrollTop = top;
  ele.scrollLeft = left;
} // a wrapper function for `_scroll_to`.


function scroll_to(ctx, top, left) {
  _scroll_to(ctx, top, left);

  if (ctx._lvt_ctx) _scroll_to(ctx._lvt_ctx, top, left);
  if (ctx._rvt_ctx) _scroll_to(ctx._rvt_ctx, top, left);
}

function add_h(ctx, idx, h) {
  console.assert(!Number.isNaN(h), "failed to apply height with index ".concat(idx, "!"));
  ctx.row_height[idx] = h;
  ctx.computed_h += h; // just do add up.

  if (ctx.debug) console.info("add", idx, h);
}

function free_h(ctx, idx) {
  console.assert(!Number.isNaN(ctx.row_height[idx]), "failed to free this tr[".concat(idx, "]."));
  ctx.computed_h -= ctx.row_height[idx];
  if (ctx.debug) console.info("free", idx, ctx.row_height[idx]);
}

function _repainting(ctx) {
  return requestAnimationFrame(function () {
    var PAINT_ADD = ctx.PAINT_ADD,
        PAINT_SADD = ctx.PAINT_SADD,
        PAINT_FREE = ctx.PAINT_FREE,
        PAINT_SFREE = ctx.PAINT_SFREE;
    log_debug(ctx, "START-REPAINTING");

    if (PAINT_FREE.size) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = PAINT_FREE[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var idx = _step.value;
          free_h(ctx, idx);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      console.assert(!Number.isNaN(ctx.computed_h));
      console.assert(ctx.computed_h >= 0);
    }

    if (PAINT_SFREE.size) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = PAINT_SFREE[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _idx = _step2.value;
          free_h(ctx, _idx);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      console.assert(!Number.isNaN(ctx.computed_h));
      console.assert(ctx.computed_h >= 0);
    }

    if (PAINT_ADD.size) {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = PAINT_ADD[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _step3$value = _slicedToArray(_step3.value, 2),
              _idx2 = _step3$value[0],
              el = _step3$value[1];

          add_h(ctx, _idx2, el.offsetHeight);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      console.assert(!Number.isNaN(ctx.computed_h));
      console.assert(ctx.computed_h >= 0);
    }

    if (PAINT_SADD.size) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = PAINT_SADD[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _step4$value = _slicedToArray(_step4.value, 2),
              _idx3 = _step4$value[0],
              h = _step4$value[1];

          add_h(ctx, _idx3, h);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      console.assert(!Number.isNaN(ctx.computed_h));
      console.assert(ctx.computed_h >= 0);
    } // clear


    PAINT_SFREE.clear();
    PAINT_FREE.clear();
    PAINT_ADD.clear();
    PAINT_SADD.clear();

    if (ctx.vt_state === e_VT_STATE.RUNNING) {
      // output to the buffer
      update_wrap_style(ctx, ctx.computed_h);
    } // free this handle manually.


    ctx.HND_PAINT = 0;
    log_debug(ctx, "END-REPAINTING");
  });
}
/** non-block */


function repainting_with_add(ctx, idx, tr) {
  ctx.PAINT_ADD.set(idx, tr);
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx);
}
/** non-block */


function repainting_with_sadd(ctx, idx, h) {
  ctx.PAINT_SADD.set(idx, h);
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx);
}
/** non-block */


function repainting_with_free(ctx, idx) {
  ctx.PAINT_FREE.add(idx);
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx);
}
/** non-block */


function repainting_with_sfree(ctx, idx) {
  ctx.PAINT_SFREE.add(idx);
  if (ctx.HND_PAINT > 0) return;
  ctx.HND_PAINT = _repainting(ctx);
}
/** Shadow Rows. */


function srs_diff(ctx, PSR, begin, end, prev_begin, prev_end) {
  var row_height = ctx.row_height,
      possible_hight_per_tr = ctx.possible_hight_per_tr;

  if (begin > prev_begin) {
    for (var i = prev_begin; i < begin; ++i) {
      repainting_with_sfree(ctx, i);
    }
  } else if (begin < prev_begin) {
    for (var _i2 = begin; _i2 < prev_begin; ++_i2) {
      repainting_with_sadd(ctx, _i2, Number.isNaN(row_height[_i2]) ? possible_hight_per_tr : row_height[_i2]);
    }
  }

  if (end > prev_end) {
    for (var _i3 = prev_end; _i3 < end; ++_i3) {
      repainting_with_sadd(ctx, _i3, Number.isNaN(row_height[_i3]) ? possible_hight_per_tr : row_height[_i3]);
    }
  } else if (end < prev_end) {
    for (var _i4 = end; _i4 < prev_end; ++_i4) {
      repainting_with_sfree(ctx, _i4);
    }
  }

  PSR[0] = begin;
  PSR[1] = end;
}

function set_tr_cnt(ctx, n) {
  ctx.re_computed = n - ctx.row_count;
  ctx.prev_row_count = ctx.row_count;
  ctx.row_count = n;
}

var VTContext = {
  // using closure
  Switch: function Switch(ID) {
    var ctx = vt_context.get(ID);
    var S = React.createContext({
      head: 0,
      tail: 0,
      fixed: e_FIXED.UNKNOW
    });

    var VTRow =
    /*#__PURE__*/
    function (_React$Component) {
      _inherits(VTRow, _React$Component);

      function VTRow(props, context) {
        var _this;

        _classCallCheck(this, VTRow);

        _this = _possibleConstructorReturn(this, _getPrototypeOf(VTRow).call(this, props, context));
        _this.inst = React.createRef();
        _this.fixed = e_FIXED.UNKNOW;
        return _this;
      }

      _createClass(VTRow, [{
        key: "render",
        value: function render() {
          var _this2 = this;

          var _this$props = this.props,
              children = _this$props.children,
              restProps = _objectWithoutProperties(_this$props, ["children"]);

          return React.createElement(S.Consumer, null, function (_ref) {
            var fixed = _ref.fixed;
            if (_this2.fixed === e_FIXED.UNKNOW) _this2.fixed = fixed;
            var Row = ctx.components.body.row;
            return React.createElement(Row, Object.assign({}, restProps, {
              ref: _this2.inst
            }), children);
          });
        }
      }, {
        key: "componentDidMount",
        value: function componentDidMount() {
          if (this.fixed !== e_FIXED.NEITHER) return;
          var props = this.props;
          var index = props.children[0].props.index;

          if (ctx._index_persister.size && ctx._index_persister.delete(index)) {
            return;
          }

          if (ctx.vt_state === e_VT_STATE.RUNNING) {
            var key = String(props["data-row-key"]);

            if (ctx._keys2free.delete(key)) {
              // prevent to free the same index repeatedly.
              if (!ctx.PAINT_SFREE.has(index)) {
                repainting_with_free(ctx, index);
              }
            } // prevent to add the same index repeatedly.


            ctx.PAINT_SADD.delete(index);
            repainting_with_add(ctx, index, this.inst.current);
          } else {
            /* init context */
            console.assert(ctx.vt_state === e_VT_STATE.INIT);
            ctx.vt_state = e_VT_STATE.LOADED;
            var h = this.inst.current.offsetHeight;

            if (ctx.possible_hight_per_tr === -1) {
              /* assign only once */
              ctx.possible_hight_per_tr = h;
            }

            ctx.computed_h = 0; // reset initial value.

            add_h(ctx, index, h);
          }
        }
      }, {
        key: "componentDidUpdate",
        value: function componentDidUpdate() {
          if (this.fixed !== e_FIXED.NEITHER) return;
          var index = this.props.children[0].props.index;

          if (ctx.PAINT_FREE.size && ctx.PAINT_FREE.has(index)) {
            repainting_with_add(ctx, index, this.inst.current);
          } else {
            // prevent to free the same index repeatedly.
            if (!ctx.PAINT_SFREE.has(index)) {
              repainting_with_free(ctx, index);
            }

            repainting_with_add(ctx, index, this.inst.current);
          }
        }
      }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          if (this.fixed !== e_FIXED.NEITHER) return;
          var props = this.props;
          var index = props.children[0].props.index; // `RUNNING` -> `SUSPENDED`

          if (ctx.vt_state === e_VT_STATE.SUSPENDED) {
            ctx._index_persister.add(index);

            return;
          }

          if (ctx._keys2insert > 0) {
            ctx._keys2insert--; // nothing to do... just return.

            return;
          } // prevent to free the same index repeatedly.


          if (!ctx.PAINT_SFREE.has(index)) {
            repainting_with_free(ctx, index);
          }
        }
      }]);

      return VTRow;
    }(React.Component);

    var VTWrapper =
    /*#__PURE__*/
    function (_React$Component2) {
      _inherits(VTWrapper, _React$Component2);

      function VTWrapper(props, context) {
        _classCallCheck(this, VTWrapper);

        return _possibleConstructorReturn(this, _getPrototypeOf(VTWrapper).call(this, props, context));
      }

      _createClass(VTWrapper, [{
        key: "render",
        value: function render() {
          var _this$props2 = this.props,
              children = _this$props2.children,
              restProps = _objectWithoutProperties(_this$props2, ["children"]);

          return React.createElement(S.Consumer, null, function (_ref2) {
            var head = _ref2.head,
                tail = _ref2.tail,
                fixed = _ref2.fixed;
            var trs = [];
            var len = children.length;
            var Wrapper = ctx.components.body.wrapper;

            if (ctx.vt_state === e_VT_STATE.WAITING) {
              // waitting for loading data as soon, just return this as following.
              return React.createElement(Wrapper, Object.assign({}, restProps), trs);
            }

            if (len >= 0 && fixed === e_FIXED.NEITHER) {
              var offset;

              if (tail > len) {
                offset = tail - len;
                tail -= offset;
                head -= offset;
                if (head < 0) head = 0;
                if (tail < 0) tail = 0;
              } else {
                offset = 0;
              }

              if (ctx.vt_state === e_VT_STATE.INIT) {
                /* init trs [0, 1] */
                for (var i = head; i < tail; ++i) {
                  trs.push(children[i]);
                }

                if (ctx.row_count !== len) {
                  set_tr_cnt(ctx, len);
                } // reset `prev_row_count` as same as `row_count`


                ctx.prev_row_count = ctx.row_count;
              } else if (ctx.vt_state & e_VT_STATE.RUNNING) {
                var PSRA = ctx.PSRA,
                    PSRB = ctx.PSRB;
                var fixed_PSRA0 = PSRA[0] - offset,
                    fixed_PSRA1 = PSRA[1] - offset;
                if (fixed_PSRA0 < 0) fixed_PSRA0 = 0;
                if (fixed_PSRA1 < 0) fixed_PSRA1 = 0;
                var fixed_PSRB0 = PSRB[0] - offset,
                    fixed_PSRB1 = PSRB[1] - offset;
                if (fixed_PSRB0 < 0) fixed_PSRB0 = 0;
                if (fixed_PSRB1 < 0) fixed_PSRB1 = 0;

                if (ctx.row_count !== len) {
                  set_tr_cnt(ctx, len);
                }

                len = ctx.row_count;
                var prev_len = ctx.prev_row_count;

                if (ctx.vt_state & e_VT_STATE.PROTECTION) {
                  ctx.vt_state &= ~e_VT_STATE.PROTECTION;
                  prev_len = len;
                }
                /**
                 * start rendering phase.
                 * to render rows to filter.
                 */


                if (len > prev_len) {
                  /**
                   *        the current keys of trs's       the previous keys of trs's
                   * =================================================================
                   * shadow 10                             +9
                   *        11                              10
                   *        12                              11
                   * -------head----------------------------head----------------------
                   * render 13                              12
                   *        14                              13
                   *        15                              14
                   *        16                              15
                   * -------tail----------------------------tail----------------------
                   * shadow 17                              16
                   *        18                              17
                   *                                        18
                   * =================================================================
                   * +: a new reocrd that will be inserted.
                   * NOTE: both of `head` and `tail` won't be changed.
                   */
                  console.assert(PSRA[1] === head && PSRB[0] === tail);
                  var keys = new Set();
                  ctx._keys2insert = 0;

                  for (var _i5 = head; _i5 < tail; ++_i5) {
                    var child = children[_i5];
                    keys.add(child.key);

                    if (!ctx._prev_keys.has(child.key)) {
                      ctx._keys2insert++; // insert a row at index `i` with height `0`.

                      ctx.row_height.splice(_i5, 0, 0);
                    }

                    trs.push(child);
                  }

                  ctx._prev_keys = keys;
                } else {
                  var _keys = new Set();

                  ctx._keys2free.clear();

                  for (var _i6 = head; _i6 < tail; ++_i6) {
                    var _child = children[_i6];

                    if (fixed_PSRA1 === head && fixed_PSRB0 === tail && // no movement occurred
                    !ctx._prev_keys.has(_child.key)) {
                      // then, manually free this index befor mounting React Component.
                      ctx._keys2free.add(_child.key);
                    }

                    trs.push(_child);

                    _keys.add(_child.key);
                  }

                  ctx._prev_keys = _keys;
                }
                /**
                 * start srs_diff phase.
                 * first up, Previous-Shadow-Rows below `trs`,
                 * then Previous-Shadow-Rows above `trs`.
                 */
                // how many Shadow Rows need to be deleted.


                var SR_n2delete = 0,
                    SR_n2insert = 0;
                /* PSR's range: [begin, end) */

                if (PSRB[0] === -1) {
                  // init Rows.
                  var rows = new Array(tail - 1
                  /* substract the first row */
                  ).fill(0, 0, tail - 1);
                  ctx.row_height = ctx.row_height.concat(rows); // init Shadow Rows.

                  var shadow_rows = new Array(len - tail).fill(ctx.possible_hight_per_tr, 0, len - tail);
                  ctx.row_height = ctx.row_height.concat(shadow_rows);
                  ctx.computed_h = ctx.computed_h + ctx.possible_hight_per_tr * (len - tail);
                  PSRB[0] = tail;
                  PSRB[1] = len;
                } else {
                  if (len < prev_len) {
                    /* free some rows */
                    SR_n2delete = prev_len - len - (PSRB[1] - len);
                    srs_diff(ctx, PSRB, tail, len, fixed_PSRB0, PSRB[1]);
                  } else if (len > prev_len) {
                    /* insert some rows */
                    SR_n2insert = ctx._keys2insert;
                    srs_diff(ctx, PSRB, tail, len, PSRB[0], PSRB[1] + SR_n2insert);
                  } else {
                    srs_diff(ctx, PSRB, tail, len, PSRB[0], PSRB[1]);
                  }
                }

                if (PSRA[0] === -1) {
                  // init Shadow Rows.
                  PSRA[0] = 0;
                  PSRA[1] = 0;
                } else {
                  srs_diff(ctx, PSRA, 0, head, PSRA[0], fixed_PSRA1 + SR_n2delete);
                }

                ctx.prev_row_count = ctx.row_count;
              }
              /* RUNNING */

            }
            /* len && this.fixed === e_FIXED.NEITHER */

            /* fixed L R */


            if (len >= 0 && fixed !== e_FIXED.NEITHER) {
              for (var _i7 = head; _i7 < tail; ++_i7) {
                trs.push(children[_i7]);
              }
            }

            return React.createElement(Wrapper, Object.assign({}, restProps), trs);
          });
        }
      }, {
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
          return true;
        }
      }]);

      return VTWrapper;
    }(React.Component);

    var VTable =
    /*#__PURE__*/
    function (_React$Component3) {
      _inherits(VTable, _React$Component3);

      function VTable(props, context) {
        var _this3;

        _classCallCheck(this, VTable);

        _this3 = _possibleConstructorReturn(this, _getPrototypeOf(VTable).call(this, props, context));
        _this3.inst = React.createRef();
        _this3.wrap_inst = React.createRef();
        _this3.scrollTop = 0;
        _this3.scrollLeft = 0;
        _this3.state = {
          top: 0,
          head: 0,
          tail: 1
        };
        var fixed = _this3.props.children[0].props.fixed;

        if (fixed === "left") {
          _this3.fixed = e_FIXED.L;
        } else if (fixed === "right") {
          _this3.fixed = e_FIXED.R;
        } else {
          _this3.fixed = e_FIXED.NEITHER;
        }

        if (_this3.fixed === e_FIXED.NEITHER) {
          _this3.restoring = false;
          _this3.user_context = {};
          var reflection = ctx.reflection || [];

          if (typeof reflection === "string") {
            reflection = [reflection];
          }

          for (var i = 0; i < reflection.length; ++i) {
            _this3.user_context[reflection[i]] = _this3.props[reflection[i]];
          }

          _this3.event_queue = [];
          _this3.nevent_queue = [];
          _this3.update_self = _this3.update_self.bind(_assertThisInitialized(_this3));
          _this3.HNDID_RAF = 0;
        }

        if (ctx.vt_state === e_VT_STATE.INIT) {
          if (_this3.fixed === e_FIXED.NEITHER) {
            ctx.possible_hight_per_tr = -1;
            ctx.computed_h = 0;
            ctx.re_computed = 0;
            ctx.row_height = [];
            ctx.row_count = 0;
            ctx.prev_row_count = 0;
            ctx.PSRA = [-1, -1];
            ctx.PSRB = [-1, -1];
            ctx.PAINT_ADD = new Map();
            ctx.PAINT_SADD = new Map();
            ctx.PAINT_FREE = new Set();
            ctx.PAINT_SFREE = new Set();
            /* init keys */

            ctx._prev_keys = new Set();
            ctx._keys2free = new Set();
            ctx._keys2insert = 0;

            __DIAGNOSIS__(ctx);

            ctx._index_persister = new Set();
          } // init context for all of the `L` `R` and `NEITHER`.


          ctx.WH = 0;
        } else {
          if (_this3.fixed === e_FIXED.NEITHER) {
            console.assert(ctx.vt_state === e_VT_STATE.SUSPENDED);
            /* `SUSPENDED` -> `WAITING` */

            ctx.vt_state = e_VT_STATE.WAITING;
            var _ctx$_React_ptr = ctx._React_ptr,
                state = _ctx$_React_ptr.state,
                scrollTop = _ctx$_React_ptr.scrollTop,
                scrollLeft = _ctx$_React_ptr.scrollLeft;
            _this3.state = {
              head: state.head,
              top: state.top,
              tail: state.tail
            };
            _this3.scrollTop = scrollTop;
            _this3.scrollLeft = scrollLeft;
          }
        }

        if (_this3.fixed === e_FIXED.NEITHER) {
          ctx.VTScroll = _this3.scroll.bind(_assertThisInitialized(_this3));
          ctx._React_ptr = _assertThisInitialized(_this3);
        }

        return _this3;
      }

      _createClass(VTable, [{
        key: "render",
        value: function render() {
          var _this$state = this.state,
              head = _this$state.head,
              tail = _this$state.tail,
              top = _this$state.top;

          var _this$props3 = this.props,
              style = _this$props3.style,
              children = _this$props3.children,
              rest = _objectWithoutProperties(_this$props3, ["style", "children"]);

          style.position = "absolute";
          style.top = top;

          var width = style.width,
              rest_style = _objectWithoutProperties(style, ["width"]);

          var Table = ctx.components.table;
          return React.createElement("div", {
            ref: this.wrap_inst,
            style: {
              width: width,
              position: "relative",
              transform: "matrix(1, 0, 0, 1, 0, 0)"
            }
          }, React.createElement(S.Provider, {
            value: _objectSpread({
              tail: tail,
              head: head,
              fixed: this.fixed
            }, this.user_context)
          }, React.createElement(Table, Object.assign({}, rest, {
            ref: this.inst,
            style: rest_style
          }), children)));
        }
      }, {
        key: "componentDidMount",
        value: function componentDidMount() {
          switch (this.fixed) {
            case e_FIXED.L:
              {
                /* registers the `_lvt_ctx` at the `ctx`. */
                vt_context.set(0 - ID, {
                  _React_ptr: this
                });
                ctx._lvt_ctx = vt_context.get(0 - ID);
                ctx._lvt_ctx.wrap_inst = this.wrap_inst;

                _Update_wrap_style(ctx._lvt_ctx, ctx.computed_h);

                var _ctx$_React_ptr2 = ctx._React_ptr,
                    scrollTop = _ctx$_React_ptr2.scrollTop,
                    scrollLeft = _ctx$_React_ptr2.scrollLeft,
                    state = _ctx$_React_ptr2.state;

                _scroll_to(ctx._lvt_ctx, scrollTop, scrollLeft);

                ctx._lvt_ctx._React_ptr.setState({
                  top: state.top,
                  head: state.head,
                  tail: state.tail
                });

                this.wrap_inst.current.setAttribute("vt-left", "[".concat(ID, "]"));
              }
              return;

            case e_FIXED.R:
              {
                /* registers the `_rvt_ctx` at the `ctx`. */
                vt_context.set((1 << 31) + ID, {
                  _React_ptr: this
                });
                ctx._rvt_ctx = vt_context.get((1 << 31) + ID);
                ctx._rvt_ctx.wrap_inst = this.wrap_inst;

                _Update_wrap_style(ctx._rvt_ctx, ctx.computed_h);

                var _ctx$_React_ptr3 = ctx._React_ptr,
                    _scrollTop = _ctx$_React_ptr3.scrollTop,
                    _scrollLeft = _ctx$_React_ptr3.scrollLeft,
                    _state = _ctx$_React_ptr3.state;

                _scroll_to(ctx._rvt_ctx, _scrollTop, _scrollLeft);

                ctx._rvt_ctx._React_ptr.setState({
                  top: _state.top,
                  head: _state.head,
                  tail: _state.tail
                });

                this.wrap_inst.current.setAttribute("vt-right", "[".concat(ID, "]"));
              }
              return;

            default:
              ctx.wrap_inst = this.wrap_inst; // ctx.re_computed = 0;

              this.wrap_inst.current.parentElement.onscroll = this.scrollHook.bind(this);

              _Update_wrap_style(ctx, ctx.computed_h);

              this.wrap_inst.current.setAttribute("vt", "[".concat(ID, "]"));
              break;
          } // 0 - head, 2 - body


          var children = this.props.children[2].props.children;

          if (ctx.vt_state === e_VT_STATE.WAITING) {
            /* switch `SUSPENDED` to `WAITING` from VT's constructor. */
            if (children.length) {
              // just only switch to `RUNNING`.
              ctx.vt_state = e_VT_STATE.RUNNING;
            }
          } else {
            if (children.length) {
              // `vt_state` is changed by `VTRow`.
              console.assert(ctx.vt_state === e_VT_STATE.LOADED);
              ctx.vt_state = e_VT_STATE.RUNNING | e_VT_STATE.PROTECTION;
              this.scrollHook({
                target: {
                  scrollTop: 0,
                  scrollLeft: 0
                },
                flags: SCROLLEVT_INIT
              });
            } else {
              console.assert(ctx.vt_state === e_VT_STATE.INIT);
            }
          }
        }
      }, {
        key: "componentDidUpdate",
        value: function componentDidUpdate() {
          if (this.fixed !== e_FIXED.NEITHER) return;

          if (ctx.vt_state === e_VT_STATE.INIT) {
            return;
          }

          if (ctx.vt_state === e_VT_STATE.LOADED) {
            // `LOADED` -> `RUNNING`.
            ctx.vt_state = e_VT_STATE.RUNNING | e_VT_STATE.PROTECTION; // force update for initialization

            this.scrollHook({
              target: {
                scrollTop: 0,
                scrollLeft: 0
              },
              flags: SCROLLEVT_INIT
            });
          }

          if (ctx.vt_state === e_VT_STATE.WAITING) {
            // Do you get the previous data back?
            if (this.props.children[2].props.children.length) {
              // Y, `WAITING` -> `RUNNING`.
              ctx.vt_state = e_VT_STATE.RUNNING;
            } else {
              // N, keep `WAITING` then just return.
              return;
            }
          }

          if (ctx.vt_state & e_VT_STATE.RUNNING) {
            if (this.restoring) {
              this.restoring = false;
              this.scrollHook({
                target: {
                  scrollTop: this.scrollTop,
                  scrollLeft: this.scrollLeft
                },
                flags: SCROLLEVT_RESTORETO
              });
            }

            if (ctx.re_computed !== 0) {
              // rerender
              ctx.re_computed = 0;
              this.scrollHook({
                target: {
                  scrollTop: this.scrollTop,
                  scrollLeft: this.scrollLeft
                },
                flags: SCROLLEVT_RECOMPUTE
              });
            }
          }
        }
      }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          if (this.fixed !== e_FIXED.NEITHER) return;

          if (ctx.destroy) {
            vt_context.delete(0 - ID); // fixed left

            vt_context.delete((1 << 31) + ID); // fixed right

            vt_context.delete(ID);
          } else {
            ctx.vt_state = e_VT_STATE.SUSPENDED;
            var _ctx$_React_ptr4 = ctx._React_ptr,
                state = _ctx$_React_ptr4.state,
                scrollTop = _ctx$_React_ptr4.scrollTop,
                scrollLeft = _ctx$_React_ptr4.scrollLeft;
            ctx._React_ptr = {
              state: state,
              scrollTop: scrollTop,
              scrollLeft: scrollLeft
            };
          }

          this.setState = function () {
            return null;
          };
        }
      }, {
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
          return true;
        }
      }, {
        key: "scroll_with_computed",
        value: function scroll_with_computed(top) {
          var row_height = ctx.row_height,
              row_count = ctx.row_count,
              possible_hight_per_tr = ctx.possible_hight_per_tr,
              overscanRowCount = ctx.overscanRowCount;
          var overscan = overscanRowCount;

          try {
            var props = this.props.children[2].props.children[0].props;

            if (typeof props.scroll.y === "number") {
              ctx._raw_y = props.scroll.y;
              ctx._y = ctx._raw_y;
            } else if (typeof props.scroll.y === "string") {
              /* a string, like "calc(100vh - 300px)" */
              if (ctx.debug) console.warn("AntD.Table.scroll.y: ".concat(props.scroll.y, ", it may cause performance problems."));
              ctx._raw_y = props.scroll.y;
              ctx._y = this.wrap_inst.current.parentElement.offsetHeight;
            } else {
              if (ctx.debug) console.warn("AntD.Table.scroll.y: ".concat(props.scroll.y, ", it may cause performance problems."));
              console.info("VT will not works well, did you forget to set `scroll.y`?");
              ctx._raw_y = null;
              ctx._y = this.wrap_inst.current.parentElement.offsetHeight;
            }
          } catch (_unused) {
            // return it if there is no children.
            return [0 | 0, 0 | 0, 0 | 0];
          }

          console.assert(ctx._y >= 0); // to calc `accumulate_top` with `row_height` and `overscan`.

          var accumulate_top = 0,
              i = 0;

          for (; i < row_count && accumulate_top <= top; ++i) {
            accumulate_top += row_height[i];
          }

          while (i > 0 && overscan--) {
            accumulate_top -= row_height[--i];
          } // the height to render.


          var torender_h = 0,
              j = i;

          for (; j < row_count && torender_h < ctx._y; ++j) {
            torender_h += Number.isNaN(row_height[i]) ? possible_hight_per_tr : row_height[j];
          }

          j += overscanRowCount * 2;
          if (j > row_count) j = row_count; // returns [head, tail, top].

          return [0 | i, 0 | j, 0 | accumulate_top];
        }
      }, {
        key: "scrollHook",
        value: function scrollHook(e) {
          if (e) {
            if (e.flags) {
              // if (e.flags === SCROLLEVT_RECOMPUTE) {
              //   e.flags |= SCROLLEVT_BARRIER;
              // }
              this.event_queue.push(e);
            } else {
              this.nevent_queue.push(e);
            }
          }

          if (this.nevent_queue.length || this.event_queue.length) {
            if (this.HNDID_RAF) cancelAnimationFrame(this.HNDID_RAF); // requestAnimationFrame, ie >= 10

            this.HNDID_RAF = requestAnimationFrame(this.update_self);
          }
        }
      }, {
        key: "update_self",
        value: function update_self(timestamp) {
          var _this4 = this;

          var nevq = this.nevent_queue,
              evq = this.event_queue;
          var e; // consume the `evq` first.

          if (evq.length) {
            e = evq.shift();
          } else if (nevq.length) {
            // take the last event from the `nevq`.
            e = _make_evt(nevq.pop());
            nevq.length = 0;
          } else {
            return;
          } // if (e.flags & SCROLLEVT_MASK) {
          //   if (nevq.length) {
          //     e = _make_evt(nevq.pop());
          //     nevq.length = 0;
          //   }
          // }


          var scrollTop = e.target.scrollTop;
          var scrollLeft = e.target.scrollLeft;
          var flags = e.flags;

          if (ctx.debug) {
            console.debug("[".concat(ctx.id, "][SCROLL] top: %d, left: %d"), scrollTop, scrollLeft);
          } // checks every tr's height, so it may be take some times...


          var _this$scroll_with_com = this.scroll_with_computed(scrollTop),
              _this$scroll_with_com2 = _slicedToArray(_this$scroll_with_com, 3),
              head = _this$scroll_with_com2[0],
              tail = _this$scroll_with_com2[1],
              top = _this$scroll_with_com2[2];

          var prev_head = this.state.head,
              prev_tail = this.state.tail,
              prev_top = this.state.top;

          if (flags & SCROLLEVT_INIT) {
            log_debug(ctx, "SCROLLEVT_INIT");
            console.assert(scrollTop === 0 && scrollLeft === 0);
            this.setState({
              top: top,
              head: head,
              tail: tail
            }, function () {
              scroll_to(ctx, 0, 0); // init this vtable by (0, 0).

              _this4.HNDID_RAF = 0;
              flags &= ~SCROLLEVT_INIT;
              flags &= ~SCROLLEVT_BARRIER;
              if (_this4.event_queue.length) _this4.scrollHook(null); // consume the next.
            });

            _RC_fixed_setState(ctx, top, head, tail);

            return;
          }

          if (flags & SCROLLEVT_RECOMPUTE) {
            log_debug(ctx, "SCROLLEVT_RECOMPUTE");

            if (head === prev_head && tail === prev_tail && top === prev_top) {
              this.HNDID_RAF = 0;
              flags &= ~SCROLLEVT_BARRIER;
              flags &= ~SCROLLEVT_RECOMPUTE;
              if (this.event_queue.length) this.scrollHook(null); // consume the next.

              return;
            }

            this.setState({
              top: top,
              head: head,
              tail: tail
            }, function () {
              scroll_to(ctx, scrollTop, scrollLeft);
              _this4.HNDID_RAF = 0;
              flags &= ~SCROLLEVT_BARRIER;
              flags &= ~SCROLLEVT_RECOMPUTE;
              if (_this4.event_queue.length) _this4.scrollHook(null); // consume the next.
            });

            _RC_fixed_setState(ctx, top, head, tail);

            return;
          }

          if (flags & SCROLLEVT_RESTORETO) {
            log_debug(ctx, "SCROLLEVT_RESTORETO");
            this.setState({
              top: top,
              head: head,
              tail: tail
            }, function () {
              // to force update style assign `WH` to 0.
              ctx.WH = 0;
              update_wrap_style(ctx, ctx.computed_h);
              scroll_to(ctx, scrollTop, scrollLeft);
              _this4.HNDID_RAF = 0;
              flags &= ~SCROLLEVT_BARRIER;
              flags &= ~SCROLLEVT_RESTORETO;
              if (_this4.event_queue.length) _this4.scrollHook(null); // consume the next.
            });

            _RC_fixed_setState(ctx, top, head, tail);

            return;
          }

          if (flags & SCROLLEVT_NATIVE) {
            log_debug(ctx, "SCROLLEVT_NATIVE");
            this.scrollLeft = scrollLeft;
            this.scrollTop = scrollTop;

            var _cb_scroll = function _cb_scroll() {
              if (ctx.onScroll) {
                ctx.onScroll({
                  top: scrollTop,
                  left: scrollLeft,
                  isEnd: e.endOfElements
                });
              }
            };

            if (head === prev_head && tail === prev_tail && top === prev_top) {
              this.HNDID_RAF = 0;
              flags &= ~SCROLLEVT_NATIVE;

              _cb_scroll();

              return;
            }

            this.setState({
              top: top,
              head: head,
              tail: tail
            }, function () {
              _this4.HNDID_RAF = 0;
              flags &= ~SCROLLEVT_NATIVE;

              _cb_scroll();
            });

            _RC_fixed_setState(ctx, top, head, tail);

            return;
          }
        } // returns the last state.

      }, {
        key: "scroll",
        value: function scroll(param) {
          if (param) {
            if (this.restoring) {
              return {
                top: this.scrollTop,
                left: this.scrollLeft
              };
            }

            var lst_top = this.scrollTop;
            var lst_left = this.scrollLeft;
            this.restoring = true;

            if (typeof param.top === "number") {
              this.scrollTop = param.top;
            }

            if (typeof param.left === "number") {
              this.scrollLeft = param.left;
            }

            this.forceUpdate();
            return {
              top: lst_top,
              left: lst_left
            };
          } else {
            return {
              top: this.scrollTop,
              left: this.scrollLeft
            };
          }
        }
      }]);

      return VTable;
    }(React.Component);

    return {
      VTable: VTable,
      VTWrapper: VTWrapper,
      VTRow: VTRow,
      S: S
    };
  } // _context

}; // VT

function ASSERT_ID(id) {
  console.assert(typeof id === "number" && id > 0);
}

function _set_components(ctx, components) {
  var table = components.table,
      body = components.body,
      header = components.header;
  ctx.components.body = _objectSpread({}, ctx.components.body, {}, body);

  if (body && body.cell) {
    ctx._vtcomponents.body.cell = body.cell;
  }

  if (header) {
    ctx.components.header = header;
    ctx._vtcomponents.header = header;
  }

  if (table) {
    ctx.components.table = table;
  }
}

function init_vt(id) {
  ASSERT_ID(id);
  var inside = vt_context.get(id) || {};

  if (!inside._vtcomponents) {
    vt_context.set(id, inside);

    var _VTContext$Switch = VTContext.Switch(id),
        VTable = _VTContext$Switch.VTable,
        VTWrapper = _VTContext$Switch.VTWrapper,
        VTRow = _VTContext$Switch.VTRow,
        S = _VTContext$Switch.S; // set the virtual layer.


    inside._vtcomponents = {
      table: VTable,
      body: {
        wrapper: VTWrapper,
        row: VTRow
      }
    }; // set the default implementation layer.

    inside.components = {};

    _set_components(inside, {
      table: Table,
      body: {
        wrapper: Wrapper,
        row: Row
      }
    });

    inside.context = S; // start -> `INIT`

    inside.vt_state = e_VT_STATE.INIT;
  }

  return inside;
}

export function VTComponents(vt_opts) {
  if (Object.hasOwnProperty.call(vt_opts, "height")) {
    console.warn("The property `vt_opts.height` has been deprecated.\n                  Now it depends entirely on `scroll.y`.");
  }

  if (Object.hasOwnProperty.call(vt_opts, "reflection")) {
    console.warn("The property `vt_opts.reflection`\n                  will be deprecated in the next release.");
  }

  var inside = init_vt(vt_opts.id);
  Object.assign(inside, {
    overscanRowCount: 5,
    debug: false,
    destroy: false
  }, vt_opts);

  if (vt_opts.debug) {
    console.debug("[".concat(vt_opts.id, "] calling VTComponents with"), vt_opts);
  }

  return inside._vtcomponents;
}
/**
 * @deprecated
 */

export function getVTContext(id) {
  console.warn("This function will be deprecated in the next release.");
  return init_vt(id).context;
}
export function setComponents(id, components) {
  _set_components(init_vt(id), components);
}
/**
 * @deprecated
 */

export function getVTComponents(id) {
  console.warn("This function will be deprecated in the next release.");
  return init_vt(id).components;
}
export function VTScroll(id, param) {
  ASSERT_ID(id);

  try {
    return vt_context.get(id).VTScroll(param);
  } catch (_unused2) {
    throw new Error("[".concat(id, "]You haven't initialized this VT yet."));
  }
}