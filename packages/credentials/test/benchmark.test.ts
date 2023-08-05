import { PrivateKey, verify } from "snarkyjs";
import { ClaimType, Rule } from "@herald/data-model";
import { Credential } from "../src";
import fs from 'fs';


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

        console.time("proofTime");
        const proofResponse = await credential.prove("age", issuerPrvKey.toPublicKey(), rule, subjectPrvKey);
        console.timeEnd("proofTime");
        const duration = console.timeEnd("proofTime");
        const benchmarkData = require('../../../apps/docs/public/benchmarks/credential-proving.json');
        benchmarkData.push({name: 'New Benchmark', duration: duration});
        fs.writeFileSync('../../../apps/docs/public/benchmarks/credential-proving.json', JSON.stringify(benchmarkData));

        console.log("attestationProof Verification: ", await verify(proofResponse.attestationProof.toJSON(), proofResponse.verificationKey));
        expect(verify(proofResponse.attestationProof.toJSON(), proofResponse.verificationKey)).toBeTruthy();
    });
});