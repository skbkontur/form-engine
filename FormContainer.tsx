import { ValidationContainer, ValidationInfo } from "@skbkontur/react-ui-validations";
import _ from "lodash";
import * as React from "react";
import { Provider } from "react-redux";
import { createStore, Store, Unsubscribe } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import { AutoEvaluator, AutoValueType } from "Commons/AutoEvaluations/AutoEvaluators";
import { ValidationResult } from "Commons/Mutators/Types";

import {
    AutoEvaluationControlState,
    getAutoEvaluationState,
    getAutoEvaluationStateFromNormalizedPath,
    getPartialValidationResult,
    getValidationInfo,
    getValue,
    isAllAutoEvaliationsEnabled,
} from "./Controls/ControlBinding";
import { FormActionsContext, FormContextActions } from "./FormActionsContext";
import {
    changeAutoEvaluationType,
    FormAction,
    replaceContext,
    replaceValidator,
    replaceValue,
    runAllAutoEvaluations,
    runAutoEvaluations,
    setAutoEvaliationStateToStore,
    userChangeContext,
    userUpdateValue,
} from "./FormStore/FormActions";
import { buildInitialState, formReducer } from "./FormStore/FormReducer";
import { FormState } from "./FormStore/FormState";
import { getIn } from "./FormStore/ImmutableOperators";
import { combineNormalizedPath, getNormalizedPath, NormalizedPath, Path } from "./Path";
import { GenericModelValidator, PathFilter } from "./Types";

interface NestedFormContainerProps<TData, TChild> {
    path: Path<TData, TChild> | NormalizedPath;
    onCustomAction?: (action: any) => void;
    children: JSX.Element;
}

class RootFormContextActions<T, TContext> implements FormContextActions<T, TContext> {
    private readonly handleCustomAction?: (action: any) => void;
    public runAutoEvaluations = runAutoEvaluations;
    public runAllAutoEvaluations = runAllAutoEvaluations;
    public changeAutoEvaluationType = changeAutoEvaluationType;
    public getValue = getValue;
    public getValidationInfo = getValidationInfo;
    public getPartialValidationResult = getPartialValidationResult;
    public userUpdateValue = userUpdateValue;
    public getAutoEvaluationState = getAutoEvaluationState;
    public isAllAutoEvaliationsEnabled = isAllAutoEvaliationsEnabled;
    public getValueFromContext = getValue;
    public userChangeContext = userChangeContext;

    public setAutoEvaliationStateToStore = setAutoEvaliationStateToStore;

    public constructor(handleCustomAction?: (action: any) => void) {
        this.handleCustomAction = handleCustomAction;
    }

    public dispatchCustomAction = (action: any): void => {
        if (this.handleCustomAction != undefined) {
            this.handleCustomAction(action);
        }
    };
}

class NestedFormContextActions<T, TContext> implements FormContextActions<T, TContext> {
    private readonly pathPrefix: NormalizedPath;
    private readonly handleCustomAction?: (action: any) => void;

    public setAutoEvaliationStateToStore = setAutoEvaliationStateToStore;

    public constructor(pathPrefix: NormalizedPath, handleCustomAction?: (action: any) => void) {
        this.pathPrefix = pathPrefix;
        this.handleCustomAction = handleCustomAction;
    }

    public getValue = (target: any, path: any): any =>
        getIn(target, combineNormalizedPath(this.pathPrefix, getNormalizedPath(path)));

    public getValueFromContext = (target: any, path: any): any => getIn(target, getNormalizedPath(path));

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

    public isAllAutoEvaliationsEnabled<T>(formState: FormState<T>, pathFilter?: PathFilter): boolean {
        const autoEvaluationState = formState.autoEvaluationState;
        if (autoEvaluationState == undefined) {
            return false;
        }
        return Object.keys(autoEvaluationState.nodeStates)
            .filter(x => pathFilter && pathFilter(x))
            .every(x => autoEvaluationState.nodeStates[x].type === "AutoEvaluated");
    }

    public changeAutoEvaluationType(path: NormalizedPath, type: AutoValueType): FormAction {
        return changeAutoEvaluationType(combineNormalizedPath(this.pathPrefix, path), type);
    }

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

