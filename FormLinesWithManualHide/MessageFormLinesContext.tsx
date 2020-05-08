import React from "react";

import { NormalizedPath } from "../Path";

export interface MessageFormLinesContextValue {
    requiredByDefaultPaths: NormalizedPath[];
    goodItemRequiredByDefaultPaths: NormalizedPath[];
}

export const MessageFormLinesContext = React.createContext<MessageFormLinesContextValue>({
    requiredByDefaultPaths: [],
    goodItemRequiredByDefaultPaths: [],
});
