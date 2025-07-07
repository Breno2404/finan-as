import { useEffect, useState } from 'react';
import { db } from './firebase/firebase';
import {
  collection, getDocs, addDoc,
  deleteDoc, updateDoc, doc,
  query, where, orderBy
} from 'firebase/firestore';
import './App.css';

const tipos = ['Receita', 'Despesa'];
const categorias = ['Salário', 'Alimentação', 'Transporte', 'Outro'];

function App() {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]);
  const [tipo, setTipo] = useState(tipos[0]);
  const [dataHora, setDataHora] = useState('');
  const [transacoes, setTransacoes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [filtro, setFiltro] = useState({ tipo: '', mes: '', categoria: '' });

  const transRef = collection(db, 'transacoes');

  const fetchTransacoes = async () => {
    let q = query(transRef, orderBy('dataHora', 'desc'));
    // filtros
    if (filtro.tipo) q = query(q, where('tipo', '==', filtro.tipo));
    if (filtro.categoria)
      q = query(q, where('categoria', '==', filtro.categoria));
    if (filtro.mes) {
      const [ano, mes] = filtro.mes.split('-');
      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes, 1);
      q = query(
        q,
        where('dataHora', '>=', inicio),
        where('dataHora', '<', fim)
      );
    }
    const snap = await getDocs(q);
    setTransacoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchTransacoes();
  }, [filtro]);

  const resetForm = () => {
    setDescricao('');
    setValor('');
    setCategoria(categorias[0]);
    setTipo(tipos[0]);
    setDataHora('');
    setEditandoId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dados = {
      descricao,
      valor: parseFloat(valor),
      categoria,
      tipo,
      dataHora: new Date(dataHora),
    };
    if (editandoId) {
      const docRef = doc(db, 'transacoes', editandoId);
      await updateDoc(docRef, dados);
    } else {
      await addDoc(transRef, dados);
    }
    resetForm();
    fetchTransacoes();
  };

  const handleEditar = (t) => {
    setDescricao(t.descricao);
    setValor(t.valor);
    setCategoria(t.categoria);
    setTipo(t.tipo);
    setDataHora(new Date(t.dataHora.seconds * 1000).toISOString().slice(0, 16));
    setEditandoId(t.id);
  };

  const handleExcluir = async (id) => {
    await deleteDoc(doc(db, 'transacoes', id));
    fetchTransacoes();
  };

  const totais = transacoes.reduce(
    (acc, t) => {
      if (t.tipo === 'Receita') acc.receitas += t.valor;
      else acc.despesas += t.valor;
      return acc;
    },
    { receitas: 0, despesas: 0 }
  );
  const saldo = totais.receitas - totais.despesas;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Controle de Transações</h1>
      <br />

      {/* Fils */}
      <div className="mb-4 flex flex-wrap justify-center gap-2 cursor-pointer
">
  <select
    value={filtro.tipo}
    onChange={(e) => setFiltro({ ...filtro, tipo: e.target.value })}
    className="bg-gray-800 border border-gray-600 text-white p-2 rounded cursor-pointer
    "
  >
    <option value="">Todos</option>
    {tipos.map((t) => (
      <option key={t} value={t}>{t}</option>
    ))}
  </select>
  <input
    type="month"
    value={filtro.mes}
    onChange={(e) => setFiltro({ ...filtro, mes: e.target.value })}
    className="bg-gray-800 border border-gray-600 text-white p-2 rounded cursor-pointer
    "
  />
  <select
    value={filtro.categoria}
    onChange={(e) => setFiltro({ ...filtro, categoria: e.target.value })}
    className="bg-gray-800 border border-gray-600 text-white p-2 rounded cursor-pointer
    "
  >
    <option value="">Todas</option>
    {categorias.map((c) => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>
</div>
      {/* Formulário */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
  <select
    value={tipo}
    onChange={(e) => setTipo(e.target.value)}
    className="bg-gray-800 border border-gray-600 text-white p-2 rounded w-full"
  >
    {tipos.map((t) => (
      <option key={t} value={t}>{t}</option>
    ))}
  </select>
  <input
    placeholder="Descrição"
    value={descricao}
    onChange={(e) => setDescricao(e.target.value)}
    className="bg-gray-800 border border-gray-600 text-white p-2 rounded w-full"
    required
  />
  <input
    type="number"
    step="0.01"
    placeholder="Valor"
    value={valor}
    onChange={(e) => setValor(e.target.value)}
    className="bg-gray-800 border border-gray-600 text-white p-2 rounded w-full"
    required
  />
  <select
    value={categoria}
    onChange={(e) => setCategoria(e.target.value)}
    className="bg-gray-800 border border-gray-600 text-white p-2 rounded w-full"
  >
    {categorias.map((c) => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>
  <input
    type="datetime-local"
    value={dataHora}
    onChange={(e) => setDataHora(e.target.value)}
    className="bg-gray-800 border border-gray-600 text-white p-2 rounded w-full"
    required
  />
  <button
    type="submit"
    className={`w-full p-2 rounded text-white transition duration-200 cursor-pointer
    ${
      editandoId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700 '
    }`}
  >
    {editandoId ? 'Salvar Edição' : 'Adicionar'}
  </button>
</form>


      {/* Totais e Saldo */}
      <div className="mb-6 space-y-2 bg-gray-800 p-4 rounded shadow">
  <div>Total Receitas: <strong className="text-green-400">R$ {totais.receitas.toFixed(2)}</strong></div>
  <div>Total Despesas: <strong className="text-red-400">R$ {totais.despesas.toFixed(2)}</strong></div>
  <div>Saldo Atual: <strong className={saldo >= 0 ? 'text-green-300' : 'text-red-300'}>
    R$ {saldo.toFixed(2)}
  </strong></div>
</div>


      {/* Lista de Transações */}
      <ul className="space-y-2">
  {transacoes.map((t) => (
    <li
      key={t.id}
      className={`p-4 rounded flex justify-between items-center transition duration-200 shadow-md ${
        t.tipo === 'Receita' ? 'bg-green-900 hover:bg-green-800' : 'bg-red-900 hover:bg-red-800'
      }`}
    >
      <div>
        <div className="font-semibold">{t.descricao}</div>
        <div className="text-sm text-gray-300">
          {t.categoria} • {new Date(t.dataHora.seconds * 1000).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="font-bold text-white">
          {t.tipo === 'Receita' ? '+' : '-'}R$ {t.valor.toFixed(2)}
        </span>
        <button
          onClick={() => handleEditar(t)}
          className="text-yellow-400 hover:text-yellow-300 border border-yellow-500 px-2 py-1 rounded cursor-pointer
          "
        >
          ✎
        </button>
        <button
          onClick={() => handleExcluir(t.id)}
          className="text-red-400 hover:text-red-300 border border-red-500 px-2 py-1 rounded cursor-pointer
          "
        >
          🗑️
        </button>
      </div>
    </li>
  ))}
</ul>

    </div>
  );
}

export default App;
