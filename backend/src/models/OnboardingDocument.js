const { db, ORM } = require('../config/database');

const OnboardingDocument = ORM.Model.extend({
  tableName: 'onboarding_documents',
  hasTimestamps: true,
  onboarding() {
    return this.belongsTo('Onboarding');
  }
});

module.exports = ORM.model('OnboardingDocument', OnboardingDocument);
