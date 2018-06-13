'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Create transaction
 * @param {org.audit.loan.CreateLoan} loanDetails
 * @transaction
 */
function onCreateLoan(loanDetails){

    // 1. Get the asset registry
    return getAssetRegistry('org.audit.loan.Loan')
        .then(function(loanRegistry){
            // 2. Get resource factory
            var  factory = getFactory();
            var NS = 'org.audit.loan';
            // 3. Create the Resource instance
            var  loanId = loanDetails.loanId;
            var loan = factory.newResource(NS,'Loan',loanId);
            // 5. Create a new concept using the factory & set the data in it
            var borrower = factory.newConcept(NS,'Borrower');
            borrower.firstName = loanDetails.firstName;
            borrower.lastName = loanDetails.lastName;
            borrower.emailId = loanDetails.emailId;
            borrower.borrowerId = loanDetails.borrowerId;
            loan.borrower = borrower;


            var propertyAddress = factory.newConcept(NS,'Address');
            propertyAddress.street = loanDetails.street;
            propertyAddress.city = loanDetails.city;
            propertyAddress.state = loanDetails.state;
            propertyAddress.zipCode = loanDetails.zipCode;
            loan.propertyAddress = propertyAddress;

            loan.loanAmount = loanDetails.loanAmount;
            loan.loanDuration = loanDetails.loanDuration;
            loan.interestRate = loanDetails.interestRate;
            loan.monthlyPaymentAmount = loanDetails.monthlyPaymentAmount;
            loan.upb = loanDetails.upb;
            loan.liquidated = loanDetails.liquidated;

            var participantInfo = factory.newResource('org.audit.participant','LoanEntryDept',loanDetails.participantKey);
            loan.updatedByLoanParticipant = participantInfo;

            // 6. Emit the event LoanCreated
            var event = factory.newEvent(NS, 'LoanCreated');
            event.loanId = loanId;
            event.loanAmount = loan.loanAmount;
            emit(event);

            return loanRegistry.addAll([loan]);
        });
}

/**
 * Sample transaction
 * @param {org.audit.loan.UpdateLoan} changeLoanDetails
 * @transaction
 */
function onChangeLoanDetails(changeLoanDetails) {
    var assetRegistry;
    var id = changeLoanDetails.relatedLoanAsset.loanId;
    //var oldLoanAmount = changeLoanDetails.relatedLoanAsset.loanAmount;
    var oldInterestRate = changeLoanDetails.relatedLoanAsset.interestRate;
    var oldUpb = changeLoanDetails.relatedLoanAsset.upb;
    var oldLiquidated = changeLoanDetails.relatedLoanAsset.liquidated;
    var oldMonthlyPaymentAmount = changeLoanDetails.relatedLoanAsset.monthlyPaymentAmount;
    var oldLoanDuration = changeLoanDetails.relatedLoanAsset.loanDuration;
    var oldParticipantKey = changeLoanDetails.relatedLoanAsset.updatedByLoanParticipant.loanParticipantKey;
    return getAssetRegistry('org.audit.loan.Loan')
        .then(function(ar) {
            assetRegistry = ar;
            return assetRegistry.get(id);
        })
        .then(function(loanAsset) {
            if(loanAsset.interestRate!== changeLoanDetails.newInterestRate && changeLoanDetails.newInterestRate!==null && changeLoanDetails.newInterestRate!==''){
                loanAsset.interestRate=changeLoanDetails.newInterestRate;
            }
            if(loanAsset.upb !== changeLoanDetails.newUpb && changeLoanDetails.newUpb!==null && changeLoanDetails.newUpb!==''){
                loanAsset.upb = changeLoanDetails.newUpb;
            }
            if(loanAsset.liquidated !== changeLoanDetails.newLiquidated && changeLoanDetails.newLiquidated!==null && changeLoanDetails.newLiquidated!==''){
                loanAsset.liquidated = changeLoanDetails.newLiquidated;
            }
            if(loanAsset.monthlyPaymentAmount !== changeLoanDetails.newMonthlyPaymentAmount && changeLoanDetails.newMonthlyPaymentAmount!==null && changeLoanDetails.newMonthlyPaymentAmount!==''){
                loanAsset.monthlyPaymentAmount = changeLoanDetails.newMonthlyPaymentAmount;
            }
            if( loanAsset.loanDuration !== changeLoanDetails.newLoanDuration && changeLoanDetails.newLoanDuration!==null && changeLoanDetails.newLoanDuration!==''){
                loanAsset.loanDuration = changeLoanDetails.newLoanDuration;
            }
            //2. Get resource factory
            var  factory = getFactory();
            var participantInfo = factory.newResource('org.audit.participant','LoanServicingDept',changeLoanDetails.newParticipantKey);
            loanAsset.updatedByLoanParticipant = participantInfo;
            return assetRegistry.update(loanAsset);
        }).then(function () {

            // Emit an event for the modified asset.
            var event = getFactory().newEvent('org.audit.loan', 'LoanUpdated');
            event.relatedLoanAsset = changeLoanDetails.relatedLoanAsset;
            event.oldInterestRate = oldInterestRate;
            event.newInterestRate = changeLoanDetails.newInterestRate;
            event.oldUpb = oldUpb;
            event.newUpb = changeLoanDetails.newUpb;
            event.oldLiquidated = oldLiquidated;
            event.newLiquidated = changeLoanDetails.newLiquidated;
            event.oldMonthlyPaymentAmount = oldMonthlyPaymentAmount;
            event.newMonthlyPaymentAmount = changeLoanDetails.newMonthlyPaymentAmount;
            event.oldLoanDuration = oldLoanDuration;
            event.newLoanDuration = changeLoanDetails.newLoanDuration;
            emit(event);
        });

}

/**
 * Update Loan Payments
 * @param {org.audit.loan.AddLoanPayment} addLoanPayments
 * @transaction
 */
function onLoanPayments(addLoanPayments){
    var assetRegistry;
    var id = addLoanPayments.relatedLoanAsset.loanId;
    var amountPaid =  addLoanPayments.amountPaid;
    var amountPaidDt = addLoanPayments.amountPaidDt;
    var participantKey = addLoanPayments.newParticipantKey ;
    return getAssetRegistry('org.audit.loan.Loan')
        .then(function(ar) {
            assetRegistry = ar;
            return assetRegistry.get(id);
        })
        .then(function(loanAsset) {
            if(loanAsset.loanPayments == null){
                loanAsset.loanPayments = [];
            }
            loanAsset.loanPayments.push(addLoanPayments);
            return assetRegistry.update(loanAsset);
        }).then(function () {
            // Emit an event for the modified asset.
            var event = getFactory().newEvent('org.audit.loan', 'LoanPaymentAdded');
            event.relatedLoanAsset = addLoanPayments.relatedLoanAsset;
            event.amountPaid = amountPaid;
            event.amountPaidDt = addLoanPayments.amountPaidDt;
            event.newParticipantKey = addLoanPayments.newParticipantKey;
            emit(event);
        });

}
