export const ENUM_PRODUCT_STATUS = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
} as const;

export const ENUM_USER_STATUS = {
    IN_PROGRESS: 'in-progress',
    BLOCKED: 'blocked',
};

export const ENUM_NOTIFICATION_TYPE = {
    COURSE: 'COURSE',
    FEEDBACK: 'FEEDBACK',
    CLASS: 'CLASS',
    ORDER: 'ORDER',
    GENERAL: 'GENERAL',
    PAYMENT: 'PAYMENT',
};

export const ENUM_PAYMENT_STATUS = {
    PAID: 'PAID',
    UNPAID: 'UNPAID',
};

export const ENUM_INCIDENT_TYPE = {
    UNPROFESSIONAL_BEHAVIOR: 'Unprofessional Behavior',
    FAILURE_TO_COLLABORATE: 'Failure to collaborate',
    SPAM: 'Spam',
    OTHER: 'Other',
};
