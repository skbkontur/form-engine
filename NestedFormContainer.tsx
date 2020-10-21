import { ValidationInfo } from "@skbkontur/react-ui-validations";
import React from "react";
import { AutoValueType } from "Commons/AutoEvaluations/AutoEvaluators";
import { ValidationResult } from "Commons/Mutators/Types";

import {
    AutoEvaluationControlState,
    getAutoEvaluationStateFromNormalizedPath,
    getPartialValidationResult,
    getValidationInfo,
} from "./Controls/ControlBinding";
import { FormActionsContext, FormContextActions } from "./FormActionsContext";
import {
    changeAutoEvaluationType,
    FormAction,
    runAllAutoEvaluations,
    runAutoEvaluations,
    setAutoEvaluationStateToStore,
    userUpdateValue,
} from "./FormStore/FormActions";
import { FormState } from "./FormStore/FormState";
import { getIn } from "./FormStore/ImmutableOperators";
import { combineNormalizedPath, getNormalizedPath, NormalizedPath, Path } from "./Path";
import { PathFilter } from "./Types";

interface NestedFormContainerProps<TData, TChild, TDataContext, TChildContext> {
    path: Path<TData, TChild> | NormalizedPath;
    contextPath?: Path<TDataContext, TChildContext> | NormalizedPath;
    onCustomAction?: (action: any) => void;
    children: JSX.Element;
}

export class NestedFormContainer<TData, TChild, TDataContext, TChildContext = TDataContext> extends React.PureComponent<
    NestedFormContainerProps<TData, TChild, TDataContext, TChildContext>
> {
    public deepActions: FormContextActions<TData, TDataContext>;

    public constructor(props: NestedFormContainerProps<TData, TChild, TDataContext, TChildContext>) {
        super(props);
        const pathPrefix = Array.isArray(props.path) ? props.path : getNormalizedPath(props.path);
        const contextPathPrefix =
            props.contextPath == null || Array.isArray(props.contextPath)
                ? props.contextPath
                : getNormalizedPath(props.contextPath);
        this.deepActions = new NestedFormContextActions<TData, TDataContext>(
            pathPrefix,
            contextPathPrefix,
            this.handleCustomAction
        );
    }

    public render(): JSX.Element {
        return (
            <FormActionsContext.Provider value={this.deepActions}>{this.props.children}</FormActionsContext.Provider>
        );
    }

    public readonly handleCustomAction = (action: any) => {
        const { onCustomAction } = this.props;
        if (onCustomAction != undefined) {
            onCustomAction(action);
        }
    };
}

class NestedFormContextActions<T, TContext> implements FormContextActions<T, TContext> {
    private readonly pathPrefix: NormalizedPath;
    private readonly contextPathPrefix?: NormalizedPath;
    private readonly handleCustomAction?: (action: any) => void;

    public setAutoEvaluationStateToStore = setAutoEvaluationStateToStore;

    public constructor(
        pathPrefix: NormalizedPath,
        contextPath?: NormalizedPath,
        handleCustomAction?: (action: any) => void
    ) {
        this.pathPrefix = pathPrefix;
        this.contextPathPrefix = contextPath;
        this.handleCustomAction = handleCustomAction;
    }

    public getValue = (target: any, path: any): any =>
        getIn(target, combineNormalizedPath(this.pathPrefix, getNormalizedPath(path)));

    public getValueFromContext = (target: any, path: any): any =>
        getIn(
            target,
            this.contextPathPrefix == null
                ? getNormalizedPath(path)
                : combineNormalizedPath(this.contextPathPrefix, getNormalizedPath(path))
        );

    public getValidationInfo = (state: any, path: NormalizedPath): undefined | ValidationInfo =>
        getValidationInfo(state, combineNormalizedPath(this.pathPrefix, path));

    public getPartialValidationResult = (state: any, path: NormalizedPath): undefined | ValidationResult =>
        getPartialValidationResult(state, combineNormalizedPath(this.pathPrefix, path));

    public userUpdateValue = (path: NormalizedPath, value: any): FormAction =>
        userUpdateValue(combineNormalizedPath(this.pathPrefix, path), value);

    public getAutoEvaluationState = <T, TChild>(
        formState: FormState<T>,
        path: Path<T, TChild>
    ): AutoEvaluationControlState<TChild> | undefined =>
        getAutoEvaluationStateFromNormalizedPath(
            formState,
            combineNormalizedPath(this.pathPrefix, getNormalizedPath(path))
        );

    public isAllAutoEvaluationsEnabled<T>(formState: FormState<T>, pathFilter?: PathFilter): boolean {
        const autoEvaluationState = formState.autoEvaluationState;
        if (autoEvaluationState == undefined) {
            return false;
        }
        return Object.keys(autoEvaluationState.nodeStates)
            .filter(x => pathFilter && pathFilter(x))
            .every(x => autoEvaluationState.nodeStates[x].type === "AutoEvaluated");
    }

    public changeAutoEvaluationType = (path: NormalizedPath, type: AutoValueType): FormAction =>
        changeAutoEvaluationType(combineNormalizedPath(this.pathPrefix, path), type);

    public runAutoEvaluations(): FormAction {
        return runAutoEvaluations();
    }

    public runAllAutoEvaluations(pathFilter?: PathFilter): FormAction {
        return runAllAutoEvaluations(pathFilter);
    }

    public dispatchCustomAction(action: any): void {
        if (this.handleCustomAction != undefined) {
            this.handleCustomAction(action);
        }
    }
}
