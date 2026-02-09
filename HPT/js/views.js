/**
            * @description The landing page view, showing suggestions, search history, favorites, or the main search result.
            * @param {object} props - Contains data and handlers for the home page.
            */
            
            const HomePage = ({ errorMessage, randomSuggestions, searchHistory, handleNuclideSelection, handleClearHistory, favorites, radionuclides, handleClearFavorites, onNavClick }) => {
            const [isFavoritesModalOpen, setIsFavoritesModalOpen] = React.useState(false);
            const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
            
            // --- NEW: State to track if the welcome banner was manually dismissed ---
            const [isBannerDismissed, setIsBannerDismissed] = React.useState(() => {
            return localStorage.getItem('rad_tool_welcome_dismissed') === 'true';
            });
            
            const handleDismissBanner = () => {
            setIsBannerDismissed(true);
            localStorage.setItem('rad_tool_welcome_dismissed', 'true');
            };
            
            const favoriteNuclides = React.useMemo(() =>
            favorites.map(symbol => radionuclides.find(n => n.symbol === symbol)).filter(Boolean),
            [favorites, radionuclides]
            );
            
            const searchHistoryNuclides = React.useMemo(() =>
            searchHistory.map(symbol => radionuclides.find(n => n.symbol === symbol)).filter(Boolean),
            [searchHistory, radionuclides]
            );
            
            const confirmClearFavorites = () => {
            handleClearFavorites();
            setIsFavoritesModalOpen(false);
            };
            
            const confirmClearHistory = () => {
            handleClearHistory();
            setIsHistoryModalOpen(false);
            };
            
            // --- Hide if user has history OR if they manually dismissed it ---
            const isNewUser = favoriteNuclides.length === 0 && searchHistoryNuclides.length === 0 && !isBannerDismissed;
            
            return (
            <div className="p-4 sm:p-6 space-y-6">
               {errorMessage && (
                   <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                       <p className="font-bold">Error</p><p>{errorMessage}</p>
                   </div>
               )}
            
               {/* --- Educational Welcome Banner --- */}
               {isNewUser && (
                   <div className="relative bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 border-l-8 border-l-sky-500 animate-fade-in group">
                       
                       {/* NEW: Close Button */}
                       <button 
                           onClick={handleDismissBanner}
                           className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                           title="Dismiss Welcome Message"
                       >
                           <Icon path={ICONS.clear} className="w-5 h-5" />
                       </button>
            
                       <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 pr-8">Welcome to the Health Physics Toolbox</h2>
                       <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-3xl">
                           This is a unified platform for radiological calculations. Data flows automatically from the database to the tools, saving you time and reducing manual entry errors.
                       </p>
            
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {/* Feature 1: Database */}
                           <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                                   <div className="p-2 bg-sky-50 dark:bg-sky-900/30 rounded-lg">
                                       <Icon path={ICONS.database} className="w-6 h-6" />
                                   </div>
                                   <h3 className="font-bold text-lg">Robust Database</h3>
                               </div>
                               <p className="text-sm text-slate-600 dark:text-slate-400">
                                   Access detailed decay properties, gamma constants, and regulatory limits (10 CFR 20, DOT) for over 100 radionuclides. Start by searching above.
                               </p>
                           </div>
            
                           {/* Feature 2: Smart Calculators */}
                           <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                   <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                       <Icon path={ICONS.calculator} className="w-6 h-6" />
                                   </div>
                                   <h3 className="font-bold text-lg">Integrated Math</h3>
                               </div>
                               <p className="text-sm text-slate-600 dark:text-slate-400">
                                   Select a nuclide to pre-fill standard values into shielding, decay, and dose rate calculators. No more looking up half-lives manually.
                               </p>
                           </div>
            
                           {/* Feature 3: Operational Tools */}
                           <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                   <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                       <Icon path={ICONS.shield} className="w-6 h-6" />
                                   </div>
                                   <h3 className="font-bold text-lg">Field Ready</h3>
                               </div>
                               <p className="text-sm text-slate-600 dark:text-slate-400">
                                   Plan MARSSIM surveys, determine shipping labels, or calculate patient release criteria with tools designed for operational health physics.
                               </p>
                           </div>
                       </div>
                   </div>
               )}
            
               {/* --- 1. FAVORITES --- */}
            {favoriteNuclides.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
               <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 text-left">Your Favorites</h4>
               <button onClick={() => setIsFavoritesModalOpen(true)} className="text-xs text-sky-600 dark:text-sky-400 hover:underline focus:outline-none">
                   Clear Favorites
               </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {favoriteNuclides.map(n => (
                   <NuclideCard
                       key={n.symbol}
                       nuclide={n}
                       isCompact={true}
                       // Pass true to skip adding this to search history again
                       onNuclideClick={(n) => handleNuclideSelection(n, true)}
                   />
               ))}
            </div>
            </div>
            )}
            
            {/* --- 2. RECENT SEARCHES --- */}
            {searchHistoryNuclides.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
               <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 text-left">Recent Searches</h4>
            
               <button onClick={() => setIsHistoryModalOpen(true)} className="text-xs text-sky-600 dark:text-sky-400 hover:underline focus:outline-none">
                   Clear Searches
               </button>
            
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {searchHistoryNuclides.map(n => (
                   <NuclideCard
                       key={n.symbol}
                       nuclide={n}
                       isCompact={true}
                       // Pass true here too
                       onNuclideClick={(n) => handleNuclideSelection(n, true)}
                   />
               ))}
            </div>
            </div>
            )}
            
               {/* --- 3. RECENT CALCULATIONS --- */}
               <CalculationHistoryPanel onNavClick={onNavClick} />
            
               {/* --- 4. QUICK SUGGESTIONS --- */}
               <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-xl">
                   <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 text-left">Quick Suggestions</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                       {randomSuggestions.map(n => (
                           <NuclideCard
                               key={n.symbol}
                               nuclide={n}
                               isCompact={true}
                               onNuclideClick={handleNuclideSelection}
                           />
                       ))}
                   </div>
               </div>
            
               <ConfirmationModal
                   isOpen={isFavoritesModalOpen}
                   onClose={() => setIsFavoritesModalOpen(false)}
                   onConfirm={confirmClearFavorites}
                   title="Clear All Favorites"
               >
                   <p>Are you sure you want to clear your entire list of favorites? This action cannot be undone.</p>
               </ConfirmationModal>
            
               <ConfirmationModal
                   isOpen={isHistoryModalOpen}
                   onClose={() => setIsHistoryModalOpen(false)}
                   onConfirm={confirmClearHistory}
                   title="Clear Search History"
               >
                   <p>Are you sure you want to clear your recent search history?</p>
               </ConfirmationModal>
            
            </div>
            );
            };
            
            /**
            * @description A robust note-taking component with Markdown preview support.
            * * @param {{notes: string, setNotes: (notes: string) => void}} props
            */
            const Scratchpad = ({ notes, setNotes }) => {
            const [isClearModalOpen, setIsClearModalOpen] = React.useState(false);
            const [viewMode, setViewMode] = React.useState('edit'); // 'edit' or 'preview'
            const { addToast } = useToast();
            
            const handleCopyAll = () => {
            if (notes) {
            navigator.clipboard.writeText(notes);
            addToast('Notes copied to clipboard!');
            }
            };
            
            const handleExport = () => {
            // Reference the 'notes' prop/state, not 'filteredList'
            if (!notes || notes.trim() === '') {
            addToast("Nothing to save!");
            return;
            }
            
            const blob = new Blob([notes], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `scratchpad_notes_${new Date().toISOString().slice(0,10)}.txt`; // Add a timestamp to the filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Clean up the created URL
            };
            
            const handleInsertTimestamp = () => {
            const timestamp = new Date().toLocaleString();
            setNotes(prev => prev + `\n**[${timestamp}]**\n`);
            addToast('Timestamp inserted!');
            };
            
            const handleConfirmClear = () => {
            setNotes('');
            setIsClearModalOpen(false);
            addToast('Scratchpad cleared.');
            };
            
            // Stats
            const characterCount = notes.replace(/\s/g, '').length; // Count non-whitespace chars
            const wordCount = notes.trim() === '' ? 0 : notes.trim().split(/\s+/).filter(Boolean).length;
            
            // Simple Markdown Parser (for Preview)
            const renderMarkdown = (text) => {
            if (!text) return <p className="text-slate-400 italic">Nothing to preview...</p>;
            
            return text.split('\n').map((line, i) => {
            // Headers
            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-2 mb-1">{line.slice(4)}</h3>;
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-3 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">{line.slice(3)}</h2>;
            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-extrabold mt-4 mb-2">{line.slice(2)}</h1>;
            
            // Lists
            if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
            
            // Bold (Simple regex for **text**)
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={i} className="min-h-[1.2em] mb-1">
                  {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                  })}
              </p>
            );
            });
            };
            
            return (
            <>
            <div className="flex justify-between items-end mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                  Auto-saved to local storage. Supports basic Markdown.
              </p>
              {/* View Toggle */}
              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                  <button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-slate-600 shadow text-sky-600' : 'text-slate-500'}`}>Edit</button>
                  <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-slate-600 shadow text-sky-600' : 'text-slate-500'}`}>Preview</button>
              </div>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-t-md border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap items-center gap-2">
              <button onClick={handleInsertTimestamp} className="px-3 py-1.5 text-xs bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded hover:bg-slate-50 dark:hover:bg-slate-500 transition font-medium flex items-center gap-1">
                  <Icon path={ICONS.stopwatch} className="w-3 h-3" /> Timestamp
              </button>
              <button onClick={handleCopyAll} className="px-3 py-1.5 text-xs bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded hover:bg-slate-50 dark:hover:bg-slate-500 transition font-medium flex items-center gap-1">
                  <Icon path={ICONS.copy} className="w-3 h-3" /> Copy
              </button>
              <button onClick={handleExport} className="px-3 py-1.5 text-xs bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded hover:bg-slate-50 dark:hover:bg-slate-500 transition font-medium flex items-center gap-1">
                  <Icon path={ICONS.database} className="w-3 h-3" /> Save .txt
              </button>
              <div className="flex-grow"></div>
              <button onClick={() => setIsClearModalOpen(true)} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 px-2">
                  <Icon path={ICONS.clear} className="w-3 h-3"/> Clear
              </button>
            </div>
            
            {viewMode === 'edit' ? (
              <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="# Project Notes\n- Alpha survey complete\n- Background: 50 cpm"
                  className="w-full h-96 p-4 rounded-b-md bg-white dark:bg-slate-900 font-mono text-sm border-x border-b border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
              />
            ) : (
              <div className="w-full h-96 p-6 rounded-b-md bg-white dark:bg-slate-900 overflow-y-auto border-x border-b border-slate-200 dark:border-slate-700 prose dark:prose-invert max-w-none text-sm">
                  {renderMarkdown(notes)}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-[10px] text-slate-400">Markdown supported: # Header, **Bold**, - List</span>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span className="font-bold">{wordCount}</span> words <span className="mx-1 opacity-30">|</span> <span className="font-bold">{characterCount}</span> chars
              </div>
            </div>
            
            <ConfirmationModal
              isOpen={isClearModalOpen}
              onClose={() => setIsClearModalOpen(false)}
              onConfirm={handleConfirmClear}
              title="Clear Scratchpad?"
            >
              <p>Are you sure you want to delete all notes? This cannot be undone.</p>
            </ConfirmationModal>
            </>
            );
            };
                        
            /**
            * @description React component that serves as a static page for external links and references.
            * This component provides a curated list of authoritative resources relevant to the application's
            * domain, such as health physics, radiation safety, and nuclear data.
            *
            * It is a pure presentation component that renders a pre-defined array of links,
            * categorized for easy navigation. The links are grouped into sections for:
            * 1.  **Regulatory & Guidance:** Official documents from government agencies like the NRC and DOT.
            * 2.  **Data & Tools:** Databases and software from sources like NNDC and EPA.
            * 3.  **Professional Organizations:** Websites for key professional societies and international bodies.
            *
            * This component is intended to provide users with quick access to the foundational
            * knowledge and external data sources that underpin the calculations and information in the app.
            */
            
            const ReferencesPage = ({ onNavClick, previousView }) => {
            const referenceLinks = [
            {
            category: 'Regulatory & Guidance',
            items: [
              { title: '10 CFR Part 20', url: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part020/', description: 'Standards for Protection Against Radiation (US NRC).' },
              { title: '49 CFR Part 173', url: 'https://www.ecfr.gov/current/title-49/subtitle-B/chapter-I/subchapter-C/part-173', description: 'DOT Regulations for shipping hazardous materials (Class 7).' },
              { title: 'NUREG-1556 Series', url: 'https://www.nrc.gov/reading-rm/doc-collections/nuregs/staff/sr1556/index.html', description: 'Consolidated Guidance About Materials Licenses.' },
              { title: 'MARSSIM', url: 'https://www.nrc.gov/reading-rm/doc-collections/nuregs/staff/sr1575/index.html', description: 'Multi-Agency Radiation Survey and Site Investigation Manual.' },
            ]
            },
            {
            category: 'Data & Tools',
            items: [
              { title: 'NNDC NuDat 3', url: 'https://www.nndc.bnl.gov/nudat3/', description: 'Authoritative nuclear structure and decay data.' },
              { title: 'NIST XCOM', url: 'https://physics.nist.gov/PhysRefData/Xcom/html/xcom1.html', description: 'Photon Cross Sections Database (Attenuation Coefficients).' },
              { title: 'Rad Pro Calculator', url: 'http://www.radprocalculator.com/', description: 'Comprehensive online health physics calculations.' },
              { title: 'EPA Radiation', url: 'https://www.epa.gov/radiation', description: 'US EPA radiation protection information and resources.' },
              { title: 'Plexus-NSD', url: 'http://www.iem-inc.com/information/tools/gamma-ray-dose-constants', description: 'Source for Specific Gamma Ray Constants.' },
              { title: 'REMM', url: 'https://remm.hhs.gov/', description: 'Radiation Emergency Medical Management (HHS).' },
            ]
            },
            {
            category: 'Professional Organizations',
            items: [
              { title: 'Health Physics Society (HPS)', url: 'https://hps.org/', description: 'Scientific organization of radiation safety professionals.' },
              { title: 'AAPM', url: 'https://www.aapm.org/', description: 'American Association of Physicists in Medicine.' },
              { title: 'IAEA', url: 'https://www.iaea.org/', description: 'International Atomic Energy Agency.' },
            ]
            }
            ];
            
            // Helper to determine button text
            // If previousView is null, undefined, or 'home', label it "Back Home". Otherwise just "Back".
            const backLabel = (!previousView || previousView === 'home') ? 'Back Home' : 'Back';
            
            return (
            <div className="p-4 animate-fade-in">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Links & References</h2>
                  <button
                      onClick={() => onNavClick(previousView || 'home')}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center gap-2 text-sm font-semibold"
                  >
                      <Icon path={ICONS.home} className="w-4 h-4" />
                      {backLabel}
                  </button>
              </div>
              <div className="space-y-6">
                  {referenceLinks.map(section => (
                      <div key={section.category}>
                          <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400 border-b border-slate-300 dark:border-slate-600 pb-2 mb-3">{section.category}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {section.items.map(item => (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" key={item.title} className="block p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-md transition-all group">
                                      <div className="flex justify-between items-start">
                                          <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{item.title}</p>
                                          <span className="text-slate-300 group-hover:text-sky-400">↗</span>
                                      </div>
                                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                                  </a>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
            </div>
            </div>
            );
            };

            /**
            * @description A sidebar for filtering and sorting the nuclide database. It is responsive.
            * @param {{filterProps: object, isFiltersVisible: boolean, setIsFiltersVisible: (isVisible: boolean) => void, handleClearFilters: () => void}} props
            */
            
            const FilterSidebar = ({ filterProps, isFiltersVisible, setIsFiltersVisible, scrollPositionRef, handleClearFilters }) => {
            
            const {
            sortBy, setSortBy, sortOrder, setSortOrder,
            selectedCategory, setSelectedCategory, allCategories,
            selectedEmissionType, setSelectedEmissionType, allEmissionTypes,
            selectedCommonality, setSelectedCommonality, allCommonalityCategories,
            minAlphaEnergy, setMinAlphaEnergy, maxAlphaEnergy, setMaxAlphaEnergy,
            minBetaEnergy, setMinBetaEnergy, maxBetaEnergy, setMaxBetaEnergy,
            minGammaEnergy, setMinGammaEnergy, maxGammaEnergy, setMaxGammaEnergy,
            minHalfLife, setMinHalfLife, maxHalfLife, setMaxHalfLife, halfLifeFilterUnit, setHalfLifeFilterUnit
            } = filterProps;
            
            const handleClose = () => {
            setIsFiltersVisible(false);
            setTimeout(() => {
                window.scrollTo({
                    top: scrollPositionRef.current,
                    behavior: 'smooth'
                });
            }, 300);
            };
            
            return (
            <>
                <div
                    className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${isFiltersVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={handleClose}
                    aria-hidden="true">
                </div>
            
                <aside
                    className={`fixed top-0 left-0 w-80 h-full bg-slate-50 dark:bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:w-auto lg:h-auto lg:transform-none lg:col-span-1 ${
                        isFiltersVisible ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="p-4 space-y-4 h-full overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-600 pb-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Filters & Sorting</h3>
                            <div className="flex items-center gap-2">
            
                                <button
                                    onClick={handleClearFilters}
                                    className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-sky-700 dark:text-sky-300 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                    <Icon path={ICONS.clear} className="w-4 h-4" />
                                    Clear All
                                </button>
                                <button onClick={handleClose} className="lg:hidden p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                                    <Icon path={ICONS.clear} className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
            
                        {/* Sorting controls */}
            
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Sort by</label>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                                <option value="name">Name</option>
                                <option value="halfLife">Half-life</option>
                                <option value="alphaEnergy">Alpha Energy</option>
                                <option value="betaEnergy">Beta Energy</option>
                                <option value="gammaEnergy">Gamma Energy</option>
                            </select>
                            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
            
                        {/* Filtering controls */}
            
                        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label><select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">{allCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Emission Type</label><select value={selectedEmissionType} onChange={e => setSelectedEmissionType(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">{allEmissionTypes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Commonality</label><select value={selectedCommonality} onChange={e => setSelectedCommonality(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">{allCommonalityCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            
                        {/* Half-life range filter */}
            
                        <div>
                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mt-4">Half-life</h4>
                            <div className="flex gap-2 mt-2">
                                <input type="number" placeholder="Min" value={minHalfLife} onChange={e => setMinHalfLife(e.target.value)} className="w-full p-1 rounded-md text-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                                <input type="number" placeholder="Max" value={maxHalfLife} onChange={e => setMaxHalfLife(e.target.value)} className="w-full p-1 rounded-md text-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                            </div>
                            <select value={halfLifeFilterUnit} onChange={e => setHalfLifeFilterUnit(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                                <option value="seconds">Seconds</option>
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                                <option value="years">Years</option>
                            </select>
                        </div>
            
                        {/* Energy range filters */}
            
                        <div>
                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mt-4">Energy (MeV)</h4>
                            <div className="space-y-2 mt-2">
                                <label className="text-sm">Alpha</label><div className="flex gap-2"><input type="number" placeholder="Min" value={minAlphaEnergy} onChange={e => setMinAlphaEnergy(e.target.value)} className="w-full p-1 rounded-md text-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" /><input type="number" placeholder="Max" value={maxAlphaEnergy} onChange={e => setMaxAlphaEnergy(e.target.value)} className="w-full p-1 rounded-md text-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" /></div>
                                <label className="text-sm">Beta</label><div className="flex gap-2"><input type="number" placeholder="Min" value={minBetaEnergy} onChange={e => setMinBetaEnergy(e.target.value)} className="w-full p-1 rounded-md text-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" /><input type="number" placeholder="Max" value={maxBetaEnergy} onChange={e => setMaxBetaEnergy(e.target.value)} className="w-full p-1 rounded-md text-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" /></div>
                                <label className="text-sm">Gamma</label><div className="flex gap-2"><input type="number" placeholder="Min" value={minGammaEnergy} onChange={e => setMinGammaEnergy(e.target.value)} className="w-full p-1 rounded-md text-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" /><input type="number" placeholder="Max" value={maxGammaEnergy} onChange={e => setMaxGammaEnergy(e.target.value)} className="w-full p-1 rounded-md text-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" /></div>
                            </div>
                        </div>
                    </div>
                </aside>
            </>
            );
            };
            
            /**
            * @description The main view for Browse the entire database with filters.
            * @param {object} props - Component props.
            */
            
            const DatabaseView = ({ filteredList, filterProps, onNuclideClick, isFiltersVisible, setIsFiltersVisible, scrollPositionRef, handleClearFilters }) => {
            const { selectedCategory, setSelectedCategory } = filterProps;
            
            // Export Function
            const handleExport = () => {
            if (!filteredList || filteredList.length === 0) return;
            
            const headers = ['Name', 'Symbol', 'Category', 'Half-Life', 'Decay Constant', 'Specific Activity', 'Gamma Constant', 'Emissions'];
            const csvRows = [headers.join(',')];
            
            filteredList.forEach(n => {
            // sanitize text to prevent CSV breakages
            const name = `"${n.name}"`;
            const emissions = `"${(n.emissionType || []).join('; ')}"`;
            const row = [
              name,
              n.symbol,
              n.category,
              n.halfLife,
              n.decayConstant,
              n.specificActivity || 'N/A',
              n.gammaConstant || 'N/A',
              emissions
            ];
            csvRows.push(row.join(','));
            });
            
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'nuclide_database_export.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            };
            
            return (
            <div className="relative">
            <div className="px-4 pt-4 lg:hidden">
               <button
                   onClick={() => {
                       scrollPositionRef.current = window.scrollY;
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                       setIsFiltersVisible(true);
                   }}
                   className="w-full flex items-center justify-center gap-2 p-3 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
               >
                   <Icon path={ICONS.filter} className="w-5 h-5" /> Filters & Sorting
               </button>
            </div>
            
            <div className="grid lg:grid-cols-4 gap-4 p-4">
            
               <FilterSidebar
                   filterProps={filterProps}
                   isFiltersVisible={isFiltersVisible}
                   setIsFiltersVisible={setIsFiltersVisible}
                   scrollPositionRef={scrollPositionRef}
                   handleClearFilters={handleClearFilters}
               />
            
               <div className="col-span-4 lg:col-span-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 h-[calc(100vh-350px)] md:h-[calc(100vh-320px)] lg:h-auto overflow-y-auto">
            
                   <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                       <div className="flex items-center gap-3">
                           <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                               {filteredList.length} Results
                           </p>
                           {filteredList.length > 0 && (
                               <button onClick={handleExport} className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                                   <Icon path={ICONS.database} className="w-3 h-3" /> Export CSV
                               </button>
                           )}
                       </div>
            
                       <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                           {Object.entries(CATEGORY_STYLES).filter(([key]) => key !== 'default').map(([category, styles]) => {
                               const bgColor = styles.border.replace('border-l-', 'bg-');
                               const isActive = selectedCategory === category;
                               return (
                                    <Tooltip key={category} text={CATEGORY_DESCRIPTIONS[category] || ''} widthClass="w-64">
                                       <button
                                           onClick={() => setSelectedCategory(prev => prev === category ? 'All' : category)}
                                           className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 ${isActive ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-800 ring-sky-500 bg-white dark:bg-slate-700' : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700'}`}
                                       >
                                           <div className={`w-3 h-3 rounded-full ${bgColor}`}></div>
                                           <span className="text-slate-600 dark:text-slate-300">{category.replace('/', '/ ')}</span>
                                       </button>
                                    </Tooltip>
                               );
                           })}
            
                           <button
                               onClick={() => setSelectedCategory('All')}
                               className={`px-2 py-1 rounded-full transition-all duration-200 text-slate-600 dark:text-slate-300 ${selectedCategory === 'All' ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-800 ring-slate-500 bg-white dark:bg-slate-700' : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700'}`}
                           >
                               Show All
                           </button>
                       </div>
                   </div>
            
                   <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                       {filteredList.length > 0 ? (
                           filteredList.map(n => <NuclideCard key={n.symbol} nuclide={n} isCompact={true} onNuclideClick={onNuclideClick} />)
                       ) : (
                           <div className="col-span-full text-center py-16 px-4">
                               <Icon path={ICONS.search} className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
                               <h3 className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-300">No Results Found</h3>
                               <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting your filter criteria.</p>
                               <button
                                   onClick={handleClearFilters}
                                   className="mt-4 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition"
                               >
                                   Clear All Filters
                               </button>
                           </div>
                       )}
                   </div>
               </div>
            </div>
            </div>
            );
            };
            
            /**
             * @description A component that provides a user interface for converting between
             * various radiological and physical units, such as activity, dose, and energy.
             */
            
            const UnitConverter = () => {
            const { addHistory } = useCalculationHistory();
            const { addToast } = useToast();
            
            // --- 1. DEFINITIONS (Unchanged) ---
            const CATEGORIES = {
            'Activity': { base: 'Bq', units: { 'Bq': 1, 'kBq': 1e3, 'MBq': 1e6, 'GBq': 1e9, 'TBq': 1e12, 'Ci': 3.7e10, 'mCi': 3.7e7, 'µCi': 37000, 'nCi': 37, 'pCi': 0.037, 'dpm': 1/60, 'dps': 1 } },
            'Dose Equivalent': { base: 'Sv', units: { 'Sv': 1, 'mSv': 1e-3, 'µSv': 1e-6, 'rem': 0.01, 'mrem': 1e-5, 'µrem': 1e-8 } },
            'Absorbed Dose': { base: 'Gy', units: { 'Gy': 1, 'mGy': 1e-3, 'µGy': 1e-6, 'rad': 0.01, 'mrad': 1e-5 } },
            'Exposure': { base: 'C/kg', units: { 'C/kg': 1, 'R': 2.58e-4, 'mR': 2.58e-7, 'µR': 2.58e-10 } },
            'Contamination': { base: 'Bq/cm²', units: { 'Bq/cm²': 1, 'kBq/m²': 0.1, 'dpm/100cm²': 1/6000, 'µCi/cm²': 37000, 'µCi/m²': 3.7, 'pCi/100cm²': 0.037/100 } },
            'Length': { base: 'm', units: { 'm': 1, 'cm': 0.01, 'mm': 0.001, 'µm': 1e-6, 'in': 0.0254, 'ft': 0.3048, 'yd': 0.9144, 'mi': 1609.34 } },
            'Mass': { base: 'g', units: { 'g': 1, 'kg': 1000, 'mg': 1e-3, 'µg': 1e-6, 'lb': 453.592, 'oz': 28.3495 } },
            'Time': { base: 's', units: { 's': 1, 'min': 60, 'hr': 3600, 'day': 86400, 'yr': 31557600 } }
            };
            
            // --- 2. STATE ---
            const [category, setCategory] = React.useState('Activity');
            const [fromVal, setFromVal] = React.useState('1');
            const [fromUnit, setFromUnit] = React.useState('Ci');
            const [toUnit, setToUnit] = React.useState('GBq');
            
            // Auto-update units when category changes
            React.useEffect(() => {
            const units = Object.keys(CATEGORIES[category].units);
            if (category === 'Activity') { setFromUnit('Ci'); setToUnit('GBq'); }
            else if (category === 'Dose Equivalent') { setFromUnit('mrem'); setToUnit('µSv'); }
            else if (category === 'Contamination') { setFromUnit('dpm/100cm²'); setToUnit('Bq/cm²'); }
            else { setFromUnit(units[0]); setToUnit(units[1] || units[0]); }
            }, [category]);
            
            // --- 3. CALCULATION ---
            const result = React.useMemo(() => {
            const val = safeParseFloat(fromVal);
            if (isNaN(val)) return '---';
            const catData = CATEGORIES[category];
            const baseFactorFrom = catData.units[fromUnit];
            const baseFactorTo = catData.units[toUnit];
            if (!baseFactorFrom || !baseFactorTo) return '---';
            const inBase = val * baseFactorFrom;
            const final = inBase / baseFactorTo;
            if (final === 0) return '0';
            if (Math.abs(final) < 1e-3 || Math.abs(final) > 1e6) return final.toExponential(4);
            return safeParseFloat(final.toPrecision(6)).toString();
            }, [category, fromVal, fromUnit, toUnit]);
            
            const factorDisplay = React.useMemo(() => {
            const catData = CATEGORIES[category];
            const baseFactorFrom = catData.units[fromUnit];
            const baseFactorTo = catData.units[toUnit];
            if (!baseFactorFrom || !baseFactorTo) return null;
            const factor = baseFactorFrom / baseFactorTo;
            return `1 ${fromUnit} ≈ ${factor < 1e-3 || factor > 1e4 ? factor.toExponential(3) : safeParseFloat(factor.toPrecision(4))} ${toUnit}`;
            }, [category, fromUnit, toUnit]);
            
            // --- 4. HANDLERS ---
            const handleSwap = () => {
            setFromUnit(toUnit);
            setToUnit(fromUnit);
            };
            
            const handleSave = () => {
            if (result !== '---') {
            addHistory({ id: Date.now(), type: 'Conversion', icon: ICONS.converter, inputs: `${fromVal} ${fromUnit}`, result: `${result} ${toUnit}`, view: VIEWS.CONVERTER });
            addToast("Saved to history!");
            }
            };
            
            return (
            <div className="p-4 animate-fade-in">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Unit Converter</h2>
                  <button onClick={() => { setFromVal('1'); }} className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                      Clear
                  </button>
              </div>
            
              {/* Category Grid (No Scrollbar) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
                  {Object.keys(CATEGORIES).map(cat => (
                      <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`px-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 border
                              ${category === cat
                                  ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-500 text-sky-700 dark:text-sky-300 shadow-sm ring-1 ring-sky-500'
                                  : 'bg-slate-50 dark:bg-slate-700/50 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
            
              {/* Converter Core */}
              <div className="space-y-2">
            
                  {/* FROM Input Box */}
                       <div className="relative group bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent">
                           <div className="px-4 pt-3 pb-1">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">From</label>
                               <div className="flex items-center">
                                   <input
                                       type="number"
                                       value={fromVal}
                                       onChange={e => setFromVal(e.target.value)}
                                       className="flex-1 w-0 bg-transparent text-2xl font-bold text-slate-800 dark:text-white focus:outline-none placeholder-slate-300 min-w-0" // FIX: w-0 and min-w-0 allows flex shrink
                                       placeholder="0"
                                   />
                                   <div className="ml-2 pl-2 border-l border-slate-200 dark:border-slate-600 max-w-[40%] flex-shrink-0"> {/* FIX: Constrain width */}
                                       <select
                                           value={fromUnit}
                                           onChange={e => setFromUnit(e.target.value)}
                                           className="w-full bg-transparent font-bold text-sm text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer hover:text-sky-600 truncate" // FIX: Truncate text if too long
                                       >
                                           {Object.keys(CATEGORIES[category].units).map(u => <option key={u} value={u}>{u}</option>)}
                                       </select>
                                   </div>
                               </div>
                           </div>
                       </div>
            
                  {/* Swap Button (Floating Overlay) */}
                  <div className="h-4 relative z-10 flex justify-center">
                      <button
                          onClick={handleSwap}
                          className="absolute -top-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sky-600 rounded-full p-1.5 shadow-sm hover:scale-110 hover:shadow-md transition-all duration-200"
                          title="Swap Units"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                          </svg>
                      </button>
                  </div>
            
                  {/* TO Input Box (Read Only Style) */}
                       <div className="relative group bg-sky-50 dark:bg-sky-900/10 rounded-xl border border-sky-100 dark:border-sky-800/50 transition-all">
                           <div className="px-4 pt-3 pb-1">
                               <div className="flex justify-between items-center">
                                   <label className="text-[10px] font-bold text-sky-600/70 dark:text-sky-400/70 uppercase tracking-wider block">To</label>
                                   <button onClick={handleSave} className="text-sky-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-4 h-4"/></button>
                               </div>
                               <div className="flex items-center">
                                   <div className="flex-1 w-0 text-2xl font-bold text-sky-700 dark:text-sky-400 truncate py-1 min-w-0"> {/* FIX: Added w-0, min-w-0 */}
                                       {result}
                                   </div>
                                   <div className="ml-2 pl-2 border-l border-sky-200 dark:border-sky-800 max-w-[40%] flex-shrink-0"> {/* FIX: Constrain width */}
                                       <select
                                           value={toUnit}
                                           onChange={e => setToUnit(e.target.value)}
                                           className="w-full bg-transparent font-bold text-sm text-sky-700 dark:text-sky-300 focus:outline-none cursor-pointer hover:text-sky-900 truncate"
                                       >
                                           {Object.keys(CATEGORIES[category].units).map(u => <option key={u} value={u}>{u}</option>)}
                                       </select>
                                   </div>
                               </div>
                           </div>
                       </div>
            
                  {/* Factor Display */}
                  <div className="px-2 flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>{factorDisplay}</span>
                      <CopyButton textToCopy={result} label="Copy Result" />
                  </div>
            
              </div>
            </div>
            </div>
            );
            };

            /**
            * @description React component for managing user settings and preferences.
            * This panel provides a user interface to configure various default units and modes
            * for the application's calculators, tailoring the user experience to their specific
            * needs and regional standards.
            *
            * Key functionalities include:
            * - **Unit Selection:** Users can set their preferred default units for common
            * quantities like Activity, Dose Rate, and Distance.
            * - **Mode Selection:** Users can choose the default calculator mode for multi-mode tools,
            * such as the Dose Calculator.
            * - **Data Management:** A "Reset to Defaults" button allows users to clear all locally
            * saved data, including their custom settings, favorites list, and calculator inputs,
            * via a confirmation modal. This ensures a clean slate, if needed.
            *
            * This component utilizes a global `SettingsContext` to persist and retrieve user preferences
            * across the application's various tools.
            */
            
            const SettingsPanel = () => {
            const { settings, updateSettings } = React.useContext(SettingsContext);
            const theme = settings.theme; 
            const [isResetModalOpen, setIsResetModalOpen] = React.useState(false);
            
            const handleSettingChange = (key, value) => {
            updateSettings({ [key]: value });
            };
            
            const handleResetDefaults = () => {
            localStorage.clear();
            sessionStorage.setItem('showResetToast', 'true');
            window.location.reload();
            };
            
            return (
            <>
               <div className="p-4 animate-fade-in">
                   <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                       <h2 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h2>
                       <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                           Manage application theme and saved data.
                       </p>
            
                       {/* --- Theme Section --- */}
                       <div className="space-y-4">
                           <div>
                               <label className="block text-sm font-medium mb-2">Theme</label>
                               <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                    <button onClick={() => handleSettingChange('theme', 'light')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${settings.theme === 'light' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Light</button>
                                    <button onClick={() => handleSettingChange('theme', 'dark')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${settings.theme === 'dark' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Dark</button>
                                    <button onClick={() => handleSettingChange('theme', 'system')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${settings.theme === 'system' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>System</button>
                               </div>
                           </div>
            
            <div>
                                   <label className="block text-sm font-medium mb-2">Unit System</label>
                                   <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                        <button onClick={() => handleSettingChange('unitSystem', 'conventional')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${settings.unitSystem === 'conventional' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Conventional (Ci, rem)</button>
                                        <button onClick={() => handleSettingChange('unitSystem', 'si')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${settings.unitSystem === 'si' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>SI (Bq, Sv)</button>
                                   </div>
                               </div>
            
                       </div>
            
                       {/* --- About Section --- */}
                       <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-2 text-center text-xs text-slate-500 dark:text-slate-400">
                            <p><strong>Health Physics Toolbox</strong> Version {VERSION}</p>
                            <p>Last Updated: {LAST_UPDATED}</p>
                            <p>Created by Jough Donakowski, CHP</p>
                       </div>
            
                       {/* --- Reset Section --- */}
                       <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                           <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Application Data</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">This will clear all saved calculator inputs, favorites, search history, and settings.</p>
                           <button onClick={() => setIsResetModalOpen(true)} className="w-full py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition">Reset All Saved Data</button>
                       </div>
                   </div>
               </div>
               <ConfirmationModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleResetDefaults} title="Reset All Settings & Saved Data?"><p>Are you sure? This will clear <strong>all</strong> saved calculator inputs, favorites, search history, and default settings. The application will reload with its original defaults. This action cannot be undone.</p></ConfirmationModal>
            </>
            );
            };
            
            
            const PopoutWindow = ({ children, title, onClose, width = 450, height = 750 }) => {
                const [container, setContainer] = React.useState(null);
                const newWindow = React.useRef(null);
            
                React.useEffect(() => {
                    newWindow.current = window.open('', title, `width=${width},height=${height},resizable=yes`);
            
                    // --- THIS LINE IS UPDATED to include text colors ---
                    newWindow.current.document.body.className = "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200";
            
                    const popoutRoot = newWindow.current.document.createElement('div');
                    newWindow.current.document.body.appendChild(popoutRoot);
            
            const reactScript = newWindow.current.document.createElement('script');
            reactScript.src = "https://unpkg.com/react@18/umd/react.development.js";
            reactScript.crossOrigin = true;
            newWindow.current.document.head.appendChild(reactScript);
            
            const reactDomScript = newWindow.current.document.createElement('script');
            reactDomScript.src = "https://unpkg.com/react-dom@18/umd/react-dom.development.js";
            reactDomScript.crossOrigin = true;
            newWindow.current.document.head.appendChild(reactDomScript);
            
            const babelScript = newWindow.current.document.createElement('script');
            babelScript.src = "https://unpkg.com/@babel/standalone/babel.min.js";
            newWindow.current.document.head.appendChild(babelScript);
            
                    document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
                        newWindow.current.document.head.appendChild(node.cloneNode(true));
                    });
            
                    const tailwindScript = newWindow.current.document.createElement('script');
                    tailwindScript.src = "https://cdn.tailwindcss.com";
                    newWindow.current.document.head.appendChild(tailwindScript);
                    const tailwindConfigScript = newWindow.current.document.createElement('script');
                    tailwindConfigScript.innerHTML = `tailwind.config = { darkMode: 'class' }`;
                    newWindow.current.document.head.appendChild(tailwindConfigScript);
            
                    newWindow.current.document.documentElement.className = document.documentElement.className;
            
                    setContainer(popoutRoot);
            
                    const handleUnload = () => { onClose(); };
                    newWindow.current.addEventListener('beforeunload', handleUnload);
            
                    return () => {
                        newWindow.current.removeEventListener('beforeunload', handleUnload);
                        if (newWindow.current) {
                           newWindow.current.close();
                        }
                        setContainer(null);
                    };
                }, []);
            
                if (!container) return null;
            
                return ReactDOM.createPortal(children, container);
            };

            /**
            * @description An advanced view for comparing multiple radionuclides side-by-side.
            * Features dynamic highlighting, in-cell data bars, and an integrated
            * percentage difference tag when comparing two nuclides.
            */
            
            const ComparisonView = ({ radionuclides, onNuclideClick, comparisonList, onAddToCompare, onRemoveFromCompare, onClearCompare }) => {
            const [isModalOpen, setIsModalOpen] = React.useState(false);
            const { settings } = React.useContext(SettingsContext);
            
            // Helper for HVL lookup
            const getHVL = (nuclide, material) => {
                // Check if HVL_DATA exists (it might be in a different file scope)
                if (typeof HVL_DATA !== 'undefined' && HVL_DATA[nuclide.symbol] && HVL_DATA[nuclide.symbol][material]) {
                    return HVL_DATA[nuclide.symbol][material];
                }
                return null; // Will render as 'N/A' in the table
            };
            
            const formatGammaSI = (valR) => (valR ? (valR * 0.01) / 3.7e10 : 0);
            const formatTBqToCi = (valTBq) => (valTBq ? valTBq * 27.027 : 0);
            
            // --- REFACTORED CONFIGURATION ---
            const propertiesToCompare = React.useMemo(() => [
            {
            label: 'Half-life',
            key: 'halfLife',
            type: 'numeric',
            highlightMode: 'neutral',
            useLogScale: true,
            getValue: (n) => parseHalfLifeToSeconds(n.halfLife),
            getDisplay: (n) => formatHalfLife(n.halfLife, getBestHalfLifeUnit(parseHalfLifeToSeconds(n.halfLife)))
            },
            { 
            label: 'Primary Decay Mode', 
            type: 'categorical', 
            render: (n) => <span className="font-medium text-slate-700 dark:text-slate-300">{n.emissionType?.[0] || 'N/A'}</span> 
            },
            {
            label: 'Specific Activity',
            key: 'specificActivity',
            type: 'numeric',
            highlightMode: 'highGood',
            useLogScale: true,
            getValue: (n) => parseSpecificActivity(n.specificActivity),
            getDisplay: (n) => {
            const val = parseSpecificActivity(n.specificActivity);
            const fmt = formatWithUnitSystem(val, 'activity', settings);
            return `${fmt.value} ${fmt.unit}`;
            }
            },
            {
            label: settings.unitSystem === 'si' ? 'Gamma Const. (Sv·m²/hr·Bq)' : 'Gamma Const. (R·m²/hr·Ci)',
            key: 'gammaConstant',
            type: 'numeric',
            highlightMode: 'lowGood',
            getValue: (n) => {
            const val = safeParseFloat(n.gammaConstant);
            return settings.unitSystem === 'si' ? formatGammaSI(val) : val;
            },
            getDisplay: (n) => {
            const val = safeParseFloat(n.gammaConstant);
            if (!val) return 'N/A';
            if (settings.unitSystem === 'si') return formatGammaSI(val).toExponential(2);
            return val.toFixed(4);
            }
            },
            {
            label: 'Lead HVL (cm)',
            key: 'hvl',
            type: 'numeric',
            highlightMode: 'lowGood',
            getValue: (n) => getHVL(n, 'Lead'),
            getDisplay: (n) => getHVL(n, 'Lead') || 'N/A'
            },
            {
            label: settings.unitSystem === 'si' ? 'Ingestion ALI (Bq)' : 'Ingestion ALI (µCi)',
            key: 'aliIngest',
            type: 'numeric',
            highlightMode: 'highGood',
            useLogScale: true,
            getValue: (n) => n.dosimetry?.ALI?.ingestion,
            getDisplay: (n) => {
            const val = n.dosimetry?.ALI?.ingestion;
            if (!val) return 'N/A';
            const fmt = formatWithUnitSystem(val, 'ali', settings);
            return fmt.value;
            }
            },
            // NEW: Inhalation ALI
            {
            label: settings.unitSystem === 'si' ? 'Inhalation ALI (Bq)' : 'Inhalation ALI (µCi)',
            key: 'aliInhale',
            type: 'numeric',
            highlightMode: 'highGood',
            useLogScale: true,
            getValue: (n) => {
            // Try to find the most conservative (lowest) inhalation limit or default to 'W'
            const d = n.dosimetry?.ALI;
            if(!d) return null;
            return d.inhalation_W || d.inhalation_Y || d.inhalation_D || d.inhalation;
            },
            getDisplay: (n) => {
            const d = n.dosimetry?.ALI;
            if(!d) return 'N/A';
            const val = d.inhalation_W || d.inhalation_Y || d.inhalation_D || d.inhalation;
            const fmt = formatWithUnitSystem(val, 'ali', settings);
            return fmt.value;
            }
            },
            {
            label: settings.unitSystem === 'si' ? 'D-Value (TBq)' : 'D-Value (Ci)',
            key: 'dValue',
            type: 'numeric',
            highlightMode: 'highGood',
            useLogScale: true,
            getValue: (n) => settings.unitSystem === 'si' ? n.dValue : formatTBqToCi(n.dValue),
            getDisplay: (n) => {
            const val = n.dValue;
            if (!val) return 'N/A';
            if (settings.unitSystem === 'si') return val;
            return formatTBqToCi(val).toLocaleString(undefined, { maximumFractionDigits: 1 });
            }
            },
            { label: 'Parent', type: 'categorical', render: (n) => <ClickableNuclide text={n.parent} radionuclides={radionuclides} onNuclideClick={onNuclideClick} /> },
            { label: 'Daughter', type: 'categorical', render: (n) => <ClickableNuclide text={n.daughter} radionuclides={radionuclides} onNuclideClick={onNuclideClick} /> },
            ], [settings.unitSystem, radionuclides]);
            
            const sortedNuclides = React.useMemo(() => [...radionuclides].sort((a, b) => a.name.localeCompare(b.name)), [radionuclides]);
            const handleAddNuclide = (symbol) => onAddToCompare(symbol);
            
            // Quick Add Handlers
            const addGroup = (symbols) => {
                // 1. Clear existing list first to prevent duplicates
                onClearCompare();
                
                // 2. Filter out invalid symbols before adding
                const validNuclides = symbols
                    .map(s => radionuclides.find(n => n.symbol === s))
                    .filter(n => n !== undefined);
            
                // 3. Use a Set to ensure uniqueness within the group being added
                const uniqueNuclides = [...new Set(validNuclides)];
            
                // 4. Add them in a batch
                setTimeout(() => {
                    uniqueNuclides.forEach(n => onAddToCompare(n.symbol));
                }, 50);
            };
            
            const handleExportToCSV = () => {
            const headers = ['Property', ...comparisonList.map(n => n.name)];
            const rows = propertiesToCompare.map(prop => {
            const rowData = [prop.label];
            comparisonList.forEach(nuclide => {
            let val = 'N/A';
            if (prop.getDisplay) val = prop.getDisplay(nuclide);
            else if (prop.getValue) val = prop.getValue(nuclide);
            else if (prop.render) val = nuclide[prop.key] || 'N/A';
            rowData.push(String(val).replace(/,/g, ' '));
            });
            return rowData.join(',');
            });
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "radionuclide_comparison.csv";
            link.click();
            };
            
            const handleConfirmClear = () => { onClearCompare(); setIsModalOpen(false); };
            
            return (
            <div className="p-4 animate-fade-in">
            <div className="max-w-7xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Compare Radionuclides</h2>
            <div className="flex items-center gap-2">
                {comparisonList.length > 0 && (
                    <>
                        <button onClick={() => setIsModalOpen(true)} className="px-3 py-2 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                            <Icon path={ICONS.clear} className="w-4 h-4" /> Clear
                        </button>
                        <button onClick={handleExportToCSV} className="px-3 py-2 text-sm bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition flex items-center gap-2">
                            <Icon path={ICONS.database} className="w-4 h-4" /> Export CSV
                        </button>
                    </>
                )}
            </div>
            </div>
            
            <div className="flex items-center gap-2 mb-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
            <SearchableSelect options={sortedNuclides.filter(n => !comparisonList.find(c => c.symbol === n.symbol))} onSelect={handleAddNuclide} placeholder="Search to add a nuclide..." />
            </div>
            
            {comparisonList.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <Icon path={ICONS.compare} className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-300">The Comparison Table is Empty</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add nuclides using the search box above, or try a preset:</p>
                
                {/* Quick Group Buttons */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <button onClick={() => addGroup(['Tc-99m', 'I-131', 'F-18', 'Lu-177'])} className="px-3 py-1 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-full text-xs font-bold hover:bg-sky-200 transition">Medical</button>
                    <button onClick={() => addGroup(['Cs-137', 'Co-60', 'Ir-192', 'Am-241'])} className="px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold hover:bg-amber-200 transition">Industrial</button>
                    <button onClick={() => addGroup(['U-238', 'U-235', 'Pu-239', 'Am-241'])} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold hover:bg-emerald-200 transition">SNM</button>
                </div>
            </div>
            ) : (
            <div className="overflow-x-auto relative shadow-md rounded-lg">
                <table className="w-full min-w-[600px] text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 top-0 z-30 bg-slate-50 dark:bg-slate-700 p-3 text-sm font-semibold border-b border-r border-slate-200 dark:border-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Property</th>
                            {comparisonList.map(nuclide => (
                                <th key={nuclide.symbol} className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 p-3 text-sm font-semibold border-b border-slate-200 dark:border-slate-600 min-w-[140px]">
                                    <div className="flex justify-between items-center">
                                        <span className="cursor-pointer hover:text-sky-500" onClick={() => onNuclideClick(nuclide)}>{nuclide.name}</span>
                                        <button onClick={() => onRemoveFromCompare(nuclide.symbol)} className="ml-2 text-slate-400 hover:text-red-500"><Icon path={ICONS.clear} className="w-4 h-4"/></button>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {propertiesToCompare.map(prop => {
                            let numericValues = [];
                            let maxVal = -Infinity, minVal = Infinity;
            
                            if (prop.type === 'numeric') {
                                           numericValues = comparisonList.map(n => {
                                               const v = prop.getValue ? prop.getValue(n) : null;
                                               return (typeof v === 'number' && !isNaN(v)) ? v : null;
                                           });
            
                                           // Filter out Infinity explicitly when finding Max/Min for scaling
                                           const validFiniteValues = numericValues.filter(v => v !== null && v !== Infinity && v > 0);
                                           
                                           if (validFiniteValues.length > 0) {
                                               maxVal = Math.max(...validFiniteValues);
                                               minVal = Math.min(...validFiniteValues);
                                           } else {
                                               // Fallback if all values are Infinity or 0 (prevents divide by zero)
                                               maxVal = 1;
                                               minVal = 0;
                                           }
                                       }
            
                            return (
                                <tr key={prop.label} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 p-3 font-medium text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-600 text-xs uppercase tracking-wide shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        {prop.label}
                                    </td>
            
                                    {comparisonList.map((nuclide, idx) => {
                                        let cellContent;
                                        let cellClass = 'border-b border-slate-200 dark:border-slate-600 transition-colors duration-200';
            
                                        if (prop.render) {
                                            cellContent = prop.render(nuclide);
                                        } else {
                                            const rawVal = prop.getValue ? prop.getValue(nuclide) : null;
                                            const displayVal = prop.getDisplay ? prop.getDisplay(nuclide) : (rawVal || 'N/A');
            
                                            if (prop.type === 'numeric') {
            const numVal = numericValues[idx];
            let barWidth = 0;
            
            // Check if we have a valid, non-null value to work with
            if (numVal !== null && numVal !== undefined) {
            
            // CASE 1: Infinite Value (e.g., Stable Half-life)
            if (numVal === Infinity) {
            barWidth = 100; // Fill the bar completely for "Stable"
            }
            // CASE 2: Normal Calculation (Must be > 0 for Log Scale safety)
            else if (maxVal > 0) {
            
            // Logarithmic Scale Logic (Used for Half-life, Specific Activity)
            if (prop.useLogScale) {
            // Ensure value is positive (log(0) is -Infinity)
            if (numVal > 0 && minVal > 0 && maxVal / minVal > 100) {
            const logMin = Math.log10(minVal);
            const logMax = Math.log10(maxVal);
            const logVal = Math.log10(numVal);
            
            // Prevent divide-by-zero if all values are the same
            if (logMax === logMin) {
                barWidth = 100;
            } else {
                barWidth = ((logVal - logMin) / (logMax - logMin)) * 100;
            }
            
            // Ensure tiny bars are at least visible (5%)
            barWidth = Math.max(barWidth, 5);
            } 
            // If numVal is 0 but we are in log mode, barWidth stays 0.
            } 
            // Linear Scale Logic (Used for Gamma Constant, etc.)
            else {
            barWidth = (numVal / maxVal) * 100;
            }
            }
            }
            
            // highlightMode logic
            if (prop.highlightMode === 'highGood') {
            if (numVal === maxVal && numVal !== Infinity) cellClass += ' bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-bold';
            if (numVal === minVal) cellClass += ' text-slate-500 dark:text-slate-400';
            } else if (prop.highlightMode === 'lowGood') {
            if (numVal === minVal) cellClass += ' bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-bold';
            if (numVal === maxVal && numVal !== Infinity) cellClass += ' text-slate-500 dark:text-slate-400';
            } else { // Neutral
            if (numVal === maxVal && numVal !== Infinity) cellClass += ' bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 font-bold';
            }
            
            // Render the visual bar
            cellContent = (
            <div className="relative h-full w-full flex items-center">
            {barWidth > 0 && (
            <div
            className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${
                prop.highlightMode === 'highGood' ? (numVal === maxVal ? 'bg-green-500' : 'bg-green-200') :
                prop.highlightMode === 'lowGood' ? (numVal === minVal ? 'bg-green-500' : 'bg-slate-300') :
                'bg-sky-400'
            }`}
            style={{ width: `${barWidth}%`, opacity: 0.4 }}
            />
            )}
            <span className="relative z-10">{displayVal}</span>
            </div>
            );
            } else {
            cellContent = <span>{displayVal}</span>;
            }
                                        }
                                        return <td key={nuclide.symbol} className={`${cellClass} p-3 text-sm`}>{cellContent}</td>;
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            )}
            </div>
            <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmClear} title="Clear Comparison"><p>Are you sure you want to clear the list?</p></ConfirmationModal>
            </div>
            );
            };
