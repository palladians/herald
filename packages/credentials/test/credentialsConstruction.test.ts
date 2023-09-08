import { PrivateKey } from "snarkyjs";
import { Credential } from "../src"; 
import { describe, it } from '@jest/globals';

/**
 * These tests focus on credential construction 
 */

describe('Credential Construction', () => {
    let claims: object;
    let issuerPrvKey: PrivateKey;
    let subjectPrvKey: PrivateKey;
    let claimsString: string;

    beforeAll(() => {
      issuerPrvKey = PrivateKey.fromBase58("EKDhdt1SX7i1cp7KZRzqVdJDYUf16HqM4bGpUzF98jSh3hzZTZLr");
      subjectPrvKey = PrivateKey.fromBase58("EKE1c5UXWmKpzSZxkh67MPUeujYtoVppkGKrv3zC9CFXnWAzkktu");
      claims = {
          "@context": [
              "https://www.w3.org/2018/credentials/v1",
              "https://www.w3.org/2018/credentials/examples/v1"
          ],
          "id": "http://example.edu/credentials/3732",
          "type": ["VerifiableCredential", "UniversityDegreeCredential"],
          "issuer": "https://example.edu/issuers/565049",
          "issuanceDate": new Date().toISOString(),
          "credentialSubject": {
              "id": subjectPrvKey.toPublicKey().toBase58(),
              "degree": {
                  "type": "BachelorDegree",
                  "name": "Bachelor of Science and Arts"
              }
          }
      }
      claimsString = JSON.stringify(claims);
  });

    it('can construct a credential', async () => {
      const credential = await Credential.create(claimsString, issuerPrvKey, subjectPrvKey.toPublicKey());
      expect(credential).toBeTruthy();
      console.log("verifiable credential", credential.verifiableCredential)
      console.log("credential", credential.credential)
    });
  
    it('can validate the signature', async () => {
      const credential = await Credential.create(claimsString, issuerPrvKey, subjectPrvKey.toPublicKey());
      const isValid = credential.verify(issuerPrvKey.toPublicKey(), subjectPrvKey.toPublicKey(), "credentialSubject.id");
      expect(isValid).toBe(true);
    });

    it('does not validate the signature with wrong public key', async () => {
      const wrongIssuerPubKey = PrivateKey.random().toPublicKey();
      const credential = await Credential.create(claimsString, issuerPrvKey, subjectPrvKey.toPublicKey());
      const isValid = credential.verify(wrongIssuerPubKey, subjectPrvKey.toPublicKey(), "credentialSubject.id");
      expect(isValid).toBe(false);
    });

    it('verify claim is made about the correct subject', async () => {
        const credential = await Credential.create(claimsString, issuerPrvKey, subjectPrvKey.toPublicKey());
        const isValid = credential.verify(issuerPrvKey.toPublicKey(), subjectPrvKey.toPublicKey(), "credentialSubject.id");
        expect(isValid).toBe(true);
    });

    it('can reconstruct/recreate a credential from a verifiable credential string', async () => {
      const credential = await Credential.create(claimsString, issuerPrvKey, subjectPrvKey.toPublicKey());
      const verifiableCredential = JSON.stringify(credential.verifiableCredential);

      const recreatedCredential = Credential.recreate(verifiableCredential);
      const isValid = recreatedCredential.verify(issuerPrvKey.toPublicKey(), subjectPrvKey.toPublicKey(), "credentialSubject.id");
      expect(isValid).toBe(true);

    })
});
