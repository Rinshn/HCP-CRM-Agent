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
  const state = useSelector((state) => state.interaction);
  const { hcpName, interactionType, date, time, attendees, topicsDiscussed, 
          materialsShared, samplesDistributed, sentiment, outcomes, 
          followUpActions, aiChatHistory, aiChatInput, loading } = state;

  const [newAttendee, setNewAttendee] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newSample, setNewSample] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);

  const applyStructuredCommand = (command) => {
    if (!command || !command.ui_action) return false;
    
    // --- CUSTOM MESSAGE EXTRACTION ---
    const customMessage = command.message || `✅ Form updated successfully.`;
    
    if (command.ui_action === "FILL_FORM") {
      const data = command.data || {};
      
      // 1. Strings
      if (data.hcpName) dispatch(setHCPName(data.hcpName));
      if (data.sentiment) {
          const s = data.sentiment.charAt(0).toUpperCase() + data.sentiment.slice(1).toLowerCase();
          dispatch(setSentiment(s));
      }
      if (data.topicsDiscussed) dispatch(setTopicsDiscussed(data.topicsDiscussed));
      
      // Date/Time (Guaranteed fixed output from tool)
      if (data.date) dispatch(setDate(data.date));
      if (data.time) dispatch(setTime(data.time));

      if (data.interactionType) dispatch(setInteractionType(data.interactionType));
      if (data.outcomes) dispatch(setOutcomes(data.outcomes));
      if (data.followUpActions) dispatch(setFollowUpActions(data.followUpActions));

      // 2. Arrays
      if (data.attendees && Array.isArray(data.attendees)) {
         data.attendees.forEach(name => dispatch(addAttendee(name)));
      }
      if (data.materialsShared && Array.isArray(data.materialsShared)) {
        data.materialsShared.forEach(name => 
          dispatch(addMaterial({ id: Date.now() + Math.random(), name: name }))
        );
      }
      if (data.samplesDistributed && Array.isArray(data.samplesDistributed)) {
        data.samplesDistributed.forEach(name => 
          dispatch(addSample({ id: Date.now() + Math.random(), name: name }))
        );
      }
      
      // Post custom message from tool response
      dispatch(addAIChatMessage({ sender: 'ai', message: customMessage }));
      return true;
    }

    if (command.ui_action === "UPDATE_FIELD") {
      const { field, value } = command.data || {};
      if (field === 'hcpName') dispatch(setHCPName(value));
      if (field === 'sentiment') dispatch(setSentiment(value));
      if (field === 'outcomes') dispatch(setOutcomes(value));
      if (field === 'followUpActions') dispatch(setFollowUpActions(value));
      
      // Post custom message from tool response
      dispatch(addAIChatMessage({ sender: 'ai', message: customMessage }));
      return true;
    }
    return false;
  };

  const handleAIChatSubmit = async () => {
    if (!aiChatInput || !aiChatInput.trim()) return;
    const userMsg = aiChatInput;
    dispatch(addAIChatMessage({ sender: 'user', message: String(userMsg) }));
    dispatch(setAIChatInput(''));
    dispatch(setLoading(true));

    try {
      const response = await axios.post('http://127.0.0.1:8000/chat', { message: userMsg });
      const backendResp = response.data.response;
      
      let applied = false;
      if (typeof backendResp === 'string') {
          try {
             // Extract and parse nested JSON
             const match = backendResp.match(/\{[\s\S]*\}/);
             if (match) {
                 const parsed = JSON.parse(match[0]);
                 applied = applyStructuredCommand(parsed);
             }
          } catch(e) { console.log("JSON Parse fail", e); }
      } 
      
      if (!applied) {
         // Only log the raw response if the tool output couldn't be parsed/applied
         dispatch(addAIChatMessage({ sender: 'ai', message: String(backendResp) }));
      }

    } catch (err) {
      console.error(err);
      dispatch(addAIChatMessage({ sender: 'ai', message: "Error: Backend unreachable." }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFormSubmit = () => { setSaveStatus('success'); setTimeout(() => setSaveStatus(null), 3000); dispatch(clearInteractionForm()); };
  const handleAdd = (val, setter, action) => { if (val && val.trim()) { dispatch(action(val.trim())); setter(''); } };
  const handleAddObj = (val, setter, action) => { if (val && val.trim()) { dispatch(action({ id: Date.now(), name: val.trim() })); setter(''); } };

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto font-sans text-gray-900 p-6 bg-white min-h-screen">
      {/* FORM PANEL */}
      <div className="w-full md:w-[70%] bg-white border-2 border-black p-8 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-extrabold mb-8 text-black uppercase tracking-tighter border-b-2 border-black pb-4">HCP Engagement Portal</h2>
        {saveStatus === 'success' && <div className="absolute top-4 right-4 bg-black text-white px-6 py-3 font-bold border-2 border-black animate-bounce">SAVED</div>}

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">HCP Name</label>
            <input className="w-full p-3 border-2 border-black focus:outline-none font-bold" value={hcpName} readOnly />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Type</label>
            <input className="w-full p-3 border-2 border-black focus:outline-none" value={interactionType} readOnly />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Date</label>
            <input type="text" className="w-full p-3 border-2 border-black focus:outline-none" value={date} readOnly />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Time</label>
            <input type="text" className="w-full p-3 border-2 border-black focus:outline-none" value={time} readOnly />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wide mb-2">Attendees</label>
          <div className="flex gap-0 mb-3">
            <input className="flex-1 p-3 border-2 border-black border-r-0 focus:outline-none" value={newAttendee} onChange={(e) => setNewAttendee(e.target.value)} placeholder="ADD ATTENDEE..." />
            <button onClick={() => handleAdd(newAttendee, setNewAttendee, addAttendee)} className="px-6 bg-black text-white font-bold border-2 border-black">+</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {attendees && attendees.map((a, i) => <span key={i} className="bg-white border border-black text-black px-3 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{a}</span>)}
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
              <div className="flex flex-wrap gap-2">{materialsShared && materialsShared.map(m => <span key={m.id} className="bg-white border border-black px-2 py-1 text-xs font-bold">{m.name}</span>)}</div>
            </div>
            <div>
               <div className="flex gap-0 mb-2">
                 <input className="flex-1 p-2 border-2 border-black border-r-0 text-sm" value={newSample} onChange={(e) => setNewSample(e.target.value)} />
                 <button onClick={() => handleAddObj(newSample, setNewSample, addSample)} className="bg-black text-white px-3 text-xs font-bold border-2 border-black">ADD</button>
               </div>
               <div className="flex flex-wrap gap-2">{samplesDistributed && samplesDistributed.map(s => <span key={s.id} className="bg-white border border-black px-2 py-1 text-xs font-bold">{s.name}</span>)}</div>
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
                <span className="font-bold">{s.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div><label className="block text-xs font-bold uppercase mb-2">Outcomes</label><textarea className="w-full p-3 border-2 border-black h-24" value={outcomes} readOnly/></div>
          <div><label className="block text-xs font-bold uppercase mb-2">Follow-up</label><textarea className="w-full p-3 border-2 border-black h-24" value={followUpActions} readOnly/></div>
        </div>

        <div className="flex justify-end pt-8 mt-4">
          <button className="text-black font-bold px-6 py-3 mr-4" onClick={() => dispatch(clearInteractionForm())}>CLEAR</button>
          <button onClick={handleFormSubmit} className="bg-black text-white px-8 py-3 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">LOG INTERACTION</button>
        </div>
      </div>

      {/* CHAT PANEL */}
      <div className="w-full md:w-[30%] bg-gray-100 border-2 border-black flex flex-col h-[600px] sticky top-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-4 border-b-2 border-black bg-black text-white">
          <h3 className="font-bold uppercase tracking-wider">AI Assistant</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           {aiChatHistory.map((msg, i) => (
             <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[90%] p-3 border-2 border-black text-sm font-bold ${msg.sender === 'user' ? 'bg-black text-white' : 'bg-white'}`}>
                 {msg.message}
               </div>
             </div>
           ))}
           {loading && <div className="text-xs font-bold animate-pulse">PROCESSING...</div>}
        </div>
        <div className="p-4 border-t-2 border-black bg-white">
           <div className="flex gap-0">
             <input className="flex-1 p-3 border-2 border-black border-r-0 focus:outline-none font-bold" placeholder="TYPE COMMAND..." value={aiChatInput} onChange={(e) => dispatch(setAIChatInput(e.target.value))} onKeyPress={(e) => e.key === 'Enter' && handleAIChatSubmit()} />
             <button onClick={handleAIChatSubmit} className="bg-black text-white px-4 font-bold border-2 border-black">➔</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LogInteraction;