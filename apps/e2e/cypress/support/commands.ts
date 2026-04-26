/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// cy.loginByApi()
// Logs in by calling user-service directly — skips the UI.
// Use this in tests that aren't testing the login flow itself.
// ---------------------------------------------------------------------------
Cypress.Commands.add('loginByApi', (email?: string, password?: string) => {
    const resolvedEmail = email ?? Cypress.env('ADMIN_EMAIL');
    const resolvedPassword = password ?? Cypress.env('ADMIN_PASSWORD');

    cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/auth/login`,
        body: { email: resolvedEmail, password: resolvedPassword },
    }).then((response) => {
        expect(response.status).to.eq(200);
        const { access_token, user } = response.body;
        window.localStorage.setItem('access_token', access_token);
        window.localStorage.setItem('user', JSON.stringify(user));
    });
});

// ---------------------------------------------------------------------------
// cy.logout()
// Clears auth state from localStorage.
// ---------------------------------------------------------------------------
Cypress.Commands.add('logout', () => {
    cy.window().then((win) => {
        win.localStorage.removeItem('access_token');
        win.localStorage.removeItem('user');
    });
});

// ---------------------------------------------------------------------------
// TypeScript — tell the compiler these commands exist on cy.*
// ---------------------------------------------------------------------------
declare global {
    namespace Cypress {
        interface Chainable {
            loginByApi(email?: string, password?: string): Chainable<void>;
            logout(): Chainable<void>;
        }
    }
}

export { };