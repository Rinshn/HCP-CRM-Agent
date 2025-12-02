import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  hcpName: '',
  interactionType: 'Meeting',
  date: new Date().toISOString().split('T')[0],
  time: '',
  attendees: [],
  topicsDiscussed: '',
  materialsShared: [],
  samplesDistributed: [],
  sentiment: '', // Empty by default
  outcomes: '',
  followUpActions: '',
  aiChatHistory: [],
  aiChatInput: '',
  loading: false,
  error: null,
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    setHCPName: (state, action) => { state.hcpName = action.payload; },
    setInteractionType: (state, action) => { state.interactionType = action.payload; },
    setDate: (state, action) => { state.date = action.payload; },
    setTime: (state, action) => { state.time = action.payload; },
    addAttendee: (state, action) => { state.attendees.push(action.payload); },
    removeAttendee: (state, action) => { state.attendees = state.attendees.filter((_, i) => i !== action.payload); },
    setTopicsDiscussed: (state, action) => { state.topicsDiscussed = action.payload; },
    addMaterial: (state, action) => { state.materialsShared.push(action.payload); },
    removeMaterial: (state, action) => { state.materialsShared = state.materialsShared.filter(m => m.id !== action.payload); },
    addSample: (state, action) => { state.samplesDistributed.push(action.payload); },
    removeSample: (state, action) => { state.samplesDistributed = state.samplesDistributed.filter(s => s.id !== action.payload); },
    setSentiment: (state, action) => { state.sentiment = action.payload; },
    setOutcomes: (state, action) => { state.outcomes = action.payload; },
    setFollowUpActions: (state, action) => { state.followUpActions = action.payload; },
    setAIChatInput: (state, action) => { state.aiChatInput = action.payload; },
    addAIChatMessage: (state, action) => { state.aiChatHistory.push(action.payload); },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    clearInteractionForm: (state) => {
      // Reset only form fields
      state.hcpName = '';
      state.time = '';
      state.attendees = [];
      state.topicsDiscussed = '';
      state.materialsShared = [];
      state.samplesDistributed = [];
      state.sentiment = '';
      state.outcomes = '';
      state.followUpActions = '';
    },
  },
});

export const {
  setHCPName, setInteractionType, setDate, setTime, addAttendee, removeAttendee,
  setTopicsDiscussed, addMaterial, removeMaterial, addSample, removeSample, setSentiment,
  setOutcomes, setFollowUpActions, setAIChatInput, addAIChatMessage,
  setLoading, setError, clearInteractionForm
} = interactionSlice.actions;

export default interactionSlice.reducer;
