import { Send, Bot } from 'lucide-react';

export function Assistant() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen p-4 md:p-6 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">VenueFlow Assistant</h2>
          <p className="text-sm text-text-muted truncate">Ask questions about crowd density, routing, or wait times.</p>
        </div>
      </div>

      <div className="flex-1 bg-surface border border-surface-border rounded-xl p-4 flex flex-col mb-4 overflow-y-auto">
         <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
           <Bot className="w-12 h-12 opacity-20 mb-4" />
           <p>How can I help you manage the venue today?</p>
         </div>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 -top-12 flex gap-2 overflow-x-auto pb-4 no-scrollbar px-1 hide-scrollbar">
           {["Where is the most congested gate?", "Predict waiting time for Gate C", "Show me an alternate route"].map(q => (
             <button key={q} className="whitespace-nowrap px-4 py-1.5 rounded-full bg-surface border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors hover:border-text-muted">
               {q}
             </button>
           ))}
        </div>
        <div className="relative flex items-center">
          <input 
            type="text" 
            placeholder="Ask Gemini..." 
            className="w-full bg-surface border border-surface-border rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted"
            disabled
          />
          <button className="absolute right-1.5 w-9 h-9 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent-hover transition-colors shadow-sm">
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
