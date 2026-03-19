import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const API_BASE_URL = "http://localhost:8000";

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [aiConfig, setAiConfig] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Fetch AI config on mount
    useEffect(() => {
        fetchAiConfig();
    }, []);

    const fetchAiConfig = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/chatbot/config`);
            setAiConfig(response.data);
            
            // Set initial message based on AI availability
            const aiStatus = response.data.ai_available 
                ? `🤖 **AI-Powered** (${response.data.ai_provider === 'azure_openai' ? 'Azure OpenAI' : 'Google Gemini'})`
                : '⚡ **Regex Mode** (No AI configured)';
            
            setMessages([{
                type: 'bot',
                content: `👋 Hi! I'm your Fee Management Assistant. ${aiStatus}

I can help you:
• **Add students**: "Add student John Doe, email john@email.com, phone 1234567890"
• **Add payments**: "Add payment for John Doe, amount 500, due 2025-03-15"
• **Delete students**: "Delete student John Doe"
• **Delete payments**: "Delete payment 5" or "Delete payment for John Doe"
• **Upload Excel files**: Drag & drop or click 📎 to import bulk data

${!response.data.ai_available ? '\n⚠️ *To enable AI, set GEMINI_API_KEY in docker-compose.yml*' : ''}

How can I help you today?`
            }]);
        } catch (error) {
            console.error('Error fetching AI config:', error);
            setMessages([{
                type: 'bot',
                content: `👋 Hi! I'm your Fee Management Assistant.

I can help you:
• **Add students**: "Add student John Doe, email john@email.com, phone 1234567890"
• **Add payments**: "Add payment for John Doe, amount 500, due 2025-03-15"
• **Delete students**: "Delete student John Doe"
• **Delete payments**: "Delete payment 5" or "Delete payment for John Doe"
• **Upload Excel files**: Drag & drop or click 📎 to import bulk data

