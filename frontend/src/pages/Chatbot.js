import React, { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheck,
  FiMessageCircle,
  FiSend,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';

const Chatbot = () => {
  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState('en');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [scanId, setScanId] = useState('');
  const [summary, setSummary] = useState('');
  const [draft, setDraft] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [complaintForm, setComplaintForm] = useState({
    shop_name: '',
    shop_address: '',
    user_phone: '',
  });

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await api.get('/chatbot/languages');
        setLanguages(response.data.languages || []);
      } catch (error) {
        toast.error('Could not load chatbot languages');
      }
    };
    loadLanguages();
  }, []);

  const startChat = async (nextLanguage = language) => {
    try {
      await api.post('/chatbot/start', { language: nextLanguage });
      setLanguage(nextLanguage);
      setMessages([]);
      setSummary('');
      setDraft(null);
    } catch (error) {
      toast.error('Could not start the chat');
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;

    setMessages((current) => [...current, { role: 'user', text }]);
    setMessage('');
    setLoading(true);
    try {
      const response = await api.post('/chatbot/message', {
        message: text,
        language,
        scan_id: scanId || undefined,
      });
      setMessages((current) => [...current, { role: 'assistant', text: response.data.response }]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Message could not be sent');
    } finally {
      setLoading(false);
    }
  };

  const runScanAction = async (action) => {
    if (!scanId) {
      toast.error('Enter a scan ID first');
      return;
    }
    setActionLoading(action);
    try {
      if (action === 'summary') {
        const response = await api.post('/chatbot/summarize', { scan_id: Number(scanId), language });
        setSummary(response.data.summary);
      } else {
        const response = await api.post('/chatbot/complaint/draft', {
          scan_id: Number(scanId),
          language,
          ...complaintForm,
        });
        setDraft(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || `Could not create ${action}`);
    } finally {
      setActionLoading('');
    }
  };

  const submitComplaint = async () => {
    if (!draft || !scanId) return;
    setActionLoading('submit');
    try {
      await api.post('/chatbot/complaint/submit', {
        scan_id: Number(scanId),
        complaint_id: draft.complaint_id,
        subject: draft.subject,
        body: draft.body,
        language,
        ...complaintForm,
      });
      toast.success('Complaint submitted');
      setDraft(null);
      loadComplaints();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Complaint could not be submitted');
    } finally {
      setActionLoading('');
    }
  };

  const loadComplaints = async () => {
    try {
      const response = await api.get('/chatbot/complaint/my');
      setComplaints(response.data.complaints || []);
    } catch (error) {
      toast.error('Could not load complaints');
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary-800 mb-2">
            <FiMessageCircle className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Compliance assistant</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Ask, understand, act</h1>
          <p className="text-gray-600 mt-2">Discuss scan results and prepare a complaint from one workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="language" className="text-sm font-medium text-gray-600">Language</label>
          <select
            id="language"
            value={language}
            onChange={(event) => startChat(event.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:border-primary-600 focus:ring-primary-600"
          >
            {languages.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Conversation</h2>
              <p className="text-xs text-gray-500 mt-1">Ask about labels, violations, or next steps.</p>
            </div>
            <button onClick={() => startChat()} aria-label="Start a new chat" title="New chat" className="p-2 text-gray-500 hover:text-primary-800 hover:bg-gray-50 rounded-lg">
              <FiRefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-gray-50/70">
            {messages.length === 0 && (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center text-gray-500">
                <FiMessageCircle className="h-10 w-10 text-primary-300 mb-3" />
                <p className="font-medium text-gray-700">Start a conversation</p>
                <p className="text-sm mt-1">Try “Explain my product compliance result.”</p>
              </div>
            )}
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${item.role === 'user' ? 'bg-primary-800 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'}`}>
                  {item.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-gray-500">Assistant is thinking...</div>}
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-2">
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a question..." className="flex-1 rounded-lg border-gray-300 text-sm focus:border-primary-600 focus:ring-primary-600" />
            <button type="submit" disabled={!message.trim() || loading} aria-label="Send message" title="Send message" className="p-3 rounded-lg bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-50">
              <FiSend className="h-4 w-4" />
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4"><FiBookOpen className="text-primary-800" /><h2 className="font-semibold text-gray-900">Scan tools</h2></div>
            <label htmlFor="scan-id" className="block text-sm font-medium text-gray-700 mb-1">Scan ID</label>
            <input id="scan-id" type="number" min="1" value={scanId} onChange={(event) => setScanId(event.target.value)} placeholder="Example: 12" className="w-full rounded-lg border-gray-300 text-sm focus:border-primary-600 focus:ring-primary-600" />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => runScanAction('summary')} disabled={!!actionLoading} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50">{actionLoading === 'summary' ? 'Loading...' : 'Summarize'}</button>
              <button onClick={() => runScanAction('draft')} disabled={!!actionLoading} className="px-3 py-2 rounded-lg bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 disabled:opacity-50">{actionLoading === 'draft' ? 'Drafting...' : 'Draft complaint'}</button>
            </div>
            {summary && <div className="mt-4 p-3 rounded-lg bg-blue-50 text-sm text-blue-900"><p className="font-semibold mb-1">Summary</p>{summary}</div>}
          </section>

          {draft && <section className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3"><FiAlertCircle className="text-amber-600" /><h2 className="font-semibold text-gray-900">Complaint draft</h2></div>
            <p className="text-sm font-semibold text-gray-900">{draft.subject}</p>
            <textarea value={draft.body} readOnly rows="8" className="w-full mt-3 rounded-lg border-gray-200 bg-gray-50 text-xs text-gray-700" />
            <div className="grid gap-2 mt-3">
              {['shop_name', 'shop_address', 'user_phone'].map((field) => <input key={field} value={complaintForm[field]} onChange={(event) => setComplaintForm({ ...complaintForm, [field]: event.target.value })} placeholder={field.replace('_', ' ')} className="rounded-lg border-gray-300 text-sm focus:border-primary-600 focus:ring-primary-600" />)}
            </div>
            <button onClick={submitComplaint} disabled={actionLoading === 'submit'} className="w-full mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"><FiCheck />{actionLoading === 'submit' ? 'Submitting...' : 'Submit complaint'}</button>
          </section>}

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><FiFileText className="text-primary-800" /><h2 className="font-semibold text-gray-900">My complaints</h2></div><button onClick={loadComplaints} aria-label="Refresh complaints" title="Refresh complaints" className="p-1 text-gray-500 hover:text-primary-800"><FiRefreshCw className="h-4 w-4" /></button></div>
            {complaints.length === 0 ? <p className="text-sm text-gray-500">No complaints submitted yet.</p> : <div className="space-y-3">{complaints.slice(0, 4).map((complaint) => <div key={complaint.id} className="border-l-2 border-primary-700 pl-3"><p className="text-sm font-medium text-gray-900">{complaint.subject}</p><p className="text-xs text-gray-500 mt-1">{complaint.status} · {complaint.complaint_id}</p></div>)}</div>}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Chatbot;
