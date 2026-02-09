            //==============================================================================
            // --- GLOBAL SETTINGS & CONTEXT
            //==============================================================================
            
            const SettingsContext = React.createContext();
            
            const SettingsProvider = ({ children }) => {
            // UPDATED: Added unitSystem to the default settings.
            const defaultSettings = {
               theme: 'system', // 'light', 'dark', or 'system'
               unitSystem: 'conventional', // 'conventional' (Ci, rem) or 'si' (Bq, Sv)
            };
            
            const [settings, setSettings] = React.useState(() => {
               try {
                   const saved = localStorage.getItem('rad_tool_settings');
                   return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
               } catch (e) {
                   return defaultSettings;
               }
            });
            
            const updateSettings = (newSettings) => {
               setSettings(prev => {
                   const updated = { ...prev, ...newSettings };
                   localStorage.setItem('rad_tool_settings', JSON.stringify(updated));
                   return updated;
               });
            };
            
            React.useEffect(() => {
               const root = window.document.documentElement;
               if (settings.theme === 'dark') {
                   root.classList.add('dark');
               } else if (settings.theme === 'light') {
                   root.classList.remove('dark');
               } else { // System theme
                   const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                   const handleChange = () => {
                       if (mediaQuery.matches) { root.classList.add('dark'); }
                       else { root.classList.remove('dark'); }
                   };
                   mediaQuery.addEventListener('change', handleChange);
                   handleChange(); // Initial check
                   return () => mediaQuery.removeEventListener('change', handleChange);
               }
            }, [settings.theme]);
            
            return (
               <SettingsContext.Provider value={{ settings, updateSettings }}>
                   {children}
               </SettingsContext.Provider>
            );
            };

                                
            //==============================================================================
            // --- TOAST NOTIFICATION SYSTEM
            // Provides pop-up messages for user feedback (e.g., "Copied to clipboard").
            //==============================================================================
            
            /**
             * @description React Context to provide toast notification functions to any component.
             */
            
            const ToastContext = React.createContext();
            
            /**
             * @description Provider component that manages the state of toast notifications.
             * It renders the toasts and provides a function to add new ones.
             * @param {{children: React.ReactNode}} props - The child components that will have access to the context.
             */
            
            const ToastProvider = ({ children }) => {
                const [toasts, setToasts] = React.useState([]);
            
                const addToast = (message) => {
                    // Date.now() is not unique enough for loops. 
                    // Add Math.random() to ensure uniqueness.
                    const id = Date.now() + Math.random(); 
            
                    setToasts(prevToasts => {
                        // Limit to max 5 toasts to prevent screen flooding
                        const updated = [...prevToasts, { id, message }];
                        if (updated.length > 5) {
                            return updated.slice(updated.length - 5);
                        }
                        return updated;
                    });
            
                    setTimeout(() => {
                        removeToast(id);
                    }, 3000);
                };
            
                const removeToast = (id) => {
                    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
                };
            
                // A variable to hold the toast container's JSX
                const toastContainer = (
                    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
                        {toasts.map(toast => (
                            <div 
                                key={toast.id} 
                                className="animate-toast-in bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-4 py-3 rounded-lg shadow-lg flex items-center pointer-events-auto min-w-[250px]"
                            >
                                <Icon path={ICONS.check} className="w-5 h-5 mr-3 text-green-400" />
                                <span className="text-sm font-medium">{toast.message}</span>
                            </div>
                        ))}
                    </div>
                );
            
                return (
                    <ToastContext.Provider value={{ addToast }}>
                        {children}
                        {ReactDOM.createPortal(toastContainer, document.getElementById('toast-root'))}
                    </ToastContext.Provider>
                );
            };

            /**
            * @description Custom hook that delays updating a value until a specified time
            * has passed without that value changing. This is useful for preventing
            * expensive operations (like API calls or history updates) from running on
            * every keystroke.
            * @param {*} value The value to debounce.
            * @param {number} delay The delay in milliseconds.
            * @returns {*} The debounced value.
            */
           
            const useDebounce = (value, delay) => {
            // State to store the debounced value
            const [debouncedValue, setDebouncedValue] = React.useState(value);
            
            React.useEffect(() => {
            // Set up a timer to update the debounced value after the delay
            const handler = setTimeout(() => {
               setDebouncedValue(value);
            }, delay);
            
            // This is the cleanup function that runs every time the dependency [value] changes.
            // It clears the previous timer, effectively resetting it. The timer will only
            // complete if the user stops changing the value for the duration of the delay.
            return () => {
               clearTimeout(handler);
            };
            }, [value, delay]); // Only re-run the effect if value or delay changes
            
            return debouncedValue;
            };
            
            /**
             * @description Custom hook to easily access the toast context's `addToast` function.
             * @returns {{addToast: (message: string) => void}}
             */
            
            const useToast = () => React.useContext(ToastContext);
            
            /**
            * @description Custom hook to manage a list of recent calculations in localStorage.
            * @returns {{addHistory: (item: object) => void}}
            */
            
            const useCalculationHistory = () => {
            const addHistory = React.useCallback((item) => {
            try {
               const history = JSON.parse(localStorage.getItem('rad_tool_calculation_history') || '[]');
               const newHistory = [item, ...history];
               // Keep only the 5 most recent calculations
               const limitedHistory = newHistory.slice(0, 5);
               localStorage.setItem('rad_tool_calculation_history', JSON.stringify(limitedHistory));
            } catch (e) {
               console.error("Failed to update calculation history:", e);
            }
            }, []); // Empty dependency array makes this function stable
            return { addHistory };
            };