How can I help you today?`
            }]);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        
        setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/chatbot/message`, {
                message: userMessage,
                use_ai: aiConfig?.ai_available ?? false
            });

            const result = response.data;
            let botResponse = result.ai_response || '';

            if (result.success && result.data) {
                if (result.action === 'add_student') {
                    botResponse = `✅ Successfully added student!\n\n**Name:** ${result.data.name}\n**Email:** ${result.data.email}\n**ID:** ${result.data.user_id}`;
                } else if (result.action === 'add_payment') {
                    botResponse = `✅ Successfully created payment!\n\n**Student:** ${result.data.student}\n**Amount:** $${result.data.amount}\n**Due Date:** ${result.data.due_date}\n**ID:** ${result.data.payment_id}`;
                } else if (result.action === 'delete_student') {
                    botResponse = `🗑️ Successfully deleted student!\n\n**Name:** ${result.data.name}\n**ID:** ${result.data.user_id}`;
                    if (result.data.payments_deleted > 0) {
                        botResponse += `\n**Payments removed:** ${result.data.payments_deleted}`;
                    }
                } else if (result.action === 'delete_payment') {
                    botResponse = `🗑️ Successfully deleted payment!\n\n**Payment ID:** ${result.data.payment_id}\n**Student:** ${result.data.student}\n**Amount:** $${result.data.amount}`;
                }
            } else if (result.error) {
                botResponse = `❌ ${result.error}${result.ai_response ? `\n\n${result.ai_response}` : ''}`;
            } else if (result.action === 'help') {
                botResponse = result.ai_response || `I can help you with:
• **Add a student**: "Add student John Doe, email john@email.com, phone 1234567890"
• **Add a payment**: "Add payment for John Doe, amount 500, due 2025-03-15"
• **Delete a student**: "Delete student John Doe"
• **Delete a payment**: "Delete payment 5" or "Delete payment for John Doe"
• **Upload Excel file**: Use the 📎 button to import bulk data`;
            }

            setMessages(prev => [...prev, { type: 'bot', content: botResponse }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { 
                type: 'bot', 
                content: '❌ Sorry, something went wrong. Please try again.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        
        if (!validExtensions.includes(fileExt)) {
            setMessages(prev => [...prev, { 
                type: 'bot', 
                content: '❌ Please upload an Excel (.xlsx, .xls) or CSV file.' 
            }]);
            return;
        }

        setMessages(prev => [...prev, { 
            type: 'user', 
            content: `📎 Uploading file: ${file.name}` 
        }]);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/chatbot/upload-excel`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const result = response.data;
            let botResponse = '📊 **Import Results:**\n\n';
            
            if (result.students_added > 0) {
                botResponse += `✅ Added **${result.students_added}** student(s)\n`;
            }
            if (result.payments_added > 0) {
                botResponse += `✅ Added **${result.payments_added}** payment(s)\n`;
            }
            if (result.errors && result.errors.length > 0) {
                botResponse += `\n⚠️ **Errors:**\n`;
                result.errors.slice(0, 5).forEach(err => {
                    botResponse += `• ${err}\n`;
                });
                if (result.errors.length > 5) {
                    botResponse += `• ... and ${result.errors.length - 5} more errors`;
                }
            }
            
            if (result.students_added === 0 && result.payments_added === 0 && (!result.errors || result.errors.length === 0)) {
                botResponse = '⚠️ No records were imported. Please check your file format.';
            }

            setMessages(prev => [...prev, { type: 'bot', content: botResponse }]);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.detail || 'Failed to process file';
            setMessages(prev => [...prev, { 
                type: 'bot', 
                content: `❌ ${errorMessage}` 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const formatMessage = (content) => {
        return content
            .split('\n')
            .map((line, i) => {
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                if (line.startsWith('•')) {
                    return `<div style="margin-left: 10px">${line}</div>`;
                }
                return line;
            })
            .join('<br/>');
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 60px)',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '900px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <Link to="/" style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '14px'
                    }}>
                        ← Back to Dashboard
                    </Link>
                    <h1 style={{
                        margin: 0,
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '24px'
                    }}>
                        🤖 AI Import Assistant
                        {aiConfig && (
                            <span style={{
                                fontSize: '12px',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                background: aiConfig.ai_available ? '#10b981' : '#f59e0b',
                                color: 'white'
                            }}>
                                {aiConfig.ai_available ? (aiConfig.ai_provider === 'azure_openai' ? 'Azure OpenAI' : 'Gemini') : 'Regex Mode'}
                            </span>
                        )}
                    </h1>
                    <div style={{ width: '130px' }}></div>
                </div>

                {/* Chat Container */}
                <div 
                    style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        height: 'calc(100vh - 180px)'
                    }}
                    onDragEnter={handleDrag}
                >
                    {/* Messages Area */}
                    <div 
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            position: 'relative'
                        }}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {dragActive && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(102, 126, 234, 0.1)',
                                border: '3px dashed #667eea',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10
                            }}>
                                <div style={{
                                    textAlign: 'center',
                                    color: '#667eea'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📂</div>
                                    <div style={{ fontSize: '18px', fontWeight: '500' }}>
                                        Drop your Excel file here
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: '15px'
                                }}
                            >
                                <div style={{
                                    maxWidth: '75%',
                                    padding: '12px 16px',
                                    borderRadius: msg.type === 'user' 
                                        ? '16px 16px 4px 16px' 
                                        : '16px 16px 16px 4px',
                                    background: msg.type === 'user' 
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                        : '#f0f2f5',
                                    color: msg.type === 'user' ? 'white' : '#333',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    <div 
                                        dangerouslySetInnerHTML={{ 
                                            __html: formatMessage(msg.content) 
                                        }}
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '1.5'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                marginBottom: '15px'
                            }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '16px 16px 16px 4px',
                                    background: '#f0f2f5',
                                    color: '#666'
                                }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <span className="typing-dot">●</span>
                                        <span className="typing-dot" style={{ animationDelay: '0.2s' }}>●</span>
                                        <span className="typing-dot" style={{ animationDelay: '0.4s' }}>●</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{
                        borderTop: '1px solid #eee',
                        padding: '15px 20px',
                        background: '#fafafa'
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-end'
                        }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".xlsx,.xls,.csv"
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '2px solid #667eea',
                                    background: 'white',
                                    color: '#667eea',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    opacity: isLoading ? 0.5 : 1
                                }}
                                title="Upload Excel/CSV file"
                            >
                                📎
                            </button>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message... (e.g., 'Add student John Doe, email john@email.com, phone 1234567890')"
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '2px solid #e0e0e0',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: isLoading || !inputValue.trim() 
                                        ? '#ccc' 
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s',
                                    boxShadow: isLoading || !inputValue.trim() 
                                        ? 'none' 
                                        : '0 2px 10px rgba(102, 126, 234, 0.3)'
                                }}
                            >
                                Send
                            </button>
                        </div>
                        <div style={{
                            marginTop: '10px',
                            fontSize: '12px',
                            color: '#888',
                            textAlign: 'center'
                        }}>
                            💡 Tip: Drag and drop an Excel file anywhere in the chat, or click 📎 to upload
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes typing {
                    0%, 60%, 100% { opacity: 0.3; }
                    30% { opacity: 1; }
                }
                .typing-dot {
                    animation: typing 1.4s infinite;
                    font-size: 12px;
                }
            `}</style>
        </div>
    );
};

export default Chatbot;
