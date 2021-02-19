import { ValidationContainer } from "@skbkontur/react-ui-validations";
import { isEqual } from "lodash";
import React from "react";
import { Provider } from "react-redux";
import { createStore, Store, Unsubscribe } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";

import { AutoEvaluator } from "./AutoEvaluators";
import {
    getAutoEvaluationState,
    getPartialValidationResult,
    getValidationInfo,
    getValue,
    isAllAutoEvaluationsEnabled,
} from "./Controls/ControlBinding";
import { FormActionsContext, FormContextActions } from "./FormActionsContext";
import {
    changeAutoEvaluationType,
    replaceContext,
    replaceValidator,
    replaceValue,
    runAllAutoEvaluations,
    runAutoEvaluations,
    setAutoEvaluationStateToStore,
    userUpdateValue,
} from "./FormStore/FormActions";
import { AutoEvaluationsState } from "./FormStore/FormAutoEvaluations";
import { buildInitialState, formReducer } from "./FormStore/FormReducer";
import { FormState } from "./FormStore/FormState";
import { GenericModelValidator } from "./Types";

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
    customInitAutoEvaluationState?: (
        value: TData,
        autoEvaluator: AutoEvaluator<TData>
    ) => AutoEvaluationsState<TData> & { value: TData };
}

export class FormContainer<TData, TContext = any> extends React.Component<FormContainerProps<TData, TContext>> {
    public store: Store<FormState<TData, TContext>>;
    public unsubscribeFromStore?: Unsubscribe;
    public validationContainer: ValidationContainer | null = null;
    public rootActions: FormContextActions<TData, TContext>;

    public constructor(props: FormContainerProps<TData, TContext>) {
        super(props);
        const storeEnhancer = devToolsEnhancer({ name: props.storeName });
        this.store = createStore(
            // @ts-ignore
            formReducer,
            // @ts-ignore
            buildInitialState(
                props.value,
                props.context,
                props.validator,
                props.autoEvaluator,
                props.customInitAutoEvaluationState
            ),
            storeEnhancer
        );

        const valueInStore = this.store.getState().value;
        if (!isEqual(props.value, valueInStore)) {
            props.onChange(valueInStore);
        }

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
        if (nextProps.context != null && !isEqual(state.context, nextProps.context)) {
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

    public submit(withoutFocus?: boolean): void {
        if (this.validationContainer != null) {
            this.validationContainer.submit(withoutFocus);
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
                        scrollOffset={this.props.inModal ? { top: 100 } : undefined}>
                        {this.props.children}
                    </ValidationContainer>
                </FormActionsContext.Provider>
            </Provider>
        );
    }
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
    public isAllAutoEvaluationsEnabled = isAllAutoEvaluationsEnabled;
    public getValueFromContext = getValue;

    public setAutoEvaluationStateToStore = setAutoEvaluationStateToStore;

    public constructor(handleCustomAction?: (action: any) => void) {
        this.handleCustomAction = handleCustomAction;
    }

    public dispatchCustomAction = (action: any): void => {
        if (this.handleCustomAction != undefined) {
            this.handleCustomAction(action);
        }
    };
}

// TODO: подумать как организовать экспорты движка форм
export { NestedFormContainer } from "./NestedFormContainer";
