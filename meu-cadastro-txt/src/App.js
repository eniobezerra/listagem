// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

// Chave para armazenar os dados no localStorage
const LOCAL_STORAGE_KEY = 'cadastroBensData';

function App() {
  const [blocoAtual, setBlocoAtual] = useState('');
  const [tombamentoAtual, setTombamentoAtual] = useState('');
  const [tombamentosDoBloco, setTombamentosDoBloco] = useState([]);
  const [dadosGerais, setDadosGerais] = useState(() => {
    // Tenta carregar dados do localStorage na inicialização
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage:", error);
      return [];
    }
  });
  const [etapa, setEtapa] = useState(1);
  const [mensagem, setMensagem] = useState('');
  const [appEncerrado, setAppEncerrado] = useState(false);

  // Efeito para focar no campo de entrada quando a etapa muda
  useEffect(() => {
    if (!appEncerrado) {
      if (etapa === 1) {
        document.getElementById('bloco')?.focus();
      } else if (etapa === 2) {
        document.getElementById('tombamento')?.focus();
      }
    }
  }, [etapa, appEncerrado]);

  // Efeito para salvar dados no localStorage sempre que 'dadosGerais' mudar
  // Este useEffect garante que a cada atualização, os dados sejam persistidos
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dadosGerais));
    } catch (error) {
      console.error("Erro ao salvar dados no localStorage:", error);
    }
  }, [dadosGerais]);


  const handleBlocoChange = (e) => {
    setBlocoAtual(e.target.value);
  };

  const handleTombamentoChange = (e) => {
    setTombamentoAtual(e.target.value);
  };

  const iniciarTombamentos = () => {
    if (blocoAtual.trim() === '') {
      setMensagem('Por favor, digite o Bloco.');
      return;
    }
    setMensagem('');
    setEtapa(2);
    setTombamentoAtual('');
  };

  const adicionarOuControlarTombamento = () => {
    if (tombamentoAtual.trim() === '') {
      setMensagem('Por favor, digite o Tombamento, "0" para finalizar o bloco, ou "1" para fechar e gerar o arquivo.');
      return;
    }

    if (tombamentoAtual === '0') {
      // Comando '0': Finaliza o bloco atual e prepara para o próximo
      if (blocoAtual.trim() !== '' && tombamentosDoBloco.length > 0) {
        setDadosGerais(prevDados => [...prevDados, { bloco: blocoAtual, tombamentos: tombamentosDoBloco }]);
        setMensagem('Bloco finalizado e salvo no histórico. Digite o próximo Bloco.');
      } else {
        // Se o bloco foi finalizado com '0' mas não tinha tombamentos
        setMensagem('Bloco sem tombamentos adicionados. Digite o próximo Bloco.');
      }
      setBlocoAtual('');
      setTombamentosDoBloco([]);
      setEtapa(1);
    } else if (tombamentoAtual === '1') {
      // Comando '1': Fechar a aplicação e gerar o arquivo TXT consolidado

      let dadosParaGerar = [...dadosGerais];

      // Se houver um bloco em edição com tombamentos, adiciona-o antes de gerar
      if (blocoAtual.trim() !== '' && tombamentosDoBloco.length > 0) {
        dadosParaGerar = [...dadosParaGerar, { bloco: blocoAtual, tombamentos: tombamentosDoBloco }];
      }

      // Garante que os dados recém-adicionados (se for o caso) sejam salvos no localStorage antes de gerar o TXT
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dadosParaGerar));
      } catch (error) {
        console.error("Erro ao salvar dados finais no localStorage:", error);
      }
      
      gerarArquivoTxtConsolidado(dadosParaGerar);
      setAppEncerrado(true);
      setMensagem('Aplicação encerrada. O arquivo TXT consolidado com todos os dados salvos foi gerado e baixado.');
      setBlocoAtual('');
      setTombamentoAtual('');
      setTombamentosDoBloco([]);
    } else {
      // Adiciona o tombamento à lista
      setTombamentosDoBloco([...tombamentosDoBloco, tombamentoAtual]);
      setTombamentoAtual('');
      setMensagem('');
    }
  };

  const gerarArquivoTxtConsolidado = (finalDados) => {
    if (finalDados.length === 0) {
      alert('Nenhum dado de bloco/tombamento foi coletado ou salvo para gerar o arquivo.');
      return;
    }

    let conteudoTxt = 'RELATÓRIO DE CADASTRO DE BENS\n';
    conteudoTxt += `Data de Geração: ${new Date().toLocaleString('pt-BR')}\n`;
    conteudoTxt += '=====================================\n\n';

    finalDados.forEach((item, index) => {
      conteudoTxt += `BLOCO: ${item.bloco}\n`;
      if (item.tombamentos && item.tombamentos.length > 0) {
        item.tombamentos.forEach((tomb, i) => {
          conteudoTxt += `  Tombamento ${i + 1}: ${tomb}\n`;
        });
      } else {
        conteudoTxt += `  (Nenhum tombamento registrado para este bloco)\n`;
      }
      conteudoTxt += `-------------------------------------\n\n`;
    });

    const nomeArquivo = `cadastro_bens_consolidado_${new Date().getTime()}.txt`;

    const blob = new Blob([conteudoTxt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Arquivo consolidado "${nomeArquivo}" gerado e baixado.`);
  };

  const limparTodosOsDados = () => {
    if (window.confirm("Tem certeza que deseja apagar TODOS os dados salvos (incluindo os de sessões anteriores)? Esta ação é irreversível!")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setDadosGerais([]);
      setBlocoAtual('');
      setTombamentoAtual('');
      setTombamentosDoBloco([]);
      setEtapa(1);
      setAppEncerrado(false);
      setMensagem('Todos os dados foram apagados. Recomece o cadastro.');
    }
  };


  return (
    <div className="container">
      <h1>Cadastro de Bens por Bloco</h1>

      {appEncerrado ? (
        <div className="card encerrado">
          <p className="mensagem-sucesso">{mensagem}</p>
          <p>Você pode fechar esta janela do navegador ou reiniciar.</p>
          <button onClick={() => window.location.reload()}>Reiniciar Aplicação</button>
          <button onClick={limparTodosOsDados} className="btn-secundario" style={{ marginLeft: '10px' }}>Apagar Tudo e Reiniciar</button>
        </div>
      ) : (
        <>
          {etapa === 1 && (
            <div className="card">
              <p className="instrucao">Digite o Bloco para começar.</p>
              <label htmlFor="bloco">Bloco:</label>
              <input
                type="text"
                id="bloco"
                value={blocoAtual}
                onChange={handleBlocoChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    iniciarTombamentos();
                  }
                }}
                required
              />
              {mensagem && etapa === 1 && <p className="mensagem-erro">{mensagem}</p>}
              <button onClick={iniciarTombamentos}>Iniciar Tombamentos para este Bloco</button>
              
              {dadosGerais.length > 0 && (
                <p className="dados-existentes">
                  **Existem {dadosGerais.length} bloco(s) salvo(s) de sessões anteriores.**
                  <button onClick={() => gerarArquivoTxtConsolidado(dadosGerais)} className="btn-secundario btn-pequeno">Gerar TXT dos dados existentes</button>
                </p>
              )}
            </div>
          )}

          {etapa === 2 && (
            <div className="card">
              <h2>Bloco Atual: **{blocoAtual}**</h2>
              <p className="instrucao">
                Digite o Tombamento, ou **0** para ir para o próximo bloco, ou **1** para finalizar tudo.
              </p>
              <label htmlFor="tombamento">Tombamento do Bem:</label>
              <input
                type="text"
                id="tombamento"
                value={tombamentoAtual}
                onChange={handleTombamentoChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    adicionarOuControlarTombamento();
                  }
                }}
                required
              />
              {mensagem && etapa === 2 && <p className="mensagem-erro">{mensagem}</p>}
              <button onClick={adicionarOuControlarTombamento}>
                {tombamentoAtual === '0' ? 'Finalizar Bloco' :
                 tombamentoAtual === '1' ? 'Finalizar Tudo e Gerar TXT' :
                 'Adicionar Tombamento'}
              </button>

              {tombamentosDoBloco.length > 0 && (
                <div className="lista-tombamentos">
                  <h3>Tombamentos para este Bloco:</h3>
                  <ul>
                    {tombamentosDoBloco.map((tomb, index) => (
                      <li key={index}>{tomb}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
// teste ok
