import createReactContext from "create-react-context";

import { NormalizedPath } from "../Path";

export interface MessageFormLinesContextValue {
    requiredByDefaultPaths: NormalizedPath[];
    goodItemRequiredByDefaultPaths: NormalizedPath[];
}

export const MessageFormLinesContext = createReactContext<MessageFormLinesContextValue>({
    requiredByDefaultPaths: [],
    goodItemRequiredByDefaultPaths: [],
});
