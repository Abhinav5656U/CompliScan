import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMessageCircle, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const ChatbotFloat = () => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-end gap-3 no-print">
      {open && (
        <div className="w-64 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Need help?</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">Ask about a scan or prepare a complaint.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant preview"
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
          <Link
            to="/chatbot"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900"
          >
            <FiMessageCircle className="h-4 w-4" />
            Open Assistant
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        title="Open assistant"
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-primary-800 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary-900 focus:outline-none focus:ring-4 focus:ring-primary-200"
      >
        {open ? <FiX className="h-6 w-6" /> : <FiMessageCircle className="h-6 w-6" />}
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          Open Assistant
        </span>
      </button>
    </div>
  );
};

export default ChatbotFloat;
