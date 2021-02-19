import { cloneElement, Children } from "react";

export interface JSXElementVisitor {
    visitElementOpen(element: JSX.Element): JSX.Element;
    visitElementClose(element: JSX.Element): JSX.Element;
}

export function traverseElements(root: JSX.Element, visitor: JSXElementVisitor): JSX.Element {
    let result = root;
    result = visitor.visitElementOpen(result);
    if (result?.props.children != null) {
        result = cloneElement(result, {
            children: Children.map(result.props.children, x => {
                if (typeof x === "string" || typeof x === "number") {
                    return x;
                }
                return traverseElements(x, visitor);
            }),
        });
    }
    result = visitor.visitElementClose(result);
    return result;
}
