import { PrivateKey, verify } from "snarkyjs";
import { ClaimType, Rule } from "@herald-sdk/data-model";
import { Credential } from "../src"; 
import { describe, it } from '@jest/globals';
import { PublicInputArgs, ZkProgramsDetails } from "@herald-sdk/provable-programs";
import fs from 'fs';
import path from 'path';

describe('Credential', () => {
    it('can construct a credential', () => {
      const subjectPrvKey = PrivateKey.random();
      const issuerPrvKey = PrivateKey.random();
      const claims: {[key: string]: ClaimType} = {
        over18: "true", 
        kyc: "passed", 
        subject: subjectPrvKey.toPublicKey()
      };      
      const credential = Credential.create(JSON.stringify(claims), issuerPrvKey);
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

      const credential = Credential.create(JSON.stringify(claims), issuerPrvKey);
      const isValid = credential.verify(issuerPrvKey.toPublicKey(), subjectPrvKey.toPublicKey(), "subject");
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

      const credential = Credential.create(JSON.stringify(claims), issuerPrvKey);
      const isValid = credential.verify(wrongIssuerPubKey, subjectPrvKey.toPublicKey(), "subject");
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

        const credential = Credential.create(JSON.stringify(claims), issuerPrvKey);
        const isValid = credential.verify(issuerPrvKey.toPublicKey(), subjectPrvKey.toPublicKey(), "subject");
        expect(isValid).toBe(true);
    });
    it('can prove a claim', async () => {
      /**
       * Issuer must make a claim about a subject AND prove the claim
       */
        const subjectPrvKey = PrivateKey.random();
        const issuerPrvKey = PrivateKey.random();
        const issuerPubKey = issuerPrvKey.toPublicKey();
        const subjectPubKey = subjectPrvKey.toPublicKey();
        const claims: {[key: string]: ClaimType} = {
            over18: "true",
            kyc: "passed",
            subject: subjectPubKey,
            issuerPubKey: issuerPubKey
        };
        // issue credentials to subject
        const credential = Credential.create(JSON.stringify(claims), issuerPrvKey);
        // create rule to prove
        const property = "kyc";
        const operation = "eq";
        const value = "passed";
        const rule = new Rule(property, operation, value);
        console.log("rule: ", rule);
        // create challenge - this challenge must be signed by the issuer
        const challenge: PublicInputArgs = {issuerPubKey: issuerPubKey, subjectPubKey: issuerPubKey, provingRule: rule};

        const zkPrgDetails = ZkProgramsDetails["AttestSingleCredentialProperty"];
        if (!zkPrgDetails) {
            throw new Error("ZkProgram not found");
        }
        // issuer must sign the proof themselves
        const proofResponse = await credential.prove("age", challenge, issuerPrvKey, "AttestSingleCredentialProperty");
        console.log("attestationProof Verification: ", await verify(proofResponse.proof.toJSON(), zkPrgDetails.verificationKey));
        fs.writeFileSync(path.join('./test/test_proofs', 'attestationProof.json'), JSON.stringify(proofResponse, null, 2));
        expect(verify(proofResponse.proof.toJSON(), zkPrgDetails.verificationKey)).toBeTruthy();
    });
});
