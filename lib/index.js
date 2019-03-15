(function webpackUniversalModuleDefinition(root, factory) {
	//https://github.com/wubostc/virtualized-table-for-antd
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react"));
	//https://github.com/wubostc/virtualized-table-for-antd
	else if(typeof define === 'function' && define.amd)
		define(["react"], factory);
	//https://github.com/wubostc/virtualized-table-for-antd
	else if(typeof exports === 'object')
		exports["libx"] = factory(require("react"));
	//https://github.com/wubostc/virtualized-table-for-antd
	else
		root["libx"] = factory(root["react"]);
})(window, function(__WEBPACK_EXTERNAL_MODULE__1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(__webpack_require__(1));
var e_vt_state;
(function (e_vt_state) {
    e_vt_state[e_vt_state["INIT"] = 0] = "INIT";
    e_vt_state[e_vt_state["LOADED"] = 1] = "LOADED";
    e_vt_state[e_vt_state["RUNNING"] = 2] = "RUNNING";
    e_vt_state[e_vt_state["CACHE"] = 3] = "CACHE";
})(e_vt_state || (e_vt_state = {}));
const store = new Map();
var excellent_observer;
(function (excellent_observer) {
    excellent_observer[excellent_observer["update_self"] = 1] = "update_self";
    excellent_observer[excellent_observer["skip"] = 2] = "skip";
})(excellent_observer = exports.excellent_observer || (exports.excellent_observer = {}));
var VT_CONTEXT;
(function (VT_CONTEXT) {
    function Switch(ID) {
        const S = React.createContext({ head: 0, tail: 0 }, (prev, next) => {
            const ccb = store.get(ID).changedBits;
            if (ccb) {
                return ccb(prev, next);
            }
            if (prev.head !== next.head || prev.tail !== next.tail) {
                return 1 | 2;
            }
            return 2;
        });
        function update_wrap_style(warp, h) {
            warp.style.height = `${h}px`;
            warp.style.maxHeight = `${h}px`;
        }
        class VTRow extends React.Component {
            constructor(props, context) {
                super(props, context);
                this.inst = React.createRef();
            }
            render() {
                const _a = this.props, { children } = _a, restProps = __rest(_a, ["children"]);
                return (React.createElement("tr", Object.assign({}, restProps, { ref: this.inst }), children));
            }
            componentDidMount() {
                this.collect_h_tr(this.props.children[0].props.index, this.inst.current.clientHeight);
                const values = store.get(ID);
                if (values.load_the_trs_once === 0)
                    values.load_the_trs_once = 1;
            }
            shouldComponentUpdate(nextProps, nextState) {
                return true;
            }
            componentDidUpdate() {
                this.collect_h_tr(this.props.children[0].props.index, this.inst.current.clientHeight);
            }
            collect_h_tr(idx, val) {
                console.assert(!!val);
                const values = store.get(ID);
                const { computed_h = 0, row_height = [], re_computed, } = values;
                let _computed_h = computed_h;
                if (values.possible_hight_per_tr === -1) {
                    values.possible_hight_per_tr = val;
                }
                if (re_computed === 0) {
                    if (row_height[idx]) {
                        _computed_h += (val - row_height[idx]);
                    }
                    else {
                        _computed_h = _computed_h - values.possible_hight_per_tr + val;
                    }
                }
                row_height[idx] = val;
                if (values.computed_h !== _computed_h && values.load_the_trs_once !== 0) {
                    update_wrap_style(values.wrap_inst.current, _computed_h);
                }
                values.computed_h = _computed_h;
                values.row_height = row_height;
            }
        }
        class VTWrapper extends React.Component {
            constructor(props, context) {
                super(props, context);
                this.cnt = 0;
                this.id = ID;
                this.VTWrapperRender = store.get(ID).VTWrapperRender;
            }
            render() {
                const _a = this.props, { children } = _a, restProps = __rest(_a, ["children"]);
                return (React.createElement(S.Consumer, { unstable_observedBits: 1 }, ({ head, tail }) => {
                    if (this.cnt !== children.length) {
                        this.set_tr_cnt(children.length, this.id);
                        this.cnt = children.length;
                    }
                    if (this.VTWrapperRender) {
                        return this.VTWrapperRender(head, tail, children, restProps);
                    }
                    return React.createElement("tbody", Object.assign({}, restProps), children.slice(head, tail));
                }));
            }
            componentDidMount() {
                this.predict_height();
            }
            componentDidUpdate() {
                this.predict_height();
            }
            shouldComponentUpdate(nextProps, nextState) {
                return true;
            }
            predict_height() {
                const values = store.get(this.id);
                const possible_hight_per_tr = values.possible_hight_per_tr;
                if (values.load_the_trs_once === 0)
                    return;
                let { computed_h = 0, re_computed, } = values;
                const row_count = values.row_count;
                const row_height = values.row_height;
                if (re_computed < 0) {
                    for (let i = row_count; re_computed < 0; ++i, ++re_computed) {
                        computed_h -= (row_height[i] || possible_hight_per_tr);
                    }
                }
                else if (re_computed > 0) {
                    for (let i = row_count - 1; re_computed > 0; --i, --re_computed) {
                        computed_h += (row_height[i] || possible_hight_per_tr);
                    }
                }
                values.computed_h = computed_h;
            }
            set_tr_cnt(n, id) {
                const vals = store.get(id);
                const row_count = vals.row_count || 0;
                let re_computed;
                re_computed = n - row_count;
                vals.row_count = n;
                vals.re_computed = re_computed;
            }
        }
        class VT extends React.Component {
            constructor(props, context) {
                super(props, context);
                this.inst = React.createRef();
                this.wrap_inst = React.createRef();
                this.scrollTop = 0;
                this.scrollLeft = 0;
                this.scoll_snapshot = false;
                this.state = {
                    top: 0,
                    head: 0,
                    tail: 1,
                };
                this.id = ID;
                this.scrollHook = this.scrollHook.bind(this);
                const values = store.get(this.id);
                if (values.load_the_trs_once !== 3) {
                    values.possible_hight_per_tr = -1;
                    values.computed_h = 0;
                    values.re_computed = 0;
                }
                values.VTRefresh = this.refresh.bind(this);
                values.VTScroll = this.scroll.bind(this);
                values.load_the_trs_once = 0;
                this.user_context = {};
                this.store = values;
                let reflection = values.reflection || [];
                if (typeof reflection === "string") {
                    reflection = [reflection];
                }
                const bereflected = this.props;
                for (const field of reflection) {
                    this.user_context[field] = bereflected[field];
                }
            }
            render() {
                const { head, tail, top } = this.state;
                const _a = this.props, { style, children } = _a, rest = __rest(_a, ["style", "children"]);
                const _style = Object.assign({}, style, { position: "absolute", top });
                return (React.createElement("div", { ref: this.wrap_inst, style: { display: "block", position: "relative", transform: "matrix(1, 0, 0, 1, 0, 0)" } },
                    React.createElement("table", Object.assign({}, rest, { ref: this.inst, style: _style }),
                        React.createElement(S.Provider, { value: Object.assign({ tail, head }, this.user_context) }, children))));
            }
            componentDidMount() {
                this.wrap_inst.current.setAttribute("vt", `[${ID}] vt is works!`);
                this.wrap_inst.current.parentElement.onscroll = this.scrollHook;
                store.set(this.id, Object.assign({}, store.get(this.id), { wrap_inst: this.wrap_inst }));
                const values = store.get(this.id);
                this.store = values;
                values.re_computed = 0;
                update_wrap_style(values.wrap_inst.current, values.computed_h);
            }
            componentDidUpdate() {
                const values = store.get(this.id);
                this.store = values;
                update_wrap_style(values.wrap_inst.current, values.computed_h);
                if (values.load_the_trs_once === 0) {
                    return;
                }
                if (this.scoll_snapshot) {
                    values.load_the_trs_once = 2;
                    values.re_computed = 0;
                    this.scrollHook({ target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft } });
                    return;
                }
                if (values.load_the_trs_once === 1) {
                    values.load_the_trs_once = 2;
                    this.scrollHook({ target: { scrollTop: 0, scrollLeft: 0 } });
                }
                if (values.re_computed !== 0) {
                    values.re_computed = 0;
                    this.scrollHook({ target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft } });
                }
            }
            componentWillUnmount() {
                this.store.load_the_trs_once = 3;
                this.setState = (...args) => null;
            }
            shouldComponentUpdate(nextProps, nextState) {
                return true;
            }
            scroll_with_computed(top, left) {
                const { row_height, row_count, height, possible_hight_per_tr, overscanRowCount = 1, } = this.store;
                let overscan = overscanRowCount;
                let accumulate_top = 0, i = 0;
                for (; i < row_count; ++i) {
                    if (accumulate_top > top)
                        break;
                    accumulate_top += (row_height[i] || possible_hight_per_tr);
                }
                if (i > 0) {
                    do {
                        accumulate_top -= (row_height[--i] || possible_hight_per_tr);
                    } while (overscan-- && i);
                }
                overscan = overscanRowCount * 2;
                let torender_h = 0, j = i;
                for (; j < row_count; ++j) {
                    if (torender_h > height)
                        break;
                    torender_h += (row_height[j] || possible_hight_per_tr);
                }
                if (j < row_count) {
                    do {
                        torender_h += (row_height[j++] || possible_hight_per_tr);
                    } while ((--overscan > 0) && (j < row_count));
                }
                return [0 | i, 0 | j, 0 | accumulate_top];
            }
            refresh() {
                const [head, tail, top] = this.scroll_with_computed(this.scrollTop, this.scrollLeft);
                this.setState({ top, head, tail });
            }
            scrollHook(e) {
                const { scrollTop, scrollLeft } = e.target;
                requestAnimationFrame((timestamp) => {
                    if (!this.timestamp) {
                        this.timestamp = timestamp;
                    }
                    cancelAnimationFrame(timestamp);
                    const values = this.store;
                    if (values.onScroll) {
                        const top = values.wrap_inst.current.parentElement.scrollTop;
                        const left = values.wrap_inst.current.parentElement.scrollLeft;
                        values.onScroll({ top, left });
                    }
                    const [head, tail, top] = this.scroll_with_computed(scrollTop, scrollLeft);
                    const prev_head = this.state.head, prev_tail = this.state.tail, prev_top = this.state.top;
                    if (head === prev_head && tail === prev_tail && top === prev_top)
                        return;
                    this.scrollLeft = scrollLeft;
                    this.scrollTop = scrollTop;
                    if (this.scoll_snapshot) {
                        this.scoll_snapshot = false;
                        this.setState({ top, head, tail }, () => {
                            values.wrap_inst.current.parentElement.scrollTo(scrollLeft, scrollTop);
                        });
                    }
                    else {
                        this.setState({ top, head, tail });
                    }
                    this.timestamp = timestamp;
                });
            }
            scroll(param) {
                if (param) {
                    if (typeof param.top === "number") {
                        this.scrollTop = param.top;
                    }
                    if (typeof param.left === "number") {
                        this.scrollLeft = param.left;
                    }
                    this.scoll_snapshot = true;
                    this.forceUpdate();
                }
                else {
                    return { top: this.scrollTop, left: this.scrollLeft };
                }
            }
        }
        VT.Wrapper = VTWrapper;
        VT.Row = VTRow;
        return { VT, Wrapper: VTWrapper, Row: VTRow, S };
    }
    VT_CONTEXT.Switch = Switch;
})(VT_CONTEXT || (VT_CONTEXT = {}));
function ASSERT_ID(id) {
    console.assert(typeof id === "number" && id > 0);
}
function init(id) {
    const inside = store.get(id) || {};
    if (!inside.components) {
        const { VT, Wrapper, Row, S } = VT_CONTEXT.Switch(id);
        inside.components = { table: VT, wrapper: Wrapper, row: Row };
        inside.context = S;
    }
    return inside;
}
function createVT(vt_opts) {
    ASSERT_ID(vt_opts.id);
    console.assert(typeof vt_opts.height === "number" && vt_opts.height >= 0);
    const id = vt_opts.id;
    const inside = init(id);
    store.set(id, Object.assign({}, vt_opts, inside, { height: vt_opts.height, onScroll: vt_opts.onScroll }));
    return inside;
}
function VTComponents(vt_opts) {
    const _store = createVT(vt_opts);
    return {
        table: _store.components.table,
        body: {
            wrapper: _store.components.wrapper,
            row: _store.components.row
        }
    };
}
exports.VTComponents = VTComponents;
function getVTContext(id) {
    ASSERT_ID(id);
    const inside = init(id);
    store.set(id, Object.assign({}, inside));
    return store.get(id).context;
}
exports.getVTContext = getVTContext;
function getVTComponents(id) {
    ASSERT_ID(id);
    const inside = init(id);
    store.set(id, Object.assign({}, inside));
    return store.get(id).components;
}
exports.getVTComponents = getVTComponents;
function VTScroll(id, param) {
    ASSERT_ID(id);
    const inside = init(id);
    store.set(id, Object.assign({}, inside));
    return store.get(id).VTScroll(param);
}
exports.VTScroll = VTScroll;
function VTRefresh(id) {
    ASSERT_ID(id);
    store.get(id).VTRefresh();
}
exports.VTRefresh = VTRefresh;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__1__;

/***/ })
/******/ ]);
});