// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [blocoAtual, setBlocoAtual] = useState('');
  const [tombamentoAtual, setTombamentoAtual] = useState('');
  const [tombamentosDoBloco, setTombamentosDoBloco] = useState([]); // Tombamentos para o bloco atualmente em edição
  const [dadosGerais, setDadosGerais] = useState([]); // Array de objetos {bloco: '', tombamentos: []} para todos os blocos
  const [etapa, setEtapa] = useState(1); // 1: Bloco, 2: Tombamentos
  const [mensagem, setMensagem] = useState('');
  const [appEncerrado, setAppEncerrado] = useState(false); // Novo estado para indicar se a aplicação está encerrada

  // Efeito para focar no campo de entrada quando a etapa muda
  useEffect(() => {
    if (!appEncerrado) { // Só foca se a aplicação não estiver encerrada
      if (etapa === 1) {
        document.getElementById('bloco')?.focus(); // Usar optional chaining para evitar erro se elemento não existir
      } else if (etapa === 2) {
        document.getElementById('tombamento')?.focus();
      }
    }
  }, [etapa, appEncerrado]); // Dependência em appEncerrado também

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
    setEtapa(2); // Muda para a etapa de tombamentos
    setTombamentoAtual(''); // Limpa o campo de tombamento para o novo bloco
  };

  const adicionarOuControlarTombamento = () => {
    if (tombamentoAtual.trim() === '') {
      setMensagem('Por favor, digite o Tombamento, "0" para finalizar o bloco, ou "1" para fechar a aplicação.');
      return;
    }

    if (tombamentoAtual === '0') {
      // Comando '0': Finaliza o bloco atual e prepara para o próximo
      if (tombamentosDoBloco.length > 0) {
        setDadosGerais([...dadosGerais, { bloco: blocoAtual, tombamentos: tombamentosDoBloco }]);
      } else {
        // Se o bloco foi finalizado com '0' mas não tinha tombamentos
        // Você pode decidir se quer ou não registrar o bloco vazio.
        // Por enquanto, vamos registrar apenas se houver tombamentos.
        setMensagem('Nenhum tombamento adicionado a este bloco. Ele não será incluído no arquivo final.');
      }
      setBlocoAtual('');
      setTombamentosDoBloco([]); // Limpa os tombamentos para o novo bloco
      setEtapa(1); // Volta para a etapa de Bloco
      setMensagem('Bloco finalizado. Por favor, digite o próximo Bloco ou "1" para fechar a aplicação.');
    } else if (tombamentoAtual === '1') {
      // Comando '1': Fechar a aplicação e gerar o arquivo TXT consolidado

      // Salva o último bloco em edição, se houver tombamentos
      if (blocoAtual.trim() !== '' && tombamentosDoBloco.length > 0) {
        setDadosGerais((prevDadosGerais) => [...prevDadosGerais, { bloco: blocoAtual, tombamentos: tombamentosDoBloco }]);
        // Importante: usar o estado atualizado para gerar o TXT
        // pois o setState é assíncrono.
        gerarArquivoTxtConsolidado([...dadosGerais, { bloco: blocoAtual, tombamentos: tombamentosDoBloco }]);
      } else {
        gerarArquivoTxtConsolidado(dadosGerais); // Gera com os dados já salvos
      }

      setAppEncerrado(true);
      setMensagem('Aplicação encerrada. O arquivo TXT consolidado foi gerado e baixado.');
      // Opcional: desabilitar inputs, botões, etc.
    } else {
      // Adiciona o tombamento à lista
      setTombamentosDoBloco([...tombamentosDoBloco, tombamentoAtual]);
      setTombamentoAtual(''); // Limpa o campo para o próximo tombamento
      setMensagem('');
    }
  };

  const gerarArquivoTxtConsolidado = (finalDados) => {
    if (finalDados.length === 0) {
      alert('Nenhum dado de bloco/tombamento foi coletado para gerar o arquivo.');
      return;
    }

    let conteudoTxt = 'RELATÓRIO DE CADASTRO DE BENS\n';
    conteudoTxt += `Data de Geração: ${new Date().toLocaleString('pt-BR')}\n`;
    conteudoTxt += '=====================================\n\n';

    finalDados.forEach((item, index) => {
      conteudoTxt += `BLOCO: ${item.bloco}\n`;
      if (item.tombamentos.length > 0) {
        item.tombamentos.forEach((tomb, i) => {
          conteudoTxt += `  Tombamento ${i + 1}: ${tomb}\n`;
        });
      } else {
        conteudoTxt += `  (Nenhum tombamento registrado para este bloco)\n`;
      }
      conteudoTxt += `-------------------------------------\n\n`; // Separador entre blocos
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

  // Renderiza a interface
  return (
    <div className="container">
      <h1>Cadastro de Bens por Bloco</h1>

      {appEncerrado ? (
        <div className="card encerrado">
          <p className="mensagem-sucesso">{mensagem}</p>
          <p>Você pode fechar esta janela do navegador.</p>
          {/* Opcional: botão para reiniciar */}
          {/* <button onClick={() => window.location.reload()}>Reiniciar Aplicação</button> */}
        </div>
      ) : (
        <>
          {etapa === 1 && (
            <div className="card">
              <label htmlFor="bloco">Digite o Bloco:</label>
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
                disabled={appEncerrado} // Desabilita se encerrado
                required
              />
              {mensagem && etapa === 1 && <p className="mensagem-erro">{mensagem}</p>}
              <button onClick={iniciarTombamentos} disabled={appEncerrado}>
                Iniciar Tombamentos para este Bloco
              </button>
            </div>
          )}

          {etapa === 2 && (
            <div className="card">
              <h2>Bloco Atual: **{blocoAtual}**</h2>
              <label htmlFor="tombamento">
                Digite o Tombamento do Bem (ou **0** para finalizar este Bloco, ou **1** para fechar a aplicação):
              </label>
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
                disabled={appEncerrado} // Desabilita se encerrado
                required
              />
              {mensagem && etapa === 2 && <p className="mensagem-erro">{mensagem}</p>}
              <button onClick={adicionarOuControlarTombamento} disabled={appEncerrado}>
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