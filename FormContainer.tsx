import * as React from "react";
import { createStore, Store, Unsubscribe } from "redux";
import { Provider } from "react-redux";
import { buildInitialState, formReducer } from "./FormStore/FormReducer";
import { devToolsEnhancer } from "redux-devtools-extension";
import { GenericModelValidator } from "./Types";
import { ValidationResult } from "Commons/Mutators/Types";
import { ValidationContainer } from "@skbkontur/react-ui-validations";
import { replaceValue } from "./FormStore/FormActions";
import { FormState } from "./FormStore/FormState";

interface FormContainerProps<TData, TContext> {
    value: TData;
    context: TContext;
    onChange: (nextValue: TData) => void;
    validator?: GenericModelValidator<TData>;
    children: JSX.Element;
}

export class FormContainer<TData, TContext = any> extends React.Component<FormContainerProps<TData, TContext>> {
    store: Store<FormState<TData, TContext>>;
    unsubscribeFromStore?: Unsubscribe;
    validationContainer: ValidationContainer | null;

    constructor(props: FormContainerProps<TData, TContext>) {
        super(props);
        this.store = createStore(
            formReducer,
            buildInitialState(props.value, props.context, props.validator),
            devToolsEnhancer({})
        );
        this.unsubscribeFromStore = this.store.subscribe(this.handleStateChange);
    }

    shouldComponentUpdate(nextProps: FormContainerProps<TData, TContext>): boolean {
        return nextProps.value !== this.store.getState().value;
    }

    handleStateChange = () => {
        if (this.props.value !== this.store.getState().value) {
            this.props.onChange(this.store.getState().value);
        }
    };

    componentWillReceiveProps(nextProps: FormContainerProps<TData, TContext>) {
        // TODO отпасти изменение контекста
        if (nextProps.value !== this.store.getState().value) {
            this.store.dispatch(replaceValue(nextProps.value));
        }
    }

    componentWillUnmount() {
        if (this.unsubscribeFromStore != null) {
            this.unsubscribeFromStore();
        }
    }

    async validate(): Promise<boolean> {
        if (this.validationContainer != null) {
            return this.validationContainer.validate();
        }
        return true;
    }

    render(): JSX.Element {
        return (
            <Provider store={this.store}>
                <ValidationContainer ref={x => (this.validationContainer = x)}>
                    {this.props.children}
                </ValidationContainer>
            </Provider>
        );
    }
}
