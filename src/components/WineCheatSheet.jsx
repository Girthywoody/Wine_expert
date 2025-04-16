import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const WineCheatSheet = () => {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedVarietals, setExpandedVarietals] = useState({});
  const [selectedPairing, setSelectedPairing] = useState('');
  const [pairingSearchTerm, setPairingSearchTerm] = useState('');
  
  // Common food pairings for the dropdown
  const commonPairings = [
    "beef", "bison", "blue cheese", "burgers", "brie", "calamari",
    "chicken", "desserts", "escargot", "filet", "fish", "fresh salads", 
    "garlic bread", "goat cheese", "lamb", "lobster", "mussels", 
    "mushrooms", "oysters", "pad thai", "parmesan chicken", "pasta", 
    "ribs", "salmon", "scallops", "seafood", "shrimp", "sirloin", 
    "steak", "steamed fish"
  ];

  // Filter pairings based on search term
  const filteredPairings = commonPairings.filter(pairing => 
    pairing.toLowerCase().includes(pairingSearchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchWineData = async () => {
      try {
        // Read the CSV file
        const csvData = await fetch('winelist.csv')
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch CSV file');
            }
            return response.text();
          });
        
        // Parse CSV to JSON
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            // Transform the data structure to match our app needs
            const transformedWines = results.data.map(wine => ({
              name: wine['WINE NAME'] || '',
              type: (wine['WINE COLOR'] || '').toLowerCase(),
              varietal: wine['VARIETAL'] || '',
              sweetness: wine['SWEETNESS'] || '',
              alcohol: wine['ALCOHOL'] || '',
              region: wine['MADE IN'] || '',
              style: wine['SYTLE'] || '', // Note: CSV has a typo in "SYTLE"
              pairings: wine['FOOD PAIRING'] || '',
              description: wine['DESCRIPTION'] || ''
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

  // Filter wines based on search term, active tab, and selected pairing
  const filteredWines = wines.filter(wine => {
    const matchesSearch = 
      (wine.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (wine.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (wine.region?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (wine.varietal?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesPairing = !selectedPairing || 
      (wine.pairings?.toLowerCase() || '').includes(selectedPairing.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch && matchesPairing;
    return matchesSearch && matchesPairing && wine.type === activeTab;
  });
  
  // First separate by type, then group by varietal
  const winesByType = {
    red: [],
    white: []
  };
  
  // Group wines by type
  filteredWines.forEach(wine => {
    const type = wine.type === 'red' ? 'red' : 'white';
    winesByType[type].push(wine);
  });
  
  // Then group by varietal within each type
  const redWinesByVarietal = {};
  const whiteWinesByVarietal = {};
  
  winesByType.red.forEach(wine => {
    const varietal = wine.varietal || 'Other';
    if (!redWinesByVarietal[varietal]) {
      redWinesByVarietal[varietal] = [];
    }
    redWinesByVarietal[varietal].push(wine);
  });
  
  winesByType.white.forEach(wine => {
    const varietal = wine.varietal || 'Other';
    if (!whiteWinesByVarietal[varietal]) {
      whiteWinesByVarietal[varietal] = [];
    }
    whiteWinesByVarietal[varietal].push(wine);
  });
  
  // Sort varietals alphabetically
  const sortedRedVarietals = Object.keys(redWinesByVarietal).sort();
  const sortedWhiteVarietals = Object.keys(whiteWinesByVarietal).sort();
  
  // Effect to handle auto-expansion of varietals based on search term or selected pairing
  useEffect(() => {
    // Create a new expanded state object
    let newExpandedState = {};
    
    if (searchTerm.trim() !== '' || selectedPairing !== '') {
      // Expand varietals with matching wines (either by search or pairing)
      sortedRedVarietals.forEach(varietal => {
        const hasMatchingWine = redWinesByVarietal[varietal].some(wine => {
          const matchesSearch = searchTerm.trim() === '' || 
            (wine.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (wine.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (wine.region?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (wine.varietal?.toLowerCase() || '').includes(searchTerm.toLowerCase());
          
          const matchesPairing = selectedPairing === '' || 
            (wine.pairings?.toLowerCase() || '').includes(selectedPairing.toLowerCase());
          
          return matchesSearch && matchesPairing;
        });
        
        if (hasMatchingWine) {
          newExpandedState[varietal] = true;
        }
      });
      
      sortedWhiteVarietals.forEach(varietal => {
        const hasMatchingWine = whiteWinesByVarietal[varietal].some(wine => {
          const matchesSearch = searchTerm.trim() === '' || 
            (wine.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (wine.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (wine.region?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (wine.varietal?.toLowerCase() || '').includes(searchTerm.toLowerCase());
          
          const matchesPairing = selectedPairing === '' || 
            (wine.pairings?.toLowerCase() || '').includes(selectedPairing.toLowerCase());
          
          return matchesSearch && matchesPairing;
        });
        
        if (hasMatchingWine) {
          newExpandedState[varietal] = true;
        }
      });
      
      // Only update the state if we have varietals to expand
      if (Object.keys(newExpandedState).length > 0) {
        setExpandedVarietals(prev => ({...prev, ...newExpandedState}));
      }
    }
  }, [searchTerm, selectedPairing, sortedRedVarietals, sortedWhiteVarietals]);

  // Handle search term changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

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
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="pairingFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Food Pairing
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search pairings..."
              className="w-full p-2 border border-gray-300 rounded-t shadow-sm"
              value={pairingSearchTerm}
              onChange={(e) => setPairingSearchTerm(e.target.value)}
            />
            <select
              id="pairingFilter"
              className="w-full p-2 border border-gray-300 rounded-b shadow-sm bg-white"
              value={selectedPairing}
              onChange={(e) => setSelectedPairing(e.target.value)}
            >
              <option value="">All Pairings</option>
              {filteredPairings.map((pairing) => (
                <option key={pairing} value={pairing}>
                  {pairing.charAt(0).toUpperCase() + pairing.slice(1)}
                </option>
              ))}
            </select>
          </div>
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
        
        <div className="space-y-6">
          {filteredWines.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No wines found. Try a different search.</p>
          ) : (
            <>
              {/* Only show Red Wine section if we have red wines and not filtering to white only */}
              {sortedRedVarietals.length > 0 && activeTab !== 'white' && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4 bg-red-700 text-white p-2 rounded-md">Red Wines</h2>
                  
                  <div className="space-y-4 pl-2">
                    {sortedRedVarietals.map(varietal => (
                      <div key={varietal} className="space-y-4">
                        <div 
                          className="sticky top-0 z-10 p-2 font-bold text-lg bg-red-100 rounded-md shadow-sm cursor-pointer flex justify-between items-center"
                          onClick={() => setExpandedVarietals(prev => ({...prev, [varietal]: !prev[varietal]}))}
                        >
                          <span>{varietal} ({redWinesByVarietal[varietal].length})</span>
                          <span className="text-gray-700">
                            {expandedVarietals[varietal] ? '▼' : '▶'}
                          </span>
                        </div>
                        
                        {expandedVarietals[varietal] && redWinesByVarietal[varietal].map((wine, index) => (
                          <div 
                            key={index} 
                            className="p-4 rounded-lg shadow-md bg-red-50"
                          >
                            <h2 className="text-lg font-bold">{wine.name}</h2>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
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
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Only show White Wine section if we have white wines and not filtering to red only */}
              {sortedWhiteVarietals.length > 0 && activeTab !== 'red' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 bg-yellow-600 text-white p-2 rounded-md">White Wines</h2>
                  
                  <div className="space-y-4 pl-2">
                    {sortedWhiteVarietals.map(varietal => (
                      <div key={varietal} className="space-y-4">
                        <div 
                          className="sticky top-0 z-10 p-2 font-bold text-lg bg-yellow-100 rounded-md shadow-sm cursor-pointer flex justify-between items-center"
                          onClick={() => setExpandedVarietals(prev => ({...prev, [varietal]: !prev[varietal]}))}
                        >
                          <span>{varietal} ({whiteWinesByVarietal[varietal].length})</span>
                          <span className="text-gray-700">
                            {expandedVarietals[varietal] ? '▼' : '▶'}
                          </span>
                        </div>
                        
                        {expandedVarietals[varietal] && whiteWinesByVarietal[varietal].map((wine, index) => (
                          <div 
                            key={index} 
                            className="p-4 rounded-lg shadow-md bg-yellow-50"
                          >
                            <h2 className="text-lg font-bold">{wine.name}</h2>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
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
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WineCheatSheet;