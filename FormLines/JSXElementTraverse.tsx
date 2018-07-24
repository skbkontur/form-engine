import * as React from "react";

export interface JSXElementVisitor {
    visitElementOpen(element: JSX.Element): JSX.Element;
    visitElementClose(element: JSX.Element): JSX.Element;
}

export function traverseElemenents(root: JSX.Element, visitor: JSXElementVisitor): JSX.Element {
    root = visitor.visitElementOpen(root);
    if (root.props && root.props.children != null) {
        root = React.cloneElement(root, {
            children: React.Children.map(root.props.children, x => {
                if (typeof x === "string" || typeof x === "number") {
                    return x;
                }
                return traverseElemenents(x, visitor);
            }),
        });
    }
    root = visitor.visitElementClose(root);
    return root;
}
