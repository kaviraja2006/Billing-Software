/**
 * Base Repository Interface
 */
class Repository {
    create(data) { throw new Error('Method not implemented'); }
    findAll(query) { throw new Error('Method not implemented'); }
    findById(id) { throw new Error('Method not implemented'); }
    update(id, data) { throw new Error('Method not implemented'); }
    delete(id) { throw new Error('Method not implemented'); }
}

module.exports = { Repository };
