const CREDIT_NOTE_CONSTANTS = {
    PENDING_APPROVAL: "PENDING_APPROVAL",
    PENDING_CN_APPROVAL: "PENDING_CN_APPROVAL",
    REJECTED: "REJECTED",
    REJECTED_TWO_WAY: "REJECTED_TWO_WAY",
    REJECTED_THREE_WAY: "REJECTED_THREE_WAY"
};

export const CREDIT_NOTE_ROLE_VIEW = Object.freeze({
    BUYER_VIEW_BUYER: "BUYER_VIEW_BUYER",
    BUYER_VIEW_SUP: "BUYER_VIEW_SUP",
    SUP_VIEW_SUP: "SUP_VIEW_SUP",
    SUP_VIEW_BUYER: "SUP_VIEW_BUYER"
});

Object.freeze(CREDIT_NOTE_CONSTANTS);
export default CREDIT_NOTE_CONSTANTS;
