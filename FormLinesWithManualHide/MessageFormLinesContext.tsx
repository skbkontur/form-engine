import createReactContext from "create-react-context";
import * as React from "react";

import { NormalizedPath } from "../Path";

export interface MessageFormLinesContextValue {
    requiredByDefaultPaths: NormalizedPath[];
    goodItemRequiredByDefaultPaths: NormalizedPath[];
}

export const MessageFormLinesContext = createReactContext<MessageFormLinesContextValue>({
    requiredByDefaultPaths: [],
    goodItemRequiredByDefaultPaths: [],
});
