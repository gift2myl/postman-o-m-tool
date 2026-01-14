
import React, { useState, useCallback, useEffect } from 'react';
import { 
  FileJson, 
  Send, 
  Search, 
  Plus, 
  Settings, 
  History, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Brain
} from 'lucide-react';
import { PostmanCollection, PostmanItem } from './types';
import Sidebar from './components/Sidebar';
import RequestEditor from './components/RequestEditor';

const App: React.FC = () => {
  const [collection, setCollection] = useState<PostmanCollection | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [response, setResponse] = useState<{ status: number; data: any; time: number } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Handle JSON Import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as PostmanCollection;
        // Inject IDs for internal tracking if needed
        const enrichedItem = json.item.map((item, index) => ({
          ...item,
          _id: `${index}-${item.name}`
        }));
        setCollection({ ...json, item: enrichedItem });
        setSelectedItemId(0);
      } catch (err) {
        alert('Invalid Postman Collection JSON');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  const selectedItem = selectedItemId !== null && collection ? collection.item[selectedItemId] : null;

  const handleSendRequest = useCallback(async (item: PostmanItem) => {
    setIsSending(true);
    setResponse(null);
    const start = Date.now();
    
    // Simulating a real request
    // In a real app, you'd use fetch() with the item details
    setTimeout(() => {
      try {
        // Try to parse the request body to mock a response
        const bodyParsed = JSON.parse(item.request.body.raw);
        setResponse({
          status: 200,
          data: {
            success: true,
            msg: "Operation successful",
            received_data: bodyParsed,
            server_time: new Date().toISOString()
          },
          time: Date.now() - start
        });
      } catch (e) {
        setResponse({
          status: 400,
          data: { error: "Malformed JSON in request body" },
          time: Date.now() - start
        });
      }
      setIsSending(false);
    }, 800);
  }, []);

  // Gemini API Call Function
  const callGeminiAPI = useCallback(async (prompt: string) => {
    setIsLoadingGemini(true);
    setGeminiResponse(null);
    setGeminiError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
        throw new Error("Please set your GEMINI_API_KEY in .env.local file");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const geminiText = data.candidates[0].content.parts[0].text;
      setGeminiResponse(geminiText);
    } catch (error) {
      setGeminiError(error instanceof Error ? error.message : "An error occurred while calling Gemini API");
    } finally {
      setIsLoadingGemini(false);
    }
  }, []);

  // Analyze Request with Gemini
  const analyzeRequestWithGemini = useCallback((item: PostmanItem) => {
    const prompt = `Analyze this API request and provide insights:\n\nMethod: ${item.request.method}\nURL: ${typeof item.request.url === 'string' ? item.request.url : item.request.url.raw}\n\nHeaders: ${JSON.stringify(item.request.header, null, 2)}\n\nBody: ${item.request.body.raw}\n\nPlease provide:\n1. What this request does\n2. Potential improvements\n3. Security considerations`;
    
    callGeminiAPI(prompt);
  }, [callGeminiAPI]);

  const filteredItems = collection?.item.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen w-full bg-[#1c1c1c] overflow-hidden text-[#e0e0e0]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-[#333] flex flex-col bg-[#212121]">
        <div className="p-4 flex items-center justify-between border-b border-[#333]">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-1.5 rounded text-white">
              <FileJson size={18} />
            </div>
            <span className="font-semibold text-sm">Postman O&M</span>
          </div>
          <label className="cursor-pointer hover:bg-[#333] p-1.5 rounded transition-colors">
            <Plus size={18} className="text-[#999]" />
            <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-[#666]" size={14} />
            <input
              type="text"
              placeholder="Search collection"
              className="w-full bg-[#2a2a2a] border border-[#333] rounded-md py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-orange-500/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {collection ? (
            <div className="mt-2">
              <div className="flex items-center gap-1 text-[#bbb] hover:bg-[#2a2a2a] p-1.5 rounded cursor-pointer mb-1">
                <ChevronDown size={14} />
                <span className="text-xs font-medium uppercase tracking-wider truncate">
                  {collection.info.name}
                </span>
              </div>
              <div className="ml-2 border-l border-[#333]">
                {filteredItems.map((item, idx) => {
                  const originalIndex = collection.item.findIndex(i => i.name === item.name);
                  return (
                    <div
                      key={item.name + idx}
                      onClick={() => setSelectedItemId(originalIndex)}
                      className={`py-1.5 px-3 ml-2 rounded cursor-pointer flex items-center justify-between group transition-colors ${
                        selectedItemId === originalIndex ? 'bg-[#333] text-white' : 'hover:bg-[#2a2a2a] text-[#999]'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] font-bold text-green-500 min-w-[30px]">POST</span>
                        <span className="text-xs truncate">{item.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
              <FileJson size={40} className="text-[#333]" />
              <p className="text-xs text-[#666]">Import a Postman collection JSON to get started.</p>
              <label className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-4 py-2 rounded-md font-medium cursor-pointer transition-colors shadow-lg">
                Import Collection
                <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[#333] bg-[#1c1c1c] flex items-center justify-around text-[#666]">
          <History size={18} className="hover:text-white cursor-pointer" />
          <Settings size={18} className="hover:text-white cursor-pointer" />
          <Trash2 size={18} className="hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedItem ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <RequestEditor 
                item={selectedItem} 
                onSend={() => handleSendRequest(selectedItem)}
                isSending={isSending}
              />
            </div>
            
            {/* Gemini Analysis Button */}
            <div className="p-4 border-t border-[#333] bg-[#212121]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="text-purple-500" size={16} />
                  <span className="text-xs font-bold text-[#aaa] uppercase">Gemini Analysis</span>
                </div>
                <button
                  onClick={() => analyzeRequestWithGemini(selectedItem)}
                  disabled={isLoadingGemini}
                  className={`px-6 py-2 rounded text-white text-sm font-semibold transition-all shadow-lg flex items-center gap-2 ${isLoadingGemini ? 'bg-purple-700 opacity-70' : 'bg-purple-600 hover:bg-purple-700 active:scale-95'}`}
                >
                  {isLoadingGemini ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Analyze with Gemini'
                  )}
                </button>
              </div>
            </div>
            
            {/* Gemini Analysis Results */}
            {geminiResponse && (
              <div className="h-1/3 border-t border-[#333] flex flex-col bg-[#1c1c1c]">
                <div className="px-4 py-2 border-b border-[#333] flex items-center justify-between bg-[#212121]">
                  <div className="flex items-center gap-2">
                    <Brain className="text-purple-500" size={16} />
                    <span className="text-xs font-bold text-[#aaa] uppercase">Gemini Insights</span>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 text-sm">
                  <pre className="text-purple-300 whitespace-pre-wrap">{geminiResponse}</pre>
                </div>
              </div>
            )}
            
            {/* Gemini Error Display */}
            {geminiError && (
              <div className="p-4 border-t border-[#333] bg-[#1c1c1c]">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold">Gemini API Error</span>
                </div>
                <p className="text-xs text-red-400 mt-2">{geminiError}</p>
              </div>
            )}
            
            {/* Response Section */}
            <div className="h-1/3 border-t border-[#333] flex flex-col bg-[#1c1c1c]">
              <div className="px-4 py-2 border-b border-[#333] flex items-center justify-between bg-[#212121]">
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-[#aaa] uppercase">Response</span>
                  {response && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#999]">Status:</span>
                        <span className={`text-[10px] font-bold ${response.status === 200 ? 'text-green-500' : 'text-red-500'}`}>
                          {response.status} OK
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#999]">Time:</span>
                        <span className="text-[10px] font-bold text-green-500">{response.time} ms</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-[10px] text-[#999] hover:text-white px-2 py-1">Pretty</button>
                  <button className="text-[10px] text-[#999] hover:text-white px-2 py-1">Raw</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 code-font text-sm">
                {isSending ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 animate-pulse">
                    <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                    <span className="text-xs text-[#666]">Sending Request...</span>
                  </div>
                ) : response ? (
                  <pre className="text-green-400">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#444]">
                    <Send size={32} className="mb-2 opacity-20" />
                    <p className="text-xs">Enter URL and click Send to get a response</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-[#444]">
            <div className="p-8 rounded-full bg-[#2a2a2a] bg-opacity-30">
              <FileJson size={64} className="opacity-10" />
            </div>
            <h2 className="text-lg font-medium">No request selected</h2>
            <p className="text-sm max-w-xs text-center leading-relaxed">
              Select a request from the sidebar to view details and execute device commands.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
