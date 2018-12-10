import * as React from "react";
import { connect } from "react-redux";

import { FormActionsContext, FormContextActions } from "../FormActionsContext";
import { FormState } from "../FormStore/FormState";
import { FormDispatch } from "../Types";

interface ConnectTypingProps<TData, TMappedProps, TContext> {
    actions: FormContextActions<TData, TContext>;
    mapState: (state: FormState<TData>, actions: FormContextActions<TData, TContext>) => TMappedProps;
    children: (
        props: TMappedProps,
        dispatch: FormDispatch<TData>,
        actions: FormContextActions<TData, TContext>
    ) => JSX.Element;
}

class ConnectTyping<TData, TMapped, TContext> extends React.Component<ConnectTypingProps<TData, TMapped, TContext>> {}

const ConnectComp = ({ actions, children, dispatch, mapState, ...props }: any) => children(props, dispatch, actions);

const ConnectControlConnected: typeof ConnectTyping = connect(
    (state: any, { mapState, actions }: any) => mapState(state, actions),
    (dispatch: any, { actions }: any) => ({ dispatch: dispatch, actions: actions })
)(ConnectComp) as any;

interface ConnectControlProps<TData, TMappedProps, TContext> {
    mapState: (state: FormState<TData>, actions: FormContextActions<TData, TContext>) => TMappedProps;
    children: (
        props: TMappedProps,
        dispatch: FormDispatch<TData>,
        actions: FormContextActions<TData, TContext>
    ) => JSX.Element;
}

export class ConnectControl<TData, TMappedProps, TContext> extends React.Component<
    ConnectControlProps<TData, TMappedProps, TContext>
> {
    public render(): JSX.Element {
        const { children, ...rest } = this.props;
        return (
            <FormActionsContext.Consumer>
                {actions => (
                    <ConnectControlConnected actions={actions} {...rest}>
                        {children}
                    </ConnectControlConnected>
                )}
            </FormActionsContext.Consumer>
        );
    }
}
