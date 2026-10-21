import { applyStepOnPrice } from './cost';

// Must match formatCost in src/utils/format.ts
const formatCost = (num) =>
  num.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ui5-step-input renders its text field inside nested shadow roots.
Cypress.Commands.add('stepInputText', (id) =>
  cy
    .get(`ui5-step-input#${id}`)
    .shadow()
    .find('ui5-number-input')
    .shadow()
    .find('ui5-input')
    .shadow()
    .find('input'),
);

// The +/− buttons are the first and last icons of the inner number input.
Cypress.Commands.add('clickStepInputButton', (id, direction) =>
  cy
    .get(`ui5-step-input#${id}`)
    .shadow()
    .find('ui5-number-input')
    .shadow()
    .find('ui5-icon')
    .eq(direction === 'increase' ? -1 : 0)
    .click({ force: true }),
);

Cypress.Commands.add('typeIntoStepInput', (id, value) => {
  cy.stepInputText(id)
    // Cypress' visibility/disabled checks don't see through the nested
    // shadow hosts, so force the interaction.
    .type(`{selectall}${value}{enter}`, { force: true })
    .blur({ force: true });
});

Cypress.Commands.add('selectOption', (selectId, content) => {
  cy.get(`ui5-select#${selectId}`).click();
  cy.get(`ui5-select#${selectId}`)
    .find('ui5-option')
    .contains(content)
    .shadow()
    .find('li')
    .click({ force: true });
});

Cypress.Commands.add('costShouldBe', (step) => {
  const expectedPrice = applyStepOnPrice(step);
  cy.get('#cost-summary').within(() => {
    cy.get('#nodes-cost .value').contains(
      `${formatCost(expectedPrice.Nodes)} CU`,
    );
    cy.get('#storage-cost .value').contains(
      `${formatCost(expectedPrice.Storage)} CU`,
    );
    cy.get('#additional-cost .value').contains(
      `${formatCost(expectedPrice.Additional)} CU`,
    );
    cy.get('#total-capacity-units').contains(
      formatCost(expectedPrice.TotalCost.CapacityUnits),
    );
    cy.get('#total-in-currency').contains(
      formatCost(expectedPrice.TotalCost.Currency),
    );
  });
});
