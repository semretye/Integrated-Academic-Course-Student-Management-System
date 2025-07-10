import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Messages = ({ student }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const response = await axios.get('http://localhost:8080/api/students/messages', config);
        setMessages(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch messages');
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const filteredMessages = messages.filter(message => 
    activeTab === 'inbox' ? !message.isSent : message.isSent
  );

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading your messages...</p>
    </div>
  );

  if (error) return (
    <div className="error-message">
      {error}
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );

  return (
    <div className="messages-container">
      <div className="messages-sidebar">
        <div className="tabs">
          <button 
            className={activeTab === 'inbox' ? 'active' : ''}
            onClick={() => setActiveTab('inbox')}
          >
            <i className="fas fa-inbox"></i> Inbox
          </button>
          <button 
            className={activeTab === 'sent' ? 'active' : ''}
            onClick={() => setActiveTab('sent')}
          >
            <i className="fas fa-paper-plane"></i> Sent
          </button>
        </div>

        <div className="messages-list">
          {filteredMessages.length === 0 ? (
            <div className="empty-messages">
              <i className="fas fa-envelope-open"></i>
              <p>No {activeTab} messages</p>
            </div>
          ) : (
            filteredMessages.map(message => (
              <div 
                key={message._id} 
                className={`message-item ${selectedMessage?._id === message._id ? 'active' : ''} ${!message.isRead && activeTab === 'inbox' ? 'unread' : ''}`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="message-header">
                  <h4>{activeTab === 'inbox' ? message.sender?.name : `To: ${message.recipient?.name}`}</h4>
                  <span className="time">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="message-preview">
                  {message.subject || 'No subject'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="message-content">
        {selectedMessage ? (
          <div className="message-details">
            <div className="message-header">
              <h3>{selectedMessage.subject || 'No subject'}</h3>
              <div className="message-meta">
                <span>
                  <strong>{activeTab === 'inbox' ? 'From:' : 'To:'}</strong> 
                  {activeTab === 'inbox' ? selectedMessage.sender?.name : selectedMessage.recipient?.name}
                </span>
                <span>
                  <strong>Date:</strong> 
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="message-body">
              {selectedMessage.content}
            </div>
            <div className="message-actions">
              {activeTab === 'inbox' && (
                <button className="reply-btn">
                  <i className="fas fa-reply"></i> Reply
                </button>
              )}
              <button className="delete-btn">
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="select-message-prompt">
            <i className="fas fa-envelope"></i>
            <p>Select a message to read</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;