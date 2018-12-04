import { ValidationContainer, ValidationInfo } from "@skbkontur/react-ui-validations";
import _ from "lodash";
import * as React from "react";
import { Provider } from "react-redux";
import { createStore, Store, Unsubscribe } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import { AutoEvaluator, AutoValueType } from "Commons/AutoEvaluations/AutoEvaluators";

import {
    AutoEvaluationControlState,
    getAutoEvaluationState,
    getAutoEvaluationStateFromNormalizedPath,
    getValidationInfo,
    getValue,
} from "./Controls/ControlBinding";
import { FormActionsContext, FormContextActions } from "./FormActionsContext";
import {
    changeAutoEvaluationType,
    FormAction,
    replaceContext,
    replaceValidator,
    replaceValue,
    runAutoEvaluations,
    userUpdateValue,
} from "./FormStore/FormActions";
import { buildInitialState, formReducer } from "./FormStore/FormReducer";
import { FormState } from "./FormStore/FormState";
import { getIn } from "./FormStore/ImmutableOperators";
import { combineNormalizedPath, getNormalizedPath, NormalizedPath, Path } from "./Path";
import { GenericModelValidator } from "./Types";

interface GoDeeperProps<TData, TChild> {
    path: Path<TData, TChild> | NormalizedPath;
    onCustomAction?: (action: any) => void;
    children: JSX.Element;
}

class RootFormContextActions<T, TContext> implements FormContextActions<T, TContext> {
    public runAutoEvaluations = runAutoEvaluations;
    public changeAutoEvaluationType = changeAutoEvaluationType;
    public getValue = getValue;
    public getValidationInfo = getValidationInfo;
    public userUpdateValue = userUpdateValue;
    public getAutoEvaluationState = getAutoEvaluationState;
    public getValueFromContext = getValue;

    public dispatchCustomAction(action: any): void {
        throw new Error("NotImplementedError");
    }
}

class NestedFormContextActions<T, TContext> implements FormContextActions<T, TContext> {
    private readonly pathPrefix: NormalizedPath;
    private readonly handleCustomAction?: (action: any) => void;

    public constructor(pathPrefix: NormalizedPath, handleCustomAction?: (action: any) => void) {
        this.pathPrefix = pathPrefix;
        this.handleCustomAction = handleCustomAction;
    }

    public getValue = (target: any, path: any): any =>
        getIn(target, combineNormalizedPath(this.pathPrefix, getNormalizedPath(path)));

    public getValueFromContext = (target: any, path: any): any => getIn(target, getNormalizedPath(path));

    public getValidationInfo = (state: any, path: NormalizedPath): undefined | ValidationInfo =>
        getValidationInfo(state, combineNormalizedPath(this.pathPrefix, path));

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

    public changeAutoEvaluationType(path: NormalizedPath, type: AutoValueType): FormAction {
        return changeAutoEvaluationType(combineNormalizedPath(this.pathPrefix, path), type);
    }

    public runAutoEvaluations(): FormAction {
        return runAutoEvaluations();
    }

    public dispatchCustomAction(action: any): void {
        if (this.handleCustomAction != undefined) {
            this.handleCustomAction(action);
        }
    }
}

export class GoDeeper<TData, TChild, TContext> extends React.Component<GoDeeperProps<TData, TChild>> {
    public deepActions: FormContextActions<TData, TContext>;

    public constructor(props: GoDeeperProps<TData, TChild>) {
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
        this.rootActions = new RootFormContextActions<TData, TContext>();
        this.unsubscribeFromStore = this.store.subscribe(this.handleStateChange);
    }

    public shouldComponentUpdate(nextProps: FormContainerProps<TData, TContext>): boolean {
        const state = this.store.getState();
        return nextProps.value !== state.value || nextProps.validator !== state.validator;
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
        if (!_.isEqual(nextProps.context, state.context)) {
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

    public render(): JSX.Element {
        return (
            <Provider store={this.store}>
                <FormActionsContext.Provider value={this.rootActions}>
                    <ValidationContainer ref={x => (this.validationContainer = x)}>
                        {this.props.children}
                    </ValidationContainer>
                </FormActionsContext.Provider>
            </Provider>
        );
    }
}
