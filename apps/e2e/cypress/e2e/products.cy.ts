/// <reference types="cypress" />

describe('Products', () => {
    const createdProductIds: string[] = []
    const createdCategoryIds: string[] = []
    let testCategoryId: string

    const getToken = () => cy.window().then((win) => win.localStorage.getItem('access_token'))

    const createCategory = (name: string) => {
        return getToken().then((token) => {
            return cy.request({
                method: 'POST',
                url: `${Cypress.env('CATALOG_URL')}/categories`,
                headers: { Authorization: `Bearer ${token}` },
                body: { name },
            }).then((res) => {
                createdCategoryIds.push(res.body.id)
                return res.body
            })
        })
    }

    const createProduct = (name: string, categoryId: string) => {
        return getToken().then((token) => {
            return cy.request({
                method: 'POST',
                url: `${Cypress.env('CATALOG_URL')}/products`,
                headers: { Authorization: `Bearer ${token}` },
                body: {
                    name,
                    price: 9.99,
                    stock: 10,
                    primaryCategoryId: categoryId,
                },
            }).then((res) => {
                createdProductIds.push(res.body.id)
                return res.body
            })
        })
    }

    before(() => {
        cy.loginByApi()
        createCategory(`E2E Test Category ${Date.now()}`).then((cat) => {
            testCategoryId = cat.id
        })
    })

    beforeEach(() => {
        cy.loginByApi()
        cy.visit('/products')
    })

    afterEach(() => {
        getToken().then((token) => {
            createdProductIds.forEach((id) => {
                cy.request({
                    method: 'DELETE',
                    url: `${Cypress.env('CATALOG_URL')}/products/${id}`,
                    headers: { Authorization: `Bearer ${token}` },
                    failOnStatusCode: false,
                })
            })
            createdProductIds.length = 0
        })
    })

    after(() => {
        getToken().then((token) => {
            createdCategoryIds.forEach((id) => {
                cy.request({
                    method: 'DELETE',
                    url: `${Cypress.env('CATALOG_URL')}/categories/${id}`,
                    headers: { Authorization: `Bearer ${token}` },
                    failOnStatusCode: false,
                })
            })
            createdCategoryIds.length = 0
        })
    })

    // -------------------------------------------------------------------------
    // READ
    // -------------------------------------------------------------------------
    it('shows the products page with a table', () => {
        cy.get('[data-testid="products-table"]').should('be.visible')
    })

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------
    it('creates a new product', () => {
        const name = `E2E Prod ${Date.now()}`

        cy.get('[data-testid="add-product-button"]').click()
        cy.get('[data-testid="product-name-input"]').type(name)
        cy.get('[data-testid="product-price-input"]').clear().type('19.99')
        cy.get('[data-testid="product-stock-input"]').clear().type('5')

        cy.get('[data-testid="product-primary-category-select"]').click()
        cy.get('[role="option"]').contains('E2E Test Category').click({ force: true })

        cy.get('[data-testid="product-submit-button"]').click()

        cy.contains(name, { timeout: 10000 }).should('exist').then(() => {
            cy.request(`${Cypress.env('CATALOG_URL')}/products`).then((res) => {
                const found = res.body.data?.find((p: { name: string; id: string }) => p.name === name)
                if (found) createdProductIds.push(found.id)
            })
        })
    })

    it('shows a validation error when name is too short', () => {
        cy.get('[data-testid="add-product-button"]').click()
        cy.get('[data-testid="product-name-input"]').type('a')
        cy.get('[data-testid="product-submit-button"]').click()
        cy.contains('Name must be at least 2 characters').should('be.visible')
    })

    // -------------------------------------------------------------------------
    // EDIT
    // -------------------------------------------------------------------------
    it('edits an existing product', () => {
        const name = `E2E Edit Prod ${Date.now()}`
        const updatedName = `E2E Edited Prod ${Date.now()}`

        createProduct(name, testCategoryId).then(() => {
            cy.reload()
            cy.contains(name, { timeout: 10000 }).should('exist')
            cy.contains(name).closest('tr').find('[data-testid="edit-product-button"]').click()
            cy.get('[data-testid="product-name-input"]').clear().type(updatedName)
            cy.get('[data-testid="product-submit-button"]').click()
            cy.contains(updatedName, { timeout: 10000 }).should('exist')
        })
    })

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------
    it('deletes a product', () => {
        const name = `E2E Del Prod ${Date.now()}`

        createProduct(name, testCategoryId).then(() => {
            cy.reload()
            cy.contains(name, { timeout: 10000 }).should('exist')
            cy.contains(name).closest('tr').find('[data-testid="delete-product-button"]').click()
            cy.get('[data-testid="confirm-delete-button"]').click()
            cy.contains(name, { timeout: 10000 }).should('not.exist')
        })
    })
})