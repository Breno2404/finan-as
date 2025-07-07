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

  const [modalAberto, setModalAberto] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null); // Novo estado para controle de exclusão

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
    setModalAberto(false);  // Fecha o modal após a submissão
  };

  const handleEditar = (t) => {
    setDescricao(t.descricao);
    setValor(t.valor);
    setCategoria(t.categoria);
    setTipo(t.tipo);
    setDataHora(new Date(t.dataHora.seconds * 1000).toISOString().slice(0, 16));
    setEditandoId(t.id);
    setModalAberto(true); // Abre o modal em modo de edição
  };

  const handleExcluir = (id) => {
    setConfirmarExclusao(id); // Define o ID da transação a ser excluída
  };

  const confirmarExclusaoTransacao = async () => {
    if (confirmarExclusao !== null) {
      await deleteDoc(doc(db, 'transacoes', confirmarExclusao));
      fetchTransacoes();
      setConfirmarExclusao(null); // Reseta o ID após exclusão
    }
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

      {/* Filtros */}
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-center sm:gap-2 gap-4 cursor-pointer">
        <select
          value={filtro.tipo}
          onChange={(e) => setFiltro({ ...filtro, tipo: e.target.value })}
          className="bg-gray-800 border border-gray-600 text-white p-2 rounded cursor-pointer"
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
          className="bg-gray-800 border border-gray-600 text-white p-2 rounded cursor-pointer"
        />
        <select
          value={filtro.categoria}
          onChange={(e) => setFiltro({ ...filtro, categoria: e.target.value })}
          className="bg-gray-800 border border-gray-600 text-white p-2 rounded cursor-pointer"
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Botão para abrir o Modal */}
      <button
        onClick={() => setModalAberto(true)}
        className="bg-blue-600 text-white p-2 rounded w-full mb-4"
      >
        Adicionar Transação
      </button>

      {/* Lista de Transações */}
      <ul className="space-y-2">
        {transacoes.map((t) => (
          <li
            key={t.id}
            className={`p-4 rounded flex justify-between items-center transition duration-200 shadow-md ${t.tipo === 'Receita' ? 'bg-green-900 hover:bg-green-800' : 'bg-red-900 hover:bg-red-800'}`}
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
                className="text-yellow-400 hover:text-yellow-300 border border-yellow-500 px-2 py-1 rounded cursor-pointer"
              >
                ✎
              </button>
              <button
                onClick={() => handleExcluir(t.id)}
                className="text-red-400 hover:text-red-300 border border-red-500 px-2 py-1 rounded cursor-pointer"
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-30">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">
              {editandoId ? 'Editar Transação' : 'Adicionar Transação'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded w-full"
              >
                {tipos.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição"
                className="bg-gray-700 text-white p-2 rounded w-full"
                required
              />

              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Valor"
                  className="pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 text-white rounded w-full"
                  required
                />
              </div>


              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded w-full"
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded w-full"
                required
              />

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setModalAberto(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  {editandoId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-50">
          <div className="bg-gray-600 p-6 rounded-lg shadow-lg text-white">
            <h2 className="text-xl font-bold mb-4">Tem certeza que deseja excluir esta transação?</h2>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setConfirmarExclusao(null)}
                className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded cursor-pointer
                "
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusaoTransacao}
                className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded cursor-pointer
                "
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
