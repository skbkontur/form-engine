export type NodePath = Array<string | number>;

export type TraverseHandler = (autoEvaluatedValue: mixed, path: NodePath) => TraverseHandlerResult;

export type TraverseHandlerResult = { type: "Unchanged" } | { type: "Value"; value: any };

export type AutoValueType = "Initial" | "Manual" | "AutoEvaluated";

export type AutoEvaluator<T> = (prev: Nullable<T>, next: T, traverseHandler?: TraverseHandler) => T;

const unchangedLiteral: TraverseHandlerResult = { type: "Unchanged" };

export const Return = {
    unchanged: unchangedLiteral,
    value: <T extends any>(x: T): TraverseHandlerResult => ({ type: "Value", value: x }),
};
