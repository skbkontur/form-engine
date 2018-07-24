import * as React from "react";
import { connect } from "react-redux";
import { FormState } from "../FormStore/FormState";
import { FormDispatch } from "../Types";

interface ConnectTypingProps<TData, TMappedProps> {
    mapState: (state: FormState<TData>) => TMappedProps;
    children: (props: TMappedProps, dispatch: FormDispatch<TData>) => JSX.Element;
}

class ConnectTyping<TData, TMapped> extends React.Component<ConnectTypingProps<TData, TMapped>> {}

const ConnectComp = ({ children, dispatch, ...props }: any) => children(props, dispatch);

export const ConnectControl: typeof ConnectTyping = connect(
    (state: any, { mapState }: any) => mapState(state),
    (dispatch: any) => ({ dispatch: dispatch })
)(ConnectComp) as any;
