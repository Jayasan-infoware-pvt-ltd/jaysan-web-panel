export function checkAuth() {
    const user = localStorage.getItem('app_user');
    return user ? JSON.parse(user) : null;
}

export function login(username, password) {
    // Simple hardcoded check for MVP
    if (username === 'admin' && password === 'admin123') {
        const user = { username: 'admin', role: 'admin' };
        localStorage.setItem('app_user', JSON.stringify(user));
        return { success: true, user };
    }
    return { success: false, message: 'Invalid credentials' };
}

export function logout() {
    localStorage.removeItem('app_user');
    window.location.reload();
}

export function renderLogin(container) {
    container.innerHTML = `
        <div class="w-full h-full min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden">
            <!-- Decorative Background -->
            <div class="absolute inset-0 z-0 opacity-10">
                <div class="absolute right-0 top-0 bg-blue-500 w-96 h-96 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                <div class="absolute left-0 bottom-0 bg-indigo-500 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div class="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-white/50">
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30">
                        <i data-lucide="zap" class="w-6 h-6"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-slate-800">Welcome Back</h1>
                    <p class="text-slate-500 text-sm mt-2">Sign in to your dashboard</p>
                </div>
                
                <form id="login-form" class="space-y-5">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                        <input type="text" id="username" class="input-field w-full bg-white/50" placeholder="Enter username" required>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                        <input type="password" id="password" class="input-field w-full bg-white/50" placeholder="Enter password" required>
                    </div>
                    
                    <div id="login-error" class="hidden flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                        <i data-lucide="alert-circle" class="w-4 h-4"></i>
                        <span>Invalid credentials</span>
                    </div>

                    <button type="submit" class="btn-primary w-full py-2.5 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5">
                        Sign In
                    </button>
                </form>

                <div class="mt-8 pt-6 border-t border-slate-200/60 text-center">
                    <p class="text-xs text-slate-400">Restricted Access System</p>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const form = container.querySelector('#login-form');
    const errorMsg = container.querySelector('#login-error');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = form.querySelector('#username').value;
        const pass = form.querySelector('#password').value;

        const result = login(user, pass);

        if (result.success) {
            window.location.reload(); // Refresh to trigger init check
        } else {
            errorMsg.textContent = result.message;
            errorMsg.classList.remove('hidden');
        }
    });
}
