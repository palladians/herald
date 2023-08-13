#!/usr/bin/env ts-node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { PrivateKey } from 'snarkyjs';
import { Credential } from './credential';
import { isClaimsObject } from './utils';
import fs from 'fs';
import path from 'path';
import { flattenObject } from '@herald-sdk/data-model';

yargs(hideBin(process.argv))
    .command(
        'create',
        'Create a new credential',
        {
            claims: {
                description: 'Claims for the credential',
                alias: 'c',
                type: 'string', // could be a json object
                demandOption: true,
            },
            issuerPrvKey: {
                description: 'Issuer private key',
                alias: 'k',
                type: 'string', // base58 private key
                demandOption: true,
            },
            save: {
                description: 'Path for saving the artefacts',
                alias: 's',
                type: 'string',
                demandOption: true,
            }
        },
        (argv) => {
            const parsedClaims = JSON.parse(argv.claims);
            let claims;
            if (!isClaimsObject(parsedClaims)) {
                claims = flattenObject(parsedClaims)
            } else {
                claims = parsedClaims;
            }
            const issuerPrvKey = PrivateKey.fromBase58(argv.issuerPrvKey);
            const credential = Credential.create(claims, issuerPrvKey);
            
            // save credential to file
            //const claim = credential.claim; // merkle tree, doesn't need to be stored, can be reconstructed from flatCredentials
            const signedClaim = credential.signedClaim.toJSON(); // this is a Struct
            const flatCredentials = credential.credential; // flat dictionary of claims

            // Determine the save directory
            let saveDir: string = (typeof argv.save === "string") ? argv.save : './artifacts';

            // Ensure the directory exists
            if (!fs.existsSync(saveDir)) {
                fs.mkdirSync(saveDir, { recursive: true });
            }

            // Save the data
            fs.writeFileSync(path.join(saveDir, 'signedClaim.json'), JSON.stringify(signedClaim, null, 2));
            fs.writeFileSync(path.join(saveDir, 'flatCredentials.json'), JSON.stringify(flatCredentials, null, 2));
            fs.writeFileSync(path.join(saveDir, 'credential.json'), JSON.stringify(parsedClaims, null, 2));

            console.log(`Data saved in ${saveDir}`);
        }
    )
    .help()
    .alias('help', 'h')
    .argv;
