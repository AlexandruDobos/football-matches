// competitionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching competitions
export const fetchCompetitions = createAsyncThunk(
  'competitions/fetchCompetitions',
  async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/matches`);
    const data = await response.json();
    return data;
  }
);

const competitionSlice = createSlice({
  name: 'competitions',
  initialState: {
    items: [],
    status: 'idle',
  },
  reducers: {
    updateMatch: (state, action) => {
      const { updatedMatch } = action.payload;
      state.items.forEach((competition) => {
        const matchIndex = competition.matches.findIndex((match) => match.id === updatedMatch.id);
        if (matchIndex !== -1) {
          competition.matches[matchIndex] = updatedMatch;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompetitions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCompetitions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCompetitions.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { updateMatch } = competitionSlice.actions;
export default competitionSlice.reducer;
