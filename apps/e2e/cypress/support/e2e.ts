import './commands';

// Prevent Cypress from failing the test on uncaught app exceptions
// that aren't related to our test logic
Cypress.on('uncaught:exception', (err) => {
    if (err.message.includes('ResizeObserver loop')) return false;
    return true;
});