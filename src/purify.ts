import { Component } from "react";

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    // Added the nonzero y check to make Flow happy, but it is redundant
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
  }
}

const duckKey = "duck";
const storeKey = "store";
/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
function shallowEqual(objA, objB) {
  if (is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  const isDuckComponent =
    duckKey in objA &&
    storeKey in objA &&
    (duckKey in objB && storeKey in objB);

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];

    if (
      isDuckComponent &&
      key === storeKey &&
      is(
        objA[duckKey].selector(objA[storeKey]),
        objB[duckKey].selector(objB[storeKey])
      )
    ) {
      continue;
    }
    if (!hasOwnProperty.call(objB, key) || !is(objA[key], objB[key])) {
      return false;
    }
  }

  return true;
}

export function shouldComponentUpdate(instance, props, state) {
  return (
    !shallowEqual(instance.props, props) || !shallowEqual(instance.state, state)
  );
}

function shouldComponentUpdateForReplace(nextProps, nextState) {
  return shouldComponentUpdate(this, nextProps, nextState);
}

/**
 * Make React stateless Component Memorizeable.
 * If props.duck's local state unchange, ignore store change.
 */
export function purify(component): any {
  if (typeof component.prototype.isReactComponent === "object") {
    if (component.prototype.shouldComponentUpdate !== undefined) {
      console.warn(
        "purify() only use to decorate class dose not implement shouldComponentUpdate"
      );
    }
    // 强制覆盖
    component.prototype.shouldComponentUpdate = shouldComponentUpdateForReplace;
    return component;
  } else {
    const statelessRender = component;
    class PureRender extends Component {
      private props: any;
      render() {
        return statelessRender(this.props);
      }
      shouldComponentUpdate(nextProps, nextState) {
        return shouldComponentUpdate(this, nextProps, nextState);
      }
    }
    (PureRender as any).displayName = statelessRender && statelessRender.name;
    return PureRender;
  }
}
