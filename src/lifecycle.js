import {removeRef, replace, replaceAttr, h} from './tag';

function toFragment (replaceWith) {
    if (replaceWith.nodeType) {
        return replaceWith;
    }
    return h`${replaceWith}`;
}

function maybeCall (fn, _this) {
    fn && fn.call(_this);
}

function willDetach (expr) {
    maybeCall(expr.willDetach, expr);
}

function didAttach (expr) {
    maybeCall(expr.didAttach, expr);
}

function performRender (expr) {
    maybeCall(expr.willRender, expr);

    if (expr.lemnRef.attr) {
      replaceAttr(expr.lemnRef, expr.render() || '');
    } else {
      const fragment = toFragment(expr.render() || ' ');
      if (!fragment.lemnRef) {
        (expr.lemnRef.lemnComponents || []).forEach(v => !(fragment.lemnComponents || []).includes(v) && willDetach(v));
        (fragment.lemnComponents || []).forEach(component => performRender(component));
        (fragment.lemnComponents || []).forEach(v => !(expr.lemnRef.lemnComponents || []).includes(v) && didAttach(v));
        expr.lemnRef.lemnComponents = (fragment.lemnComponents || []);

        replace(expr.lemnRef, fragment);
        fragment.lemnRef = expr.lemnRef;
      }
    }

    maybeCall(expr.didRender, expr);
}

/**
 * Queue to call a component's render method later and inject its returned
 * value into the dom.
 *
 * @param {Component} component - rerender this component soon
 */
function rerender (expr) {
    return Promise.resolve(expr).then(performRender);
}

/**
 * Attach a component into some root node.
 *
 * @param {HTMLElement} root - html element to attach component under
 * @param {Component} component - component to render
 */
function attach(root, expr) {
    root.appendChild(h`${expr}`);
    performRender(expr);
    didAttach(expr);
}

/**
 * Detach a component from the dom.
 *
 * @param {Component} component - component to detach from parent dom
 */
function detach(expr) {
    willDetach(expr);
    removeRef(expr.lemnRef);
}

export {
    toFragment,
    maybeCall,
    performRender,
    rerender,
    attach,
    detach,
};
