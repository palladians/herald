import { PrivateKey, verify } from "snarkyjs";
import { ClaimType, Rule } from "@herald-sdk/data-model";
import { Credential } from "../src";
import fs from 'fs';
import { describe, it } from '@jest/globals';
import benchmarkData from '../../../apps/docs/public/benchmarks/credential-proving.json';

describe('Credential Benchmark', () => {
    it('benchmark for proving a claim', async () => {
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

        const startTime = Date.now();
        const proofResponse = await credential.prove("age", issuerPrvKey.toPublicKey(), rule, subjectPrvKey);
        const duration = Date.now() - startTime;

        const date = new Date();
        const dateString = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;

        benchmarkData.push({name: `Benchmark ${dateString}`, duration: duration});
        fs.writeFileSync('../../../apps/docs/public/benchmarks/credential-proving.json', JSON.stringify(benchmarkData));


        console.log("attestationProof Verification: ", await verify(proofResponse.attestationProof.toJSON(), proofResponse.verificationKey));
        expect(verify(proofResponse.attestationProof.toJSON(), proofResponse.verificationKey)).toBeTruthy();
    });
});