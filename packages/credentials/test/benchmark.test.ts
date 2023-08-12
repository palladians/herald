import { PrivateKey, verify } from "snarkyjs";
import { ClaimType, Rule } from "@herald-sdk/data-model";
import { Credential } from "../src/credential";
import fs from 'fs';
import { PublicInputArgs, ZkProgramDetails } from "@herald-sdk/provable-programs";

// the relative path to the benchmark data file is as if the test is run from the root of the monorepo
const provingTimeBenchmarkData = JSON.parse(fs.readFileSync('./apps/docs/public/benchmarks/credential-proving.json', 'utf8'));
const verifyingTimeBenchmarkData = JSON.parse(fs.readFileSync('./apps/docs/public/benchmarks/proof-verifying.json', 'utf8'));
const proofSizeBenchmarkData = JSON.parse(fs.readFileSync('./apps/docs/public/benchmarks/proof-size.json', 'utf8'));

describe('Credential Benchmark', () => {
    it('benchmark for proving a claim', async () => {
        const subjectPrvKey = PrivateKey.random();
        const issuerPrvKey = PrivateKey.random();
        const claims: {[key: string]: ClaimType} = {
            age: 21,
            subject: subjectPrvKey.toPublicKey()
        };
        // todo: change to a W3C credential 
        const credential = Credential.create(claims, issuerPrvKey);
        const property = "age";
        const operation = "gte";
        const value = 18;
        const rule = new Rule(property, operation, value);
        // create challenge
        const issuerPubKey = issuerPrvKey.toPublicKey();
        const subjectPubKey = subjectPrvKey.toPublicKey();
        const challenge: PublicInputArgs = {issuerPubKey, subjectPubKey, provingRule: rule};
        // start proving time benchmark
        const startTime = Date.now();
        const proofResponse = await credential.prove("age", challenge, subjectPrvKey, "AttestSingleCredentialProperty");
        const duration = Date.now() - startTime;
        const durationSeconds = duration / 1000;

        const date = new Date();
        const dateString = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;

        provingTimeBenchmarkData.push({name: `${dateString}`, duration: durationSeconds});
        fs.writeFileSync('./apps/docs/public/benchmarks/credential-proving.json', JSON.stringify(provingTimeBenchmarkData));
        // add proof size to benchmark data
        const jsonString = JSON.stringify(proofResponse.toJSON());
        const sizeInBytes = new Blob([jsonString]).size;
        const sizeInKB = sizeInBytes / 1024;
        proofSizeBenchmarkData.push({name: `${dateString}`, size: sizeInKB});
        fs.writeFileSync('./apps/docs/public/benchmarks/proof-size.json', JSON.stringify(proofSizeBenchmarkData));
        // add verification time to benchmark data
        const startTime2 = Date.now();
        await verify(proofResponse.toJSON(), ZkProgramDetails["AttestSingleCredentialProperty"].verificationKey);
        const duration2 = Date.now() - startTime2;
        const durationSeconds2 = duration2 / 1000;
        verifyingTimeBenchmarkData.push({name: `${dateString}`, duration: durationSeconds2});
        fs.writeFileSync('./apps/docs/public/benchmarks/proof-verifying.json', JSON.stringify(verifyingTimeBenchmarkData));
        
        expect(verify(proofResponse.toJSON(), ZkProgramDetails["AttestSingleCredentialProperty"].verificationKey)).toBeTruthy();
    });
});