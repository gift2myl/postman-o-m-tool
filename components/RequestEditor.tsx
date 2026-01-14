
import React, { useState, useEffect } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { PostmanItem } from '../types';

interface RequestEditorProps {
  item: PostmanItem;
  onSend: () => void;
  isSending: boolean;
}

const RequestEditor: React.FC<RequestEditorProps> = ({ item, onSend, isSending }) => {
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body'>('body');
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const rawUrl = typeof item.request.url === 'string' ? item.request.url : item.request.url.raw;
    setUrl(rawUrl);
  }, [item]);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.request.body.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prettifyJson = (raw: string) => {
    try {
      return JSON.stringify(JSON.parse(raw), null, 4);
    } catch {
      return raw;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1c1c1c]">
      {/* URL Bar Area */}
      <div className="p-4 border-b border-[#333] flex items-center gap-3 bg-[#212121]">
        <div className="flex border border-[#444] rounded overflow-hidden flex-1 shadow-inner">
          <div className="bg-[#2a2a2a] text-green-500 px-4 py-2 text-xs font-bold border-r border-[#444] flex items-center">
            {item.request.method}
          </div>
          <input
            type="text"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-[#ddd] focus:outline-none"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <button
          onClick={onSend}
          disabled={isSending}
          className={`px-8 py-2 rounded text-white text-sm font-semibold transition-all shadow-lg flex items-center gap-2 ${
            isSending ? 'bg-orange-700 opacity-70' : 'bg-orange-600 hover:bg-orange-700 active:scale-95'
          }`}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : 'Send'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#333] bg-[#212121]">
        {['Params', 'Auth', 'Headers', 'Body'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase() as any)}
            className={`px-6 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.toLowerCase()
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            {tab}
            {tab === 'Headers' && (
              <span className="ml-2 bg-[#333] text-[10px] px-1.5 rounded-full text-white">
                {item.request.header.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-[#1c1c1c]">
        {activeTab === 'body' && (
          <div className="flex flex-col h-full">
            <div className="px-4 py-2 border-b border-[#333] flex items-center justify-between text-[#888] bg-[#1e1e1e]">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                  <input type="radio" checked readOnly className="accent-orange-500" /> raw
                </label>
                <div className="text-[10px] bg-[#333] px-1.5 py-0.5 rounded text-orange-400 font-bold">JSON</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="p-1 hover:bg-[#333] rounded transition-colors" 
                  title="Copy Body"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                className="w-full h-full bg-transparent code-font text-sm text-blue-300 resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
                value={prettifyJson(item.request.body.raw)}
                readOnly
              />
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="p-4">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="text-[#666] border-b border-[#333]">
                  <th className="pb-2 font-medium w-1/3 px-2 uppercase tracking-tighter">Key</th>
                  <th className="pb-2 font-medium w-1/2 px-2 uppercase tracking-tighter">Value</th>
                  <th className="pb-2 font-medium px-2 uppercase tracking-tighter">Description</th>
                </tr>
              </thead>
              <tbody>
                {item.request.header.map((header, idx) => (
                  <tr key={idx} className="border-b border-[#222] hover:bg-[#252525]">
                    <td className="py-2 px-2 text-orange-200/80 font-mono">{header.key}</td>
                    <td className="py-2 px-2 text-[#ccc] font-mono">{header.value}</td>
                    <td className="py-2 px-2 text-[#666] italic">{header.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(activeTab === 'params' || activeTab === 'auth') && (
          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30">
            <Info size={40} />
            <span className="text-xs">No configuration needed for this request type</span>
          </div>
        )}
      </div>

      {/* Footer / Meta info */}
      <div className="px-4 py-2 border-t border-[#333] bg-[#212121] flex justify-between items-center text-[10px] text-[#666]">
        <div className="flex gap-4">
          <span>Name: <strong>{item.name}</strong></span>
          <span>Request ID: <span className="font-mono">{item._id || 'N/A'}</span></span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span>Cloud Environment</span>
        </div>
      </div>
    </div>
  );
};

export default RequestEditor;
