import { compose, StoreEnhancer } from "redux";

declare global {
    type Nullable<T> = null | undefined | T;
    type mixed = any;

    interface Window {
        onunhandledrejection: any;
        devToolsExtension: any;
        __REDUX_DEVTOOLS_EXTENSION__: (() => StoreEnhancer<any>) | null | undefined;
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof compose | null | undefined;
    }
}
