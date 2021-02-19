import cloneDeep from "lodash/cloneDeep";

import { AutoEvaluator, AutoValueType, NodePath, Return } from "../AutoEvaluators";
import { NormalizedPath } from "../Path";
import { PathFilter } from "../Types";
import { getKeyByNodePath } from "../Utils";

import { getIn, setIn } from "./ImmutableOperators";

type NodeValue = any;
type CustomAutoEvaluationHandler = (
    pathKey: string,
    autoEvaluatedValue: NodeValue,
    currentValue: any
) => CustomAutoEvaluationHandlerResult | null;

export interface CustomAutoEvaluationHandlerResult {
    path: string;
    nodeState: NodeState;
    selectedValue: any;
}

export interface NodeState {
    type: AutoValueType;
    autoValue: NodeValue;
    lastManualValue: NodeValue;
    initialValue: NodeValue;
}

export interface NodeStates {
    [path: string]: NodeState;
}

export interface AutoEvaluationsState<T> {
    nodeStates: NodeStates;
}

export function createEmptyAutoEvaluationState<T>(value: T): AutoEvaluationsState<T> & { value: T } {
    return {
        nodeStates: {},
        value: value,
    };
}

export function initAutoEvaluationState<T>(
    value: T,
    autoEvaluator: AutoEvaluator<T>,
    customAutoEvaluationHandler?: CustomAutoEvaluationHandler
): AutoEvaluationsState<T> & { value: T } {
    const nodeStates: NodeStates = {};
    let newValue = cloneDeep(value);
    autoEvaluator(null, newValue, (autoEvaluatedValue: NodeValue, path: NodePath) => {
        const currentValue = getIn(value, path);
        const pathKey = getKeyByNodePath(path);

        if (customAutoEvaluationHandler != null) {
            const result = customAutoEvaluationHandler(pathKey, autoEvaluatedValue, currentValue);
            if (result != null) {
                nodeStates[result.path] = result.nodeState;
                newValue = setIn(newValue, path, result.selectedValue);
                return Return.value(result.selectedValue);
            }
        }

        if (currentValue == null && autoEvaluatedValue == null) {
            nodeStates[pathKey] = {
                type: "AutoEvaluated",
                autoValue: null,
                lastManualValue: null,
                initialValue: null,
            };
        } else if (currentValue == null && autoEvaluatedValue != null) {
            nodeStates[pathKey] = {
                type: "AutoEvaluated",
                autoValue: autoEvaluatedValue,
                lastManualValue: null,
                initialValue: null,
            };
            newValue = setIn(newValue, path, autoEvaluatedValue);
            return Return.value(autoEvaluatedValue);
        } else if (currentValue !== autoEvaluatedValue) {
            nodeStates[pathKey] = {
                type: "Initial",
                autoValue: autoEvaluatedValue,
                lastManualValue: null,
                initialValue: currentValue,
            };
        } else if (currentValue === autoEvaluatedValue) {
            nodeStates[pathKey] = {
                type: "AutoEvaluated",
                autoValue: autoEvaluatedValue,
                lastManualValue: null,
                initialValue: currentValue,
            };
            newValue = setIn(newValue, path, autoEvaluatedValue);
            return Return.value(autoEvaluatedValue);
        }
        return Return.value(currentValue);
    });
    return {
        nodeStates: nodeStates,
        value: newValue,
    };
}

export function changeAutoEvaluatedType<T extends {}>(
    value: T,
    autoEvaluationState: AutoEvaluationsState<T>,
    path: NormalizedPath,
    nodeKey: string,
    type: AutoValueType
): [T, AutoEvaluationsState<T>] {
    let nextAutoEvaluationState = autoEvaluationState;
    let nextState = value;
    nextAutoEvaluationState = updateStateByKey(autoEvaluationState, nodeKey, state => {
        let nodeState = state;
        if (type !== nodeState.type) {
            nodeState = {
                ...nodeState,
                type: type,
            };
            if (type === "AutoEvaluated") {
                nextState = setIn(nextState, path, nodeState.autoValue);
            } else if (type === "Manual") {
                nextState = setIn(nextState, path, nodeState.lastManualValue);
            } else if (type === "Initial") {
                nextState = setIn(nextState, path, nodeState.initialValue);
            }
        }
        return nodeState;
    });
    return [nextState, nextAutoEvaluationState];
}

