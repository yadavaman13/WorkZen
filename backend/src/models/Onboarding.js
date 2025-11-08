import db from '../config/database.js';

class OnboardingModel {
  async create(data) {
    const result = await db('onboarding_requests').insert(data).returning('*');
    return result[0];
  }

  async findById(id) {
    return db('onboarding_requests').where('id', id).first();
  }

  async findByToken(token) {
    return db('onboarding_requests').where('token', token).first();
  }

  async findByEmail(email) {
    return db('onboarding_requests').where('candidate_email', email);
  }

  async findPending(limit = 20, offset = 0) {
    return db('onboarding_requests')
      .where('status', 'pending_review')
      .orderBy('submitted_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async update(id, data) {
    const result = await db('onboarding_requests')
      .where('id', id)
      .update(data)
      .returning('*');
    return result[0];
  }

  async delete(id) {
    return db('onboarding_requests').where('id', id).del();
  }

  async getAllWithPagination(status = null, limit = 20, offset = 0) {
    let query = db('onboarding_requests');
    
    if (status) {
      query = query.where('status', status);
    }

    const total = await query.clone().count('* as count').first();
    const records = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      records,
      total: total.count,
      limit,
      offset
    };
  }

  async checkDuplicatePAN(pan, excludeId = null) {
    let query = db('onboarding_requests').where('pan', pan);
    if (excludeId) {
      query = query.whereNot('id', excludeId);
    }
    return query.first();
  }

  async checkDuplicateAadhaar(aadhaar, excludeId = null) {
    let query = db('onboarding_requests').where('aadhaar', aadhaar);
    if (excludeId) {
      query = query.whereNot('id', excludeId);
    }
    return query.first();
  }
}

export default new OnboardingModel();
