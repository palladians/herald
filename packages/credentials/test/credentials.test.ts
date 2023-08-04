import { PrivateKey, verify } from "snarkyjs";
import { ClaimType, Rule } from "@herald/data-model";
import { Credential } from "../src"; 

describe('Credential', () => {
    it('can construct a credential', () => {
      const subjectPrvKey = PrivateKey.random();
      const issuerPrvKey = PrivateKey.random();
      const claims: {[key: string]: ClaimType} = {
        over18: "true", 
        kyc: "passed", 
        subject: subjectPrvKey.toPublicKey()
      };
      
      const credential = Credential.create(claims, issuerPrvKey);
      expect(credential).toBeTruthy();
    });
  
    it('can validate the signature', () => {
      const subjectPrvKey = PrivateKey.random();
      const issuerPrvKey = PrivateKey.random();
      const claims: {[key: string]: ClaimType} = {
        over18: "true", 
        kyc: "passed", 
        subject: subjectPrvKey.toPublicKey()
      };

      const credential = Credential.create(claims, issuerPrvKey);
      const isValid = credential.verify(issuerPrvKey.toPublicKey(), subjectPrvKey.toPublicKey());
      expect(isValid).toBe(true);
    });

    it('does not validate the signature with wrong public key', () => {
      const subjectPrvKey = PrivateKey.random();
      const issuerPrvKey = PrivateKey.random();
      const wrongIssuerPubKey = PrivateKey.random().toPublicKey();
      const claims: {[key: string]: ClaimType} = {
        over18: "true", 
        kyc: "passed", 
        subject: subjectPrvKey.toPublicKey()
      };

      const credential = Credential.create(claims, issuerPrvKey);
      const isValid = credential.verify(wrongIssuerPubKey, subjectPrvKey.toPublicKey());
      expect(isValid).toBe(false);
    });

    it('verify claim is made about the correct subject', () => {
        const subjectPrvKey = PrivateKey.random();
        const issuerPrvKey = PrivateKey.random();
        const claims: {[key: string]: ClaimType} = {
            over18: "true", 
            kyc: "passed", 
            subject: subjectPrvKey.toPublicKey()
        };

        const credential = Credential.create(claims, issuerPrvKey);
        const isValid = credential.verify(issuerPrvKey.toPublicKey(), subjectPrvKey.toPublicKey());
        expect(isValid).toBe(true);
    });
    it('can prove a claim', async () => {
        const subjectPrvKey = PrivateKey.random();
        const issuerPrvKey = PrivateKey.random();
        const claims: {[key: string]: ClaimType} = {
            age: 21,
            subject: subjectPrvKey.toPublicKey()
        };

        const credential = Credential.create(claims, issuerPrvKey);
        const property = "age";
        const operation = "gte";
        const value = 18;
        const rule = new Rule(property, operation, value);
        console.log("rule: ", rule);
        
        const proofResponse = await credential.prove("age", issuerPrvKey.toPublicKey(), rule, subjectPrvKey);
        console.log("attestationProof Verification: ", await verify(proofResponse.attestationProof.toJSON(), proofResponse.verificationKey));
        expect(verify(proofResponse.attestationProof.toJSON(), proofResponse.verificationKey)).toBeTruthy();
    });
});
