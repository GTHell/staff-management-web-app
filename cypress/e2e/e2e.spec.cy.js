
describe('Add a new staff and verify that it appear in the list', () => {
  it('should add a new staff member', () => {
    cy.visit('/'); // Assuming '/staff-management' is the URL for the staff management page

    // click on create new staff button
    cy.get('#create-new-btn').click();

    // Fill in the staff member details
    cy.get('#staff-id-create').type('12345678');
    cy.get('#fullname-create').type('John Test');
    cy.get('#gender-create').select('Male');
    cy.get('#birthdate-create').clear().type('01/01/2000{enter}');

    // Submit the form to add the staff member
    cy.get('#createUserModal').find('button[type="submit"]').click();

    // Assert
    // Verify that the staff member appears in the staff list
    cy.get('#element-to-print').should('contain', 'John Test');
  });
})

describe('Edit existing staff and verify that the change is reflected', () => {
  it('should edit an existing staff member', () => {
    cy.intercept('GET', '**/api/staffs**').as('fetchStaffData');
    cy.visit('/');
    cy.wait('@fetchStaffData')

    cy.get('#element-to-print tr').should('exist');

    // Find the staff member in the list and click the edit button
    // Get a tag in td that contains John Test the a tag has class btn
    cy.get('#element-to-print')
      .contains('John')
      .parent()
      .within(() => {
        // Click on the edit button with class btn contain edit text
        cy.get('.btn').contains('Edit').click();
      });

    // Modify the staff member details
    cy.get('#staff-id-update').clear().type('007');
    cy.get('#fullname-update').clear().type('Jame Bond');
    cy.get('#birthdate-update').clear().type('03/03/1986{enter}');

    // Save the changes
    cy.get('#editUserModal').find('button[type="submit"]').click();

    // Assert
    cy.get('#element-to-print').should('contain', '007');
    cy.get('#element-to-print').should('contain', 'Jame Bond');
    cy.get('#element-to-print').should('contain', 'Mar 3rd 1986');
  });
})

describe('Perform an advanced search and verify the results', () => {
  it('should perform an advanced search', () => {
    cy.visit('/');
    
    // Fill in the search criteria
    cy.get('#staff-id-query').type('00');
    cy.get('#gender-query').select('Male');
    cy.get('#birthdate-range-query').type('01/01/1985 - 12/31/1988{enter}');

    // Submit the search form
    cy.get("#filter-button").click();

    // Assert
    cy.get('#element-to-print').should('contain', '007');
    cy.get('#element-to-print').should('contain', 'Jame Bond');
    cy.get('#element-to-print').should('contain', 'Male');
    cy.get('#element-to-print').should('contain', 'Mar 3rd 1986');
    // 2 row because one for header and one for data
    cy.get('#element-to-print tr').should('have.length', 2);

  })
})

describe('Generate report after performing an advanced search and verify the exported file', () => {
  it('should generate Excel and Pdf report', () => {
    cy.visit('/');

    // Perform the advanced search
    cy.get('#staff-id-query').type('00');
    cy.get('#gender-query').select('Male');
    cy.get('#birthdate-range-query').type('01/01/1985 - 12/31/1988{enter}');
    cy.get("#filter-button").click();

    // Generate the report
    cy.get('#export-excel-btn').click();
    cy.get('#export-pdf-btn').click();

    // Assert
    cy.verifyDownload('data.xls');
    cy.verifyDownload('data.pdf');
  })
})

describe('Delete existing staff and verify that the change is reflected', () => {
  it('should delete a staff member', () => {
    cy.visit('/');

    cy.get('#element-to-print tr').should('exist');

    // Find the staff member in the list and click the delete button
    cy.get('#element-to-print')
      .contains('Jame')
      .parent()
      .within(() => {
        // Click on the edit button with class btn contain edit text
        cy.get('.btn').contains('Delete').click();
      });

    // Confirm the deletion
    cy.get('#deleteUserModal').find('button[type="submit"]').click();

    // Assert
    // Verify that the staff member is removed from the staff list
    cy.get('#element-to-print').should('not.contain', '007');
    cy.get('#element-to-print').should('not.contain', 'Jame Bond');
  });
})