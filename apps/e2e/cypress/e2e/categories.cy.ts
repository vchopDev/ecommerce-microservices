/// <reference types="cypress" />

describe('Categories', () => {
    beforeEach(() => {
        cy.loginByApi()
        cy.visit('/categories')
    })

    it('shows the categories page with a table', () => {
        cy.get('[data-testid="categories-table"]').should('be.visible')
    })

    it('creates a new category', () => {
        const name = `E2E Cat ${Date.now()}`

        cy.get('[data-testid="add-category-button"]').click()
        cy.get('[data-testid="category-name-input"]').type(name)
        cy.get('[data-testid="category-description-input"]').type('Created by Cypress')
        cy.get('[data-testid="category-submit-button"]').click()

        cy.contains(name, { timeout: 10000 }).should('be.visible')
    })

    it('shows a validation error when name is too short', () => {
        cy.get('[data-testid="add-category-button"]').click()
        cy.get('[data-testid="category-name-input"]').type('a')
        cy.get('[data-testid="category-submit-button"]').click()
        cy.contains('Name must be at least 2 characters').should('be.visible')
    })

    it('edits an existing category', () => {
        const name = `E2E Edit ${Date.now()}`
        const updatedName = `E2E Edited ${Date.now()}`

        cy.window().then((win) => {
            const token = win.localStorage.getItem('access_token')

            cy.request({
                method: 'POST',
                url: `${Cypress.env('CATALOG_URL')}/categories`,
                headers: { Authorization: `Bearer ${token}` },
                body: { name, description: 'To be edited' },
            }).then(() => {
                cy.reload()
                cy.contains(name, { timeout: 10000 }).should('be.visible')
                cy.contains(name).closest('tr').find('[data-testid="edit-category-button"]').click()
                cy.get('[data-testid="category-name-input"]').clear().type(updatedName)
                cy.get('[data-testid="category-submit-button"]').click()
                cy.contains(updatedName, { timeout: 10000 }).should('be.visible')
            })
        })
    })

    it('deletes a category', () => {
        const name = `E2E Del ${Date.now()}`

        cy.window().then((win) => {
            const token = win.localStorage.getItem('access_token')

            cy.request({
                method: 'POST',
                url: `${Cypress.env('CATALOG_URL')}/categories`,
                headers: { Authorization: `Bearer ${token}` },
                body: { name, description: 'To be deleted' },
            }).then(() => {
                cy.reload()
                cy.contains(name, { timeout: 10000 }).should('be.visible')
                cy.contains(name).closest('tr').find('[data-testid="delete-category-button"]').click()
                cy.get('[data-testid="confirm-delete-button"]').click()
                cy.contains(name, { timeout: 10000 }).should('not.exist')
            })
        })
    })
})