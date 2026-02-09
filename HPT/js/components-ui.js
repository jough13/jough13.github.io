//==============================================================================
// --- REACT COMPONENTS & ICONS
//==============================================================================
            
            /**
             * A simple SVG icon component.
             * @param {{path: string, className?: string}} props - Component props.
             * @param {string} props.path - The SVG path data for the icon.
             * @param {string} [props.className="w-5 h-5"] - Optional CSS classes.
             * @returns {JSX.Element} A React component rendering an SVG icon.
             */
            
            const Icon = ({ path, className = "w-5 h-5" }) => (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
                    <path d={path} />
                </svg>
            );
            
            //==============================================================================
            // --- REUSABLE UI COMPONENTS
            //==============================================================================
            
            /**
             * @description Displays a compact summary of a nuclide's key properties within a calculator.
             * @param {{nuclide: object}} props - The nuclide object to display context for.
             */
            
            const NuclideContextDisplay = ({ nuclide }) => {
                if (!nuclide) return null;
            
                const properties = [
                    {
                        label: 'Half-life',
                        value: formatHalfLife(nuclide.halfLife, getBestHalfLifeUnit(parseHalfLifeToSeconds(nuclide.halfLife))),
                        condition: nuclide.halfLife && nuclide.halfLife !== 'Stable'
                    },
                    {
                        label: 'β Eₘₐₓ',
                        value: (nuclide.emissionEnergies?.beta || [])[0]?.replace(' (max)', ''),
                        condition: nuclide.emissionEnergies?.beta?.length > 0
                    },
            {
                        label: 'β Eₐᵥ₉',
                        value: `${nuclide.avgBetaEnergy} MeV`,
                        condition: nuclide.avgBetaEnergy
                    },
                    {
                        label: 'Γ Constant',
                        value: nuclide.gammaConstant,
                        condition: nuclide.gammaConstant
                    },
                    {
                        label: 'Emissions',
                        value: (nuclide.emissionType || []).join(', '),
                        condition: nuclide.emissionType?.length > 0
                    },
                    {
                        label: 'Specific Activity',
                        value: nuclide.specificActivity,
                        condition: nuclide.specificActivity
                    },
                ];
            
                const availableProperties = properties.filter(p => p.condition);
            
                if (availableProperties.length === 0) return null;
            
                return (
                    <div className="p-3 my-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg animate-fade-in text-xs">
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1`}>
                            {availableProperties.map(prop => (
                                <div key={prop.label} className="truncate">
                                    <span className="font-semibold text-slate-500 dark:text-slate-400">{prop.label}: </span>
                                    <span className="text-slate-700 dark:text-slate-200" title={prop.value}>{prop.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            };
            
            /**
            * @description Displays a styled note for disclaimers or contextual info.
            * @param {{children: React.ReactNode, type: 'info' | 'warning'}} props
            */
           
            const ContextualNote = ({ children, type = 'info' }) => {
            const styles = {
            info: {
               container: 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700',
               iconColor: 'text-slate-500 dark:text-slate-400',
            },
            warning: {
               container: 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
               iconColor: 'text-amber-600 dark:text-amber-400',
            }
            };
            const selectedStyle = styles[type] || styles.info;
            
            return (
            <div className={`mt-4 p-3 border-l-4 rounded-r-lg text-xs ${selectedStyle.container}`}>
               <div className="flex">
                   <div className="flex-shrink-0">
                       <Icon path={ICONS.help} className={`w-4 h-4 mr-2 ${selectedStyle.iconColor}`} />
                   </div>
                   <div className="flex-grow text-slate-600 dark:text-slate-300">
                       {children}
                   </div>
               </div>
            </div>
            );
            };
            
            const Tooltip = ({ text, children, widthClass = 'w-96' }) => {
            
            // --- Modified state to hold a flexible style object ---
            
            const [tooltipState, setTooltipState] = React.useState({
            show: false,
            style: { opacity: 0, visibility: 'hidden' },
            position: 'bottom'
            });
            const triggerRef = React.useRef(null);
            const timeoutRef = React.useRef(null);
            
            // --- Rewrote handleMouseEnter with responsive logic ---
            
            const handleMouseEnter = () => {
            if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const position = rect.top > window.innerHeight / 2 ? 'top' : 'bottom';
            const screenPadding = 8; // 8px padding from the viewport edge
            
            const newStyle = {
            top: position === 'bottom' ? rect.bottom : rect.top,
            visibility: 'visible',
            opacity: 1,
            };
            
            // Check if trigger is in the right half of the screen
            
            if (rect.left + rect.width / 2 > window.innerWidth / 2) {
            
            // Align tooltip's RIGHT edge with trigger's RIGHT edge
            
            newStyle.right = window.innerWidth - rect.right;
            newStyle.transformOrigin = 'right'; // Optional: for smoother animations
            } else {
            
            // Align tooltip's LEFT edge with trigger's LEFT edge
            
            newStyle.left = rect.left;
            newStyle.transformOrigin = 'left'; // Optional: for smoother animations
            }
            
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            setTooltipState({
            show: true,
            style: newStyle,
            position: position
            });
            
            timeoutRef.current = setTimeout(() => {
            setTooltipState(prev => ({ ...prev, show: false }));
            }, 4000);
            }
            };
            
            // --- Updated handleMouseLeave to correctly hide the tooltip ---
            const handleMouseLeave = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            // Hide by reverting style properties
            
            setTooltipState(prev => ({
            ...prev,
            show: false
            }));
            };
            
            React.useEffect(() => {
            return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };
            }, []);
            
            const positionClasses = tooltipState.position === 'bottom'
            ? 'translate-y-2'
            : '-translate-y-full -translate-y-2';
            
            // --- Modified the rendered element to use the new style object ---
            // Note the removal of "-translate-x-1/2" from the className
            
            const tooltipElement = (
            ReactDOM.createPortal(
            <div
            style={{
            ...tooltipState.style,
            
            // Smoothly transition opacity for the fade effect
            
            transition: 'opacity 0.2s ease-out',
            
            // Conditionally set opacity based on the 'show' state
            
            opacity: tooltipState.show ? 1 : 0,
            }}
            className={`fixed top-0 p-2 text-xs text-white bg-slate-800 dark:bg-slate-900 rounded-md shadow-lg z-50 pointer-events-none ${widthClass} ${positionClasses}`}
            >
            {text}
            </div>,
            document.body
            )
            );
            
            return (
            <>
            {React.cloneElement(children, {
            ref: triggerRef,
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            })}
            {tooltipElement}
            </>
            );
            };
            
            const renderInputField = (label, value, setter, isEnabled, unitValue, unitSetter, unitOptions) => (
             <div>
                 <label className={`block text-sm font-medium ${isEnabled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>{label}</label>
                 <div className="flex gap-2 mt-1">
                     <input type="number" value={value} onChange={e => setter(e.target.value)} disabled={!isEnabled} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed" />
                     {unitOptions && (
                         <select value={unitValue} onChange={e => unitSetter(e.target.value)} disabled={!isEnabled} className="p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed">
                             {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                         </select>
                     )}
                 </div>
             </div>
            );
            
            /**
            * @description Helper component to parse nuclide strings with multiple daughters and extra text.
            * Handles strings like "Thorium-227 (β) or Francium-223 (α)" by making both isotopes clickable links
            * while preserving the surrounding text and separators.
            */
            const ClickableNuclide = ({ text, radionuclides, onNuclideClick }) => {
            if (!text || text === 'None' || text === 'Stable') {
            return <span className="text-slate-500 dark:text-slate-400 italic">{text || 'None'}</span>;
            }
            
            // 1. Split by common separators but keep them in the array (using capturing parentheses)
            // Separators: " or ", " / ", " -> ", or ","
            const parts = text.split(/(\s+or\s+|\s*\/\s*|\s*->\s*|,\s+)/i);
            
            return (
            <span className="inline-flex flex-wrap items-baseline gap-x-0.5">
            {parts.map((part, index) => {
            // If this part is purely a separator, render it as plain text
            if (/^(\s+or\s+|\s*\/\s*|\s*->\s*|,\s+)$/i.test(part)) {
            return <span key={index} className="text-slate-500 dark:text-slate-400 mx-1">{part}</span>;
            }
            
            // 2. Separate the Nuclide Name from extra info like "(α)" or "(stable)"
            // Example: "Thorium-227 (β)" -> namePart="Thorium-227", extraPart=" (β)"
            const match = part.match(/^([a-zA-Z]+-\d+[mw]?)(.*)$/);
            
            let namePart = part.trim();
            let extraPart = '';
            
            if (match) {
            namePart = match[1]; // e.g., "Thorium-227"
            extraPart = match[2]; // e.g., " (β)"
            }
            
            // 3. Lookup the clean name in the database
            const nuclideMatch = radionuclides?.find(r => 
            r.name.toLowerCase() === namePart.toLowerCase() || 
            r.symbol.toLowerCase() === namePart.toLowerCase()
            );
            
            if (nuclideMatch) {
            return (
                <React.Fragment key={index}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onNuclideClick(nuclideMatch); }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline font-semibold transition-colors"
                    >
                        {namePart}
                    </button>
                    {extraPart && <span className="text-slate-600 dark:text-slate-300">{extraPart}</span>}
                </React.Fragment>
            );
            }
            
            // Fallback: If it looked like a nuclide but wasn't found (or just plain text), render as text
            return <span key={index} className="text-slate-700 dark:text-slate-300">{part}</span>;
            })}
            </span>
            );
            };
            
            /**
            * @description A reusable modal dialog for confirming user actions.
            * @param {{isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, children: React.ReactNode}} props
            */
            
            const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
            if (!isOpen) return null;
            
            // The modal's JSX is now wrapped in ReactDOM.createPortal()
            
            return ReactDOM.createPortal(
            
            // Backdrop
            
            <div
               className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in"
               onClick={onClose} // Close modal if backdrop is clicked
            >
               {/* Modal Panel */}
            
               <div
                   className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col"
                   onClick={e => e.stopPropagation()} // Prevent click inside from closing modal
               >
                   <div className="p-6">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                       <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                           {children}
                       </div>
                   </div>
            
                   {/* Action Buttons */}
            
                   <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 flex justify-end items-center gap-3 rounded-b-2xl">
                       <button
                           onClick={onClose}
                           className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                       >
                           Cancel
                       </button>
                       <button
                           onClick={onConfirm}
                           className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                       >
                           Confirm
                       </button>
                   </div>
               </div>
            </div>,
            document.getElementById('modal-root') // This tells React where to render the modal
            );
            };
            
            const ClearButton = ({ onClick }) => (
            <button onClick={onClick} className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 ml-auto">
            <Icon path={ICONS.clear} className="w-3 h-3"/> Clear Inputs
            </button>
            );
            
            /**
             * @description A button that copies a given text string to the clipboard and shows a confirmation.
             * @param {{textToCopy: string}} props - The text to be copied.
             */
            
            const CopyButton = ({ textToCopy }) => {
                const [copied, setCopied] = React.useState(false);
                const { addToast } = useToast();
            
                const handleCopy = () => {
                    if (textToCopy) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            addToast('Copied to clipboard!');
                            setCopied(true);
                            // Revert the icon back to the copy icon after 2 seconds.
                            setTimeout(() => setCopied(false), 2000);
                        });
                    }
                };
            
                return (
                    <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-sky-500 transition-colors" title="Copy to clipboard" aria-label="Copy result to clipboard">
                        <Icon path={copied ? ICONS.check : ICONS.copy} className="w-5 h-5" />
                    </button>
                );
            };
            
            /**
             * @description The main header for the application.
             * @param {{onHelpClick: () => void, theme: string, toggleTheme: () => void}} props - Handlers and state for help and theme toggling.
             */
            
            const Header = ({ onHelpClick, theme, toggleTheme, onNavClick }) => (
            
            <header className="flex items-center p-4 md:p-6 border-b border-slate-200 dark:border-slate-700">
            
            <div className="flex-1 flex justify-start">
                <Tooltip text="Toggle Theme" widthClass="w-auto">
                    <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors" aria-label="Toggle dark mode">
                        <Icon path={theme === 'dark' ? ICONS.sun : ICONS.moon} className="w-6 h-6" />
                    </button>
                </Tooltip>
            </div>
            
            <div className="flex-1 text-center">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">Health Physics Toolbox</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Version: {VERSION} | Last Updated: {LAST_UPDATED}
                </p>
            </div>
            
            <div className="flex-1 flex justify-end items-center gap-2">
                {/* MODIFIED: Added rel="noopener noreferrer" for security */}
                <a href="https://www.buymeacoffee.com/jough" target="_blank" rel="noopener noreferrer" className="hidden md:block">
                    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style={{ height: '36px', width: 'auto' }} />
                </a>
                <div className="flex flex-col">
                  <Tooltip text="Settings" widthClass="w-auto">
            
                      <button onClick={() => onNavClick(VIEWS.SETTINGS)} className="p-1 text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors" aria-label="Open settings panel">
                          <Icon path={ICONS.settings} className="w-5 h-5" />
                      </button>
                  </Tooltip>
                    <Tooltip text="Open User Manual" widthClass="w-auto">
                        <button onClick={onHelpClick} className="p-1 text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors" aria-label="Open User Manual">
                            <Icon path={ICONS.help} className="w-5 h-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>
            </header>
            );
            
            /**
             * @description The primary search input with auto-suggestions.
             * @param {object} props - Contains all state and handlers for the search functionality.
             * @param {string} props.nuclideName - The current value of the search input.
             * @param {React.RefObject} props.inputRef - Ref for the input element.
             * @param {(e: React.ChangeEvent) => void} props.handleNuclideNameChange - Handler for input changes.
             * @param {(e: React.KeyboardEvent) => void} props.handleKeyDown - Handler for keyboard events (arrow keys, Enter).
             * @param {() => void} props.onClear - Handler to clear the search input.
             * @param {Array<object>} props.suggestions - The list of suggestion items.
             * @param {number} props.activeSuggestionIndex - The index of the currently highlighted suggestion.
             * @param {React.RefObject} props.suggestionsRef - Ref for the suggestions list container.
             * @param {(nuclide: object) => void} props.handleNuclideSelection - Handler for when a nuclide is selected.
             */
            
            const SearchBar = ({ nuclideName, inputRef, handleNuclideNameChange, handleKeyDown, onClear, suggestions, activeSuggestionIndex, suggestionsRef, handleNuclideSelection, onNavClick, isFocused, onFocus, onBlur }) => (
            <div className="relative p-4 flex items-center gap-2">
            <div className="relative flex-grow">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Icon path={ICONS.search} className="w-5 h-5 text-slate-400" />
               </div>
               <input
                   ref={inputRef}
                   type="text"
                   value={nuclideName}
                   onChange={handleNuclideNameChange}
                   onKeyDown={handleKeyDown}
                   onFocus={onFocus}
                   onBlur={onBlur}
                   placeholder="Search by name or symbol (e.g., U-238)"
                   className="w-full p-3 pl-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
               />
               {nuclideName && (
                   <button onClick={onClear} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-sky-500 focus:outline-none">
                       <Icon path={ICONS.clear} className="w-5 h-5" />
                   </button>
               )}
            </div>
            
            <button
                onClick={() => onNavClick('home')}
                className="hidden md:flex items-center gap-2 p-3 md:px-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label="Home"
            >
                <Icon path={ICONS.home} className="w-5 h-5" />
                <span className="font-semibold">Home</span>
            </button>
            
            {isFocused && suggestions.length > 0 && (
               <ul ref={suggestionsRef} className="absolute z-20 top-full left-4 right-4 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                   {suggestions.map((s, i) => {
                       const styles = CATEGORY_STYLES[s.category] || CATEGORY_STYLES['default'];
                       return (
                           <li
                               key={s.symbol}
                               className={`p-3 pl-4 cursor-pointer text-slate-700 dark:text-slate-200 border-l-2 ${styles.border} ${styles.hoverBg} ${i === activeSuggestionIndex ? 'bg-sky-100 dark:bg-sky-900/50' : ''}`}
                               onClick={() => handleNuclideSelection(s)}
                           >
                               {s.name} ({s.symbol}) <span className="text-xs text-slate-500 dark:text-slate-400">{s.commonality}</span>
                           </li>
                       );
                   })}
                   {suggestions.length > 4 && (
                       <div className="sticky bottom-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm p-2 border-t border-slate-200 dark:border-slate-700">
                           <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                               {Object.entries(CATEGORY_STYLES).filter(([key]) => key !== 'default').map(([category, styles]) => {
                                   const bgColor = styles.border.replace('border-l-', 'bg-');
                                   return (
                                       <div key={category} className="flex items-center gap-1.5">
                                           <div className={`w-2.5 h-2.5 rounded-full ${bgColor}`}></div>
                                           <span className="text-xs text-slate-500 dark:text-slate-400">{category.replace('/', '/ ')}</span>
                                       </div>
                                   );
                               })}
                           </div>
                       </div>
                   )}
               </ul>
            )}
            </div>
            );
            
            /**
            * @description A button that appears when the user scrolls down, allowing them to quickly return to the top of the page.
            */
            
            const BackToTopButton = () => {
            const [isVisible, setIsVisible] = React.useState(false);
            
            // This function is called whenever the user scrolls
            
            const toggleVisibility = () => {
            if (window.pageYOffset > 300) { // Show button if scrolled more than 300px
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
            };
            
            // This function scrolls the page to the top smoothly
            
            const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            };
            
            React.useEffect(() => {
            window.addEventListener('scroll', toggleVisibility);
            // Clean up the listener when the component is removed
            return () => {
                window.removeEventListener('scroll', toggleVisibility);
            };
            }, []);
            
            return (
            <div className="fixed bottom-4 right-4 z-50">
                {isVisible && (
                    <button
                        onClick={scrollToTop}
                        className="p-3 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-300 animate-fade-in"
                        aria-label="Go to top"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                )}
            </div>
            );
            };
            
            /**
             * @description The main navigation bar, which is responsive for mobile and desktop.
             * @param {{activeView: string, onNavClick: (view: string) => void}} props - The currently active view and the click handler.
             */
            
            const MainNav = ({ activeView, onNavClick }) => {
            
            const navItems = [
            { id: VIEWS.HOME, label: 'Home', icon: ICONS.home },
            { id: VIEWS.DATABASE, label: 'Database', icon: ICONS.database },
            { id: VIEWS.COMPARE, label: 'Compare', icon: ICONS.compare },
            { id: VIEWS.CALCULATOR, label: 'Decay', icon: ICONS.calculator },
            { id: VIEWS.MDA, label: 'MDA', icon: ICONS.search },
            { id: VIEWS.MARSSIM_SAMPLES, label: 'MARSSIM Sample Design', icon: ICONS.calculator },
            { id: VIEWS.MARSSIM_TESTS, label: 'MARSSIM Tests', icon: ICONS.database },
            { id: VIEWS.SERIES_CALCULATOR, label: 'Series Decay', icon: ICONS.series },
            { id: VIEWS.EQUILIBRIUM, label: 'Equilibrium', icon: ICONS.activity },
            { id: VIEWS.RADON, label: 'Radon', icon: ICONS.radon },
            { id: VIEWS.ACTIVITY_MASS, label: 'Activity/Mass', icon: ICONS.mass },
            { id: VIEWS.DOSE_RATE, label: 'Dose & Dose Rate', icon: ICONS.doseRate },
            { id: VIEWS.SHIELDING, label: 'Shielding', icon: ICONS.shield },
            { id: VIEWS.STAY_TIME, label: 'Stay Time', icon: ICONS.stopwatch },
            { id: VIEWS.NEUTRON, label: 'Neutron Tools', icon: ICONS.neutron },
            { id: VIEWS.OPERATIONAL_HP, label: 'Operational HP', icon: ICONS.shield },
            { id: VIEWS.TRANSPORTATION, label: 'Transportation', icon: ICONS.transport },
            { id: VIEWS.CONVERTER, label: 'Converter', icon: ICONS.converter },
            { id: VIEWS.LAB_STATS, label: 'Lab Stats', icon: ICONS.labStats },
            { id: VIEWS.PEAK_ID, label: 'Peak ID', icon: ICONS.gammaSpec },
            { id: VIEWS.MEDICAL, label: 'Medical', icon: ICONS.medical },
            
            { id: VIEWS.SCRATCHPAD, label: 'Scratchpad', icon: ICONS.notepad },
            
            { id: VIEWS.SCIENTIFIC_CALCULATOR, label: 'Sci. Calculator', icon: ICONS.scientificCalculator },
            
            { id: VIEWS.REFERENCES, label: 'References', icon: ICONS.references }
            ];
            
            const NavButton = ({ item }) => (
            <button
               onClick={() => onNavClick(item.id)}
               className="flex-shrink-0 w-full"
            >
               <span
                    className={`mx-auto flex items-center justify-center gap-2 px-2 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                       activeView === item.id
                           ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow'
                           : 'text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-sky-800 hover:text-sky-600 dark:hover:text-sky-400 hover:shadow-md hover:-translate-y-1'
                   }`}
               >
                   <Icon path={item.icon} className="w-4 h-4" />
                   <span className="truncate">{item.label}</span>
               </span>
            </button>
            );
            
            return (
            <div className="px-4 pb-2">
               <div className="md:hidden">
                   <div className="grid grid-cols-2 gap-4">
                       {navItems.map(item => (
                           <button
                               key={item.id}
                               onClick={() => onNavClick(item.id)}
                               // --- MODIFIED LINE: Removed the col-span-2 conditional ---
                               className={`flex flex-col items-center justify-center p-4 rounded-lg text-center transition-all duration-150 ease-in-out ${
                                   activeView === item.id
                                       ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400'
                                       : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 active:scale-95'
                               }`}
                           >
                               <Icon path={item.icon} className="w-8 h-8 mb-2" />
                               <span className="text-sm font-semibold">{item.label}</span>
                           </button>
                       ))}
                   </div>
               </div>
               <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-2">
            
            {navItems.map(item => <NavButton key={item.id} item={item} />)}
            
               </div>
            </div>
            );
            };

                        
            //==============================================================================
            // --- VIEW COMPONENTS
            // These components represent the main content areas of the application.
            //==============================================================================
            
            const CalculationHistoryPanel = () => {
             // Removed onNavClick prop since we are making this read-only
             const [history, setHistory] = React.useState([]);
             const [isClearModalOpen, setIsClearModalOpen] = React.useState(false);
            
            React.useEffect(() => {
            const savedHistory = localStorage.getItem('rad_tool_calculation_history');
            if (savedHistory) {
                try {
                    // Wrap JSON.parse in try/catch to prevent app crash on corrupted data
                    const parsed = JSON.parse(savedHistory);
                    if (Array.isArray(parsed)) {
                        setHistory(parsed);
                    } else {
                        throw new Error("Invalid history format");
                    }
                } catch (e) {
                    console.error("Corrupted calculation history detected. Resetting.", e);
                    localStorage.removeItem('rad_tool_calculation_history');
                    setHistory([]);
                }
            }
            }, []);
            
             const handleClearHistory = () => {
                 localStorage.removeItem('rad_tool_calculation_history');
                 setHistory([]);
                 setIsClearModalOpen(false);
             };
            
             // Helper to format the timestamp
             const formatTime = (timestamp) => {
                 if (!timestamp) return '';
                 return new Date(timestamp).toLocaleString('en-US', {
                     month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                 });
             };
            
             if (history.length === 0) {
                   return (
                       <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-xl text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                           <p className="text-slate-500 dark:text-slate-400 font-semibold">No Saved Calculations</p>
                           <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                               Look for the <span className="inline-block align-middle"><svg className="w-3 h-3 inline" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></span> icon in calculator results to pin them here.
                           </p>
                       </div>
                   );
               }
            
             return (
                 <>
                     <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-xl animate-fade-in">
                         <div className="flex justify-between items-center mb-4">
                             <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 text-left">Saved Calculations</h4>

                             <button onClick={() => setIsClearModalOpen(true)} className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold">
                                 Clear Calculations
                             </button>
                         </div>
                         <div className="space-y-3">
                             {history.map(item => (
                                 <div
                                     key={item.id}
                                     className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 relative"
                                 >
                                     {/* Timestamp Badge */}
                                     <span className="absolute top-3 right-3 text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                         {formatTime(item.id)}
                                     </span>
            
                                     <div className="flex items-start gap-4 pr-16">
                                         {item.icon && <Icon path={item.icon} className="w-8 h-8 text-slate-400 dark:text-slate-500 mt-1 flex-shrink-0" />}
                                         <div className="flex-grow">
                                             <p className="font-bold text-sky-600 dark:text-sky-400">{item.type}</p>
                                             <p className="text-sm text-slate-600 dark:text-slate-300">
                                                 <span className="font-semibold">Inputs:</span> {item.inputs}
                                             </p>
                                             <p className="text-sm text-slate-800 dark:text-slate-100">
                                                 <span className="font-semibold">Result:</span> {item.result}
                                             </p>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
            
                     <ConfirmationModal
                         isOpen={isClearModalOpen}
                         onClose={() => setIsClearModalOpen(false)}
                         onConfirm={handleClearHistory}
                         title="Clear Calculation History"
                     >
                         <p>Are you sure you want to clear your recently saved calculations?</p>
                     </ConfirmationModal>
                 </>
             );
            };

            /**
            * @description Displays information about a single radionuclide.
            */

            const NuclideCard = ({ nuclide, radionuclides, isCompact = false, onNuclideClick, onDecaySeriesClick, displayHalfLifeUnit, favorites, toggleFavorite, onSendToCalculator, onAddToCompare, showBackButton, onBackClick }) => {
            
            // Get the global settings context
            const { settings } = React.useContext(SettingsContext);
            
            const getSourceLink = (sourceKey) => {
            const source = sources[sourceKey];
            return source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline" title={source.name}>[{Object.keys(sources).indexOf(sourceKey) + 1}]</a> : '';
            };
            
            // UPDATED: This component is now aware of the unit system
            const DataPoint = ({ label, value, unit, sourceKey, iconPath, iconSymbol, conversionType }) => {
            let displayValue = value;
            let displayUnit = unit;
            
            if (conversionType && !isNaN(safeParseFloat(value))) {
            const formatted = formatWithUnitSystem(safeParseFloat(value), conversionType, settings);
            displayValue = formatted.value;
            displayUnit = formatted.unit;
            } else if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            displayValue = 'N/A';
            }
            
            const shouldAppendUnit = displayUnit && typeof displayValue === 'string' && displayValue !== 'N/A' && displayValue.toLowerCase() !== 'none' && !displayValue.toLowerCase().includes(displayUnit.toLowerCase());
            
            return (
            <div className="flex items-start py-2">
              {iconPath && <Icon path={iconPath} className="w-5 h-5 text-sky-500 mr-3 flex-shrink-0 mt-1" />}
              {iconSymbol && <span className="text-2xl font-serif text-sky-500 mr-3 -mt-1 w-5 text-center">{iconSymbol}</span>}
              {!iconPath && !iconSymbol && <div className="w-5 mr-3 flex-shrink-0"></div>}
              <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center flex-wrap">
                      {displayValue}
                      {shouldAppendUnit ? <span className="ml-1">{displayUnit}</span> : <span className="ml-1">{displayUnit && React.isValidElement(displayValue) === false ? displayUnit.replace(value, '') : displayUnit}</span>}
                      {sourceKey && <sup className="ml-1"> {getSourceLink(sourceKey)}</sup>}
                  </p>
              </div>
            </div>
            );
            };
            
            // Helper to ensure safe emission type display
            const getEmissionTypes = () => {
            if (Array.isArray(nuclide.emissionType)) return nuclide.emissionType;
            if (typeof nuclide.emissionType === 'string') return [nuclide.emissionType];
            return [];
            };
            
            if (isCompact) {
            const styles = CATEGORY_STYLES[nuclide.category] || CATEGORY_STYLES['default'];
            const hlSeconds = parseHalfLifeToSeconds(nuclide.halfLife);
            const hlCategory = getHalfLifeCategory(hlSeconds);
            // Ensure best unit is used if not provided
            const hlUnit = displayHalfLifeUnit || getBestHalfLifeUnit(hlSeconds);
            
            return (
            <div
              onClick={() => onNuclideClick(nuclide)}
              className={`flex flex-col justify-between p-4 h-full bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg hover:ring-2 hover:ring-sky-500 cursor-pointer transition-all duration-200 border-l-4 ${styles.border} ${styles.hoverBg}`}
            >
              <div>
                  <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">{nuclide.name} <span className="text-slate-500 font-normal">({nuclide.symbol})</span></h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hlCategory.color} bg-opacity-10`}>{hlCategory.label}</span>
                  </div>
                  <div className="flex items-baseline text-sm mt-2"><Icon path={ICONS.hourglass} className="w-4 h-4 text-slate-400 mr-2"/><span className="font-medium text-slate-600 dark:text-slate-300">{formatHalfLife(nuclide.halfLife, hlUnit)}</span></div>
                  <div className="flex items-baseline text-sm mt-1"><Icon path={ICONS.radioactive} className="w-4 h-4 text-slate-400 mr-2"/><span className="text-slate-500 dark:text-slate-400">{getEmissionTypes().slice(0, 2).join(', ')}</span></div>
            
                  {nuclide.gammaConstant && (
                      <div className="flex items-baseline text-sm mt-1">
                          <span className="w-4 mr-2 text-center text-slate-400 font-serif">Γ</span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">
                              {safeParseFloat(nuclide.gammaConstant).toFixed(2)}
                          </span>
                      </div>
                  )}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>{nuclide.category} - {nuclide.commonality}</span>
              </div>
            </div>
            );
            }
            
            const isFavorite = favorites?.includes(nuclide.symbol);
            const hlSeconds = parseHalfLifeToSeconds(nuclide.halfLife);
            const hlCategory = getHalfLifeCategory(hlSeconds);
            const hlUnit = displayHalfLifeUnit || getBestHalfLifeUnit(hlSeconds);
            
            return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                      <a href={`https://en.wikipedia.org/wiki/${nuclide.name.replace(/ /g, '_')}`} target="_blank" rel="noopener noreferrer" className="hover:text-sky-500 hover:underline transition-colors">
                          {nuclide.name}
                      </a> ({nuclide.symbol})
                  </h2>
                  {nuclide.commonalityReason ? (
                      <Tooltip text={nuclide.commonalityReason} widthClass="w-72">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-3 py-1 rounded-full whitespace-nowrap cursor-help">
                              {nuclide.category} - {nuclide.commonality}
                              <Icon path={ICONS.help} className="w-4 h-4 opacity-75" />
                          </span>
                      </Tooltip>
                  ) : (
                      <span className="text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-3 py-1 rounded-full whitespace-nowrap">
                          {nuclide.category} - {nuclide.commonality}
                      </span>
                  )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                  {toggleFavorite && (
                      <button onClick={() => toggleFavorite(nuclide.symbol)} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'}`} title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                      </button>
                  )}
              </div>
            </div>
            
            <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-x-6">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider pb-1">Decay Properties</h3>
                  <DataPoint
                      label="Half-life"
                      value={<>{formatHalfLife(nuclide.halfLife, hlUnit)} <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${hlCategory.color} bg-opacity-10`}>{hlCategory.label}</span></>}
                      sourceKey={nuclide.sourceRef?.halfLife}
                      iconPath={ICONS.hourglass}
                  />
                  <DataPoint label="Decay Constant (λ)" value={standardizeScientificDisplay(nuclide.decayConstant)} sourceKey={nuclide.sourceRef?.decayConstant} iconSymbol="λ" />
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider pb-1">Physical Properties</h3>
                  <DataPoint label="Specific Activity" value={parseSpecificActivity(nuclide.specificActivity)} sourceKey={nuclide.sourceRef?.specificActivity} iconPath={ICONS.activity} conversionType="activity" />
            {nuclide.specificActivity && (
            <div className="flex items-start py-2">
            <div className="w-5 mr-3 flex-shrink-0"></div> {/* Spacer for alignment */}
            <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Mass Equivalence</p>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {(() => {
            const sa = parseSpecificActivity(nuclide.specificActivity); // Bq/g
            if (!sa) return 'N/A';
            
            // Calculate grams per Curie (g/Ci)
            // 1 Ci = 3.7e10 Bq
            // g/Ci = 3.7e10 / SA(Bq/g)
            const gPerCi = 3.7e10 / sa;
            
            if (gPerCi < 1e-6) return `${(gPerCi * 1e9).toPrecision(3)} ng/Ci`;
            if (gPerCi < 1e-3) return `${(gPerCi * 1e6).toPrecision(3)} µg/Ci`;
            if (gPerCi < 1) return `${(gPerCi * 1000).toPrecision(3)} mg/Ci`;
            return `${gPerCi.toPrecision(3)} g/Ci`;
            })()}
            </p>
            </div>
            </div>
            )}
                  <DataPoint label="Emission Type(s)" value={getEmissionTypes().join(', ')} sourceKey={nuclide.sourceRef?.emissionType} iconPath={ICONS.radioactive} />
                  {nuclide.gammaConstant && (
                      <DataPoint label="Gamma Constant" value={safeParseFloat(nuclide.gammaConstant)} sourceKey={nuclide.sourceRef?.gammaConstant} conversionType="gammaConstant" />
                  )}
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  <h3 className="text-sm font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider pb-1">Genealogy</h3>
                  <DataPoint label="Parent" value={<ClickableNuclide text={nuclide.parent} radionuclides={radionuclides} onNuclideClick={onNuclideClick} />} sourceKey={nuclide.sourceRef?.parent} />
                  <DataPoint label="Daughter" value={<ClickableNuclide text={nuclide.daughter} radionuclides={radionuclides} onNuclideClick={onNuclideClick} />} sourceKey={nuclide.sourceRef?.daughter} />
              </div>
              {(nuclide.shipping || nuclide.dValue) && (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      <h3 className="text-sm font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider pb-1">Transportation & Security</h3>
                      {nuclide.shipping && <DataPoint label="A₁ Limit" value={`${nuclide.shipping.A1 || 'N/A'}`} unit="TBq" iconPath={ICONS.transport} />}
                      {nuclide.shipping && <DataPoint label="A₂ Limit" value={`${nuclide.shipping.A2 || 'N/A'}`} unit="TBq" iconPath={ICONS.transport} />}
            
                      {nuclide.dValue && (
                          <DataPoint
                              label={
                                  <Tooltip text="Dangerous Quantity threshold (IAEA RS-G-1.9). Category 1/2 sources are >1000x and >10x D-Value respectively." widthClass="w-64">
                                      <span className="cursor-help border-b border-dotted border-slate-400 hover:border-sky-500 transition-colors">D-Value</span>
                                  </Tooltip>
                              }
                              value={`${nuclide.dValue}`}
                              unit="TBq"
                              iconPath={ICONS.transport}
                          />
                      )}
                  </div>
              )}
            </div>
            
            {nuclide.dosimetry && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Internal Dosimetry <sup className="ml-1">{getSourceLink('10CFR20')}</sup></h3>
                  <div className="grid md:grid-cols-2 gap-x-6">
                      <div className="flex items-start py-2">
                           <Icon path={ICONS.internalDose} className="w-5 h-5 text-sky-500 mr-3 flex-shrink-0 mt-1" />
                          <div>
                              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Annual Limit on Intake (ALI)</p>
                              <ul className="text-base font-semibold text-slate-800 dark:text-slate-100 list-disc list-inside mt-1 space-y-1">
                                  {Object.entries(nuclide.dosimetry.ALI || {}).map(([key, value]) => {
                                      const formatted = formatWithUnitSystem(value, 'ali', settings);
                                      const keyDisplay = key.replace('inhalation_', 'Inh. ').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                                      return <li key={key}>{`${keyDisplay}: ${formatted.value} ${formatted.unit}`}</li>;
                                  })}
                              </ul>
                          </div>
                      </div>
                      <div className="flex items-start py-2">
                          <div className="w-5 mr-3 flex-shrink-0"></div>
                          <div>
                               <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Derived Air Concentration (DAC)</p>
                               <ul className="text-base font-semibold text-slate-800 dark:text-slate-100 list-disc list-inside mt-1 space-y-1">
                                  {Object.entries(nuclide.dosimetry.DAC || {}).map(([key, value]) => {
                                      const formatted = formatWithUnitSystem(value, 'dac', settings);
                                      const keyDisplay = key.replace('inhalation_', 'Inh. ').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                                      return <li key={key}>{`${keyDisplay}: ${formatted.value} ${formatted.unit}`}</li>;
                                  })}
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Principal Emissions</h3>
              <div className="space-y-4">
                  <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">From Parent ({nuclide.symbol})</p>
                      <div className="grid md:grid-cols-3 gap-4 mt-1">
                         <DataPoint label="Alpha" value={(nuclide.emissionEnergies?.alpha || []).join(', ') || 'None'} iconSymbol="α"/>
                         <DataPoint label="Beta" value={`${(nuclide.emissionEnergies?.beta || []).join(', ') || 'None'}${nuclide.avgBetaEnergy ? ` | ${nuclide.avgBetaEnergy} (avg)` : ''}`} iconSymbol="β"/>
                         <DataPoint label="Gamma" value={(nuclide.emissionEnergies?.gamma || []).join(', ') || 'None'} iconSymbol="γ"/>
                      </div>
                  </div>
                  {nuclide.daughterEmissions && (
                       <div className="animate-fade-in">
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              From Daughter (<ClickableNuclide text={nuclide.daughterEmissions.from} radionuclides={radionuclides} onNuclideClick={onNuclideClick} />)
                          </p>
                          <div className="grid md:grid-cols-3 gap-4 mt-1">
                              <DataPoint label="Alpha" value={(nuclide.daughterEmissions.alpha || []).join(', ') || 'None'} iconSymbol="α"/>
                              <DataPoint label="Beta" value={(nuclide.daughterEmissions.beta || []).join(', ') || 'None'} iconSymbol="β"/>
                              <DataPoint label="Gamma" value={(nuclide.daughterEmissions.gamma || []).join(', ') || 'None'} iconSymbol="γ"/>
                          </div>
                      </div>
                  )}
              </div>
            </div>
            
            {/* UPDATED: Quick Actions (Visual Hierarchy) */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Calculators & Tools</h3>
            
              {/* 1. Calculator Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                  <Tooltip text="Calculate radioactive decay" widthClass="w-auto">
                      <button onClick={() => onSendToCalculator('calculator', nuclide.symbol)} className="px-3 py-2 text-sm bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-800 transition flex items-center gap-2">
                          <Icon path={ICONS.calculator} className="w-4 h-4" /> Decay Calc
                      </button>
                  </Tooltip>
                  {nuclide.gammaConstant && (
                      <Tooltip text="Calculate dose rate at distance" widthClass="w-auto">
                           <button onClick={() => onSendToCalculator('doseRate', nuclide.symbol)} className="px-3 py-2 text-sm bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-800 transition flex items-center gap-2">
                              <Icon path={ICONS.doseRate} className="w-4 h-4" /> Dose Rate
                          </button>
                      </Tooltip>
                  )}
                  {nuclide.gammaConstant && (
                      <Tooltip text="Calculate shielding requirements" widthClass="w-auto">
                           <button onClick={() => onSendToCalculator('shielding', nuclide.symbol)} className="px-3 py-2 text-sm bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-800 transition flex items-center gap-2">
                              <Icon path={ICONS.shield} className="w-4 h-4" /> Shielding
                          </button>
                      </Tooltip>
                  )}
                  {nuclide.shipping && (
                      <Tooltip text="Calculate shipping labels" widthClass="w-auto">
                           <button onClick={() => onSendToCalculator('transportation', nuclide.symbol)} className="px-3 py-2 text-sm bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-800 transition flex items-center gap-2">
                              <Icon path={ICONS.transport} className="w-4 h-4" /> Shipping
                          </button>
                      </Tooltip>
                  )}
              </div>
            
              {/* 2. Navigation Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {showBackButton && (
                      <button onClick={onBackClick} className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Icon path={ICONS.database} className="w-4 h-4" /> Back to List
                      </button>
                  )}
                  <button onClick={() => onAddToCompare(nuclide.symbol)} className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Icon path={ICONS.compare} className="w-4 h-4" /> Compare
                  </button>
                  {nuclide.decaySeriesId && (
                      <button onClick={() => onDecaySeriesClick(nuclide.decaySeriesId)} className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Icon path={ICONS.atom} className="w-4 h-4" /> Decay Chain
                      </button>
                  )}
              </div>
            </div>
            </div>
            );
            };

            /**
            * @description A searchable dropdown component for selecting items from a large list.
            */
            
            const SearchableSelect = ({ options, onSelect, placeholder }) => {
            
            const [inputValue, setInputValue] = React.useState('');
            const [isOpen, setIsOpen] = React.useState(false);
            const [activeIndex, setActiveIndex] = React.useState(-1);
            const containerRef = React.useRef(null);
            const listRef = React.useRef(null);
            const inputRef = React.useRef(null); // Added for auto-focus
            
            const handleClear = () => {
            setInputValue('');
            setIsOpen(false);
            setActiveIndex(-1);
            };
            
            const filteredOptions = React.useMemo(() => {
            if (!inputValue) return [];
            const normInput = normalizeString(inputValue);
            const commonalityOrder = {
            'Common': 3,
            'Moderate': 2,
            'Rare': 1
            };
            
            return options
            .filter(opt => normalizeString(opt.name).includes(normInput) || normalizeString(opt.symbol).includes(normInput))
            .sort((a, b) => {
            const aStartsWith = normalizeString(a.name).startsWith(normInput) || normalizeString(a.symbol).startsWith(normInput);
            const bStartsWith = normalizeString(b.name).startsWith(normInput) || normalizeString(b.symbol).startsWith(normInput);
            if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;
            const orderA = commonalityOrder[a.commonality] || 0;
            const orderB = commonalityOrder[b.commonality] || 0;
            if (orderB !== orderA) return orderB - orderA;
            return a.name.localeCompare(b.name);
            })
            .slice(0, 10);
            }, [inputValue, options]);
            
            React.useEffect(() => {
            const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
            setIsOpen(false);
            }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
            }, []);
            
            const handleKeyDown = (e) => {
            if (filteredOptions.length === 0) return;
            if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
            } else if (e.key === 'Enter') {
            if (activeIndex > -1 && filteredOptions[activeIndex]) {
            handleSelect(filteredOptions[activeIndex]);
            } else if (filteredOptions.length > 0) {
            handleSelect(filteredOptions[0]);
            }
            } else if (e.key === 'Escape') {
            setIsOpen(false);
            }
            };
            
            React.useEffect(() => {
            if (activeIndex !== -1 && listRef.current?.children[activeIndex]) {
            listRef.current.children[activeIndex].scrollIntoView({
            block: 'nearest'
            });
            }
            }, [activeIndex]);
            
            const handleSelect = (option) => {
            onSelect(option.symbol);
            setInputValue('');
            setIsOpen(false);
            setActiveIndex(-1);
            };
            
            return (
            <div className="relative w-full" ref={containerRef}>
            <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon path={ICONS.search} className="w-5 h-5 text-slate-400" />
            </div>
            <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if(inputValue) setIsOpen(true); }}
            placeholder={placeholder}
            className="w-full p-2 pl-10 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
            autoComplete="off"
            />
            
            {inputValue && (
            <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-sky-500 focus:outline-none"
            >
            <Icon path={ICONS.clear} className="w-5 h-5" />
            </button>
            )}
            </div>
            {isOpen && filteredOptions.length > 0 && (
            <ul ref={listRef} className="absolute z-30 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-72 overflow-y-auto">
                {filteredOptions.map((option, index) => {
                    const styles = CATEGORY_STYLES[option.category] || CATEGORY_STYLES['default'];
                    return (
                        <li
                            key={option.symbol}
                            onClick={() => handleSelect(option)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`p-3 pl-4 cursor-pointer text-slate-700 dark:text-slate-200 border-l-2 ${styles.border} ${styles.hoverBg} ${
                                index === activeIndex ? 'bg-sky-100 dark:bg-sky-900/50' : ''
                            }`}
                        >
                            {option.name} ({option.symbol})
                        </li>
                    )
                })}
                {filteredOptions.length > 4 && (
                    <div className="sticky bottom-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm p-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                            {Object.entries(CATEGORY_STYLES).filter(([key]) => key !== 'default').map(([category, styles]) => {
                                const bgColor = styles.border.replace('border-l-', 'bg-');
                                return (
                                    <div key={category} className="flex items-center gap-1.5">
                                        <div className={`w-2.5 h-2.5 rounded-full ${bgColor}`}></div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{category.replace('/', '/ ')}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </ul>
            )}
            </div>
            );
            };

            /**
            * @description A component that displays a prominent header for the selected nuclide
            * along with the detailed context display for use in calculators. It includes a clear button.
            * @param {{nuclide: object, onClear: () => void}} props - The nuclide object and the function to clear it.
            */
            
            const CalculatorNuclideInfo = ({ nuclide, onClear }) => {
            if (!nuclide) return null; // Don't render anything if no nuclide is selected
            
            return (
            <div className="my-2 animate-fade-in">
            
                <div className="relative text-center p-3 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700">
                    <h3 className="text-2xl font-bold text-sky-600 dark:text-sky-400">{nuclide.name}</h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">({nuclide.symbol})</p>
            
                    {/* The "Clear Nuclide" button */}
            
                    <button
            onClick={onClear}
            className="absolute top-1 right-1 p-2 rounded-full text-slate-400 hover:text-sky-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Change nuclide"
            aria-label="Clear selected nuclide"
            >
                        <Icon path={ICONS.clear} className="w-5 h-5" />
                    </button>
                </div>
            
                {/* The existing context display is now included here */}
            
                <NuclideContextDisplay nuclide={nuclide} />
            </div>
            );
            };

            /**
            * @description A React component that renders a line chart for a decay series using Chart.js.
            */
           
            const SeriesDecayChart = ({ chartData, useLogScale, theme }) => {
            const chartRef = React.useRef(null);
            const chartInstance = React.useRef(null);
            
            React.useEffect(() => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            
            if (chartRef.current && chartData) {
            
                const isDarkMode = theme === 'dark';
                const textColor = isDarkMode ? '#cbd5e1' : '#334155';
                const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
            
                const ctx = chartRef.current.getContext('2d');
            
                let safeMin = undefined;
                if (useLogScale && chartData.datasets) {
                    const allValues = chartData.datasets.flatMap(d => d.data);
                    const maxVal = Math.max(...allValues);
                    
                    if (maxVal > 0) {
                        // Use 5 orders of magnitude (standard 5-cycle log paper)
                        safeMin = maxVal * 1e-5; 
                    } else {
                        safeMin = 1e-5;
                    }
                }
            
                if (chartData.datasets && chartData.datasets.length > 0) {
                    // Assuming Total Activity is always index 0 (unshifted in parent)
                    if (chartData.datasets[0].label === 'Total Activity') {
                        chartData.datasets[0].borderColor = theme === 'dark' ? '#ffffff' : '#000000';
                    }
                }
            
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { boxWidth: 20, font: { size: 10 }, color: textColor }
                            },
                            title: {
                                display: true,
                                text: 'Decay Series Activity Over Time',
                                color: textColor
                            },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            x: {
                                title: { display: true, text: `Time (${chartData.timeUnit})`, color: textColor },
                                ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 20, color: textColor },
                                grid: { color: gridColor }
                            },
                            y: {
                                type: useLogScale ? 'logarithmic' : 'linear',
                                title: { display: true, text: `Activity (${useLogScale ? 'Log Scale' : 'Linear Scale'})`, color: textColor },
                                min: safeMin,
                                beginAtZero: !useLogScale,
                                ticks: {
                                    color: textColor,
                                    callback: function(value) {
                                        if (value !== 0 && (Math.abs(value) < 1e-3 || Math.abs(value) >= 1e4)) {
                                            return value.toExponential(1);
                                        }
                                        return value.toLocaleString();
                                    }
                                },
                                grid: { color: gridColor }
                            }
                        },
                        elements: {
                            line: { tension: 0 } // Disable curves to prevent wavy artifacts
                        }
                    }
                });
            }
            
            return () => {
                if (chartInstance.current) { chartInstance.current.destroy(); }
            };
            }, [chartData, useLogScale, theme]);
            
            const handleExport = () => {
            if (chartInstance.current) {
                const link = document.createElement('a');
                link.href = chartInstance.current.toBase64Image();
                link.download = 'decay-chart.png';
                link.click();
            }
            };
            
            return (
            <div className="mt-4">
                <div className="h-64">
                    <canvas ref={chartRef}></canvas>
                </div>
                <div className="text-center mt-2">
                    <button
                        onClick={handleExport}
                        className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-sky-100 dark:hover:bg-sky-800 transition font-semibold"
                    >
                        Export as PNG
                    </button>
                </div>
            </div>
            );
            };

            /**
            * @description A React component that renders a line chart for simple decay (Parent/Daughter) using Chart.js.
            */
            const DecayChart = ({ chartData, useLogScale, theme }) => {
             const chartRef = React.useRef(null);
             const chartInstance = React.useRef(null);
            
             React.useEffect(() => {
                 if (chartInstance.current) {
                     chartInstance.current.destroy();
                 }
            
                 if (chartRef.current && chartData) {
                     const isDarkMode = theme === 'dark';
                     const textColor = isDarkMode ? '#94a3b8' : '#475569';
                     const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
                     const legendColor = isDarkMode ? '#cbd5e1' : '#334155';
            
                     const ctx = chartRef.current.getContext('2d');
            
                     // LOG SCALE SAFETY LOGIC ---
                     let safeMin = undefined;
                     if (useLogScale) {
                         // Combine parent and daughter data to find the range
                         const allValues = [...chartData.parentData];
                         if (chartData.daughterData) {
                             allValues.push(...chartData.daughterData);
                         }
                         
                         const maxVal = Math.max(...allValues);
                         
                         if (maxVal > 0) {
                             // Set floor to 5 orders of magnitude below peak
                             safeMin = maxVal * 1e-5;
                         } else {
                             safeMin = 1e-5;
                         }
                     }
            
                     chartInstance.current = new Chart(ctx, {
                         type: 'line',
                         data: {
                             labels: chartData.labels,
                             datasets: [
                                 {
                                     label: chartData.parentName,
                                     data: chartData.parentData,
                                     borderColor: '#0284c7', // Sky-600
                                     backgroundColor: 'rgba(2, 132, 199, 0.1)',
                                     fill: true,
                                     tension: 0, // Straight lines for log scale accuracy
                                     pointRadius: 0,
                                     pointHoverRadius: 6
                                 },
                                 ...(chartData.daughterData ? [{
                                     label: chartData.daughterName,
                                     data: chartData.daughterData,
                                     borderColor: '#e11d48', // Rose-600
                                     backgroundColor: 'rgba(225, 29, 72, 0.1)',
                                     fill: true,
                                     tension: 0,
                                     pointRadius: 0,
                                     pointHoverRadius: 6
                                 }] : [])
                             ]
                         },
                         options: {
                             responsive: true,
                             maintainAspectRatio: false,
                             interaction: { mode: 'index', intersect: false },
                             scales: {
                                 x: {
                                     title: { display: true, text: `Time (${chartData.timeUnit})`, color: textColor },
                                     ticks: { color: textColor },
                                     grid: { color: gridColor }
                                 },
                                 y: {
                                     type: useLogScale ? 'logarithmic' : 'linear',
                                     title: { display: true, text: 'Activity', color: textColor, padding: { bottom: 10 }  },
                                     min: safeMin,
                                     beginAtZero: !useLogScale,
                                     ticks: { 
                                         color: textColor,
                                         callback: function(value) {
                                              if (value !== 0 && (Math.abs(value) < 1e-3 || Math.abs(value) >= 1e4)) {
                                                  return value.toExponential(1);
                                              }
                                              return value.toLocaleString();
                                         }
                                     },
                                     grid: { color: gridColor }
                                 }
                             },
                             plugins: {
                                 legend: { labels: { color: legendColor } }
                             }
                         }
                     });
                 }
            
                 return () => {
                     if (chartInstance.current) {
                         chartInstance.current.destroy();
                     }
                 };
             }, [chartData, useLogScale, theme]);
            
             const handleExport = () => {
                 if (chartInstance.current) {
                     const link = document.createElement('a');
                     link.href = chartInstance.current.toBase64Image();
                     const filename = `Decay_${chartData.parentName || 'Chart'}.png`;
                     link.download = filename;
                     link.click();
                 }
             };
            
             return (
                 <div className="mt-4">
                     <div className="h-64 w-full">
                         <canvas ref={chartRef}></canvas>
                     </div>
                     <div className="text-center mt-3">
                         <button
                             onClick={handleExport}
                             className="flex items-center justify-center gap-2 mx-auto px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
                         >
                             <Icon path={ICONS.download} className="w-3 h-3" />
                             Save Chart Image
                         </button>
                     </div>
                 </div>
             );
            };
