const apiKeyInput = document.getElementById('apiKey');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const chatHistoryContainer = document.getElementById('chatHistory');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorBanner = document.getElementById('errorBanner');

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_ID = 'qwen3.6-plus';

// 彻底更新为人设：顶级跨学科通用学术润色专家
const systemPrompt = {
    role: 'system',
    content: `你名为 Nexus，是一位拥有数十年经验的世界级顶级学术期刊总编与资深审稿人。
    你的任务是协助用户润色各类学术论文、优化逻辑结构、提取高难度文献的摘要。
    请严格遵守以下规则：
    1. 不局限于任何单一领域。无论用户输入的是物理、生物医疗、计算机科学、经济学还是人文社科，你都要能切换至该领域的顶级专业语境。
    2. 语言风格必须极其严谨、客观，符合顶级学术会议或期刊（如 Nature, Science, Cell, IEEE, Elsevier 等）的正式出版物规范。
    3. 如果用户提供了口语化的草稿，请将其重构为高级学术表达（例如使用恰当的被动语态、长难句拆分与逻辑连词）。
    4. 完美支持用户的多轮修改要求（例如：“请精简字数到200字内”、“请强化这一段的逻辑关联”、“请帮我换用更地道的英式英语表达”）。`
};

let conversationHistory = [systemPrompt];

function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.remove('hidden');
    setTimeout(() => errorBanner.classList.add('hidden'), 5000);
}

function appendMessageToUI(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role === 'user' ? 'user' : 'bot');

    let formattedContent = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    // 基础的加粗格式解析
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    msgDiv.innerHTML = formattedContent;
    chatHistoryContainer.appendChild(msgDiv);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
}

async function fetchModelResponse() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showError('身份验证失败：请先配置您的 API 密钥。');
        return;
    }

    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    appendMessageToUI('user', text);
    conversationHistory.push({ role: 'user', content: text });

    loadingIndicator.classList.remove('hidden');
    sendBtn.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: conversationHistory
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `网络异常状态码: ${response.status}`);
        }

        const data = await response.json();
        const botReply = data.choices[0].message.content;

        conversationHistory.push({ role: 'assistant', content: botReply });
        appendMessageToUI('assistant', botReply);

    } catch (error) {
        console.error('引擎调用异常:', error);
        showError('Nexus 引擎连接失败：' + error.message);
        conversationHistory.pop();
    } finally {
        loadingIndicator.classList.add('hidden');
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function resetConversation() {
    conversationHistory = [systemPrompt];
    chatHistoryContainer.innerHTML = '';
    userInput.value = '';
    appendMessageToUI('assistant', '您好，系统已初始化。我是 Nexus 学术引擎。您可以输入任何学科的论文段落、摘要草稿或审稿意见，我将以顶级期刊的标准为您进行结构重组与深度润色。');
}

sendBtn.addEventListener('click', fetchModelResponse);
clearBtn.addEventListener('click', resetConversation);
userInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        fetchModelResponse();
    }
});

resetConversation();