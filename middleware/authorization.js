// Centralized authorization logic prevents permission bugs from scattered checks
// Business rules: Admins have full access, users can only edit what they own or are assigned

// Edit permission: creator has ownership rights, assignee has delegated rights
const canEdit = (user, resource) => {
    if (user.role === 'admin') return true;
    const createdBy = resource.createdBy?.toString();
    const assignedTo = resource.assignedTo?.toString();
    return createdBy === user.id || assignedTo === user.id;
};

// Delete is admin-only to prevent accidental data loss from regular users
const canDelete = (user) => user.role === 'admin';

// Read access is global - all authenticated users see the same dataset
// This enables transparency and collaboration across the platform
const buildReadQuery = () => ({});

// Returns error object or null - pattern allows controller to decide response format
const requireEditPermission = (resource, user) => {
    if (!canEdit(user, resource)) {
        return { status: 403, message: 'Not authorized to modify this resource' };
    }
    return null;
};

const requireDeletePermission = (user) => {
    if (!canDelete(user)) {
        return { status: 403, message: 'You do not have permission to delete resources' };
    }
    return null;
};

module.exports = {
    canEdit,
    canDelete,
    buildReadQuery,
    requireEditPermission,
    requireDeletePermission
};
