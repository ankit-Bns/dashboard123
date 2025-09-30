import { configureStore, combineReducers } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';

const PERSISTED_STATE_KEY = 'teamPulseState';

const loadState = () => {
  try {
    const serializedState = localStorage.getItem(PERSISTED_STATE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state from localStorage", err);
    return undefined;
  }
};

const saveState = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(PERSISTED_STATE_KEY, serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage", err);
  }
};

const preloadedState = loadState();

// FIX: When `preloadedState` has a dynamic or `any` type, TypeScript can struggle
// to infer the correct type for the `reducer` option in `configureStore`. By
// explicitly using `combineReducers`, we create a single reducer function,
// removing the ambiguity and satisfying the type checker.
const rootReducer = combineReducers({
  app: appReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
});

store.subscribe(() => {
  saveState(store.getState());
});

export type AppStore = typeof store;
// FIX: Define and export RootState and AppDispatch here to break circular dependency.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
