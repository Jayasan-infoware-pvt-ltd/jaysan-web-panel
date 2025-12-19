export async function checkAuth() {
    // Check local storage or supabase session
    return true;
}

export function renderLogin(container) {
    container.innerHTML = `<div>Login Page Placeholder</div>`;
}
