import React, { createContext, useContext, useReducer } from 'react';
import { createDemoState, demoReducer } from '../services/demoRepository';
const DemoContext = createContext(null);
export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(demoReducer, undefined, createDemoState);
  return <DemoContext.Provider value={{ state, dispatch }}>{children}</DemoContext.Provider>;
}
export const useDemo = () => useContext(DemoContext);
