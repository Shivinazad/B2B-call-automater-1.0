const logContainer = document.getElementById('logContainer');
const launchBtn = document.getElementById('launchBtn');
const userInput = document.getElementById('userInput');
const navStatusText = document.getElementById('navStatusText');



function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry flex items-center gap-4';
    
    let dotColor = 'bg-neutral-200';
    if(type === 'loading') dotColor = 'bg-black animate-pulse';
    if(type === 'action') dotColor = 'bg-orange-500';
    if(type === 'success') dotColor = 'bg-green-500';

    logEntry.innerHTML = `
        <div class="w-2 h-2 rounded-full ${dotColor}"></div>
        <div class="flex-1">
            <p class="text-sm font-medium text-black">${message}</p>
        </div>
        <span class="text-[10px] font-bold text-neutral-300">${time}</span>
    `;
    
    if (logContainer.querySelector('.italic')) logContainer.innerHTML = '';
    
    logContainer.prepend(logEntry); // Newest on top like ElevenLabs feeds
    logContainer.scrollTop = 0;
}

launchBtn.addEventListener('click', () => {
    const val = userInput.value;
    if(!val) return;

    navStatusText.innerText = 'Active';
    navStatusText.classList.remove('text-neutral-300');
    navStatusText.classList.add('text-black');

    addLog(`Targeting Request: ${val}`, 'info');
    
    setTimeout(() => addLog("Searching IndiaMart B2B Directory...", "loading"), 800);
    setTimeout(() => addLog("Found 12 vendors in Ludhiana. Filtering by GST status...", "success"), 2500);
    setTimeout(() => {
        addLog("Dialing Vendor: Sharma Garments...", "action");
        document.getElementById('dealValue').innerText = "₹1,200";
        document.getElementById('dealValue').classList.add('text-green-500');
    }, 4500);
});

function movePill(type) {
    const pill = document.getElementById('navPill');
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');

    if (type === 'signup') {
        // Move to Right and turn Orange
        pill.style.transform = 'translateX(82px)';
        pill.classList.add('pill-orange');
        
        // Update Text Colors
        signupLink.classList.add('pill-active-text');
        signupLink.classList.remove('pill-inactive-text');
        loginLink.classList.add('pill-inactive-text');
        loginLink.classList.remove('pill-active-text');
    } else {
        // Move to Left and turn Black
        pill.style.transform = 'translateX(0px)';
        pill.classList.remove('pill-orange');
        
        // Update Text Colors
        loginLink.classList.add('pill-active-text');
        loginLink.classList.remove('pill-inactive-text');
        signupLink.classList.add('pill-inactive-text');
        signupLink.classList.remove('pill-active-text');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const observerOptions = {
        root: null, // Watch the viewport
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the 'active' class to trigger the CSS transition
                entry.target.classList.add("active");
                
                // Optional: Stop watching once it has revealed
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select all elements with the 'reveal' class and start observing
    const revealElements = document.querySelectorAll(".reveal");
    revealElements.forEach(el => observer.observe(el));
});

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize the grid with Sourcing content immediately
    if (typeof switchImpact === "function") {
        switchImpact('sourcing');
    }

    // 2. Your existing Scroll Reveal logic
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));
});

