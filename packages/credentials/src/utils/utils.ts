import { ClaimType } from "@herald-sdk/data-model";

export function isClaimsObject(obj: any): obj is {[key: string]: ClaimType} {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    for (const key in obj) {
        if (typeof key !== 'string') {
            return false;
        }
        if (!isClaimType(obj[key])) {
            return false;
        }
    }

    return true;
}
function isClaimType(obj: any): obj is ClaimType {
    if (typeof obj !== 'string' || typeof obj !== 'number' || typeof obj !== 'object') {
        return false;
    }
    return true;
}