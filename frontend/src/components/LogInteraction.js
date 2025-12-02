import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  setHCPName, setInteractionType, setDate, setTime, addAttendee, removeAttendee,
  setTopicsDiscussed, addMaterial, removeMaterial, addSample, removeSample,
  setSentiment, setOutcomes, setFollowUpActions, setAIChatInput, addAIChatMessage,
  setLoading, setError, clearInteractionForm
} from '../features/interactionSlice';

const LogInteraction = () => {
  const dispatch = useDispatch();
  const hcpName = useSelector((state) => state.interaction.hcpName);
  const interactionType = useSelector((state) => state.interaction.interactionType);
  const date = useSelector((state) => state.interaction.date);
  const time = useSelector((state) => state.interaction.time);
  const attendees = useSelector((state) => state.interaction.attendees);
  const topicsDiscussed = useSelector((state) => state.interaction.topicsDiscussed);
  const materialsShared = useSelector((state) => state.interaction.materialsShared);
  const samplesDistributed = useSelector((state) => state.interaction.samplesDistributed);
  const sentiment = useSelector((state) => state.interaction.sentiment);
  const outcomes = useSelector((state) => state.interaction.outcomes);
  const followUpActions = useSelector((state) => state.interaction.followUpActions);
  const aiChatHistory = useSelector((state) => state.interaction.aiChatHistory);
  const aiChatInput = useSelector((state) => state.interaction.aiChatInput);
  const loading = useSelector((state) => state.interaction.loading);

  // Local UI state (used by the form)
  const [newAttendee, setNewAttendee] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newSample, setNewSample] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);

  // Apply structured commands that come from backend (FILL_FORM, UPDATE_FIELD)
  const applyStructuredCommand = (command) => {
    if (!command || !command.ui_action) return false;
    if (command.ui_action === "FILL_FORM") {
      const data = command.data || {};
      if (data.hcpName) dispatch(setHCPName(data.hcpName));
      if (data.sentiment) dispatch(setSentiment(String(data.sentiment)));
      if (data.topicsDiscussed) dispatch(setTopicsDiscussed(data.topicsDiscussed));
      if (data.date && data.date !== 'today') dispatch(setDate(data.date));
      if (data.interactionType) dispatch(setInteractionType(data.interactionType));
      return true;
    }
    if (command.ui_action === "UPDATE_FIELD") {
      const { field, value } = command.data || {};
      if (field === 'hcpName') dispatch(setHCPName(value));
      if (field === 'sentiment') dispatch(setSentiment(String(value)));
      return true;
    }
    return false;
  };

  // Robust AI chat handler
  const handleAIChatSubmit = async () => {
    if (!aiChatInput || !aiChatInput.trim()) return;
    const userMsg = aiChatInput;
    dispatch(addAIChatMessage({ sender: 'user', message: String(userMsg) }));
    dispatch(setAIChatInput(''));
    dispatch(setLoading(true));

    try {
      const response = await axios.post('http://127.0.0.1:8000/chat', { message: userMsg });
      const backendResp = response.data.response;

      // 1) If backend returned structured object with ui_action -> apply it
      if (backendResp && typeof backendResp === 'object' && backendResp.ui_action) {
        const applied = applyStructuredCommand(backendResp);
        if (applied) {
          dispatch(addAIChatMessage({ sender: 'ai', message: '✅ Form updated.' }));
          return;
        }
      }

      // 2) If backend returned object with raw and no parse_error -> try parse raw
      if (backendResp && typeof backendResp === 'object' && ('raw' in backendResp) && !('parse_error' in backendResp)) {
        try {
          const maybe = JSON.parse(String(backendResp.raw));
          const applied = applyStructuredCommand(maybe);
          if (applied) {
            dispatch(addAIChatMessage({ sender: 'ai', message: '✅ Form updated.' }));
            return;
          }
        } catch (e) {
          // fall through to show raw
        }
      }

      // 3) If backend returned string, detect JSON-like and attempt parse+apply
      if (typeof backendResp === 'string') {
        const trimmed = backendResp.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            const parsed = JSON.parse(trimmed);
            const applied = applyStructuredCommand(parsed);
            if (applied) {
              dispatch(addAIChatMessage({ sender: 'ai', message: '✅ Form updated.' }));
              return;
            } else {
              dispatch(addAIChatMessage({ sender: 'ai', message: JSON.stringify(parsed, null, 2) }));
              return;
            }
          } catch (e) {
            // not valid json; show as text
          }
        }
      }

      // 4) Fallback: show whatever we got in readable form
      const display = typeof backendResp === 'string' ? backendResp : JSON.stringify(backendResp, null, 2);
      dispatch(addAIChatMessage({ sender: 'ai', message: display }));

    } catch (err) {
      dispatch(addAIChatMessage({ sender: 'ai', message: "Error: Backend unreachable." }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Form submit (manual log)
  const handleFormSubmit = async () => {
    setSaveStatus(null);
    dispatch(setLoading(true));
    const formSummary = `Log manual: HCP ${hcpName}, Sentiment ${sentiment}`;
    try {
      await axios.post('http://127.0.0.1:8000/chat', { message: formSummary });
      setSaveStatus('success');
      dispatch(clearInteractionForm());
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // small helpers for add buttons (keeps warnings low)
  const handleAdd = (val, setter, action) => { if (val && val.trim()) { dispatch(action(val.trim())); setter(''); } };
  const handleAddObj = (val, setter, action) => { if (val && val.trim()) { dispatch(action({ id: Date.now(), name: val.trim() })); setter(''); } };

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto font-sans text-gray-900 p-6 bg-white min-h-screen">
      <div className="w-full md:w-[70%] bg-white border-2 border-black p-8 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-extrabold mb-8 text-black uppercase tracking-tighter border-b-2 border-black pb-4">HCP Engagement Portal</h2>

        {saveStatus === 'success' && <div className="absolute top-4 right-4 bg-black text-white px-6 py-3 font-bold border-2 border-black animate-bounce">SAVED SUCCESSFULLY</div>}

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">HCP Name</label>
            <input className="w-full p-3 border-2 border-black focus:outline-none focus:bg-gray-100 placeholder-gray-400 font-medium" value={hcpName} readOnly />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Type</label>
            <div className="relative">
              <select className="w-full p-3 border-2 border-black appearance-none bg-white focus:outline-none font-medium" value={interactionType} disabled>
                <option>Meeting</option><option>Call</option><option>Email</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black">▼</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Date</label>
            <input type="date" className="w-full p-3 border-2 border-black focus:outline-none" value={date} readOnly />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Time</label>
            <input type="time" className="w-full p-3 border-2 border-black focus:outline-none" value={time} onChange={(e) => dispatch(setTime(e.target.value))} />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wide mb-2">Attendees</label>
          <div className="flex gap-0 mb-3">
            <input className="flex-1 p-3 border-2 border-black border-r-0 focus:outline-none" value={newAttendee} onChange={(e) => setNewAttendee(e.target.value)} placeholder="ADD ATTENDEE..." />
            <button onClick={() => handleAdd(newAttendee, setNewAttendee, addAttendee)} className="px-6 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-colors">+</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {attendees && attendees.map((a, i) => <span key={i} className="bg-white border border-black text-black px-3 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{a} <button onClick={() => dispatch(removeAttendee(i))} className="ml-2 hover:text-red-600">×</button></span>)}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wide mb-2">Topics Discussed</label>
          <textarea className="w-full p-3 border-2 border-black h-32 focus:outline-none resize-none" value={topicsDiscussed} readOnly />
        </div>

        <div className="mb-8 border-t-2 border-b-2 border-black py-6 bg-gray-50 -mx-8 px-8">
          <h3 className="text-sm font-bold uppercase mb-4">Materials & Samples</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex gap-0 mb-2">
                <input className="flex-1 p-2 border-2 border-black border-r-0 text-sm" value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} />
                <button onClick={() => handleAddObj(newMaterial, setNewMaterial, addMaterial)} className="bg-black text-white px-3 text-xs font-bold border-2 border-black">ADD</button>
              </div>
              <div className="flex flex-wrap gap-2">{materialsShared && materialsShared.map(m => <span key={m.id} className="bg-white border border-black px-2 py-1 text-xs font-bold">{m.name} <button onClick={() => dispatch(removeMaterial(m.id))}>x</button></span>)}</div>
            </div>
            <div>
              <div className="flex gap-0 mb-2">
                <input className="flex-1 p-2 border-2 border-black border-r-0 text-sm" value={newSample} onChange={(e) => setNewSample(e.target.value)} />
                <button onClick={() => handleAddObj(newSample, setNewSample, addSample)} className="bg-black text-white px-3 text-xs font-bold border-2 border-black">ADD</button>
              </div>
              <div className="flex flex-wrap gap-2">{samplesDistributed && samplesDistributed.map(s => <span key={s.id} className="bg-white border border-black px-2 py-1 text-xs font-bold">{s.name} <button onClick={() => dispatch(removeSample(s.id))}>x</button></span>)}</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wide mb-3">Sentiment</label>
          <div className="flex gap-6">
            {['Positive', 'Neutral', 'Negative'].map(s => (
              <label key={s} className="flex items-center cursor-pointer group">
                <div className={`w-5 h-5 border-2 border-black mr-2 flex items-center justify-center ${sentiment === s ? 'bg-black' : 'bg-white'}`}>
                  {sentiment === s && <div className="w-2 h-2 bg-white"></div>}
                </div>
                <span className={`font-bold ${sentiment === s ? 'text-black' : 'text-gray-500'}`}>{s.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Outcomes</label>
            <textarea className="w-full p-3 border-2 border-black h-24 focus:outline-none" value={outcomes} onChange={(e) => dispatch(setOutcomes(e.target.value))} />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Follow-up</label>
            <textarea className="w-full p-3 border-2 border-black h-24 focus:outline-none" value={followUpActions} onChange={(e) => dispatch(setFollowUpActions(e.target.value))} />
          </div>
        </div>

        <div className="flex justify-end pt-8 mt-4">
          <button className="text-black font-bold px-6 py-3 mr-4 hover:underline" onClick={() => dispatch(clearInteractionForm())}>CLEAR</button>
          <button onClick={handleFormSubmit} className="bg-black text-white px-8 py-3 font-bold border-2 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">LOG INTERACTION</button>
        </div>
      </div>

      <div className="w-full md:w-[30%] bg-gray-100 border-2 border-black flex flex-col h-[600px] sticky top-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-4 border-b-2 border-black bg-black text-white flex justify-between items-center">
          <h3 className="font-bold uppercase tracking-wider flex items-center"><span className="mr-2 text-xl">●</span> AI Assistant</h3>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {aiChatHistory && aiChatHistory.map((msg, i) => {
            const safeMessage = String(msg.message || '');
            let displayText = safeMessage;
            try {
              const t = safeMessage.trim();
              if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
                const parsed = JSON.parse(t);
                displayText = JSON.stringify(parsed, null, 2);
              }
            } catch (e) { /* ignore parse errors */ }

            return (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 border-2 border-black text-sm font-medium ${msg.sender === 'user' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(100,100,100,0.5)]' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'}`}
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {displayText}
                </div>
              </div>
            );
          })}
          {loading && <div className="text-xs font-bold uppercase animate-pulse pl-2">Processing...</div>}
        </div>

        <div className="p-4 border-t-2 border-black bg-white">
          <div className="flex gap-0">
            <input className="flex-1 p-3 border-2 border-black border-r-0 focus:outline-none font-medium" placeholder="TYPE COMMAND..." value={aiChatInput || ''} onChange={(e) => dispatch(setAIChatInput(e.target.value))} onKeyPress={(e) => e.key === 'Enter' && handleAIChatSubmit()} />
            <button onClick={handleAIChatSubmit} className="bg-black text-white px-4 font-bold border-2 border-black hover:bg-gray-800">➔</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogInteraction;
