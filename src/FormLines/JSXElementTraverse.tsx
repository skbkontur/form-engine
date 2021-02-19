import * as React from "react";

export interface JSXElementVisitor {
    visitElementOpen(element: JSX.Element): JSX.Element;
    visitElementClose(element: JSX.Element): JSX.Element;
}

export function traverseElements(root: JSX.Element, visitor: JSXElementVisitor): JSX.Element {
    let result = root;
    result = visitor.visitElementOpen(result);
    if (result?.props.children != null) {
        result = React.cloneElement(result, {
            children: React.Children.map(result.props.children, x => {
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
