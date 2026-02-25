import { useState, useEffect, useRef } from 'react'
import './App.css'
import botlogo from './assets/logo.png';
import addBtn from './assets/add.png';
import msgIcon from './assets/send.png';
import upgradex from './assets/upload.png';
import reactx from './assets/react.png';

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]); 
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem('eagle_chats') || '[]');
    setChats(savedChats);
    if (window.puter) setIsConnected(window.puter.auth.isSignedIn());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem('eagle_chats', JSON.stringify(chats));
  }, [messages, chats]);

  const speak = (text) => {
    if (isMuted) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleConnect = async () => {
    try {
      await window.puter.auth.signIn();
      setIsConnected(true);
    } catch (err) { alert("Please allow popups!"); }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const loadPastChat = (chat) => {
    setMessages(chat.history);
    setCurrentChatId(chat.id);
  };

  const handleSend = async () => {
    if (input.trim() === "" || isTyping || !isConnected) return;

    const userMsg = { text: input, isBot: false };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    let chatId = currentChatId || Date.now();
    if (!currentChatId) setCurrentChatId(chatId);

    try {
      const history = [
        { role: 'system', content: 'You are Eagle AI, a helpful assistant.' },
        ...updatedMessages.map(m => ({
          role: m.isBot ? 'assistant' : 'user',
          content: m.text
        }))
      ];

      const response = await window.puter.ai.chat(history);
      const botText = typeof response === 'string' ? response : response?.message?.content;
      const finalMessages = [...updatedMessages, { text: botText, isBot: true }];

      setMessages(finalMessages);
      speak(botText);

      setChats(prev => {
        const chatEntry = {
          id: chatId,
          title: updatedMessages[0].text.slice(0, 20),
          history: finalMessages
        };
        const filtered = prev.filter(c => c.id !== chatId);
        return [chatEntry, ...filtered];
      });

    } catch (error) {
      setMessages(prev => [...prev, { text: "⚠️ Error.", isBot: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="App">
      <div className="sidebar">
        <div className="upperlayer">
          <div className="upperlayerTop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="brand">Eagle AI</span>
            {/* React logo stays original color, just moved to right */}
            <img src={reactx} className="logo" style={{ width: '24px' }} alt="" />
          </div>

          <button className="midBtn" onClick={startNewChat}>
            <img src={addBtn} className="addBtn" alt="" /> New Chat
          </button>

          <div className="pastChats">
            <p className="sidebarTitle">Recent Chats</p>
            {chats.map(chat => (
              <button key={chat.id} className="query" onClick={() => loadPastChat(chat)}>
                <img src={msgIcon} alt="" /> {chat.title}...
              </button>
            ))}
          </div>
        </div>

        <div className="bottomlayer">
          {!isConnected ? (
            <button className="connectBtn" onClick={handleConnect}>Connect AI</button>
          ) : (
            <div className="listItems"><img src={upgradex} className="listitemsImg" style={{filter: 'invert(1)'}} /> Pro Active</div>
          )}
        </div>
      </div>

      <div className="main">
        <div className="chats">
          {messages.length === 0 && (
            <div className="homeContent">
              <img src={reactx} width="60" alt="" />
              <h2>How can I help?</h2>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={msg.isBot ? "chat bot" : "chat user"} style={!msg.isBot ? { flexDirection: 'row-reverse', textAlign: 'right' } : {}}>
              {/* Bot uses ReactX (Original Color), User uses Logo.png (Made White) */}
              <img 
                className='chatImg' 
                src={msg.isBot ? reactx : botlogo} 
                style={!msg.isBot ? { filter: 'brightness(0) invert(1)' } : {}} 
                alt="avatar" 
              />
              <div className="txt">{msg.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="chat bot">
              <img className='chatImg' src={reactx} alt="avatar" />
              <div className="txt">Thinking...</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chatFooter">
          <div className="inpWrapper">
            <div className="inp">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message Eagle AI..."
              />
              <div className="inpRightIcons">
                <button 
                  className="voiceBtn" 
                  onClick={() => { setIsMuted(!isMuted); window.speechSynthesis.cancel(); }}
                  style={{ opacity: isMuted ? 0.4 : 1, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
                <button className="sendBtn" onClick={handleSend}>
                  <img src={msgIcon} alt="" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}