    public userChangeContext(path: NormalizedPath, nextContext: any): FormAction {
        return userChangeContext(path, nextContext);
    }
}

export class NestedFormContainer<TData, TChild, TContext> extends React.Component<
    NestedFormContainerProps<TData, TChild>
> {
    public deepActions: FormContextActions<TData, TContext>;

    public constructor(props: NestedFormContainerProps<TData, TChild>) {
        super(props);
        const pathPrefix = Array.isArray(props.path) ? props.path : getNormalizedPath(props.path);
        this.deepActions = new NestedFormContextActions<TData, TContext>(pathPrefix, this.handleCustomAction);
    }

    public readonly handleCustomAction = (action: any) => {
        const { onCustomAction } = this.props;
        if (onCustomAction != undefined) {
            onCustomAction(action);
        }
    };

    public render(): JSX.Element {
        return (
            <FormActionsContext.Provider value={this.deepActions}>{this.props.children}</FormActionsContext.Provider>
        );
    }
}

interface FormContainerProps<TData, TContext> {
    storeName?: string;
    value: TData;
    context: TContext;
    onChange: (nextValue: TData) => void;
    validator?: GenericModelValidator<TData>;
    children: JSX.Element;
    autoEvaluator?: AutoEvaluator<TData>;
    onCustomAction?: (action: any) => void;
    inModal?: boolean;
}

export class FormContainer<TData, TContext = any> extends React.Component<FormContainerProps<TData, TContext>> {
    public store: Store<FormState<TData, TContext>>;
    public unsubscribeFromStore?: Unsubscribe;
    public validationContainer: ValidationContainer | null;
    public rootActions: FormContextActions<TData, TContext>;

    public constructor(props: FormContainerProps<TData, TContext>) {
        super(props);
        const storeEnhancer = devToolsEnhancer({ name: props.storeName });
        this.store = createStore(
            formReducer,
            buildInitialState(props.value, props.context, props.validator, props.autoEvaluator),
            storeEnhancer
        );
        this.rootActions = new RootFormContextActions<TData, TContext>(this.handleCustomAction);
        this.unsubscribeFromStore = this.store.subscribe(this.handleStateChange);
    }

    public shouldComponentUpdate(nextProps: FormContainerProps<TData, TContext>): boolean {
        const state = this.store.getState();
        return (
            nextProps.value !== state.value ||
            nextProps.validator !== state.validator ||
            (nextProps.context != null &&
                Object.keys(nextProps.context).some(key => this.props.context[key] !== nextProps.context[key]))
        );
    }

    public handleStateChange = () => {
        if (this.props.value !== this.store.getState().value) {
            this.props.onChange(this.store.getState().value);
        }
    };

    public componentWillReceiveProps(nextProps: FormContainerProps<TData, TContext>) {
        // TODO отпасти изменение контекста
        const state = this.store.getState();
        if (nextProps.value !== state.value) {
            this.store.dispatch(replaceValue(nextProps.value));
        }
        if (nextProps.validator !== state.validator) {
            this.store.dispatch(replaceValidator(nextProps.validator));
        }
        if (
            nextProps.context != null &&
            Object.keys(nextProps.context).some(key => nextProps.context[key] !== state.context[key])
        ) {
            this.store.dispatch(replaceContext(nextProps.context));
        }
    }

    public componentWillUnmount() {
        if (this.unsubscribeFromStore != null) {
            this.unsubscribeFromStore();
        }
    }

    public async validate(): Promise<boolean> {
        if (this.validationContainer != null) {
            return this.validationContainer.validate();
        }
        return true;
    }

    public submit(): void {
        if (this.validationContainer != null) {
            this.validationContainer.submit();
        }
        return;
    }

    public readonly handleCustomAction = (action: any) => {
        const { onCustomAction } = this.props;
        if (onCustomAction != undefined) {
            onCustomAction(action);
        }
    };

    public render(): JSX.Element {
        return (
            <Provider store={this.store}>
                <FormActionsContext.Provider value={this.rootActions}>
                    <ValidationContainer
                        ref={x => (this.validationContainer = x)}
                        scrollOffset={this.props.inModal ? 100 : undefined}>
                        {this.props.children}
                    </ValidationContainer>
                </FormActionsContext.Provider>
            </Provider>
        );
    }
}
