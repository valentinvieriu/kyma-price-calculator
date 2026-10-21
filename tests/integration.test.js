import { Step } from './cost';

context('Configure a cluster', () => {
  it('updates the estimate as each section is configured', () => {
    cy.visit('/');

    // Base worker node pool
    cy.selectOption('base-pool-vm-size', '4 vCPU');
    cy.costShouldBe(Step.BASE_VM_SIZE_INCREASE);

    cy.typeIntoStepInput('base-pool-nodes', 10);
    cy.costShouldBe(Step.BASE_AUTOSCALER_INCREASE);

    cy.typeIntoStepInput('base-pool-volume', 64);
    cy.costShouldBe(Step.BASE_ADDITIONAL_NODE_VOLUME_INCREASE);

    // Additional worker node pool
    cy.get('ui5-button').contains('Add worker node pool').click();
    cy.costShouldBe(Step.WORKER_ADD_NODE);

    cy.get('#machine-setup-0-machine-type')
      .contains('Compute Optimized')
      .click();
    cy.costShouldBe(Step.WORKER_TYPE_CHANGE);

    cy.selectOption('machine-setup-0-vm-size', '8 vCPU · 16 GiB');
    cy.costShouldBe(Step.WORKER_SIZE_CHANGE);

    cy.typeIntoStepInput('machine-setup-0-nodes', 5);
    cy.costShouldBe(Step.WORKER_AUTOSCALER_INCREASE);

    // Storage: values are billed in 32 GiB blocks
    cy.typeIntoStepInput('gib-quantity-input', 160);
    cy.costShouldBe(Step.STORAGE_GIB_INCREASE);

    cy.typeIntoStepInput('nfs-gib-quantity-input', 160);
    cy.costShouldBe(Step.STORAGE_NFS_GIB_INCREASE);

    // Additional services
    cy.selectOption('redis-select', 'Standard4');
    cy.costShouldBe(Step.ADDITIONAL_REDIS_INCREASE);

    // The configuration is kept in the URL, so reloading restores it.
    cy.reload();
    cy.get('#total-capacity-units').contains('8.335,35');

    cy.get('ui5-button').contains('Export as CSV').click();
    cy.readFile('cypress/downloads/Kyma-Price-Calculations.csv').should(
      'exist',
    );

    cy.get('ui5-button').contains('Export as XLSX').click();
    cy.readFile('cypress/downloads/Kyma-Price-Calculations.xlsx').should(
      'exist',
    );

    cy.get('ui5-button').contains('Reset').click();
    cy.get('#total-capacity-units').contains('777,60');
  });
});

context('Billing details users can verify', () => {
  it('keeps requested storage sizes and shows how they are provisioned', () => {
    cy.visit('/');

    cy.typeIntoStepInput('gib-quantity-input', 33);
    cy.get('ui5-step-input#gib-quantity-input').should(
      'have.prop',
      'value',
      33,
    );
    cy.get('#storage-section').contains('Provisioned as 64 GiB (2 blocks)');
    // 2 blocks − 1 free = 1 block × 0.02 × 720 h
    cy.get('#storage-cost .value').contains('14,40 CU');
  });

  it('accepts a conversion rate with one decimal and compares in currency', () => {
    cy.visit('/');

    cy.get('ui5-button').contains('Pin as baseline').click();
    cy.get('#rate-term').click();
    cy.typeIntoStepInput('conversion-rate-input', 0.8);
    cy.get('ui5-step-input#conversion-rate-input').should(
      'have.prop',
      'valueState',
      'None',
    );

    // 777.60 CU × 0.80 = 622.08 €, CU unchanged
    cy.get('#total-in-currency').contains('622,08');
    cy.get('#baseline-delta').contains('155,52 €');
    cy.get('#cost-summary').contains('Changed: conversion rate.');
  });
});

context('Node pools', () => {
  it('collapse to their summary line', () => {
    cy.visit('/');

    cy.get('#base-pool-vm-size').should('be.visible');
    cy.get('#base-pool').shadow().find('ui5-button').first().click();
    cy.get('#base-pool-vm-size').should('not.be.visible');
    cy.get('#base-pool').contains('3 × 2 vCPU · 8 GiB RAM');
  });
});

context('Reset', () => {
  it('clears inputs changed with the +/− buttons', () => {
    cy.visit('/');

    cy.clickStepInputButton('nfs-gib-quantity-input', 'increase');
    cy.stepInputText('nfs-gib-quantity-input').should('have.value', '32');

    cy.get('ui5-button').contains('Reset').click();
    cy.stepInputText('nfs-gib-quantity-input').should('have.value', '0');
    cy.get('#storage-cost .value').contains('0,00 CU');
  });
});

context('Running hours', () => {
  it('can be set from the total with a preset', () => {
    cy.visit('/');

    cy.get('#summary-hours').click();
    cy.get('.hours-presets').contains('1 week').click();

    // 3 nodes × 0.36 CU/h × 168 h
    cy.get('#total-capacity-units').contains('181,44');
    cy.get('#summary-hours').contains('168 h per month');
    cy.stepInputText('hours-input').should('have.value', '168');
  });
});