export function applyAllAutoEvaluatedType<T extends {}>(
    value: T,
    autoEvaluationState: AutoEvaluationsState<T>,
    autoEvaluator: AutoEvaluator<T>,
    pathFilter?: PathFilter
): [T, AutoEvaluationsState<T>] {
    const nextAutoEvaluationState = autoEvaluationState;
    Object.keys(autoEvaluationState.nodeStates).forEach(nodeKey => {
        if (pathFilter && !pathFilter(nodeKey)) {
            return;
        }
        nextAutoEvaluationState.nodeStates[nodeKey].type = "AutoEvaluated";
    });

    return runAutoEvaluations(value, nextAutoEvaluationState, autoEvaluator);
}

function isSameValue<T>(left: T, right: T): boolean {
    return left === right || (left == undefined && right == undefined);
}

export function changeAutoEvaluatedValue<T>(
    autoEvaluationState: AutoEvaluationsState<T>,
    nodeKey: string,
    nextValue: NodeValue
): AutoEvaluationsState<T> {
    if (!autoEvaluationState.nodeStates.hasOwnProperty(nodeKey)) {
        return autoEvaluationState;
    }
    return updateStateByKey(autoEvaluationState, nodeKey, state => {
        let nextState = state;
        switch (nextState.type) {
            case "Manual":
                if (nextValue === nextState.autoValue) {
                    nextState = {
                        ...nextState,
                        type: "AutoEvaluated",
                    };
                } else {
                    nextState = {
                        ...nextState,
                        lastManualValue: nextValue,
                    };
                }
                break;
            case "Initial": {
                if (nextValue === nextState.autoValue) {
                    nextState = {
                        ...nextState,
                        type: "AutoEvaluated",
                    };
                } else if (!isSameValue(nextValue, nextState.initialValue)) {
                    nextState = {
                        ...nextState,
                        type: "Manual",
                        lastManualValue: nextValue,
                    };
                }
                break;
            }
            case "AutoEvaluated":
                if (nextValue !== state.autoValue) {
                    nextState = {
                        ...nextState,
                        type: "Manual",
                        lastManualValue: nextValue,
                    };
                }
                break;
            default:
                break;
        }
        return nextState;
    });
}

function updateStateByKey<T extends {}>(
    autoEvaluationState: AutoEvaluationsState<T>,
    nodeKey: string,
    updater: (nodeState: NodeState) => NodeState
): AutoEvaluationsState<T> {
    const prevState = autoEvaluationState.nodeStates[nodeKey];
    const nextState = updater(prevState);
    if (nextState !== prevState) {
        return {
            ...autoEvaluationState,
            nodeStates: {
                ...autoEvaluationState.nodeStates,
                [nodeKey]: nextState,
            },
        };
    }
    return autoEvaluationState;
}

export function runAutoEvaluations<T>(
    value: T,
    autoEvaluationState: AutoEvaluationsState<T>,
    autoEvaluator: AutoEvaluator<T>
): [T, AutoEvaluationsState<T>] {
    const nodeStates: NodeStates = {};
    const nextState = autoEvaluator(null, value, (autoEvaluatedValue: NodeValue, path: NodePath) => {
        const currentValue = getIn(value, path);
        const pathKey = getKeyByNodePath(path);
        const nodeState = autoEvaluationState.nodeStates[pathKey] || { type: "AutoEvaluated" };
        if (nodeState.type === "AutoEvaluated") {
            nodeStates[pathKey] = {
                ...nodeState,
                type: "AutoEvaluated",
                autoValue: autoEvaluatedValue,
            };
            return Return.unchanged;
        } else {
            nodeStates[pathKey] = {
                ...nodeState,
                autoValue: autoEvaluatedValue,
            };
        }
        return Return.value(currentValue);
    });
    return [
        nextState,
        {
            nodeStates: nodeStates,
        },
    ];
}
