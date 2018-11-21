import createContext, { Context } from "create-react-context";

import { FormLineId } from "./FormDefintionLinesProcessor";

export const DataFormLinesContext: Context<FormLineId[]> = createContext<FormLineId[]>([]);
