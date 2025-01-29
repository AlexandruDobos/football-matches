import { configureStore } from '@reduxjs/toolkit';
import competitionReducer from './competitionSlice';

const store = configureStore({
  reducer: {
    competitions: competitionReducer,
  },
});

export default store;
