import React from 'react';
import LogInteraction from './components/LogInteraction';
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <LogInteraction />
      </div>
    </Provider>
  );
}

export default App;
