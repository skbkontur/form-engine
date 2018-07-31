import { ValidationContainer } from "@skbkontur/react-ui-validations";
import * as React from "react";
import { Provider } from "react-redux";
import { createStore, Store, Unsubscribe } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import { ValidationResult } from "Commons/Mutators/Types";

import { replaceValue } from "./FormStore/FormActions";
import { buildInitialState, formReducer } from "./FormStore/FormReducer";
import { FormState } from "./FormStore/FormState";
import { GenericModelValidator } from "./Types";

interface FormContainerProps<TData, TContext> {
    value: TData;
    context: TContext;
    onChange: (nextValue: TData) => void;
    validator?: GenericModelValidator<TData>;
    children: JSX.Element;
}

export class FormContainer<TData, TContext = any> extends React.Component<FormContainerProps<TData, TContext>> {
    public store: Store<FormState<TData, TContext>>;
    public unsubscribeFromStore?: Unsubscribe;
    public validationContainer: ValidationContainer | null;

    public constructor(props: FormContainerProps<TData, TContext>) {
        super(props);
        this.store = createStore(
            formReducer,
            buildInitialState(props.value, props.context, props.validator),
            devToolsEnhancer({})
        );
        this.unsubscribeFromStore = this.store.subscribe(this.handleStateChange);
    }

    public shouldComponentUpdate(nextProps: FormContainerProps<TData, TContext>): boolean {
        return nextProps.value !== this.store.getState().value;
    }

    public handleStateChange = () => {
        if (this.props.value !== this.store.getState().value) {
            this.props.onChange(this.store.getState().value);
        }
    };

    public componentWillReceiveProps(nextProps: FormContainerProps<TData, TContext>) {
        // TODO отпасти изменение контекста
        if (nextProps.value !== this.store.getState().value) {
            this.store.dispatch(replaceValue(nextProps.value));
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

    public render(): JSX.Element {
        return (
            <Provider store={this.store}>
                <ValidationContainer ref={x => (this.validationContainer = x)}>
                    {this.props.children}
                </ValidationContainer>
            </Provider>
        );
    }
}
