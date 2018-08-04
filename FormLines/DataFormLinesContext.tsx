import createContext from "create-react-context";

import { FormLineId } from "./FormDefintionLinesProcessor";

export const DataFormLinesContext = createContext<FormLineId[]>([]);
