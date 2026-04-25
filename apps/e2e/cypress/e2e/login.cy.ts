/// <reference types="cypress" />

describe('Login', () => {
    beforeEach(() => {
        cy.logout()
        cy.visit('/login')
    })

    it('shows the login form', () => {
        cy.get('[data-testid="email-input"]').should('be.visible')
        cy.get('[data-testid="password-input"]').should('be.visible')
        cy.get('[data-testid="login-button"]').should('be.visible')
    })

    it('shows a validation error for invalid email', () => {
        cy.get('[data-testid="login-button"]').click()
        cy.contains('Invalid email address').should('be.visible')
    })

    it('shows an error for wrong credentials', () => {
        cy.get('[data-testid="email-input"]').type('wrong@example.com')
        cy.get('[data-testid="password-input"]').type('wrongpassword')
        cy.get('[data-testid="login-button"]').click()
        cy.get('[data-testid="login-error"]').should('be.visible')
    })

    it('redirects to /products on successful login', () => {
        cy.get('[data-testid="email-input"]').type(Cypress.env('ADMIN_EMAIL'))
        cy.get('[data-testid="password-input"]').type(Cypress.env('ADMIN_PASSWORD'))
        cy.get('[data-testid="login-button"]').click()
        cy.url().should('include', '/products')
    })

    it('stores the access_token in localStorage after login', () => {
        cy.get('[data-testid="email-input"]').type(Cypress.env('ADMIN_EMAIL'))
        cy.get('[data-testid="password-input"]').type(Cypress.env('ADMIN_PASSWORD'))
        cy.get('[data-testid="login-button"]').click()
        cy.url().should('include', '/products')
        cy.window().its('localStorage').invoke('getItem', 'access_token').should('not.be.null')
    })

    it('redirects to /login when visiting a protected route unauthenticated', () => {
        cy.visit('/products')
        cy.url().should('include', '/login')
    })
})