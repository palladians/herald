import { ClaimType, stringToField } from "@herald-sdk/data-model";
import { Field } from "snarkyjs";

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

export function handleOperation(operation: Field): string | undefined {
    switch (true) {
        case stringToField('lt').equals(operation).toBoolean():
            return "lt";
        case stringToField('lte').equals(operation).toBoolean():
            return "lte";
        case stringToField('eq').equals(operation).toBoolean():
            return "eq";
        case stringToField('gte').equals(operation).toBoolean():
            return "gte";
        case stringToField('gt').equals(operation).toBoolean():
            return "gt";
        default:
          return undefined;
    }
  }