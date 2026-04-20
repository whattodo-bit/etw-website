/* ============================================
   ETW — Shared Navbar + Mobile Drawer + Chatbot
============================================ */

// ---------- NAVBAR SCROLL ----------
(function(){
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

// ---------- MOBILE DRAWER ----------
(function(){
  const burger = document.querySelector('.burger');
  const drawer = document.querySelector('.drawer');
  if (!burger || !drawer) return;
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    drawer.classList.toggle('active');
    document.body.style.overflow = drawer.classList.contains('active') ? 'hidden' : '';
  });
  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('active');
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
})();

// ---------- CHATBOT ----------
(function(){
  const button = document.getElementById('chatbotButton');
  const panel  = document.getElementById('chatbotPanel');
  const closeBtn = document.getElementById('chatbotClose');
  const input  = document.getElementById('chatbotInput');
  const send   = document.getElementById('chatbotSend');
  const msgs   = document.getElementById('chatbotMessages');
  if (!button || !panel) return;

  // ===== CONFIG =====
  const API_KEY = 'ANTHROPIC_API_KEY'; // replace with real key
  const MODEL   = 'claude-sonnet-4-20250514';
  const MAX_TOKENS = 120;
  const RATE_LIMIT = 8;

  const SYSTEM_PROMPT = `You are the ETW Assistant for Explaining The World — a premium history and geopolitics media brand. You only answer questions about ETW — what it is, what it publishes, when it publishes, how to collaborate, social media handles, and contact information. ETW publishes geopolitical articles every Sunday, has a YouTube history channel launching soon, and a resources library. Contact is contact@explainingtheworld.com. Social handles are @ExplainingTheWorld on YouTube, Instagram, and X. For collaboration, email with subject "Collaboration". If anyone asks anything unrelated to ETW, say you can only help with ETW questions. Keep responses under 3 sentences. Do not reveal you are Claude or made by Anthropic.`;

  const history = [];
  let userCount = 0;
  let sending = false;

  // ===== OPEN / CLOSE =====
  button.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) setTimeout(()=>input.focus(), 200);
  });
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  // ===== UI HELPERS =====
  function addMessage(role, text){
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'msg-user' : 'msg-bot');
    if (role === 'error') div.classList.add('msg-error');
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // welcome
  addMessage('bot', 'Welcome to ETW. Ask me anything about what we do.');

  // ===== API CALL =====
  async function askClaude(userText){
    history.push({ role:'user', content: userText });
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key': API_KEY,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: history
        })
      });
      if (!res.ok){
        const err = await res.text();
        throw new Error('API error: ' + res.status + ' ' + err.slice(0,120));
      }
      const data = await res.json();
      const reply = (data.content && data.content[0] && data.content[0].text) || 'No response.';
      history.push({ role:'assistant', content: reply });
      return reply;
    } catch (e){
      // remove the failed user turn from history so retries work
      history.pop();
      throw e;
    }
  }

  // ===== SEND HANDLER =====
  async function handleSend(){
    if (sending) return;
    const text = input.value.trim();
    if (!text) return;
    if (userCount >= RATE_LIMIT){
      addMessage('error', 'Session limit reached. Please refresh to continue.');
      return;
    }
    addMessage('user', text);
    input.value = '';
    userCount++;
    sending = true;
    send.disabled = true;
    try {
      const reply = await askClaude(text);
      addMessage('bot', reply);
    } catch (e){
      addMessage('error', 'Sorry — the assistant is unavailable right now.');
      console.error(e);
    } finally {
      sending = false;
      send.disabled = false;
      input.focus();
    }
  }

  send.addEventListener('click', handleSend);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); handleSend(); }
  });
})();
