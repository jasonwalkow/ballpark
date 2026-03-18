const { useState: useHamburgerState } = React;

const HamburgerMenu = ({ currentTool, onToolChange }) => {
  const [isOpen, setIsOpen] = useHamburgerState(false);

  const tools = [
    { id: 'home', name: '🏠 Home', description: 'Back to tool directory' },
    { id: 'icon', name: 'Dot Matrix Icon', description: '16x16 icon generator' },
    { id: 'art', name: 'Dot Matrix Art', description: 'Full image converter' },
    { id: 'pattern', name: 'Dot Pattern Generator', description: 'Generative corner patterns' },
    { id: 'billboard', name: 'Dot Billboard Text', description: 'Scrolling text animation' },
    { id: 'ballparkify', name: 'Baseball Idioms', description: 'Random baseball slang' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded hover:bg-bp-eyeblack transition-colors"
      >
        <svg className="w-3 h-3 text-bp-chalk" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-bp-eyeblack border border-bp-eyeblack/70 rounded shadow-xl z-50 overflow-hidden">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => {
                  onToolChange(tool.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-bp-eyeblack transition-colors border-b border-bp-eyeblack/70 last:border-b-0 ${
                  currentTool === tool.id ? 'bg-bp-eyeblack' : ''
                }`}
              >
                <div className="text-sm text-bp-chalk">{tool.name}</div>
                <div className="text-xs text-bp-chalk mt-0.5">{tool.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

