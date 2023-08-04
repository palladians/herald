import { Field, PublicKey } from "snarkyjs";
import { Claim, CredentialPresentation } from "../dataModel";

/**
 * Verifies a CredentialPresentation by checking several aspects:
 * 1. If the claim in the presentation is signed by the expected trusted issuer.
 * 2. If the claim in the presentation is signed by the expected subject.
 * 3. If the claim root in the presentation matches the root of the claim.
 * 4. If the claim contains the expected fields by using Merkle witnesses.
 * 
 * @param subjectPresentation - The presentation to be verified.
 * @param issuerPublicKey - The public key of the trusted issuer.
 * @param subjectPublicKey - The public key of the subject.
 * @param claim - The claim.
 * @param expectedKeys - An array of expected keys in the claim.
 * @param expectedValues - An array of expected values in the claim. Each value corresponds to a key at the same index.
 * 
 * @returns True if the presentation is verified, false otherwise.
 */
export function verifyPresentation(
    subjectPresentation: CredentialPresentation,
    issuerPublicKey: PublicKey,
    subjectPublicKey: PublicKey,
    claim: Claim,
    expectedKeys: string[],
    expectedValues: Field[]
  ): boolean {
    try {
        if (!subjectPresentation.signedClaim.signatureIssuer.verify(issuerPublicKey, [subjectPresentation.signedClaim.claimRoot]).toBoolean()) {
          throw new Error("Failed to verify that the claim in the presentation is signed by the expected trusted issuer.");
        }
      
        if (!subjectPresentation.signatureSubject.verify(subjectPublicKey, subjectPresentation.signedClaim.signatureIssuer.toFields()).toBoolean()) {
          throw new Error("Failed to verify that the claim in the presentation is signed by the expected subject.");
        }
      
        if (!subjectPresentation.signedClaim.claimRoot.equals(claim.getRoot()).toBoolean()) {
          throw new Error("Claim root in the presentation does not match the root of the claim.");
        }
      
        // Creating the map from expected keys and values.
        // allows constant time lookup of expected values
        let expectedMap = new Map();
        for(let i = 0; i < expectedKeys.length; i++) {
        expectedMap.set(expectedKeys[i], expectedValues[i]);
        }

        for(let key of expectedMap.keys()) {
        const witness = claim.getWitness(key);
        const expectedValue = expectedMap.get(key);
        const [computedRoot, _] = witness.computeRootAndKey(expectedValue);
        if (computedRoot === undefined) {
            throw new Error(`Failed to verify claim for the key: ${key}. Computed root is undefined.`);
        }
        if (!computedRoot.equals(claim.getRoot()).toBoolean()) {
            throw new Error(`Failed to verify claim for the key: ${key}. Computed root does not match the root of the claim.`);
            }
        }
      } catch(error) {
        console.log(error);
        return false;
      }
      
      return true;
  }
  