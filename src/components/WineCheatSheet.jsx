import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const WineCheatSheet = () => {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchWineData = async () => {
      try {
        // Read the CSV file
        const csvData = await window.fs.readFile('winelist.csv', { encoding: 'utf8' });
        
        // Parse CSV to JSON
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            // Transform the data structure to match our app needs
            const transformedWines = results.data.map(wine => ({
              name: wine['WINE NAME'] || '',
              type: wine['WINE COLOR']?.toLowerCase() || '',
              varietal: wine['VARIETAL'] || '',
              sweetness: wine['SWEETNESS'] || '',
              alcohol: wine['ALCOHOL'] || '',
              region: wine['MADE IN'] || '',
              style: wine['SYTLE'] || '', // Note: CSV has a typo in "SYTLE"
              pairings: wine['FOOD PAIRING'] || '',
              description: wine['DESCRIPTION'] || '',
              id: wine['WINE ID'] || ''
            }));
            
            setWines(transformedWines);
            setLoading(false);
          },
          error: (error) => {
            setError('Error parsing CSV: ' + error.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Error loading wine data: ' + err.message);
        setLoading(false);
      }
    };

    fetchWineData();
  }, []);

  // Filter wines based on search term and active tab
  const filteredWines = wines.filter(wine => {
    const matchesSearch = 
      (wine.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (wine.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (wine.region?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (wine.varietal?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && wine.type === activeTab;
  });

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading wine data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-gray-100 min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
          <h2 className="text-lg font-bold mb-2">Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen pb-8">
      <header className="bg-red-900 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">Steak House Wine Guide</h1>
      </header>
      
      <div className="p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search wines..."
            className="w-full p-2 border border-gray-300 rounded shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex mb-4 border-b">
          <button
            className={`flex-1 py-2 font-medium ${activeTab === 'all' ? 'text-red-900 border-b-2 border-red-900' : 'text-gray-600'}`}
            onClick={() => setActiveTab('all')}
          >
            All Wines
          </button>
          <button
            className={`flex-1 py-2 font-medium ${activeTab === 'red' ? 'text-red-900 border-b-2 border-red-900' : 'text-gray-600'}`}
            onClick={() => setActiveTab('red')}
          >
            Red
          </button>
          <button
            className={`flex-1 py-2 font-medium ${activeTab === 'white' ? 'text-red-900 border-b-2 border-red-900' : 'text-gray-600'}`}
            onClick={() => setActiveTab('white')}
          >
            White
          </button>
        </div>
        
        <div className="space-y-4">
          {filteredWines.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No wines found. Try a different search.</p>
          ) : (
            filteredWines.map((wine, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg shadow-md ${wine.type === 'red' ? 'bg-red-50' : 'bg-yellow-50'}`}
              >
                <h2 className="text-lg font-bold">{wine.name}</h2>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="font-medium">Varietal:</span> {wine.varietal}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {wine.type === 'red' ? 'Red' : 'White'}
                  </div>
                  <div>
                    <span className="font-medium">Sweetness:</span> {wine.sweetness}
                  </div>
                  <div>
                    <span className="font-medium">Alcohol:</span> {wine.alcohol}
                  </div>
                  <div>
                    <span className="font-medium">Region:</span> {wine.region}
                  </div>
                  <div>
                    <span className="font-medium">Style:</span> {wine.style}
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Pairs with:</span> {wine.pairings}
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Description:</span> {wine.description}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WineCheatSheet;