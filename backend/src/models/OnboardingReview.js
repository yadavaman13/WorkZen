const { db, ORM } = require('../config/database');

const OnboardingReview = ORM.Model.extend({
  tableName: 'onboarding_reviews',
  hasTimestamps: true,
  onboarding() {
    return this.belongsTo('Onboarding');
  }
});

module.exports = ORM.model('OnboardingReview', OnboardingReview);
