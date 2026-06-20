        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
        import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
        import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyDFaSTwrX38nSEPudYm-8iJLwdoJXGCfM8",
            authDomain: "strata-ca81c.firebaseapp.com",
            projectId: "strata-ca81c",
            storageBucket: "strata-ca81c.firebasestorage.app",
            messagingSenderId: "863301861425",
            appId: "1:863301861425:web:a3b02f32b262df517e5510",
            measurementId: "G-PWVNP4LW7T"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        let globalCloudData = {}; 
        let chartInstance = null; 
        let isRealtime = false;
        let currentAdviceScope = 'current';

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                document.getElementById('user-display-name').innerText = user.displayName || "STRATA User";
                isRealtime = localStorage.getItem('realtimeMode') === 'on';
                
                try {
                    const docSnap = await getDoc(doc(db, "users", user.uid));
                    document.getElementById('loader').classList.add('hidden');

                    if (docSnap.exists() && docSnap.data().carbonFootprint) {
                        globalCloudData = docSnap.data();
                        
                        let allTimeCO2 = 0;
                        // Accumulate all existing buckets dynamically so total liability is accurate
                        Object.keys(globalCloudData).forEach(key => {
                            if(key.startsWith('month_') || key.startsWith('quarter_') || key.startsWith('year_') || key.startsWith('realtime_')) {
                                allTimeCO2 += globalCloudData[key];
                            }
                        });
                        
                        if(allTimeCO2 === 0) allTimeCO2 = globalCloudData.carbonFootprint || 0;

                        // Deduct logged actions from home.html
                        const totalReduced = (globalCloudData.reduced || 0) + (globalCloudData.restored || 0);
                        let finalNetCO2 = allTimeCO2 - totalReduced;
                        if (finalNetCO2 < 0) finalNetCO2 = 0;

                        document.getElementById('rep-co2').innerText = finalNetCO2.toLocaleString('en-IN', {maximumFractionDigits: 1});
                        document.getElementById('rep-invest').innerText = "\u20B9" + Math.round(finalNetCO2 * 15).toLocaleString('en-IN');
                        
                        document.getElementById('data-state').classList.remove('hidden');
                        
                        if (isRealtime) {
                            document.getElementById('historical-controls').classList.add('hidden');
                            document.getElementById('realtime-controls').classList.remove('hidden');
                            
                            const tz = localStorage.getItem('userTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
                            const now = new Date();
                            const todayStr = new Intl.DateTimeFormat('en-CA', {timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'}).format(now);
                            document.getElementById('realtime-date-picker').value = todayStr;
                            
                            window.renderRealtimeChart();
                        } else {
                            window.switchChart('monthly');
                        }
                    }
                } catch (error) { console.error("Error:", error); }
            } else {
                window.location.href = 'auth.html';
            }
        });

        window.renderRealtimeChart = function() {
            const selectedDate = document.getElementById('realtime-date-picker').value; 
            if (!selectedDate) return;

            const tz = localStorage.getItem('userTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
            let dateData = [];
            
            Object.keys(globalCloudData).forEach(key => {
                if (key.startsWith('realtime_')) {
                    const isoString = key.replace('realtime_', '');
                    const d = new Date(isoString);
                    const dStr = new Intl.DateTimeFormat('en-CA', {timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'}).format(d);
                    
                    if (dStr === selectedDate) {
                        const timeStr = new Intl.DateTimeFormat('en-US', {timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true}).format(d);
                        dateData.push({ timeStr: timeStr, timestamp: d.getTime(), value: globalCloudData[key] });
                    }
                }
            });

            dateData.sort((a,b) => a.timestamp - b.timestamp);

            let labels = [];
            let chartData = [];
            if (dateData.length === 0) {
                labels = ["12 AM", "6 AM", "12 PM", "6 PM"];
                chartData = [0, 0, 0, 0];
            } else if (dateData.length === 1) {
                labels = ["Start", dateData[0].timeStr, "End"];
                chartData = [0, dateData[0].value, 0];
            } else {
                dateData.forEach(d => {
                    labels.push(d.timeStr);
                    chartData.push(d.value);
                });
            }

            renderChart(labels, chartData, 'Hourly CO\u2082 (kg)');
            
            const dayTotal = chartData.reduce((a, b) => a + b, 0);
            if (currentAdviceScope === 'current') {
                updateTopCardsAndAdvice(dayTotal);
            } else {
                updateTopCardsAndAdvice(calculateAllTimeRealtime());
            }
        }

        window.calculateAllTimeRealtime = function() {
            let total = 0;
            Object.keys(globalCloudData).forEach(key => {
                if (key.startsWith('realtime_')) {
                    total += globalCloudData[key];
                }
            });
            return total;
        }

        window.setAdviceScope = function(scope) {
            currentAdviceScope = scope;
            document.getElementById('btn-scope-current').className = "tab-btn text-[10px]" + (scope==='current' ? ' active' : '');
            document.getElementById('btn-scope-all').className = "tab-btn text-[10px]" + (scope==='all-time' ? ' active' : '');
            if (isRealtime) {
                window.renderRealtimeChart();
            } else {
                // Determine which historical tab is active
                const isMonthly = document.getElementById('tab-monthly').classList.contains('active');
                const isQuarterly = document.getElementById('tab-quarterly').classList.contains('active');
                if (isMonthly) window.switchChart('monthly');
                else if (isQuarterly) window.switchChart('quarterly');
                else window.switchChart('yearly');
            }
        }

        window.switchChart = function(type) {
            document.getElementById('tab-monthly').className = "tab-btn" + (type==='monthly' ? ' active' : '');
            document.getElementById('tab-quarterly').className = "tab-btn" + (type==='quarterly' ? ' active' : '');
            document.getElementById('tab-yearly').className = "tab-btn" + (type==='yearly' ? ' active' : '');

            let labels = [];
            let chartData = [];

            if (type === 'monthly') {
                labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                for(let i=1; i<=12; i++) { chartData.push(globalCloudData["month_" + i] || 0); }
            } 
            else if (type === 'quarterly') {
                labels = ["Q1", "Q2", "Q3", "Q4"];
                chartData = [
                    globalCloudData["quarter_Q1"] || 0,
                    globalCloudData["quarter_Q2"] || 0,
                    globalCloudData["quarter_Q3"] || 0,
                    globalCloudData["quarter_Q4"] || 0
                ];
            } 
            else if (type === 'yearly') {
                // THE DYNAMIC YEAR SCANNER
                // Find all years the user actually entered in the database
                let availableYears = Object.keys(globalCloudData)
                    .filter(k => k.startsWith("year_"))
                    .map(k => parseInt(k.replace("year_", "")))
                    .sort((a,b) => a - b);
                
                if(availableYears.length === 0) {
                    // Fallback if no yearly data exists
                    const y = new Date().getFullYear();
                    labels = [(y-1).toString(), y.toString(), (y+1).toString()];
                    chartData = [0, 0, 0];
                } else if (availableYears.length === 1) {
                    // Pad with empty years if they only entered one (e.g., just 1999) so graph looks nice
                    const y = availableYears[0];
                    labels = [(y-1).toString(), y.toString(), (y+1).toString()];
                    chartData = [0, globalCloudData["year_"+y], 0];
                } else {
                    // Plot exactly from their lowest year to their highest year
                    const minYear = availableYears[0];
                    const maxYear = availableYears[availableYears.length - 1];
                    for(let y = minYear; y <= maxYear; y++) {
                        labels.push(y.toString());
                        chartData.push(globalCloudData["year_"+y] || 0);
                    }
                }
            }

            renderChart(labels, chartData, 'Recorded CO\u2082 (kg)');
            const total = chartData.reduce((a, b) => a + b, 0);
            if (currentAdviceScope === 'current') {
                updateTopCardsAndAdvice(total);
            } else {
                updateTopCardsAndAdvice(calculateAllTimeHistorical());
            }
        }

        window.calculateAllTimeHistorical = function() {
            let total = 0;
            Object.keys(globalCloudData).forEach(key => {
                if(key.startsWith('month_') || key.startsWith('quarter_') || key.startsWith('year_')) {
                    total += globalCloudData[key];
                }
            });
            if(total === 0) total = globalCloudData.carbonFootprint || 0;
            return total;
        }

        window.updateTopCardsAndAdvice = function(generatedCO2) {
            let finalNetCO2 = generatedCO2;

            // Only apply all-time reductions when viewing the All-Time scope.
            // Applying global reductions to a single selected day mathematically masks it to 0.
            if (currentAdviceScope === 'all-time') {
                const totalReduced = (globalCloudData.reduced || 0) + (globalCloudData.restored || 0);
                finalNetCO2 = generatedCO2 - totalReduced;
            }

            // Allow negative net scores in the top card if reductions exceed generation
            document.getElementById('rep-co2').innerText = finalNetCO2.toLocaleString('en-IN', {maximumFractionDigits: 1});
            const cost = finalNetCO2 > 0 ? Math.round(finalNetCO2 * 15) : 0;
            document.getElementById('rep-invest').innerText = "\u20B9" + cost.toLocaleString('en-IN');
            
            renderAdvice(finalNetCO2);
        }

        window.renderAdvice = function(totalCO2) {
            const container = document.getElementById('advice-content');
            if (totalCO2 <= 0) {
                container.innerHTML = `<div class="glass-card p-6 rounded-3xl text-center text-slate-500 text-sm border border-white/5">No emissions recorded for this timeframe. You're completely green!</div>`;
                return;
            }

            let months = 1;
            if (currentAdviceScope === 'all-time') {
                let availableYears = Object.keys(globalCloudData).filter(k => k.startsWith("year_"));
                months = Math.max(1, availableYears.length) * 12;
            } else if (!isRealtime) {
                if (document.getElementById('tab-monthly').classList.contains('active')) months = 12;
                else if (document.getElementById('tab-quarterly').classList.contains('active')) months = 12;
                else if (document.getElementById('tab-yearly').classList.contains('active')) {
                    let availableYears = Object.keys(globalCloudData).filter(k => k.startsWith("year_"));
                    months = Math.max(1, availableYears.length) * 12;
                }
            } else {
                months = 1/30;
            }

            window.currentAdviceState = {
                totalCO2: totalCO2,
                months: months,
                treePct: 33,
                cyclePct: 33,
                recyclePct: 33
            };

            container.innerHTML = `
                <div class="glass-card p-5 rounded-3xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                    <h3 class="text-sm font-semibold text-[#74C69D] mb-4 uppercase tracking-wider flex items-center gap-2"><span class="text-emerald-400">&#9851;</span> Green Action Allocator</h3>
                    <p class="text-xs text-slate-400 mb-4">Offset footprint with physical actions. Unrealistic goals are capped by benchmarks.</p>
                    <div class="space-y-4" id="sliders-container"></div>
                </div>
                <div id="portfolio-container" class="mt-4"></div>
            `;

            window.updateAdviceUI();
        }

        window.updateAdviceUI = function() {
            const state = window.currentAdviceState;
            
            const maxTreeCO2 = 50 * state.months; 
            const maxCycleCO2 = 20 * state.months; 
            const maxRecycleCO2 = 28 * state.months; 

            let reqTreeCO2 = state.totalCO2 * (state.treePct / 100);
            let reqCycleCO2 = state.totalCO2 * (state.cyclePct / 100);
            let reqRecycleCO2 = state.totalCO2 * (state.recyclePct / 100);

            let actTreeCO2 = Math.min(reqTreeCO2, maxTreeCO2);
            let actCycleCO2 = Math.min(reqCycleCO2, maxCycleCO2);
            let actRecycleCO2 = Math.min(reqRecycleCO2, maxRecycleCO2);

            let totalPhysicalCO2 = actTreeCO2 + actCycleCO2 + actRecycleCO2;
            
            if (totalPhysicalCO2 > state.totalCO2) {
                const ratio = state.totalCO2 / totalPhysicalCO2;
                actTreeCO2 *= ratio;
                actCycleCO2 *= ratio;
                actRecycleCO2 *= ratio;
                totalPhysicalCO2 = state.totalCO2;
            }

            const remainingCO2 = state.totalCO2 - totalPhysicalCO2;

            const treesNeeded = Math.ceil(actTreeCO2 / 10);
            const cycleKm = Math.ceil(actCycleCO2 / 0.2);
            const recycleKg = Math.ceil(actRecycleCO2 / 1.4);

            document.getElementById('sliders-container').innerHTML = `
                <div>
                    <div class="flex justify-between items-end mb-1">
                        <span class="text-white text-xs font-bold flex items-center gap-1">&#127795; Plant Trees</span>
                        <span class="text-emerald-400 font-mono font-bold text-sm">${treesNeeded} <span class="text-[10px] text-slate-400">(${actTreeCO2.toFixed(1)}kg)</span></span>
                    </div>
                    <input type="range" min="0" max="100" value="${state.treePct}" class="w-full accent-emerald-500" oninput="window.currentAdviceState.treePct=this.value; window.updateAdviceUI()">
                    ${reqTreeCO2 > maxTreeCO2 ? '<p class="text-[9px] text-red-400 mt-1">Benchmark Limit Reached (Max ' + Math.ceil(maxTreeCO2/10) + ' trees)</p>' : ''}
                </div>
                
                <div>
                    <div class="flex justify-between items-end mb-1">
                        <span class="text-white text-xs font-bold flex items-center gap-1">&#128690; Cycle Instead</span>
                        <span class="text-blue-400 font-mono font-bold text-sm">${cycleKm} km <span class="text-[10px] text-slate-400">(${actCycleCO2.toFixed(1)}kg)</span></span>
                    </div>
                    <input type="range" min="0" max="100" value="${state.cyclePct}" class="w-full accent-blue-500" oninput="window.currentAdviceState.cyclePct=this.value; window.updateAdviceUI()">
                    ${reqCycleCO2 > maxCycleCO2 ? '<p class="text-[9px] text-red-400 mt-1">Benchmark Limit Reached (Max ' + Math.ceil(maxCycleCO2/0.2) + ' km)</p>' : ''}
                </div>

                <div>
                    <div class="flex justify-between items-end mb-1">
                        <span class="text-white text-xs font-bold flex items-center gap-1">&#9851; Recycle E-Waste</span>
                        <span class="text-teal-400 font-mono font-bold text-sm">${recycleKg} kg <span class="text-[10px] text-slate-400">(${actRecycleCO2.toFixed(1)}kg)</span></span>
                    </div>
                    <input type="range" min="0" max="100" value="${state.recyclePct}" class="w-full accent-teal-500" oninput="window.currentAdviceState.recyclePct=this.value; window.updateAdviceUI()">
                    ${reqRecycleCO2 > maxRecycleCO2 ? '<p class="text-[9px] text-red-400 mt-1">Benchmark Limit Reached (Max ' + Math.ceil(maxRecycleCO2/1.4) + ' kg)</p>' : ''}
                </div>
            `;

            const portfolioContainer = document.getElementById('portfolio-container');
            if (remainingCO2 > 0.1) {
                const suggestedInvestment = Math.round(remainingCO2 * 15);
                const allocs = [
                    {name: "Tata Power", perc: 0.30, color: "border-[#74C69D]"},
                    {name: "Adani Green", perc: 0.25, color: "border-[#74C69D]"},
                    {name: "IREDA", perc: 0.20, color: "border-[#74C69D]"},
                    {name: "Suzlon Energy", perc: 0.15, color: "border-[#74C69D]"},
                    {name: "Green Bonds", perc: 0.10, color: "border-slate-600 opacity-80"}
                ];

                let html = `<div class="glass-card p-5 rounded-3xl border border-[#74C69D]/20 shadow-[0_0_20px_rgba(116,198,157,0.05)]">
                    <h3 class="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-2"><span class="text-[#74C69D]">&#128188;</span> Portfolio Offset</h3>
                    <p class="text-xs text-slate-400 mb-4">Invest in Green Stocks to offset the remaining <span class="text-[#74C69D] font-bold">${remainingCO2.toFixed(1)} kg</span>.</p>
                    <div class="space-y-2">`;
                
                allocs.forEach(a => {
                    const amt = Math.round(suggestedInvestment * a.perc).toLocaleString('en-IN');
                    html += `
                        <div class="flex justify-between items-center border-l-2 ${a.color} pl-3 py-1 bg-white/5 rounded-r-lg">
                            <div><p class="font-bold text-xs text-white">${a.name}</p></div>
                            <div class="text-right"><p class="font-mono text-xs text-[#74C69D] font-bold">&#8377;${amt}</p></div>
                        </div>`;
                });
                html += `</div></div>`;
                portfolioContainer.innerHTML = html;
            } else {
                portfolioContainer.innerHTML = `<div class="glass-card p-5 rounded-3xl border border-emerald-500/20 text-center"><p class="text-xs text-emerald-400 font-bold">100% of footprint covered by physical actions!</p></div>`;
            }
        }

        function renderChart(labels, chartData, datasetLabel) {
            if (chartInstance) { chartInstance.destroy(); }

            const ctx = document.getElementById('carbonChart').getContext('2d');
            let gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(116, 198, 157, 0.5)');
            gradient.addColorStop(1, 'rgba(116, 198, 157, 0.0)');

            chartInstance = new Chart(ctx, {
                type: 'line', 
                data: {
                    labels: labels,
                    datasets: [{
                        label: datasetLabel,
                        data: chartData,
                        backgroundColor: gradient,
                        borderColor: '#74C69D',
                        borderWidth: 3,
                        pointBackgroundColor: '#0B0C10',
                        pointBorderColor: '#74C69D',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                        y: { 
                            grid: { color: 'rgba(255,255,255,0.05)' }, 
                            ticks: { color: '#94a3b8' },
                            beginAtZero: true 
                        }
                    }
                }
            });
        }