const impactData = {
    sourcing: `
    <div class="md:row-span-2 relative rounded-[32px] overflow-hidden glass-orange h-[600px] animate-fadeIn shadow-xl p-8 flex flex-col justify-between">
        <div class="space-y-6">
            <div class="flex gap-2">
                <span class="bg-black text-white text-[9px] font-black px-3 py-1.5 rounded-md uppercase">Case Study #402</span>
                <span class="bg-white/40 backdrop-blur-md text-black text-[9px] font-black px-3 py-1.5 rounded-md">₹1.2L SAVED</span>
            </div>
            <h3 class="text-5xl font-extrabold text-[#9a3412] leading-[1.05] tracking-tighter">
                Ludhiana Textiles secured 5k units below market avg.
            </h3>
        </div>
        
        <div class="pt-8 border-t border-black/10 flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-[#f15a2b] text-lg font-black shadow-sm">LT</div>
            <div>
                <p class="text-black/60 text-xs font-black uppercase tracking-widest">Verified Hub</p>
                <p class="text-black/80 text-sm font-medium">Ludhiana, Punjab</p>
            </div>
        </div>
    </div>

    <div class="relative rounded-[32px] overflow-hidden glass-card p-8 animate-fadeIn shadow-lg flex flex-col justify-between">
         <div class="flex justify-between items-start">
            <div class="space-y-1">
                <h3 class="text-3xl font-black text-[#f15a2b]">10,000+</h3>
                <p class="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Vendors Verified</p>
            </div>
            <div class="w-10 h-10 bg-[#f15a2b]/10 rounded-xl flex items-center justify-center border border-[#f15a2b]/20">
                <svg class="w-5 h-5 text-[#f15a2b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
         </div>
         <div class="mt-6">
            <div class="h-10 bg-white/40 backdrop-blur-sm rounded-lg flex items-center px-4 justify-between border border-white/60">
                <span class="text-[10px] text-neutral-600 font-bold">GSTIN: 07AABC...</span>
                <span class="text-[9px] text-green-600 font-black">ACTIVE</span>
            </div>
         </div>
    </div>

    <div class="relative rounded-[32px] overflow-hidden glass-card p-8 animate-fadeIn shadow-lg">
         <div class="mb-8">
            <h3 class="text-3xl font-black text-black">45 Hubs</h3>
            <p class="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Pan-India Coverage</p>
         </div>
         <div class="flex flex-wrap gap-2">
            <span class="text-[10px] font-black text-neutral-600 bg-white/60 px-4 py-2 rounded-lg border border-white">SURAT</span>
            <span class="text-[10px] font-black text-neutral-600 bg-white/60 px-4 py-2 rounded-lg border border-white">TIRUPPUR</span>
         </div>
    </div>

    <div class="md:col-span-2 relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#fff7ed]/80 to-[#ffedd5]/80 backdrop-blur-xl p-10 flex flex-col md:flex-row items-center gap-10 animate-fadeIn border border-white shadow-xl">
        <div class="flex-1 space-y-6">
            <span class="bg-[#f15a2b] text-white text-[10px] font-black px-4 py-1.5 rounded-full inline-block shadow-lg shadow-orange-500/20">DEVELOPER SDK</span>
            <h3 class="text-4xl font-extrabold text-black tracking-tighter leading-tight">Integrate the Engine.</h3>
            <p class="text-neutral-600 text-sm font-medium">Sync verified vendor data directly to Tally or SAP.</p>
        </div>
        <div class="w-80 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 font-mono text-[11px] text-orange-200 shadow-2xl">
            <p><span class="text-pink-400">const</span> agent = Sniper.init();</p>
            <p>agent.search({ location: <span class="text-white">'Ludhiana'</span> });</p>
        </div>
    </div>
`
,
negotiation: `
<div class="md:row-span-2 relative rounded-[32px] overflow-hidden bg-[rgba(241,90,43,0.15)] backdrop-blur-xl h-[600px] animate-fadeIn shadow-xl border border-white/40 flex flex-col">
    <div class="p-10 flex-1">
        <h3 class="text-6xl font-black text-[#9a3412] tracking-tighter">₹4.2 Cr</h3>
        <p class="text-orange-800 text-[10px] font-black uppercase tracking-[0.2em] mt-2 mb-10">Total Savings Negotiated</p>
        
        <div class="space-y-3">
            <p class="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-4">Live Agent Sentiment</p>
            <div class="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex justify-between items-center">
                <div>
                    <p class="text-xs font-bold text-black">Shree Ram Exports</p>
                    <p class="text-[9px] text-orange-700">Tone: High Urgency</p>
                </div>
                <span class="text-xs font-black text-green-600">SUCCESS</span>
            </div>
            <div class="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex justify-between items-center opacity-80">
                <div>
                    <p class="text-xs font-bold text-black">Vardhman Steels</p>
                    <p class="text-[9px] text-orange-700">Tone: Cooperative</p>
                </div>
                <span class="text-xs font-black text-green-600">LOCKED</span>
            </div>
        </div>
    </div>
    <div class="bg-white/30 backdrop-blur-md p-8 border-t border-white/20">
        <div class="flex justify-between items-end gap-1.5 h-16">
            <div class="flex-1 bg-orange-500/20 rounded-t-sm h-[40%]"></div>
            <div class="flex-1 bg-orange-500/40 rounded-t-sm h-[65%]"></div>
            <div class="flex-1 bg-[#f15a2b] rounded-t-sm h-[90%] shadow-lg"></div>
            <div class="flex-1 bg-orange-500/30 rounded-t-sm h-[55%]"></div>
        </div>
    </div>
</div>

<div class="relative rounded-[32px] overflow-hidden bg-white/40 backdrop-blur-xl p-8 animate-fadeIn shadow-lg border border-white/60">
    <div class="flex justify-between items-start">
        <div>
            <h3 class="text-3xl font-black text-[#f15a2b]">14s Avg.</h3>
            <p class="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Response Latency</p>
        </div>
        <div class="flex gap-1 h-5 items-end">
            <div class="w-1.5 bg-[#f15a2b]/20 h-2 rounded-full"></div>
            <div class="w-1.5 bg-[#f15a2b] h-5 rounded-full"></div>
            <div class="w-1.5 bg-[#f15a2b]/40 h-3 rounded-full"></div>
        </div>
    </div>
    <div class="mt-8 flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-[#f15a2b] animate-ping"></div>
        <span class="text-[10px] font-bold text-neutral-600 uppercase">Hinglish Model: Active</span>
    </div>
</div>

<div class="relative rounded-[32px] overflow-hidden bg-[rgba(245,158,11,0.15)] backdrop-blur-xl p-8 animate-fadeIn shadow-lg border border-white/60">
    <h3 class="text-3xl font-black text-[#b45309]">88%</h3>
    <p class="text-amber-700 text-[10px] font-black uppercase tracking-widest mb-6">Negotiation Win Rate</p>
    <div class="bg-white/40 rounded-xl p-3 border border-white/60">
        <div class="flex justify-between items-center">
            <span class="text-[10px] font-bold text-amber-900">UPFRONT DEPOSIT</span>
            <span class="text-[10px] font-black text-green-600">VERIFIED</span>
        </div>
    </div>
</div>

<div class="md:col-span-2 relative rounded-[32px] overflow-hidden bg-white/40 backdrop-blur-xl p-10 flex flex-col md:flex-row items-center gap-10 animate-fadeIn border border-white/60 shadow-2xl">
    <div class="flex-1 space-y-6">
        <div class="flex items-center gap-3">
            <span class="bg-[#f15a2b] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-lg shadow-orange-500/20">Arjun Voice Lab</span>
            <div class="h-px flex-1 bg-black/5"></div>
        </div>
        <h3 class="text-4xl font-extrabold text-black tracking-tighter leading-tight">Secure bulk deals via telephony.</h3>
        <div class="flex gap-4">
            <div class="bg-white/60 border border-white rounded-2xl p-4 flex-1">
                <p class="text-[9px] font-black text-neutral-400 uppercase mb-1">Target Match</p>
                <p class="text-xl font-bold text-black">94.2%</p>
            </div>
            <div class="bg-white/60 border border-white rounded-2xl p-4 flex-1">
                <p class="text-[9px] font-black text-neutral-400 uppercase mb-1">Sentiment</p>
                <p class="text-xl font-bold text-emerald-600">Optimized</p>
            </div>
        </div>
    </div>
    <div class="w-64 h-32 flex items-center justify-center gap-1.5 px-6 bg-white/20 rounded-2xl border border-white/40 backdrop-blur-sm">
        <div class="w-2 bg-[#f15a2b] h-8 rounded-full animate-bounce [animation-delay:0.1s]"></div>
        <div class="w-2 bg-[#f15a2b]/60 h-16 rounded-full animate-bounce [animation-delay:0.3s]"></div>
        <div class="w-2 bg-[#f15a2b]/40 h-12 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div class="w-2 bg-[#f15a2b] h-20 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        <div class="w-2 bg-[#f15a2b]/30 h-10 rounded-full animate-bounce [animation-delay:0.1s]"></div>
    </div>
</div>
`
};

function switchImpact(tab) {
    const grid = document.getElementById('impactGrid');
    const sourcingBtn = document.getElementById('sourcingTab');
    const negotiationBtn = document.getElementById('negotiationTab');

    // 1. Fade out current content
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(10px)';

    setTimeout(() => {
        // 2. Inject new content
        grid.innerHTML = impactData[tab];

        // 3. Update button styles
        if (tab === 'sourcing') {
            sourcingBtn.className = "px-6 py-2 rounded-full text-xs font-bold bg-white shadow-sm transition-all";
            negotiationBtn.className = "px-6 py-2 rounded-full text-xs font-bold text-neutral-400 hover:text-black transition-all";
        } else {
            negotiationBtn.className = "px-6 py-2 rounded-full text-xs font-bold bg-white shadow-sm transition-all";
            sourcingBtn.className = "px-6 py-2 rounded-full text-xs font-bold text-neutral-400 hover:text-black transition-all";
        }

        // 4. Fade back in
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
    }, 300);
}

// Initialize with sourcing data on load
window.onload = () => switchImpact('sourcing');

// Set initial state on load
window.onload = () => toggleNav('login');