import { PrivateKey } from "snarkyjs";
import { Claim, SignedClaim, CredentialPresentation } from "../dataModel";
import { ClaimType } from "../types";

/**
 * 
 * @param claims a dictionary of claims to construct a claim from
 * @returns a claim
 */
export function constructClaim(claims: {[key: string]: ClaimType}): Claim {
    const claim = new Claim();
    for (const key in claims) {
        if (claims.hasOwnProperty(key) && claims[key] !== undefined) {
            claim.addField(key, claims[key]!);
        }
    }
    return claim;
}
  
/**
 * 
 * @param claim a claim to construct a signed claim from
 * @param issuerPrvKey a private key to sign the claim with
 * @returns a signed claim
 */
export function constructSignedClaim(claim: Claim, issuerPrvKey: PrivateKey): SignedClaim {
    return new SignedClaim(claim, issuerPrvKey);
}

/**
 * 
 * @param signedClaim a signed claim to construct a credential presentation from
 * @param subjectPrvKey a private key to sign the credential presentation with
 * @returns a credential presentation
 */
export function constructPresentation(signedClaim: SignedClaim, subjectPrvKey: PrivateKey): CredentialPresentation {
    return new CredentialPresentation(signedClaim, subjectPrvKey);
}
