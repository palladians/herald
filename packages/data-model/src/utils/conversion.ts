import { Field, Encoding, Poseidon, PublicKey } from "snarkyjs";
import { ClaimType } from "../types";

//let {toBytes, fromBytes} = Encoding.Bijective.Fp;

/**
 * 
 * @param str a string to convert to a field
 * @returns a field
 */
export function stringToField(str: string): Field {
    //const bytes = Buffer.from(str)
    const fields = Encoding.stringToFields(str)
    // use Poseidon hash function to convert bytes to single field
    return Poseidon.hash(fields);
  }

/**
 * 
 * @param num a number to convert to a field
 * @returns a field
 */
export function numberToField(num: number): Field {
    return Field(num);
}

/**
 * 
 * @param fields an array of fields to convert to a single field
 * @returns a field
 */
export function publicKeyHash(publicKey: PublicKey): Field {
      // use Poseidon hash function to convert bytes to single field
    return Poseidon.hash(publicKey.toFields());
}

/**
 * 
 * @param claim a claim to convert to a field
 * @returns a field
 */
// TODO: make this able to handle arbitrary data structures (e.g. nested dictionaries)
  export function claimToField(claim: ClaimType): Field {
    if (typeof claim === 'string') {
      return stringToField(claim);
    } else if (typeof claim === 'number') {
      return numberToField(claim);
    } else if (typeof claim === 'object') {
      return publicKeyHash(claim);
    } else {
      throw new Error("Claim type not recognised");
    }
  }

/**
 * 
 * @param field a field to convert to a string
 * @returns a string
 */
export function fieldToString(field: Field[]): string {
    //const bytes = toBytes(field);
    //return Buffer.from(bytes).toString();
    return Encoding.stringFromFields(field);
  }

/**
 * 
 * @param obj an object to flatten
 * @param prefix a prefix to add to the keys of the flattened object
 * @returns a flattened object of {[key: string]: ClaimType} that can be used in a Claim MerkleMap
 */
export function flattenObject(obj: {[key: string]: any}, prefix = ''): {[key: string]: ClaimType} {
  return Object.keys(obj).reduce((acc: {[key: string]: ClaimType}, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !(obj[k] instanceof PublicKey)) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k] as ClaimType;
    }
    return acc;
  }, {});
}