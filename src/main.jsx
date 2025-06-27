// main.jsx
import React from 'react'; // IMPORTANTE! O React precisa ser importado para o JSX funcionar
import ReactDOM from 'react-dom/client'; // Importando o ReactDOM corretamente
import './index.css';
import App from './App.jsx'; // Importando o componente principal

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

